import { logger } from '../../config/logger.js';
import { hfHubService, type HfHubService } from '../hub/hf-hub.service.js';
import { modelRegistry, type ModelRegistry } from '../registry/model-registry.js';

export interface ModelDriftReport {
  modelId: string;
  hasHubUpdate: boolean;
  pinnedRevision?: string;
  latestHubSha?: string;
  isStaged: boolean;
  needsRegressionTest: boolean;
}

export class ModelDriftService {
  constructor(
    private readonly registry: ModelRegistry = modelRegistry,
    private readonly hub: HfHubService = hfHubService,
  ) {}

  async checkDrift(modelId: string): Promise<ModelDriftReport> {
    const manifest = this.registry.get(modelId);
    const pinnedRevision = manifest.hub.revision || 'main';

    const check = await this.hub.checkLatestRevision(manifest.hub.modelId, pinnedRevision);

    if (check.hasUpdate) {
      logger.warn(
        { modelId, current: pinnedRevision, latestSha: check.latestSha },
        'Model Hub revision drift detected! Staged approval recommended before upgrade.',
      );
    }

    return {
      modelId,
      hasHubUpdate: check.hasUpdate,
      pinnedRevision,
      latestHubSha: check.latestSha,
      isStaged: false,
      needsRegressionTest: check.hasUpdate,
    };
  }

  async checkAllModelsDrift(): Promise<ModelDriftReport[]> {
    const manifests = this.registry.getAll();
    const reports: ModelDriftReport[] = [];

    for (const manifest of manifests) {
      const rep = await this.checkDrift(manifest.id);
      reports.push(rep);
    }

    return reports;
  }
}

export const modelDriftService = new ModelDriftService();
