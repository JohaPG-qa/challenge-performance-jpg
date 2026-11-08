import http from 'k6/http';
import { check } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

const productPostsAttempted = new Counter('product_posts_attempted');
const productPostsResponded = new Counter('product_posts_responded');
const productPostsSuccessful = new Counter('product_posts_successful');
const productHttpErrors = new Counter('product_http_errors');
const productStatusCodes = [201, 400, 401, 403, 404, 409, 422, 429, 500, 502, 503];
const productStatusCounters = new Map(
  productStatusCodes.map((statusCode) => [statusCode, new Counter(`product_http_status_${statusCode}`)]),
);
const productHttpStatusOther = new Counter('product_http_status_other');
const productPostFailureRate = new Rate('product_post_failure_rate');
const productPostDuration = new Trend('product_post_duration', true);

export function createProduct(baseUrl, token, title) {
  productPostsAttempted.add(1);
  const response = http.post(
    `${baseUrl}/products/add`,
    JSON.stringify({ title, price: 1.23 }),
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      tags: { endpoint: 'product-add' },
    },
  );

  productPostDuration.add(response.timings.duration);
  const statusCounter = productStatusCounters.get(response.status) || productHttpStatusOther;
  statusCounter.add(1);
  if (response.status > 0) {
    productPostsResponded.add(1);
  }
  if (response.status < 200 || response.status >= 400) {
    productHttpErrors.add(1);
  }

  let product;
  try {
    product = response.json();
  } catch {
    product = {};
  }
  const validProductResponse = check(response, {
    'product creation returns HTTP 201': (result) => result.status === 201,
    'response title matches request': () => product.title === title,
    'response includes a numeric product ID': () => Number.isFinite(product.id),
  });
  productPostFailureRate.add(!validProductResponse);
  if (validProductResponse) {
    productPostsSuccessful.add(1);
  }
}