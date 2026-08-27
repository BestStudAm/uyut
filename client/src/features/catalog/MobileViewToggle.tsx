"use client";

interface MobileViewToggleProps {
  view: "list" | "map";
  onChange: (view: "list" | "map") => void;
}

export default function MobileViewToggle({
  view,
  onChange,
}: MobileViewToggleProps) {
  return (
    <div className="fixed bottom-5 left-1/2 z-40 flex -translate-x-1/2 gap-1 rounded-[24px] border border-[var(--uyut-border)] bg-white p-1 shadow-[0_6px_20px_rgba(0,0,0,0.12)] lg:hidden">
      {(["list", "map"] as const).map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onChange(item)}
          className={[
            "h-9 rounded-[20px] px-5 text-[14px] font-medium transition-colors",
            view === item
              ? "bg-[#2a6f5b] text-white"
              : "bg-transparent text-[#1c1b19]",
          ].join(" ")}
        >
          {item === "list" ? "Список" : "Карта"}
        </button>
      ))}
    </div>
  );
}
