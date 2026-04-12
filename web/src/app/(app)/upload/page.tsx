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
import { InputTypeSelector, type TabType } from "./InputTypeSelector";

export default function UploadPage() {
  const router = useRouter();

  const [files, setFiles] = useState<FileItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputType, setInputType] = useState<TabType>('video');
  const [textMode, setTextMode] = useState<'spoken' | 'visual'>('spoken');

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
      icon: "psychology",
      title: "TRIBE v2 by Meta",
      desc: "Powered by Meta's brain-predictive foundation model. Predicts real human neural activation patterns from video, audio, and text.",
    },
    {
      icon: "hub",
      title: "9 Brain Networks",
      desc: "Tracks attention, reward, emotion, social cognition, and 5 more neural networks across every 2-second segment of your content.",
    },
    {
      icon: "neurology",
      title: "3D Brain Mapping",
      desc: "Visualize activation on an interactive 3D brain model with 20,000+ cortical vertices mapped to real neuroscience data.",
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
          Upload Media
        </h2>
        <p className="text-on-surface-variant font-body">
          {inputType === 'video' && <>Supported formats: MP4, WebM, MOV.{" "}<span className="text-on-surface-variant/80">Max 2GB, 30 min runtime.</span></>}
          {inputType === 'image' && <>Supported formats: JPEG, PNG.{" "}<span className="text-on-surface-variant/80">Max 10MB.</span></>}
          {inputType === 'text' && <>Enter text for neural analysis.{" "}<span className="text-on-surface-variant/80">Max 500 characters.</span></>}
        </p>
      </motion.header>

      {/* Input Type Selector */}
      <motion.div
        className="flex justify-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05, ease: "easeOut" }}
      >
        <InputTypeSelector
          selected={inputType}
          onChange={setInputType}
          disabled={uploading}
        />
      </motion.div>

      {/* Video Upload Zone */}
      {inputType === 'video' && (<motion.section
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
      </motion.section>)}

      {/* Image Placeholder */}
      {inputType === 'image' && (
        <motion.section
          className="relative"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
        >
          <div className="rounded-2xl border-2 border-dashed border-white/10 bg-white/[0.02] p-16 text-center space-y-4">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant/50">image</span>
            <p className="text-on-surface-variant font-medium">Image upload coming soon</p>
            <p className="text-on-surface-variant/60 text-sm">Upload JPEG or PNG images for neural analysis</p>
          </div>
        </motion.section>
      )}

      {/* Text Placeholder */}
      {inputType === 'text' && (
        <motion.section
          className="relative"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
        >
          <div className="rounded-2xl border-2 border-dashed border-white/10 bg-white/[0.02] p-16 text-center space-y-6">
            <div className="flex gap-1 p-1 rounded-lg bg-white/5 border border-white/10 w-fit mx-auto">
              <button
                onClick={() => setTextMode('spoken')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  textMode === 'spoken'
                    ? 'bg-white/10 text-on-surface border border-white/10'
                    : 'text-on-surface-variant hover:text-on-surface/80'
                }`}
              >
                Spoken
              </button>
              <button
                onClick={() => setTextMode('visual')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  textMode === 'visual'
                    ? 'bg-white/10 text-on-surface border border-white/10'
                    : 'text-on-surface-variant hover:text-on-surface/80'
                }`}
              >
                Visual
                <span className="ml-1.5 text-[10px] uppercase tracking-wider text-amber-400/80 font-bold">Experimental</span>
              </button>
            </div>
            <span className="material-symbols-outlined text-5xl text-on-surface-variant/50">text_fields</span>
            <p className="text-on-surface-variant font-medium">Text input coming soon</p>
            <p className="text-on-surface-variant/60 text-sm">
              {textMode === 'spoken'
                ? 'Enter text for neural speech analysis via TRIBE v2'
                : 'Render text as a styled visual card for neural analysis'}
            </p>
          </div>
        </motion.section>
      )}

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

      {/* Cost Estimate Glass Panel (video only) */}
      {inputType === 'video' && (<motion.section
        className="flex justify-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
      >
        <GlassPanel className="px-8 py-6 rounded-2xl flex items-center gap-10 shadow-2xl border border-outline-variant/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
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
      </motion.section>)}

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
              className="group relative p-8 space-y-4 overflow-hidden transition-shadow duration-500 hover:shadow-xl hover:shadow-on-surface/5"
            >
              {/* Shimmer sweep on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000 ease-in-out pointer-events-none" />

              <div className="relative z-10">
                <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 transition-transform duration-300 group-hover:scale-110">
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
