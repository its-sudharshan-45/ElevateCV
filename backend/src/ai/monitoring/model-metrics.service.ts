import { logger } from '../../config/logger.js';

export interface ModelMetricRecord {
  requestId?: string;
  modelId: string;
  operation: string;
  latencyMs: number;
  device: string;
  success: boolean;
  timestamp: string;
  memoryUsageBytes?: number;
  inputTokens?: number;
  outputTokens?: number;
}

export interface AggregatedModelMetrics {
  modelId: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  successRate: number;
  avgLatencyMs: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
}

export class ModelMetricsService {
  private readonly records: ModelMetricRecord[] = [];
  private readonly maxStoredRecords = 1000;

  recordMetric(record: Omit<ModelMetricRecord, 'timestamp'>): void {
    const fullRecord: ModelMetricRecord = {
      ...record,
      timestamp: new Date().toISOString(),
    };

    this.records.push(fullRecord);
    if (this.records.length > this.maxStoredRecords) {
      this.records.shift();
    }

    // Structured logging without sensitive payload contents
    logger.info(
      {
        requestId: record.requestId,
        modelId: record.modelId,
        operation: record.operation,
        latencyMs: record.latencyMs,
        device: record.device,
        success: record.success,
      },
      'AI Model Inference Metric',
    );
  }

  getMetricsForModel(modelId: string): AggregatedModelMetrics {
    const filtered = this.records.filter((r) => r.modelId === modelId);
    if (filtered.length === 0) {
      return {
        modelId,
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        successRate: 100,
        avgLatencyMs: 0,
        p50LatencyMs: 0,
        p95LatencyMs: 0,
        p99LatencyMs: 0,
      };
    }

    const totalRequests = filtered.length;
    const successfulRequests = filtered.filter((r) => r.success).length;
    const failedRequests = totalRequests - successfulRequests;
    const successRate = Math.round((successfulRequests / totalRequests) * 100);

    const latencies = filtered.map((r) => r.latencyMs).sort((a, b) => a - b);
    const sumLatency = latencies.reduce((a, b) => a + b, 0);
    const avgLatencyMs = Math.round(sumLatency / totalRequests);

    const p50LatencyMs = latencies[Math.floor(latencies.length * 0.5)] || 0;
    const p95LatencyMs = latencies[Math.floor(latencies.length * 0.95)] || 0;
    const p99LatencyMs = latencies[Math.floor(latencies.length * 0.99)] || 0;

    return {
      modelId,
      totalRequests,
      successfulRequests,
      failedRequests,
      successRate,
      avgLatencyMs,
      p50LatencyMs,
      p95LatencyMs,
      p99LatencyMs,
    };
  }

  getAllMetrics(): AggregatedModelMetrics[] {
    const modelIds = Array.from(new Set(this.records.map((r) => r.modelId)));
    return modelIds.map((id) => this.getMetricsForModel(id));
  }
}

export const modelMetricsService = new ModelMetricsService();
