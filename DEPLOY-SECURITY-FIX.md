# CRITICAL SECURITY FIX — Deployment Guide

**Date:** 2026-02-18
**Issue:** Multiple services publicly exposed on production server (BSI/CERT-Bund report)

## Summary of Changes

- Removed public port bindings for PostgreSQL, Redis, Meilisearch
- Restricted API and Web port bindings to `127.0.0.1`
- Added Redis password authentication
- Added Docker network isolation (`internal` network with `internal: true`)
- Added PostgreSQL SCRAM-SHA-256 password encryption
- Added Meilisearch production mode + healthcheck
- Enforced strong passwords for all services via required environment variables (no defaults)
- Added `redisdata` persistent volume

---

## PART A: Pre-Deployment — Set Environment Variables in Coolify

Before deploying the code changes, set these in Coolify's environment configuration.
The new compose file uses `${VAR:?error}` syntax — deployment will **fail** if any
required variable is missing. This is intentional.

### 1. Generate strong passwords

```bash
# Run these locally and save the output
openssl rand -base64 32   # → POSTGRES_PASSWORD
openssl rand -base64 32   # → REDIS_PASSWORD
openssl rand -base64 32   # → MEILI_MASTER_KEY
openssl rand -base64 32   # → JWT_SECRET (if not already strong)
```

### 2. Set in Coolify environment

| Variable | Value | Notes |
|---|---|---|
| `POSTGRES_PASSWORD` | (generated) | **No default fallback** — compose will refuse to start without it |
| `REDIS_PASSWORD` | (generated) | New — Redis was previously unauthenticated |
| `MEILI_MASTER_KEY` | (generated) | **No default fallback** — was `opensolve_meili_prod_key` |
| `JWT_SECRET` | (generated) | **No default fallback** — was `change_me_in_production` |
| `DATABASE_URL` | `postgresql://opensolve:YOUR_PG_PASSWORD@os-postgres:5432/opensolve` | Password must match `POSTGRES_PASSWORD` |
| `DATABASE_URL_DIRECT` | (same as `DATABASE_URL`) | Used for migrations |
| `REDIS_URL` | `redis://:YOUR_REDIS_PASSWORD@os-redis:6379` | Password must match `REDIS_PASSWORD` |
| `WEB_URL` | `https://www.opensolve.ai` | |
| `GOOGLE_CALLBACK_URL` | `https://www.opensolve.ai/api/auth/callback/google` | |
| `TWITTER_CALLBACK_URL` | `https://www.opensolve.ai/api/auth/callback/twitter` | |

### 3. Double-check existing secrets

- [ ] `JWT_SECRET` is NOT `change_me_in_production`
- [ ] `POSTGRES_PASSWORD` is NOT `opensolve_prod`
- [ ] `MEILI_MASTER_KEY` is NOT `opensolve_meili_prod_key`
- [ ] OAuth client IDs/secrets are set if OAuth is enabled

---

## PART B: Deploy Code Changes

4. [ ] Commit and push the updated files to `main` branch
5. [ ] Trigger redeploy in Coolify (or wait for auto-deploy)
6. [ ] Monitor Coolify deployment logs for errors
7. [ ] Watch container logs:
   ```bash
   docker compose -f docker-compose.prod.yml logs -f api
   docker compose -f docker-compose.prod.yml logs -f redis
   docker compose -f docker-compose.prod.yml logs -f postgres
   ```

---

## PART C: Post-Deployment Verification

### Verify services are NOT externally accessible

8. [ ] From your **LOCAL machine** (not the server), run:

```bash
# Redis — should timeout or refuse
redis-cli -h 46.225.66.133 -p 6379 ping

# PostgreSQL — should timeout or refuse
psql -h 46.225.66.133 -p 5432 -U opensolve -d opensolve -c "SELECT 1"

# Meilisearch — should timeout or refuse
curl -m 5 http://46.225.66.133:7700/health

# API direct — should timeout or refuse
curl -m 5 http://46.225.66.133:4000/api/v1/stats

# Web direct — should timeout or refuse
curl -m 5 http://46.225.66.133:3000

# Full nmap scan — only 22, 80, 443 should be open
nmap -Pn 46.225.66.133
```

### Verify the application still works

9. [ ] Website loads: `https://www.opensolve.ai`
10. [ ] API responds: `https://www.opensolve.ai/api/v1/stats`
11. [ ] Login works: Try Google OAuth flow
12. [ ] SSE works: Check live activity feed on homepage
13. [ ] Bot API works:
    ```bash
    curl -H "Authorization: Bearer os_key_..." https://www.opensolve.ai/api/v1/bot/me
    ```

