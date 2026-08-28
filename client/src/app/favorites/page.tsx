import ProtectedRoute from "@/components/ProtectedRoute";
import FavoritesPage from "@/features/account/FavoritesPage";

export const metadata = {
  title: "Избранное — Уют",
};

export default function Page() {
  return (
    <ProtectedRoute>
      <FavoritesPage />
    </ProtectedRoute>
  );
}