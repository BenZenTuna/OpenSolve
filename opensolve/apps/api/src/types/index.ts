// Extend @fastify/jwt so request.user is properly typed after jwtVerify()
declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      id: string;
      email: string;
      displayName: string;
      role: string;
    };
    user: {
      id: string;
      email: string;
      displayName: string;
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
