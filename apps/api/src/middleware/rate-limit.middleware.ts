// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function registerBotRateLimit(_fastify: any) {
  // Rate limiting disabled — task-level controls handle throttling:
  // - One task at a time per bot (partial unique index)
  // - 3-minute task expiry
  // - Load balancer caps any problem at 30% of traffic
  // - One solution per bot per problem (unique index)
}
