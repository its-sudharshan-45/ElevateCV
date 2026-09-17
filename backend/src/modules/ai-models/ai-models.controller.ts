import type { Request, Response } from 'express';
import { aiContainer } from '../../ai/container/ai.container.js';
import { logger } from '../../config/logger.js';
import { AppError } from '../../utils/errors.js';

export class AiModelsController {
  async listModels(_req: Request, res: Response): Promise<void> {
    const manifests = aiContainer.modelRegistry.getAll();
    res.json({
      success: true,
      data: manifests.map((m) => ({
        id: m.id,
        name: m.name,
        description: m.description,
        provider: m.hub.provider,
        library: m.architecture.library,
        task: m.architecture.task,
        modality: m.architecture.modality,
        modelId: m.hub.modelId,
        revision: m.hub.revision,
        status: m.status,
        isLoaded: aiContainer.modelFactory.isLoaded(m.id),
        allowlisted: m.security.allowlisted,
      })),
      total: manifests.length,
    });
  }

  async getModel(req: Request, res: Response): Promise<void> {
    const id = String(req.params.id);

    if (!aiContainer.modelRegistry.has(id)) {
      throw new AppError(`Model '${id}' not found in registry`, 404, 'MODEL_NOT_FOUND');
    }

    const manifest = aiContainer.modelRegistry.get(id);
    res.json({
      success: true,
      data: manifest,
    });
  }

  async getModelHealth(req: Request, res: Response): Promise<void> {
    const id = String(req.params.id);

    if (!aiContainer.modelRegistry.has(id)) {
      throw new AppError(`Model '${id}' not found in registry`, 404, 'MODEL_NOT_FOUND');
    }

    const health = await aiContainer.modelHealthService.checkModelHealth(id);
    res.json({ success: true, data: health });
  }

  async getAllModelHealth(_req: Request, res: Response): Promise<void> {
    const healthResults = await aiContainer.modelHealthService.checkAllModels();
    res.json({ success: true, data: healthResults });
  }

  async getModelMetrics(req: Request, res: Response): Promise<void> {
    const id = String(req.params.id);

    if (!aiContainer.modelRegistry.has(id)) {
      throw new AppError(`Model '${id}' not found in registry`, 404, 'MODEL_NOT_FOUND');
    }

    const metrics = aiContainer.modelMetricsService.getMetricsForModel(id);
    res.json({ success: true, data: metrics });
  }

  async scanCodebase(_req: Request, res: Response): Promise<void> {
    logger.info('Triggering model codebase scan via API');
    const discovered = await aiContainer.modelScanner.scanCodebase(process.cwd());
    res.json({
      success: true,
      data: discovered,
      count: discovered.length,
    });
  }

  async checkDrift(_req: Request, res: Response): Promise<void> {
    const reports = await aiContainer.modelDriftService.checkAllModelsDrift();
    res.json({ success: true, data: reports });
  }
}

export const aiModelsController = new AiModelsController();
