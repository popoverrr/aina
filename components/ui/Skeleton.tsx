import { cn } from "@/lib/cn";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} aria-hidden="true" />;
}

/** Скелетон карточки объекта — размеры повторяют настоящую карточку, чтобы не прыгал layout. */
export function PropertyCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-base border border-line bg-surface">
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <div className="space-y-3 p-4">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );
}
