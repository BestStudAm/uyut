"use client";

import type { SortOption } from "./catalogParams";

interface SortSelectProps {
  value: SortOption | undefined;
  onChange: (value: SortOption | undefined) => void;
}

const options: {
  id: SortOption | "";
  label: string;
}[] = [
  { id: "", label: "По умолчанию" },
  { id: "price_asc", label: "Сначала дешевле" },
  { id: "price_desc", label: "Сначала дороже" },
  { id: "rating_desc", label: "Высокий рейтинг" },
];

export default function SortSelect({
  value,
  onChange,
}: SortSelectProps) {
  return (
    <label className="flex shrink-0 items-center gap-2">
      <span className="hidden text-[14px] text-[var(--uyut-secondary)] sm:inline">
        Сортировка
      </span>

      <select
        value={value ?? ""}
        onChange={(event) =>
          onChange(
            (event.target.value ||
              undefined) as
              | SortOption
              | undefined,
          )
        }
        className="h-9 rounded-[20px] border border-[var(--uyut-border)] bg-white px-4 text-[14px] font-medium text-[#1c1b19] outline-none focus:border-[#2a6f5b]"
      >
        {options.map((option) => (
          <option
            key={option.id}
            value={option.id}
          >
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
