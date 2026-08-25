import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-[calc(100vh-72px)] items-center justify-center bg-[#f7f5f2] px-5">
      <div className="flex max-w-[500px] flex-col items-center text-center">
        <div className="text-[64px] font-semibold leading-none text-[#1c1b19]">
          404
        </div>

        <h1 className="mt-6 m-0 text-[24px] font-semibold text-[#1c1b19]">
          Такой страницы нет
        </h1>

        <p className="mt-3 m-0 text-[16px] leading-6 text-[#6b6560]">
          Возможно, объявление сняли с публикации
          или в ссылке опечатка.
        </p>

        <Link
          href="/"
          className="mt-6 flex h-[46px] items-center rounded-[10px] bg-[#2a6f5b] px-6 text-[15px] font-medium text-white no-underline hover:bg-[#235b4b]"
        >
          На главную
        </Link>
      </div>
    </main>
  );
}