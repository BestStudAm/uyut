import ProtectedRoute from "@/components/ProtectedRoute";
import ListingForm from "@/features/owner/ListingForm";

export const metadata = {
  title: "Новое объявление — Уют",
};

export default function Page() {
  return (
    <ProtectedRoute>
      <ListingForm />
    </ProtectedRoute>
  );
}