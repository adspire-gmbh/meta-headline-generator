"use client";

interface AudienceDisplayProps {
  zielgruppe: string;
  ansprache: "Du" | "Sie";
}

export default function AudienceDisplay({
  zielgruppe,
  ansprache,
}: AudienceDisplayProps) {
  return (
    <div className="w-full max-w-2xl rounded-lg border border-gray-200 bg-gray-50 p-6 space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Analyse-Ergebnis</h2>
      <div className="space-y-3">
        <div>
          <span className="text-sm font-medium text-gray-500">Zielgruppe</span>
          <p className="mt-1 text-gray-900">{zielgruppe}</p>
        </div>
        <div>
          <span className="text-sm font-medium text-gray-500">Ansprache</span>
          <p className="mt-1">
            <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
              {ansprache}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
