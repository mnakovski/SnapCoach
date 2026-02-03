# Mini-Project: The Vision Test 👁️

**Goal:** Prove we can get JSON data from a food image.

## Setup
1.  Add a food image to `snapcoach/public/test-food.jpg`.
2.  Get a Google Gemini API Key.
3.  Run the script.

## Mock Mode (Development)
We have a mock service at `src/lib/vision-mock.ts` that returns fake data.
This allows UI development without an API key.

## Real Vision (Production)
To switch to real AI:
1.  Get a Google Gemini API Key.
2.  Set `GOOGLE_API_KEY` in `.env.local`.
3.  Swap `analyzeImageMock` for the real function in `page.tsx`.

## The Script (`scripts/test-vision.ts`)
```typescript
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as fs from "fs";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

async function analyzeFood() {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  
  const imagePath = "public/test-food.jpg";
  const imageBuffer = fs.readFileSync(imagePath);
  const imageBase64 = imageBuffer.toString("base64");

  const prompt = `
    Analyze this food image. Return ONLY raw JSON (no markdown).
    Format:
    {
      "food_name": "string",
      "calories_approx": number,
      "macros": { "protein": number, "carbs": number, "fat": number },
      "health_score_1_to_10": number,
      "coach_tip": "short vibe-coded advice"
    }
  `;

  console.log("Analyzing...");
  const result = await model.generateContent([
    prompt,
    { inlineData: { data: imageBase64, mimeType: "image/jpeg" } },
  ]);

  console.log(result.response.text());
}

analyzeFood();
```

## Run It
```bash
npx tsx scripts/test-vision.ts
```
