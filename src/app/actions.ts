'use server';

import { analyzeImage, identifyIngredients, analyzeFood, FoodAnalysis, IdentificationResult, AnalysisGoal } from "@/lib/vision";

// Legacy single-step action (can be removed later)
export async function uploadFoodImage(formData: FormData): Promise<FoodAnalysis | { error: string }> {
  const file = formData.get("image") as File;
  if (!file) return { error: "No image provided" };

  const base64 = await fileToBase64(file);

  try {
    const analysis = await analyzeImage(base64);
    return analysis;
  } catch (e: any) {
    console.error("Vision Error:", e);
    return { error: e.message || "Failed to analyze image." };
  }
}

// Step 1: Identify
export async function identifyFoodAction(formData: FormData): Promise<IdentificationResult | { error: string }> {
  const file = formData.get("image") as File;
  if (!file) return { error: "No image provided" };

  const base64 = await fileToBase64(file);

  try {
    return await identifyIngredients(base64);
  } catch (e: any) {
    console.error("Identification Error:", e);
    return { error: e.message || "Failed to identify ingredients." };
  }
}

// Step 2: Analyze with Context
export async function analyzeFoodAction(
  formData: FormData, 
  userContext: string, 
  goal: AnalysisGoal
): Promise<FoodAnalysis | { error: string }> {
  const file = formData.get("image") as File;
  if (!file) return { error: "No image provided" };

  const base64 = await fileToBase64(file);

  try {
    return await analyzeFood(base64, userContext, goal);
  } catch (e: any) {
    console.error("Analysis Error:", e);
    return { error: e.message || "Failed to analyze food." };
  }
}

async function fileToBase64(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return buffer.toString("base64");
}
