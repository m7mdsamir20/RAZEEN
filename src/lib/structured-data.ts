import {
  CONTACT,
  SITE_URL,
  SOCIAL,
  localizedAddress,
  localizedCity,
} from "@/lib/site";

/** Organisation schema for the site as a whole. */
export function organizationSchema(locale: string, appName: string) {
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    name: appName,
    url: `${SITE_URL}/${locale}`,
    logo: `${SITE_URL}/logo.png`,
    email: CONTACT.email,
    telephone: CONTACT.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: localizedAddress(locale),
      addressLocality: localizedCity(locale),
      postalCode: CONTACT.postalCode,
      addressCountry: "SA",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: CONTACT.latitude,
      longitude: CONTACT.longitude,
    },
    sameAs: Object.values(SOCIAL),
  };
}

interface PropertySchemaInput {
  id: string;
  title: string;
  description: string;
  price: number;
  area: number;
  bedrooms: number;
  bathrooms: number;
  city: string;
  district: string;
  latitude: number | null;
  longitude: number | null;
  type: string;
  images: { url: string }[];
  createdAt: Date;
}

/**
 * Listing schema. Google reads `RealEstateListing` for property results;
 * the nested `Accommodation` carries the physical attributes.
 */
export function propertySchema(
  property: PropertySchemaInput,
  locale: string,
  appName: string
) {
  const url = `${SITE_URL}/${locale}/properties/${property.id}`;

  return {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    "@id": url,
    url,
    name: property.title,
    description: property.description.slice(0, 500),
    datePosted: property.createdAt.toISOString(),
    image: property.images.map((image) => `${SITE_URL}${image.url}`),
    offers: {
      "@type": "Offer",
      price: property.price,
      priceCurrency: "SAR",
      availability: "https://schema.org/InStock",
      businessFunction:
        property.type === "RENT"
          ? "https://schema.org/LeaseOut"
          : "https://schema.org/Sell",
    },
    about: {
      "@type": "Accommodation",
      numberOfBedrooms: property.bedrooms,
      numberOfBathroomsTotal: property.bathrooms,
      floorSize: {
        "@type": "QuantitativeValue",
        value: property.area,
        unitCode: "MTK", // square metre
      },
      address: {
        "@type": "PostalAddress",
        addressLocality: property.city,
        addressRegion: property.district,
        addressCountry: "SA",
      },
      ...(property.latitude !== null && property.longitude !== null
        ? {
            geo: {
              "@type": "GeoCoordinates",
              latitude: property.latitude,
              longitude: property.longitude,
            },
          }
        : {}),
    },
    provider: {
      "@type": "RealEstateAgent",
      name: appName,
      url: `${SITE_URL}/${locale}`,
    },
  };
}

/** Breadcrumb trail for a listing page. */
export function breadcrumbSchema(
  items: { name: string; path: string }[],
  locale: string
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}/${locale}${item.path}`,
    })),
  };
}
