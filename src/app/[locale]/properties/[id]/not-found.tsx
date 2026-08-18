import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { SearchX } from "lucide-react";

export default function PropertyNotFound() {
  const t = useTranslations();

  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      <div className="flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <SearchX className="w-8 h-8 text-gray-400" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {t("notFound.propertyTitle")}
        </h1>
        <p className="text-base text-gray-500 max-w-sm mb-6">
          {t("notFound.propertyDesc")}
        </p>
        <Link
          href="/properties"
          className="px-6 py-3 text-base font-medium text-white bg-primary rounded-xl hover:bg-primary/90 transition-colors focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:outline-none min-h-[48px] flex items-center"
        >
          {t("properties.title")}
        </Link>
      </div>
    </div>
  );
}
