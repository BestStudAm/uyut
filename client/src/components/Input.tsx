import type {
  InputHTMLAttributes,
} from "react";

interface InputProps
  extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export default function Input({
  label,
  error,
  hint,
  id,
  className = "",
  ...props
}: InputProps) {
  return (
    <div className="flex w-full flex-col gap-1.5">
      {label && (
        <label
          htmlFor={id}
          className="text-[14px] font-medium leading-5 text-[#1c1b19]"
        >
          {label}
        </label>
      )}

      <input
        {...props}
        id={id}
        className={[
          "h-11 w-full rounded-[10px] border bg-white px-3.5 text-[15px] text-[#1c1b19] outline-none transition-colors",
          "placeholder:text-[#9a948c]",
          "focus:border-[#2a6f5b]",
          error
            ? "border-[#d14343] focus:border-[#d14343]"
            : "border-[#e6e1da]",
          "disabled:cursor-not-allowed disabled:bg-[#f7f5f2] disabled:opacity-60",
          className,
        ].join(" ")}
      />

      {error && (
        <p className="m-0 text-[13px] leading-5 text-[#d14343]">
          {error}
        </p>
      )}

      {!error && hint && (
        <p className="m-0 text-[13px] leading-5 text-[#9a948c]">
          {hint}
        </p>
      )}
    </div>
  );
}