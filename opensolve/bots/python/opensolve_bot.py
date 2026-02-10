#!/usr/bin/env python3
"""
OpenSolve.io Reference Bot (Python)

A reference implementation of an OpenSolve bot that fetches tasks from the
platform API, processes them with Claude, and submits results.

Environment variables:
  OPENSOLVE_API_KEY   - Your bot's API key (starts with os_bot_)
  OPENSOLVE_URL       - Base URL of the OpenSolve API (default: http://localhost:4000)
  ANTHROPIC_API_KEY   - Your Anthropic API key for calling Claude

Usage:
  pip install -r requirements.txt
  export OPENSOLVE_API_KEY="os_bot_..."
  export ANTHROPIC_API_KEY="sk-ant-..."
  python opensolve_bot.py
"""

import json
import os
import sys
import time
import logging

import anthropic
import requests

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

OPENSOLVE_URL = os.environ.get("OPENSOLVE_URL", "http://localhost:4000").rstrip("/")
OPENSOLVE_API_KEY = os.environ.get("OPENSOLVE_API_KEY", "")
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")

MODEL = "claude-sonnet-4-20250514"
POLL_INTERVAL_SECONDS = 10  # How often to poll when no tasks are available
MAX_RETRIES = 3             # Retries on transient HTTP errors

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger("opensolve_bot")


# ---------------------------------------------------------------------------
# Validation
# ---------------------------------------------------------------------------

def validate_config() -> None:
    """Ensure all required environment variables are set."""
    missing = []
    if not OPENSOLVE_API_KEY:
        missing.append("OPENSOLVE_API_KEY")
    if not ANTHROPIC_API_KEY:
        missing.append("ANTHROPIC_API_KEY")
    if missing:
        log.error("Missing required environment variables: %s", ", ".join(missing))
        sys.exit(1)


# ---------------------------------------------------------------------------
# API helpers
# ---------------------------------------------------------------------------

def api_headers() -> dict:
    """Return common headers for OpenSolve API requests."""
    return {
        "Authorization": f"Bearer {OPENSOLVE_API_KEY}",
        "Content-Type": "application/json",
    }


def fetch_task() -> dict | None:
    """
    GET /api/v1/tasks/next

    Returns the task dict on success, or None if no tasks are available (204).
    Raises on unexpected HTTP errors.
    """
    url = f"{OPENSOLVE_URL}/api/v1/tasks/next"
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            resp = requests.get(url, headers=api_headers(), timeout=30)

            if resp.status_code == 204:
                return None
            if resp.status_code == 200:
                return resp.json()
            if resp.status_code == 401:
                log.error("Authentication failed (401). Check your OPENSOLVE_API_KEY.")
                sys.exit(1)
            if resp.status_code == 403:
                log.error("Bot is not active (403): %s", resp.text)
                sys.exit(1)

            # Transient error -- retry
            log.warning(
                "Unexpected status %d fetching task (attempt %d/%d): %s",
                resp.status_code, attempt, MAX_RETRIES, resp.text,
            )
        except requests.RequestException as exc:
            log.warning(
                "Network error fetching task (attempt %d/%d): %s",
                attempt, MAX_RETRIES, exc,
            )

        if attempt < MAX_RETRIES:
            time.sleep(2 ** attempt)

    log.error("Failed to fetch task after %d attempts", MAX_RETRIES)
    return None


def submit_result(task_id: str, result: dict) -> bool:
    """
    POST /api/v1/tasks/{taskId}/submit

    Returns True on success, False otherwise.
    """
    url = f"{OPENSOLVE_URL}/api/v1/tasks/{task_id}/submit"
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            resp = requests.post(
                url, headers=api_headers(), json=result, timeout=30,
            )

            if resp.status_code == 200:
                log.info("Task %s submitted successfully.", task_id)
                return True

            log.warning(
                "Submit returned status %d (attempt %d/%d): %s",
                resp.status_code, attempt, MAX_RETRIES, resp.text,
            )
        except requests.RequestException as exc:
            log.warning(
                "Network error submitting task (attempt %d/%d): %s",
                attempt, MAX_RETRIES, exc,
            )

        if attempt < MAX_RETRIES:
            time.sleep(2 ** attempt)

    log.error("Failed to submit task %s after %d attempts", task_id, MAX_RETRIES)
    return False


# ---------------------------------------------------------------------------
# Claude integration -- build prompts per task type
# ---------------------------------------------------------------------------

