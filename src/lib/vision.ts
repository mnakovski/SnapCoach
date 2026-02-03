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

  // Trying user-suggested model name
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `
    Analyze this food image. Return ONLY raw JSON (no markdown).
    Format:
    {
      "food_name": "string",
      "calories_approx": number,
      "macros": { "protein": number, "carbs": number, "fat": number },
      "health_score_1_to_10": number,
      "coach_tip": "short vibe-coded advice (direct, punchy, like a gym bro coach)"
    }
  `;

  // Strip prefix if present (e.g. "data:image/jpeg;base64,")
  const cleanBase64 = base64Image.split(',').pop() || base64Image;

  try {
    const result = await model.generateContent([
      prompt,
      { inlineData: { data: cleanBase64, mimeType: "image/jpeg" } },
    ]);

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
