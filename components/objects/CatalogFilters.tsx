"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { Checkbox, Input, Select } from "@/components/ui/Field";
import { cn } from "@/lib/cn";
import { DISTRICTS } from "@/lib/districts";
import { PROP_KINDS } from "@/lib/enums";
import { filtersToSearchParams, type CatalogFilters as Filters, type CatalogSort } from "@/lib/catalog-filters";

export interface CatalogFiltersLabels {
  title: string;
  deal: string;
  dealAny: string;
  dealOptions: Array<{ value: "RENT" | "SALE"; label: string }>;
  kind: string;
  kindAny: string;
  kindOptions: Array<{ value: string; label: string }>;
  district: string;
  area: string;
  from: string;
  to: string;
  budget: string;
  budgetHint: string;
  onlyHot: string;
  firstLine: string;
  sort: string;
  sortOptions: Array<{ value: CatalogSort; label: string }>;
  reset: string;
  open: string;
  close: string;
  /** «N объектов» — уже отформатировано на сервере */
  count: string;
}

/**
 * Фильтры каталога, синхронизированные с URL через searchParams: любое изменение — replace URL,
 * сервер перерисовывает список. Ссылкой можно делиться, выборка воспроизводится.
 * Все подписи приходят с сервера — компонент не тянет рантайм словарей.
 */
export function CatalogFilters({ filters, labels }: { filters: Filters; labels: CatalogFiltersLabels }) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<Filters>(filters);
  const stateKey = useMemo(() => filtersToSearchParams(filters).toString(), [filters]);
  const lastPushed = useRef(stateKey);

  // Синхронизация при навигации назад/вперёд и сбросе
  useEffect(() => {
    if (stateKey !== lastPushed.current) {
      lastPushed.current = stateKey;
      setState(filters);
    }
  }, [stateKey, filters]);

  const push = (next: Filters) => {
    setState(next);
    const qs = filtersToSearchParams(next, { limit: 12 }).toString();
    lastPushed.current = qs;
    startTransition(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  };

  const update = (patch: Partial<Filters>) => push({ ...state, ...patch });

  // Числовые поля — с задержкой, чтобы не дёргать сервер на каждый символ
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const updateDebounced = (patch: Partial<Filters>) => {
    setState((s) => ({ ...s, ...patch }));
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => {
      setState((s) => {
        push({ ...s, ...patch });
        return { ...s, ...patch };
      });
    }, 450);
  };

  const numVal = (v: number | undefined) => (v === undefined ? "" : String(v));
  const parseNum = (v: string): number | undefined => {
    const n = Number(v.replace(/\s/g, "").replace(",", "."));
    return v.trim() !== "" && Number.isFinite(n) && n >= 0 ? n : undefined;
  };

  const activeCount = [...filtersToSearchParams({ ...state, sort: "hot", limit: 12 }).keys()].length;
  const reset = () => push({ districts: [], hot: false, firstLine: false, sort: "hot", limit: 12 });

  return (
    <aside className="lg:sticky lg:top-20 lg:self-start" aria-label={labels.title} aria-busy={pending}>
      <div className="mb-3 flex items-center justify-between lg:hidden">
        <Button variant="secondary" size="sm" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="catalog-filters">
          <SlidersHorizontal className="size-4" aria-hidden="true" />
          {open ? labels.close : labels.open}
          {activeCount ? <span className="ml-1 rounded-full bg-accent px-1.5 text-xs text-white">{activeCount}</span> : null}
        </Button>
        <span className="text-sm text-ink-muted tabular">{labels.count}</span>
      </div>

      <form
        id="catalog-filters"
        onSubmit={(e) => e.preventDefault()}
        className={cn("space-y-5 rounded-base border border-line bg-surface p-4 lg:block", open ? "block" : "hidden")}
      >
        <Select
          label={labels.deal}
          options={labels.dealOptions}
          placeholder={labels.dealAny}
          value={state.deal ?? ""}
          onChange={(e) => update({ deal: e.target.value === "RENT" || e.target.value === "SALE" ? e.target.value : undefined })}
        />

        <Select
          label={labels.kind}
          options={labels.kindOptions}
          placeholder={labels.kindAny}
          value={state.kind ?? ""}
          onChange={(e) => update({ kind: (PROP_KINDS as readonly string[]).includes(e.target.value) ? (e.target.value as Filters["kind"]) : undefined })}
        />

        <fieldset>
          <legend className="mb-2 text-sm font-medium">{labels.district}</legend>
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
            {DISTRICTS.map((d) => (
              <Checkbox
                key={d.slug}
                label={d.name}
                checked={state.districts.includes(d.slug)}
                onChange={(e) =>
                  update({ districts: e.target.checked ? [...state.districts, d.slug] : state.districts.filter((s) => s !== d.slug) })
                }
              />
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-sm font-medium">{labels.area}</legend>
          <div className="grid grid-cols-2 gap-2">
            <Input label={labels.from} type="number" inputMode="decimal" min={0} value={numVal(state.areaFrom)} onChange={(e) => updateDebounced({ areaFrom: parseNum(e.target.value) })} />
            <Input label={labels.to} type="number" inputMode="decimal" min={0} value={numVal(state.areaTo)} onChange={(e) => updateDebounced({ areaTo: parseNum(e.target.value) })} />
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-1 text-sm font-medium">{labels.budget}</legend>
          <p className="mb-2 text-xs text-ink-muted">{labels.budgetHint}</p>
          <div className="grid grid-cols-2 gap-2">
            <Input label={labels.from} type="number" inputMode="numeric" min={0} value={numVal(state.priceFrom)} onChange={(e) => updateDebounced({ priceFrom: parseNum(e.target.value) })} />
            <Input label={labels.to} type="number" inputMode="numeric" min={0} value={numVal(state.priceTo)} onChange={(e) => updateDebounced({ priceTo: parseNum(e.target.value) })} />
          </div>
        </fieldset>

        <div className="space-y-2">
          <Checkbox label={labels.onlyHot} checked={state.hot} onChange={(e) => update({ hot: e.target.checked })} />
          <Checkbox label={labels.firstLine} checked={state.firstLine} onChange={(e) => update({ firstLine: e.target.checked })} />
        </div>

        <Select label={labels.sort} options={labels.sortOptions} value={state.sort} onChange={(e) => update({ sort: e.target.value as CatalogSort })} />

        <Button variant="ghost" size="sm" onClick={reset} className="w-full">
          <X className="size-4" aria-hidden="true" />
          {labels.reset}
        </Button>
      </form>
    </aside>
  );
}
