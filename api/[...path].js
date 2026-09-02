// Serverless proxy do Vercel: encaminha /api/* para o ERP da Nobug Labs.
// Executa do lado do servidor, evitando mixed content e CORS no navegador.

const TARGET_BASE = (process.env.ERP_BASE_URL || 'http://3.92.235.72').replace(/\/+$/, '');

function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (c) => chunks.push(c));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}

const HOP_HEADERS = new Set([
  'host',
  'connection',
  'content-length',
  'transfer-encoding',
  'accept-encoding',
  'upgrade',
]);

export default async function handler(req, res) {
  // Em Vercel, req.url para api/[...path] inclui o caminho após o prefixo /api.
  const requestUrl = req.url || '/';
  const target = `${TARGET_BASE}/api${requestUrl}`;

  const forwardHeaders = {};
  for (const [key, value] of Object.entries(req.headers || {})) {
    const lk = key.toLowerCase();
    if (HOP_HEADERS.has(lk)) continue;
    forwardHeaders[key] = value;
  }

  let body;
  if (!['GET', 'HEAD'].includes((req.method || 'GET').toUpperCase())) {
    body = await streamToBuffer(req);
  }

  try {
    const upstream = await fetch(target, {
      method: req.method || 'GET',
      headers: forwardHeaders,
      body,
      redirect: 'manual',
    });

    const buffer = Buffer.from(await upstream.arrayBuffer());

    res.statusCode = upstream.status;
    upstream.headers.forEach((value, key) => {
      if (HOP_HEADERS.has(key)) return;
      try {
        res.setHeader(key, value);
      } catch {}
    });
    res.setHeader('access-control-allow-origin', '*');
    res.end(buffer);
  } catch (error) {
    res.statusCode = 502;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ detail: `Proxy não conseguiu contactar o ERP: ${error.message}` }));
  }
}
