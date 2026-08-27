"use client";

import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { useCallback, useMemo } from "react";

import {
  buildSearch,
  emptyFilters,
  parseFilters,
  type CatalogFilters,
} from "./catalogParams";

export function useCatalogParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters = useMemo(
    () =>
      parseFilters(
        new URLSearchParams(
          searchParams.toString(),
        ),
      ),
    [searchParams],
  );

  // Любая правка фильтров сбрасывает страницу на первую, кроме случая,
  // когда меняют саму страницу кнопкой «показать ещё».
  const setFilters = useCallback(
    (next: Partial<CatalogFilters>) => {
      const merged: CatalogFilters = {
        ...filters,
        ...next,
        page: next.page ?? 1,
      };

      const search = buildSearch(merged);

      router.push(
        search ? `${pathname}?${search}` : pathname,
        { scroll: false },
      );
    },
    [filters, pathname, router],
  );

  const resetFilters = useCallback(() => {
    // Город, даты и гостей оставляем: их задал поиск в шапке,
    // сбрасываем только то, что пользователь накрутил в фильтрах.
    const search = buildSearch({
      ...emptyFilters,
      city: filters.city,
      checkIn: filters.checkIn,
      checkOut: filters.checkOut,
      guests: filters.guests,
    });

    router.push(
      search ? `${pathname}?${search}` : pathname,
      { scroll: false },
    );
  }, [filters, pathname, router]);

  return { filters, setFilters, resetFilters };
}
