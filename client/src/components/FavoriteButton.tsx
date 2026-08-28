"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@/context/AuthContext";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:3001";

interface FavoriteButtonProps {
  listingId: number;
}

export default function FavoriteButton({
  listingId,
}: FavoriteButtonProps) {
  const {
    user,
    isAuthenticated,
  } = useAuth();

  const [isFavorite, setIsFavorite] =
    useState(false);

  const [isLoading, setIsLoading] =
    useState(false);

  async function loadFavorite() {
    if (!user) {
      setIsFavorite(false);
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/favorites/${listingId}`,
        {
          headers: {
            "X-User-Id": String(user.id),
          },
        },
      );

      if (!response.ok) {
        return;
      }

      const data = await response.json();

      setIsFavorite(
        Boolean(data.isFavorite),
      );
    } catch (error) {
      console.error(
        "Failed to load favorite:",
        error,
      );
    }
  }

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setIsFavorite(false);
      return;
    }

    void loadFavorite();
  }, [
    listingId,
    isAuthenticated,
    user,
  ]);

  async function handleClick(
    event: React.MouseEvent<HTMLButtonElement>,
  ) {
    event.preventDefault();
    event.stopPropagation();

    if (!isAuthenticated || !user) {
      window.location.href =
        `/login?returnUrl=${encodeURIComponent(
          window.location.pathname,
        )}`;

      return;
    }

    if (isLoading) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/favorites/${listingId}`,
        {
          method: isFavorite
            ? "DELETE"
            : "POST",

          headers: {
            "X-User-Id": String(user.id),
          },
        },
      );

      if (!response.ok) {
        throw new Error(
          "Не удалось изменить избранное",
        );
      }

      const data =
        await response.json();

      setIsFavorite(
        Boolean(data.isFavorite),
      );
    } catch (error) {
      console.error(
        "Favorite error:",
        error,
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <button
      type="button"
      aria-label={
        isFavorite
          ? "Удалить из избранного"
          : "Добавить в избранное"
      }
      aria-pressed={isFavorite}
      disabled={isLoading}
      onClick={handleClick}
      className={[
        "flex size-10 items-center justify-center",
        "rounded-full border border-white/70",
        "bg-white/90 shadow-sm backdrop-blur-sm",
        "transition",
        "hover:scale-105",
        "disabled:cursor-wait",
        "disabled:opacity-70",
      ].join(" ")}
    >
      <svg
        width="21"
        height="21"
        viewBox="0 0 24 24"
        fill={
          isFavorite
            ? "currentColor"
            : "none"
        }
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className={
          isFavorite
            ? "text-[#d94b4b]"
            : "text-[#3f3a36]"
        }
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z" />
      </svg>
    </button>
  );
}