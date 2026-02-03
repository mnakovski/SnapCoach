import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.SNAP_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export interface IdentificationResult {
  detected_ingredients: string[];
  missing_info_question: string | null;
  confidence_level: "high" | "medium" | "low";
}

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

export type AnalysisGoal = "health" | "cooking" | "roast";

export async function identifyIngredients(base64Image: string): Promise<IdentificationResult> {
  if (!genAI) throw new Error("Missing SNAP_API_KEY");
  
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  
  const prompt = `
    Analyze this food image. Your job is to IDENTIFY visible ingredients.
    Output language: Macedonian (MKD).
    
    Return ONLY raw JSON. Format:
    {
      "detected_ingredients": ["string (in MKD)", "string (in MKD)"],
      "missing_info_question": "string (Ask ONE short question in Macedonian if something is ambiguous, e.g. 'Дали има сос?' or 'Дали е ова пилешко?'. If everything is 100% clear, return null)",
      "confidence_level": "high" | "medium" | "low"
    }
  `;

  // Strip prefix if present
  const cleanBase64 = base64Image.split(',').pop() || base64Image;

  try {
    const result = await model.generateContent([
      prompt,
      { inlineData: { data: cleanBase64, mimeType: "image/jpeg" } },
    ]);
    const responseText = result.response.text();
    const cleanJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleanJson);
  } catch (error: any) {
    console.error("Identification Failed:", error);
    throw new Error(error?.message || "Failed to identify ingredients");
  }
}

export async function analyzeFood(
  base64Image: string, 
  userContext: string, 
  goal: AnalysisGoal
): Promise<FoodAnalysis> {
  if (!genAI) throw new Error("Missing SNAP_API_KEY");

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  let toneInstruction = "";
  if (goal === "health") toneInstruction = "Focus on macro balance, glycemic index, and habit improvement. Use emojis: ❌ (Reduce/Remove), ✅ (Good), ➕ (Add). Structure the advice as a list of these emojis followed by short Macedonian text.";
  if (goal === "cooking") toneInstruction = "Focus on flavor profile, cooking technique, and potential ingredient swaps. Structure as: 👨‍🍳 (Steps), 🧂 (Seasoning), 🔥 (Tips). Output in Macedonian.";
  if (goal === "roast") toneInstruction = "Be funny, sarcastic, and roast the plating or food choice. Keep it lighthearted but spicy. Output in Macedonian slang/informal.";

  const prompt = `
    Analyze this food image. The user has confirmed: ${userContext}.
    Goal: ${goal}.
    Tone: ${toneInstruction}
    Output language: Macedonian (MKD).
    
    Return ONLY raw JSON. Format:
    {
      "food_name": "string (in MKD)",
      "calories_approx": number,
      "macros": { "protein": number, "carbs": number, "fat": number },
      "health_score_1_to_10": number,
      "coach_tip": "string (The advice/roast itself, formatted with emojis as requested)"
    }
  `;

  const cleanBase64 = base64Image.split(',').pop() || base64Image;

  try {
    const result = await model.generateContent([
      prompt,
      { inlineData: { data: cleanBase64, mimeType: "image/jpeg" } },
    ]);
    const responseText = result.response.text();
    const cleanJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleanJson);
  } catch (error: any) {
    console.error("Analysis Failed:", error);
    throw new Error(error?.message || "Failed to analyze food");
  }
}

// Deprecated single-step function (keeping for backward compat until migration done)
export async function analyzeImage(base64Image: string): Promise<FoodAnalysis> {
  return analyzeFood(base64Image, "No specific context provided", "health");
}
