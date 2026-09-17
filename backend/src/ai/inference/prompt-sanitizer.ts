export class PromptSanitizer {
  /**
   * Sanitizes user input before incorporating into LLM prompt templates.
   * Protects against prompt injection without stripping legitimate resume skills or technical project details.
   */
  static sanitizeUserInput(input: string, maxChars = 8000): string {
    if (!input) return '';

    let sanitized = input.trim();

    // 1. Enforce length boundary
    if (sanitized.length > maxChars) {
      sanitized = sanitized.slice(0, maxChars);
    }

    // 2. Neutralize common prompt injection prefixes / delimiters
    const injectionPatterns = [
      /system\s*:\s*/gi,
      /assistant\s*:\s*/gi,
      /human\s*:\s*/gi,
      /\[\s*system\s*\]/gi,
      /\[\s*override\s*\]/gi,
      /ignore\s+all\s+previous\s+instructions/gi,
      /disregard\s+all\s+prior\s+prompts/gi,
      /reveal\s+your\s+system\s+prompt/gi,
    ];

    for (const pattern of injectionPatterns) {
      sanitized = sanitized.replace(pattern, '[filtered-directive]');
    }

    // 3. Escape markdown fenced code delimiter attempts that break prompt structure
    sanitized = sanitized.replace(/```system/gi, '```text');

    return sanitized;
  }

  /**
   * Wraps user-supplied content in secure XML/Markdown tags with explicit boundary instructions.
   */
  static wrapWithContext(tag: string, content: string): string {
    const cleanContent = this.sanitizeUserInput(content);
    return `<${tag}>\n${cleanContent}\n</${tag}>`;
  }
}
