import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

/** Локале-зависимые аналоги next/link и next/navigation. Во всём сайте используем их. */
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
