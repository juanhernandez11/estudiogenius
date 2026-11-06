import type { ExplanationStyle, Note, QuizQuestion, StudyQuestion } from "../types";
import { auth } from "../firebase";

const groqRequest = async (prompt: string, jsonMode = false): Promise<string> => {
  const user = auth.currentUser;
  if (!user) throw new Error('Debes iniciar sesión para usar las funciones de IA.');

  const token = await user.getIdToken();
  const response = await fetch('/api/groq', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt, jsonMode }),
  });
  const data = await response.json();

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('⏳ Límite de uso alcanzado. Espera un momento e intenta de nuevo.');
    }
    throw new Error(data?.error || 'Error al conectar con Groq.');
  }

  return data.content || '';
};

export const summarizeNote = async (content: string): Promise<string> => {
  const result = await groqRequest(
    `Resume el siguiente apunte de estudio en español. Hazlo conciso, utilizando viñetas si es necesario, ideal para repasar rápidamente antes de un examen:\n\n${content}`
  );
  return result || 'No se pudo generar el resumen.';
};

export const generateQuiz = async (content: string): Promise<QuizQuestion[]> => {
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

export const generateStudyQuestions = async (
  notes: Pick<Note, 'id' | 'title' | 'subject' | 'content'>[],
  questionsPerNote: number
): Promise<StudyQuestion[]> => {
  const promptNotes = notes.map(note => ({
    id: note.id,
    title: note.title,
    subject: note.subject,
    content: note.content.substring(0, 2500),
  }));
  const result = await groqRequest(
    `Crea exactamente ${questionsPerNote} preguntas de opción múltiple por cada apunte recibido. Deben evaluar comprensión y recuerdo, no detalles irrelevantes.
Responde únicamente JSON válido con esta estructura:
{"questions":[{"sourceNoteId":"ID exacto del apunte","question":"...","options":["A","B","C","D"],"correctAnswerIndex":0,"explanation":"..."}]}
Cada sourceNoteId debe coincidir exactamente con uno de los IDs recibidos.
Apuntes: ${JSON.stringify(promptNotes)}`,
    true
  );

  const parsed = JSON.parse(result) as { questions?: StudyQuestion[] };
  const noteIds = new Set(notes.map(note => note.id));
  const questions = Array.isArray(parsed.questions)
    ? parsed.questions.filter(question =>
      noteIds.has(question.sourceNoteId) &&
      typeof question.question === 'string' &&
      question.question.length <= 2000 &&
      Array.isArray(question.options) &&
      question.options.length === 4 &&
      question.options.every(option => typeof option === 'string' && option.length <= 500) &&
      Number.isInteger(question.correctAnswerIndex) &&
      question.correctAnswerIndex >= 0 &&
      question.correctAnswerIndex < question.options.length &&
      typeof question.explanation === 'string' &&
      question.explanation.length <= 2000
    )
    : [];

  if (!questions.length) throw new Error('No se pudieron crear preguntas con los apuntes seleccionados.');
  return questions;
};

export const explainConcept = async (
  concept: string,
  context: string,
  style: ExplanationStyle = 'simple'
): Promise<string> => {
  const styleInstructions: Record<ExplanationStyle, string> = {
    simple: 'Usa palabras sencillas y frases cortas.',
    analogy: 'Explícalo mediante una analogía cotidiana y aclara dónde deja de aplicar la analogía.',
    example: 'Usa un ejemplo práctico resuelto paso a paso.',
    steps: 'Divídelo en pasos numerados, de lo más básico a lo más avanzado.',
    socratic: 'Guía al estudiante con preguntas breves y pistas, sin revelar todo de golpe.',
  };
  const result = await groqRequest(
    `Explica el concepto "${concept}" para un estudiante. ${styleInstructions[style]} Basa la respuesta en este apunte: "${context.substring(0, 1000)}..."`
  );
  return result || 'No se pudo generar la explicación.';
};
