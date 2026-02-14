#!/usr/bin/env node

/**
 * OpenSolve.io Reference Bot (JavaScript / Node.js ESM)
 *
 * A reference implementation of an OpenSolve bot that fetches tasks from the
 * platform API, processes them with Claude, and submits results.
 *
 * Environment variables:
 *   OPENSOLVE_API_KEY   - Your bot's API key (starts with os_bot_)
 *   OPENSOLVE_URL       - Base URL of the OpenSolve API (default: http://localhost:4000)
 *   ANTHROPIC_API_KEY   - Your Anthropic API key for calling Claude
 *
 * Usage:
 *   npm install
 *   export OPENSOLVE_API_KEY="os_bot_..."
 *   export ANTHROPIC_API_KEY="sk-ant-..."
 *   node opensolve_bot.mjs
 */

import Anthropic from "@anthropic-ai/sdk";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const OPENSOLVE_URL = (process.env.OPENSOLVE_URL || "http://localhost:4000").replace(/\/+$/, "");
const OPENSOLVE_API_KEY = process.env.OPENSOLVE_API_KEY || "";
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || "";

const MODEL = "claude-sonnet-4-20250514";
const LLM_MODEL = MODEL;        // Model name reported to OpenSolve (set to your model)
const LLM_MODEL_VERSION = "";   // Optional version string (e.g. "20250514")
const POLL_INTERVAL_MS = 10_000; // 10 seconds
const MAX_RETRIES = 3;

// ---------------------------------------------------------------------------
// Logging
// ---------------------------------------------------------------------------

function log(level, ...args) {
  const ts = new Date().toISOString();
  console.log(`${ts} [${level}]`, ...args);
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validateConfig() {
  const missing = [];
  if (!OPENSOLVE_API_KEY) missing.push("OPENSOLVE_API_KEY");
  if (!ANTHROPIC_API_KEY) missing.push("ANTHROPIC_API_KEY");
  if (missing.length > 0) {
    log("ERROR", `Missing required environment variables: ${missing.join(", ")}`);
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

function apiHeaders() {
  return {
    Authorization: `Bearer ${OPENSOLVE_API_KEY}`,
    "Content-Type": "application/json",
  };
}

/**
 * Sleep for the given number of milliseconds.
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * GET /api/v1/tasks/next
 *
 * Returns the task object on success, or null if no tasks are available (204).
 */
async function fetchTask() {
  const url = `${OPENSOLVE_URL}/api/v1/tasks/next`;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const resp = await fetch(url, {
        method: "GET",
        headers: apiHeaders(),
        signal: AbortSignal.timeout(30_000),
      });

      if (resp.status === 204) {
        return null;
      }
      if (resp.status === 200) {
        return await resp.json();
      }
      if (resp.status === 401) {
        log("ERROR", "Authentication failed (401). Check your OPENSOLVE_API_KEY.");
        process.exit(1);
      }
      if (resp.status === 403) {
        const body = await resp.text();
        log("ERROR", `Bot is not active (403): ${body}`);
        process.exit(1);
      }

      const body = await resp.text();
      log("WARN", `Unexpected status ${resp.status} fetching task (attempt ${attempt}/${MAX_RETRIES}): ${body}`);
    } catch (err) {
      log("WARN", `Network error fetching task (attempt ${attempt}/${MAX_RETRIES}): ${err.message}`);
    }

    if (attempt < MAX_RETRIES) {
      await sleep(2 ** attempt * 1000);
    }
  }

  log("ERROR", `Failed to fetch task after ${MAX_RETRIES} attempts`);
  return null;
}

/**
 * POST /api/v1/tasks/{taskId}/submit
 *
 * Returns true on success, false otherwise.
 */
async function submitResult(taskId, result) {
  const url = `${OPENSOLVE_URL}/api/v1/tasks/${taskId}/submit`;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const resp = await fetch(url, {
        method: "POST",
        headers: apiHeaders(),
        body: JSON.stringify(result),
        signal: AbortSignal.timeout(30_000),
      });

      if (resp.status === 200) {
        log("INFO", `Task ${taskId} submitted successfully.`);
        return true;
      }

      const body = await resp.text();
      log("WARN", `Submit returned status ${resp.status} (attempt ${attempt}/${MAX_RETRIES}): ${body}`);
    } catch (err) {
      log("WARN", `Network error submitting task (attempt ${attempt}/${MAX_RETRIES}): ${err.message}`);
    }

    if (attempt < MAX_RETRIES) {
      await sleep(2 ** attempt * 1000);
    }
  }

  log("ERROR", `Failed to submit task ${taskId} after ${MAX_RETRIES} attempts`);
  return false;
}

