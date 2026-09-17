// cspell:ignore msword openxmlformats officedocument wordprocessingml
import pdfParse from 'pdf-parse';
import { AppError } from '../../utils/errors.js';

/**
 * Extracts normalized plain text from supported resume file formats.
 * Currently supports PDF and UTF-8 plain text.
 */
export async function extractResumeText(buffer: Buffer, mimeType: string): Promise<string> {
  if (mimeType === 'text/plain') {
    const text = buffer.toString('utf8').trim();
    if (!text) {
      throw new AppError('Resume file contains no readable text', 400, 'VALIDATION_ERROR');
    }
    return normalizeExtractedText(text);
  }

  if (mimeType === 'application/pdf') {
    try {
      const parsed = await pdfParse(buffer);
      const text = parsed.text?.trim() ?? '';
      if (!text) {
        throw new AppError('Unable to extract text from the PDF resume', 400, 'VALIDATION_ERROR');
      }
      return normalizeExtractedText(text);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to extract text from resume file', 500, 'INTERNAL_SERVER_ERROR');
    }
  }

  if (
    mimeType === 'application/msword' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'application/octet-stream'
  ) {
    const raw = buffer.toString('utf8');
    const xmlMatches = raw.match(/<w:t[^>]*>(.*?)<\/w:t>/g);
    let text = '';
    if (xmlMatches && xmlMatches.length > 0) {
      text = xmlMatches.map((tag) => tag.replace(/<[^>]+>/g, '')).join(' ');
    } else {
      text = raw.replace(/[^\x20-\x7E\n\r\t]/g, ' ').replace(/\s+/g, ' ');
    }
    if (!text.trim()) {
      throw new AppError('Unable to extract text from the Word document', 400, 'VALIDATION_ERROR');
    }
    return normalizeExtractedText(text);
  }

  throw new AppError('Unsupported resume file format', 400, 'VALIDATION_ERROR');
}

function normalizeExtractedText(text: string): string {
  const withoutNulls = text.split('\u0000').join('');

  return withoutNulls
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
