export default function ListingCardSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-3">
      <div className="aspect-[3/2] w-full rounded-[12px] bg-[var(--uyut-image)]" />

      <div className="flex flex-col gap-2">
        <div className="h-4 w-3/4 rounded bg-[var(--uyut-image)]" />
        <div className="h-3 w-1/2 rounded bg-[var(--uyut-image)]" />
        <div className="h-3 w-2/3 rounded bg-[var(--uyut-image)]" />
      </div>
    </div>
  );
}
