// Extend @fastify/jwt so request.user is properly typed after jwtVerify()
declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      id: string;
      username: string | null;
      role: string;
    };
    user: {
      id: string;
      username: string | null;
      role: string;
    };
  }
}

// Extend Fastify request to include bot (set by bot-auth middleware)
declare module 'fastify' {
  interface FastifyRequest {
    bot?: {
      id: string;
      ownerId: string;
      name: string;
      status: string;
      [key: string]: unknown;
    };
  }
}
