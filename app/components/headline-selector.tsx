"use client";

interface HeadlineSelectorProps {
  headlines: string[];
  selectedHeadlines: string[];
  onToggle: (headline: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

export default function HeadlineSelector({
  headlines,
  selectedHeadlines,
  onToggle,
  onSubmit,
  isLoading,
}: HeadlineSelectorProps) {
  return (
    <div className="w-full max-w-2xl space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          Headlines ausw&auml;hlen
        </h2>
        <p className="text-sm text-gray-500">
          W&auml;hle genau 3 Headlines aus ({selectedHeadlines.length}/3
          ausgew&auml;hlt)
        </p>
      </div>
      <div className="space-y-2">
        {headlines.map((headline, index) => {
          const isSelected = selectedHeadlines.includes(headline);
          const isDisabled =
            !isSelected && selectedHeadlines.length >= 3;

          return (
            <button
              key={index}
              type="button"
              onClick={() => onToggle(headline)}
              disabled={isDisabled || isLoading}
              className={`w-full rounded-lg border-2 px-4 py-3 text-left transition-colors ${
                isSelected
                  ? "border-blue-500 bg-blue-50 text-blue-900"
                  : isDisabled
                    ? "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
                    : "border-gray-200 bg-white text-gray-900 hover:border-blue-300 hover:bg-blue-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 ${
                    isSelected
                      ? "border-blue-500 bg-blue-500"
                      : "border-gray-300"
                  }`}
                >
                  {isSelected && (
                    <svg
                      className="h-3 w-3 text-white"
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
                  )}
                </div>
                <span className="font-medium">{headline}</span>
                <span className="ml-auto text-xs text-gray-400">
                  {headline.length}/40
                </span>
              </div>
            </button>
          );
        })}
      </div>
      <button
        onClick={onSubmit}
        disabled={selectedHeadlines.length !== 3 || isLoading}
        className="w-full rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-blue-400 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Generiere Subheadlines...
          </span>
        ) : (
          "Subheadlines generieren"
        )}
      </button>
    </div>
  );
}
