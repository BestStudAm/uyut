"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export interface User {
  id: number;
  name: string;
  email: string;
}

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (
    email: string,
    password: string,
  ) => Promise<void>;

  register: (
    name: string,
    email: string,
    password: string,
  ) => Promise<void>;

  logout: () => void;
}

const AuthContext =
  createContext<AuthContextValue | null>(
    null,
  );

const STORAGE_KEY = "uyut_user";

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] =
    useState<User | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  // Восстанавливаем пользователя
  // после обновления страницы
  useEffect(() => {
    const savedUser =
      localStorage.getItem(STORAGE_KEY);

    if (savedUser) {
      try {
        const parsedUser: User =
          JSON.parse(savedUser);

        setUser(parsedUser);
      } catch {
        localStorage.removeItem(
          STORAGE_KEY,
        );
      }
    }

    setIsLoading(false);
  }, []);

  // =========================
  // ВХОД
  // =========================

  async function login(
    email: string,
    password: string,
  ) {
    const response = await fetch(
      "http://localhost:3001/api/auth/login",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          email,
          password,
        }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message ||
          "Ошибка авторизации",
      );
    }

    const loggedUser: User =
      data.user;

    setUser(loggedUser);

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(loggedUser),
    );
  }

  // =========================
  // РЕГИСТРАЦИЯ
  // =========================

  async function register(
    name: string,
    email: string,
    password: string,
  ) {
    const response = await fetch(
      "http://localhost:3001/api/auth/register",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          name,
          email,
          password,
        }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message ||
          "Ошибка регистрации",
      );
    }

    const newUser: User =
      data.user;

    setUser(newUser);

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(newUser),
    );
  }

  // =========================
  // ВЫХОД
  // =========================

  function logout() {
    setUser(null);

    localStorage.removeItem(
      STORAGE_KEY,
    );
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated:
          user !== null,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth должен использоваться внутри AuthProvider",
    );
  }

  return context;
}