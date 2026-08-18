/**
 * Saudi administrative geography for the location pickers and filters.
 *
 * The 13 regions are the official set. Cities cover the main population
 * centres of each region, and districts are listed for the largest cities
 * only — there is no complete free source for every district in the Kingdom,
 * so the forms keep district as a free-text field with these as suggestions.
 *
 * Add to `DISTRICTS` as coverage is needed; nothing else has to change.
 */

export interface Region {
  /** Stable key stored in the database. */
  value: string;
  ar: string;
  en: string;
  cities: { ar: string; en: string }[];
}

export const SAUDI_REGIONS: Region[] = [
  {
    value: "RIYADH",
    ar: "منطقة الرياض",
    en: "Riyadh Region",
    cities: [
      { ar: "الرياض", en: "Riyadh" },
      { ar: "الخرج", en: "Al Kharj" },
      { ar: "الدوادمي", en: "Ad Dawadimi" },
      { ar: "المجمعة", en: "Al Majma'ah" },
      { ar: "القويعية", en: "Al Quwaiiyah" },
      { ar: "وادي الدواسر", en: "Wadi ad-Dawasir" },
      { ar: "الأفلاج", en: "Al Aflaj" },
      { ar: "الزلفي", en: "Az Zulfi" },
      { ar: "شقراء", en: "Shaqra" },
      { ar: "حوطة بني تميم", en: "Hotat Bani Tamim" },
      { ar: "عفيف", en: "Afif" },
      { ar: "السليل", en: "As Sulayyil" },
      { ar: "ضرما", en: "Dhurma" },
      { ar: "المزاحمية", en: "Al Muzahimiyah" },
      { ar: "رماح", en: "Rumah" },
      { ar: "ثادق", en: "Thadiq" },
      { ar: "حريملاء", en: "Huraymila" },
      { ar: "الحريق", en: "Al Hariq" },
      { ar: "الغاط", en: "Al Ghat" },
      { ar: "مرات", en: "Marat" },
    ],
  },
  {
    value: "MAKKAH",
    ar: "منطقة مكة المكرمة",
    en: "Makkah Region",
    cities: [
      { ar: "مكة المكرمة", en: "Makkah" },
      { ar: "جدة", en: "Jeddah" },
      { ar: "الطائف", en: "Taif" },
      { ar: "رابغ", en: "Rabigh" },
      { ar: "الليث", en: "Al Lith" },
      { ar: "القنفذة", en: "Al Qunfudhah" },
      { ar: "خليص", en: "Khulais" },
      { ar: "الجموم", en: "Al Jumum" },
      { ar: "رنية", en: "Ranyah" },
      { ar: "تربة", en: "Turubah" },
      { ar: "الخرمة", en: "Al Khurmah" },
      { ar: "الكامل", en: "Al Kamil" },
      { ar: "أضم", en: "Adham" },
      { ar: "المويه", en: "Al Muwayh" },
    ],
  },
  {
    value: "MADINAH",
    ar: "منطقة المدينة المنورة",
    en: "Madinah Region",
    cities: [
      { ar: "المدينة المنورة", en: "Madinah" },
      { ar: "ينبع", en: "Yanbu" },
      { ar: "العلا", en: "AlUla" },
      { ar: "بدر", en: "Badr" },
      { ar: "خيبر", en: "Khaybar" },
      { ar: "المهد", en: "Al Mahd" },
      { ar: "الحناكية", en: "Al Henakiyah" },
    ],
  },
  {
    value: "EASTERN",
    ar: "المنطقة الشرقية",
    en: "Eastern Province",
    cities: [
      { ar: "الدمام", en: "Dammam" },
      { ar: "الخبر", en: "Khobar" },
      { ar: "الظهران", en: "Dhahran" },
      { ar: "الأحساء", en: "Al Ahsa" },
      { ar: "الجبيل", en: "Jubail" },
      { ar: "القطيف", en: "Qatif" },
      { ar: "الخفجي", en: "Khafji" },
      { ar: "رأس تنورة", en: "Ras Tanura" },
      { ar: "بقيق", en: "Buqayq" },
      { ar: "النعيرية", en: "An Nuayriyah" },
      { ar: "حفر الباطن", en: "Hafar Al Batin" },
      { ar: "قرية العليا", en: "Qaryat Al Ulya" },
    ],
  },
  {
    value: "ASIR",
    ar: "منطقة عسير",
    en: "Asir Region",
    cities: [
      { ar: "أبها", en: "Abha" },
      { ar: "خميس مشيط", en: "Khamis Mushait" },
      { ar: "بيشة", en: "Bisha" },
      { ar: "النماص", en: "An Namas" },
      { ar: "محايل عسير", en: "Muhayil Asir" },
      { ar: "سراة عبيدة", en: "Sarat Abidah" },
      { ar: "رجال ألمع", en: "Rijal Almaa" },
      { ar: "أحد رفيدة", en: "Ahad Rafidah" },
      { ar: "تثليث", en: "Tathlith" },
      { ar: "ظهران الجنوب", en: "Dhahran Al Janub" },
      { ar: "بلقرن", en: "Balqarn" },
    ],
  },
  {
    value: "QASSIM",
    ar: "منطقة القصيم",
    en: "Qassim Region",
    cities: [
      { ar: "بريدة", en: "Buraidah" },
      { ar: "عنيزة", en: "Unaizah" },
      { ar: "الرس", en: "Ar Rass" },
      { ar: "المذنب", en: "Al Mithnab" },
      { ar: "البكيرية", en: "Al Bukayriyah" },
      { ar: "البدائع", en: "Al Badayea" },
      { ar: "الأسياح", en: "Al Asyah" },
      { ar: "النبهانية", en: "An Nabhaniyah" },
      { ar: "عيون الجواء", en: "Uyun Al Jiwa" },
      { ar: "رياض الخبراء", en: "Riyadh Al Khabra" },
    ],
  },
  {
    value: "HAIL",
    ar: "منطقة حائل",
    en: "Hail Region",
    cities: [
      { ar: "حائل", en: "Hail" },
      { ar: "بقعاء", en: "Baqaa" },
      { ar: "الشنان", en: "Ash Shinan" },
      { ar: "الغزالة", en: "Al Ghazalah" },
      { ar: "الشملي", en: "Ash Shamli" },
      { ar: "موقق", en: "Mawqaq" },
    ],
  },
  {
    value: "TABUK",
    ar: "منطقة تبوك",
    en: "Tabuk Region",
    cities: [
      { ar: "تبوك", en: "Tabuk" },
      { ar: "الوجه", en: "Al Wajh" },
      { ar: "ضباء", en: "Duba" },
      { ar: "تيماء", en: "Tayma" },
      { ar: "أملج", en: "Umluj" },
      { ar: "حقل", en: "Haql" },
      { ar: "البدع", en: "Al Bid" },
      { ar: "نيوم", en: "NEOM" },
    ],
  },
  {
    value: "NORTHERN_BORDERS",
    ar: "منطقة الحدود الشمالية",
    en: "Northern Borders Region",
    cities: [
      { ar: "عرعر", en: "Arar" },
      { ar: "رفحاء", en: "Rafha" },
      { ar: "طريف", en: "Turaif" },
      { ar: "العويقيلة", en: "Al Uwayqilah" },
    ],
  },
  {
    value: "JAZAN",
    ar: "منطقة جازان",
    en: "Jazan Region",
    cities: [
      { ar: "جازان", en: "Jazan" },
      { ar: "صبيا", en: "Sabya" },
      { ar: "أبو عريش", en: "Abu Arish" },
      { ar: "صامطة", en: "Samtah" },
      { ar: "بيش", en: "Baish" },
      { ar: "أحد المسارحة", en: "Ahad Al Masarihah" },
      { ar: "فرسان", en: "Farasan" },
      { ar: "الدرب", en: "Ad Darb" },
      { ar: "الريث", en: "Ar Rayth" },
      { ar: "العارضة", en: "Al Aridhah" },
    ],
  },
  {
    value: "NAJRAN",
    ar: "منطقة نجران",
    en: "Najran Region",
    cities: [
      { ar: "نجران", en: "Najran" },
      { ar: "شرورة", en: "Sharurah" },
      { ar: "حبونا", en: "Habuna" },
      { ar: "بدر الجنوب", en: "Badr Al Janub" },
      { ar: "يدمة", en: "Yadamah" },
      { ar: "ثار", en: "Thar" },
    ],
  },
  {
    value: "BAHA",
    ar: "منطقة الباحة",
    en: "Al Baha Region",
    cities: [
      { ar: "الباحة", en: "Al Baha" },
      { ar: "بلجرشي", en: "Baljurashi" },
      { ar: "المندق", en: "Al Mandaq" },
      { ar: "المخواة", en: "Al Makhwah" },
      { ar: "قلوة", en: "Qilwah" },
      { ar: "العقيق", en: "Al Aqiq" },
    ],
  },
  {
    value: "JOUF",
    ar: "منطقة الجوف",
    en: "Al Jouf Region",
    cities: [
      { ar: "سكاكا", en: "Sakaka" },
      { ar: "القريات", en: "Qurayyat" },
      { ar: "دومة الجندل", en: "Dumat Al Jandal" },
      { ar: "طبرجل", en: "Tabarjal" },
    ],
  },
];