---

## PART D: Server-Level Hardening (SSH into server)

These steps must be done **manually via SSH**. They are NOT handled by the code changes.

### D1. Configure UFW firewall

```bash
# Check current status
sudo ufw status

# Set defaults
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow only essential ports
sudo ufw allow 22/tcp comment 'SSH'
sudo ufw allow 80/tcp comment 'HTTP - Coolify reverse proxy'
sudo ufw allow 443/tcp comment 'HTTPS - Coolify reverse proxy'

# Enable (will prompt for confirmation)
sudo ufw enable

# Verify
sudo ufw status verbose
```

### D2. Prevent Docker from bypassing UFW

Docker manipulates iptables directly, which can bypass UFW. Add DOCKER-USER chain
rules to block external access to service ports:

```bash
# Block external access to database/service ports
sudo iptables -I DOCKER-USER -i eth0 -p tcp --dport 5432 -j DROP
sudo iptables -I DOCKER-USER -i eth0 -p tcp --dport 6379 -j DROP
sudo iptables -I DOCKER-USER -i eth0 -p tcp --dport 7700 -j DROP
sudo iptables -I DOCKER-USER -i eth0 -p tcp --dport 3000 -j DROP
sudo iptables -I DOCKER-USER -i eth0 -p tcp --dport 4000 -j DROP

# Make persistent across reboots
sudo apt install -y iptables-persistent
sudo netfilter-persistent save
```

> **Why not `"iptables": false` in daemon.json?**
> Setting `"iptables": false` disables ALL Docker networking magic, which can break
> container-to-container communication and Coolify's proxy. The DOCKER-USER chain
> approach is safer — it specifically blocks external access while letting Docker
> manage internal networking normally.

### D3. Flush Redis data (may have been tampered with)

```bash
# Redis only stores caches and rate limit counters — safe to flush
docker compose -f docker-compose.prod.yml exec redis redis-cli -a "$REDIS_PASSWORD" FLUSHALL
```

### D4. Check PostgreSQL for unauthorized access

```bash
# Check for suspicious connections
docker compose -f docker-compose.prod.yml exec postgres \
  psql -U opensolve -d opensolve -c "SELECT * FROM pg_stat_activity;"

# Check for unauthorized roles
docker compose -f docker-compose.prod.yml exec postgres \
  psql -U opensolve -d opensolve -c "SELECT rolname, rolsuper, rolcreaterole FROM pg_roles;"

# Check recent activity
docker compose -f docker-compose.prod.yml exec postgres \
  psql -U opensolve -d opensolve -c "SELECT * FROM activity_log ORDER BY created_at DESC LIMIT 20;"

# Verify user count looks normal
docker compose -f docker-compose.prod.yml exec postgres \
  psql -U opensolve -d opensolve -c "SELECT COUNT(*) FROM users;"
```

### D5. Change PostgreSQL password (if it was weak/default)

If the production password was `opensolve_prod` or another weak default, it should
be considered **compromised** since port 5432 was publicly exposed:

```bash
# Change password inside PostgreSQL
docker compose -f docker-compose.prod.yml exec postgres \
  psql -U opensolve -d opensolve -c "ALTER USER opensolve WITH PASSWORD 'NEW_STRONG_PASSWORD';"

# Then update POSTGRES_PASSWORD and DATABASE_URL in Coolify env vars
# Then redeploy
```

### D6. Final nmap verification

```bash
# From your local machine
nmap -Pn 46.225.66.133

# Expected output — ONLY these three ports:
# 22/tcp   open  ssh
# 80/tcp   open  http
# 443/tcp  open  https
```

---

## Rollback Plan

If the deployment breaks the application:

1. **If containers won't start** (missing env vars): Set the required variables in
   Coolify and redeploy. The `${VAR:?error}` syntax tells you exactly which variable
   is missing in the error message.

2. **If Redis auth fails** (NOAUTH error in API logs): Verify `REDIS_PASSWORD` matches
   between the Redis `command:` and the `REDIS_URL` connection string in the API service.

3. **If PostgreSQL auth fails**: Verify `POSTGRES_PASSWORD` matches between the
   postgres service and the `DATABASE_URL` in the API service.

4. **If web can't reach API** (SSR errors, blank pages): The `internal` Docker network
   may not be resolving. Verify both `api` and `web` are on the `internal` network.
   Check `docker network inspect` output.

5. **Nuclear option**: Revert the commit and redeploy the previous version. The old
   compose file with open ports will work immediately (but remains vulnerable).
