"use client";

import { useEffect, useState } from "react";

import { apiGet } from "@/lib/api";
import { plural } from "@/lib/plural";

export interface Review {
  id: number;
  listingId: number;
  authorName: string;
  rating: number;
  text: string;
  createdAt: string;
}

function Stars({ value }: { value: number }) {
  return (
    <span
      className="inline-flex gap-0.5"
      aria-label={`Оценка ${value} из 5`}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill={
            star <= value
              ? "#e8a33d"
              : "#e6e1da"
          }
          aria-hidden
        >
          <path d="M12 2l3 6.6 7 .8-5.2 4.8 1.4 7L12 17.8 5.8 21.2l1.4-7L2 9.4l7-.8L12 2z" />
        </svg>
      ))}
    </span>
  );
}

function formatDate(value: string) {
  const date = new Date(
    value.replace(" ", "T"),
  );

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("ru-RU", {
    month: "long",
    year: "numeric",
  });
}

export default function ReviewsBlock({
  listingId,
}: {
  listingId: number;
}) {
  const [reviews, setReviews] = useState<
    Review[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<
    string | null
  >(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    apiGet<{ items: Review[] }>(
      `/listings/${listingId}/reviews`,
      controller.signal,
    )
      .then((data) => {
        setReviews(data.items);
        setLoading(false);
      })
      .catch((cause: unknown) => {
        if (
          cause instanceof DOMException &&
          cause.name === "AbortError"
        ) {
          return;
        }

        setError(
          cause instanceof Error
            ? cause.message
            : "Не удалось загрузить отзывы",
        );
        setLoading(false);
      });

    return () => controller.abort();
  }, [listingId]);

  if (loading) {
    return (
      <div className="mt-8">
        <div className="h-6 w-48 animate-pulse rounded bg-[var(--uyut-image)]" />
        <div className="mt-4 h-20 w-full animate-pulse rounded bg-[var(--uyut-image)]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-8">
        <h2 className="m-0 text-[22px] font-semibold text-[#1c1b19]">
          Отзывы
        </h2>

        <p className="mt-2 text-[15px] leading-6 text-[#d14343]">
          {error}
        </p>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="mt-8">
        <h2 className="m-0 text-[22px] font-semibold text-[#1c1b19]">
          Отзывы
        </h2>

        <p className="mt-2 text-[15px] leading-6 text-[#6b6560]">
          Отзывов пока нет. Будьте первым, кто
          здесь остановится.
        </p>
      </div>
    );
  }

  const average =
    reviews.reduce(
      (sum, review) => sum + review.rating,
      0,
    ) / reviews.length;

  const visible = showAll
    ? reviews
    : reviews.slice(0, 4);

  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="m-0 text-[22px] font-semibold text-[#1c1b19]">
          Отзывы
        </h2>

        <span className="flex items-center gap-2 text-[15px] text-[#6b6560]">
          <Stars
            value={Math.round(average)}
          />
          {average
            .toFixed(1)
            .replace(".", ",")}{" "}
          · {reviews.length}{" "}
          {plural(reviews.length, [
            "отзыв",
            "отзыва",
            "отзывов",
          ])}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-2">
        {visible.map((review) => (
          <article
            key={review.id}
            className="flex flex-col gap-2"
          >
            <div className="flex items-center gap-3">
              <span
                aria-hidden
                className="flex size-10 items-center justify-center rounded-full bg-[var(--uyut-image)] text-[15px] font-medium text-[#1c1b19]"
              >
                {review.authorName.slice(0, 1)}
              </span>

              <span className="flex flex-col">
                <span className="text-[15px] font-medium text-[#1c1b19]">
                  {review.authorName}
                </span>

                <span className="text-[13px] text-[var(--uyut-muted)]">
                  {formatDate(review.createdAt)}
                </span>
              </span>
            </div>

            <Stars value={review.rating} />

            <p className="m-0 text-[15px] leading-6 text-[#3f3b37]">
              {review.text}
            </p>
          </article>
        ))}
      </div>

      {reviews.length > 4 && !showAll && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="mt-5 h-11 rounded-[10px] border border-[var(--uyut-border)] bg-white px-5 text-[14px] font-medium text-[#1c1b19] transition-colors hover:bg-[#f7f5f2]"
        >
          Показать все отзывы
        </button>
      )}

      <p className="mt-4 text-[13px] leading-5 text-[var(--uyut-muted)]">
        Свой отзыв в этой версии оставить нельзя
        — вынесли в доработки.
      </p>
    </div>
  );
}