/**
 * Districts for the largest cities, keyed by the Arabic city name.
 * Cities not listed here fall back to free-text district entry.
 */
export const DISTRICTS: Record<string, string[]> = {
  الرياض: [
    "النرجس", "الياسمين", "الملقا", "العليا", "الصحافة", "حطين", "الربيع",
    "العارض", "القيروان", "النخيل", "الورود", "السليمانية", "المروج",
    "الغدير", "الرحمانية", "المرسلات", "النزهة", "الازدهار", "الروضة",
    "الملز", "الشفا", "بدر", "العزيزية", "الدار البيضاء", "المنار", "الحمراء",
    "اليرموك", "قرطبة", "أشبيلية", "الرمال", "النهضة", "الخليج", "السلي",
    "المصيف", "الفلاح", "طويق", "ظهرة لبن", "العريجاء", "السويدي",
    "شبرا", "الشميسي", "الديرة", "المعذر", "أم الحمام", "الرائد", "الواحة",
    "النسيم", "الجنادرية", "الرابية", "المغرزات", "التعاون", "الصقور",
  ],
  جدة: [
    "الحمراء", "الشاطئ", "الروضة", "السلامة", "النعيم", "المرجان", "الزهراء",
    "البساتين", "النهضة", "الصفا", "المروة", "الربوة", "النزهة", "السامر",
    "الفيصلية", "الأندلس", "الرحاب", "الخالدية", "البغدادية", "الشرفية",
    "الهنداوية", "الثغر", "بني مالك", "الأجواد", "الواحة", "مشرفة",
    "أبحر الشمالية", "أبحر الجنوبية", "الفيحاء", "الجامعة", "التضامن",
    "الحمدانية", "الصواري", "اللؤلؤ", "الياقوت", "الزمرد", "الفردوس",
  ],
  "مكة المكرمة": [
    "العزيزية", "الشوقية", "النسيم", "الزاهر", "الرصيفة", "الششة", "العوالي",
    "بطحاء قريش", "المسفلة", "جرول", "الهجرة", "الخالدية", "الكعكية",
    "النوارية", "الشرائع", "ولي العهد", "الروضة", "التنعيم", "الحجون",
  ],
  "المدينة المنورة": [
    "قباء", "العوالي", "الحرم", "الخالدية", "الدفاع", "شوران", "الرانوناء",
    "النخيل", "العزيزية", "الجرف", "بني حارثة", "الملك فهد", "سلطانة",
    "أحد", "المبعوث", "العنابس", "الإسكان", "الحرة الشرقية", "الحرة الغربية",
  ],
  الدمام: [
    "الشاطئ", "الفيصلية", "الجلوية", "الروضة", "النور", "المزروعية",
    "الأثير", "النزهة", "أحد", "بدر", "الندى", "الفردوس", "الخليج",
    "غرناطة", "قرطبة", "طيبة", "الواحة", "المنار", "الريان", "الصفا",
  ],
  الخبر: [
    "العقربية", "الراكة", "الثقبة", "الحزام الذهبي", "الجسر", "اليرموك",
    "التحلية", "الخزامى", "العليا", "الأندلس", "البندرية", "الحمراء",
    "الكورنيش", "الروابي", "قرطبة", "اشبيليا", "الصواري", "الجوهرة",
  ],
  الأحساء: [
    "الهفوف", "المبرز", "العيون", "الجفر", "القارة", "الطرف", "الشعبة",
    "المنصورة", "النايفية", "الصالحية", "محاسن", "الفيصلية", "الخالدية",
  ],
  "أبها": [
    "المنسك", "الخالدية", "النسيم", "الموظفين", "الشرفية", "المروج",
    "السد", "الوردتين", "بدر", "الربوة", "الاندلس", "المحالة",
  ],
  بريدة: [
    "الصفراء", "الروضة", "الإسكان", "النهضة", "الفايزية", "الرابية",
    "الخليج", "الريان", "الشماس", "الرحاب", "الصالحية", "المنتزه",
  ],
  تبوك: [
    "المروج", "الورود", "الفيصلية", "السليمانية", "النسيم", "الروضة",
    "المصيف", "العزيزية", "الأندلس", "الريان", "قرطبة", "الخالدية",
  ],
  "حائل": [
    "النقرة", "الخزامى", "المنتزه", "الزهراء", "العزيزية", "الوسيطاء",
    "النفل", "برزان", "المطار", "الجامعيين", "لبدة", "صبابة",
  ],
  "جازان": [
    "الروضة", "الصفا", "المطار", "الشاطئ", "الرويس", "المحمدية",
    "الجامعة", "السويس", "مطلع", "الملك فهد",
  ],
  "نجران": [
    "الفيصلية", "الخالدية", "النهضة", "الضيافة", "أبا السعود", "الغويلاء",
    "الفهد", "شعب رير", "المشعلية",
  ],
};

/** Region containing a given Arabic city name, if any. */
export function regionForCity(city: string): Region | undefined {
  return SAUDI_REGIONS.find((region) =>
    region.cities.some((c) => c.ar === city)
  );
}

/** Cities of a region, or every city when no region is given. */
export function citiesForRegion(regionValue?: string) {
  if (!regionValue) {
    return SAUDI_REGIONS.flatMap((region) => region.cities);
  }
  return SAUDI_REGIONS.find((r) => r.value === regionValue)?.cities ?? [];
}

/** Known districts for a city; empty when the city is not covered yet. */
export function districtsForCity(city: string): string[] {
  return DISTRICTS[city] ?? [];
}

/** Localised region label. */
export function regionLabel(region: Region, locale: string): string {
  return locale === "ar" ? region.ar : region.en;
}

/** Localised label for a stored region value, falling back to the raw value. */
export function regionLabelForValue(value: string, locale: string): string {
  const region = SAUDI_REGIONS.find((r) => r.value === value);
  return region ? regionLabel(region, locale) : value;
}

/** Localised city label. */
export function cityLabel(
  city: { ar: string; en: string },
  locale: string
): string {
  return locale === "ar" ? city.ar : city.en;
}