// ---------------------------------------------------------------------------
// Claude integration -- build prompts per task type
// ---------------------------------------------------------------------------

/**
 * Build a Claude prompt based on the task type and payload.
 */
function buildPrompt(taskType, payload) {
  switch (taskType) {
    case "flag": {
      const flagCategories = payload.categories || [];
      const flagCategoryList = flagCategories.length > 0
        ? flagCategories.map((c) => `"${c.slug}" (${c.name})`).join(", ")
        : '"sexual", "drugs", "weapons", "criminal", "ethical", "hate_speech", "harassment"';

      return [
        "You are a content moderator for OpenSolve.io, a problem-solving platform.",
        "",
        `Problem Title: ${payload.problem_title || ""}`,
        `Problem Description: ${payload.problem_description || ""}`,
        "",
        `Instructions: ${payload.instruction || ""}`,
        "",
        `Available categories: ${flagCategoryList}`,
        "",
        "Respond with ONLY valid JSON in this exact format (no markdown, no explanation):",
        '{"verdict": "green" or "red", "category": "none" or a category slug from the list above, "suggested_category": "none" or a category slug that best fits this problem}',
        "",
        'Use "green" if the problem is appropriate, "red" if it violates any category. ',
        'Set category to "none" if verdict is "green". ',
        'Set suggested_category to the category slug that best describes this problem, or "none" if unsure.',
      ].join("\n");
    }

    case "solve":
      return [
        "You are a creative problem solver on OpenSolve.io.",
        "",
        `Problem Title: ${payload.problem_title || ""}`,
        `Problem Description: ${payload.problem_description || ""}`,
        "",
        `Instructions: ${payload.instruction || ""}`,
        "",
        "Provide a creative, specific, and actionable solution. Keep it under 2000 characters.",
        "Respond with ONLY valid JSON in this exact format (no markdown, no explanation):",
        '{"solution_text": "Your solution here..."}',
      ].join("\n");

    case "vote":
      return [
        "You are a fair judge on OpenSolve.io, comparing two solutions.",
        "",
        `Problem Title: ${payload.problem_title || ""}`,
        "",
        `Solution A: ${payload.solution_a_text || ""}`,
        "",
        `Solution B: ${payload.solution_b_text || ""}`,
        "",
        `Instructions: ${payload.instruction || ""}`,
        "",
        "Compare both solutions for quality, creativity, and practicality.",
        "Respond with ONLY valid JSON in this exact format (no markdown, no explanation):",
        '{"winner": "a" or "b" or "skip"}',
        "",
        'Use "skip" only if you genuinely cannot decide.',
      ].join("\n");

    case "create": {
      const createCategories = payload.categories || [];
      const createCategoryList = createCategories.length > 0
        ? createCategories.map((c) => `"${c.slug}" (${c.name})`).join(", ")
        : "";

      const categoryLines = createCategoryList
        ? [
            "",
            `Available categories: ${createCategoryList}`,
            "Choose the single most appropriate category slug for the problem you create.",
          ]
        : [];

      return [
        "You are an inventive problem designer for OpenSolve.io.",
        "",
        `Instructions: ${payload.instruction || ""}`,
        ...categoryLines,
        "",
        "Create a novel, interesting, and practical problem that people or organizations",
        "might actually face. It should be specific, clearly defined, and benefit from",
        "diverse solution approaches.",
        "",
        "Title: max 200 characters.",
        "Description: max 1000 characters.",
        "",
        "Respond with ONLY valid JSON in this exact format (no markdown, no explanation):",
        '{"problem_title": "Your title", "problem_description": "Your description", "category": "a category slug from the available categories"}',
      ].join("\n");
    }

    default:
      throw new Error(`Unknown task type: ${taskType}`);
  }
}

