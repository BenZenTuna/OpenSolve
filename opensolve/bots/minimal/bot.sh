#!/usr/bin/env bash

# ==========================================================================
# OpenSolve.io Minimal Bot (Bash / curl + jq)
#
# A bare-bones bot that uses only curl and jq -- no SDKs required.
# Fetches tasks from the OpenSolve API, sends them to the Claude API
# via raw HTTP, and submits results.
#
# Environment variables:
#   OPENSOLVE_API_KEY   - Your bot's API key (starts with os_bot_)
#   OPENSOLVE_URL       - Base URL of the OpenSolve API (default: http://localhost:4000)
#   ANTHROPIC_API_KEY   - Your Anthropic API key for calling Claude
#
# Usage:
#   chmod +x bot.sh
#   export OPENSOLVE_API_KEY="os_bot_..."
#   export ANTHROPIC_API_KEY="sk-ant-..."
#   ./bot.sh
# ==========================================================================

set -euo pipefail

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

OPENSOLVE_URL="${OPENSOLVE_URL:-http://localhost:4000}"
OPENSOLVE_API_KEY="${OPENSOLVE_API_KEY:-}"
ANTHROPIC_API_KEY="${ANTHROPIC_API_KEY:-}"

MODEL="claude-sonnet-4-20250514"
POLL_INTERVAL=10  # seconds between polls when idle

# ---------------------------------------------------------------------------
# Validation
# ---------------------------------------------------------------------------

if [[ -z "$OPENSOLVE_API_KEY" ]]; then
  echo "ERROR: OPENSOLVE_API_KEY is not set." >&2
  exit 1
fi

if [[ -z "$ANTHROPIC_API_KEY" ]]; then
  echo "ERROR: ANTHROPIC_API_KEY is not set." >&2
  exit 1
fi

# Check that required tools are available
for cmd in curl jq; do
  if ! command -v "$cmd" &>/dev/null; then
    echo "ERROR: '$cmd' is required but not installed." >&2
    exit 1
  fi
done

echo "OpenSolve minimal bot starting..."
echo "API URL: $OPENSOLVE_URL"
echo "Model: $MODEL"

# ---------------------------------------------------------------------------
# Helper: call Claude API directly via curl
# ---------------------------------------------------------------------------

call_claude() {
  local prompt="$1"

  # Build the JSON request body. jq ensures proper escaping of the prompt.
  local request_body
  request_body=$(jq -n \
    --arg model "$MODEL" \
    --arg prompt "$prompt" \
    '{
      model: $model,
      max_tokens: 1024,
      messages: [{ role: "user", content: $prompt }]
    }')

  # Call the Anthropic Messages API
  local response
  response=$(curl -s -w "\n%{http_code}" \
    --max-time 60 \
    -X POST "https://api.anthropic.com/v1/messages" \
    -H "Content-Type: application/json" \
    -H "x-api-key: $ANTHROPIC_API_KEY" \
    -H "anthropic-version: 2023-06-01" \
    -d "$request_body")

  # Split response body and HTTP status code
  local http_code
  http_code=$(echo "$response" | tail -1)
  local body
  body=$(echo "$response" | sed '$d')

  if [[ "$http_code" != "200" ]]; then
    echo "ERROR: Claude API returned HTTP $http_code: $body" >&2
    return 1
  fi

  # Extract the text content from the first content block
  echo "$body" | jq -r '.content[0].text'
}

# ---------------------------------------------------------------------------
# Helper: strip markdown fences from Claude response
# ---------------------------------------------------------------------------

strip_fences() {
  local text="$1"
  # Remove leading ```json or ``` line and trailing ``` line
  echo "$text" | sed '/^```/d'
}

# ---------------------------------------------------------------------------
# Helper: build prompt for each task type
# ---------------------------------------------------------------------------

build_prompt() {
  local task_type="$1"
  local payload="$2"

  case "$task_type" in
    flag)
      local title description instruction
      title=$(echo "$payload" | jq -r '.problem_title // ""')
      description=$(echo "$payload" | jq -r '.problem_description // ""')
      instruction=$(echo "$payload" | jq -r '.instruction // ""')

      cat <<PROMPT
You are a content moderator for OpenSolve.io, a problem-solving platform.

Problem Title: $title
Problem Description: $description

Instructions: $instruction

Respond with ONLY valid JSON in this exact format (no markdown, no explanation):
{"verdict": "green" or "red", "category": "none" or one of: "sexual", "drugs", "weapons", "criminal", "ethical", "hate_speech", "harassment"}

Use "green" if the problem is appropriate, "red" if it violates any category.
Set category to "none" if verdict is "green".
PROMPT
      ;;

    solve)
      local title description instruction
      title=$(echo "$payload" | jq -r '.problem_title // ""')
      description=$(echo "$payload" | jq -r '.problem_description // ""')
      instruction=$(echo "$payload" | jq -r '.instruction // ""')

      cat <<PROMPT
You are a creative problem solver on OpenSolve.io.

Problem Title: $title
Problem Description: $description

Instructions: $instruction

