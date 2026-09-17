import type { ZodSchema } from 'zod';
import { logger } from '../../config/logger.js';
import { InvalidModelOutputError } from '../core/model.errors.js';

export class StructuredOutputParser {
  /**
   * Cleans raw AI response text and extracts valid JSON objects/arrays.
   */
  static extractJsonString(rawText: string): string {
    if (!rawText) return '{}';

    let text = rawText.trim();

    // 1. Check for markdown code blocks (e.g. ```json ... ```)
    const jsonBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i;
    const match = jsonBlockRegex.exec(text);
    if (match && match[1]) {
      text = match[1].trim();
    }

    // 2. Locate outermost JSON object or array boundary
    const firstBrace = text.indexOf('{');
    const firstBracket = text.indexOf('[');

    if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
      const lastBrace = text.lastIndexOf('}');
      if (lastBrace !== -1 && lastBrace > firstBrace) {
        return text.slice(firstBrace, lastBrace + 1);
      }
    } else if (firstBracket !== -1) {
      const lastBracket = text.lastIndexOf(']');
      if (lastBracket !== -1 && lastBracket > firstBracket) {
        return text.slice(firstBracket, lastBracket + 1);
      }
    }

    return text;
  }

  /**
   * Attempts simple JSON syntax repairs for common LLM glitches (trailing commas, unescaped newlines).
   */
  static repairJson(jsonStr: string): string {
    let repaired = jsonStr;

    // Remove trailing commas before closing braces/brackets
    repaired = repaired.replace(/,\s*([}\]])/g, '$1');

    // Replace unescaped control characters in string values
    // eslint-disable-next-line no-control-regex
    repaired = repaired.replace(/[\u0000-\u001F]+/g, (match) => {
      if (match === '\n' || match === '\r' || match === '\t') return match;
      return '';
    });

    return repaired;
  }

  /**
   * Parses, repairs, and strictly validates structured output against a Zod schema.
   */
  static parseAndValidate<T>(
    rawText: string,
    schema: ZodSchema<T>,
    modelId = 'ai-completion',
  ): T {
    const extracted = this.extractJsonString(rawText);

    let parsedObj: unknown;
    try {
      parsedObj = JSON.parse(extracted);
    } catch {
      // Try repaired JSON
      const repaired = this.repairJson(extracted);
      try {
        parsedObj = JSON.parse(repaired);
      } catch (err) {
        logger.error({ rawText, extracted, err }, 'Failed to parse JSON from AI output');
        throw new InvalidModelOutputError(
          modelId,
          `Failed to parse JSON: ${err instanceof Error ? err.message : String(err)}`,
          rawText,
        );
      }
    }

    const validation = schema.safeParse(parsedObj);
    if (!validation.success) {
      const issues = validation.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
      logger.error({ issues, parsedObj }, 'Structured output failed Zod schema validation');
      throw new InvalidModelOutputError(modelId, `Schema validation failed: ${issues}`, parsedObj);
    }

    return validation.data;
  }
}
