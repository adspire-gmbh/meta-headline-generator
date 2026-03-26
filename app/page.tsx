"use client";

import { useState } from "react";
import UrlInput from "./components/url-input";
import AudienceDisplay from "./components/audience-display";
import HeadlineSelector from "./components/headline-selector";
import SubheadlineList from "./components/subheadline-list";

type Step = "url" | "headlines" | "subheadlines";

interface AnalysisData {
  zielgruppe: string;
  ansprache: "Du" | "Sie";
  headlines: string[];
}

export default function Home() {
  const [step, setStep] = useState<Step>("url");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [url, setUrl] = useState("");
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [selectedHeadlines, setSelectedHeadlines] = useState<string[]>([]);
  const [subheadlines, setSubheadlines] = useState<string[]>([]);

  async function handleUrlSubmit(submittedUrl: string) {
    setIsLoading(true);
    setError(null);
    setUrl(submittedUrl);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: submittedUrl }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Fehler bei der Analyse");
      }

      const data: AnalysisData = await response.json();
      setAnalysis(data);
      setStep("headlines");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Ein unbekannter Fehler ist aufgetreten"
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handleHeadlineToggle(headline: string) {
    setSelectedHeadlines((prev) =>
      prev.includes(headline)
        ? prev.filter((h) => h !== headline)
        : prev.length < 3
          ? [...prev, headline]
          : prev
    );
  }

  async function handleGenerateSubheadlines() {
    if (!analysis || selectedHeadlines.length !== 3) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/subheadlines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          zielgruppe: analysis.zielgruppe,
          ansprache: analysis.ansprache,
          selectedHeadlines,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Fehler bei der Generierung");
      }

      const data = await response.json();
      setSubheadlines(data.subheadlines);
      setStep("subheadlines");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Ein unbekannter Fehler ist aufgetreten"
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handleReset() {
    setStep("url");
    setIsLoading(false);
    setError(null);
    setUrl("");
    setAnalysis(null);
    setSelectedHeadlines([]);
    setSubheadlines([]);
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Meta Headline Generator
          </h1>
          <p className="mt-2 text-gray-600">
            Generiere Facebook/Meta Ad Headlines aus einer Angebots-URL
          </p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-center gap-2">
          {[
            { key: "url", label: "URL" },
            { key: "headlines", label: "Headlines" },
            { key: "subheadlines", label: "Subheadlines" },
          ].map(({ key, label }, index) => {
            const steps: Step[] = ["url", "headlines", "subheadlines"];
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
          {step === "url" && (
            <UrlInput onSubmit={handleUrlSubmit} isLoading={isLoading} />
          )}

          {step === "headlines" && analysis && (
            <div className="w-full max-w-2xl space-y-6">
              <AudienceDisplay
                zielgruppe={analysis.zielgruppe}
                ansprache={analysis.ansprache}
              />
              <HeadlineSelector
                headlines={analysis.headlines}
                selectedHeadlines={selectedHeadlines}
                onToggle={handleHeadlineToggle}
                onSubmit={handleGenerateSubheadlines}
                isLoading={isLoading}
              />
            </div>
          )}

          {step === "subheadlines" && (
            <div className="w-full max-w-2xl space-y-6">
              <SubheadlineList
                subheadlines={subheadlines}
                selectedHeadlines={selectedHeadlines}
              />
              <button
                onClick={handleReset}
                className="w-full rounded-lg border border-gray-300 bg-white px-6 py-3 font-medium text-gray-700 hover:bg-gray-50"
              >
                Neue Analyse starten
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
