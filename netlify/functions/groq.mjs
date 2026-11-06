const jsonResponse = (status, body) => new Response(JSON.stringify(body), {
  status,
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
});

const isValidFirebaseToken = async (token) => {
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
  const firebaseApiKey = process.env.FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY;
  if (!projectId || !firebaseApiKey) return null;

  try {
    const payloadPart = token.split('.')[1];
    if (!payloadPart) return null;

    const payload = JSON.parse(Buffer.from(payloadPart, 'base64url').toString('utf8'));
    if (
      payload.aud !== projectId ||
      payload.iss !== `https://securetoken.google.com/${projectId}` ||
      typeof payload.sub !== 'string' ||
      !payload.sub ||
      typeof payload.exp !== 'number' ||
      payload.exp <= Math.floor(Date.now() / 1000)
    ) return null;

    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(firebaseApiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: token }),
      }
    );
    if (!response.ok) return null;

    const identity = await response.json();
    return identity.users?.[0]?.localId || null;
  } catch {
    return null;
  }
};

export default async (request) => {
  if (request.method !== 'POST') {
    return jsonResponse(405, { error: 'Método no permitido.' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return jsonResponse(503, { error: 'El servicio de IA no está configurado.' });
  }

  const authorization = request.headers.get('authorization') || '';
  const tokenMatch = authorization.match(/^Bearer\s+(.+)$/i);
  if (!tokenMatch) {
    return jsonResponse(401, { error: 'Inicia sesión para usar las funciones de IA.' });
  }

  const userId = await isValidFirebaseToken(tokenMatch[1]);
  if (!userId) {
    return jsonResponse(401, { error: 'La sesión no es válida. Vuelve a iniciar sesión.' });
  }

  let input;
  try {
    const body = await request.text();
    if (body.length > 65536) {
      return jsonResponse(413, { error: 'La solicitud es demasiado grande.' });
    }
    input = JSON.parse(body);
  } catch {
    return jsonResponse(400, { error: 'La solicitud no contiene JSON válido.' });
  }

  if (
    typeof input.prompt !== 'string' ||
    input.prompt.length === 0 ||
    input.prompt.length > 50000 ||
    (input.jsonMode !== undefined && typeof input.jsonMode !== 'boolean')
  ) {
    return jsonResponse(400, { error: 'La solicitud no tiene un formato válido.' });
  }

  let response;
  try {
    response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || 'openai/gpt-oss-20b',
        messages: [{ role: 'user', content: input.prompt }],
        ...(input.jsonMode && { response_format: { type: 'json_object' } }),
        temperature: 0.7,
      }),
    });
  } catch {
    return jsonResponse(502, { error: 'No se pudo conectar con Groq.' });
  }

  if (response.status === 429) {
    return jsonResponse(429, { error: 'Límite de uso alcanzado. Espera un momento e intenta de nuevo.' });
  }
  if (!response.ok) {
    return jsonResponse(502, { error: `Groq rechazó la solicitud (HTTP ${response.status}).` });
  }

  try {
    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;
    if (typeof content !== 'string') {
      return jsonResponse(502, { error: 'Groq respondió sin contenido.' });
    }
    return jsonResponse(200, { content });
  } catch {
    return jsonResponse(502, { error: 'La respuesta de Groq no fue válida.' });
  }
};

export const config = { path: '/api/groq' };
