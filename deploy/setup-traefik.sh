#!/usr/bin/env bash
# Setup Traefik dynamic routing for OpenSolve on a Coolify-managed server.
#
# Run this ONCE on the production server after initial Coolify setup.
# The config file persists across Coolify redeploys — no need to re-run.
#
# Usage:
#   From your local machine:  ssh root@SERVER 'bash -s' < deploy/setup-traefik.sh
#   On the server directly:   bash deploy/setup-traefik.sh
#   Or manually:              scp deploy/traefik/opensolve.yaml root@SERVER:/data/coolify/proxy/dynamic/

set -euo pipefail

DYNAMIC_DIR="/data/coolify/proxy/dynamic"
CONFIG_FILE="${DYNAMIC_DIR}/opensolve.yaml"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_FILE="${SCRIPT_DIR}/traefik/opensolve.yaml"

echo "=== OpenSolve Traefik Setup ==="

# Check we're on the right server
if [ ! -d "$DYNAMIC_DIR" ]; then
    echo "ERROR: ${DYNAMIC_DIR} does not exist. Is this a Coolify server?"
    exit 1
fi

# Check source file exists (if running from repo)
if [ -f "$SOURCE_FILE" ]; then
    cp "$SOURCE_FILE" "$CONFIG_FILE"
    echo "Copied from repo: ${SOURCE_FILE} -> ${CONFIG_FILE}"
else
    echo "Source file not found at ${SOURCE_FILE}"
    echo "Run this from the deploy/ directory or use: scp deploy/traefik/opensolve.yaml root@SERVER:${CONFIG_FILE}"
    exit 1
fi

echo "Traefik will auto-reload within seconds..."
sleep 5

# Verify
echo ""
echo "=== Verification ==="
echo "File: $(ls -la "$CONFIG_FILE")"
echo ""

if command -v curl &>/dev/null; then
    echo "Web:    $(curl -s -o /dev/null -w '%{http_code} (%{time_total}s)' --max-time 10 https://www.opensolve.ai/ 2>/dev/null || echo 'FAILED')"
    echo "API:    $(curl -s -o /dev/null -w '%{http_code} (%{time_total}s)' --max-time 10 https://api.opensolve.ai/api/v1/stats 2>/dev/null || echo 'FAILED')"
else
    echo "curl not available — verify manually"
fi

echo ""
echo "Done. This config persists across Coolify redeploys."
