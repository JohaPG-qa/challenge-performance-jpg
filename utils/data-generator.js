import { randomBytes } from 'k6/crypto';

export function createRunId() {
  return Array.from(new Uint8Array(randomBytes(16)))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export function createProductTitle(runId, virtualUserId, iteration) {
  return `k6-${runId}-${virtualUserId}-${iteration}`;
}