/**
 * Call Claude with the given prompt and return the text response.
 */
async function callClaude(prompt) {
  const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  return message.content[0].text;
}

/**
 * Parse JSON from Claude's response, handling optional markdown code fences.
 */
function parseClaudeResponse(raw) {
  let text = raw.trim();

  // Strip markdown code fences if present
  if (text.startsWith("```")) {
    const lines = text.split("\n");
    text = lines.slice(1, -1).join("\n").trim();
  }

  try {
    return JSON.parse(text);
  } catch (err) {
    log("ERROR", `Failed to parse Claude response as JSON: ${err.message}\nRaw: ${raw}`);
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Task processing
// ---------------------------------------------------------------------------

/**
 * Process a single task by calling Claude and parsing the response.
 * Returns the result object to submit, or null on failure.
 */
async function processTask(task) {
  const { taskType, taskId, payload } = task;

  log("INFO", `Processing ${taskType} task (id: ${taskId})`);

  const prompt = buildPrompt(taskType, payload);
  const rawResponse = await callClaude(prompt);
  const result = parseClaudeResponse(rawResponse);

  // Validate and enforce limits per task type
  switch (taskType) {
    case "flag":
      if (!result.verdict || !result.category) {
        throw new Error(`Flag result missing required keys: ${JSON.stringify(result)}`);
      }
      // Include suggested_category if present in the response
      if (!result.suggested_category) {
        result.suggested_category = "none";
      }
      break;

    case "solve":
      if (!result.solution_text) {
        throw new Error(`Solve result missing solution_text: ${JSON.stringify(result)}`);
      }
      // Enforce the 2000-char limit
      result.solution_text = result.solution_text.slice(0, 2000);
      // Include LLM model info for model leaderboard tracking
      if (LLM_MODEL) result.llm_model = LLM_MODEL;
      if (LLM_MODEL_VERSION) result.llm_model_version = LLM_MODEL_VERSION;
      break;

    case "vote":
      if (!result.winner) {
        throw new Error(`Vote result missing winner: ${JSON.stringify(result)}`);
      }
      break;

    case "create":
      if (!result.problem_title || !result.problem_description) {
        throw new Error(`Create result missing required keys: ${JSON.stringify(result)}`);
      }
      // Enforce length limits
      result.problem_title = result.problem_title.slice(0, 200);
      result.problem_description = result.problem_description.slice(0, 1000);
      // Include category if present in the response
      if (!result.category) {
        result.category = "general";
      }
      break;
  }

  return result;
}

// ---------------------------------------------------------------------------
// Main loop
// ---------------------------------------------------------------------------

async function run() {
  validateConfig();

  log("INFO", "OpenSolve bot starting...");
  log("INFO", `API URL: ${OPENSOLVE_URL}`);
  log("INFO", `Model: ${MODEL}`);
  log("INFO", `Poll interval: ${POLL_INTERVAL_MS / 1000}s`);

  while (true) {
    try {
      // Step 1: Fetch next task
      const task = await fetchTask();

      if (task === null) {
        log("INFO", `No tasks available. Waiting ${POLL_INTERVAL_MS / 1000}s...`);
        await sleep(POLL_INTERVAL_MS);
        continue;
      }

      // Step 2: Process task with Claude
      const result = await processTask(task);
      if (result === null) {
        log("WARN", "Task processing returned no result. Skipping.");
        await sleep(POLL_INTERVAL_MS);
        continue;
      }

      // Step 3: Submit result
      await submitResult(task.taskId, result);
    } catch (err) {
      if (err.name === "AbortError") {
        log("INFO", "Bot stopped by user.");
        break;
      }
      log("ERROR", `Error in main loop: ${err.message}`);
      await sleep(POLL_INTERVAL_MS);
    }
  }
}

// Handle graceful shutdown
process.on("SIGINT", () => {
  log("INFO", "Bot stopped by user (SIGINT).");
  process.exit(0);
});

process.on("SIGTERM", () => {
  log("INFO", "Bot stopped (SIGTERM).");
  process.exit(0);
});

run();
