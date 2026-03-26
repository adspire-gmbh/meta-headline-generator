"use client";

import { useState, useRef, useCallback } from "react";

interface UploadFormProps {
  onSubmit: (formData: FormData) => void;
  isLoading: boolean;
}

interface FileWithPreview {
  file: File;
  previewUrl: string;
}

export default function UploadForm({ onSubmit, isLoading }: UploadFormProps) {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback(
    (newFiles: File[]) => {
      const imageFiles = newFiles.filter((f) => f.type.startsWith("image/"));
      const newEntries = imageFiles.map((file) => ({
        file,
        previewUrl: URL.createObjectURL(file),
      }));
      setFiles((prev) => [...prev, ...newEntries]);
    },
    []
  );

  function removeFile(index: number) {
    setFiles((prev) => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].previewUrl);
      updated.splice(index, 1);
      return updated;
    });
  }

  function handleDrag(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files;
    if (selected) {
      addFiles(Array.from(selected));
    }
    // Reset input so same files can be selected again
    e.target.value = "";
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (files.length === 0) return;
    const formData = new FormData(e.currentTarget);
    // Remove any existing image entries from the form
    formData.delete("image");
    // Add all files
    files.forEach(({ file }) => {
      formData.append("image", file);
    });
    const url = formData.get("url") as string;
    if (url.trim()) {
      onSubmit(formData);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl space-y-6">
      {/* Drag & Drop Zone */}
      <div>
        <label className="block text-lg font-medium text-gray-900 mb-2">
          Ad-Bilder hochladen
        </label>
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors cursor-pointer ${
            dragActive
              ? "border-blue-500 bg-blue-50"
              : files.length > 0
                ? "border-green-300 bg-green-50"
                : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
          } ${isLoading ? "pointer-events-none opacity-60" : ""}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileInput}
            className="hidden"
          />
          {files.length > 0 ? (
            <div className="w-full">
              <div className="grid grid-cols-3 gap-3">
                {files.map(({ file, previewUrl }, index) => (
                  <div key={`${file.name}-${index}`} className="relative group">
                    <img
                      src={previewUrl}
                      alt={file.name}
                      className="h-28 w-full rounded-lg object-cover"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(index);
                      }}
                      className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      x
                    </button>
                    <p className="mt-1 text-xs text-gray-500 truncate">
                      {file.name}
                    </p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-3 text-center">
                {files.length} Bild{files.length > 1 ? "er" : ""} - Klicken oder ziehen um weitere hinzuzufügen
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-gray-500">
              <svg
                className="h-12 w-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                />
              </svg>
              <p className="text-sm font-medium">
                Bilder hierher ziehen oder klicken
              </p>
              <p className="text-xs text-gray-400">
                PNG, JPG, WEBP - Mehrere Bilder möglich
              </p>
            </div>
          )}
        </div>
      </div>

      {/* URL Input */}
      <div>
        <label htmlFor="url" className="block text-lg font-medium text-gray-900 mb-2">
          Finale URL
        </label>
        <input
          type="url"
          name="url"
          id="url"
          required
          placeholder="https://beispiel.de/landingpage"
          disabled={isLoading}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100 disabled:text-gray-500"
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading || files.length === 0}
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
            Analysiere {files.length} Bild{files.length > 1 ? "er" : ""}...
          </span>
        ) : (
          `Analysieren (${files.length} Bild${files.length > 1 ? "er" : ""})`
        )}
      </button>
    </form>
  );
}
