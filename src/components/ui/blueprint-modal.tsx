"use client";

/**
 * BlueprintModal
 * Modal component with proper click-outside detection and smooth animations
 */

import { useEffect, useRef, useCallback, useState } from "react";
import { X } from "lucide-react";

interface BlueprintModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  closable?: boolean;
  className?: string;
  showCloseButton?: boolean;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
}

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
};

export function BlueprintModal({
  isOpen,
  onClose,
  title,
  children,
  closable = true,
  className = "",
  showCloseButton = true,
  size = "md",
}: BlueprintModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isSelectingText, setIsSelectingText] = useState(false);
  const selectionRef = useRef(false);

  // Handle animation states
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;

    if (isOpen) {
      // Defer state updates to avoid synchronous setState in effect
      requestAnimationFrame(() => {
        setIsVisible(true);
        requestAnimationFrame(() => {
          setIsAnimating(true);
        });
      });
    } else {
      // Defer state updates when closing
      requestAnimationFrame(() => {
        setIsAnimating(false);
        timeoutId = setTimeout(() => {
          setIsVisible(false);
        }, 200); // Match transition duration
      });
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isOpen]);

  // Track text selection start inside modal content
  const handleContentMouseDown = useCallback((e: React.MouseEvent) => {
    // Only track if the click is on a text-selectable element inside modal content
    const target = e.target as HTMLElement;
    const isTextSelectable =
      target.closest(
        'input, textarea, [contenteditable="true"], [contenteditable=""]',
      ) !== null;
    if (isTextSelectable) {
      selectionRef.current = true;
      setIsSelectingText(true);
    }
  }, []);

  // Reset selection state when mouse is released
  const handleContentMouseUp = useCallback(() => {
    selectionRef.current = false;
    setIsSelectingText(false);
  }, []);

  // Handle click outside - only close on explicit clicks outside the modal content
  // NOT on text selection events or focus changes
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (!closable) return;

      // Only close if the click is directly on the backdrop (not bubbled from children)
      // AND the user is not performing a text selection operation
      if (e.target === e.currentTarget && !selectionRef.current) {
        onClose();
      }
    },
    [closable, onClose],
  );

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && closable) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, closable, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isVisible) return null;

  return (
    <div
      className={`
        fixed inset-0 z-[60] flex items-center justify-center p-4
        transition-opacity duration-200
        ${isAnimating ? "opacity-100" : "opacity-0"}
        ${isOpen ? "bg-black/70" : "bg-transparent pointer-events-none"}
      `}
      onClick={handleBackdropClick}
      aria-modal="true"
      role="dialog"
    >
      <div
        ref={modalRef}
        className={`
          bg-[#12141a]/85 backdrop-blur-md backdrop-saturate-150
          border border-white/10
          relative w-full ${sizeClasses[size]}
          rounded-xl
          shadow-2xl shadow-black/60
          transition-all duration-200
          ${isAnimating ? "scale-100 opacity-100" : "scale-95 opacity-0"}
          ${className}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Corner Markers - Top Left */}
        <div className="absolute top-0 left-0 w-6 h-6" aria-hidden="true">
          <div className="absolute top-0 left-0 w-full h-full border-l-2 border-t-2 border-[var(--accent-500)]/60 rounded-tl-xl" />
        </div>

        {/* Corner Markers - Top Right */}
        <div className="absolute top-0 right-0 w-6 h-6" aria-hidden="true">
          <div className="absolute top-0 right-0 w-full h-full border-r-2 border-t-2 border-[var(--accent-500)]/60 rounded-tr-xl" />
        </div>

        {/* Corner Markers - Bottom Left */}
        <div className="absolute bottom-0 left-0 w-6 h-6" aria-hidden="true">
          <div className="absolute bottom-0 left-0 w-full h-full border-l-2 border-b-2 border-[var(--accent-500)]/60 rounded-bl-xl" />
        </div>

        {/* Corner Markers - Bottom Right */}
        <div className="absolute bottom-0 right-0 w-6 h-6" aria-hidden="true">
          <div className="absolute bottom-0 right-0 w-full h-full border-r-2 border-b-2 border-[var(--accent-500)]/60 rounded-br-xl" />
        </div>

        {/* Inner dashed border */}
        <div
          className="absolute inset-2 border border-dashed border-[var(--accent-500)]/20 rounded-lg pointer-events-none"
          aria-hidden="true"
        />

        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            {title && (
              <h2 className="text-lg font-medium text-[var(--gray-50)]">
                {title}
              </h2>
            )}
            {showCloseButton && closable && (
              <button
                onClick={onClose}
                className="
                  w-8 h-8
                  flex items-center justify-center
                  rounded-lg
                  text-[var(--gray-400)] hover:text-[var(--accent-400)]
                  hover:bg-white/10
                  focus:outline-none focus:ring-2 focus:ring-[var(--accent-500)]/50
                  transition-colors duration-150
                "
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div
          className="p-4"
          onMouseDown={handleContentMouseDown}
          onMouseUp={handleContentMouseUp}
          onMouseLeave={handleContentMouseUp}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
