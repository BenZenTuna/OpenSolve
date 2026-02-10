import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../config/database.js';
import { users, bots } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { generateApiKey, hashApiKey, getApiKeyPrefix } from '../utils/crypto.js';
import { sanitizeMiddleware } from '../middleware/sanitize.middleware.js';

// Validation schemas
const googleCallbackSchema = z.object({
  code: z.string(),
  state: z.string().optional(),
});

const twitterCallbackSchema = z.object({
  code: z.string(),
  state: z.string().optional(),
  code_verifier: z.string().optional(),
});

const registerBotSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  x_handle: z.string().min(1).max(100),
  x_oauth_id: z.string().min(1).max(255),
  avatar_url: z.string().url().max(500).optional(),
});

export async function authRoutes(fastify: FastifyInstance) {
  // Sanitize all inputs
  fastify.addHook('preHandler', sanitizeMiddleware);

  // ===== GOOGLE OAUTH =====

  // Step 1: Redirect to Google
  fastify.get('/auth/google', async (_request, reply) => {
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID || '',
      redirect_uri: process.env.GOOGLE_CALLBACK_URL || '',
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
    });
    return reply.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
  });

  // Step 2: Google callback
  fastify.get('/auth/google/callback', async (request, reply) => {
    const query = request.query as Record<string, string>;
    const { code } = googleCallbackSchema.parse(query);

    try {
      // Exchange code for tokens
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          redirect_uri: process.env.GOOGLE_CALLBACK_URL,
          grant_type: 'authorization_code',
        }),
      });

      const tokens = await tokenRes.json() as { access_token: string; id_token: string };

      // Get user profile
      const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      const profile = await profileRes.json() as {
        id: string;
        email: string;
        name: string;
        picture: string;
      };

      // Upsert user
      const existingUsers = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.oauthProvider, 'google'),
            eq(users.oauthId, profile.id)
          )
        )
        .limit(1);

      let user;
      if (existingUsers.length > 0) {
        user = existingUsers[0];
        await db.update(users)
          .set({
            email: profile.email,
            displayName: profile.name,
            avatarUrl: profile.picture,
            updatedAt: new Date(),
          })
          .where(eq(users.id, user.id));
      } else {
        const [newUser] = await db.insert(users).values({
          email: profile.email,
          displayName: profile.name,
          avatarUrl: profile.picture,
          oauthProvider: 'google',
          oauthId: profile.id,
        }).returning();
        user = newUser;
      }

      // Create JWT
      const token = fastify.jwt.sign({
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
      });

      // Set httpOnly cookie and redirect
      reply.setCookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 3600,
      });

      return reply.redirect(process.env.WEB_URL || 'http://localhost:3000');
    } catch (err) {
      request.log.error(err, 'Google OAuth failed');
      return reply.code(500).send({ error: 'OAuth authentication failed' });
    }
  });

  // ===== TWITTER/X OAUTH =====

  // Step 1: Redirect to Twitter
  fastify.get('/auth/twitter', async (_request, reply) => {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: process.env.TWITTER_CLIENT_ID || '',
      redirect_uri: process.env.TWITTER_CALLBACK_URL || '',
      scope: 'tweet.read users.read offline.access',
      state: 'state',
      code_challenge: 'challenge',
      code_challenge_method: 'plain',
    });
    return reply.redirect(`https://twitter.com/i/oauth2/authorize?${params}`);
  });

  // Step 2: Twitter callback
  fastify.get('/auth/twitter/callback', async (request, reply) => {
    const query = request.query as Record<string, string>;
    const { code } = twitterCallbackSchema.parse(query);

    try {
      const clientId = process.env.TWITTER_CLIENT_ID || '';
      const clientSecret = process.env.TWITTER_CLIENT_SECRET || '';
      const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

      // Exchange code for tokens
      const tokenRes = await fetch('https://api.twitter.com/2/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${basicAuth}`,
        },
        body: new URLSearchParams({
          code,
          grant_type: 'authorization_code',
          redirect_uri: process.env.TWITTER_CALLBACK_URL || '',
          code_verifier: 'challenge',
        }),
      });

      const tokens = await tokenRes.json() as { access_token: string };

      // Get user profile from X
      const profileRes = await fetch('https://api.twitter.com/2/users/me?user.fields=profile_image_url', {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      const profileData = await profileRes.json() as {
        data: { id: string; name: string; username: string; profile_image_url?: string };
      };
      const profile = profileData.data;

      // Upsert user
      const existingUsers = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.oauthProvider, 'twitter'),
            eq(users.oauthId, profile.id)
          )
        )
        .limit(1);

      let user;
      if (existingUsers.length > 0) {
        user = existingUsers[0];
        await db.update(users)
          .set({
            displayName: profile.name,
            avatarUrl: profile.profile_image_url || null,
            updatedAt: new Date(),
          })
          .where(eq(users.id, user.id));
      } else {
        const [newUser] = await db.insert(users).values({
          email: `${profile.username}@x.com`,
          displayName: profile.name,
          avatarUrl: profile.profile_image_url || null,
          oauthProvider: 'twitter',
          oauthId: profile.id,
        }).returning();
        user = newUser;
      }

      // Create JWT
      const token = fastify.jwt.sign({
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
      });

      reply.setCookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 3600,
      });

      return reply.redirect(process.env.WEB_URL || 'http://localhost:3000');
    } catch (err) {
      request.log.error(err, 'Twitter OAuth failed');
      return reply.code(500).send({ error: 'OAuth authentication failed' });
    }
  });

  // ===== SESSION =====

  // Get current user from JWT
  fastify.get('/auth/me', { preHandler: [authMiddleware] }, async (request, reply) => {
    const userId = request.user!.id;

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return reply.code(404).send({ error: 'User not found' });
    }

    return reply.code(200).send({
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      role: user.role,
      createdAt: user.createdAt,
    });
  });

  // Logout
  fastify.post('/auth/logout', async (_request, reply) => {
    reply.clearCookie('token', { path: '/' });
    return reply.code(200).send({ success: true });
  });

  // ===== BOT REGISTRATION =====

  // Register a new bot (requires human auth)
  fastify.post('/bots/register', { preHandler: [authMiddleware] }, async (request, reply) => {
    const userId = request.user!.id;
    const body = registerBotSchema.parse(request.body);

    // Check if X handle is already taken
    const existingBot = await db
      .select()
      .from(bots)
      .where(eq(bots.xHandle, body.x_handle))
      .limit(1);

    if (existingBot.length > 0) {
      return reply.code(409).send({ error: 'X handle already registered to another bot' });
    }

    // Check if X OAuth ID is already taken
    const existingXOauth = await db
      .select()
      .from(bots)
      .where(eq(bots.xOauthId, body.x_oauth_id))
      .limit(1);

    if (existingXOauth.length > 0) {
      return reply.code(409).send({ error: 'X account already registered to another bot' });
    }

    // Generate API key
    const apiKey = generateApiKey();
    const apiKeyHash = await hashApiKey(apiKey);
    const apiKeyPrefix = getApiKeyPrefix(apiKey);

    // Create bot
    const [bot] = await db.insert(bots).values({
      ownerId: userId,
      name: body.name,
      description: body.description || null,
      avatarUrl: body.avatar_url || null,
      xHandle: body.x_handle,
      xOauthId: body.x_oauth_id,
      apiKeyHash,
      apiKeyPrefix,
    }).returning();

    // Return bot info + API key (shown ONCE)
    return reply.code(201).send({
      bot: {
        id: bot.id,
        name: bot.name,
        xHandle: bot.xHandle,
        status: bot.status,
        createdAt: bot.createdAt,
      },
      api_key: apiKey,
      warning: 'Save this API key now. It will not be shown again.',
    });
  });

  // Rotate API key (requires human auth)
  fastify.post('/bots/:botId/rotate-key', { preHandler: [authMiddleware] }, async (request, reply) => {
    const { botId } = request.params as { botId: string };
    const userId = request.user!.id;

    // Verify ownership
    const [bot] = await db
      .select()
      .from(bots)
      .where(and(eq(bots.id, botId), eq(bots.ownerId, userId)))
      .limit(1);

    if (!bot) {
      return reply.code(404).send({ error: 'Bot not found or you are not the owner' });
    }

    // Generate new API key
    const apiKey = generateApiKey();
    const apiKeyHash = await hashApiKey(apiKey);
    const apiKeyPrefix = getApiKeyPrefix(apiKey);

    await db.update(bots)
      .set({ apiKeyHash, apiKeyPrefix, updatedAt: new Date() })
      .where(eq(bots.id, botId));

    return reply.code(200).send({
      api_key: apiKey,
      warning: 'Save this API key now. It will not be shown again. The old key is now invalid.',
    });
  });

  // List user's bots
  fastify.get('/bots/my', { preHandler: [authMiddleware] }, async (request, reply) => {
    const userId = request.user!.id;

    const userBots = await db
      .select({
        id: bots.id,
        name: bots.name,
        description: bots.description,
        xHandle: bots.xHandle,
        status: bots.status,
        totalPoints: bots.totalPoints,
        totalSolutions: bots.totalSolutions,
        totalVotes: bots.totalVotes,
        globalElo: bots.globalElo,
        lastActiveAt: bots.lastActiveAt,
        createdAt: bots.createdAt,
      })
      .from(bots)
      .where(eq(bots.ownerId, userId));

    return reply.code(200).send({ bots: userBots });
  });
}
