"use client";

import React, { useCallback, useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";

interface ImageUploadZoneProps {
  file: File | null;
  onFileSelect: (file: File | null) => void;
  disabled?: boolean;
}

const ACCEPTED_TYPES = ["image/jpeg", "image/png"];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const MIN_DIMENSION = 256;

const springTransition = { type: "spring" as const, stiffness: 300, damping: 25 };

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function validateDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image for validation."));
    };
    img.src = url;
  });
}

export function ImageUploadZone({ file, onFileSelect, disabled = false }: ImageUploadZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const dragCounterRef = useRef(0);

  // Manage preview URL lifecycle
  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [file]);

  const triggerShake = useCallback(() => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  }, []);

  const validateAndSelect = useCallback(
    async (incoming: File) => {
      setValidationError(null);

      if (!ACCEPTED_TYPES.includes(incoming.type)) {
        setValidationError("Unsupported format. Please upload JPEG or PNG.");
        triggerShake();
        return;
      }

      if (incoming.size > MAX_SIZE) {
        setValidationError("File too large. Maximum size is 10MB.");
        triggerShake();
        return;
      }

      try {
        const { width, height } = await validateDimensions(incoming);
        if (width < MIN_DIMENSION || height < MIN_DIMENSION) {
          setValidationError("Image too small. Minimum 256x256 pixels.");
          triggerShake();
          return;
        }
      } catch {
        setValidationError("Failed to read image dimensions.");
        triggerShake();
        return;
      }

      onFileSelect(incoming);
    },
    [onFileSelect, triggerShake]
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
    if (droppedFiles.length > 0) {
      validateAndSelect(droppedFiles[0]);
    }
  }

  function handleBrowse() {
    fileInputRef.current?.click();
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    if (selected.length > 0) {
      validateAndSelect(selected[0]);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleRemove() {
    onFileSelect(null);
    setValidationError(null);
  }

  return (
    <div className="space-y-4">
      <AnimatePresence mode="wait">
        {!file ? (
          /* Drop Zone */
          <motion.div
            key="dropzone"
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            initial={{ opacity: 0, y: 20 }}
            animate={
              shake
                ? { opacity: 1, y: 0, x: [0, -8, 8, -8, 8, 0] }
                : dragActive
                  ? { opacity: 1, y: 0, scale: 1.02, borderColor: "rgba(186, 158, 255, 0.6)" }
                  : { opacity: 1, y: 0, scale: 1, borderColor: "rgba(147, 130, 178, 0.3)" }
            }
            exit={{ opacity: 0, y: -10 }}
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
              <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-4 border border-gray-200">
                <span className="material-symbols-outlined text-3xl text-gray-600">
                  image
                </span>
              </div>
              <h3 className="text-lg font-headline font-semibold text-on-surface mb-1">
                Drop an image here or click to browse
              </h3>
              <p className="text-on-surface-variant text-sm mb-6">
                JPEG, PNG. Max 10MB.
              </p>
              <Button
                variant="primary"
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
        ) : (
          /* Preview */
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={springTransition}
            className="rounded-xl glass-surface ghost-border p-6 space-y-4"
          >
            <div className="relative flex justify-center">
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt={file.name}
                  className="max-h-64 rounded-xl object-contain"
                />
              )}
              {!disabled && (
                <button
                  onClick={handleRemove}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="material-symbols-outlined text-lg text-on-surface-variant">image</span>
              <span className="text-on-surface font-medium truncate">{file.name}</span>
              <span className="text-on-surface-variant">{formatSize(file.size)}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png"
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
    </div>
  );
}
