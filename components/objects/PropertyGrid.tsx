import { PropertyCard } from "@/components/objects/PropertyCard";
import { PropertyCardSkeleton } from "@/components/ui/Skeleton";
import type { PublicPropertyCard } from "@/lib/properties";

interface PropertyGridProps {
  items: PublicPropertyCard[];
  priorityCount?: number;
  headingLevel?: "h2" | "h3";
}

export function PropertyGrid({ items, priorityCount = 0, headingLevel = "h3" }: PropertyGridProps) {
  return (
    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((p, i) => (
        <li key={p.id}>
          <PropertyCard property={p} priority={i < priorityCount} headingLevel={headingLevel} />
        </li>
      ))}
    </ul>
  );
}

export function PropertyGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <li key={i}>
          <PropertyCardSkeleton />
        </li>
      ))}
    </ul>
  );
}