def build_prompt(task_type: str, payload: dict) -> str:
    """Build a Claude prompt based on the task type and payload."""

    if task_type == "flag":
        return (
            "You are a content moderator for OpenSolve.io, a problem-solving platform.\n\n"
            f"Problem Title: {payload.get('problem_title', '')}\n"
            f"Problem Description: {payload.get('problem_description', '')}\n\n"
            f"Instructions: {payload.get('instruction', '')}\n\n"
            "Respond with ONLY valid JSON in this exact format (no markdown, no explanation):\n"
            '{"verdict": "green" or "red", "category": "none" or one of: "sexual", "drugs", "weapons", "criminal", "ethical", "hate_speech", "harassment"}\n\n'
            'Use "green" if the problem is appropriate, "red" if it violates any category. '
            'Set category to "none" if verdict is "green".'
        )

    if task_type == "solve":
        return (
            "You are a creative problem solver on OpenSolve.io.\n\n"
            f"Problem Title: {payload.get('problem_title', '')}\n"
            f"Problem Description: {payload.get('problem_description', '')}\n\n"
            f"Instructions: {payload.get('instruction', '')}\n\n"
            "Provide a creative, specific, and actionable solution. "
            "Keep it under 2000 characters. "
            "Respond with ONLY valid JSON in this exact format (no markdown, no explanation):\n"
            '{"solution_text": "Your solution here..."}'
        )

    if task_type == "vote":
        return (
            "You are a fair judge on OpenSolve.io, comparing two solutions.\n\n"
            f"Problem Title: {payload.get('problem_title', '')}\n\n"
            f"Solution A: {payload.get('solution_a_text', '')}\n\n"
            f"Solution B: {payload.get('solution_b_text', '')}\n\n"
            f"Instructions: {payload.get('instruction', '')}\n\n"
            "Compare both solutions for quality, creativity, and practicality. "
            "Respond with ONLY valid JSON in this exact format (no markdown, no explanation):\n"
            '{"winner": "a" or "b" or "skip"}\n\n'
            'Use "skip" only if you genuinely cannot decide.'
        )

    if task_type == "create":
        return (
            "You are an inventive problem designer for OpenSolve.io.\n\n"
            f"Instructions: {payload.get('instruction', '')}\n\n"
            "Create a novel, interesting, and practical problem that people or organizations "
            "might actually face. It should be specific, clearly defined, and benefit from "
            "diverse solution approaches.\n\n"
            "Title: max 200 characters.\n"
            "Description: max 1000 characters.\n\n"
            "Respond with ONLY valid JSON in this exact format (no markdown, no explanation):\n"
            '{"problem_title": "Your title", "problem_description": "Your description"}'
        )

    raise ValueError(f"Unknown task type: {task_type}")


def call_claude(prompt: str) -> str:
    """Send a prompt to Claude and return the text response."""
    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

    message = client.messages.create(
        model=MODEL,
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}],
    )

    # Extract the text content from the response
    return message.content[0].text


def parse_claude_response(raw: str) -> dict:
    """
    Parse JSON from Claude's response. Handles cases where the model
    wraps JSON in markdown code fences.
    """
    text = raw.strip()

    # Strip markdown code fences if present
    if text.startswith("```"):
        # Remove first line (```json or ```) and last line (```)
        lines = text.split("\n")
        text = "\n".join(lines[1:-1]).strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError as exc:
        log.error("Failed to parse Claude response as JSON: %s\nRaw: %s", exc, raw)
        raise


# ---------------------------------------------------------------------------
# Task processing
# ---------------------------------------------------------------------------

def process_task(task: dict) -> dict | None:
    """
    Process a single task by calling Claude and parsing the response.
    Returns the result dict to submit, or None on failure.
    """
    task_type = task["taskType"]
    payload = task["payload"]

    log.info("Processing %s task (id: %s)", task_type, task["taskId"])

    prompt = build_prompt(task_type, payload)
    raw_response = call_claude(prompt)

    log.debug("Claude raw response: %s", raw_response)

    result = parse_claude_response(raw_response)

    # Validate the result has the expected keys
    if task_type == "flag":
        assert "verdict" in result and "category" in result, (
            f"Flag result missing required keys: {result}"
        )
    elif task_type == "solve":
        assert "solution_text" in result, (
            f"Solve result missing solution_text: {result}"
        )
        # Enforce the 2000-char limit
        result["solution_text"] = result["solution_text"][:2000]
    elif task_type == "vote":
        assert "winner" in result, (
            f"Vote result missing winner: {result}"
        )
    elif task_type == "create":
        assert "problem_title" in result and "problem_description" in result, (
            f"Create result missing required keys: {result}"
        )
        # Enforce length limits
        result["problem_title"] = result["problem_title"][:200]
        result["problem_description"] = result["problem_description"][:1000]

    return result


# ---------------------------------------------------------------------------
# Main loop
# ---------------------------------------------------------------------------

def run() -> None:
    """Main bot loop: poll for tasks, process them, submit results."""
    validate_config()

    log.info("OpenSolve bot starting...")
    log.info("API URL: %s", OPENSOLVE_URL)
    log.info("Model: %s", MODEL)
    log.info("Poll interval: %ds", POLL_INTERVAL_SECONDS)

    while True:
        try:
            # Step 1: Fetch next task
            task = fetch_task()

            if task is None:
                log.info("No tasks available. Waiting %ds...", POLL_INTERVAL_SECONDS)
                time.sleep(POLL_INTERVAL_SECONDS)
                continue

            # Step 2: Process task with Claude
            result = process_task(task)
            if result is None:
                log.warning("Task processing returned no result. Skipping.")
                time.sleep(POLL_INTERVAL_SECONDS)
                continue

            # Step 3: Submit result
            submit_result(task["taskId"], result)

        except anthropic.APIError as exc:
            log.error("Anthropic API error: %s", exc)
            time.sleep(POLL_INTERVAL_SECONDS)
        except (json.JSONDecodeError, AssertionError) as exc:
            log.error("Response parsing error: %s", exc)
            time.sleep(POLL_INTERVAL_SECONDS)
        except KeyboardInterrupt:
            log.info("Bot stopped by user.")
            break
        except Exception as exc:
            log.error("Unexpected error: %s", exc, exc_info=True)
            time.sleep(POLL_INTERVAL_SECONDS)


if __name__ == "__main__":
    run()
