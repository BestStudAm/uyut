import Link from "next/link";

export default function FavoritesPage() {
  return (
    <main className="min-h-[calc(100vh-72px)] bg-[#f7f5f2]">
      <div className="mx-auto max-w-[1200px] px-5 py-10">
        <h1 className="m-0 text-[32px] font-semibold text-[#1c1b19]">
          Избранное
        </h1>

        <p className="mt-1 m-0 text-[14px] text-[#6b6560]">
          4 варианта · сохраняются в вашем аккаунте
        </p>

        <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Здесь позже будут карточки */}
        </div>
      </div>
    </main>
  );
}