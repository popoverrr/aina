"use client";

import { Menu, MessageCircle, Phone, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { buttonClasses } from "@/components/ui/Button";

export interface NavItem {
  href: string;
  label: string;
}

interface MobileMenuProps {
  items: NavItem[];
  phone: string;
  phoneHref: string;
  whatsappHref: string;
  labels: { open: string; close: string; call: string; whatsapp: string; brand: string; role: string };
}

/**
 * Бургер + меню на весь экран через <dialog>: нативный focus trap, Escape, возврат фокуса.
 */
export function MobileMenu({ items, phone, phoneHref, whatsappHref, labels }: MobileMenuProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      document.body.style.overflow = "hidden";
    } else if (!open && dialog.open) {
      dialog.close();
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={labels.open}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="flex size-11 items-center justify-center rounded-base text-ink hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <Menu className="size-6" aria-hidden="true" />
      </button>

      <dialog
        ref={dialogRef}
        onClose={() => {
          setOpen(false);
          document.body.style.overflow = "";
        }}
        onClick={(e) => {
          if (e.target === dialogRef.current) setOpen(false);
        }}
        aria-label={labels.brand}
        className="fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none bg-surface p-0 text-ink backdrop:bg-transparent"
      >
        <div className="flex h-full flex-col">
          <div className="container-site flex h-16 items-center justify-between border-b border-line">
            <span className="font-semibold">{labels.brand}</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={labels.close}
              className="flex size-11 items-center justify-center rounded-base hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <X className="size-6" aria-hidden="true" />
            </button>
          </div>
          <nav className="container-site flex-1 overflow-y-auto py-6" aria-label={labels.brand}>
            <ul className="flex flex-col">
              {items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="block rounded-base py-3.5 text-2xl font-medium hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                    aria-current={pathname === item.href ? "page" : undefined}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="container-site flex flex-col gap-3 border-t border-line py-5">
            <a href={phoneHref} className={buttonClasses("secondary", "lg", "w-full")}>
              <Phone className="size-5" aria-hidden="true" />
              {phone}
            </a>
            <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className={buttonClasses("whatsapp", "lg", "w-full")}>
              <MessageCircle className="size-5" aria-hidden="true" />
              {labels.whatsapp}
            </a>
          </div>
        </div>
      </dialog>
    </div>
  );
}
