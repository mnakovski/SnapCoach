
"use client";

import { useState } from "react";
import { type FoodAnalysis } from "@/lib/vision";
import { uploadFoodImage } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Camera, Loader2, Leaf } from "lucide-react";
import imageCompression from 'browser-image-compression';

export default function SnapCoachHome() {
  const [image, setImage] = useState<string | null>(null);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<FoodAnalysis | null>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset previous state
    setError(null);
    setAnalysis(null);
    setFileToUpload(file);

    // Preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!fileToUpload) return;

    setLoading(true);
    setError(null);
    
    try {
      // Compress Image (Critical for Vercel 4.5MB limit)
      const options = {
        maxSizeMB: 1, // Max 1MB
        maxWidthOrHeight: 1024, // Max 1024px
        useWebWorker: true,
      };
      
      const compressedFile = await imageCompression(fileToUpload, options);
      
      const formData = new FormData();
      formData.append("image", compressedFile);
      
      const result = await uploadFoodImage(formData);
      
      if ('error' in result) {
        console.error(result.error);
        setError(result.error);
      } else {
        setAnalysis(result);
      }
    } catch (err) {
      console.error("Analysis failed", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-white p-6 max-w-md mx-auto font-sans">
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <Leaf className="text-green-400" />
          <h1 className="text-xl font-bold tracking-tight">SnapCoach</h1>
        </div>
        <Badge variant="outline" className="border-neutral-800 text-neutral-400">
          Beta
        </Badge>
      </header>

      {/* Main Action Area */}
      <div className="space-y-6">
        
        {/* Upload/Preview Card */}
        <Card className="bg-neutral-900 border-neutral-800 overflow-hidden">
          <CardContent className="p-0">
            {image ? (
              <div className="relative aspect-square w-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={image} 
                  alt="Meal Preview" 
                  className="w-full h-full object-cover" 
                />
                <Button 
                  size="sm" 
                  variant="secondary"
                  className="absolute top-2 right-2 bg-black/50 text-white hover:bg-black/70 backdrop-blur-sm"
                  onClick={() => { setImage(null); setFileToUpload(null); setAnalysis(null); setError(null); }}
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
                  <span className="text-xs text-neutral-600">Tap to upload</span>
                </div>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleImageSelect}
                />
              </label>
            )}
          </CardContent>
        </Card>

        {/* Action Button */}
        {image && !analysis && !loading && (
          <Button 
            className="w-full bg-green-500 hover:bg-green-600 text-black font-bold py-6 text-lg animate-in fade-in zoom-in duration-300"
            onClick={handleAnalyze}
          >
            Upload & Analyze
          </Button>
        )}

        {/* Analysis Result */}
        {loading && (
          <div className="flex flex-col items-center py-8 gap-3 text-neutral-500 animate-pulse">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="text-sm">Analyzing vibes & nutrients...</span>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-950/30 border border-red-900/50 rounded-lg text-red-400 text-center text-sm">
            {error}
          </div>
        )}

        {analysis && !loading && (
          <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
            
            {/* Top Stat Card */}
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

            {/* Coach Tip */}
            <Card className="bg-gradient-to-br from-indigo-950/50 to-purple-950/30 border-indigo-500/20">
              <CardContent className="p-4 flex gap-3">
                <div className="text-xl">🤖</div>
                <div className="text-sm text-indigo-200">
                  <span className="font-bold text-indigo-100 block mb-1">Coach Says:</span>
                  &quot;{analysis.coach_tip}&quot;
                </div>
              </CardContent>
            </Card>

            <Button className="w-full bg-white text-black hover:bg-neutral-200 font-medium">
              Log Meal
            </Button>

          </div>
        )}

      </div>
    </main>
  );
}
