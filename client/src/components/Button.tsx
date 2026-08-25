import type { ButtonHTMLAttributes } from "react";

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}

export default function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
  children,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded-[10px] border font-medium transition-colors duration-200 disabled:pointer-events-none disabled:opacity-50";

  const variants = {
    primary:
      "border-[#2a6f5b] bg-[#2a6f5b] text-white hover:bg-[#235e4d]",
    secondary:
      "border-[#e6e1da] bg-white text-[#1c1b19] hover:bg-[#f7f5f2]",
    danger:
      "border-[#d14343] bg-[#d14343] text-white hover:bg-[#b93636]",
    ghost:
      "border-transparent bg-transparent text-[#1c1b19] hover:bg-[#f7f5f2]",
  };

  const sizes = {
    sm: "h-9 px-3 text-[13px]",
    md: "h-11 px-4 text-[14px]",
    lg: "h-[52px] px-6 text-[16px]",
  };

  return (
    <button
      {...props}
      className={[
        base,
        variants[variant],
        sizes[size],
        fullWidth ? "w-full" : "",
        className,
      ].join(" ")}
    >
      {children}
    </button>
  );
}