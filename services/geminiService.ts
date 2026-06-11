import { GoogleGenAI, Type } from "@google/genai";
import { QuizQuestion } from "../types";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const model = import.meta.env.VITE_GEMINI_MODEL || 'gemini-3.5-flash';

if (!apiKey) {
  console.error('❌ VITE_GEMINI_API_KEY no está detectada por Vite.');
} else {
  // Log de diagnóstico seguro para producción
  const isFormatValid = apiKey.startsWith('AIza');
  console.log(`[Gemini Auth] Key detectada: ${isFormatValid ? '✅ Formato correcto (AIza...)' : '❌ Formato sospechoso'}. Longitud: ${apiKey.length}`);
  console.log(`[Gemini Model] Modelo configurado: ${model}`);
}

const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const summarizeNote = async (content: string): Promise<string> => {
  if (!ai) throw new Error("API Key de Gemini no configurada. Revisa tu archivo .env.local");

  try {
    const response = await ai.models.generateContent({
      model,
      contents: `Resume el siguiente apunte de estudio en español. Hazlo conciso, utilizando viñetas si es necesario, ideal para repasar rápidamente antes de un examen: \n\n${content}`,
    });
    return response.text || "No se pudo generar el resumen.";
  } catch (error) {
    console.error("Error summarizing note:", error);
    throw new Error("Error al conectar con Gemini para resumir.");
  }
};

export const generateQuiz = async (content: string): Promise<QuizQuestion[]> => {
  if (!ai) throw new Error("API Key de Gemini no configurada. Revisa tu archivo .env.local");

  try {
    const response = await ai.models.generateContent({
      model,
      contents: `Basado en el siguiente texto de estudio, genera 3 preguntas de opción múltiple desafiantes para poner a prueba el conocimiento del estudiante.
      
      Texto: "${content.substring(0, 3000)}"
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                description: "Una lista de 4 opciones posibles"
              },
              correctAnswerIndex: { 
                type: Type.INTEGER, 
                description: "El índice (0-3) de la respuesta correcta en el array de opciones" 
              },
              explanation: { type: Type.STRING, description: "Breve explicación de por qué es la respuesta correcta" }
            },
            required: ["question", "options", "correctAnswerIndex", "explanation"]
          }
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) return [];
    
    return JSON.parse(jsonText) as QuizQuestion[];
  } catch (error) {
    console.error("Error generating quiz:", error);
    throw new Error("Error al generar el quiz con Gemini.");
  }
};

export const explainConcept = async (concept: string, context: string): Promise<string> => {
    if (!ai) throw new Error("API Key de Gemini no configurada. Revisa tu archivo .env.local");
    
    try {
        const response = await ai.models.generateContent({
            model,
            contents: `Explica el concepto "${concept}" de forma sencilla para un estudiante, basándote en el contexto de este apunte: "${context.substring(0, 1000)}..."`
        });
        return response.text || "No se pudo generar la explicación.";
    } catch (error) {
        console.error("Error explaining concept", error);
        throw error;
    }
};