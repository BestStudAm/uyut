"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import FavoriteButton from "@/components/FavoriteButton";
import { useAuth } from "@/context/AuthContext";
import type { Listing } from "@/types/listing";

import ListingCard from "@/features/catalog/ListingCard";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:3001";

export default function FavoritesPage() {
  const {
    user,
    isLoading: authLoading,
  } = useAuth();

  const [listings, setListings] =
    useState<Listing[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      setLoading(false);
      return;
    }

    const userId = user.id;

    async function loadFavorites() {
      try {
        setLoading(true);
        setError(null);

        const favoritesResponse =
          await fetch(
            `${API_URL}/api/favorites`,
            {
              headers: {
                "X-User-Id": String(userId),
              },
            },
          );

        if (!favoritesResponse.ok) {
          throw new Error(
            "Не удалось загрузить избранное",
          );
        }

        const favoritesData =
          await favoritesResponse.json();

        const ids: number[] =
          favoritesData.items ?? [];

        if (ids.length === 0) {
          setListings([]);
          return;
        }

        const results =
          await Promise.all(
            ids.map(async (id) => {
              const response =
                await fetch(
                  `${API_URL}/api/listings/${id}`,
                );

              if (!response.ok) {
                return null;
              }

              return (await response.json()) as Listing;
            }),
          );

        setListings(
          results.filter(
            (
              listing,
            ): listing is Listing =>
              listing !== null,
          ),
        );
      } catch (error) {
        console.error(
          "Favorites loading error:",
          error,
        );

        setError(
          error instanceof Error
            ? error.message
            : "Не удалось загрузить избранное",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadFavorites();
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <main className="min-h-[calc(100vh-72px)] bg-[#f7f5f2]">
        <div className="mx-auto max-w-[1200px] px-5 py-10">
          <h1 className="m-0 text-[32px] font-semibold text-[#1c1b19]">
            Избранное
          </h1>

          <p className="mt-2 m-0 text-[14px] text-[#6b6560]">
            Загружаем сохранённые варианты…
          </p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-[calc(100vh-72px)] bg-[#f7f5f2]">
        <div className="mx-auto max-w-[1200px] px-5 py-10">
          <h1 className="m-0 text-[32px] font-semibold text-[#1c1b19]">
            Избранное
          </h1>

          <div className="mt-8 rounded-[12px] border border-[var(--uyut-border)] bg-white px-6 py-10 text-center">
            <h2 className="m-0 text-[20px] font-semibold text-[#1c1b19]">
              Не удалось загрузить избранное
            </h2>

            <p className="mt-2 m-0 text-[15px] text-[#6b6560]">
              {error}
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-72px)] bg-[#f7f5f2]">
      <div className="mx-auto max-w-[1200px] px-5 py-10">
        <h1 className="m-0 text-[32px] font-semibold text-[#1c1b19]">
          Избранное
        </h1>

        <p className="mt-2 m-0 text-[14px] text-[#6b6560]">
          {listings.length}{" "}
          {pluralizeFavorites(
            listings.length,
          )}{" "}
          · сохраняются в вашем аккаунте
        </p>

        {listings.length === 0 ? (
          <div className="mt-10 rounded-[12px] border border-[var(--uyut-border)] bg-white px-6 py-14 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-[#f7f5f2]">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-[#6b6560]"
                aria-hidden="true"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z" />
              </svg>
            </div>

            <h2 className="mt-5 m-0 text-[20px] font-semibold text-[#1c1b19]">
              В избранном пока пусто
            </h2>

            <p className="mx-auto mt-2 max-w-[420px] m-0 text-[15px] leading-6 text-[#6b6560]">
              Сохраняйте понравившиеся
              варианты, чтобы быстро
              вернуться к ним позже.
            </p>

            <Link
              href="/"
              className="mt-6 inline-flex h-11 items-center justify-center rounded-[10px] bg-[#2a6f5b] px-5 text-[15px] font-medium text-white no-underline transition hover:bg-[#245f4e]"
            >
              Перейти в каталог
            </Link>
          </div>
        ) : (
          <div className="mt-7 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
            {listings.map(
              (listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  action={
                    <FavoriteButton
                      listingId={
                        listing.id
                      }
                    />
                  }
                />
              ),
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function pluralizeFavorites(
  count: number,
) {
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (
    mod10 === 1 &&
    mod100 !== 11
  ) {
    return "вариант";
  }

  if (
    mod10 >= 2 &&
    mod10 <= 4 &&
    (mod100 < 10 ||
      mod100 >= 20)
  ) {
    return "варианта";
  }

  return "вариантов";
}