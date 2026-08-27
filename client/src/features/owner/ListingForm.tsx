"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import Button from "@/components/Button";
import Input from "@/components/Input";
import { useAuth } from "@/context/AuthContext";
import {
  apiGetAs,
  apiSend,
  ValidationError,
} from "@/lib/api";
import {
  amenityLabels,
  housingTypeLabels,
  type Amenity,
  type HousingType,
  type Listing,
} from "@/types/listing";

import { filesToPhotos, MAX_PHOTOS } from "./photos";

const districts = [
  "Центральный",
  "Адмиралтейский",
  "Василеостровский",
  "Петроградский",
  "Московский",
  "Приморский",
  "Выборгский",
  "Фрунзенский",
  "Калининский",
  "Невский",
  "Кировский",
  "Курортный",
];

const commonRules = [
  "Не курить в квартире",
  "Без вечеринок и мероприятий",
  "Можно с животными по договорённости",
];

const types = Object.keys(
  housingTypeLabels,
) as HousingType[];

const amenityKeys = Object.keys(
  amenityLabels,
) as Amenity[];

const SERVICE_FEE_PERCENT = 7;
const MIN_DESCRIPTION = 100;

interface FormState {
  title: string;
  type: HousingType;
  rooms: string;
  guests: string;
  area: string;
  district: string;
  address: string;
  pricePerNight: string;
  description: string;
  amenities: Amenity[];
  rules: string[];
  customRule: string;
  photos: string[];
}

const emptyForm: FormState = {
  title: "",
  type: "apartment",
  rooms: "1",
  guests: "2",
  area: "",
  district: "",
  address: "",
  pricePerNight: "",
  description: "",
  amenities: [],
  rules: [],
  customRule: "",
  photos: [],
};

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];
}

function fromListing(
  listing: Listing,
): FormState {
  const known = listing.rules.filter((rule) =>
    commonRules.includes(rule),
  );

  const extra = listing.rules.find(
    (rule) => !commonRules.includes(rule),
  );

  return {
    title: listing.title,
    type: listing.type,
    rooms: String(listing.rooms),
    guests: String(listing.guests),
    area: listing.area
      ? String(listing.area)
      : "",
    district: listing.district,
    address: listing.address,
    pricePerNight: listing.pricePerNight
      ? String(listing.pricePerNight)
      : "",
    description: listing.description,
    amenities: listing.amenities,
    rules: known,
    customRule: extra ?? "",
    photos: listing.photos,
  };
}

