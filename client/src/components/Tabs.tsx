"use client";

export interface Tab {
  id: string;
  label: string;
  disabled?: boolean;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export default function Tabs({
  tabs,
  activeTab,
  onChange,
  className = "",
}: TabsProps) {
  return (
    <div
      className={[
        "flex gap-6 border-b border-[#e6e1da]",
        className,
      ].join(" ")}
      role="tablist"
    >
      {tabs.map((tab) => {
        const active =
          tab.id === activeTab;

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            disabled={tab.disabled}
            onClick={() => onChange(tab.id)}
            className={[
              "relative -mb-px border-b-2 bg-transparent pb-3 text-[15px] font-medium transition-colors",
              active
                ? "border-[#2a6f5b] text-[#2a6f5b]"
                : "border-transparent text-[#6b6560] hover:text-[#1c1b19]",
              tab.disabled
                ? "cursor-not-allowed opacity-40"
                : "",
            ].join(" ")}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}