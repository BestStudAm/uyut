import ProtectedRoute from "@/components/ProtectedRoute";
import ListingForm from "@/features/owner/ListingForm";

export const metadata = {
  title: "Редактирование объявления — Уют",
};

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <ProtectedRoute>
      <ListingForm listingId={Number(id)} />
    </ProtectedRoute>
  );
}