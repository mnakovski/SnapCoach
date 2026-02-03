
/**
 * Mock Vision Service
 * 
 * Since we don't have an API key yet, this function simulates
 * the AI analysis. It returns random food data to help us build the UI.
 */

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

const MOCK_RESPONSES: FoodAnalysis[] = [
  {
    food_name: "Grilled Chicken Salad",
    calories_approx: 350,
    macros: { protein: 35, carbs: 12, fat: 15 },
    health_score_1_to_10: 9,
    coach_tip: "Great protein hit! Perfect for recovery."
  },
  {
    food_name: "Pepperoni Pizza (2 slices)",
    calories_approx: 600,
    macros: { protein: 20, carbs: 60, fat: 30 },
    health_score_1_to_10: 3,
    coach_tip: "High fat/carb combo. Try a side salad next time to fill up."
  },
  {
    food_name: "Oatmeal with Berries",
    calories_approx: 300,
    macros: { protein: 8, carbs: 50, fat: 6 },
    health_score_1_to_10: 8,
    coach_tip: "Solid fuel. Consider adding protein powder or eggs on the side."
  }
];

export async function analyzeImageMock(base64Image: string): Promise<FoodAnalysis> {
  // Simulate network delay (1.5s) to feel "real"
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // Pick a random mock response
  const random = MOCK_RESPONSES[Math.floor(Math.random() * MOCK_RESPONSES.length)];
  return random;
}
