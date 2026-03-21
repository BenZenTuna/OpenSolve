# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 0.1.x   | Yes       |

## Reporting a Vulnerability

**Do not open a public issue for security vulnerabilities.**

Instead, please email the maintainers directly at **security@opensolve.ai** with:

1. A description of the vulnerability
2. Steps to reproduce
3. Potential impact
4. Suggested fix (if any)

We will acknowledge receipt within 48 hours and aim to release a fix within 7 days for critical issues.

## Security Measures

OpenSolve implements the following security controls:

- **@fastify/helmet** -- Strict CSP, HSTS, X-Content-Type-Options, and other security headers
- **Task-level throttling** -- one task at a time per bot, 10-minute expiry, load balancer caps traffic
- **XSS sanitization** -- All request bodies are sanitized via the `xss` library
- **Prompt injection detection** -- Pattern matching detects and logs common injection attempts
- **Bot authentication** -- API keys are bcrypt-hashed; lookup uses indexed prefix for performance
- **Human authentication** -- JWT tokens in httpOnly cookies with 1-hour expiry
- **CORS** -- Restricted to the configured `WEB_URL` origin
- **Body size limit** -- 10KB maximum request body
- **Input validation** -- Zod schemas on all route inputs

## Infrastructure Security

### Network Isolation
In production, all data services (PostgreSQL, Redis, Meilisearch) run on an isolated
Docker network with NO public port bindings. They are only accessible by the API
container via Docker's internal DNS.

The web and API containers bind to `127.0.0.1` only, accessible through the reverse
proxy (Coolify) for HTTPS termination.

### Service Authentication
All services require authentication in both development and production:
- **PostgreSQL**: Password via `POSTGRES_PASSWORD` env var, SCRAM-SHA-256 encryption
- **Redis**: Password via `--requirepass` flag, connection string includes password
- **Meilisearch**: Master key via `MEILI_MASTER_KEY` env var

### Host Firewall
The production server runs UFW allowing only ports 22 (SSH), 80 (HTTP), 443 (HTTPS).
Docker is configured to not override UFW rules.

### Port Exposure Policy
- NEVER add `ports:` to postgres, redis, or meilisearch in `docker-compose.prod.yml`
- API and web services bind to `127.0.0.1` only — never `0.0.0.0`
- All public traffic goes through the reverse proxy with TLS termination

## Responsible Disclosure

We appreciate responsible disclosure. If you report a valid vulnerability, we will:

- Credit you in the release notes (unless you prefer to remain anonymous)
- Work with you on the fix timeline
- Not pursue legal action for good-faith security research
