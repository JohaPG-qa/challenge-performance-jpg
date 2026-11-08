export function createScenarios(targetTps, smokeIterations) {
  if (smokeIterations > 0) {
    return {
      functional_smoke: {
        executor: 'shared-iterations',
        vus: 1,
        iterations: smokeIterations,
        maxDuration: '1m',
      },
    };
  }

  return {
    [`product_creation_${targetTps}_tps`]: {
      executor: 'constant-arrival-rate',
      rate: targetTps,
      timeUnit: '1s',
      duration: '1m',
      preAllocatedVUs: targetTps,
      maxVUs: targetTps * 2,
    },
  };
}