import { logger } from './logger.js';

/**
 * Known prompt injection patterns.
 * Each entry is a case-insensitive regex that matches common injection attempts.
 */
const INJECTION_PATTERNS: RegExp[] = [
  // Direct instruction override attempts
  /ignore\s+(all\s+)?(previous|prior|above|earlier)\s+(instructions?|prompts?|rules?|directives?)/i,
  /disregard\s+(all\s+)?(previous|prior|above|earlier)\s+(instructions?|prompts?|rules?|directives?)/i,
  /forget\s+(all\s+)?(previous|prior|above|earlier)\s+(instructions?|prompts?|rules?|directives?)/i,
  /override\s+(all\s+)?(previous|prior|above|earlier)\s+(instructions?|prompts?|rules?|directives?)/i,

  // System prompt extraction / manipulation
  /system\s+prompt/i,
  /reveal\s+(your|the)\s+(instructions?|prompt|rules?|system)/i,
  /show\s+(me\s+)?(your|the)\s+(instructions?|prompt|rules?|system)/i,
  /what\s+(are|is)\s+your\s+(instructions?|prompt|rules?|system)/i,
  /print\s+(your|the)\s+(instructions?|prompt|rules?|system)/i,

  // Role-playing / persona hijacking
  /you\s+are\s+now\s+(a|an|the)/i,
  /act\s+as\s+(a|an|the|if)/i,
  /pretend\s+(you\s+are|to\s+be)/i,
  /switch\s+to\s+.{0,20}\s+mode/i,

  // Jailbreak delimiters
  /\[INST\]/i,
  /\[\/INST\]/i,
  /<<SYS>>/i,
  /<\|im_start\|>/i,
  /<\|im_end\|>/i,
  /```system/i,

  // DAN-style jailbreaks
  /\bDAN\b.*\bmode\b/i,
  /do\s+anything\s+now/i,
  /\bjailbreak/i,

  // Encoded or obfuscated attempts
  /base64\s*(decode|encode)/i,
  /eval\s*\(/i,
  /exec\s*\(/i,
];

/**
 * Checks a text string for known prompt injection patterns.
 * Returns true if any injection pattern is detected.
 */
export function detectPromptInjection(text: string): boolean {
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(text)) {
      return true;
    }
  }
  return false;
}

/**
 * Checks multiple text fields for prompt injection patterns.
 * Logs a warning if any injection is detected.
 * Returns true if any field contains injection patterns.
 */
export function checkAndLogInjection(
  fields: Record<string, string>,
  context: { botId?: string; taskId?: string; endpoint?: string }
): boolean {
  let detected = false;

  for (const [fieldName, value] of Object.entries(fields)) {
    if (detectPromptInjection(value)) {
      detected = true;
      logger.warn(
        {
          event: 'prompt_injection_detected',
          field: fieldName,
          botId: context.botId,
          taskId: context.taskId,
          endpoint: context.endpoint,
          snippet: value.slice(0, 200),
        },
        `Prompt injection pattern detected in ${fieldName}`
      );
    }
  }

  return detected;
}
