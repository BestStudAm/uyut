"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import Button from "@/components/Button";
import Modal from "@/components/Modal";
import Tabs from "@/components/Tabs";
import { useAuth } from "@/context/AuthContext";
import { apiGetAs, apiSend } from "@/lib/api";
import { plural } from "@/lib/plural";
import {
  listingStatusLabels,
  type Listing,
  type ListingStatus,
} from "@/types/listing";

const statusStyles: Record<
  ListingStatus,
  string
> = {
  published:
    "bg-[var(--uyut-green-light)] text-[#2a6f5b]",
  draft: "bg-[#f7f5f2] text-[var(--uyut-secondary)]",
  hidden: "bg-[#f7f5f2] text-[var(--uyut-muted)]",
};

const tabOrder: ListingStatus[] = [
  "published",
  "draft",
  "hidden",
];

const tabTitles: Record<ListingStatus, string> = {
  published: "Опубликованные",
  draft: "Черновики",
  hidden: "Снятые",
};

const emptyText: Record<ListingStatus, string> = {
  published:
    "Здесь появятся объявления, которые видят гости.",
  draft:
    "Черновик сохраняется, даже если заполнить не всё. Гостям он не показывается.",
  hidden:
    "Снятые объявления пропадают из поиска, но брони по ним остаются активными.",
};

function money(value: number) {
  return `${value.toLocaleString("ru-RU")} ₽`;
}

