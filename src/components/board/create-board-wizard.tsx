"use client";

/**
 * CreateBoardWizard
 * 3-step wizard: Name+Desc → Size/Template → Background
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight, Check, Upload, X } from "lucide-react";
import type { Board, CreateBoardInput } from "@/types/board";
import { createBoard } from "@/services/board-service";
import { uploadAsset } from "@/services/asset-service";
import { showError } from "@/lib/toast";

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

type BackgroundType = "none" | "color" | "image";

interface SizeTemplate {
  label: string;
  width: number;
  height: number;
}

// ─────────────────────────────────────────
// Constants
// ─────────────────────────────────────────

const SIZE_TEMPLATES: SizeTemplate[] = [
  { label: "HD (16:9)", width: 1920, height: 1080 },
  { label: "HD Vertical", width: 1080, height: 1920 },
  { label: "A4 Portrait", width: 2480, height: 3508 },
  { label: "A4 Landscape", width: 3508, height: 2480 },
  { label: "Letter Portrait", width: 2550, height: 3300 },
  { label: "Letter Landscape", width: 3300, height: 2550 },
  { label: "Square", width: 2000, height: 2000 },
];

const MIN_SIZE = 100;
const MAX_SIZE = 10000;

const PRESET_COLORS = [
  "#ffffff",
  "#f8fafc",
  "#1e293b",
  "#0f172a",
  "#fef9c3",
  "#dcfce7",
  "#dbeafe",
  "#fce7f3",
];

// ─────────────────────────────────────────
// Props
// ─────────────────────────────────────────

interface CreateBoardWizardProps {
  workspaceId: string;
  userId: string;
  onComplete: (board: Board) => void;
  onCancel: () => void;
}

// ─────────────────────────────────────────
// Main component
// ─────────────────────────────────────────

export function CreateBoardWizard({
  workspaceId,
  userId,
  onComplete,
  onCancel,
}: CreateBoardWizardProps) {
  const [step, setStep] = useState(0); // 0=Name, 1=Size, 2=Background
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1: Name & Description
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  // Step 2: Size
  const [selectedTemplate, setSelectedTemplate] = useState<number>(0); // index into SIZE_TEMPLATES, -1 = custom
  const [customWidth, setCustomWidth] = useState(1920);
  const [customHeight, setCustomHeight] = useState(1080);

  // Step 3: Background
  const [bgType, setBgType] = useState<BackgroundType>("none");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [bgFile, setBgFile] = useState<File | null>(null);
  const [bgPreviewUrl, setBgPreviewUrl] = useState<string | null>(null);
  const [bgImageDims, setBgImageDims] = useState<{
    w: number;
    h: number;
  } | null>(null);
  const [useBgSizeForBoard, setUseBgSizeForBoard] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus name input on mount
  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (bgPreviewUrl) URL.revokeObjectURL(bgPreviewUrl);
    };
  }, [bgPreviewUrl]);

  // ── Derived values ──
  const activeWidth =
    selectedTemplate === -1
      ? customWidth
      : (SIZE_TEMPLATES[selectedTemplate]?.width ?? 1920);
  const activeHeight =
    selectedTemplate === -1
      ? customHeight
      : (SIZE_TEMPLATES[selectedTemplate]?.height ?? 1080);

  const finalWidth =
    useBgSizeForBoard && bgImageDims ? bgImageDims.w : activeWidth;
  const finalHeight =
    useBgSizeForBoard && bgImageDims ? bgImageDims.h : activeHeight;

  // ── File handling ──
  const processFile = useCallback(
    async (file: File) => {
      const isPdf = file.type === "application/pdf";
      const isImage = file.type.startsWith("image/");

      if (!isPdf && !isImage) {
        showError("Invalid file", "Please upload an image or PDF file");
        return;
      }

      // Revoke previous blob URL
      if (bgPreviewUrl) URL.revokeObjectURL(bgPreviewUrl);

      if (isPdf) {
        try {
          const { pdfPageToImageBlob } = await import("@/lib/pdf-to-image");
          const result = await pdfPageToImageBlob(file);
          const convertedFile = new File(
            [result.blob],
            file.name.replace(/\.pdf$/i, ".png"),
            {
              type: "image/png",
            },
          );
          const url = URL.createObjectURL(result.blob);
          setBgFile(convertedFile);
          setBgPreviewUrl(url);
          setBgImageDims({ w: result.width, h: result.height });
          setBgType("image");
        } catch {
          showError("PDF error", "Failed to convert PDF to image");
        }
      } else {
        const url = URL.createObjectURL(file);
        setBgFile(file);
        setBgPreviewUrl(url);
        setBgType("image");
        // Get dimensions
        const img = new Image();
        img.onload = () => {
          setBgImageDims({ w: img.naturalWidth, h: img.naturalHeight });
        };
        img.src = url;
      }
    },
    [bgPreviewUrl],
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
      // Reset the input so the same file can be re-selected
      e.target.value = "";
    },
    [processFile],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDraggingOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) processFile(file);
    },
    [processFile],
  );

  const clearBgFile = useCallback(() => {
    if (bgPreviewUrl) URL.revokeObjectURL(bgPreviewUrl);
    setBgFile(null);
    setBgPreviewUrl(null);
    setBgImageDims(null);
    setUseBgSizeForBoard(false);
    setBgType("none");
  }, [bgPreviewUrl]);

  // ── Validation ──
  const step0Valid = name.trim().length >= 1;
  const step1Valid =
    selectedTemplate !== -1 ||
    (customWidth >= MIN_SIZE &&
      customWidth <= MAX_SIZE &&
      customHeight >= MIN_SIZE &&
      customHeight <= MAX_SIZE);

  const canAdvance = step === 0 ? step0Valid : step === 1 ? step1Valid : true;

  // ── Navigation ──
  const handleNext = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!canAdvance) return;
      if (step < 2) setStep((s) => s + 1);
    },
    [canAdvance, step],
  );

  const handleBack = useCallback(() => {
    if (step > 0) setStep((s) => s - 1);
  }, [step]);

  // ── Submit ──
  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      let backgroundAssetId: string | undefined;

      // Upload background image/PDF if provided
      if (bgType === "image" && bgFile) {
        const asset = await uploadAsset(bgFile, workspaceId, userId);
        backgroundAssetId = asset.$id;
      }

      const input: CreateBoardInput = {
        workspaceId,
        name: name.trim(),
        description: description.trim() || undefined,
        width: finalWidth,
        height: finalHeight,
        backgroundType: bgType,
        backgroundColor: bgType === "color" ? bgColor : "#ffffff",
        backgroundAssetId,
        createdBy: userId,
      };

      const board = await createBoard(input);
      onComplete(board);
    } catch (err) {
      console.error("Failed to create board:", err);
      showError(
        "Error",
        err instanceof Error ? err.message : "Failed to create board",
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [
    isSubmitting,
    bgType,
    bgFile,
    workspaceId,
    userId,
    name,
    description,
    finalWidth,
    finalHeight,
    bgColor,
    onComplete,
  ]);

  // Enter key advances step or submits
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        if (step < 2) handleNext();
        else if (!isSubmitting) handleSubmit();
      }
    },
    [step, handleNext, handleSubmit, isSubmitting],
  );

  // ─────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6" onKeyDown={handleKeyDown}>
      {/* Step dots */}
      <div className="flex items-center justify-center gap-2">
        {["Name", "Size", "Background"].map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div
              className={`
                flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold transition-colors
                ${i < step ? "bg-[var(--accent-500)] text-white" : i === step ? "bg-[var(--accent-500)]/80 text-white ring-2 ring-[var(--accent-500)]/40" : "bg-white/10 text-[var(--gray-400)]"}
              `}
            >
              {i < step ? <Check size={14} /> : i + 1}
            </div>
            <span
              className={`text-xs ${i === step ? "text-white" : "text-[var(--gray-500)]"}`}
            >
              {label}
            </span>
            {i < 2 && <div className="w-8 h-px bg-white/10" />}
          </div>
        ))}
      </div>

      {/* ── Step 0: Name & Description ── */}
      {step === 0 && (
        <form onSubmit={handleNext} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--gray-300)] mb-1.5">
              Board Name <span className="text-red-400">*</span>
            </label>
            <input
              ref={nameInputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              placeholder="e.g. Project Layout"
              className="w-full px-3 py-2 rounded-lg bg-[var(--navy-800)] border border-white/20 text-white placeholder-[var(--gray-500)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-500)]/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--gray-300)] mb-1.5">
              Description{" "}
              <span className="text-[var(--gray-500)] font-normal">
                (optional)
              </span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="What is this board for?"
              className="w-full px-3 py-2 rounded-lg bg-[var(--navy-800)] border border-white/20 text-white placeholder-[var(--gray-500)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-500)]/50 resize-none"
            />
          </div>
          {/* hidden submit for Enter key */}
          <button type="submit" className="hidden" />
        </form>
      )}

      {/* ── Step 1: Size & Template ── */}
      {step === 1 && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {SIZE_TEMPLATES.map((tpl, i) => (
              <button
                key={tpl.label}
                type="button"
                onClick={() => setSelectedTemplate(i)}
                className={`
                  flex flex-col items-center justify-center gap-1 p-3 rounded-lg border transition-colors text-xs
                  ${selectedTemplate === i ? "border-[var(--accent-500)] bg-[var(--accent-500)]/10 text-white" : "border-white/10 bg-white/5 text-[var(--gray-400)] hover:bg-white/10"}
                `}
              >
                {/* Aspect-ratio mini-preview */}
                <AspectRect width={tpl.width} height={tpl.height} />
                <span className="font-medium mt-1">{tpl.label}</span>
                <span className="text-[var(--gray-500)]">
                  {tpl.width}×{tpl.height}
                </span>
              </button>
            ))}
            {/* Custom */}
            <button
              type="button"
              onClick={() => setSelectedTemplate(-1)}
              className={`
                flex flex-col items-center justify-center gap-1 p-3 rounded-lg border transition-colors text-xs
                ${selectedTemplate === -1 ? "border-[var(--accent-500)] bg-[var(--accent-500)]/10 text-white" : "border-white/10 bg-white/5 text-[var(--gray-400)] hover:bg-white/10"}
              `}
            >
              <div className="w-8 h-8 rounded border-2 border-dashed border-current flex items-center justify-center text-base">
                ✎
              </div>
              <span className="font-medium mt-1">Custom</span>
            </button>
          </div>

          {/* Custom size inputs */}
          {selectedTemplate === -1 && (
            <div className="flex gap-3 items-center">
              <div className="flex-1">
                <label className="block text-xs text-[var(--gray-400)] mb-1">
                  Width (px)
                </label>
                <input
                  type="number"
                  min={MIN_SIZE}
                  max={MAX_SIZE}
                  value={customWidth}
                  onChange={(e) => setCustomWidth(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--navy-800)] border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-500)]/50"
                />
              </div>
              <span className="text-[var(--gray-500)] mt-4">×</span>
              <div className="flex-1">
                <label className="block text-xs text-[var(--gray-400)] mb-1">
                  Height (px)
                </label>
                <input
                  type="number"
                  min={MIN_SIZE}
                  max={MAX_SIZE}
                  value={customHeight}
                  onChange={(e) => setCustomHeight(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--navy-800)] border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-500)]/50"
                />
              </div>
            </div>
          )}

          {/* Live aspect ratio preview */}
          <div className="flex items-center justify-center py-2">
            <AspectRect
              width={activeWidth}
              height={activeHeight}
              size={80}
              showLabel
            />
          </div>

          {(customWidth < MIN_SIZE ||
            customHeight < MIN_SIZE ||
            customWidth > MAX_SIZE ||
            customHeight > MAX_SIZE) &&
            selectedTemplate === -1 && (
              <p className="text-xs text-red-400">
                Size must be between {MIN_SIZE} and {MAX_SIZE} px
              </p>
            )}
        </div>
      )}

      {/* ── Step 2: Background ── */}
      {step === 2 && (
        <div className="flex flex-col gap-4">
          {/* Type selector */}
          <div className="flex gap-2">
            {(["none", "color", "image"] as BackgroundType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setBgType(t)}
                className={`flex-1 py-2 px-3 rounded-lg border text-xs font-medium transition-colors capitalize
                  ${bgType === t ? "border-[var(--accent-500)] bg-[var(--accent-500)]/10 text-white" : "border-white/10 bg-white/5 text-[var(--gray-400)] hover:bg-white/10"}`}
              >
                {t === "none"
                  ? "None"
                  : t === "color"
                    ? "Color"
                    : "Image / PDF"}
              </button>
            ))}
          </div>

          {/* Color picker */}
          {bgType === "color" && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setBgColor(c)}
                    style={{ backgroundColor: c }}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${bgColor === c ? "border-[var(--accent-500)] scale-110" : "border-white/20"}`}
                    title={c}
                  />
                ))}
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={bgColor}
                  onInput={(e) =>
                    setBgColor((e.target as HTMLInputElement).value)
                  }
                  className="w-10 h-10 rounded cursor-pointer border border-white/20 bg-transparent"
                />
                <input
                  type="text"
                  value={bgColor}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^#[0-9a-fA-F]{0,6}$/.test(val)) setBgColor(val);
                  }}
                  maxLength={7}
                  className="flex-1 px-3 py-2 rounded-lg bg-[var(--navy-800)] border border-white/20 text-white font-mono focus:outline-none focus:ring-2 focus:ring-[var(--accent-500)]/50"
                />
                <div
                  className="w-10 h-10 rounded border border-white/20"
                  style={{ backgroundColor: bgColor }}
                />
              </div>
            </div>
          )}

          {/* Image / PDF upload */}
          {bgType === "image" && (
            <div className="flex flex-col gap-3">
              {!bgPreviewUrl ? (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingOver(true);
                  }}
                  onDragLeave={() => setIsDraggingOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`
                    flex flex-col items-center justify-center gap-2 p-8 rounded-lg border-2 border-dashed cursor-pointer transition-colors
                    ${isDraggingOver ? "border-[var(--accent-500)] bg-[var(--accent-500)]/10" : "border-white/20 hover:border-white/40"}
                  `}
                >
                  <Upload size={24} className="text-[var(--gray-400)]" />
                  <span className="text-sm text-[var(--gray-400)]">
                    Drop image or PDF, or click to browse
                  </span>
                  <span className="text-xs text-[var(--gray-500)]">
                    JPG, PNG, GIF, WebP, SVG, PDF
                  </span>
                </div>
              ) : (
                <div className="relative rounded-lg overflow-hidden border border-white/20">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={bgPreviewUrl}
                    alt="Background preview"
                    className="w-full max-h-40 object-contain bg-black/20"
                  />
                  <button
                    type="button"
                    onClick={clearBgFile}
                    className="absolute top-2 right-2 p-1 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors"
                  >
                    <X size={14} />
                  </button>
                  {bgImageDims && (
                    <div className="px-3 py-1.5 bg-black/40 text-xs text-[var(--gray-400)]">
                      {bgImageDims.w}×{bgImageDims.h} px
                    </div>
                  )}
                </div>
              )}

              {bgImageDims && (
                <label className="flex items-center gap-2 text-sm text-[var(--gray-300)] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useBgSizeForBoard}
                    onChange={(e) => setUseBgSizeForBoard(e.target.checked)}
                    className="rounded border-white/20 accent-[var(--accent-500)]"
                  />
                  Use image size as board size ({bgImageDims.w}×{bgImageDims.h})
                </label>
              )}
            </div>
          )}

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={handleFileInputChange}
          />

          {/* Final size summary */}
          <div className="text-xs text-[var(--gray-500)] text-right">
            Board size:{" "}
            <span className="text-[var(--gray-300)] font-medium">
              {finalWidth}×{finalHeight} px
            </span>
          </div>
        </div>
      )}

      {/* ── Navigation buttons ── */}
      <div className="flex items-center justify-between pt-2 border-t border-white/10">
        <button
          type="button"
          onClick={step === 0 ? onCancel : handleBack}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[var(--gray-300)] hover:bg-white/10 transition-colors text-sm"
        >
          {step === 0 ? (
            "Cancel"
          ) : (
            <>
              <ChevronLeft size={16} /> Back
            </>
          )}
        </button>

        {step < 2 ? (
          <button
            type="button"
            onClick={() => handleNext()}
            disabled={!canAdvance}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--accent-500)] hover:bg-[var(--accent-600)] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
          >
            Next <ChevronRight size={16} />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--accent-500)] hover:bg-[var(--accent-600)] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
          >
            {isSubmitting ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating…
              </>
            ) : (
              <>
                <Check size={16} /> Create Board
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Helper: Aspect-ratio mini rectangle
// ─────────────────────────────────────────

function AspectRect({
  width,
  height,
  size = 32,
  showLabel = false,
}: {
  width: number;
  height: number;
  size?: number;
  showLabel?: boolean;
}) {
  const aspect = width / height;
  let rw: number, rh: number;

  if (aspect >= 1) {
    rw = size;
    rh = Math.round(size / aspect);
  } else {
    rh = size;
    rw = Math.round(size * aspect);
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="border border-current rounded-sm bg-current/10"
        style={{ width: rw, height: rh }}
      />
      {showLabel && (
        <span className="text-xs text-[var(--gray-400)]">
          {width}×{height}
        </span>
      )}
    </div>
  );
}
