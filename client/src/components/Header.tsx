"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import Button from "@/components/Button";

interface SearchBarProps {
  compact?: boolean;
}

const cities = [
  "Санкт-Петербург",
  "Москва",
  "Казань",
  "Сочи",
  "Нижний Новгород",
];

function formatDate(date: string) {
  if (!date) {
    return "";
  }

  const [year, month, day] = date
    .split("-")
    .map(Number);

  const value = new Date(
    year,
    month - 1,
    day,
  );

  return value.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
  });
}

function getDateText(
  checkIn: string,
  checkOut: string,
) {
  if (!checkIn && !checkOut) {
    return "Даты";
  }

  if (checkIn && !checkOut) {
    return formatDate(checkIn);
  }

  if (!checkIn && checkOut) {
    return formatDate(checkOut);
  }

  return `${formatDate(checkIn)} — ${formatDate(checkOut)}`;
}

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  return (
    <header className="relative z-50 h-[72px] shrink-0 border-b border-[#e6e1da] bg-white">
      <div className="flex h-full w-full items-center justify-between px-5 sm:px-8 lg:px-12">
        {/* Логотип */}
        <Link
          href="/"
          className="shrink-0 text-[20px] font-semibold leading-[1.4] text-[#2a6f5b] no-underline"
        >
          Уют
        </Link>

        {/* Поиск — desktop */}
        <div className="hidden flex-1 justify-center px-8 md:flex">
          <SearchBar />
        </div>

        {/* Меню — desktop */}
        <nav className="hidden shrink-0 items-center gap-6 md:flex">
          <Link
            href="/favorites"
            className="text-[14px] font-medium leading-5 text-[#1c1b19] no-underline transition-colors hover:text-[#2a6f5b]"
          >
            Избранное
          </Link>

          <Link
            href="/bookings"
            className="text-[14px] font-medium leading-5 text-[#1c1b19] no-underline transition-colors hover:text-[#2a6f5b]"
          >
            Мои бронирования
          </Link>

          <Link
            href="/my-listings"
            className="text-[14px] font-medium leading-5 text-[#1c1b19] no-underline transition-colors hover:text-[#2a6f5b]"
          >
            Мои объявления
          </Link>

          <Link
            href="/login"
            className="no-underline"
          >
            <Button
              type="button"
              size="md"
            >
              Войти
            </Button>
          </Link>
        </nav>

        {/* Мобильная часть */}
        <div className="flex items-center gap-2 md:hidden">
          <SearchBar compact />

          <button
            type="button"
            aria-label={
              mobileMenuOpen
                ? "Закрыть меню"
                : "Открыть меню"
            }
            aria-expanded={mobileMenuOpen}
            onClick={() =>
              setMobileMenuOpen(
                (value) => !value,
              )
            }
            className="flex size-10 items-center justify-center rounded-[10px] border border-[#e6e1da] bg-white"
          >
            <span className="flex flex-col gap-1">
              <span
                className={[
                  "block h-[2px] w-4 bg-[#1c1b19] transition-transform",
                  mobileMenuOpen
                    ? "translate-y-[3px] rotate-45"
                    : "",
                ].join(" ")}
              />

              <span
                className={[
                  "block h-[2px] w-4 bg-[#1c1b19] transition-opacity",
                  mobileMenuOpen
                    ? "opacity-0"
                    : "",
                ].join(" ")}
              />

              <span
                className={[
                  "block h-[2px] w-4 bg-[#1c1b19] transition-transform",
                  mobileMenuOpen
                    ? "-translate-y-[3px] -rotate-45"
                    : "",
                ].join(" ")}
              />
            </span>
          </button>
        </div>
      </div>

      {/* Мобильное меню */}
      {mobileMenuOpen && (
        <div className="absolute left-0 right-0 top-[72px] border-b border-[#e6e1da] bg-white px-5 py-4 shadow-[0_8px_20px_rgba(0,0,0,0.06)] md:hidden">
          <nav className="flex flex-col">
            <Link
              href="/favorites"
              onClick={() =>
                setMobileMenuOpen(false)
              }
              className="rounded-[10px] px-3 py-3 text-[15px] font-medium text-[#1c1b19] no-underline hover:bg-[#f7f5f2]"
            >
              Избранное
            </Link>

            <Link
              href="/bookings"
              onClick={() =>
                setMobileMenuOpen(false)
              }
              className="rounded-[10px] px-3 py-3 text-[15px] font-medium text-[#1c1b19] no-underline hover:bg-[#f7f5f2]"
            >
              Мои бронирования
            </Link>

            <Link
              href="/my-listings"
              onClick={() =>
                setMobileMenuOpen(false)
              }
              className="rounded-[10px] px-3 py-3 text-[15px] font-medium text-[#1c1b19] no-underline hover:bg-[#f7f5f2]"
            >
              Мои объявления
            </Link>

            <Link
              href="/login"
              onClick={() =>
                setMobileMenuOpen(false)
              }
              className="mt-2 no-underline"
            >
              <Button
                type="button"
                size="lg"
                fullWidth
              >
                Войти
              </Button>
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}

function SearchBar({
  compact = false,
}: SearchBarProps) {
  const router = useRouter();

  const [city, setCity] = useState(
    "Санкт-Петербург",
  );

  const [checkIn, setCheckIn] =
    useState("");

  const [checkOut, setCheckOut] =
    useState("");

  const [guests, setGuests] = useState(2);

  const [openMenu, setOpenMenu] =
    useState<
      "city" | "dates" | "guests" | null
    >(null);

  function handleSearch() {
    const params = new URLSearchParams();

    params.set("city", city);
    params.set("guests", String(guests));

    if (checkIn) {
      params.set("checkIn", checkIn);
    }

    if (checkOut) {
      params.set("checkOut", checkOut);
    }

    router.push(
      `/?${params.toString()}`,
    );

    setOpenMenu(null);
  }

  function handleCheckInChange(
    value: string,
  ) {
    setCheckIn(value);

    if (
      checkOut &&
      value > checkOut
    ) {
      setCheckOut("");
    }
  }

  return (
    <div
      className={[
        "relative flex h-11 items-center rounded-[24px] border border-[#e6e1da] bg-white",
        compact
          ? "w-[180px]"
          : "w-[420px]",
      ].join(" ")}
    >
      {/* =========================
          ГОРОД
      ========================= */}

      <div className="relative h-full">
        <button
          type="button"
          onClick={() =>
            setOpenMenu(
              openMenu === "city"
                ? null
                : "city",
            )
          }
          className={[
            "h-full truncate border-0 bg-transparent text-left text-[14px] font-medium text-[#1c1b19]",
            compact
              ? "w-[100px] px-3"
              : "w-[120px] px-4",
          ].join(" ")}
        >
          {city}
        </button>

        {openMenu === "city" && (
          <div className="absolute left-0 top-[52px] z-[100] w-[220px] rounded-[14px] border border-[#e6e1da] bg-white p-2 shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
            <p className="px-3 pb-2 pt-1 text-[12px] font-medium text-[#9a948c]">
              Город
            </p>

            {cities.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setCity(item);
                  setOpenMenu(null);
                }}
                className={[
                  "flex w-full rounded-[9px] px-3 py-2.5 text-left text-[14px] transition hover:bg-[#f7f5f2]",
                  item === city
                    ? "font-medium text-[#2a6f5b]"
                    : "text-[#1c1b19]",
                ].join(" ")}
              >
                {item}
              </button>
            ))}
          </div>
        )}
      </div>

      <span className="h-6 w-px shrink-0 bg-[#e6e1da]" />

      {/* =========================
          ДАТЫ
      ========================= */}

      <div className="relative h-full">
        <button
          type="button"
          onClick={() =>
            setOpenMenu(
              openMenu === "dates"
                ? null
                : "dates",
            )
          }
          className={[
            "h-full truncate border-0 bg-transparent text-left text-[14px] font-medium text-[#1c1b19]",
            compact
              ? "w-[80px] px-3"
              : "w-[145px] px-4",
          ].join(" ")}
        >
          {getDateText(
            checkIn,
            checkOut,
          )}
        </button>

        {openMenu === "dates" && (
          <div className="absolute left-1/2 top-[52px] z-[100] w-[300px] -translate-x-1/2 rounded-[14px] border border-[#e6e1da] bg-white p-4 shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
            <p className="mb-3 text-[14px] font-semibold text-[#1c1b19]">
              Даты поездки
            </p>

            <div className="flex flex-col gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-medium text-[#6b6560]">
                  Заезд
                </span>

                <input
                  type="date"
                  value={checkIn}
                  onChange={(event) =>
                    handleCheckInChange(
                      event.target.value,
                    )
                  }
                  className="h-10 rounded-[9px] border border-[#e6e1da] px-3 text-[14px] outline-none focus:border-[#2a6f5b]"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-medium text-[#6b6560]">
                  Выезд
                </span>

                <input
                  type="date"
                  min={
                    checkIn || undefined
                  }
                  value={checkOut}
                  onChange={(event) =>
                    setCheckOut(
                      event.target.value,
                    )
                  }
                  className="h-10 rounded-[9px] border border-[#e6e1da] px-3 text-[14px] outline-none focus:border-[#2a6f5b]"
                />
              </label>

              <button
                type="button"
                onClick={() =>
                  setOpenMenu(null)
                }
                className="mt-1 h-10 rounded-[9px] border-0 bg-[#2a6f5b] text-[14px] font-medium text-white transition hover:bg-[#235e4d]"
              >
                Готово
              </button>
            </div>
          </div>
        )}
      </div>

      {!compact && (
        <>
          <span className="h-6 w-px shrink-0 bg-[#e6e1da]" />

          {/* =========================
              ГОСТИ
          ========================= */}

          <div className="relative h-full">
            <button
              type="button"
              onClick={() =>
                setOpenMenu(
                  openMenu === "guests"
                    ? null
                    : "guests",
                )
              }
              className="h-full w-[90px] truncate border-0 bg-transparent px-4 text-left text-[14px] font-medium text-[#1c1b19]"
            >
              {guests}{" "}
              {guests === 1
                ? "гость"
                : guests < 5
                  ? "гостя"
                  : "гостей"}
            </button>

            {openMenu === "guests" && (
              <div className="absolute right-0 top-[52px] z-[100] w-[220px] rounded-[14px] border border-[#e6e1da] bg-white p-4 shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="m-0 text-[14px] font-medium text-[#1c1b19]">
                      Гости
                    </p>

                    <p className="m-0 mt-1 text-[12px] text-[#9a948c]">
                      Количество гостей
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={guests <= 1}
                      onClick={() =>
                        setGuests(
                          (value) =>
                            Math.max(
                              1,
                              value - 1,
                            ),
                        )
                      }
                      className="flex size-8 items-center justify-center rounded-full border border-[#e6e1da] bg-white text-[18px] text-[#1c1b19] disabled:opacity-40"
                    >
                      −
                    </button>

                    <span className="w-5 text-center text-[14px] font-medium">
                      {guests}
                    </span>

                    <button
                      type="button"
                      disabled={guests >= 10}
                      onClick={() =>
                        setGuests(
                          (value) =>
                            Math.min(
                              10,
                              value + 1,
                            ),
                        )
                      }
                      className="flex size-8 items-center justify-center rounded-full border border-[#e6e1da] bg-white text-[18px] text-[#1c1b19] disabled:opacity-40"
                    >
                      +
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setOpenMenu(null)
                  }
                  className="mt-4 h-10 w-full rounded-[9px] border-0 bg-[#2a6f5b] text-[14px] font-medium text-white"
                >
                  Готово
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* =========================
          ПОИСК
      ========================= */}

      <button
        type="button"
        onClick={handleSearch}
        aria-label="Найти"
        className="ml-auto mr-1 flex size-9 shrink-0 items-center justify-center rounded-full border-0 bg-[#2a6f5b] transition hover:bg-[#235e4d]"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle
            cx="11"
            cy="11"
            r="6.5"
            stroke="white"
            strokeWidth="2"
          />

          <path
            d="M16 16L21 21"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
}