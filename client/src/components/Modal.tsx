"use client";

import {
  useEffect,
  type ReactNode,
} from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  width?: "sm" | "md" | "lg";
  closeOnOverlayClick?: boolean;
}

export default function Modal({
  open,
  onClose,
  title,
  children,
  width = "md",
  closeOnOverlayClick = true,
}: ModalProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (
      event: KeyboardEvent,
    ) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener(
      "keydown",
      handleKeyDown,
    );

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown,
      );

      document.body.style.overflow =
        previousOverflow;
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  const widths = {
    sm: "max-w-[400px]",
    md: "max-w-[520px]",
    lg: "max-w-[720px]",
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-[rgba(28,27,25,0.45)] p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={
        title ? "modal-title" : undefined
      }
      onMouseDown={(event) => {
        if (
          closeOnOverlayClick &&
          event.target === event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <div
        className={[
          "relative w-full rounded-[16px] bg-white p-6 shadow-[0_12px_40px_rgba(0,0,0,0.2)]",
          widths[width],
        ].join(" ")}
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        <div className="flex items-start justify-between gap-4">
          {title && (
            <h2
              id="modal-title"
              className="m-0 text-[22px] font-semibold leading-7 text-[#1c1b19]"
            >
              {title}
            </h2>
          )}

          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
            className="ml-auto flex size-8 shrink-0 items-center justify-center rounded-full border-0 bg-transparent text-[22px] leading-none text-[#6b6560] transition hover:bg-[#f7f5f2] hover:text-[#1c1b19]"
          >
            ×
          </button>
        </div>

        <div className={title ? "mt-5" : ""}>
          {children}
        </div>
      </div>
    </div>
  );
}