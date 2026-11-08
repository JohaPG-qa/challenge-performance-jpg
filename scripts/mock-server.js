import { createServer } from 'node:http';

const host = '127.0.0.1';
const port = Number(process.env.MOCK_PORT || 3000);
const products = new Set();
let nextProductId = 1;

function sendJson(response, statusCode, data) {
  response.writeHead(statusCode, { 'Content-Type': 'application/json' });
  response.end(JSON.stringify(data));
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.on('data', (chunk) => {
      body += chunk;
    });
    request.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
    request.on('error', reject);
  });
}

const server = createServer(async (request, response) => {
  if (request.method !== 'POST') {
    sendJson(response, 404, { message: 'Not found' });
    return;
  }

  let body;
  try {
    body = await readJson(request);
  } catch {
    sendJson(response, 400, { message: 'Invalid JSON body' });
    return;
  }

  if (request.url === '/auth/login') {
    if (body.username !== 'mock-user' || body.password !== 'mock-password') {
      sendJson(response, 401, { message: 'Invalid mock credentials' });
      return;
    }
    sendJson(response, 200, { accessToken: 'local-mock-jwt' });
    return;
  }

  if (request.url === '/products/add') {
    if (request.headers.authorization !== 'Bearer local-mock-jwt') {
      sendJson(response, 401, { message: 'Unauthorized' });
      return;
    }
    if (!request.headers['content-type']?.includes('application/json')) {
      sendJson(response, 415, { message: 'Content-Type must be application/json' });
      return;
    }
    if (typeof body.title !== 'string' || typeof body.price !== 'number') {
      sendJson(response, 400, { message: 'A title and numeric price are required' });
      return;
    }
    if (products.has(body.title)) {
      sendJson(response, 409, { message: 'Product title must be unique' });
      return;
    }

    products.add(body.title);
    sendJson(response, 201, { id: nextProductId++, ...body });
    return;
  }

  sendJson(response, 404, { message: 'Not found' });
});

server.listen(port, host, () => {
  console.log(`Local mock API listening at http://${host}:${port}`);
});