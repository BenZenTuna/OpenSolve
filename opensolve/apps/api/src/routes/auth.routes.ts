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

const RESERVED_BOT_NAMES = ['admin', 'opensolve', 'system', 'moderator', 'official'];

const botProfileSchema = z.object({
  botName: z.string()
    .min(2, 'Bot name must be at least 2 characters')
    .max(50, 'Bot name must be at most 50 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Bot name can only contain letters, numbers, underscores, and hyphens'),
  avatarUrl: z.string().url().max(500).optional(),
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
      botName: user.botName || null,
      botAvatarUrl: user.botAvatarUrl || null,
      hasApiKey: !!user.apiKeyHash,
      createdAt: user.createdAt,
    });
  });

  // Logout
  fastify.post('/auth/logout', async (_request, reply) => {
    reply.clearCookie('token', { path: '/' });
    return reply.code(200).send({ success: true });
  });

  // ===== USER BOT PROFILE & API KEY =====

  // Set or update bot profile (requires human auth)
  fastify.put('/user/bot-profile', { preHandler: [authMiddleware] }, async (request, reply) => {
    const userId = request.user!.id;
    const body = botProfileSchema.parse(request.body);
    const botNameLower = body.botName.toLowerCase();

    // Check reserved names
    if (RESERVED_BOT_NAMES.includes(botNameLower)) {
      return reply.code(400).send({ error: 'This bot name is reserved' });
    }

    // Check if botName is already taken by another user
    const [existingUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.botName, body.botName))
      .limit(1);

    if (existingUser && existingUser.id !== userId) {
      return reply.code(409).send({ error: 'Bot name is already taken' });
    }

    // Check if botName matches any existing user display names
    const [matchingDisplayName] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.displayName, body.botName))
      .limit(1);

    if (matchingDisplayName && matchingDisplayName.id !== userId) {
      return reply.code(409).send({ error: 'This name is already in use' });
    }

    // Get current user to check if botName is changing
    const [currentUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    // Update user record
    await db.update(users)
      .set({
        botName: body.botName,
        botAvatarUrl: body.avatarUrl || null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    // Create or update virtual bot entry
    const [existingBot] = await db
      .select()
      .from(bots)
      .where(eq(bots.ownerId, userId))
      .limit(1);

    if (existingBot) {
      // Update existing virtual bot
      await db.update(bots)
        .set({
          name: body.botName,
          xHandle: body.botName,
          avatarUrl: body.avatarUrl || null,
          updatedAt: new Date(),
        })
        .where(eq(bots.id, existingBot.id));
    } else {
      // Create virtual bot entry
      await db.insert(bots).values({
        ownerId: userId,
        name: body.botName,
        avatarUrl: body.avatarUrl || null,
        xHandle: body.botName,
        xOauthId: `user_${userId}`,
        apiKeyHash: 'virtual_no_direct_auth',
        apiKeyPrefix: 'virtual_',
      });
    }

    return reply.code(200).send({
      botName: body.botName,
      botAvatarUrl: body.avatarUrl || null,
      message: 'Bot profile updated',
    });
  });

  // Generate API key (requires bot name set first)
  fastify.post('/user/api-key', { preHandler: [authMiddleware] }, async (request, reply) => {
    const userId = request.user!.id;

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return reply.code(404).send({ error: 'User not found' });
    }

    if (!user.botName) {
      return reply.code(400).send({ error: 'Set a bot name in Settings before generating an API key' });
    }

    // Generate new key (revokes old one implicitly)
    const apiKey = generateApiKey();
    const hash = await hashApiKey(apiKey);
    const prefix = getApiKeyPrefix(apiKey);

    await db.update(users)
      .set({
        apiKeyHash: hash,
        apiKeyPrefix: prefix,
        apiKeyCreatedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    return reply.code(201).send({
      api_key: apiKey,
      warning: 'Save this API key now. It will not be shown again.',
    });
  });

  // Revoke API key
  fastify.delete('/user/api-key', { preHandler: [authMiddleware] }, async (request, reply) => {
    const userId = request.user!.id;

    await db.update(users)
      .set({
        apiKeyHash: null,
        apiKeyPrefix: null,
        apiKeyCreatedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    return reply.code(200).send({ message: 'API key revoked' });
  });

  // Get API key status
  fastify.get('/user/api-key', { preHandler: [authMiddleware] }, async (request, reply) => {
    const userId = request.user!.id;

    const [user] = await db
      .select({
        botName: users.botName,
        hasApiKey: users.apiKeyHash,
        apiKeyCreatedAt: users.apiKeyCreatedAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return reply.code(404).send({ error: 'User not found' });
    }

    return reply.code(200).send({
      botName: user.botName || null,
      hasApiKey: !!user.hasApiKey,
      apiKeyCreatedAt: user.apiKeyCreatedAt || null,
    });
  });

  // Check bot name availability
  fastify.get('/user/check-bot-name', { preHandler: [authMiddleware] }, async (request, reply) => {
    const userId = request.user!.id;
    const { name } = request.query as { name?: string };

    if (!name || name.length < 2) {
      return reply.code(400).send({ available: false, reason: 'Name must be at least 2 characters' });
    }

    if (RESERVED_BOT_NAMES.includes(name.toLowerCase())) {
      return reply.code(200).send({ available: false, reason: 'This name is reserved' });
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
      return reply.code(200).send({ available: false, reason: 'Only letters, numbers, underscores, and hyphens allowed' });
    }

    const [existingUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.botName, name))
      .limit(1);

    if (existingUser && existingUser.id !== userId) {
      return reply.code(200).send({ available: false, reason: 'Name is already taken' });
    }

    return reply.code(200).send({ available: true });
  });
}
