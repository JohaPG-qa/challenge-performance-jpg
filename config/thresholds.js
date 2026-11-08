export const thresholds = {
  product_post_duration: ['p(95)<2000'],
  product_http_errors: ['count==0'],
  product_post_failure_rate: ['rate<0.01'],
  product_posts_successful: ['count>0'],
  'http_req_failed{endpoint:product-add}': ['rate<0.01'],
  checks: ['rate>0.99'],
  dropped_iterations: ['count==0'],
};