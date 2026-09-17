import { adapterRegistry, type AdapterRegistry } from '../adapters/adapter-registry.js';
import { modelConfigService, type ModelConfigService } from '../config/model-config.service.js';
import { modelScanner, type ModelScanner } from '../discovery/model-scanner.js';
import { modelFactory, type ModelFactory } from '../factory/model-factory.js';
import { hfHubService, type HfHubService } from '../hub/hf-hub.service.js';
import { inferenceEngine, type InferenceEngine } from '../inference/inference-engine.js';
import { modelDriftService, type ModelDriftService } from '../monitoring/model-drift.service.js';
import { modelHealthService, type ModelHealthService } from '../monitoring/model-health.service.js';
import { modelMetricsService, type ModelMetricsService } from '../monitoring/model-metrics.service.js';
import { modelRegistry, type ModelRegistry } from '../registry/model-registry.js';
import { deviceManager, type DeviceManager } from '../runtime/device-manager.js';
import { memoryManager, type MemoryManager } from '../runtime/memory-manager.js';
import { quantizationManager, type QuantizationManager } from '../runtime/quantization-manager.js';
import { modelSecurityService, type ModelSecurityService } from '../security/model-security.service.js';

/**
 * Central Dependency Injection container for all AI infrastructure.
 * Provides a single, unified access point for all model management services.
 */
export class AiContainer {
  readonly modelRegistry: ModelRegistry;
  readonly adapterRegistry: AdapterRegistry;
  readonly modelFactory: ModelFactory;
  readonly modelConfigService: ModelConfigService;
  readonly modelScanner: ModelScanner;
  readonly deviceManager: DeviceManager;
  readonly memoryManager: MemoryManager;
  readonly quantizationManager: QuantizationManager;
  readonly inferenceEngine: InferenceEngine;
  readonly modelHealthService: ModelHealthService;
  readonly modelMetricsService: ModelMetricsService;
  readonly modelDriftService: ModelDriftService;
  readonly modelSecurityService: ModelSecurityService;
  readonly hfHubService: HfHubService;

  constructor() {
    this.modelRegistry = modelRegistry;
    this.adapterRegistry = adapterRegistry;
    this.modelFactory = modelFactory;
    this.modelConfigService = modelConfigService;
    this.modelScanner = modelScanner;
    this.deviceManager = deviceManager;
    this.memoryManager = memoryManager;
    this.quantizationManager = quantizationManager;
    this.inferenceEngine = inferenceEngine;
    this.modelHealthService = modelHealthService;
    this.modelMetricsService = modelMetricsService;
    this.modelDriftService = modelDriftService;
    this.modelSecurityService = modelSecurityService;
    this.hfHubService = hfHubService;
  }
}

export const aiContainer = new AiContainer();