export default function MyListingsPage() {
  const { user, isLoading: authLoading } =
    useAuth();

  const [items, setItems] = useState<Listing[]>(
    [],
  );
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<
    string | null
  >(null);
  const [tab, setTab] =
    useState<ListingStatus>("published");
  const [busyId, setBusyId] = useState<
    number | null
  >(null);
  const [toDelete, setToDelete] =
    useState<Listing | null>(null);

  const userId = user?.id ?? null;

  useEffect(() => {
    if (!userId) {
      return;
    }

    const controller = new AbortController();

    apiGetAs<{ items: Listing[] }>(
      "/my/listings",
      userId,
      controller.signal,
    )
      .then((data) => {
        setItems(data.items);
        setLoaded(true);
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
            : "Не удалось загрузить объявления",
        );
        setLoaded(true);
      });

    return () => controller.abort();
  }, [userId]);

  const changeStatus = useCallback(
    async (
      listing: Listing,
      status: ListingStatus,
    ) => {
      setBusyId(listing.id);

      try {
        const updated = await apiSend<Listing>(
          `/my/listings/${listing.id}`,
          {
            method: "PATCH",
            body: { status },
            userId,
          },
        );

        setItems((prev) =>
          prev.map((item) =>
            item.id === updated.id
              ? updated
              : item,
          ),
        );
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : "Не удалось изменить статус",
        );
      } finally {
        setBusyId(null);
      }
    },
    [userId],
  );

  const remove = useCallback(
    async (listing: Listing) => {
      setBusyId(listing.id);

      try {
        await apiSend<void>(
          `/my/listings/${listing.id}`,
          { method: "DELETE", userId },
        );

        setItems((prev) =>
          prev.filter(
            (item) => item.id !== listing.id,
          ),
        );
        setToDelete(null);
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : "Не удалось удалить объявление",
        );
      } finally {
        setBusyId(null);
      }
    },
    [userId],
  );

  if (authLoading) {
    return (
      <div className="px-5 py-10 text-[15px] text-[var(--uyut-secondary)] sm:px-8 lg:px-12">
        Проверяем, кто вы…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto flex max-w-[520px] flex-col items-center gap-4 px-5 py-20 text-center">
        <h1 className="m-0 text-[24px] font-semibold text-[#1c1b19]">
          Войдите, чтобы размещать жильё
        </h1>

        <p className="m-0 text-[15px] leading-6 text-[var(--uyut-secondary)]">
          Объявления привязаны к аккаунту: так вы
          сможете их редактировать и снимать с
          публикации.
        </p>

        <Link
          href="/login"
          className="no-underline"
        >
          <Button size="lg">Войти</Button>
        </Link>
      </div>
    );
  }

  const counts = tabOrder.reduce(
    (acc, status) => ({
      ...acc,
      [status]: items.filter(
        (item) => item.status === status,
      ).length,
    }),
    {} as Record<ListingStatus, number>,
  );

  const visible = items.filter(
    (item) => item.status === tab,
  );

  const published = counts.published;

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6 px-5 py-8 sm:px-8 lg:px-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="m-0 text-[28px] font-semibold leading-9 text-[#1c1b19] sm:text-[32px]">
            Мои объявления
          </h1>

          <p className="m-0 text-[14px] leading-5 text-[var(--uyut-secondary)]">
            {published > 0
              ? `Вы сдаёте ${published} ${plural(published, ["объект", "объекта", "объектов"])}. Гости видят только опубликованные.`
              : "Пока ничего не опубликовано. Гости видят только опубликованные объявления."}
          </p>
        </div>

        <Link
          href="/my-listings/new"
          className="no-underline"
        >
          <Button size="lg">
            Разместить объявление
          </Button>
        </Link>
      </div>

      <Tabs
        tabs={tabOrder.map((status) => ({
          id: status,
          label: `${tabTitles[status]} · ${counts[status] ?? 0}`,
        }))}
        activeTab={tab}
        onChange={(id) =>
          setTab(id as ListingStatus)
        }
      />

      {error && (
        <p className="m-0 rounded-[10px] border border-[#d14343] bg-[#fdf4f4] px-4 py-3 text-[14px] text-[#d14343]">
          {error}
        </p>
      )}

      {!loaded && !error && (
        <div className="flex flex-col gap-4">
          {[0, 1].map((key) => (
            <div
              key={key}
              className="h-[152px] animate-pulse rounded-[12px] bg-[var(--uyut-image)]"
            />
          ))}
        </div>
      )}

      {loaded && visible.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-[12px] border border-[var(--uyut-border)] px-6 py-14 text-center">
          <h2 className="m-0 text-[20px] font-semibold text-[#1c1b19]">
            {tabTitles[tab]}: пусто
          </h2>

          <p className="m-0 max-w-[460px] text-[15px] leading-6 text-[var(--uyut-secondary)]">
            {emptyText[tab]}
          </p>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {visible.map((listing) => (
          <article
            key={listing.id}
            className="flex flex-col gap-4 rounded-[12px] border border-[var(--uyut-border)] p-4 sm:flex-row sm:items-center"
          >
            <div className="h-[120px] w-full shrink-0 overflow-hidden rounded-[10px] bg-[var(--uyut-image)] sm:w-[160px]">
              {listing.photos[0] && (
                // Фото лежит строкой data:image, next/image здесь не нужен.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={listing.photos[0]}
                  alt=""
                  className="h-full w-full object-cover"
                />
              )}
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="m-0 text-[20px] font-semibold leading-7 text-[#1c1b19]">
                  {listing.title}
                </h2>

                <span
                  className={[
                    "inline-flex h-[22px] items-center rounded-[11px] px-2.5 text-[12px] font-medium",
                    statusStyles[listing.status],
                  ].join(" ")}
                >
                  {
                    listingStatusLabels[
                      listing.status
                    ]
                  }
                </span>
              </div>

              <p className="m-0 text-[14px] leading-5 text-[var(--uyut-secondary)]">
                {listing.district} район,{" "}
                {listing.city}
              </p>

              <p className="m-0 text-[15px] leading-5 text-[#1c1b19]">
                {listing.pricePerNight > 0
                  ? `${money(listing.pricePerNight)} / ночь`
                  : "Цена не указана"}{" "}
                · {listing.area} м² ·{" "}
                {listing.guests}{" "}
                {plural(listing.guests, [
                  "гость",
                  "гостя",
                  "гостей",
                ])}
              </p>

              <p className="m-0 text-[14px] leading-5 text-[var(--uyut-muted)]">
                {listing.status === "draft"
                  ? "Черновик, гостям не показывается"
                  : `${listing.reviewsCount} ${plural(listing.reviewsCount, ["отзыв", "отзыва", "отзывов"])} · рейтинг ${listing.rating.toFixed(1).replace(".", ",")}`}
              </p>
            </div>

            <div className="flex shrink-0 flex-col gap-2 sm:w-[170px]">
              <Link
                href={`/my-listings/${listing.id}`}
                className="no-underline"
              >
                <Button
                  variant="secondary"
                  fullWidth
                >
                  {listing.status === "draft"
                    ? "Дозаполнить"
                    : "Редактировать"}
                </Button>
              </Link>

              {listing.status ===
                "published" && (
                <Button
                  variant="ghost"
                  fullWidth
                  disabled={
                    busyId === listing.id
                  }
                  onClick={() =>
                    changeStatus(
                      listing,
                      "hidden",
                    )
                  }
                >
                  Снять с публикации
                </Button>
              )}

              {listing.status === "hidden" && (
                <Button
                  variant="ghost"
                  fullWidth
                  disabled={
                    busyId === listing.id
                  }
                  onClick={() =>
                    changeStatus(
                      listing,
                      "published",
                    )
                  }
                >
                  Опубликовать снова
                </Button>
              )}

              {listing.status === "draft" && (
                <Button
                  variant="ghost"
                  fullWidth
                  disabled={
                    busyId === listing.id
                  }
                  onClick={() =>
                    setToDelete(listing)
                  }
                >
                  Удалить
                </Button>
              )}
            </div>
          </article>
        ))}
      </div>

      <Modal
        open={toDelete !== null}
        onClose={() => setToDelete(null)}
        title="Удалить черновик?"
        width="sm"
      >
        <div className="flex flex-col gap-5">
          <p className="m-0 text-[15px] leading-6 text-[var(--uyut-secondary)]">
            «{toDelete?.title}» исчезнет
            насовсем. Отменить это будет нельзя.
          </p>

          <div className="flex gap-3">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => setToDelete(null)}
            >
              Отмена
            </Button>

            <Button
              variant="danger"
              fullWidth
              disabled={
                busyId === toDelete?.id
              }
              onClick={() =>
                toDelete && remove(toDelete)
              }
            >
              Удалить
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
