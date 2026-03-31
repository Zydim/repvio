"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileVideo, X, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { analyzeVideo, AnalysisResponse } from "@/lib/api";

interface VideoUploaderProps {
  exerciseType: string;
  muscleFocus?: string | null;
  userEmail: string;
  onResult: (result: AnalysisResponse) => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function VideoUploader({
  exerciseType,
  muscleFocus,
  userEmail,
  onResult,
}: VideoUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [limitReached, setLimitReached] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles[0]) {
      setFile(acceptedFiles[0]);
      setError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "video/mp4": [".mp4"], "video/quicktime": [".mov"] },
    maxSize: 100 * 1024 * 1024,
    multiple: false,
    onDropRejected: (rejections) => {
      const msg = rejections[0]?.errors[0]?.message || "Ungültige Datei";
      setError(msg);
    },
  });

  async function handleAnalyze() {
    if (!file || !exerciseType) return;
    setLoading(true);
    setError(null);
    setProgress(0);

    const steps = [
      { pct: 15, label: "Video wird hochgeladen..." },
      { pct: 35, label: "Frames werden extrahiert..." },
      { pct: 60, label: "KI analysiert deine Technik..." },
      { pct: 85, label: "Feedback wird generiert..." },
      { pct: 95, label: "Fast fertig..." },
    ];
    let stepIndex = 0;
    const interval = setInterval(() => {
      if (stepIndex < steps.length) {
        setProgress(steps[stepIndex].pct);
        setProgressLabel(steps[stepIndex].label);
        stepIndex++;
      }
    }, 1800);

    try {
      const result = await analyzeVideo(file, exerciseType, userEmail, muscleFocus ?? undefined);
      clearInterval(interval);
      setProgress(100);
      setProgressLabel("Analyse abgeschlossen!");
      setTimeout(() => { onResult(result); }, 300);
    } catch (err: unknown) {
      clearInterval(interval);
      const errObj = err as { response?: { status?: number; data?: { detail?: string } } };
      const message =
        errObj?.response?.data?.detail ||
        "Fehler bei der Analyse. Bitte versuche es erneut.";
      setError(message);
      if (errObj?.response?.status === 403) {
        setLimitReached(true);
      }
    } finally {
      setLoading(false);
      setProgress(0);
      setProgressLabel("");
    }
  }

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-colors ${
          isDragActive
            ? "border-zinc-400 bg-zinc-800"
            : "border-zinc-700 hover:border-zinc-500 bg-zinc-900"
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="w-8 h-8 mx-auto mb-3 text-zinc-500" />
        {isDragActive ? (
          <p className="text-zinc-300">Video hier ablegen...</p>
        ) : (
          <div>
            <p className="text-zinc-300 mb-1">Video hierher ziehen</p>
            <p className="text-xs text-zinc-500">oder klicken zum Auswählen</p>
            <p className="text-xs text-zinc-600 mt-2">.mp4 oder .mov, max. 100 MB</p>
          </div>
        )}
      </div>

      {/* Selected file */}
      {file && (
        <div className="flex items-center justify-between bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3">
          <div className="flex items-center gap-3">
            <FileVideo className="w-5 h-5 text-zinc-400 shrink-0" />
            <div>
              <p className="text-sm text-zinc-200 font-medium truncate max-w-xs">
                {file.name}
              </p>
              <p className="text-xs text-zinc-500">{formatBytes(file.size)}</p>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setFile(null);
            }}
            className="text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="text-sm text-red-400 bg-red-950/40 border border-red-800/50 rounded-lg px-4 py-3">
          <p>{error}</p>
          {limitReached && (
            <Link
              href="/pricing"
              className="inline-flex items-center gap-1 mt-2 text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Jetzt upgraden
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      )}

      {/* Scanner animation + Progress */}
      {loading && (
        <div className="space-y-4">
          {/* Scanner box */}
          <div className="relative rounded-2xl border-2 animate-pulse-border bg-zinc-900 overflow-hidden px-5 py-6">
            {/* Scan beam */}
            <div className="animate-scan absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-transparent via-emerald-400/30 to-transparent pointer-events-none" />
            {/* Corner brackets */}
            <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-emerald-400 rounded-tl" />
            <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-emerald-400 rounded-tr" />
            <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-emerald-400 rounded-bl" />
            <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-emerald-400 rounded-br" />
            {/* Content */}
            <div className="text-center">
              <p className="text-emerald-400 text-xs font-mono tracking-widest uppercase mb-1">KI analysiert</p>
              <p className="text-zinc-200 text-sm font-medium">{progressLabel}</p>
            </div>
          </div>
          {/* Progress bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-zinc-400">
              <span>{progress}%</span>
              <span>{progress < 100 ? "läuft..." : "✓ fertig"}</span>
            </div>
            <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-1.5 rounded-full bg-emerald-400 transition-all duration-700 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Analyze button */}
      <button
        onClick={handleAnalyze}
        disabled={!file || loading || !exerciseType}
        className="w-full py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-white text-zinc-950 hover:bg-zinc-200"
      >
        {loading ? "Analysiere..." : "Analysieren"}
      </button>
    </div>
  );
}
