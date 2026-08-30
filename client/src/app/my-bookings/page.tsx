"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import Button from "@/components/Button";
import Modal from "@/components/Modal";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import {
  apiGet,
  apiGetAs,
  apiSend,
  ApiError,
} from "@/lib/api";
import { plural } from "@/lib/plural";
import type { Listing } from "@/types/listing";

interface Booking {
  id: number;
  listingId: number;
  checkIn: string;
  checkOut: string;
  guests: number;
  status: "active" | "cancelled";
  // Стоимость зафиксирована при оформлении: если владелец потом поднимет цену,
  // сумма в старой брони не должна измениться.
  nights: number;
  pricePerNight: number;
  serviceFee: number;
  total: number;
}

interface BookingsResponse {
  items: Booking[];
}

interface BookingWithListing extends Booking {
  listing: Listing | null;
}

export default function MyBookingsRoute() {
  return (
    <ProtectedRoute>
      <MyBookingsPage />
    </ProtectedRoute>
  );
}

function MyBookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BookingWithListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toCancel, setToCancel] = useState<BookingWithListing | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  useEffect(() => {
    if (!user) {
      return;
    }

    const userId = user.id;
    const controller = new AbortController();

    async function loadBookings() {
      try {
        setLoading(true);
        setError(null);

        const data = await apiGetAs<BookingsResponse>(
          "/bookings",
          userId,
          controller.signal,
        );

        const items = await Promise.all(
          data.items.map(async (booking): Promise<BookingWithListing> => {
            try {
              const listing = await apiGet<Listing>(`/listings/${booking.listingId}`, controller.signal);
              return { ...booking, listing };
            } catch (cause) {
              if (cause instanceof DOMException && cause.name === "AbortError") {
                throw cause;
              }

              return { ...booking, listing: null };
            }
          }),
        );

        setBookings(items);
      } catch (cause) {
        if (cause instanceof DOMException && cause.name === "AbortError") {
          return;
        }

        setError(cause instanceof Error ? cause.message : "Не удалось загрузить бронирования");
      } finally {
        setLoading(false);
      }
    }

    void loadBookings();

    return () => controller.abort();
  }, [user]);

  async function cancelBooking() {
    if (!user || !toCancel) {
      return;
    }

    setCancellingId(toCancel.id);

    try {
      await apiSend(`/bookings/${toCancel.id}`, {
        method: "DELETE",
        userId: user.id,
      });

      setBookings((items) => items.map((booking) => booking.id === toCancel.id ? { ...booking, status: "cancelled" } : booking));
      setToCancel(null);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Не удалось отменить бронирование";

      if (cause instanceof ApiError && cause.status === 401) {
        setError("Войдите в аккаунт, чтобы отменить бронирование");
      } else {
        setError(message);
      }
      setToCancel(null);
    } finally {
      setCancellingId(null);
    }
  }

  if (loading) {
    return <BookingsState title="Мои бронирования" text="Загружаем ваши бронирования…" />;
  }

  if (error) {
    return <BookingsState title="Мои бронирования" text={error} />;
  }

  return (
    <main className="min-h-[calc(100vh-72px)] bg-[#f7f5f2] px-5 py-10 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-[960px]">
        <h1 className="m-0 text-[32px] font-semibold text-[#1c1b19]">Мои бронирования</h1>
        <p className="mt-2 m-0 text-[15px] text-[var(--uyut-secondary)]">
          Здесь хранятся все ваши оформленные брони.
        </p>

        {bookings.length === 0 ? (
          <div className="mt-8 rounded-[16px] bg-white px-6 py-14 text-center">
            <h2 className="m-0 text-[20px] font-semibold text-[#1c1b19]">Бронирований пока нет</h2>
            <p className="mt-2 m-0 text-[15px] leading-6 text-[var(--uyut-secondary)]">Выберите подходящее жильё в каталоге и оформите первую бронь.</p>
            <Link href="/" className="mt-6 inline-flex h-11 items-center justify-center rounded-[10px] bg-[#2a6f5b] px-5 text-[14px] font-medium text-white no-underline hover:bg-[#235e4d]">Перейти в каталог</Link>
          </div>
        ) : (
          <div className="mt-8 flex flex-col gap-4">
            {bookings.map((booking) => <BookingCard key={booking.id} booking={booking} onCancel={() => setToCancel(booking)} />)}
          </div>
        )}
      </div>

      <Modal open={toCancel !== null} onClose={() => setToCancel(null)} title="Отменить бронирование?" width="sm">
        <div className="flex flex-col gap-5">
          <p className="m-0 text-[15px] leading-6 text-[var(--uyut-secondary)]">
            {toCancel?.listing ? `Бронь «${toCancel.listing.title}» будет отменена.` : "Бронирование будет отменено."}
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setToCancel(null)}>Не отменять</Button>
            <Button variant="danger" fullWidth disabled={cancellingId === toCancel?.id} onClick={cancelBooking}>
              {cancellingId === toCancel?.id ? "Отменяем…" : "Отменить"}
            </Button>
          </div>
        </div>
      </Modal>
    </main>
  );
}

