/**
 * LLM Model Family Registry
 *
 * Single source of truth for model family detection, display names, and colors.
 * This file is the ONLY place model families are defined or matched.
 *
 * To add a new family: append an entry to KNOWN_MODEL_FAMILIES with:
 *   - color: hex color visible on dark backgrounds
 *   - label: display name for leaderboard grouping
 *   - company: parent organization
 *   - matchKeys: lowercase strings to match in model names (any match = hit)
 *
 * Unknown models get auto-detected with a deterministic color — no "Other" bucket.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ModelFamilyInfo {
  color: string;
  label: string;
  company: string;
  matchKeys: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Known families — curated colors + reliable matching
// ─────────────────────────────────────────────────────────────────────────────

export const KNOWN_MODEL_FAMILIES: Record<string, ModelFamilyInfo> = {

  // ── Major commercial providers ─────────────────────────────────────────

  gpt: {
    color: '#22C55E',
    label: 'GPT',
    company: 'OpenAI',
    matchKeys: ['gpt', 'chatgpt', 'o1', 'o3', 'o4', 'codex', 'gpt-oss'],
  },
  claude: {
    color: '#A855F7',
    label: 'Claude',
    company: 'Anthropic',
    matchKeys: ['claude'],
  },
  gemini: {
    color: '#3B82F6',
    label: 'Gemini',
    company: 'Google DeepMind',
    matchKeys: ['gemini'],
  },
  grok: {
    color: '#EAB308',
    label: 'Grok',
    company: 'xAI',
    matchKeys: ['grok'],
  },

  // ── Major open-weight ecosystems ───────────────────────────────────────

  llama: {
    color: '#F97316',
    label: 'Llama',
    company: 'Meta',
    matchKeys: ['llama'],
  },
  deepseek: {
    color: '#EF4444',
    label: 'DeepSeek',
    company: 'DeepSeek AI',
    matchKeys: ['deepseek'],
  },
  qwen: {
    color: '#10B981',
    label: 'Qwen',
    company: 'Alibaba Cloud',
    matchKeys: ['qwen', 'qwq', 'tongyi'],
  },
  mistral: {
    color: '#06B6D4',
    label: 'Mistral',
    company: 'Mistral AI',
    matchKeys: ['mistral', 'mixtral', 'magistral', 'codestral', 'devstral', 'pixtral', 'voxtral'],
  },
  gemma: {
    color: '#EC4899',
    label: 'Gemma',
    company: 'Google DeepMind',
    matchKeys: ['gemma'],
  },
  command: {
    color: '#8B5CF6',
    label: 'Command',
    company: 'Cohere',
    matchKeys: ['command-r', 'command-a', 'command_r', 'cohere'],
  },

  // ── Notable industry models ────────────────────────────────────────────

  nemotron: {
    color: '#84CC16',
    label: 'Nemotron',
    company: 'NVIDIA',
    matchKeys: ['nemotron'],
  },
  glm: {
    color: '#0EA5E9',
    label: 'GLM',
    company: 'Zhipu AI',
    matchKeys: ['glm', 'chatglm'],
  },
  kimi: {
    color: '#A78BFA',
    label: 'Kimi',
    company: 'Moonshot AI',
    matchKeys: ['kimi', 'moonshot'],
  },
  minimax: {
    color: '#C084FC',
    label: 'MiniMax',
    company: 'MiniMax',
    matchKeys: ['minimax'],
  },
  nova: {
    color: '#F472B6',
    label: 'Nova',
    company: 'Amazon',
    matchKeys: ['nova-lite', 'nova-micro', 'nova-pro', 'nova-premier', 'nova-2'],
  },
  titan: {
    color: '#FB923C',
    label: 'Titan',
    company: 'Amazon',
    matchKeys: ['titan'],
  },
  ernie: {
    color: '#F43F5E',
    label: 'Ernie',
    company: 'Baidu',
    matchKeys: ['ernie'],
  },
  jamba: {
    color: '#2DD4BF',
    label: 'Jamba',
    company: 'AI21 Labs',
    matchKeys: ['jamba'],
  },
  mercury: {
    color: '#E2E8F0',
    label: 'Mercury',
    company: 'Inception',
    matchKeys: ['mercury'],
  },
  palmyra: {
    color: '#34D399',
    label: 'Palmyra',
    company: 'Writer',
    matchKeys: ['palmyra'],
  },

  // ── Emerging & regional models ─────────────────────────────────────────

  seed: {
    color: '#818CF8',
    label: 'Seed',
    company: 'ByteDance',
    matchKeys: ['seed-1', 'seed-2'],
  },
  mimo: {
    color: '#FB7185',
    label: 'MiMo',
    company: 'Xiaomi',
    matchKeys: ['mimo'],
  },
  longcat: {
    color: '#FBBF24',
    label: 'LongCat',
    company: 'Meituan',
    matchKeys: ['longcat'],
  },
  trinity: {
    color: '#A3E635',
    label: 'Trinity',
    company: 'Arcee AI',
    matchKeys: ['trinity', 'virtuoso'],
  },
  solar: {
    color: '#FACC15',
    label: 'Solar',
    company: 'Upstage',
    matchKeys: ['solar'],
  },
  kat: {
    color: '#38BDF8',
    label: 'KAT',
    company: 'KwaiPilot',
    matchKeys: ['kat-coder', 'kwaipilot'],
  },
  intellect: {
    color: '#67E8F9',
    label: 'Intellect',
    company: 'Prime Intellect',
    matchKeys: ['intellect'],
  },
  rnj: {
    color: '#D946EF',
    label: 'RNJ',
    company: 'Essential AI',
    matchKeys: ['rnj'],
  },
  sonar: {
    color: '#94A3B8',
    label: 'Sonar',
    company: 'Perplexity',
    matchKeys: ['sonar'],
  },
  olmo: {
    color: '#4ADE80',
    label: 'OLMo',
    company: 'Allen Institute for AI',
    matchKeys: ['olmo'],
  },

  // ── Popular but not yet seen on platform ───────────────────────────────

  phi: {
    color: '#F59E0B',
    label: 'Phi',
    company: 'Microsoft',
    matchKeys: ['phi-'],
  },
  yi: {
    color: '#14B8A6',
    label: 'Yi',
    company: '01.AI',
    matchKeys: ['yi-'],
  },
  granite: {
    color: '#64748B',
    label: 'Granite',
    company: 'IBM',
    matchKeys: ['granite'],
  },
  falcon: {
    color: '#E879F9',
    label: 'Falcon',
    company: 'TII',
    matchKeys: ['falcon'],
  },
  baichuan: {
    color: '#FCA5A5',
    label: 'Baichuan',
    company: 'Baichuan Intelligence',
    matchKeys: ['baichuan'],
  },
  internlm: {
    color: '#7DD3FC',
    label: 'InternLM',
    company: 'Shanghai AI Lab',
    matchKeys: ['internlm'],
  },
  dbrx: {
    color: '#FDBA74',
    label: 'DBRX',
    company: 'Databricks',
    matchKeys: ['dbrx'],
  },
  stablelm: {
    color: '#BAE6FD',
    label: 'StableLM',
    company: 'Stability AI',
    matchKeys: ['stablelm', 'stable-lm'],
  },
  rwkv: {
    color: '#86EFAC',
    label: 'RWKV',
    company: 'RWKV Foundation',
    matchKeys: ['rwkv'],
  },
  hunyuan: {
    color: '#FDE68A',
    label: 'Hunyuan',
    company: 'Tencent',
    matchKeys: ['hunyuan'],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Utility functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate a deterministic HSL color from any string.
 * Same input always produces the same color.
 */
