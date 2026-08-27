import { Suspense } from "react";

import CatalogPage from "@/features/catalog/CatalogPage";

// useSearchParams внутри каталога требует Suspense: без него прод-сборка Next падает.
export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="px-5 py-8 text-[15px] text-[var(--uyut-secondary)] sm:px-8 lg:px-12">
          Загружаем каталог…
        </div>
      }
    >
      <CatalogPage />
    </Suspense>
  );
}
