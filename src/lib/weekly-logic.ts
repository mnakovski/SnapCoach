
import { type FoodAnalysis } from "./vision-mock";

// Define the Weekly Log Structure
export interface DailyLog {
  date: string;
  activity: "Rest" | "Gym" | "Football";
  meals: FoodAnalysis[];
}

export interface WeeklyReport {
  totalCalories: number;
  averageProtein: number;
  missedGoals: string[];
  swaps: {
    originalFood: string;
    betterOption: string;
    reason: string;
  }[];
}

// Logic: Analyze a week of eating
export function analyzeWeek(weekLogs: DailyLog[]): WeeklyReport {
  let totalCalories = 0;
  let totalProtein = 0;
  let gymDays = 0;
  
  weekLogs.forEach(day => {
    if (day.activity === "Gym") gymDays++;
    day.meals.forEach(meal => {
      totalCalories += meal.calories_approx;
      totalProtein += meal.macros.protein;
    });
  });

  const averageProtein = totalProtein / 7;
  const missedGoals: string[] = [];
  const swaps: { originalFood: string; betterOption: string; reason: string }[] = [];

  // Rule 1: Protein on Gym Days
  if (averageProtein < 120 && gymDays > 2) {
    missedGoals.push("Protein too low for gym frequency");
  }

  // Rule 2: Scan for "Bad" foods to swap
  weekLogs.forEach(day => {
    day.meals.forEach(meal => {
      if (meal.health_score_1_to_10 < 5) {
        swaps.push({
          originalFood: meal.food_name,
          betterOption: "Try: " + getHealthierAlternative(meal.food_name),
          reason: "Low health score (" + meal.health_score_1_to_10 + ") - spikes insulin."
        });
      }
    });
  });

  return {
    totalCalories,
    averageProtein,
    missedGoals,
    swaps: swaps.slice(0, 3) // Top 3 swaps
  };
}

function getHealthierAlternative(food: string): string {
  if (food.toLowerCase().includes("pizza")) return "Whole Wheat Pita Pizza with Arugula";
  if (food.toLowerCase().includes("burger")) return "Turkey Burger on Lettuce Wrap";
  if (food.toLowerCase().includes("pasta")) return "Zucchini Noodles or Quinoa Pasta";
  return "Grilled Chicken & Veggies";
}