export function hashColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 65%, 55%)`;
}

/** Common provider prefixes to strip for display. */
const PROVIDER_PREFIXES = /^(ollama|openrouter|together|anyscale|fireworks|groq|perplexity|replicate)\//i;

/**
 * Strip the provider prefix from a model name for display.
 * "ollama/qwen3.5:9b" → "qwen3.5:9b"
 * "gpt-4o" → "gpt-4o" (no prefix, unchanged)
 * "openrouter/meta-llama/llama-3.1-70b" → "meta-llama/llama-3.1-70b"
 */
export function displayModelName(modelName: string): string {
  return modelName.replace(PROVIDER_PREFIXES, '');
}

/**
 * Detect the model family from a model name string.
 *
 * Returns { family, color, company } where:
 *   - family: grouping label for leaderboard filters (e.g., "Qwen")
 *   - color: hex or hsl color for the badge
 *   - company: parent org (empty string for auto-detected unknowns)
 *
 * Badge text should always be displayModelName(), NOT the family label.
 */
export function getModelFamily(modelName: string): { family: string; color: string; company: string } {
  const lower = modelName.toLowerCase();
  const stripped = lower.replace(PROVIDER_PREFIXES, '');

  // Check against known families using matchKeys
  for (const [, info] of Object.entries(KNOWN_MODEL_FAMILIES)) {
    for (const key of info.matchKeys) {
      if (stripped.includes(key)) {
        return { family: info.label, color: info.color, company: info.company };
      }
    }
  }

  // Unknown model: extract readable family name + deterministic color
  const baseName = stripped.split(/[-_.:]/)[0] || stripped;
  const family = baseName.charAt(0).toUpperCase() + baseName.slice(1);
  return { family, color: hashColor(baseName), company: '' };
}

// ─────────────────────────────────────────────────────────────────────────────
// Backward compatibility
// ─────────────────────────────────────────────────────────────────────────────

/** @deprecated Use KNOWN_MODEL_FAMILIES directly */
export const MODEL_FAMILIES = KNOWN_MODEL_FAMILIES;
export type ModelFamily = string;
