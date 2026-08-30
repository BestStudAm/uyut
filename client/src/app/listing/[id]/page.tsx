"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import Button from "@/components/Button";
import Input from "@/components/Input";
import Modal from "@/components/Modal";
import { useAuth } from "@/context/AuthContext";
import {
  apiGet,
  apiSend,
  ApiError,
} from "@/lib/api";
import { plural } from "@/lib/plural";
import ListingMap from "@/features/listing/ListingMap";
import ReviewsBlock from "@/features/listing/ReviewsBlock";
import {
  amenityLabels,
  housingTypeLabels,
  type Listing,
} from "@/types/listing";

interface BookingResponse {
  booking: {
    id: number;
  };
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function ListingPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const listingId = Number(params.id);
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);
  const [bookingError, setBookingError] = useState("");
  const [isBooking, setIsBooking] = useState(false);
  const [bookingSuccessOpen, setBookingSuccessOpen] = useState(false);

  useEffect(() => {
    if (!Number.isInteger(listingId) || listingId <= 0) {
      setLoadError("Объявление не найдено");
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    async function loadListing() {
      try {
        setLoading(true);
        setLoadError(null);

        const data = await apiGet<Listing>(
          `/listings/${listingId}`,
          controller.signal,
        );

        setListing(data);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setLoadError(
          error instanceof Error
            ? error.message
            : "Не удалось загрузить объявление",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadListing();

    return () => controller.abort();
  }, [listingId]);

  function handleCheckInChange(value: string) {
    setCheckIn(value);

    if (checkOut && value >= checkOut) {
      setCheckOut("");
    }
  }

  async function handleBooking(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBookingError("");

    if (!user) {
      router.push("/login");
      return;
    }

    if (!listing) {
      return;
    }

    if (!checkIn || !checkOut) {
      setBookingError("Выберите даты заезда и выезда");
      return;
    }

    if (checkOut <= checkIn) {
      setBookingError("Дата выезда должна быть позже даты заезда");
      return;
    }

    setIsBooking(true);

    try {
      await apiSend<BookingResponse>("/bookings", {
        method: "POST",
        userId: user.id,
        body: {
          listingId: listing.id,
          checkIn,
          checkOut,
          guests,
        },
      });

      setBookingSuccessOpen(true);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        router.push("/login");
        return;
      }

      setBookingError(
        error instanceof Error
          ? error.message
          : "Не удалось оформить бронирование",
      );
    } finally {
      setIsBooking(false);
    }
  }

  if (loading) {
    return <PageState text="Загружаем объявление…" />;
  }

  if (loadError || !listing) {
    return (
      <PageState
        text={loadError ?? "Объявление не найдено"}
        action={<BackToCatalog />}
      />
    );
  }

  return (
    <main className="min-h-[calc(100vh-72px)] bg-[#f7f5f2] px-5 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-[1200px]">
        <Link
          href="/"
          className="inline-flex text-[14px] font-medium text-[#2a6f5b] no-underline hover:text-[#235e4d]"
        >
          ← Вернуться в каталог
        </Link>

        <div className="mt-5 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="min-w-0">
            <div className="overflow-hidden rounded-[16px] bg-[var(--uyut-image)]">
              {listing.photos[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={listing.photos[0]}
                  alt={listing.title}
                  className="aspect-[3/2] h-full w-full object-cover"
                />
              ) : null}
            </div>

            <div className="mt-7 rounded-[16px] bg-white p-6 sm:p-8">
              <p className="m-0 text-[14px] text-[var(--uyut-secondary)]">
                {housingTypeLabels[listing.type]} · {listing.district}, {listing.city}
              </p>

              <h1 className="mt-2 text-[30px] font-semibold leading-tight text-[#1c1b19] sm:text-[36px]">
                {listing.title}
              </h1>

              <p className="m-0 text-[16px] leading-6 text-[var(--uyut-secondary)]">
                {listing.guests} {plural(listing.guests, ["гость", "гостя", "гостей"])} · {listing.rooms} {plural(listing.rooms, ["комната", "комнаты", "комнат"])} · {listing.area} м²
              </p>

              <p className="mt-6 m-0 text-[16px] leading-7 text-[#3f3b37]">
                {listing.description}
              </p>

              {listing.amenities.length > 0 && (
                <div className="mt-8">
                  <h2 className="m-0 text-[22px] font-semibold text-[#1c1b19]">
                    Удобства
                  </h2>

                  <ul className="mt-4 grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-2">
                    {listing.amenities.map((amenity) => (
                      <li key={amenity} className="text-[15px] text-[#3f3b37]">
                        {amenityLabels[amenity]}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {listing.rules.length > 0 && (
                <div className="mt-8">
                  <h2 className="m-0 text-[22px] font-semibold text-[#1c1b19]">
                    Правила проживания
                  </h2>

                  <ul className="mt-4 list-disc space-y-2 pl-5 text-[15px] leading-6 text-[#3f3b37]">
                    {listing.rules.map((rule) => <li key={rule}>{rule}</li>)}
                  </ul>
                </div>
              )}

              <ListingMap
                lat={listing.lat}
                lng={listing.lng}
                title={listing.title}
                district={listing.district}
              />

              <ReviewsBlock listingId={listing.id} />
            </div>
          </section>

          <aside className="h-fit rounded-[16px] bg-white p-6 shadow-[0_8px_30px_rgba(28,27,25,0.08)] lg:sticky lg:top-6">
            <p className="m-0 text-[24px] font-semibold text-[#1c1b19]">
              {listing.pricePerNight.toLocaleString("ru-RU")} ₽ <span className="text-[16px] font-normal">/ ночь</span>
            </p>

            <form className="mt-6 flex flex-col gap-4" onSubmit={handleBooking}>
              <Input
                id="booking-check-in"
                label="Дата заезда"
                type="date"
                min={today()}
                value={checkIn}
                onChange={(event) => handleCheckInChange(event.target.value)}
              />

              <Input
                id="booking-check-out"
                label="Дата выезда"
                type="date"
                min={checkIn || today()}
                value={checkOut}
                onChange={(event) => setCheckOut(event.target.value)}
              />

              <Input
                id="booking-guests"
                label="Количество гостей"
                type="number"
                min={1}
                max={listing.guests}
                value={guests}
                onChange={(event) => setGuests(Math.min(listing.guests, Math.max(1, Number(event.target.value) || 1)))}
                hint={`Максимум ${listing.guests} ${plural(listing.guests, ["гость", "гостя", "гостей"])}`}
              />

              {bookingError && <p className="m-0 text-[14px] leading-5 text-[#d14343]">{bookingError}</p>}

              <Button type="submit" size="lg" fullWidth disabled={authLoading || isBooking}>
                {isBooking ? "Бронируем…" : "Забронировать"}
              </Button>
            </form>
          </aside>
        </div>
      </div>

      <Modal
        open={bookingSuccessOpen}
        onClose={() => setBookingSuccessOpen(false)}
        title="Бронирование подтверждено"
        width="sm"
      >
        <div className="flex flex-col gap-5">
          <p className="m-0 text-[15px] leading-6 text-[var(--uyut-secondary)]">
            «{listing.title}» забронировано с {formatDate(checkIn)} по {formatDate(checkOut)}.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button variant="secondary" fullWidth onClick={() => setBookingSuccessOpen(false)}>
              Остаться здесь
            </Button>
            <Link href="/my-bookings" className="flex-1 no-underline">
              <Button fullWidth>Мои бронирования</Button>
            </Link>
          </div>
        </div>
      </Modal>
    </main>
  );
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function PageState({ text, action }: { text: string; action?: React.ReactNode }) {
  return (
    <main className="flex min-h-[calc(100vh-72px)] items-center justify-center bg-[#f7f5f2] px-5">
      <div className="rounded-[16px] bg-white px-8 py-10 text-center">
        <p className="m-0 text-[16px] text-[var(--uyut-secondary)]">{text}</p>
        {action && <div className="mt-5">{action}</div>}
      </div>
    </main>
  );
}

function BackToCatalog() {
  return (
    <Link href="/" className="text-[14px] font-medium text-[#2a6f5b] no-underline">
      Перейти в каталог
    </Link>
  );
}
