"use client";

import Button from "@/components/Button";
import type { Listing } from "@/types/listing";

import ListingCard from "./ListingCard";
import ListingCardSkeleton from "./ListingCardSkeleton";
import FavoriteButton from "@/components/FavoriteButton";

interface ListingsGridProps {
  listings: Listing[];
  total: number;
  loading: boolean;
  error: string | null;
  hoveredId: number | null;
  onHover: (id: number | null) => void;
  onRetry: () => void;
  onResetFilters: () => void;
  onShowMore: () => void;
  hasMore: boolean;
}

export default function ListingsGrid({
  listings,
  total,
  loading,
  error,
  hoveredId,
  onHover,
  onRetry,
  onResetFilters,
  onShowMore,
  hasMore,
}: ListingsGridProps) {
  // Скелетоны показываем только на первой загрузке. При «показать ещё»
  // уже найденные карточки остаются на месте, иначе список прыгает.
  if (loading && listings.length === 0) {
    return (
      <div className="grid grid-cols-1 gap-x-6 gap-y-7 sm:grid-cols-2">
        {Array.from({ length: 6 }).map(
          (_, index) => (
            <ListingCardSkeleton
              key={index}
            />
          ),
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-[12px] border border-[var(--uyut-border)] px-6 py-12 text-center">
        <h2 className="m-0 text-[20px] font-semibold text-[#1c1b19]">
          Не удалось загрузить объявления
        </h2>

        <p className="m-0 max-w-[420px] text-[15px] leading-6 text-[var(--uyut-secondary)]">
          {error}
        </p>

        <Button
          type="button"
          variant="secondary"
          onClick={onRetry}
          className="mt-2"
        >
          Попробовать снова
        </Button>
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-[12px] border border-[var(--uyut-border)] px-6 py-12 text-center">
        <h2 className="m-0 text-[20px] font-semibold text-[#1c1b19]">
          Ничего не нашлось
        </h2>

        <p className="m-0 max-w-[420px] text-[15px] leading-6 text-[var(--uyut-secondary)]">
          Попробуйте расширить вилку цены или
          убрать часть удобств.
        </p>

        <Button
          type="button"
          variant="secondary"
          onClick={onResetFilters}
          className="mt-2"
        >
          Сбросить фильтры
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 gap-x-6 gap-y-7 sm:grid-cols-2">
        {listings.map((listing) => (
          <ListingCard
            key={listing.id}
            listing={listing}
            action={
              <FavoriteButton
                listingId={listing.id}
              />
            }
            highlighted={
              hoveredId === listing.id
            }
            onHover={onHover}
          />
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="secondary"
            size="lg"
            onClick={onShowMore}
            disabled={loading}
          >
            {loading
              ? "Загружаем…"
              : `Показать ещё · осталось ${total - listings.length}`}
          </Button>
        </div>
      )}
    </div>
  );
}
