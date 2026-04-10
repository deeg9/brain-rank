"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Card } from "@/components/ui/Card";
import {
  AnimatedFileUpload,
  type FileItem,
} from "@/components/upload/AnimatedFileUpload";
import { uploadVideo } from "@/lib/upload";
import { createJob } from "./actions";

export default function UploadPage() {
  const router = useRouter();

  const [files, setFiles] = useState<FileItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFilesAdd = useCallback((incoming: File[]) => {
    const newItems: FileItem[] = incoming.map((file) => ({
      id: crypto.randomUUID(),
      file,
      progress: 0,
      status: "pending" as const,
    }));
    setFiles((prev) => [...prev, ...newItems]);
  }, []);

  const handleFileRemove = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const handleThumbnailGenerated = useCallback(
    (id: string, dataUrl: string) => {
      setFiles((prev) =>
        prev.map((f) => (f.id === id ? { ...f, thumbnail: dataUrl } : f))
      );
    },
    []
  );

  function updateFileProgress(id: string, progress: number) {
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, progress } : f))
    );
  }

  function updateFileStatus(
    id: string,
    status: FileItem["status"],
    errorMsg?: string
  ) {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === id ? { ...f, status, error: errorMsg } : f
      )
    );
  }

  async function handleAnalyze() {
    if (files.length === 0) return;
    setUploading(true);
    setError(null);

    let lastJobId: string | null = null;

    for (const item of files) {
      try {
        updateFileStatus(item.id, "uploading");

        // Simulate progress while uploading
        let progress = 0;
        const interval = setInterval(() => {
          progress = Math.min(progress + 5, 90);
          updateFileProgress(item.id, progress);
        }, 200);

        const videoUrl = await uploadVideo(item.file);
        clearInterval(interval);
        updateFileProgress(item.id, 100);
        updateFileStatus(item.id, "complete");

        const jobId = await createJob(videoUrl);
        lastJobId = jobId;
      } catch (err) {
        updateFileStatus(
          item.id,
          "error",
          err instanceof Error ? err.message : "Upload failed."
        );
        setError(err instanceof Error ? err.message : "Upload failed.");
        setUploading(false);
        return;
      }
    }

    if (lastJobId) {
      router.push(`/processing?jobId=${lastJobId}`);
    }
  }

  const totalCredits = files.length * 10;

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      {/* Headline */}
      <header className="space-y-2">
        <h2 className="text-4xl font-headline font-bold tracking-tight text-on-surface">
          Upload Analysis
        </h2>
        <p className="text-on-surface-variant font-body">
          Supported formats: MP4, WebM, MOV.{" "}
          <span className="text-primary-dim/80">Max 2GB, 30 min runtime.</span>
        </p>
      </header>

      {/* Animated Upload Zone */}
      <section>
        <AnimatedFileUpload
          files={files}
          onFilesAdd={handleFilesAdd}
          onFileRemove={handleFileRemove}
          onThumbnailGenerated={handleThumbnailGenerated}
          disabled={uploading}
        />
      </section>

      {/* Error display */}
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
                {files.length > 0
                  ? `10 Credits x ${files.length} file${files.length === 1 ? "" : "s"} = ${totalCredits} Credits`
                  : "10 Credits"}
              </p>
            </div>
          </div>
          <div className="h-10 w-[1px] bg-outline-variant/20" />
          <Button
            variant="primary"
            size="lg"
            loading={uploading}
            disabled={files.length === 0 || uploading}
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
