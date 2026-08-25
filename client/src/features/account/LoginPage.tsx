"use client";

import { useState } from "react";

import Button from "@/components/Button";
import Input from "@/components/Input";

export default function LoginPage() {
  const [mode, setMode] = useState<
    "login" | "register"
  >("login");

  return (
    <main className="min-h-[calc(100vh-72px)] bg-[#f7f5f2] px-4 py-12">
      <div className="mx-auto flex min-h-[700px] items-center justify-center">
        <div className="w-full max-w-[440px] rounded-[16px] border border-[#e6e1da] bg-white p-8">

          {/* Переключатель Вход / Регистрация */}
          <div className="flex rounded-[10px] bg-[#f7f5f2] p-1">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={[
                "h-10 flex-1 rounded-[8px] text-[15px] font-medium transition",
                mode === "login"
                  ? "bg-white text-[#1c1b19] shadow-sm"
                  : "text-[#6b6560]",
              ].join(" ")}
            >
              Вход
            </button>

            <button
              type="button"
              onClick={() => setMode("register")}
              className={[
                "h-10 flex-1 rounded-[8px] text-[15px] font-medium transition",
                mode === "register"
                  ? "bg-white text-[#1c1b19] shadow-sm"
                  : "text-[#6b6560]",
              ].join(" ")}
            >
              Регистрация
            </button>
          </div>

          {mode === "login" ? (
            <LoginForm />
          ) : (
            <RegisterForm />
          )}
        </div>
      </div>
    </main>
  );
}

/* =========================
   ВХОД
========================= */

function LoginForm() {
  return (
    <form
      className="mt-[18px] flex flex-col gap-[18px]"
      onSubmit={(event) => {
        event.preventDefault();

        // Здесь позже будет запрос к API
        console.log("Вход");
      }}
    >
      <Input
        id="login-email"
        name="email"
        type="email"
        label="Почта"
        placeholder="artem@example.com"
        autoComplete="email"
      />

      <Input
        id="login-password"
        name="password"
        type="password"
        label="Пароль"
        autoComplete="current-password"
      />

      <Button
        type="submit"
        size="lg"
        fullWidth
      >
        Войти
      </Button>

      <p className="m-0 text-[14px] leading-5 text-[#6b6560]">
        Нет аккаунта? Зарегистрируйтесь — это
        займёт полминуты.
      </p>
    </form>
  );
}

/* =========================
   РЕГИСТРАЦИЯ
========================= */

function RegisterForm() {
  return (
    <form
      className="mt-[18px] flex flex-col gap-[18px]"
      onSubmit={(event) => {
        event.preventDefault();

        // Здесь позже будет запрос к API
        console.log("Регистрация");
      }}
    >
      <Input
        id="register-name"
        name="name"
        type="text"
        label="Имя"
        placeholder="Ваше имя"
        autoComplete="name"
      />

      <Input
        id="register-email"
        name="email"
        type="email"
        label="Почта"
        placeholder="artem@example.com"
        autoComplete="email"
      />

      <Input
        id="register-password"
        name="password"
        type="password"
        label="Пароль"
        placeholder="Минимум 8 символов"
        autoComplete="new-password"
        hint="Используйте минимум 8 символов"
      />

      <Button
        type="submit"
        size="lg"
        fullWidth
      >
        Зарегистрироваться
      </Button>
    </form>
  );
}