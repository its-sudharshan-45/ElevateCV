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
    } else {
      // In case closing ``` was omitted or truncated
      const openBlockRegex = /```(?:json)?\s*([\s\S]*)/i;
      const openMatch = openBlockRegex.exec(text);
      if (openMatch && openMatch[1]) {
        text = openMatch[1].trim();
      }
    }

    // 2. Locate outermost JSON object or array boundary with depth tracking
    const firstBrace = text.indexOf('{');
    const firstBracket = text.indexOf('[');

    if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
      let depth = 0;
      let inStr = false;
      let isEsc = false;
      let matchingIndex = -1;

      for (let i = firstBrace; i < text.length; i++) {
        const ch = text[i];
        if (inStr) {
          if (isEsc) {
            isEsc = false;
          } else if (ch === '\\') {
            isEsc = true;
          } else if (ch === '"') {
            inStr = false;
          }
        } else {
          if (ch === '"') {
            inStr = true;
          } else if (ch === '{') {
            depth++;
          } else if (ch === '}') {
            depth--;
            if (depth === 0) {
              matchingIndex = i;
              break;
            }
          }
        }
      }

      if (matchingIndex !== -1) {
        return text.slice(firstBrace, matchingIndex + 1);
      }
      return text.slice(firstBrace);
    }

    if (firstBracket !== -1) {
      let depth = 0;
      let inStr = false;
      let isEsc = false;
      let matchingIndex = -1;

      for (let i = firstBracket; i < text.length; i++) {
        const ch = text[i];
        if (inStr) {
          if (isEsc) {
            isEsc = false;
          } else if (ch === '\\') {
            isEsc = true;
          } else if (ch === '"') {
            inStr = false;
          }
        } else {
          if (ch === '"') {
            inStr = true;
          } else if (ch === '[') {
            depth++;
          } else if (ch === ']') {
            depth--;
            if (depth === 0) {
              matchingIndex = i;
              break;
            }
          }
        }
      }

      if (matchingIndex !== -1) {
        return text.slice(firstBracket, matchingIndex + 1);
      }
      return text.slice(firstBracket);
    }

    return text;
  }

  /**
   * Attempts robust JSON syntax repairs for common LLM glitches (trailing commas, unescaped newlines, unclosed braces/quotes).
   */
  static repairJson(jsonStr: string): string {
    let text = jsonStr.trim();

    // 1. Strip JS-style single-line and multi-line comments
    text = text.replace(/\/\/[^\r\n]*|\/\*[\s\S]*?\*\//g, '');

    // 2. Character-by-character scan: normalize unescaped control chars in strings & track unclosed brackets/braces
    let inString = false;
    let isEscaped = false;
    const stack: string[] = [];
    let result = '';

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (inString) {
        if (isEscaped) {
          result += char;
          isEscaped = false;
        } else if (char === '\\') {
          result += char;
          isEscaped = true;
        } else if (char === '"') {
          result += char;
          inString = false;
        } else if (char === '\n') {
          result += '\\n';
        } else if (char === '\r') {
          result += '\\r';
        } else if (char === '\t') {
          result += '\\t';
        } else if (char.charCodeAt(0) < 0x20) {
          // Strip other control characters
        } else {
          result += char;
        }
      } else {
        if (char === '"') {
          inString = true;
          result += char;
        } else if (char === '{') {
          stack.push('}');
          result += char;
        } else if (char === '[') {
          stack.push(']');
          result += char;
        } else if (char === '}' || char === ']') {
          if (stack.length > 0 && stack[stack.length - 1] === char) {
            stack.pop();
          }
          result += char;
        } else {
          result += char;
        }
      }
    }

    // 3. If truncated inside a string, close the quote
    if (inString) {
      result += '"';
    }

    // 4. Remove trailing comma or incomplete key/value (e.g. `,"key":` or `, "incomplete`)
    result = result.replace(/,\s*([}\]])/g, '$1');
    result = result.replace(/,\s*$/, '');
    result = result.replace(/:\s*$/, ': ""');

    // 5. Close unclosed brackets and braces in LIFO order
    while (stack.length > 0) {
      const closing = stack.pop()!;
      result = result.replace(/,\s*$/, '');
      result += closing;
    }

    // Final cleanup of trailing commas before closing brackets/braces
    result = result.replace(/,\s*([}\]])/g, '$1');

    return result;
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
