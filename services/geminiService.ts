import { QuizQuestion } from "../types";

const apiKey = import.meta.env.VITE_GROQ_API_KEY;
const model = 'llama-3.1-8b-instant';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

if (!apiKey) {
  console.error('❌ VITE_GROQ_API_KEY no está detectada por Vite.');
}

const groqRequest = async (prompt: string, jsonMode = false): Promise<string> => {
  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      ...(jsonMode && { response_format: { type: 'json_object' } }),
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    if (response.status === 429) {
      throw new Error('⏳ Límite de uso alcanzado. Espera un momento e intenta de nuevo.');
    }
    throw new Error(err?.error?.message || 'Error al conectar con Groq.');
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
};

export const summarizeNote = async (content: string): Promise<string> => {
  if (!apiKey) throw new Error('API Key de Groq no configurada. Revisa tu archivo .env.local');

  const result = await groqRequest(
    `Resume el siguiente apunte de estudio en español. Hazlo conciso, utilizando viñetas si es necesario, ideal para repasar rápidamente antes de un examen:\n\n${content}`
  );
  return result || 'No se pudo generar el resumen.';
};

export const generateQuiz = async (content: string): Promise<QuizQuestion[]> => {
  if (!apiKey) throw new Error('API Key de Groq no configurada. Revisa tu archivo .env.local');

  const result = await groqRequest(
    `Basado en el siguiente texto de estudio, genera 3 preguntas de opción múltiple desafiantes.
Responde ÚNICAMENTE con un JSON válido con esta estructura exacta:
{"questions": [{"question": "...", "options": ["A", "B", "C", "D"], "correctAnswerIndex": 0, "explanation": "..."}]}

Texto: "${content.substring(0, 3000)}"`,
    true
  );

  try {
    const parsed = JSON.parse(result);
    return parsed.questions || [];
  } catch {
    return [];
  }
};

export const explainConcept = async (concept: string, context: string): Promise<string> => {
  if (!apiKey) throw new Error('API Key de Groq no configurada. Revisa tu archivo .env.local');

  const result = await groqRequest(
    `Explica el concepto "${concept}" de forma sencilla para un estudiante, basándote en el contexto de este apunte: "${context.substring(0, 1000)}..."`
  );
  return result || 'No se pudo generar la explicación.';
};
