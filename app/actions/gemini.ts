"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

// User requested "gemini-2.5-flash-live". 
// If that failes, we might need a fallback, but for now we trust the user.
// Standard models are gemini-1.5-flash. We will try the requested one.
const MODEL_NAME = "gemini-2.5-flash";
// Fallback if the above doesn't exist in the public API yet:
const FALLBACK_MODEL = "gemini-2.5-flash";

export async function getGeminiSuggestions(
    patientData: any,
    isBangla: boolean
): Promise<{
    tests: string[];
    advice: string[];
    medicines: Array<{ name: string; dosage: string; duration: string; instruction: string }>;
    error?: string
}> {
    try {
        if (!apiKey) {
            return { tests: [], advice: [], medicines: [], error: "API Key missing" };
        }

        const model = genAI.getGenerativeModel({ model: MODEL_NAME });
        // Note: If 2.5 throws, we might need to catch and retry with 1.5, 
        // but let's assume valid access for now or handle gracefully.

        // Construct Prompt
        const age = patientData?.age || "Unknown";
        const gender = patientData?.gender || "Unknown";
        const complaints = patientData?.complaints || "None";
        const history = patientData?.history || "None";
        const diagnosis = patientData?.diagnosis || "None";

        const languageInstruction = isBangla
            ? "Respond in Bengali (Bangla) for Advice and Instructions. Medicine Names should be in English."
            : "Respond in English.";

        const prompt = `
            You are a helpful medical assistant in Bangladesh.
            Patient Info:
            - Age: ${age}
            - Gender: ${gender}
            - Chief Complaints: ${complaints}
            - History: ${history}
            - Provisional Diagnosis: ${diagnosis}

            Task:
            1. Suggest relevant diagnostic tests available in Bangladesh.
                - Max 10 tests total.
                - 1 test per line.
            2. Suggest general health notes/advice (e.g. hydration, diet, rest).
                - Min 3, Max 4 items.
                - Brief and clear.
            3. Suggest 3-5 relevant medicines (Brand names common in Bangladesh or Generics).
                - Provide Dosage (e.g., '1+0+1', '1+1+1', '0+0+1', '10mg').
                - Provide Duration (e.g. '7 Days', '1 Month').
                - Provide Instruction (e.g. 'After Meal', 'Before Meal').
            
            ${languageInstruction}

            Output Format (Strict JSON):
            {
                "tests": ["test1", "test2"...],
                "advice": ["note1", "note2"...],
                "medicines": [
                    { "name": "Med Name", "dosage": "1+0+1", "duration": "5 Days", "instruction": "After Meal" },
                    ...
                ]
            }
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Parse JSON
        // Cleanup markdown code blocks if present
        const jsonString = text.replace(/```json/g, "").replace(/```/g, "").trim();
        const data = JSON.parse(jsonString);

        return {
            tests: data.tests || [],
            advice: data.advice || [],
            medicines: data.medicines || []
        };

    } catch (error: any) {
        console.error("Gemini AI Error:", error);
        // Fallback or specific error handling
        return {
            tests: [],
            advice: [],
            medicines: [],
            error: error.message || "Failed to generate suggestions"
        };
    }
}
