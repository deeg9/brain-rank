"use client";

import { useCallback, useState, useEffect } from "react";
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
import {
  detectPlatform,
  platformLabel,
  viewsLabel,
  type PostEngagementInput,
} from "@/lib/post-engagement";
import { createJob } from "./actions";
import { InputTypeSelector, type TabType } from "./InputTypeSelector";
import { ImageUploadZone } from "./ImageUploadZone";
import { CONTENT_CATEGORIES } from "@/lib/categories";
import {
  validateVideoFile,
  validateImageFile,
  validateTextContent,
  maxFilesForTier,
} from "@/lib/upload-validation";

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
  const [textContent, setTextContent] = useState('');
  const [category, setCategory] = useState("");
  const [credits, setCredits] = useState<CreditInfo | null>(null);
  // Optional real-world engagement metadata — collapsed by default.
  const [hasPosted, setHasPosted] = useState(false);
  const [postedUrl, setPostedUrl] = useState("");
  const [postedAt, setPostedAt] = useState("");
  const [viewsCount, setViewsCount] = useState("");
  const [likesCount, setLikesCount] = useState("");
  const [commentsCount, setCommentsCount] = useState("");
  const [sharesCount, setSharesCount] = useState("");
  const [bookmarksCount, setBookmarksCount] = useState("");
  const detectedPlatform = detectPlatform(postedUrl);

  // Roll every createJob call's engagement payload from one helper.
  function buildEngagementPayload(): PostEngagementInput | null {
    if (!hasPosted || !postedUrl.trim()) return null;
    return {
      postedUrl: postedUrl.trim(),
      postedAt: postedAt || null,
      viewsCount: viewsCount === "" ? null : Number(viewsCount),
      likesCount: likesCount === "" ? null : Number(likesCount),
      commentsCount: commentsCount === "" ? null : Number(commentsCount),
      sharesCount: sharesCount === "" ? null : Number(sharesCount),
      bookmarksCount: bookmarksCount === "" ? null : Number(bookmarksCount),
    };
  }

  useEffect(() => {
    fetch('/api/credits')
      .then(res => res.json())
      .then(data => setCredits(data))
      .catch(() => {});
  }, []);

  const handleFilesAdd = useCallback(
    async (incoming: File[]) => {
      const cap = maxFilesForTier(credits?.isCreator ?? false);
      const slotsAvailable = Math.max(0, cap - files.length);
      if (slotsAvailable === 0) {
        setError(
          `Batch upload is limited during the research beta — max ${cap} file${cap === 1 ? '' : 's'} at once.`
        );
        return;
      }
      const accepted = incoming.slice(0, slotsAvailable);
      const skippedCount = incoming.length - accepted.length;

      const validated = await Promise.all(
        accepted.map(async (file) => {
          const result = await validateVideoFile(file);
          return { file, result };
        })
      );

      const newItems: FileItem[] = validated.map(({ file, result }) => ({
        id: crypto.randomUUID(),
        file,
        progress: 0,
        status: result.ok ? ("pending" as const) : ("error" as const),
        error: result.ok ? undefined : result.reason,
      }));

      setFiles((prev) => [...prev, ...newItems]);

      if (skippedCount > 0) {
        setError(`${skippedCount} file(s) skipped — batch cap is ${cap}.`);
      } else {
        const firstBad = validated.find((v) => !v.result.ok);
        if (firstBad && !firstBad.result.ok) setError(firstBad.result.reason);
        else setError(null);
      }
    },
    [credits, files.length]
  );

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
    const submittable = files.filter((f) => f.status !== "error");
    if (submittable.length === 0) return;
    setUploading(true);
    setError(null);

    const jobIds: string[] = [];

    for (const item of submittable) {
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

        const result = await createJob(videoUrl, 'video', null, null, category || null, buildEngagementPayload());
        jobIds.push(result.jobId);
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

    if (jobIds.length === 1) {
      router.push(`/processing?jobId=${jobIds[0]}`);
    } else if (jobIds.length > 1) {
      router.push(`/dashboard?batch=${jobIds.length}`);
    }
  }

  async function handleAnalyzeImage() {
    if (!imageFile) return;
    const v = validateImageFile(imageFile);
    if (!v.ok) {
      setError(v.reason);
      return;
    }
    setUploading(true);
    setError(null);

    try {
      const imageUrl = await uploadImage(imageFile);
      const result = await createJob(imageUrl, 'image', null, null, category || null, buildEngagementPayload());
      router.push(`/processing?jobId=${result.jobId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
      setUploading(false);
    }
  }

  async function handleAnalyzeText() {
    if (!textContent.trim()) return;
    const v = validateTextContent(textContent);
    if (!v.ok) {
      setError(v.reason);
      return;
    }
    setUploading(true);
    setError(null);

    try {
      const textUrl = await uploadText(textContent);
      const result = await createJob(textUrl, 'text_spoken', textContent, null, category || null, buildEngagementPayload());
      router.push(`/processing?jobId=${result.jobId}`);
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
        <h2 className="text-3xl md:text-4xl font-headline font-bold tracking-tight text-on-surface">
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
          maxFiles={maxFilesForTier(credits?.isCreator ?? false)}
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
          </div>
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

      {/* Optional: Real-world Performance */}
      <motion.section
        className="flex justify-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.12, ease: "easeOut" }}
      >
        <div className="w-full max-w-xl rounded-2xl border border-outline-variant/30 bg-white shadow-sm">
          {/* Header row: icon + title + toggle switch */}
          <button
            type="button"
            onClick={() => !uploading && setHasPosted((v) => !v)}
            disabled={uploading}
            aria-pressed={hasPosted}
            className="w-full flex items-center gap-4 px-5 py-4 text-left disabled:opacity-50"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-700">
              <span className="material-symbols-outlined text-[20px]">trending_up</span>
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-headline font-bold text-sm text-on-surface">
                  Has this been posted publicly?
                </h3>
                <span className="text-[9px] uppercase tracking-widest font-bold text-gray-500 px-1.5 py-0.5 rounded bg-gray-100">
                  Optional
                </span>
              </div>
              <p className="text-xs text-on-surface-variant mt-0.5 leading-snug">
                Share where you posted this and how it performed — helps the research dataset.
              </p>
            </div>
            {/* Toggle switch */}
            <span
              className={`relative shrink-0 inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                hasPosted ? "bg-black" : "bg-gray-200"
              }`}
              aria-hidden="true"
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                  hasPosted ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </span>
          </button>

          {hasPosted && (
            <div className="px-5 pb-5 pt-1 space-y-3 border-t border-gray-100">
              {/* URL + detected platform */}
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold text-on-surface-variant mb-1">
                  Link
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    inputMode="url"
                    placeholder="https://www.tiktok.com/@you/video/..."
                    value={postedUrl}
                    onChange={(e) => setPostedUrl(e.target.value)}
                    disabled={uploading}
                    className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-black/40 transition-colors disabled:opacity-50"
                  />
                  {detectedPlatform && (
                    <span className="inline-flex items-center gap-1 shrink-0 px-2 py-1 rounded-full border border-outline-variant/30 text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">
                      {platformLabel(detectedPlatform)}
                    </span>
                  )}
                </div>
              </div>

              {/* Posted date */}
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold text-on-surface-variant mb-1">
                  Date posted
                </label>
                <input
                  type="date"
                  max={new Date().toISOString().slice(0, 10)}
                  min="2010-01-01"
                  value={postedAt}
                  onChange={(e) => setPostedAt(e.target.value)}
                  disabled={uploading}
                  className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-black/40 transition-colors disabled:opacity-50"
                />
              </div>

              {/* Counts */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-on-surface-variant mb-1">
                    {viewsLabel(detectedPlatform)}
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    placeholder="0"
                    value={viewsCount}
                    onChange={(e) => setViewsCount(e.target.value)}
                    disabled={uploading}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-black/40 transition-colors disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-on-surface-variant mb-1">
                    Likes
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    placeholder="0"
                    value={likesCount}
                    onChange={(e) => setLikesCount(e.target.value)}
                    disabled={uploading}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-black/40 transition-colors disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-on-surface-variant mb-1">
                    Comments
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    placeholder="0"
                    value={commentsCount}
                    onChange={(e) => setCommentsCount(e.target.value)}
                    disabled={uploading}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-black/40 transition-colors disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-on-surface-variant mb-1">
                    Shares
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    placeholder="0"
                    value={sharesCount}
                    onChange={(e) => setSharesCount(e.target.value)}
                    disabled={uploading}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-black/40 transition-colors disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-on-surface-variant mb-1">
                    Bookmarks
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    placeholder="0"
                    value={bookmarksCount}
                    onChange={(e) => setBookmarksCount(e.target.value)}
                    disabled={uploading}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-black/40 transition-colors disabled:opacity-50"
                  />
                </div>
              </div>

              <p className="text-[10px] text-on-surface-variant/70 leading-snug">
                Metrics as of {new Date().toLocaleDateString()}. You can update
                them later from the analysis page.
              </p>
            </div>
          )}
        </div>
      </motion.section>

      {/* Image Cost Panel + Analyze Button */}
      {inputType === 'image' && (
        <motion.section
          className="flex justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
        >
          <GlassPanel className="px-6 py-5 md:px-8 md:py-6 rounded-2xl flex flex-col md:flex-row md:items-center gap-4 md:gap-10 shadow-2xl border border-outline-variant/10 w-full max-w-xl md:max-w-none md:w-auto">
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
            <div className="hidden md:block h-10 w-[1px] bg-outline-variant/20" />
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
            <div className="hidden md:block h-10 w-[1px] bg-outline-variant/20" />
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

      {/* Text Cost Panel + Analyze Button */}
      {inputType === 'text' && (
        <motion.section
          className="flex justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
        >
          <GlassPanel className="px-6 py-5 md:px-8 md:py-6 rounded-2xl flex flex-col md:flex-row md:items-center gap-4 md:gap-10 shadow-2xl border border-outline-variant/10 w-full max-w-xl md:max-w-none md:w-auto">
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
            <div className="hidden md:block h-10 w-[1px] bg-outline-variant/20" />
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
            <div className="hidden md:block h-10 w-[1px] bg-outline-variant/20" />
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

      {/* Cost Estimate Glass Panel (video only) */}
      {inputType === 'video' && (<motion.section
        className="flex justify-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
      >
        <GlassPanel className="px-6 py-5 md:px-8 md:py-6 rounded-2xl flex flex-col md:flex-row md:items-center gap-4 md:gap-10 shadow-2xl border border-outline-variant/10 w-full max-w-xl md:max-w-none md:w-auto">
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
          <div className="hidden md:block h-10 w-[1px] bg-outline-variant/20" />
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
          <div className="hidden md:block h-10 w-[1px] bg-outline-variant/20" />
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
