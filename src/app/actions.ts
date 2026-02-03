'use server';

import { analyzeImage, FoodAnalysis } from "@/lib/vision";

export async function uploadFoodImage(formData: FormData): Promise<FoodAnalysis | { error: string }> {
  const file = formData.get("image") as File;

  if (!file) {
    return { error: "No image provided" };
  }

  // Convert file to base64
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const base64 = buffer.toString("base64");

  try {
    const analysis = await analyzeImage(base64);
    return analysis;
  } catch (e: any) {
    console.error("Vision Error:", e);
    // Return the actual error message for debugging
    return { error: e.message || "Failed to analyze image." };
  }
}
