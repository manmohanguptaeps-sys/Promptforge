import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY is missing");
}

const ai = new GoogleGenAI({
  apiKey,
});

export async function generateAIResponse(prompt: string) {
  const models = [
    "gemini-3.8-flash",
    "gemini-3.5-flash",
    "gemini-3.5-flash-lite",
  ];

  let lastError: unknown;

  for (const model of models) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
      });

      return response.text ?? "";
    } catch (error) {
      console.error(`Model ${model} failed:`, error);
      lastError = error;
    }
  }

  throw lastError ?? new Error("All AI models failed");
}