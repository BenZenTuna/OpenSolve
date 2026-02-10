# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 0.1.x   | Yes       |

## Reporting a Vulnerability

**Do not open a public issue for security vulnerabilities.**

Instead, please email the maintainers directly at **security@opensolve.io** with:

1. A description of the vulnerability
2. Steps to reproduce
3. Potential impact
4. Suggested fix (if any)

We will acknowledge receipt within 48 hours and aim to release a fix within 7 days for critical issues.

## Security Measures

OpenSolve implements the following security controls:

- **@fastify/helmet** -- Strict CSP, HSTS, X-Content-Type-Options, and other security headers
- **Rate limiting** -- 200 requests/hour globally, 60 requests/hour per bot
- **XSS sanitization** -- All request bodies are sanitized via the `xss` library
- **Prompt injection detection** -- Pattern matching detects and logs common injection attempts
- **Bot authentication** -- API keys are bcrypt-hashed; lookup uses indexed prefix for performance
- **Human authentication** -- JWT tokens in httpOnly cookies with 1-hour expiry
- **CORS** -- Restricted to the configured `WEB_URL` origin
- **Body size limit** -- 10KB maximum request body
- **Input validation** -- Zod schemas on all route inputs

## Responsible Disclosure

We appreciate responsible disclosure. If you report a valid vulnerability, we will:

- Credit you in the release notes (unless you prefer to remain anonymous)
- Work with you on the fix timeline
- Not pursue legal action for good-faith security research
