import http from 'k6/http';
import { check, fail } from 'k6';

export function authenticate(baseUrl, username, password) {
  if (!username || !password) {
    fail('Set K6_USERNAME and K6_PASSWORD.');
  }

  const response = http.post(
    `${baseUrl}/auth/login`,
    JSON.stringify({ username, password, expiresInMins: 30 }),
    {
      headers: { 'Content-Type': 'application/json' },
      tags: { endpoint: 'auth-login' },
    },
  );

  if (!check(response, { 'login returns HTTP 200': (result) => result.status === 200 })) {
    fail(`Login failed with HTTP ${response.status}.`);
  }

  let body;
  try {
    body = response.json();
  } catch {
    fail('Login returned invalid JSON.');
  }
  const token = body.accessToken || body.token;
  if (typeof token !== 'string' || token.length === 0) {
    fail('Login response did not contain a valid token.');
  }
  return token;
}