function BookingCard({ booking, onCancel }: { booking: BookingWithListing; onCancel: () => void }) {
  const cancelled = booking.status === "cancelled";

  return (
    <article className="flex flex-col gap-5 rounded-[16px] bg-white p-5 sm:flex-row sm:items-center">
      <div className="h-[132px] w-full shrink-0 overflow-hidden rounded-[12px] bg-[var(--uyut-image)] sm:w-[176px]">
        {booking.listing?.photos[0] && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={booking.listing.photos[0]} alt="" className="h-full w-full object-cover" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        {booking.listing ? (
          <Link href={`/listing/${booking.listing.id}`} className="text-[20px] font-semibold leading-7 text-[#1c1b19] no-underline hover:text-[#2a6f5b]">{booking.listing.title}</Link>
        ) : (
          <h2 className="m-0 text-[20px] font-semibold text-[#1c1b19]">Объявление недоступно</h2>
        )}
        {booking.listing && <p className="mt-1 m-0 text-[14px] text-[var(--uyut-secondary)]">{booking.listing.district}, {booking.listing.city}</p>}
        <p className="mt-4 m-0 text-[15px] text-[#1c1b19]">{formatDate(booking.checkIn)} — {formatDate(booking.checkOut)}</p>
        <p className="mt-1 m-0 text-[14px] text-[var(--uyut-secondary)]">{booking.guests} {plural(booking.guests, ["гость", "гостя", "гостей"])}</p>

        {booking.total > 0 && (
          <p className="mt-3 m-0 text-[15px] text-[#1c1b19]">
            <span className="font-semibold">{booking.total.toLocaleString("ru-RU")} ₽</span>
            <span className="text-[14px] text-[var(--uyut-secondary)]">
              {" "}за {booking.nights} {plural(booking.nights, ["ночь", "ночи", "ночей"])}, включая сбор {booking.serviceFee.toLocaleString("ru-RU")} ₽
            </span>
          </p>
        )}
      </div>

      <div className="flex shrink-0 flex-col items-start gap-3 sm:items-end">
        <span className={["rounded-full px-3 py-1 text-[13px] font-medium", cancelled ? "bg-[#f2e2e0] text-[#a93535]" : "bg-[#e3f0eb] text-[#23614f]"].join(" ")}>{cancelled ? "Отменено" : "Активно"}</span>
        {!cancelled && <Button variant="secondary" onClick={onCancel}>Отменить</Button>}
      </div>
    </article>
  );
}

function BookingsState({ title, text }: { title: string; text: string }) {
  return (
    <main className="min-h-[calc(100vh-72px)] bg-[#f7f5f2] px-5 py-10 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-[960px]">
        <h1 className="m-0 text-[32px] font-semibold text-[#1c1b19]">{title}</h1>
        <div className="mt-8 rounded-[16px] bg-white px-6 py-10 text-center text-[15px] text-[var(--uyut-secondary)]">{text}</div>
      </div>
    </main>
  );
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
}
