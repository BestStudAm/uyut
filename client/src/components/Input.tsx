import type {
  InputHTMLAttributes,
  ReactNode,
} from "react";

interface InputProps
  extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  rightElement?: ReactNode;
}

export default function Input({
  label,
  error,
  hint,
  rightElement,
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

      <div className="relative w-full">
        <input
          {...props}
          id={id}
          className={[
            "h-12 w-full rounded-[10px] border bg-white px-4 text-[16px] text-[#1c1b19] outline-none transition-colors",
            "placeholder:text-[#9a948c]",
            "focus:border-[#2a6f5b]",
            rightElement ? "pr-12" : "",
            error
              ? "border-[#d14343] focus:border-[#d14343]"
              : "border-[#e6e1da]",
            "disabled:cursor-not-allowed disabled:bg-[#f7f5f2] disabled:opacity-60",
            className,
          ].join(" ")}
        />

        {rightElement && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {rightElement}
          </div>
        )}
      </div>

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