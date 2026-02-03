import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.SNAP_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export interface FoodAnalysis {
  food_name: string;
  calories_approx: number;
  macros: {
    protein: number;
    carbs: number;
    fat: number;
  };
  health_score_1_to_10: number;
  coach_tip: string;
}

export async function analyzeImage(base64Image: string): Promise<FoodAnalysis> {
  if (!genAI) {
    throw new Error("Missing GEMINI_API_KEY");
  }

  // TEST MODE: Switch to text-only model to verify API Key access
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  try {
    // IGNORE THE IMAGE FOR A SECOND. Just check if the key works.
    const result = await model.generateContent("Return this JSON: {\"food_name\": \"API TEST PASSED\", \"calories_approx\": 0, \"macros\": {\"protein\":0,\"carbs\":0,\"fat\":0}, \"health_score_1_to_10\": 10, \"coach_tip\": \"Key works! Now we debug Vision.\"}");

    const responseText = result.response.text();
    
    // Clean up markdown code blocks if present
    const cleanJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    
    return JSON.parse(cleanJson);
  } catch (error: any) {
    console.error("Gemini Analysis Failed:", error);
    // Return specific error for debugging
    throw new Error(error?.message || JSON.stringify(error) || "Unknown Gemini error");
  }
}
