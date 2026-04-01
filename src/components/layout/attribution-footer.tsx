"use client";

import { useI18n } from "@/lib/i18n/context";

export function AttributionFooter() {
  const { t } = useI18n();

  return (
    <p className="text-center text-xs text-concrete-600 mt-8">
      {t("footer.attribution")}
    </p>
  );
}
