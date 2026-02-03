"use client";

import { useState } from "react";
import { type FoodAnalysis, type IdentificationResult, type AnalysisGoal } from "@/lib/vision";
import { identifyFoodAction, analyzeFoodAction } from "@/app/actions";
import { useMealHistory } from "@/hooks/useMealHistory";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Camera, Loader2, Leaf, ChefHat, Flame, HeartPulse, CheckCircle2, ArrowRight, History, Trash2, X } from "lucide-react";
import imageCompression from 'browser-image-compression';

type AppState = "IDLE" | "IDENTIFYING" | "CONFIRMATION" | "ANALYZING" | "RESULT";

export default function SnapCoachHome() {
  const [state, setState] = useState<AppState>("IDLE");
  const [image, setImage] = useState<string | null>(null);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Data State
  const [identification, setIdentification] = useState<IdentificationResult | null>(null);
  const [userContext, setUserContext] = useState("");
  const [selectedGoal, setSelectedGoal] = useState<AnalysisGoal>("health");
  const [analysis, setAnalysis] = useState<FoodAnalysis | null>(null);

  // History Hook
  const { history, logMeal, clearHistory } = useMealHistory();
  const [showHistory, setShowHistory] = useState(false);

  const reset = () => {
    setImage(null);
    setFileToUpload(null);
    setAnalysis(null);
    setIdentification(null);
    setState("IDLE");
    setError(null);
    setShowHistory(false);
  };

  const handleLogMeal = () => {
    if (analysis && image) {
      logMeal(analysis, image);
      setShowHistory(true);
      // Clean up analysis state but keep history open
      setAnalysis(null);
      setIdentification(null);
      setState("IDLE");
      setImage(null);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result as string);
      setFileToUpload(file);
      setState("IDLE");
      setError(null);
      setIdentification(null);
      setAnalysis(null);
      setUserContext("");
      setShowHistory(false);
    };
    reader.readAsDataURL(file);
  };

  const compressFile = async (file: File) => {
    const options = { maxSizeMB: 1, maxWidthOrHeight: 1024, useWebWorker: true };
    return await imageCompression(file, options);
  };

  const startIdentification = async () => {
    if (!fileToUpload) return;
    setState("IDENTIFYING");
    setError(null);

    try {
      const compressed = await compressFile(fileToUpload);
      const formData = new FormData();
      formData.append("image", compressed);

      const result = await identifyFoodAction(formData);
      
      if ('error' in result) {
        setError(result.error);
        setState("IDLE");
      } else {
        setIdentification(result);
        setState("CONFIRMATION");
      }
    } catch (err) {
      console.error(err);
      setError("Identification failed.");
      setState("IDLE");
    }
  };

  const startFinalAnalysis = async () => {
    if (!fileToUpload) return;
    setState("ANALYZING");
    setError(null);

    try {
      const compressed = await compressFile(fileToUpload);
      const formData = new FormData();
      formData.append("image", compressed);

      const fullContext = `Detected: ${identification?.detected_ingredients.join(", ")}. User Notes: ${userContext}`;
      
      const result = await analyzeFoodAction(formData, fullContext, selectedGoal);
      
      if ('error' in result) {
        setError(result.error);
        setState("CONFIRMATION");
      } else {
        setAnalysis(result);
        setState("RESULT");
      }
    } catch (err) {
      console.error(err);
      setError("Analysis failed.");
      setState("CONFIRMATION");
    }
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-white p-6 max-w-md mx-auto font-sans pb-24">
      {/* Header */}
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Leaf className="text-green-400" />
          <h1 className="text-xl font-bold tracking-tight">SnapCoach</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setShowHistory(true)}>
            <History className="w-5 h-5 text-neutral-400 hover:text-white" />
          </Button>
          <Badge variant="outline" className="border-neutral-800 text-neutral-400">Beta</Badge>
        </div>
      </header>

      <div className="space-y-6">
        
        {/* IMAGE PREVIEW CARD */}
        <Card className="bg-neutral-900 border-neutral-800 overflow-hidden relative">
          <CardContent className="p-0">
            {image ? (
              <div className="relative aspect-square w-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image} alt="Meal" className="w-full h-full object-cover" />
                <Button 
                  size="sm" 
                  variant="secondary"
                  className="absolute top-2 right-2 bg-black/50 text-white hover:bg-black/70 backdrop-blur-sm"
                  onClick={reset}
                >
                  Clear
                </Button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center aspect-square w-full cursor-pointer hover:bg-neutral-800/50 transition-colors border-2 border-dashed border-neutral-800 rounded-lg">
                <div className="flex flex-col items-center gap-3 text-neutral-500">
                  <div className="p-4 bg-neutral-800 rounded-full">
                    <Camera className="w-8 h-8 text-neutral-400" />
                  </div>
                  <span className="font-medium">Snap your meal</span>
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
              </label>
            )}
          </CardContent>
        </Card>

        {/* ERROR STATE */}
        {error && (
          <div className="p-4 bg-red-950/30 border border-red-900/50 rounded-lg text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        {/* STATE: IDLE (Start Analysis) */}
        {state === "IDLE" && image && (
          <Button 
            className="w-full bg-green-500 hover:bg-green-600 text-black font-bold py-6 text-lg animate-in fade-in zoom-in"
            onClick={startIdentification}
          >
            Identify Ingredients
          </Button>
        )}

        {/* STATE: IDENTIFYING (Loading Step 1) */}
        {state === "IDENTIFYING" && (
          <div className="flex flex-col items-center py-8 gap-3 text-neutral-500 animate-pulse">
            <Loader2 className="w-8 h-8 animate-spin text-green-500" />
            <span className="text-sm">Scanning ingredients...</span>
          </div>
        )}

        {/* STATE: CONFIRMATION (Interactive Step) */}
        {state === "CONFIRMATION" && identification && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 fade-in duration-500">
            
            {/* Ingredients List */}
            <div className="bg-neutral-900 p-4 rounded-lg border border-neutral-800">
              <h3 className="text-neutral-400 text-xs uppercase font-bold mb-3 tracking-wide">I can see:</h3>
              <div className="flex flex-wrap gap-2">
                {identification.detected_ingredients.map((ing, i) => (
                  <Badge key={i} variant="secondary" className="bg-neutral-800 text-neutral-200 hover:bg-neutral-700">
                    <CheckCircle2 className="w-3 h-3 mr-1 text-green-500" />
                    {ing}
                  </Badge>
                ))}
              </div>
            </div>

            {/* AI Question / User Input */}
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="mt-1 bg-green-500/10 p-2 rounded-full">
                  <Leaf className="w-4 h-4 text-green-500" />
                </div>
                <div className="text-sm text-neutral-300">
                  <span className="font-bold block text-white mb-1">Just checking:</span>
                  {identification.missing_info_question || "Is there anything hidden I missed? (Sauces, fillings?)"}
                </div>
              </div>
              <Textarea 
                placeholder="e.g. It has mayo and extra cheese..." 
                value={userContext}
                onChange={(e) => setUserContext(e.target.value)}
                className="bg-neutral-900 border-neutral-800 text-white resize-none"
              />
            </div>

            {/* Goal Selection */}
            <div className="space-y-3">
              <h3 className="text-neutral-400 text-xs uppercase font-bold tracking-wide">Choose your goal:</h3>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setSelectedGoal("health")}
                  className={`p-3 rounded-lg border flex flex-col items-center gap-2 transition-all ${selectedGoal === "health" ? "bg-green-500/20 border-green-500 text-green-400" : "bg-neutral-900 border-neutral-800 text-neutral-500 hover:bg-neutral-800"}`}
                >
                  <HeartPulse className="w-5 h-5" />
                  <span className="text-xs font-medium">Health</span>
                </button>
                <button
                  onClick={() => setSelectedGoal("cooking")}
                  className={`p-3 rounded-lg border flex flex-col items-center gap-2 transition-all ${selectedGoal === "cooking" ? "bg-orange-500/20 border-orange-500 text-orange-400" : "bg-neutral-900 border-neutral-800 text-neutral-500 hover:bg-neutral-800"}`}
                >
                  <ChefHat className="w-5 h-5" />
                  <span className="text-xs font-medium">Chef</span>
                </button>
                <button
                  onClick={() => setSelectedGoal("roast")}
                  className={`p-3 rounded-lg border flex flex-col items-center gap-2 transition-all ${selectedGoal === "roast" ? "bg-red-500/20 border-red-500 text-red-400" : "bg-neutral-900 border-neutral-800 text-neutral-500 hover:bg-neutral-800"}`}
                >
                  <Flame className="w-5 h-5" />
                  <span className="text-xs font-medium">Roast</span>
                </button>
              </div>
            </div>

            <Button 
              className="w-full bg-white text-black hover:bg-neutral-200 font-bold py-6"
              onClick={startFinalAnalysis}
            >
              Get Advice <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {/* STATE: ANALYZING (Final Loader) */}
        {state === "ANALYZING" && (
          <div className="flex flex-col items-center py-8 gap-3 text-neutral-500 animate-pulse">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            <span className="text-sm">Cooking up insights...</span>
          </div>
        )}

        {/* STATE: RESULT (Final Card) */}
        {state === "RESULT" && analysis && (
          <div className="space-y-4 animate-in slide-in-from-bottom-4 fade-in duration-500">
            <Card className="bg-neutral-900 border-neutral-800">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg text-white">{analysis.food_name}</CardTitle>
                    <p className="text-sm text-neutral-400">Estimated ~{analysis.calories_approx} kcal</p>
                  </div>
                  <div className={`
                    flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm
                    ${analysis.health_score_1_to_10 >= 8 ? 'bg-green-500/20 text-green-400' : 
                      analysis.health_score_1_to_10 >= 5 ? 'bg-yellow-500/20 text-yellow-400' : 
                      'bg-red-500/20 text-red-400'}
                  `}>
                    {analysis.health_score_1_to_10}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-neutral-950 p-2 rounded">
                    <div className="text-xs text-neutral-500">Protein</div>
                    <div className="font-mono text-sm">{analysis.macros.protein}g</div>
                  </div>
                  <div className="bg-neutral-950 p-2 rounded">
                    <div className="text-xs text-neutral-500">Carbs</div>
                    <div className="font-mono text-sm">{analysis.macros.carbs}g</div>
                  </div>
                  <div className="bg-neutral-950 p-2 rounded">
                    <div className="text-xs text-neutral-500">Fat</div>
                    <div className="font-mono text-sm">{analysis.macros.fat}g</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={`
              border bg-gradient-to-br
              ${selectedGoal === 'health' ? 'from-green-950/30 to-emerald-950/10 border-green-500/20' : 
                selectedGoal === 'cooking' ? 'from-orange-950/30 to-yellow-950/10 border-orange-500/20' : 
                'from-red-950/30 to-pink-950/10 border-red-500/20'}
            `}>
              <CardContent className="p-4 flex gap-3">
                <div className="text-xl mt-1">
                  {selectedGoal === 'health' ? '🥗' : selectedGoal === 'cooking' ? '👨‍🍳' : '🔥'}
                </div>
                <div className="text-sm text-neutral-200">
                  <span className={`font-bold block mb-1 capitalize
                    ${selectedGoal === 'health' ? 'text-green-400' : 
                      selectedGoal === 'cooking' ? 'text-orange-400' : 
                      'text-red-400'}
                  `}>
                    {selectedGoal} Insight:
                  </span>
                  &quot;{analysis.coach_tip}&quot;
                </div>
              </CardContent>
            </Card>

            <Button 
              className="w-full bg-neutral-800 text-white hover:bg-neutral-700 font-medium py-6"
              onClick={handleLogMeal}
            >
              Log Meal & View History
            </Button>
          </div>
        )}

        {/* History Drawer */}
        {showHistory && (
          <div className="fixed inset-0 bg-neutral-950 z-50 overflow-y-auto animate-in slide-in-from-right-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <History className="w-5 h-5 text-neutral-400" />
                  Meal History
                </h2>
                <Button variant="ghost" size="icon" onClick={() => setShowHistory(false)}>
                  <X className="w-6 h-6" />
                </Button>
              </div>

              {history.length === 0 ? (
                <div className="text-center py-12 text-neutral-500">
                  <p>No meals logged yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {history.map((entry) => (
                    <Card key={entry.id} className="bg-neutral-900 border-neutral-800 overflow-hidden">
                      <div className="flex">
                        <div className="w-24 h-24 flex-shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={entry.image} alt="Meal" className="w-full h-full object-cover" />
                        </div>
                        <div className="p-3 flex-1">
                          <div className="flex justify-between items-start">
                            <h3 className="font-bold text-sm text-white line-clamp-1">{entry.analysis.food_name}</h3>
                            <span className="text-xs text-neutral-500">
                              {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div className="mt-1 text-xs text-neutral-400 flex gap-2">
                            <span>{entry.analysis.calories_approx} kcal</span>
                            <span>•</span>
                            <span>{entry.analysis.macros.protein}g P</span>
                          </div>
                          <div className="mt-2 text-xs text-neutral-500 line-clamp-2">
                            "{entry.analysis.coach_tip}"
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}

                  <Button 
                    variant="destructive" 
                    className="w-full mt-8 bg-red-950/20 text-red-500 hover:bg-red-950/40 border border-red-900/50"
                    onClick={clearHistory}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear History
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
