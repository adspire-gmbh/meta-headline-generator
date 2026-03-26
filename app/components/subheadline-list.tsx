"use client";

interface SubheadlineListProps {
  subheadlines: string[];
  selectedHeadlines: string[];
}

export default function SubheadlineList({
  subheadlines,
  selectedHeadlines,
}: SubheadlineListProps) {
  return (
    <div className="w-full max-w-2xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          Ausgew&auml;hlte Headlines
        </h2>
        <div className="mt-2 space-y-1">
          {selectedHeadlines.map((headline, index) => (
            <p key={index} className="text-sm text-gray-700">
              <span className="font-medium text-blue-600">
                {index + 1}.
              </span>{" "}
              {headline}
            </p>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          Generierte Subheadlines
        </h2>
        <div className="mt-3 space-y-2">
          {subheadlines.map((subheadline, index) => (
            <div
              key={index}
              className="rounded-lg border border-gray-200 bg-white px-4 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-gray-900">{subheadline}</p>
                <span className="shrink-0 text-xs text-gray-400">
                  {subheadline.length}/125
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