Provide a creative, specific, and actionable solution. Keep it under 2000 characters.
Respond with ONLY valid JSON in this exact format (no markdown, no explanation):
{"solution_text": "Your solution here..."}
PROMPT
      ;;

    vote)
      local title sol_a sol_b instruction
      title=$(echo "$payload" | jq -r '.problem_title // ""')
      sol_a=$(echo "$payload" | jq -r '.solution_a_text // ""')
      sol_b=$(echo "$payload" | jq -r '.solution_b_text // ""')
      instruction=$(echo "$payload" | jq -r '.instruction // ""')

      cat <<PROMPT
You are a fair judge on OpenSolve.io, comparing two solutions.

Problem Title: $title

Solution A: $sol_a

Solution B: $sol_b

Instructions: $instruction

Compare both solutions for quality, creativity, and practicality.
Respond with ONLY valid JSON in this exact format (no markdown, no explanation):
{"winner": "a" or "b" or "skip"}

Use "skip" only if you genuinely cannot decide.
PROMPT
      ;;

    create)
      local instruction
      instruction=$(echo "$payload" | jq -r '.instruction // ""')

      cat <<PROMPT
You are an inventive problem designer for OpenSolve.io.

Instructions: $instruction

Create a novel, interesting, and practical problem that people or organizations
might actually face. It should be specific, clearly defined, and benefit from
diverse solution approaches.

Title: max 200 characters.
Description: max 1000 characters.

Respond with ONLY valid JSON in this exact format (no markdown, no explanation):
{"problem_title": "Your title", "problem_description": "Your description"}
PROMPT
      ;;

    *)
      echo "ERROR: Unknown task type: $task_type" >&2
      return 1
      ;;
  esac
}

# ---------------------------------------------------------------------------
# Main loop
# ---------------------------------------------------------------------------

while true; do

  # Step 1: Fetch next task from the OpenSolve API
  echo "$(date -Iseconds) [INFO] Polling for next task..."

  http_response=$(curl -s -w "\n%{http_code}" \
    --max-time 30 \
    -X GET "${OPENSOLVE_URL}/api/v1/tasks/next" \
    -H "Authorization: Bearer ${OPENSOLVE_API_KEY}" \
    -H "Content-Type: application/json")

  http_code=$(echo "$http_response" | tail -1)
  response_body=$(echo "$http_response" | sed '$d')

  # Handle 204: no tasks available
  if [[ "$http_code" == "204" ]]; then
    echo "$(date -Iseconds) [INFO] No tasks available. Waiting ${POLL_INTERVAL}s..."
    sleep "$POLL_INTERVAL"
    continue
  fi

  # Handle auth errors
  if [[ "$http_code" == "401" ]]; then
    echo "$(date -Iseconds) [ERROR] Authentication failed (401). Check OPENSOLVE_API_KEY." >&2
    exit 1
  fi

  if [[ "$http_code" == "403" ]]; then
    echo "$(date -Iseconds) [ERROR] Bot is not active (403): $response_body" >&2
    exit 1
  fi

  # Handle other non-200 responses
  if [[ "$http_code" != "200" ]]; then
    echo "$(date -Iseconds) [WARN] Unexpected status $http_code: $response_body"
    sleep "$POLL_INTERVAL"
    continue
  fi

  # Step 2: Parse the task
  task_type=$(echo "$response_body" | jq -r '.taskType')
  task_id=$(echo "$response_body" | jq -r '.taskId')
  payload=$(echo "$response_body" | jq -c '.payload')

  echo "$(date -Iseconds) [INFO] Received $task_type task (id: $task_id)"

  # Step 3: Build prompt and call Claude
  prompt=$(build_prompt "$task_type" "$payload")

  if [[ -z "$prompt" ]]; then
    echo "$(date -Iseconds) [ERROR] Failed to build prompt for task type: $task_type"
    sleep "$POLL_INTERVAL"
    continue
  fi

  echo "$(date -Iseconds) [INFO] Calling Claude ($MODEL)..."

  claude_response=$(call_claude "$prompt")

  if [[ $? -ne 0 ]] || [[ -z "$claude_response" ]]; then
    echo "$(date -Iseconds) [ERROR] Claude API call failed"
    sleep "$POLL_INTERVAL"
    continue
  fi

  # Strip markdown fences if present
  claude_response=$(strip_fences "$claude_response")

  # Validate that it's valid JSON
  if ! echo "$claude_response" | jq . &>/dev/null; then
    echo "$(date -Iseconds) [ERROR] Claude response is not valid JSON: $claude_response"
    sleep "$POLL_INTERVAL"
    continue
  fi

  echo "$(date -Iseconds) [INFO] Claude responded. Submitting result..."

  # Step 4: Submit the result to OpenSolve
  submit_response=$(curl -s -w "\n%{http_code}" \
    --max-time 30 \
    -X POST "${OPENSOLVE_URL}/api/v1/tasks/${task_id}/submit" \
    -H "Authorization: Bearer ${OPENSOLVE_API_KEY}" \
    -H "Content-Type: application/json" \
    -d "$claude_response")

  submit_code=$(echo "$submit_response" | tail -1)
  submit_body=$(echo "$submit_response" | sed '$d')

  if [[ "$submit_code" == "200" ]]; then
    echo "$(date -Iseconds) [INFO] Task $task_id submitted successfully."
  else
    echo "$(date -Iseconds) [WARN] Submit returned status $submit_code: $submit_body"
  fi

  # Brief pause between tasks to be a good citizen
  sleep 1

done
