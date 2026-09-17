export class BatchingEngine {
  /**
   * Splits an array of items into batches up to maxBatchSize.
   */
  static createBatches<T>(items: T[], maxBatchSize = 16): T[][] {
    if (!items || items.length === 0) return [];
    if (maxBatchSize <= 0) maxBatchSize = 16;

    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += maxBatchSize) {
      batches.push(items.slice(i, i + maxBatchSize));
    }
    return batches;
  }

  /**
   * Chunks large text into windowed paragraphs/word segments for model token limits.
   */
  static chunkText(text: string, maxWords = 300): string[] {
    if (!text || !text.trim()) return [];

    const paragraphs = text.split(/\n{2,}/);
    const chunks: string[] = [];
    let currentChunkWords: string[] = [];

    for (const paragraph of paragraphs) {
      const words = paragraph.trim().split(/\s+/).filter(Boolean);
      if (words.length === 0) continue;

      if (currentChunkWords.length + words.length <= maxWords) {
        currentChunkWords.push(...words);
      } else {
        if (currentChunkWords.length > 0) {
          chunks.push(currentChunkWords.join(' '));
          currentChunkWords = [];
        }

        if (words.length > maxWords) {
          for (let i = 0; i < words.length; i += maxWords) {
            chunks.push(words.slice(i, i + maxWords).join(' '));
          }
        } else {
          currentChunkWords.push(...words);
        }
      }
    }

    if (currentChunkWords.length > 0) {
      chunks.push(currentChunkWords.join(' '));
    }

    return chunks;
  }
}
