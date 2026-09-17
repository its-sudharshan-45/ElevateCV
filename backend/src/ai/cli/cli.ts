#!/usr/bin/env node
// cspell:ignore upskilr
import 'dotenv/config';
import path from 'node:path';

async function run(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];
  const subcommand = args[1];
  const param = args[2];

  if (!command || command === 'help') {
    printUsage();
    return;
  }

  if (command === 'models') {
    await handleModelsCommand(subcommand, param);
  } else {
    console.error(`Unknown command: ${command}`);
    printUsage();
    process.exit(1);
  }
}

async function handleModelsCommand(subcommand?: string, param?: string): Promise<void> {
  const { modelRegistry } = await import('../registry/model-registry.js');
  const { modelScanner } = await import('../discovery/model-scanner.js');
  const { modelHealthService } = await import('../monitoring/model-health.service.js');
  const { modelDriftService } = await import('../monitoring/model-drift.service.js');
  const { modelSecurityService } = await import('../security/model-security.service.js');

  switch (subcommand) {
    case 'list': {
      const manifests = modelRegistry.getAll();
      printSeparator();
      console.log('UpSkilr Model Inventory\n');
      printSeparator();
      for (const m of manifests) {
        console.log(`\n${m.id}`);
        console.log(`  Provider:  ${m.hub.provider}`);
        console.log(`  Model ID:  ${m.hub.modelId}`);
        console.log(`  Library:   ${m.architecture.library}`);
        console.log(`  Task:      ${m.architecture.task}`);
        console.log(`  Modality:  ${m.architecture.modality}`);
        console.log(`  Revision:  ${m.hub.revision || 'main'}`);
        console.log(`  Status:    ${m.status}`);
        console.log(`  Allowlist: ${m.security.allowlisted ? '✅' : '❌'}`);
      }
      printSeparator();
      console.log(`\n${manifests.length} model(s) registered\n`);
      break;
    }

    case 'inspect': {
      if (!param) {
        console.error('Usage: upskilr models inspect <model-id>');
        process.exit(1);
      }
      const manifest = modelRegistry.get(param);
      console.log('\nModel Details:');
      console.log(JSON.stringify(manifest, null, 2));
      break;
    }

    case 'scan': {
      const rootDir = path.resolve(process.cwd(), '..');
      console.log(`\nScanning codebase for Hugging Face model references in: ${rootDir}\n`);
      const discovered = await modelScanner.scanCodebase(rootDir);

      if (discovered.length === 0) {
        console.log('No Hugging Face model references detected in codebase.\n');
      } else {
        printSeparator();
        for (const d of discovered) {
          console.log(`\nModel: ${d.modelId}`);
          console.log(`  Library: ${d.library}`);
          console.log(`  Task:    ${d.task}`);
          console.log(`  File:    ${d.file}:${d.line}`);
          console.log(`  Instantiated: ${d.isInstantiated ? 'Yes' : 'No'}`);
        }
        printSeparator();
        console.log(`\n${discovered.length} reference(s) found\n`);
      }
      break;
    }

    case 'validate': {
      const manifests = modelRegistry.getAll();
      let allValid = true;
      console.log('\nValidating model manifests...\n');
      for (const m of manifests) {
        const issues: string[] = [];
        if (!m.hub.modelId) issues.push('Missing hub.modelId');
        if (!m.architecture.library) issues.push('Missing architecture.library');
        if (!m.architecture.task) issues.push('Missing architecture.task');
        if (!m.security.allowlisted) issues.push('Not in allowlist');

        if (issues.length > 0) {
          console.log(`❌ ${m.id}: ${issues.join(', ')}`);
          allValid = false;
        } else {
          console.log(`✅ ${m.id}: Valid`);
        }
      }
      console.log('');
      if (!allValid) {
        process.exit(1);
      }
      break;
    }

    case 'health': {
      console.log('\nRunning model health checks...\n');
      const results = await modelHealthService.checkAllModels();
      printSeparator();
      for (const h of results) {
        const icon = h.status === 'Healthy' ? '✅' : h.status === 'Degraded' ? '⚠️ ' : '❌';
        console.log(`${icon}  ${h.modelId}: ${h.status}${h.latencyMs ? ` (${h.latencyMs}ms)` : ''}${h.error ? ` — ${h.error}` : ''}`);
      }
      printSeparator();
      console.log('');
      break;
    }

    case 'sync': {
      console.log('\nSync: Model registry synced with current in-memory manifests. Database writes via migration 015.\n');
      break;
    }

    case 'update-check': {
      console.log('\nChecking for Hugging Face Hub revision updates...\n');
      const driftReports = await modelDriftService.checkAllModelsDrift();
      for (const report of driftReports) {
        if (report.hasHubUpdate) {
          console.log(`⚠️  ${report.modelId}: New Hub revision detected (${report.latestHubSha || 'unknown'}). Manual approval required before upgrade.`);
        } else {
          console.log(`✅ ${report.modelId}: No upstream revision changes.`);
        }
      }
      console.log('');
      break;
    }

    case 'warmup': {
      console.log('\nModel warmup: Models will be initialized on first request (lazy loading). Use load() in your service initialization for eager warmup.\n');
      break;
    }

    case 'security-scan': {
      console.log('\nRunning model security scans...\n');
      const manifests = modelRegistry.getAll();
      for (const m of manifests) {
        const result = await modelSecurityService.runSecurityScan(m);
        const icon = result.isSafe ? '✅' : '❌';
        console.log(`${icon}  ${m.id} (${m.hub.modelId}): ${result.isSafe ? 'Passed' : `Failed — ${result.issues.join(', ')}`}`);
      }
      console.log('');
      break;
    }

    default:
      console.error(`Unknown models subcommand: ${subcommand}`);
      console.log('Available: list, inspect <id>, scan, validate, health, sync, update-check, warmup, security-scan\n');
      process.exit(1);
  }
}

function printSeparator(): void {
  console.log('─'.repeat(60));
}

function printUsage(): void {
  console.log(`
UpSkilr CLI — AI Model Management

Usage:
  npm run upskilr -- models list
  npm run upskilr -- models inspect <id>
  npm run upskilr -- models scan
  npm run upskilr -- models validate
  npm run upskilr -- models health
  npm run upskilr -- models sync
  npm run upskilr -- models update-check
  npm run upskilr -- models warmup
  npm run upskilr -- models security-scan
`);
}

run().catch((err) => {
  console.error('CLI Error:', err instanceof Error ? err.message : err);
  process.exit(1);
});
