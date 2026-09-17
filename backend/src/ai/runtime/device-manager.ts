import os from 'node:os';
import { logger } from '../../config/logger.js';
import type { DeviceType } from '../core/model.types.js';

export interface DeviceInfo {
  type: DeviceType;
  name: string;
  isAvailable: boolean;
  totalMemoryBytes?: number;
  freeMemoryBytes?: number;
}

export class DeviceManager {
  private detectedDevices: DeviceInfo[] | null = null;

  detectAvailableDevices(): DeviceInfo[] {
    if (this.detectedDevices) {
      return this.detectedDevices;
    }

    const devices: DeviceInfo[] = [];

    // Check CPU (Always available)
    devices.push({
      type: 'cpu',
      name: `CPU (${os.cpus()[0]?.model || 'Host CPU'}, ${os.cpus().length} cores)`,
      isAvailable: true,
      totalMemoryBytes: os.totalmem(),
      freeMemoryBytes: os.freemem(),
    });

    // Check WebGPU / WASM environment support if available in Node / transformers.js
    const isWebGpuSupported = typeof globalThis !== 'undefined' && 'navigator' in globalThis && 'gpu' in (globalThis as unknown as { navigator: Record<string, unknown> }).navigator;
    if (isWebGpuSupported) {
      devices.push({
        type: 'webgpu',
        name: 'WebGPU Hardware Acceleration',
        isAvailable: true,
      });
    }

    // Check CUDA environment flags (e.g. process.env.CUDA_VISIBLE_DEVICES or ONNX/PyTorch backend)
    const hasCudaFlag = Boolean(process.env.CUDA_VISIBLE_DEVICES && process.env.CUDA_VISIBLE_DEVICES !== '-1');
    if (hasCudaFlag) {
      devices.push({
        type: 'cuda',
        name: `CUDA Device (${process.env.CUDA_VISIBLE_DEVICES})`,
        isAvailable: true,
      });
    }

    this.detectedDevices = devices;
    logger.debug({ devices: devices.map((d) => d.type) }, 'Detected available compute devices');
    return devices;
  }

  resolveTargetDevice(requestedDevice: DeviceType = 'auto'): DeviceType {
    const devices = this.detectAvailableDevices();

    if (requestedDevice === 'auto') {
      const cuda = devices.find((d) => d.type === 'cuda' && d.isAvailable);
      if (cuda) return 'cuda';

      const webgpu = devices.find((d) => d.type === 'webgpu' && d.isAvailable);
      if (webgpu) return 'webgpu';

      const mps = devices.find((d) => d.type === 'mps' && d.isAvailable);
      if (mps) return 'mps';

      return 'cpu';
    }

    const match = devices.find((d) => d.type === requestedDevice && d.isAvailable);
    if (!match) {
      logger.warn(
        { requestedDevice, fallback: 'cpu' },
        'Requested compute device not available. Falling back to CPU.',
      );
      return 'cpu';
    }

    return requestedDevice;
  }
}

export const deviceManager = new DeviceManager();
