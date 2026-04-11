"use client";

import React, { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { VideoThumbnail } from "./VideoThumbnail";

export interface FileItem {
  id: string;
  file: File;
  thumbnail?: string;
  progress: number;
  status: "pending" | "uploading" | "complete" | "error";
  error?: string;
}

interface AnimatedFileUploadProps {
  files: FileItem[];
  onFilesAdd: (files: File[]) => void;
  onFileRemove: (id: string) => void;
  onThumbnailGenerated?: (id: string, dataUrl: string) => void;
  disabled?: boolean;
  maxFiles?: number;
  maxSizeBytes?: number;
  acceptedTypes?: string[];
}

const DEFAULT_MAX_FILES = 5;
const DEFAULT_MAX_SIZE = 2 * 1024 * 1024 * 1024; // 2GB
const DEFAULT_ACCEPTED_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
];

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${(bytes / 1024).toFixed(1)} KB`;
}

const springTransition = { type: "spring" as const, stiffness: 300, damping: 25 };
const listSpring = { type: "spring" as const, stiffness: 300, damping: 30 };

export function AnimatedFileUpload({
  files,
  onFilesAdd,
  onFileRemove,
  onThumbnailGenerated,
  disabled = false,
  maxFiles = DEFAULT_MAX_FILES,
  maxSizeBytes = DEFAULT_MAX_SIZE,
  acceptedTypes = DEFAULT_ACCEPTED_TYPES,
}: AnimatedFileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const dragCounterRef = useRef(0);

  const triggerShake = useCallback(() => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  }, []);

  const validateFiles = useCallback(
    (incoming: File[]): File[] => {
      setValidationError(null);

      const remaining = maxFiles - files.length;
      if (remaining <= 0) {
        setValidationError(`Maximum ${maxFiles} files allowed.`);
        triggerShake();
        return [];
      }

      const valid: File[] = [];
      for (const file of incoming.slice(0, remaining)) {
        if (!acceptedTypes.includes(file.type)) {
          setValidationError(
            "Unsupported format. Please upload MP4, WebM, or MOV."
          );
          triggerShake();
          continue;
        }
        if (file.size > maxSizeBytes) {
          setValidationError("File too large. Maximum size is 2GB.");
          triggerShake();
          continue;
        }
        valid.push(file);
      }

      if (incoming.length > remaining) {
        setValidationError(
          `Only ${remaining} more file${remaining === 1 ? "" : "s"} can be added.`
        );
      }

      return valid;
    },
    [files.length, maxFiles, maxSizeBytes, acceptedTypes, triggerShake]
  );

  function handleDragEnter(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    setDragActive(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setDragActive(false);
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    const valid = validateFiles(droppedFiles);
    if (valid.length > 0) {
      onFilesAdd(valid);
    }
  }

  function handleBrowse() {
    fileInputRef.current?.click();
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    const valid = validateFiles(selected);
    if (valid.length > 0) {
      onFilesAdd(valid);
    }
    // Reset input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <motion.div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        animate={
          shake
            ? { x: [0, -8, 8, -8, 8, 0] }
            : dragActive
              ? { scale: 1.02, borderColor: "rgba(186, 158, 255, 0.6)" }
              : { scale: 1, borderColor: "rgba(147, 130, 178, 0.3)" }
        }
        transition={shake ? { duration: 0.4 } : springTransition}
        className={`relative w-full h-64 rounded-xl glass-surface ghost-border flex flex-col items-center justify-center p-12 text-center cursor-pointer overflow-hidden ${
          dragActive
            ? "border-2 border-solid"
            : "border-2 border-dashed border-outline-variant/30 hover:border-primary-dim/50"
        }`}
        onClick={!disabled ? handleBrowse : undefined}
      >
        {/* Glow overlay */}
        <motion.div
          className="absolute inset-0 pointer-events-none bg-primary-dim/10 rounded-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: dragActive ? 1 : 0 }}
          transition={{ duration: 0.2 }}
        />

        <div className="relative z-10 flex flex-col items-center">
          <div className="w-14 h-14 rounded-full bg-surface-container-highest flex items-center justify-center mb-4 border border-outline-variant/40">
            <span className="material-symbols-outlined text-3xl text-on-surface-variant">
              cloud_upload
            </span>
          </div>
          <h3 className="text-lg font-headline font-semibold text-on-surface mb-1">
            Drop videos here or click to browse
          </h3>
          <p className="text-on-surface-variant text-sm mb-6">
            MP4, WebM, MOV. Max 2GB per file.
          </p>
          <Button
            variant="secondary"
            size="md"
            onClick={(e) => {
              e.stopPropagation();
              handleBrowse();
            }}
            disabled={disabled}
          >
            Browse Files
          </Button>
        </div>
      </motion.div>

      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        multiple
        className="hidden"
        onChange={handleInputChange}
        disabled={disabled}
      />

      {/* Validation Error */}
      <AnimatePresence>
        {validationError && (
          <motion.p
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="text-error text-sm"
          >
            {validationError}
          </motion.p>
        )}
      </AnimatePresence>

      {/* File List */}
      <AnimatePresence mode="popLayout">
        {files.map((item) => (
          <motion.div
            key={item.id}
            layout
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: -20, scale: 0.95 }}
            transition={listSpring}
            className="bg-surface-container-high rounded-xl p-4 ghost-border flex items-center gap-4"
          >
            {/* Thumbnail */}
            <div className="flex-shrink-0">
              {item.thumbnail ? (
                <img
                  src={item.thumbnail}
                  alt={item.file.name}
                  className="w-12 h-12 rounded-lg object-cover"
                />
              ) : (
                <VideoThumbnail
                  file={item.file}
                  onThumbnailGenerated={(dataUrl) =>
                    onThumbnailGenerated?.(item.id, dataUrl)
                  }
                  className="w-12 h-12"
                />
              )}
            </div>

            {/* File info + progress */}
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="font-headline font-semibold text-on-surface text-sm truncate">
                    {item.file.name}
                  </p>
                  <p className="text-on-surface-variant text-xs">
                    {formatSize(item.file.size)}
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              {(item.status === "uploading" || item.status === "complete") && (
                <div className="bg-surface-container-highest rounded-full h-1.5">
                  <motion.div
                    className="h-1.5 rounded-full bg-gradient-to-r from-[#ba9eff] to-[#5af8fb]"
                    initial={{ width: "0%" }}
                    animate={{ width: `${item.progress}%` }}
                    transition={springTransition}
                  />
                </div>
              )}

              {/* Error message */}
              {item.status === "error" && item.error && (
                <p className="text-error text-xs">{item.error}</p>
              )}
            </div>

            {/* Status / Remove */}
            <div className="flex-shrink-0">
              {item.status === "complete" ? (
                <span className="material-symbols-outlined text-xl text-tertiary-fixed">
                  check_circle
                </span>
              ) : item.status === "uploading" ? (
                <svg
                  className="animate-spin h-5 w-5 text-on-surface-variant"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              ) : (
                <button
                  onClick={() => onFileRemove(item.id)}
                  className="text-on-surface-variant hover:text-on-surface transition-colors p-1"
                  disabled={disabled}
                >
                  <span className="material-symbols-outlined text-xl">
                    close
                  </span>
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
