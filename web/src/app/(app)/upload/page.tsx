"use client";

import { useCallback, useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { PageTransition } from "@/components/ui/PageTransition";
import { Button } from "@/components/ui/Button";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Card } from "@/components/ui/Card";
import {
  AnimatedFileUpload,
  type FileItem,
} from "@/components/upload/AnimatedFileUpload";
import { uploadVideo, uploadImage, uploadText } from "@/lib/upload";
import { createJob } from "./actions";
import { InputTypeSelector, type TabType } from "./InputTypeSelector";
import { ImageUploadZone } from "./ImageUploadZone";
import { DurationSlider } from "./DurationSlider";
import { CONTENT_CATEGORIES } from "@/lib/categories";

interface CreditInfo {
  canAnalyze: boolean;
  isCreator: boolean;
  used: number;
  limit: number | null;
  remaining: number | null;
}

export default function UploadPage() {
  const router = useRouter();

  const [files, setFiles] = useState<FileItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputType, setInputType] = useState<TabType>('video');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageDuration, setImageDuration] = useState(6);
  const [textContent, setTextContent] = useState('');
  const [category, setCategory] = useState("");
  const [credits, setCredits] = useState<CreditInfo | null>(null);

  useEffect(() => {
    fetch('/api/credits')
      .then(res => res.json())
      .then(data => setCredits(data))
      .catch(() => {});
  }, []);

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

        const jobId = await createJob(videoUrl, 'video', null, null, undefined, category || null);
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

  async function handleAnalyzeImage() {
    if (!imageFile) return;
    setUploading(true);
    setError(null);

    try {
      const imageUrl = await uploadImage(imageFile);
      const jobId = await createJob(imageUrl, 'image', null, null, imageDuration, category || null);
      router.push(`/processing?jobId=${jobId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
      setUploading(false);
    }
  }

  async function handleAnalyzeText() {
    if (!textContent.trim()) return;
    setUploading(true);
    setError(null);

    try {
      const textUrl = await uploadText(textContent);
      const jobId = await createJob(textUrl, 'text_spoken', textContent, null, undefined, category || null);
      router.push(`/processing?jobId=${jobId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
      setUploading(false);
    }
  }

  const totalCredits = files.length;

  const FEATURES = [
    {
      icon: "psychology",
      title: "Brain Predictive Model",
      desc: "Predicts real human neural activation patterns from video, audio, and text using brain predictive modeling.",
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
    <PageTransition>
    <div className="max-w-5xl mx-auto pt-6 space-y-6">
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
          maxFiles={credits?.isCreator ? undefined : 1}
        />
      </motion.section>)}

      {/* Image Upload Zone */}
      {inputType === 'image' && (
        <motion.section
          className="relative"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
        >
          <div className="absolute -inset-4 -z-10 rounded-3xl opacity-40 blur-3xl bg-gradient-to-br from-primary/15 via-transparent to-tertiary-fixed/10 pointer-events-none" />
          <div className="space-y-6">
            <ImageUploadZone
              file={imageFile}
              onFileSelect={setImageFile}
              disabled={uploading}
            />
            {imageFile && (
              <DurationSlider
                value={imageDuration}
                onChange={setImageDuration}
                disabled={uploading}
              />
            )}
          </div>
        </motion.section>
      )}

      {/* Image Cost Panel + Analyze Button */}
      {inputType === 'image' && (
        <motion.section
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
                  1 Credit
                </p>
              </div>
            </div>
            <div className="h-10 w-[1px] bg-outline-variant/20" />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-4 py-2.5 bg-white text-black text-sm rounded-lg border border-gray-200 focus:outline-none appearance-none cursor-pointer font-headline font-bold"
            >
              <option value="">Select Category</option>
              {CONTENT_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <div className="h-10 w-[1px] bg-outline-variant/20" />
            <Button
              variant="primary"
              size="lg"
              loading={uploading}
              disabled={!imageFile || uploading || !category}
              onClick={handleAnalyzeImage}
              className="!w-auto px-10 py-4"
            >
              Analyze Image
              <span className="material-symbols-outlined text-lg">bolt</span>
            </Button>
          </GlassPanel>
        </motion.section>
      )}

      {/* Text Input */}
      {inputType === 'text' && (
        <motion.section
          className="relative"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
        >
          <div className="rounded-2xl border-2 border-dashed border-white/10 bg-white/[0.02] p-8 space-y-4">
            <p className="text-center text-xs text-on-surface-variant max-w-md mx-auto">
              Your text will be rendered on screen and spoken aloud, then analyzed for both visual and auditory neural response.
            </p>
            <div className="space-y-2">
              <textarea
                maxLength={500}
                rows={6}
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                disabled={uploading}
                placeholder="Enter your text here — e.g., ad copy, headline, voiceover script..."
                className="bg-white border border-gray-200 rounded-xl p-4 text-gray-900 font-body resize-none w-full focus:outline-none focus:border-primary/50 transition-colors disabled:opacity-50"
              />
              <p className={`text-right text-sm ${textContent.length >= 480 ? 'text-red-400' : 'text-on-surface-variant'}`}>
                {textContent.length}/500
              </p>
            </div>
          </div>
        </motion.section>
      )}

      {/* Text Cost Panel + Analyze Button */}
      {inputType === 'text' && (
        <motion.section
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
                  1 Credit
                </p>
              </div>
            </div>
            <div className="h-10 w-[1px] bg-outline-variant/20" />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-4 py-2.5 bg-white text-black text-sm rounded-lg border border-gray-200 focus:outline-none appearance-none cursor-pointer font-headline font-bold"
            >
              <option value="">Select Category</option>
              {CONTENT_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <div className="h-10 w-[1px] bg-outline-variant/20" />
            <Button
              variant="primary"
              size="lg"
              loading={uploading}
              disabled={!textContent.trim() || uploading || !category}
              onClick={handleAnalyzeText}
              className="!w-auto px-10 py-4"
            >
              Analyze Text
              <span className="material-symbols-outlined text-lg">bolt</span>
            </Button>
          </GlassPanel>
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
                {files.length > 1
                  ? `1 Credit x ${files.length} files = ${totalCredits} Credits`
                  : "1 Credit"}
              </p>
            </div>
          </div>
          <div className="h-10 w-[1px] bg-outline-variant/20" />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-4 py-2.5 bg-white text-black text-sm rounded-lg border border-gray-200 focus:outline-none appearance-none cursor-pointer font-headline font-bold"
          >
            <option value="">Select Category</option>
            {CONTENT_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          <div className="h-10 w-[1px] bg-outline-variant/20" />
          <Button
            variant="primary"
            size="lg"
            loading={uploading}
            disabled={files.length === 0 || uploading || !category}
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
    </PageTransition>
  );
}
