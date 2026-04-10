"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Card } from "@/components/ui/Card";
import { uploadVideo } from "@/lib/upload";
import { createJob } from "./actions";

const ACCEPTED_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/x-msvideo",
  "video/x-matroska",
];
const MAX_SIZE = 2 * 1024 * 1024 * 1024; // 2GB

function validateFile(file: File): { valid: boolean; error?: string } {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: "Unsupported format. Please upload MP4, MOV, AVI, or MKV.",
    };
  }
  if (file.size > MAX_SIZE) {
    return { valid: false, error: "File too large. Maximum size is 2GB." };
  }
  return { valid: true };
}

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export default function UploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  function handleFile(f: File) {
    setError(null);
    const result = validateFile(f);
    if (!result.valid) {
      setError(result.error ?? "Invalid file.");
      setFile(null);
      return;
    }
    setFile(f);
  }

  function handleDragEnter(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFile(droppedFile);
  }

  function handleBrowse() {
    fileInputRef.current?.click();
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (selected) handleFile(selected);
  }

  function handleRemove() {
    setFile(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleAnalyze() {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const videoUrl = await uploadVideo(file);
      const jobId = await createJob(videoUrl);
      router.push(`/processing?jobId=${jobId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
      setUploading(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      {/* Headline */}
      <header className="space-y-2">
        <h2 className="text-4xl font-headline font-bold tracking-tight text-on-surface">
          Upload Analysis
        </h2>
        <p className="text-on-surface-variant font-body">
          Supported formats: MP4, MOV, AVI, MKV.{" "}
          <span className="text-primary-dim/80">Max 2GB, 30 min runtime.</span>
        </p>
      </header>

      {/* Upload Drop Zone */}
      <section className="relative group">
        {file ? (
          /* Selected file preview */
          <div className="w-full rounded-xl bg-surface-container-high border-2 border-dashed border-primary-dim/50 p-12 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-surface-container-highest flex items-center justify-center border border-outline-variant/40">
                <span className="material-symbols-outlined text-3xl text-primary-dim">
                  movie
                </span>
              </div>
              <div>
                <p className="font-headline font-semibold text-on-surface text-lg">
                  {file.name}
                </p>
                <p className="text-on-surface-variant text-sm">
                  {formatSize(file.size)}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleRemove}>
              Remove
            </Button>
          </div>
        ) : (
          /* Drop zone */
          <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`w-full h-80 rounded-xl bg-surface-container-high border-2 border-dashed flex flex-col items-center justify-center p-12 text-center transition-all dot-grid overflow-hidden ${
              dragActive
                ? "border-primary-dim/50"
                : "border-outline-variant/30 hover:border-primary-dim/50"
            }`}
          >
            {/* Inner glow */}
            <div
              className={`absolute inset-0 pointer-events-none bg-gradient-to-b from-primary-dim/5 to-transparent transition-opacity ${
                dragActive
                  ? "opacity-100"
                  : "opacity-0 group-hover:opacity-100"
              }`}
            />
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-surface-container-highest flex items-center justify-center mb-6 border border-outline-variant/40">
                <span className="material-symbols-outlined text-3xl text-primary-dim">
                  cloud_upload
                </span>
              </div>
              <h3 className="text-xl font-headline font-semibold mb-2">
                Drag video here or click to browse
              </h3>
              <p className="text-on-surface-variant text-sm mb-8">
                Supported formats: MP4, MOV, AVI, MKV. Max 2GB, 30 min runtime.
              </p>
              <Button variant="secondary" size="md" onClick={handleBrowse}>
                Browse Files
              </Button>
            </div>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={handleInputChange}
        />
      </section>

      {/* Validation error */}
      {error && (
        <p className="text-error text-sm -mt-8">{error}</p>
      )}

      {/* Cost Estimate Glass Panel */}
      <section className="flex justify-center">
        <GlassPanel className="px-8 py-6 rounded-2xl flex items-center gap-10 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-secondary-container/30 flex items-center justify-center text-secondary-fixed">
              <span className="material-symbols-outlined">token</span>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">
                Estimated Cost
              </p>
              <p className="text-lg font-headline font-bold text-on-surface">
                10 Credits
              </p>
            </div>
          </div>
          <div className="h-10 w-[1px] bg-outline-variant/20" />
          <Button
            variant="primary"
            size="lg"
            loading={uploading}
            disabled={!file || uploading}
            onClick={handleAnalyze}
            className="!w-auto px-10 py-4"
          >
            Analyze Video
            <span className="material-symbols-outlined text-lg">bolt</span>
          </Button>
        </GlassPanel>
      </section>

      {/* Feature Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card hover className="p-8 space-y-4">
          <div className="w-12 h-12 rounded-lg bg-primary-container/20 flex items-center justify-center text-primary-dim">
            <span className="material-symbols-outlined">speed</span>
          </div>
          <div>
            <h4 className="font-headline font-bold text-on-surface text-lg">
              Turbo Processing
            </h4>
            <p className="text-on-surface-variant text-sm mt-2 leading-relaxed">
              Parallel neural threads handle frame-by-frame inference at 4x
              realtime speed.
            </p>
          </div>
        </Card>
        <Card hover className="p-8 space-y-4">
          <div className="w-12 h-12 rounded-lg bg-tertiary-fixed/10 flex items-center justify-center text-tertiary-fixed">
            <span className="material-symbols-outlined">model_training</span>
          </div>
          <div>
            <h4 className="font-headline font-bold text-on-surface text-lg">
              Neural Engine
            </h4>
            <p className="text-on-surface-variant text-sm mt-2 leading-relaxed">
              Proprietary vision models trained specifically for cinematic
              composition and pacing.
            </p>
          </div>
        </Card>
        <Card hover className="p-8 space-y-4">
          <div className="w-12 h-12 rounded-lg bg-secondary-container/20 flex items-center justify-center text-secondary-fixed">
            <span className="material-symbols-outlined">security</span>
          </div>
          <div>
            <h4 className="font-headline font-bold text-on-surface text-lg">
              Encrypted Transit
            </h4>
            <p className="text-on-surface-variant text-sm mt-2 leading-relaxed">
              End-to-end AES-256 encryption. Your raw media is deleted
              immediately post-analysis.
            </p>
          </div>
        </Card>
      </section>
    </div>
  );
}
