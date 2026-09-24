import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { PropertyForm } from "@/components/admin/PropertyForm";
import { AdminPageHeader, AdminPanel } from "@/components/admin/ui";
import { buttonClasses } from "@/components/ui/Button";
import { deleteProperty, requireAdminPage } from "@/lib/actions/admin";
import { prisma } from "@/lib/db";
import { isStorageConfigured } from "@/lib/storage";
import type { PropertyFormInput } from "@/lib/validation/admin";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

const str = (v: string | null) => v ?? "";
const num = (v: number | null) => (v === null ? "" : String(v));

export default async function EditObjectPage({ params }: Props) {
  const { id } = await params;
  await requireAdminPage(`/admin/objects/${id}`);
  const [t, property] = await Promise.all([
    getTranslations("admin"),
    prisma.property.findUnique({ where: { id }, include: { images: { orderBy: { order: "asc" } } } }),
  ]);
  if (!property) notFound();

  const initial: PropertyFormInput = {
    title: property.title,
    slug: property.slug,
    externalId: str(property.externalId),
    kind: property.kind,
    dealType: property.dealType,
    status: property.status,
    district: property.district,
    address: str(property.address),
    landmark: str(property.landmark),
    lat: num(property.lat),
    lng: num(property.lng),
    areaM2: String(property.areaM2),
    ceilingM: num(property.ceilingM),
    floor: str(property.floor),
    entrance: str(property.entrance),
    powerKw: num(property.powerKw),
    hasWetPoint: property.hasWetPoint,
    priceSale: property.priceSale ? property.priceSale.toString() : "",
    priceRentM2: property.priceRentM2 ? property.priceRentM2.toString() : "",
    priceRentTotal: property.priceRentTotal ? property.priceRentTotal.toString() : "",
    utilitiesIncluded: property.utilitiesIncluded,
    isExclusive: property.isExclusive,
    isHot: property.isHot,
    isFeatured: property.isFeatured,
    descriptionMd: property.descriptionMd,
    advantages: property.advantages.join("\n"),
    presentationUrl: str(property.presentationUrl),
    publishedAt: property.publishedAt ? property.publishedAt.toISOString().slice(0, 10) : "",
  };

  const deleteAction = deleteProperty.bind(null, property.id);

  return (
    <>
      <AdminPageHeader
        title={t("objects.edit")}
        actions={
          <>
            <Link href={`/objects/${property.slug}`} className={buttonClasses("ghost", "sm")}>
              {t("nav.site")}
            </Link>
            <DeleteButton action={deleteAction} redirectTo="/admin/objects" />
          </>
        }
      >
        <p className="text-sm text-ink-muted">{property.title}</p>
      </AdminPageHeader>

      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <AdminPanel>
          <PropertyForm id={property.id} initial={initial} />
        </AdminPanel>
        <AdminPanel title={t("objects.groups.photos")} className="self-start">
          <ImageUploader
            propertyId={property.id}
            storageReady={isStorageConfigured()}
            images={property.images.map((img) => ({ id: img.id, url: img.url, alt: img.alt, width: img.width, height: img.height, order: img.order }))}
          />
        </AdminPanel>
      </div>
    </>
  );
}
