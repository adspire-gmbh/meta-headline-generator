"use client";

import { useState } from "react";
import UploadForm from "../components/copy-creator/upload-form";
import CopyResults from "../components/copy-creator/copy-results";
import type { ImageAnalysisResult } from "../lib/gemini";
import type { UrlAnalysisResult, AdCopyResult } from "../lib/claude";

type Step = "upload" | "results";

interface CreativeResult {
  fileName: string;
  imageAnalysis: ImageAnalysisResult;
  adCopies: AdCopyResult;
}

interface Results {
  urlAnalysis: UrlAnalysisResult;
  creatives: CreativeResult[];
}

export default function CopyCreator() {
  const [step, setStep] = useState<Step>("upload");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Results | null>(null);

  async function handleSubmit(formData: FormData) {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/copy-creator", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Fehler bei der Analyse");
      }

      const data: Results = await response.json();
      setResults(data);
      setStep("results");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Ein unbekannter Fehler ist aufgetreten"
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handleReset() {
    setStep("upload");
    setIsLoading(false);
    setError(null);
    setResults(null);
  }

  return (
    <div className="flex flex-col items-center bg-gray-50 px-4 py-12 min-h-full">
      <div className="w-full max-w-5xl space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Copy Creator</h1>
          <p className="mt-2 text-gray-600">
            Generiere Meta Ad Copies aus Anzeigenbildern und einer Ziel-URL
          </p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-center gap-2">
          {[
            { key: "upload", label: "Upload" },
            { key: "results", label: "Ergebnisse" },
          ].map(({ key, label }, index) => {
            const steps: Step[] = ["upload", "results"];
            const currentIndex = steps.indexOf(step);
            const stepIndex = steps.indexOf(key as Step);
            const isActive = stepIndex === currentIndex;
            const isCompleted = stepIndex < currentIndex;

            return (
              <div key={key} className="flex items-center gap-2">
                {index > 0 && (
                  <div
                    className={`h-0.5 w-8 ${
                      isCompleted ? "bg-blue-500" : "bg-gray-300"
                    }`}
                  />
                )}
                <div className="flex items-center gap-1.5">
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${
                      isActive
                        ? "bg-blue-600 text-white"
                        : isCompleted
                          ? "bg-blue-500 text-white"
                          : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {isCompleted ? (
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
                      index + 1
                    )}
                  </div>
                  <span
                    className={`text-sm ${
                      isActive
                        ? "font-medium text-gray-900"
                        : "text-gray-500"
                    }`}
                  >
                    {label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            {error}
          </div>
        )}

        {/* Step Content */}
        <div className="flex flex-col items-center">
          {step === "upload" && (
            <UploadForm onSubmit={handleSubmit} isLoading={isLoading} />
          )}

          {step === "results" && results && (
            <CopyResults
              urlAnalysis={results.urlAnalysis}
              creatives={results.creatives}
              onReset={handleReset}
            />
          )}
        </div>
      </div>
    </div>
  );
}
