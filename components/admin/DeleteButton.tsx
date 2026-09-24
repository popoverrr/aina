"use client";

import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import type { AdminActionResult } from "@/lib/validation/admin";

interface DeleteButtonProps {
  action: () => Promise<AdminActionResult>;
  redirectTo?: string;
  label?: string;
  size?: "sm" | "md";
}

/** Удаление с подтверждением; после успеха — переход или обновление списка. */
export function DeleteButton({ action, redirectTo, label, size = "sm" }: DeleteButtonProps) {
  const t = useTranslations("admin.common");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="danger"
      size={size}
      loading={pending}
      onClick={() => {
        if (!window.confirm(t("confirmDelete"))) return;
        startTransition(async () => {
          const result = await action();
          if (!result.ok) {
            window.alert(t("error", { message: result.formError ?? "unknown" }));
            return;
          }
          if (redirectTo) router.push(redirectTo);
          else router.refresh();
        });
      }}
    >
      <Trash2 className="size-4" aria-hidden="true" />
      {label ?? t("delete")}
    </Button>
  );
}
