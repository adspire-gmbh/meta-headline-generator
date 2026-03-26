"use client";

import { useState } from "react";
import type { ImageAnalysisResult } from "@/app/lib/gemini";
import type { UrlAnalysisResult, AdCopyResult } from "@/app/lib/claude";

interface CreativeResult {
  fileName: string;
  imageAnalysis: ImageAnalysisResult;
  adCopies: AdCopyResult;
}

interface CopyResultsProps {
  urlAnalysis: UrlAnalysisResult;
  creatives: CreativeResult[];
  onReset: () => void;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      className="shrink-0 rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
    >
      {copied ? "Kopiert!" : "Kopieren"}
    </button>
  );
}

export default function CopyResults({
  urlAnalysis,
  creatives,
  onReset,
}: CopyResultsProps) {
  const [activeTab, setActiveTab] = useState(0);
  const activeCreative = creatives[activeTab];

  return (
    <div className="w-full space-y-6">
      {/* Zwei-Spalten Layout: Analyse links, Copies rechts */}
      <div className="flex gap-6">
        {/* Linke Spalte: Analyse */}
        <div className="w-80 shrink-0">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-5 space-y-4 sticky top-6">
            <h2 className="text-lg font-semibold text-gray-900">Analyse</h2>
            <div className="space-y-3">
              <div>
                <span className="text-xs font-medium text-gray-500">Zielgruppe</span>
                <p className="mt-0.5 text-sm text-gray-900">{urlAnalysis.zielgruppe}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-gray-500">Seitenintention</span>
                <p className="mt-0.5 text-sm text-gray-900">{urlAnalysis.seitenintention}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-gray-500">Awareness-Stufe</span>
                <p className="mt-1">
                  <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                    {urlAnalysis.funnel_stufe}
                  </span>
                </p>
              </div>
              <div>
                <span className="text-xs font-medium text-gray-500">Ansprache</span>
                <p className="mt-1">
                  <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                    {urlAnalysis.ansprache}
                  </span>
                </p>
              </div>

              {/* Bildanalyse des aktiven Creatives */}
              <div className="border-t border-gray-200 pt-3">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">
                  Bildanalyse
                </h3>
                <div className="space-y-2">
                  <div>
                    <span className="text-xs font-medium text-gray-500">Beschreibung</span>
                    <p className="mt-0.5 text-sm text-gray-900">
                      {activeCreative.imageAnalysis.beschreibung}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-gray-500">Stimmung</span>
                    <p className="mt-0.5 text-sm text-gray-900">
                      {activeCreative.imageAnalysis.stimmung}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-gray-500">Anzeigentyp</span>
                    <p className="mt-0.5 text-sm text-gray-900">
                      {activeCreative.imageAnalysis.anzeigentyp}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-gray-500">Bild Awareness-Stufe</span>
                    <p className="mt-1">
                      <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800">
                        {activeCreative.imageAnalysis.awareness_stufe}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Rechte Spalte: Tabs + Copies */}
        <div className="flex-1 space-y-4">
          {/* Tabs */}
          {creatives.length > 1 && (
            <div className="flex gap-1 border-b border-gray-200">
              {creatives.map((creative, index) => (
                <button
                  key={index}
                  onClick={() => setActiveTab(index)}
                  className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                    activeTab === index
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Creative {index + 1}
                  <span className="ml-1.5 text-xs text-gray-400 font-normal">
                    {creative.fileName}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Active Creative Content */}
          <div className="space-y-6">
            {/* Meta Titel */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Meta-Titel</h2>
              <div className="mt-3 space-y-2">
                {activeCreative.adCopies.titel.map((titel, index) => (
                  <div
                    key={index}
                    className="rounded-lg border border-gray-200 bg-white px-4 py-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-blue-600">
                          {index + 1}.
                        </span>
                        <p className="text-gray-900 font-medium">{titel}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="shrink-0 text-xs text-gray-400">
                          {titel.length}/40
                        </span>
                        <CopyButton text={titel} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Ad Copy 1 - Kurztext */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Ad Copy 1 - Kurztext
              </h2>
              <div className="mt-3 rounded-lg border border-gray-200 bg-white px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-gray-900 whitespace-pre-line">
                    {activeCreative.adCopies.kurztext}
                  </p>
                  <CopyButton text={activeCreative.adCopies.kurztext} />
                </div>
                <p className="mt-2 text-xs text-gray-400">
                  {activeCreative.adCopies.kurztext.length} Zeichen
                </p>
              </div>
            </div>

            {/* Ad Copy 2 - Langtext */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Ad Copy 2 - Langtext
              </h2>
              <div className="mt-3 rounded-lg border border-gray-200 bg-white px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-gray-900 whitespace-pre-line">
                    {activeCreative.adCopies.langtext}
                  </p>
                  <CopyButton text={activeCreative.adCopies.langtext} />
                </div>
                <p className="mt-2 text-xs text-gray-400">
                  {activeCreative.adCopies.langtext.length} Zeichen
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reset Button */}
      <button
        onClick={onReset}
        className="w-full rounded-lg border border-gray-300 px-6 py-3 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-200"
      >
        Neue Analyse starten
      </button>
    </div>
  );
}