export default function ListingForm({
  listingId,
}: {
  listingId?: number;
}) {
  const router = useRouter();
  const { user, isLoading: authLoading } =
    useAuth();

  const [form, setForm] =
    useState<FormState>(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<
    Record<string, string>
  >({});
  const [formError, setFormError] = useState<
    string | null
  >(null);
  const [photoErrors, setPhotoErrors] = useState<
    string[]
  >([]);
  const [saving, setSaving] = useState(false);
  const [loadingListing, setLoadingListing] =
    useState(Boolean(listingId));

  const fileInputRef =
    useRef<HTMLInputElement>(null);

  const userId = user?.id ?? null;

  useEffect(() => {
    if (!listingId || !userId) {
      return;
    }

    const controller = new AbortController();

    apiGetAs<{ items: Listing[] }>(
      "/my/listings",
      userId,
      controller.signal,
    )
      .then((data) => {
        const found = data.items.find(
          (item) => item.id === listingId,
        );

        if (found) {
          setForm(fromListing(found));
        } else {
          setFormError(
            "Объявление не найдено или оно не ваше",
          );
        }

        setLoadingListing(false);
      })
      .catch((cause: unknown) => {
        if (
          cause instanceof DOMException &&
          cause.name === "AbortError"
        ) {
          return;
        }

        setFormError(
          cause instanceof Error
            ? cause.message
            : "Не удалось загрузить объявление",
        );
        setLoadingListing(false);
      });

    return () => controller.abort();
  }, [listingId, userId]);

  function update<K extends keyof FormState>(
    key: K,
    value: FormState[K],
  ) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  // Обложка — это просто первая фотография в списке, поэтому «сделать обложкой»
  // означает переставить её в начало, сохранив порядок остальных.
  function makeCover(index: number) {
    if (index === 0) {
      return;
    }

    setForm((prev) => {
      const next = [...prev.photos];
      const [chosen] = next.splice(index, 1);

      return {
        ...prev,
        photos: [chosen, ...next],
      };
    });
  }

  async function addFiles(files: FileList) {
    const { photos, errors } =
      await filesToPhotos(
        files,
        form.photos.length,
      );

    setPhotoErrors(errors);
    setForm((prev) => ({
      ...prev,
      photos: [...prev.photos, ...photos].slice(
        0,
        MAX_PHOTOS,
      ),
    }));
  }

  async function save(
    status: "published" | "draft",
  ) {
    setSaving(true);
    setFieldErrors({});
    setFormError(null);

    const rules = [
      ...form.rules,
      form.customRule.trim(),
    ].filter(Boolean);

    const body = {
      title: form.title,
      type: form.type,
      rooms: Number(form.rooms) || 0,
      guests: Number(form.guests) || 0,
      area: Number(form.area) || 0,
      district: form.district,
      address: form.address,
      pricePerNight:
        Number(form.pricePerNight) || 0,
      description: form.description,
      amenities: form.amenities,
      rules,
      photos: form.photos,
      status,
    };

    try {
      await apiSend<Listing>(
        listingId
          ? `/my/listings/${listingId}`
          : "/my/listings",
        {
          method: listingId ? "PATCH" : "POST",
          body,
          userId,
        },
      );

      router.push("/my-listings");
    } catch (cause) {
      if (cause instanceof ValidationError) {
        setFieldErrors(cause.errors);
        setFormError(
          "Проверьте поля, отмеченные красным",
        );
      } else {
        setFormError(
          cause instanceof Error
            ? cause.message
            : "Не удалось сохранить",
        );
      }
    } finally {
      setSaving(false);
    }
  }

  if (authLoading || loadingListing) {
    return (
      <div className="px-5 py-10 text-[15px] text-[var(--uyut-secondary)] sm:px-8 lg:px-12">
        Загружаем…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto flex max-w-[520px] flex-col items-center gap-4 px-5 py-20 text-center">
        <h1 className="m-0 text-[24px] font-semibold text-[#1c1b19]">
          Сначала войдите
        </h1>

        <Link
          href="/login"
          className="no-underline"
        >
          <Button size="lg">Войти</Button>
        </Link>
      </div>
    );
  }

  const price = Number(form.pricePerNight) || 0;
  const guestPrice = Math.round(
    price * (1 + SERVICE_FEE_PERCENT / 100),
  );

  const checklist = [
    {
      label: "Минимум три фотографии",
      done: form.photos.length >= 3,
    },
    {
      label: `Описание от ${MIN_DESCRIPTION} символов`,
      done:
        form.description.trim().length >=
        MIN_DESCRIPTION,
    },
    {
      label: "Указана цена за ночь",
      done: price > 0,
    },
    {
      label: "Заполнен адрес",
      done: form.address.trim().length > 0,
    },
  ];

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-8 px-5 py-8 sm:px-8 lg:px-12">
      <div className="flex flex-col gap-1">
        <h1 className="m-0 text-[28px] font-semibold leading-9 text-[#1c1b19] sm:text-[32px]">
          {listingId
            ? "Редактирование объявления"
            : "Новое объявление"}
        </h1>

        <p className="m-0 text-[14px] leading-5 text-[var(--uyut-secondary)]">
          Заполните поля и опубликуйте. Черновик
          можно сохранить в любой момент, даже
          наполовину заполненный.
        </p>
      </div>

      {formError && (
        <p className="m-0 rounded-[10px] border border-[#d14343] bg-[#fdf4f4] px-4 py-3 text-[14px] text-[#d14343]">
          {formError}
        </p>
      )}

      <div className="flex flex-col gap-10 lg:flex-row">
        <form
          className="flex min-w-0 flex-1 flex-col gap-8"
          onSubmit={(event) =>
            event.preventDefault()
          }
        >
          <section className="flex flex-col gap-4">
            <h2 className="m-0 text-[20px] font-semibold text-[#1c1b19]">
              Основное
            </h2>

            <Input
              label="Название объявления"
              placeholder="Светлая студия у канала Грибоедова"
              value={form.title}
              error={fieldErrors.title}
              onChange={(event) =>
                update(
                  "title",
                  event.target.value,
                )
              }
            />

            <div className="flex flex-col gap-4 sm:flex-row">
              <label className="flex w-full flex-col gap-1.5">
                <span className="text-[14px] font-medium leading-5 text-[#1c1b19]">
                  Тип жилья
                </span>

                <select
                  value={form.type}
                  onChange={(event) =>
                    update(
                      "type",
                      event.target
                        .value as HousingType,
                    )
                  }
                  className="h-11 w-full rounded-[10px] border border-[var(--uyut-border)] bg-white px-3.5 text-[15px] text-[#1c1b19] outline-none focus:border-[#2a6f5b]"
                >
                  {types.map((type) => (
                    <option
                      key={type}
                      value={type}
                    >
                      {housingTypeLabels[type]}
                    </option>
                  ))}
                </select>
              </label>

              <Input
                label="Комнат"
                type="number"
                min={1}
                value={form.rooms}
                error={fieldErrors.rooms}
                onChange={(event) =>
                  update(
                    "rooms",
                    event.target.value,
                  )
                }
              />
            </div>

            <div className="flex flex-col gap-4 sm:flex-row">
              <Input
                label="Гостей максимум"
                type="number"
                min={1}
                value={form.guests}
                error={fieldErrors.guests}
                onChange={(event) =>
                  update(
                    "guests",
                    event.target.value,
                  )
                }
              />

              <Input
                label="Площадь, м²"
                type="number"
                min={1}
                placeholder="34"
                value={form.area}
                error={fieldErrors.area}
                onChange={(event) =>
                  update(
                    "area",
                    event.target.value,
                  )
                }
              />
            </div>
          </section>

          <section className="flex flex-col gap-4 border-t border-[var(--uyut-border)] pt-8">
            <h2 className="m-0 text-[20px] font-semibold text-[#1c1b19]">
              Адрес
            </h2>

            <label className="flex w-full flex-col gap-1.5">
              <span className="text-[14px] font-medium leading-5 text-[#1c1b19]">
                Район
              </span>

              <select
                value={form.district}
                onChange={(event) =>
                  update(
                    "district",
                    event.target.value,
                  )
                }
                className={[
                  "h-11 w-full rounded-[10px] border bg-white px-3.5 text-[15px] outline-none focus:border-[#2a6f5b]",
                  fieldErrors.district
                    ? "border-[#d14343] text-[#1c1b19]"
                    : "border-[var(--uyut-border)] text-[#1c1b19]",
                ].join(" ")}
              >
                <option value="">
                  Выберите район
                </option>

                {districts.map((district) => (
                  <option
                    key={district}
                    value={district}
                  >
                    {district}
                  </option>
                ))}
              </select>

              {fieldErrors.district && (
                <span className="text-[13px] leading-5 text-[#d14343]">
                  {fieldErrors.district}
                </span>
              )}
            </label>

            <Input
              label="Улица и дом"
              placeholder="набережная канала Грибоедова, 24"
              value={form.address}
              error={fieldErrors.address}
              hint="Точный адрес видит только гость с подтверждённой бронью."
              onChange={(event) =>
                update(
                  "address",
                  event.target.value,
                )
              }
            />

            <p className="m-0 text-[13px] leading-5 text-[var(--uyut-muted)]">
              Метку на карте ставим по центру
              района: точного геокодера в проекте
              пока нет.
            </p>
          </section>

          <section className="flex flex-col gap-4 border-t border-[var(--uyut-border)] pt-8">
            <h2 className="m-0 text-[20px] font-semibold text-[#1c1b19]">
              Цена
            </h2>

            <Input
              label="Цена за ночь, ₽"
              type="number"
              min={0}
              step={100}
              placeholder="4200"
              value={form.pricePerNight}
              error={fieldErrors.pricePerNight}
              onChange={(event) =>
                update(
                  "pricePerNight",
                  event.target.value,
                )
              }
            />

            {price > 0 && (
              <p className="m-0 text-[13px] leading-5 text-[var(--uyut-muted)]">
                Гость увидит{" "}
                {guestPrice.toLocaleString(
                  "ru-RU",
                )}{" "}
                ₽ за ночь: к вашей цене
                добавляется сервисный сбор{" "}
                {SERVICE_FEE_PERCENT}%.
              </p>
            )}
          </section>

          <section className="flex flex-col gap-4 border-t border-[var(--uyut-border)] pt-8">
            <h2 className="m-0 text-[20px] font-semibold text-[#1c1b19]">
              Описание
            </h2>

            <label className="flex w-full flex-col gap-1.5">
              <span className="text-[14px] font-medium leading-5 text-[#1c1b19]">
                Расскажите о квартире
              </span>

              <textarea
                rows={6}
                value={form.description}
                onChange={(event) =>
                  update(
                    "description",
                    event.target.value,
                  )
                }
                placeholder="Светлая студия на третьем этаже с окнами на канал. Пять минут пешком до метро, рядом набережная и парк."
                className={[
                  "w-full resize-y rounded-[10px] border bg-white px-3.5 py-3 text-[15px] leading-6 text-[#1c1b19] outline-none focus:border-[#2a6f5b]",
                  fieldErrors.description
                    ? "border-[#d14343]"
                    : "border-[var(--uyut-border)]",
                ].join(" ")}
              />
            </label>

            <p
              className={[
                "m-0 text-[13px] leading-5",
                fieldErrors.description
                  ? "text-[#d14343]"
                  : "text-[var(--uyut-muted)]",
              ].join(" ")}
            >
              {form.description.trim().length} из
              1000 символов. Минимум{" "}
              {MIN_DESCRIPTION}, иначе объявление
              не опубликуется.
            </p>
          </section>

          <section className="flex flex-col gap-4 border-t border-[var(--uyut-border)] pt-8">
            <h2 className="m-0 text-[20px] font-semibold text-[#1c1b19]">
              Удобства
            </h2>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {amenityKeys.map((amenity) => (
                <label
                  key={amenity}
                  className="flex cursor-pointer items-center gap-2.5 text-[15px] text-[#1c1b19]"
                >
                  <input
                    type="checkbox"
                    checked={form.amenities.includes(
                      amenity,
                    )}
                    onChange={() =>
                      update(
                        "amenities",
                        toggle(
                          form.amenities,
                          amenity,
                        ),
                      )
                    }
                    className="size-5 accent-[#2a6f5b]"
                  />

                  {amenityLabels[amenity]}
                </label>
              ))}
            </div>
          </section>

          <section className="flex flex-col gap-4 border-t border-[var(--uyut-border)] pt-8">
            <h2 className="m-0 text-[20px] font-semibold text-[#1c1b19]">
              Правила
            </h2>

            <div className="flex flex-col gap-3">
              {commonRules.map((rule) => (
                <label
                  key={rule}
                  className="flex cursor-pointer items-center gap-2.5 text-[15px] text-[#1c1b19]"
                >
                  <input
                    type="checkbox"
                    checked={form.rules.includes(
                      rule,
                    )}
                    onChange={() =>
                      update(
                        "rules",
                        toggle(
                          form.rules,
                          rule,
                        ),
                      )
                    }
                    className="size-5 accent-[#2a6f5b]"
                  />

                  {rule}
                </label>
              ))}
            </div>

            <Input
              label="Своё правило"
              placeholder="Заезд после 14:00, выезд до 12:00"
              value={form.customRule}
              onChange={(event) =>
                update(
                  "customRule",
                  event.target.value,
                )
              }
            />
          </section>

          <section className="flex flex-col gap-4 border-t border-[var(--uyut-border)] pt-8">
            <h2 className="m-0 text-[20px] font-semibold text-[#1c1b19]">
              Фотографии
            </h2>

            <button
              type="button"
              onClick={() =>
                fileInputRef.current?.click()
              }
              onDragOver={(event) =>
                event.preventDefault()
              }
              onDrop={(event) => {
                event.preventDefault();

                if (event.dataTransfer.files) {
                  void addFiles(
                    event.dataTransfer.files,
                  );
                }
              }}
              className={[
                "flex h-[140px] w-full flex-col items-center justify-center gap-1.5 rounded-[12px] border border-dashed bg-[#fbfaf8] px-4 text-center transition-colors hover:bg-[#f7f5f2]",
                fieldErrors.photos
                  ? "border-[#d14343]"
                  : "border-[#d8d2c9]",
              ].join(" ")}
            >
              <span className="text-[15px] font-medium text-[#1c1b19]">
                Перетащите фото сюда или выберите
                на компьютере
              </span>

              <span className="text-[13px] text-[var(--uyut-muted)]">
                JPG или PNG. Минимум три
                фотографии. Обложкой станет
                первая — нажмите на любую другую,
                чтобы поменять
              </span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(event) => {
                if (event.target.files) {
                  void addFiles(
                    event.target.files,
                  );
                }

                event.target.value = "";
              }}
            />

            {fieldErrors.photos && (
              <p className="m-0 text-[13px] leading-5 text-[#d14343]">
                {fieldErrors.photos}
              </p>
            )}

            {photoErrors.map((message) => (
              <p
                key={message}
                className="m-0 text-[13px] leading-5 text-[#d14343]"
              >
                {message}
              </p>
            ))}

            {form.photos.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {form.photos.map(
                  (photo, index) => (
                    <div
                      key={photo.slice(-40) + index}
                      className={[
                        "relative h-[120px] w-[160px] overflow-hidden rounded-[10px] bg-[var(--uyut-image)]",
                        index === 0
                          ? "ring-2 ring-[#2a6f5b]"
                          : "",
                      ].join(" ")}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo}
                        alt=""
                        className="h-full w-full object-cover"
                      />

                      {index !== 0 && (
                        <button
                          type="button"
                          onClick={() =>
                            makeCover(index)
                          }
                          aria-label={`Сделать обложкой фото ${index + 1}`}
                          title="Сделать обложкой"
                          className="absolute inset-0 flex cursor-pointer items-end justify-center pb-2 text-[11px] font-medium text-white transition-colors hover:bg-black/25"
                        >
                          <span className="rounded-[8px] bg-black/55 px-2 py-1">
                            Сделать обложкой
                          </span>
                        </button>
                      )}

                      <button
                        type="button"
                        aria-label="Убрать фото"
                        onClick={() =>
                          update(
                            "photos",
                            form.photos.filter(
                              (_, i) =>
                                i !== index,
                            ),
                          )
                        }
                        className="absolute right-2 top-2 z-10 flex size-6 items-center justify-center rounded-full bg-white text-[12px] text-[#1c1b19] shadow-[0_1px_4px_rgba(0,0,0,0.2)]"
                      >
                        ✕
                      </button>

                      {index === 0 && (
                        <span className="absolute bottom-2 left-2 inline-flex h-[22px] items-center rounded-[8px] bg-[#2a6f5b] px-2 text-[11px] font-medium text-white">
                          Обложка
                        </span>
                      )}
                    </div>
                  ),
                )}
              </div>
            )}
          </section>

          <div className="flex flex-col gap-3 border-t border-[var(--uyut-border)] pt-8 sm:flex-row">
            <Button
              type="button"
              size="lg"
              disabled={saving}
              onClick={() => save("published")}
            >
              {saving
                ? "Сохраняем…"
                : "Опубликовать"}
            </Button>

            <Button
              type="button"
              size="lg"
              variant="secondary"
              disabled={saving}
              onClick={() => save("draft")}
            >
              Сохранить черновик
            </Button>

            <Link
              href="/my-listings"
              className="no-underline"
            >
              <Button
                type="button"
                size="lg"
                variant="ghost"
              >
                Отмена
              </Button>
            </Link>
          </div>
        </form>

        <aside className="flex w-full shrink-0 flex-col gap-5 self-start rounded-[16px] bg-[#f7f5f2] p-6 lg:w-[360px]">
          <h2 className="m-0 text-[16px] font-semibold text-[#1c1b19]">
            Так объявление увидят гости
          </h2>

          <div className="flex flex-col gap-3">
            <div className="aspect-[3/2] w-full overflow-hidden rounded-[12px] bg-[var(--uyut-image)]">
              {form.photos[0] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={form.photos[0]}
                  alt=""
                  className="h-full w-full object-cover"
                />
              )}
            </div>

            <div className="flex flex-col gap-1">
              <p className="m-0 text-[16px] font-medium leading-6 text-[#1c1b19]">
                {form.title ||
                  "Название объявления"}
              </p>

              <p className="m-0 text-[14px] leading-5 text-[var(--uyut-secondary)]">
                {form.district
                  ? `${form.district} район`
                  : "Район не выбран"}
              </p>

              <p className="m-0 text-[16px] font-semibold leading-6 text-[#1c1b19]">
                {price > 0
                  ? `${price.toLocaleString("ru-RU")} ₽ `
                  : "Цена не указана "}
                {price > 0 && (
                  <span className="font-normal">
                    / ночь
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="h-px w-full bg-[var(--uyut-border)]" />

          <h3 className="m-0 text-[16px] font-semibold text-[#1c1b19]">
            Перед публикацией
          </h3>

          <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
            {checklist.map((item) => (
              <li
                key={item.label}
                className="flex items-start gap-2.5"
              >
                <span
                  className={[
                    "mt-1.5 block size-2 shrink-0 rounded-full",
                    item.done
                      ? "bg-[#2a6f5b]"
                      : "bg-[#d8d2c9]",
                  ].join(" ")}
                />

                <span
                  className={[
                    "text-[14px] leading-5",
                    item.done
                      ? "text-[#3a3733]"
                      : "text-[var(--uyut-muted)]",
                  ].join(" ")}
                >
                  {item.label}
                </span>
              </li>
            ))}
          </ul>

          <p className="m-0 text-[13px] leading-5 text-[var(--uyut-muted)]">
            Не всё готово — сохраните черновик,
            он никуда не денется.
          </p>
        </aside>
      </div>
    </div>
  );
}
