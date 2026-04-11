"use client";

import { useCallback, useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
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

  const FEATURES = [
    {
      icon: "speed",
      title: "Turbo Processing",
      desc: "Parallel neural threads handle frame-by-frame inference at 4x realtime speed.",
      gradient: "from-primary/20 to-primary/5",
      iconBg: "bg-primary-container/20",
      iconColor: "text-primary-dim",
      glowColor: "group-hover:shadow-primary/20",
    },
    {
      icon: "model_training",
      title: "Neural Engine",
      desc: "Proprietary vision models trained specifically for cinematic composition and pacing.",
      gradient: "from-tertiary-fixed/20 to-tertiary-fixed/5",
      iconBg: "bg-tertiary-fixed/10",
      iconColor: "text-tertiary-fixed",
      glowColor: "group-hover:shadow-tertiary-fixed/20",
    },
    {
      icon: "security",
      title: "Encrypted Transit",
      desc: "End-to-end AES-256 encryption. Your raw media is deleted immediately post-analysis.",
      gradient: "from-secondary-fixed/20 to-secondary-fixed/5",
      iconBg: "bg-secondary-container/20",
      iconColor: "text-secondary-fixed",
      glowColor: "group-hover:shadow-secondary-fixed/20",
    },
  ];

  return (
    <div className="max-w-5xl mx-auto pt-6 space-y-10">
      {/* Headline with stagger animation */}
      <motion.header
        className="space-y-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <h2 className="text-4xl font-headline font-bold tracking-tight text-on-surface">
          Upload Analysis
        </h2>
        <p className="text-on-surface-variant font-body">
          Supported formats: MP4, WebM, MOV.{" "}
          <span className="text-primary-dim/80">Max 2GB, 30 min runtime.</span>
        </p>
      </motion.header>

      {/* Upload Zone with ambient glow */}
      <motion.section
        className="relative"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
      >
        {/* Ambient background glow behind upload zone */}
        <div className="absolute -inset-4 -z-10 rounded-3xl opacity-40 blur-3xl bg-gradient-to-br from-primary/15 via-transparent to-tertiary-fixed/10 pointer-events-none" />
        <AnimatedFileUpload
          files={files}
          onFilesAdd={handleFilesAdd}
          onFileRemove={handleFileRemove}
          onThumbnailGenerated={handleThumbnailGenerated}
          disabled={uploading}
        />
      </motion.section>

      {/* Error display */}
      {error && (
        <motion.p
          className="text-error text-sm -mt-6"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
        >
          {error}
        </motion.p>
      )}

      {/* Cost Estimate Glass Panel */}
      <motion.section
        className="flex justify-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
      >
        <GlassPanel className="px-8 py-6 rounded-2xl flex items-center gap-10 shadow-2xl border border-outline-variant/10">
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
      </motion.section>

      {/* Feature Cards with spotlight glow */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {FEATURES.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 + i * 0.1, ease: "easeOut" }}
          >
            <Card
              hover
              className={`group relative p-8 space-y-4 overflow-hidden transition-shadow duration-500 hover:shadow-xl ${f.glowColor}`}
            >
              {/* Gradient hover overlay */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${f.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`}
              />
              {/* Shimmer sweep on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000 ease-in-out pointer-events-none" />

              <div className="relative z-10">
                <div
                  className={`w-12 h-12 rounded-lg ${f.iconBg} flex items-center justify-center ${f.iconColor} transition-transform duration-300 group-hover:scale-110`}
                >
                  <span className="material-symbols-outlined">{f.icon}</span>
                </div>
              </div>
              <div className="relative z-10">
                <h4 className="font-headline font-bold text-on-surface text-lg">
                  {f.title}
                </h4>
                <p className="text-on-surface-variant text-sm mt-2 leading-relaxed">
                  {f.desc}
                </p>
              </div>
            </Card>
          </motion.div>
        ))}
      </section>
    </div>
  );
}
