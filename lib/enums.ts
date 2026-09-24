/**
 * Строковые перечисления модели (зеркало enum'ов Prisma) без зависимостей —
 * безопасно импортировать в клиентские компоненты.
 */
export const LEAD_TYPES = ["OBJECT", "SEARCH", "OWNER", "CONTACT", "PRESENTATION"] as const;
export const PROP_KINDS = ["RETAIL", "OFFICE", "WAREHOUSE", "LAND", "BUILDING"] as const;
export const DEAL_TYPES = ["RENT", "SALE", "BOTH"] as const;
export const PROP_STATUSES = ["ACTIVE", "RESERVED", "CLOSED", "HIDDEN"] as const;
export const LEAD_STATUSES = ["NEW", "IN_WORK", "QUALIFIED", "REJECTED", "DEAL"] as const;

export type LeadTypeValue = (typeof LEAD_TYPES)[number];
export type PropKindValue = (typeof PROP_KINDS)[number];
export type DealTypeValue = (typeof DEAL_TYPES)[number];
export type PropStatusValue = (typeof PROP_STATUSES)[number];
export type LeadStatusValue = (typeof LEAD_STATUSES)[number];
