"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useAuth } from "@/context/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({
  children,
}: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();

  const {
    isAuthenticated,
    isLoading,
  } = useAuth();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!isAuthenticated) {
      const loginUrl = `/login?returnUrl=${encodeURIComponent(
        pathname,
      )}`;

      router.replace(loginUrl);
    }
  }, [
    isAuthenticated,
    isLoading,
    pathname,
    router,
  ]);

  // Пока проверяем localStorage,
  // ничего защищённого не показываем.
  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-72px)] items-center justify-center bg-[#f7f5f2]">
        <p className="text-[15px] text-[var(--uyut-secondary)]">
          Проверяем авторизацию…
        </p>
      </div>
    );
  }

  // Если пользователь не авторизован,
  // useEffect уже отправит его на /login.
  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
