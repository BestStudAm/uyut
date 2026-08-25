interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  label?: string;
}

export default function Spinner({
  size = "md",
  label,
}: SpinnerProps) {
  const sizes = {
    sm: "size-4 border-2",
    md: "size-6 border-2",
    lg: "size-9 border-[3px]",
  };

  return (
    <div
      className="inline-flex items-center gap-2"
      role="status"
      aria-label={label ?? "Загрузка"}
    >
      <span
        className={[
          "animate-spin rounded-full border-[#dcd6ce] border-t-[#2a6f5b]",
          sizes[size],
        ].join(" ")}
      />

      {label && (
        <span className="text-[14px] text-[#6b6560]">
          {label}
        </span>
      )}
    </div>
  );
}