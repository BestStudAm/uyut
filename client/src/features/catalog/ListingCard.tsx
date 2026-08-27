"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { plural } from "@/lib/plural";
import type { Listing } from "@/types/listing";

interface ListingCardProps {
  listing: Listing;
  // Кнопка «в избранное» приходит снаружи: избранное — зона Амира,
  // карточка про него ничего не знает.
  action?: ReactNode;
  highlighted?: boolean;
  onHover?: (id: number | null) => void;
}

export function formatPrice(value: number) {
  return `${value.toLocaleString("ru-RU")} ₽`;
}

export default function ListingCard({
  listing,
  action,
  highlighted = false,
  onHover,
}: ListingCardProps) {
  return (
    <article
      // По этому id карта находит карточку, когда кликают по метке с ценой.
      id={`listing-${listing.id}`}
      onMouseEnter={() =>
        onHover?.(listing.id)
      }
      onMouseLeave={() => onHover?.(null)}
      className={[
        "group flex flex-col gap-3 rounded-[12px] transition-shadow",
        highlighted
          ? "shadow-[0_0_0_2px_#2a6f5b]"
          : "",
      ].join(" ")}
    >
      <div className="relative">
        <Link
          href={`/listing/${listing.id}`}
          className="block"
        >
          <div className="aspect-[3/2] w-full overflow-hidden rounded-[12px] bg-[var(--uyut-image)]" />
        </Link>

        {action && (
          <div className="absolute right-3 top-3">
            {action}
          </div>
        )}
      </div>

      <Link
        href={`/listing/${listing.id}`}
        className="flex flex-col gap-1 no-underline"
      >
        <h3 className="m-0 text-[16px] font-medium leading-6 text-[#1c1b19]">
          {listing.title}
        </h3>

        <p className="m-0 text-[14px] leading-5 text-[var(--uyut-secondary)]">
          {listing.district} район
        </p>

        <p className="m-0 text-[14px] leading-5 text-[var(--uyut-muted)]">
          {listing.guests}{" "}
          {plural(listing.guests, [
            "гость",
            "гостя",
            "гостей",
          ])}{" "}
          · {listing.rooms}{" "}
          {plural(listing.rooms, [
            "комната",
            "комнаты",
            "комнат",
          ])}{" "}
          · {listing.area} м²
        </p>

        <div className="mt-1 flex items-center justify-between">
          <span className="text-[16px] font-semibold leading-6 text-[#1c1b19]">
            {formatPrice(
              listing.pricePerNight,
            )}{" "}
            <span className="font-normal">
              / ночь
            </span>
          </span>

          <span className="flex items-center gap-1 text-[14px] font-medium text-[#1c1b19]">
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="#e8a33d"
              aria-hidden
            >
              <path d="M12 2l3 6.6 7 .8-5.2 4.8 1.4 7L12 17.8 5.8 21.2l1.4-7L2 9.4l7-.8L12 2z" />
            </svg>

            {listing.rating
              .toFixed(1)
              .replace(".", ",")}
          </span>
        </div>
      </Link>
    </article>
  );
}
