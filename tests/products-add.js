
import execution from 'k6/execution';
import { createScenarios } from '../config/scenarios.js';
import { thresholds } from '../config/thresholds.js';
import { authenticate } from '../services/auth.service.js';
import { createProduct } from '../services/products.service.js';
import { createProductTitle, createRunId } from '../utils/data-generator.js';

// Configuración
const baseUrl = (
  __ENV.BASE_URL || ''
).trim().replace(/\/+$/, '');

if (!baseUrl) {
  throw new Error('Set BASE_URL to the target environment.');
}

const targetTps = Number(__ENV.TPS || 50);
const smokeIterations = Number(__ENV.SMOKE_ITERATIONS || 0);
const isSmoke = smokeIterations > 0;

const isLocalTarget =
  /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(baseUrl);

const isDummyJson =
  /^https:\/\/(www\.)?dummyjson\.com$/i.test(baseUrl);

const isDummyJsonSmoke =
  isDummyJson && isSmoke && smokeIterations === 1;

// Validación de parámetros
if (
  !Number.isInteger(smokeIterations) ||
  smokeIterations < 0 ||
  smokeIterations > 1000
) {
  throw new Error(
    'SMOKE_ITERATIONS must be an integer between 0 and 1000.'
  );
}

if (
  !isSmoke &&
  (!Number.isInteger(targetTps) || ![50, 100].includes(targetTps))
) {
  throw new Error('TPS must be either 50 or 100.');
}

// Protección del servicio público
if (
  isDummyJson &&
  !isDummyJsonSmoke &&
  __ENV.LOAD_TEST_AUTHORIZED !== 'yes'
) {
  throw new Error(
    'Load testing DummyJSON requires explicit operator authorization.'
  );
}

// Autorización para ambientes remotos
if (
  !isLocalTarget &&
  !isDummyJsonSmoke &&
  __ENV.LOAD_TEST_AUTHORIZED !== 'yes'
) {
  throw new Error(
    'Set LOAD_TEST_AUTHORIZED=yes only after receiving ' +
    'authorization for the remote environment.'
  );
}

if (isSmoke && !isLocalTarget && !isDummyJsonSmoke) {
  throw new Error(
    'Smoke mode is restricted to localhost or ' +
    'one DummyJSON functional request.'
  );
}

// Escenarios
export const options = {
  scenarios: createScenarios(targetTps, smokeIterations),
  thresholds,
};

export function setup() {
  const token = authenticate(baseUrl, __ENV.K6_USERNAME, __ENV.K6_PASSWORD);
  return { token, runId: createRunId() };
}

export default function (data) {
  const title = createProductTitle(data.runId, execution.vu.idInTest, execution.vu.iterationInInstance);
  createProduct(baseUrl, data.token, title);
}