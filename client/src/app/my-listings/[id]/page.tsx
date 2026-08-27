import ListingForm from "@/features/owner/ListingForm";

export const metadata = {
  title: "Редактирование объявления — Уют",
};

// В Next 16 params приходит промисом, синхронный доступ убрали.
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <ListingForm listingId={Number(id)} />;
}
