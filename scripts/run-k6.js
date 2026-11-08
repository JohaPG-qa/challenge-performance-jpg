import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseEnv } from 'node:util';
import { generatePdfReport } from './pdf-report.js';

const profile = process.argv[2];
if (!['smoke', '50', '100'].includes(profile)) {
  console.error('Choose smoke, 50, or 100.');
  process.exit(2);
}

const localEnvironment = existsSync('.env') ? parseEnv(readFileSync('.env', 'utf8')) : {};
const environment = { ...process.env };
for (const name of ['BASE_URL', 'K6_USERNAME', 'K6_PASSWORD']) {
  if (environment[name] === undefined && localEnvironment[name] !== undefined) {
    environment[name] = localEnvironment[name];
  }
}
const baseUrl = (environment.BASE_URL || '').trim();
if (!baseUrl || !environment.K6_USERNAME || !environment.K6_PASSWORD) {
  console.error('Set BASE_URL, K6_USERNAME and K6_PASSWORD in .env or the environment.');
  process.exit(2);
}

let target;
try {
  const parsedUrl = new URL(baseUrl);
  target = `${parsedUrl.origin}${parsedUrl.pathname.replace(/\/+$/, '')}/products/add`;
} catch {
  console.error('BASE_URL must be a valid URL.');
  process.exit(2);
}

const startedAt = new Date().toISOString();
const timestamp = startedAt.replace(/[-:]/g, '').slice(0, 15).replace('T', '-');
const runName = profile === 'smoke' ? 'smoke' : `${profile}tps`;
const reportBase = `reports/results-${runName}-${timestamp}-${randomUUID().slice(0, 8)}`;
const temporaryDirectory = mkdtempSync(join(tmpdir(), 'k6-report-'));
const temporarySummary = join(temporaryDirectory, 'summary.json');
let exitCode = 1;

try {
  const args = ['run', '--include-system-env-vars', '-e', `BASE_URL=${baseUrl}`];
  if (profile === 'smoke') {
    args.push('-e', 'SMOKE_ITERATIONS=100');
  } else {
    args.push('-e', 'SMOKE_ITERATIONS=0', '-e', `TPS=${profile}`);
  }
  args.push('--summary-export', temporarySummary, 'tests/products-add.js');

  const result = spawnSync(environment.K6_BIN || 'k6', args, { env: environment, stdio: 'inherit' });
  if (result.error) {
    console.error(`Could not start k6: ${result.error.message}`);
  }
  exitCode = result.status ?? 1;

  let summary = null;
  if (existsSync(temporarySummary)) {
    summary = JSON.parse(readFileSync(temporarySummary, 'utf8'));
    delete summary.setup_data;
  }

  mkdirSync('reports', { recursive: true });
  if (summary) {
    writeFileSync(`${reportBase}.json`, JSON.stringify(summary, null, 2), { flag: 'wx', mode: 0o600 });
    console.log(`JSON report: ${reportBase}.json`);
  }
  await generatePdfReport({ summary, profile, target, startedAt, exitCode, outputPath: `${reportBase}.pdf` });
  console.log(`PDF report: ${reportBase}.pdf`);
} catch (error) {
  console.error(`Could not generate the report: ${error.message}`);
  if (exitCode === 0) exitCode = 1;
} finally {
  rmSync(temporaryDirectory, { recursive: true, force: true });
}
process.exitCode = exitCode;