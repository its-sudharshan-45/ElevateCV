import fs from 'node:fs';
import path from 'node:path';
import { logger } from '../../config/logger.js';
import type { ModelLibrary, ModelModality, ModelTask } from '../core/model.types.js';

export interface DiscoveredModelReference {
  modelId: string;
  library: ModelLibrary;
  modelClass: string;
  task: ModelTask;
  modality: ModelModality;
  file: string;
  line: number;
  isInstantiated: boolean;
  configRef?: string;
}

export class ModelScanner {
  private readonly supportedExtensions = new Set([
    '.ts',
    '.tsx',
    '.js',
    '.mjs',
    '.py',
    '.json',
    '.yaml',
    '.yml',
    '.env.example',
  ]);

  private readonly ignoreDirs = new Set([
    'node_modules',
    '.git',
    'dist',
    'build',
    '.next',
    '.cache',
    'coverage',
  ]);

  /**
   * Scans root directory recursively for Hugging Face model references without downloading any weights.
   */
  async scanCodebase(rootDir: string = process.cwd()): Promise<DiscoveredModelReference[]> {
    const discovered: DiscoveredModelReference[] = [];
    await this.traverseDirectory(rootDir, rootDir, discovered);
    logger.info({ count: discovered.length }, 'Completed Hugging Face codebase scan');
    return discovered;
  }

  private async traverseDirectory(
    currentPath: string,
    rootDir: string,
    results: DiscoveredModelReference[],
  ): Promise<void> {
    let entries: fs.Dirent[] = [];
    try {
      entries = await fs.promises.readdir(currentPath, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);

      if (entry.isDirectory()) {
        if (!this.ignoreDirs.has(entry.name)) {
          await this.traverseDirectory(fullPath, rootDir, results);
        }
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        const base = entry.name.toLowerCase();

        if (this.supportedExtensions.has(ext) || base === '.env.example') {
          await this.scanFile(fullPath, rootDir, results);
        }
      }
    }
  }

  private async scanFile(
    filePath: string,
    rootDir: string,
    results: DiscoveredModelReference[],
  ): Promise<void> {
    try {
      const content = await fs.promises.readFile(filePath, 'utf-8');
      const lines = content.split('\n');
      const relativePath = path.relative(rootDir, filePath).replace(/\\/g, '/');

      // Pattern matchers
      // 1. pipeline('token-classification' | 'text-generation' | ..., 'model/id')
      const pipelineRegex = /pipeline\(\s*['"]([a-zA-Z0-9-_]+)['"]\s*,\s*['"]([a-zA-Z0-9-_./]+)['"]/g;
      // 2. from_pretrained('model/id')
      const fromPretrainedRegex = /(?:AutoModel|AutoTokenizer|AutoProcessor|AutoModelForSequenceClassification|AutoModelForTokenClassification|AutoModelForCausalLM|SentenceTransformer|DiffusionPipeline|StableDiffusionPipeline|CrossEncoder)\.from_pretrained\(\s*['"]([a-zA-Z0-9-_./]+)['"]/g;
      // 3. timm.create_model('model/id')
      const timmRegex = /create_model\(\s*['"]([a-zA-Z0-9-_./]+)['"]/g;
      // 4. Specific known HF models e.g. oksomu/resume-ner, sentence-transformers/all-MiniLM-L6-v2
      const knownHfRegex = /['"](oksomu\/resume-ner|sentence-transformers\/[a-zA-Z0-9-_]+|BAAI\/[a-zA-Z0-9-_.]+)['"]/g;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNum = i + 1;

        let match: RegExpExecArray | null;

        // Check pipeline(...)
        while ((match = pipelineRegex.exec(line)) !== null) {
          const task = this.mapTask(match[1]);
          results.push({
            modelId: match[2],
            library: 'transformers',
            modelClass: 'pipeline',
            task,
            modality: 'text',
            file: relativePath,
            line: lineNum,
            isInstantiated: true,
            configRef: match[1],
          });
        }

        // Check from_pretrained(...)
        while ((match = fromPretrainedRegex.exec(line)) !== null) {
          results.push({
            modelId: match[1],
            library: line.includes('SentenceTransformer') ? 'sentence-transformers' : line.includes('Diffusion') ? 'diffusers' : 'transformers',
            modelClass: 'AutoModel/PreTrained',
            task: 'text-generation',
            modality: 'text',
            file: relativePath,
            line: lineNum,
            isInstantiated: true,
          });
        }

        // Check timm create_model(...)
        while ((match = timmRegex.exec(line)) !== null) {
          results.push({
            modelId: match[1],
            library: 'timm',
            modelClass: 'create_model',
            task: 'image-classification',
            modality: 'image',
            file: relativePath,
            line: lineNum,
            isInstantiated: true,
          });
        }

        // Check known HF references if not already caught in this line
        while ((match = knownHfRegex.exec(line)) !== null) {
          const modelId = match[1];
          const alreadyMatched = results.some((r) => r.file === relativePath && r.line === lineNum && r.modelId === modelId);
          if (!alreadyMatched) {
            results.push({
              modelId,
              library: modelId.startsWith('sentence-transformers') || modelId.startsWith('BAAI') ? 'sentence-transformers' : 'transformers',
              modelClass: 'Reference',
              task: modelId.includes('ner') ? 'token-classification' : 'embeddings',
              modality: 'text',
              file: relativePath,
              line: lineNum,
              isInstantiated: line.includes('pipeline(') || line.includes('load('),
            });
          }
        }
      }
    } catch {
      // Ignore unreadable files
    }
  }

  private mapTask(taskName: string): ModelTask {
    switch (taskName.toLowerCase()) {
      case 'token-classification':
      case 'ner':
        return 'token-classification';
      case 'text-generation':
      case 'causal-lm':
        return 'text-generation';
      case 'text-classification':
      case 'sentiment-analysis':
        return 'text-classification';
      case 'feature-extraction':
      case 'embeddings':
        return 'embeddings';
      case 'image-classification':
        return 'image-classification';
      case 'image-to-image':
      case 'text-to-image':
        return 'image-generation';
      default:
        return 'other';
    }
  }
}

export const modelScanner = new ModelScanner();
