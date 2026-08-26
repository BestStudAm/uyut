"use client";

import { useState } from "react";

import Button from "@/components/Button";
import Input from "@/components/Input";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const [mode, setMode] = useState<
    "login" | "register"
  >("login");

  return (
    <main className="min-h-[calc(100vh-72px)] bg-[#f7f5f2] px-4 py-12">
      <div className="mx-auto flex min-h-[700px] items-center justify-center">
        <div className="w-full max-w-[440px] rounded-[16px] border border-[#e6e1da] bg-white p-8">
          {/* Вход / Регистрация */}
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
  const { login } = useAuth();

  const [showPassword, setShowPassword] =
    useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] =
    useState("");

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] =
    useState(false);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");

    if (!email.trim()) {
      setError("Введите почту");
      return;
    }

    if (!password) {
      setError("Введите пароль");
      return;
    }

    setIsLoading(true);

    try {
      await login(
        email.trim(),
        password,
      );

      console.log(
        "Авторизация успешна",
      );
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError(
          "Ошибка авторизации",
        );
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form
      className="mt-[18px] flex flex-col gap-[18px]"
      onSubmit={handleSubmit}
    >
      <Input
        id="login-email"
        name="email"
        type="email"
        label="Почта"
        placeholder="artem@example.com"
        autoComplete="email"
        value={email}
        onChange={(event) =>
          setEmail(event.target.value)
        }
        error={
          error === "Введите почту"
            ? error
            : undefined
        }
      />

      <Input
        id="login-password"
        name="password"
        type={
          showPassword
            ? "text"
            : "password"
        }
        label="Пароль"
        autoComplete="current-password"
        value={password}
        onChange={(event) =>
          setPassword(event.target.value)
        }
        error={
          error === "Введите пароль"
            ? error
            : undefined
        }
        rightElement={
          <PasswordToggle
            visible={showPassword}
            onClick={() =>
              setShowPassword(
                (value) => !value,
              )
            }
          />
        }
      />

      {error &&
        error !== "Введите почту" &&
        error !== "Введите пароль" && (
          <p className="-mt-2 m-0 text-[13px] text-[#d14343]">
            {error}
          </p>
        )}

      <Button
        type="submit"
        size="lg"
        fullWidth
        disabled={isLoading}
      >
        {isLoading
          ? "Входим..."
          : "Войти"}
      </Button>

      <p className="m-0 text-[14px] leading-5 text-[#6b6560]">
        Нет аккаунта? Зарегистрируйтесь —
        это займёт полминуты.
      </p>
    </form>
  );
}

/* =========================
   РЕГИСТРАЦИЯ
========================= */

function RegisterForm() {
  const { register } = useAuth();

  const [showPassword, setShowPassword] =
    useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] =
    useState("");

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] =
    useState(false);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");

    if (!name.trim()) {
      setError("Введите имя");
      return;
    }

    if (!email.trim()) {
      setError("Введите почту");
      return;
    }

    if (password.length < 8) {
      setError(
        "Пароль должен содержать минимум 8 символов",
      );
      return;
    }

    setIsLoading(true);

    try {
      await register(
        name.trim(),
        email.trim(),
        password,
      );

      console.log(
        "Регистрация успешна",
      );
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError(
          "Ошибка регистрации",
        );
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form
      className="mt-[18px] flex flex-col gap-[18px]"
      onSubmit={handleSubmit}
    >
      <Input
        id="register-name"
        name="name"
        type="text"
        label="Имя"
        placeholder="Ваше имя"
        autoComplete="name"
        value={name}
        onChange={(event) =>
          setName(event.target.value)
        }
        error={
          error === "Введите имя"
            ? error
            : undefined
        }
      />

      <Input
        id="register-email"
        name="email"
        type="email"
        label="Почта"
        placeholder="artem@example.com"
        autoComplete="email"
        value={email}
        onChange={(event) =>
          setEmail(event.target.value)
        }
        error={
          error === "Введите почту"
            ? error
            : undefined
        }
      />

      <Input
        id="register-password"
        name="password"
        type={
          showPassword
            ? "text"
            : "password"
        }
        label="Пароль"
        placeholder="Минимум 8 символов"
        autoComplete="new-password"
        value={password}
        onChange={(event) =>
          setPassword(event.target.value)
        }
        hint="Используйте минимум 8 символов"
        error={
          error.startsWith("Пароль")
            ? error
            : undefined
        }
        rightElement={
          <PasswordToggle
            visible={showPassword}
            onClick={() =>
              setShowPassword(
                (value) => !value,
              )
            }
          />
        }
      />

      {error &&
        !error.startsWith("Пароль") &&
        error !== "Введите имя" &&
        error !== "Введите почту" && (
          <p className="-mt-2 m-0 text-[13px] text-[#d14343]">
            {error}
          </p>
        )}

      <Button
        type="submit"
        size="lg"
        fullWidth
        disabled={isLoading}
      >
        {isLoading
          ? "Создаём аккаунт..."
          : "Зарегистрироваться"}
      </Button>
    </form>
  );
}

/* =========================
   Показать / скрыть пароль
========================= */

function PasswordToggle({
  visible,
  onClick,
}: {
  visible: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={
        visible
          ? "Скрыть пароль"
          : "Показать пароль"
      }
      className="flex size-8 items-center justify-center rounded-[6px] border-0 bg-transparent text-[#6b6560] transition hover:bg-[#f7f5f2] hover:text-[#1c1b19]"
    >
      {visible ? (
        <EyeOffIcon />
      ) : (
        <EyeIcon />
      )}
    </button>
  );
}

function EyeIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <circle
        cx="12"
        cy="12"
        r="2.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M3 3l18 18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <path
        d="M10.6 6.2A10.8 10.8 0 0 1 12 6c6 0 9.5 6 9.5 6a16 16 0 0 1-3.1 3.5M6.4 6.5C3.8 8.2 2.5 12 2.5 12s3.5 6 9.5 6c1 0 1.9-.2 2.7-.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M9.9 9.9a3 3 0 0 0 4.2 4.2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}