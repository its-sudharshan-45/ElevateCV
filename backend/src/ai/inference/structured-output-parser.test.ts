import { describe, expect, it } from 'vitest';
import { StructuredOutputParser } from './structured-output-parser.js';
import { z } from 'zod';

const questionSchema = z.object({
  questions: z.array(
    z.object({
      type: z.string(),
      topic: z.string(),
      difficulty: z.string(),
      question: z.string(),
    }),
  ),
});

describe('StructuredOutputParser', () => {
  describe('extractJsonString', () => {
    it('extracts JSON from a markdown code block', () => {
      const raw = '```json\n{"key": "value"}\n```';
      const extracted = StructuredOutputParser.extractJsonString(raw);
      expect(extracted).toBe('{"key": "value"}');
    });

    it('extracts JSON from surrounding text', () => {
      const raw = 'Here is the result:\n{"score": 85}\nEnjoy!';
      const extracted = StructuredOutputParser.extractJsonString(raw);
      expect(extracted).toBe('{"score": 85}');
    });

    it('extracts JSON arrays correctly', () => {
      const raw = 'The output is [1, 2, 3].';
      const extracted = StructuredOutputParser.extractJsonString(raw);
      expect(extracted).toBe('[1, 2, 3]');
    });
  });

  describe('repairJson', () => {
    it('removes trailing commas before closing braces', () => {
      const broken = '{"a": 1, "b": 2,}';
      const fixed = StructuredOutputParser.repairJson(broken);
      expect(() => JSON.parse(fixed)).not.toThrow();
    });

    it('removes trailing commas before closing brackets', () => {
      const broken = '[1, 2, 3,]';
      const fixed = StructuredOutputParser.repairJson(broken);
      expect(() => JSON.parse(fixed)).not.toThrow();
    });
  });

  describe('parseAndValidate', () => {
    it('parses and validates valid JSON against schema', () => {
      const raw = JSON.stringify({
        questions: [
          { type: 'TECHNICAL', topic: 'React', difficulty: 'medium', question: 'What are hooks?' },
        ],
      });
      const result = StructuredOutputParser.parseAndValidate(raw, questionSchema);
      expect(result.questions).toHaveLength(1);
      expect(result.questions[0].topic).toBe('React');
    });

    it('parses JSON from markdown wrapper', () => {
      const raw = '```json\n{"questions": [{"type": "HR", "topic": "Communication", "difficulty": "easy", "question": "Tell me about yourself"}]}\n```';
      const result = StructuredOutputParser.parseAndValidate(raw, questionSchema);
      expect(result.questions[0].type).toBe('HR');
    });

    it('repairs trailing-comma JSON and validates', () => {
      const raw = '{"questions": [{"type": "BEHAVIORAL", "topic": "Teamwork", "difficulty": "easy", "question": "Describe a conflict",},]}';
      const result = StructuredOutputParser.parseAndValidate(raw, questionSchema);
      expect(result.questions).toHaveLength(1);
    });

    it('throws InvalidModelOutputError on unparseable raw text', () => {
      const raw = 'This is completely invalid non-JSON text with no structure.';
      expect(() => StructuredOutputParser.parseAndValidate(raw, questionSchema)).toThrow();
    });

    it('throws InvalidModelOutputError on schema validation failure', () => {
      const raw = JSON.stringify({ wrongKey: 'no questions here' });
      expect(() => StructuredOutputParser.parseAndValidate(raw, questionSchema)).toThrow();
    });
  });
});
