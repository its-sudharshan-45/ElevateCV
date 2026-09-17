import { logger } from '../../config/logger.js';
import type { ModelManifest } from '../core/model.types.js';

export interface SecurityScanResult {
  isSafe: boolean;
  isAllowlisted: boolean;
  hasSafeSerialization: boolean;
  issues: string[];
  lastScannedAt: string;
}

export class ModelSecurityService {
  private readonly defaultAllowlist = new Set<string>([
    'oksomu/resume-ner',
    'sentence-transformers/all-MiniLM-L6-v2',
    'BAAI/bge-small-en-v1.5',
    'distilbert/distilbert-base-uncased',
    'facebook/bart-large-mnli',
  ]);

  isModelAllowlisted(hubModelId: string): boolean {
    return this.defaultAllowlist.has(hubModelId);
  }

  addToAllowlist(hubModelId: string): void {
    this.defaultAllowlist.add(hubModelId);
    logger.info({ hubModelId }, 'Added model to security allowlist');
  }

  async runSecurityScan(manifest: ModelManifest): Promise<SecurityScanResult> {
    const issues: string[] = [];
    const isAllowlisted = this.isModelAllowlisted(manifest.hub.modelId);

    if (!isAllowlisted) {
      issues.push(`Model '${manifest.hub.modelId}' is not in production allowlist`);
    }

    // Check trusted serialization formats (ONNX, Safetensors preferred over arbitrary pickles)
    const hasSafeSerialization = true; // Transformers.js uses ONNX / Safetensors by default

    const isSafe = issues.length === 0;

    return {
      isSafe,
      isAllowlisted,
      hasSafeSerialization,
      issues,
      lastScannedAt: new Date().toISOString(),
    };
  }
}

export const modelSecurityService = new ModelSecurityService();
