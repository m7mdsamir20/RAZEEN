@AGENTS.md

# 🏠 Saudi Real Estate Platform — Project Instructions

## نظرة عامة
منصة عقارات سعودية حديثة **ثنائية اللغة (عربي + إنجليزي)** تخدم الزوار والمستخدمين الموثقين والشركة العقارية المالكة.
التصميم **Light Mode فقط**، متجاوب بالكامل مع الموبايل (Mobile-first).

## الخطة التفصيلية
راجع ملف `PROJECT_PLAN.md` دائماً قبل أي تنفيذ — يحتوي على كل التفاصيل والمراحل والجداول.

---

## 🔧 Claude Code Skills — قواعد العمل الإلزامية

### عند بناء أو تعديل أي واجهة (Frontend):
نفّذ الخطوات الأربعة بالترتيب ولا تعتبر المهمة منتهية قبل إتمامها:

1. **قبل كتابة أي كود UI** → شغّل `/vercel-react-best-practices` لضمان اتباع أفضل ممارسات React/Next.js
2. **اكتب الكود** وطبّق `/vercel-composition-patterns` لأنماط التركيب الصحيحة
3. **بعد البناء** → شغّل `/web-design-guidelines` على الملفات المبنية لمراجعة الـ UI والـ accessibility
4. **شغّل التطبيق** عبر `/run` وصوّر الصفحة في المتصفح وأصلح ما تراه بعينك

### عند بناء أو تعديل أي كود Backend:
1. **بعد كتابة الكود** → شغّل `/review` لمراجعة جودة الكود
2. **على endpoints حساسة (auth, upload, admin)** → شغّل `/security-review`

### عند تنظيف أو تحسين كود موجود:
- شغّل `/simplify` لمراجعة الكود وتبسيطه وإزالة التكرار

### عند بناء charts أو إحصائيات (لوحة التحكم):
- شغّل `/dataviz` قبل كتابة أي كود رسوم بيانية

### عند اختبار وظائف:
- شغّل `/webapp-testing` للتأكد من تغطية الاختبارات

---

## 🛠️ Technology Stack (الإصدارات الفعلية)

| التقنية | الإصدار | ملاحظات |
|:---|:---|:---|
| Next.js | 16.3.0 | ⚠️ إصدار جديد — راجع `node_modules/next/dist/docs/` قبل كتابة أي كود |
| React | 19.2.8 | React 19 مع Server Components و Actions |
| TypeScript | 5.x | Strict mode مفعّل |
| Tailwind CSS | 4.x | الإصدار الرابع — يستخدم `@import "tailwindcss"` و `@theme inline` |
| Prisma ORM | 7.9.1 | مع MariaDB كقاعدة بيانات |
| MariaDB | — | متوافقة مع MySQL — provider في Prisma هو `mysql` |
| @vis.gl/react-google-maps | 1.9.0 | لخرائط Google التفاعلية |
| Lucide React | 1.31.0 | مكتبة الأيقونات |
| next-intl | — | لدعم اللغتين العربية والإنجليزية (i18n) |
| PostCSS | — | مع `@tailwindcss/postcss` plugin |

---

## 🌍 Internationalization (i18n) — دعم اللغتين

### البنية:
- استخدام `next-intl` لإدارة الترجمة
- اللغة الافتراضية: **العربية (ar)**
- اللغة الثانية: **الإنجليزية (en)**
- المسارات: `/ar/properties`, `/en/properties` ...
- ملفات الترجمة في `src/messages/ar.json` و `src/messages/en.json`

### قواعد الاتجاه:
- **العربي:** `dir="rtl"` + `lang="ar"`
- **الإنجليزي:** `dir="ltr"` + `lang="en"`
- يتغير الاتجاه تلقائياً حسب اللغة المختارة

### قواعد الترجمة:
- كل نص يظهر للمستخدم يمر عبر `useTranslations()` أو `getTranslations()`
- لا نصوص عربية أو إنجليزية hardcoded في المكونات أبداً
- أسماء المفاتيح بالإنجليزية: `t('property.title')`, `t('nav.home')`

---

## 📁 Folder Structure Convention

```
src/
├── app/
│   ├── [locale]/               # مسار اللغة (ar / en)
│   │   ├── (public)/           # صفحات عامة (الرئيسية، العقارات، الخريطة)
│   │   ├── (auth)/             # صفحات تسجيل الدخول والتوثيق
│   │   ├── (dashboard)/        # صفحات المستخدم (حسابي، إعلاناتي، المفضلة)
│   │   ├── admin/              # لوحة تحكم الشركة
│   │   ├── layout.tsx          # Locale layout (RTL/LTR, fonts)
│   │   ├── page.tsx            # الصفحة الرئيسية
│   │   └── not-found.tsx       # صفحة 404 مخصصة
│   ├── api/                    # API Routes (خارج [locale])
│   ├── layout.tsx              # Root layout
│   └── globals.css             # Global styles + Tailwind
├── components/                 # مكونات مشتركة
│   ├── ui/                     # مكونات UI أساسية (Button, Input, Card, Modal...)
│   ├── layout/                 # Header, Footer, Sidebar, LanguageSwitcher
│   ├── property/               # مكونات العقارات (PropertyCard, PropertyGrid, PropertyFilters)
│   └── map/                    # مكونات الخريطة
├── lib/                        # Utilities و helpers
│   ├── prisma.ts               # Prisma client singleton
│   ├── session.ts              # iron-session configuration
│   ├── validations/            # Zod schemas
│   └── utils.ts                # Helper functions
├── messages/                   # ملفات الترجمة
│   ├── ar.json                 # النصوص العربية
│   └── en.json                 # النصوص الإنجليزية
├── types/                      # TypeScript type definitions
└── hooks/                      # Custom React hooks
```

---

## 🎨 Frontend Skills & Conventions

### البراند:
- **اسم المنصة:** رزيم العقارية — Razeem Real Estate
- **الشعار:** ملف `LOGO.png` → يُنسخ إلى `public/logo.png`
- **الإنجليزي:** Razeem | **العربي:** رزيم

### الهوية البصرية — بسيطة ونظيفة:
- **اللون الأساسي (Primary):** `#123B3A` (تيل داكن — من نص "رزيم العقارية" والشكل الداخلي للأيقونة)
- **اللون المميز (Accent):** `#B77A5A` (نحاسي/برونزي — من نص "RAZEEM" والخط الخارجي للأيقونة)
- **اللون الداكن (Primary Dark):** `#1E2928` (أخضر داكن جداً — من نص "| REAL ESTATE")
- **الباقي كله محايد:** أبيض + درجات الرمادي + أسود
- **استخدم `text-accent` / `bg-accent`** للعناصر البارزة (CTAs, badges, highlights)
- **لا يوجد Dark Mode** — المنصة Light Mode فقط

### التصميم:
- **اللغات:** عربي (RTL) + إنجليزي (LTR) — يتغير تلقائياً
- **الخطوط:** خط عربي (IBM Plex Sans Arabic) + خط إنجليزي (Geist أو Inter) عبر `next/font/google`
- **⚠️ لا Dark Mode** — وضع فاتح فقط. لا تستخدم `prefers-color-scheme` ولا `data-theme` ولا `dark:` classes
- **Mobile-first:** التصميم يبدأ من شاشة الموبايل ويتوسع للأكبر
- **متوافق مع متصفح الهاتف:** أزرار بحجم مناسب للمس (min 44px)، خطوط مقروءة (min 16px)، مسافات مريحة
- **Loading States:** Skeleton screens لكل صفحة بيانات
- **Language Switcher:** زر تبديل اللغة في الهيدر دائماً

### توافق الموبايل (إلزامي):
- كل عنصر تفاعلي (زر، رابط، input) لا يقل عن **44×44px** كمنطقة لمس
- حجم الخط الأساسي **16px** على الأقل (يمنع zoom تلقائي على iOS)
- الصور تستخدم `max-width: 100%` دائماً
- الـ Header يتحول لـ hamburger menu على الموبايل
- النماذج (forms) تستخدم عرض كامل على الموبايل
- الخريطة تأخذ كامل العرض على الموبايل
- لا عناصر ثابتة تغطي المحتوى (لا fixed overlays كبيرة)
- اختبار على viewport: **375px** (iPhone SE) كحد أدنى
- استخدام `<meta name="viewport" content="width=device-width, initial-scale=1">`

### Tailwind CSS v4:
- يستخدم `@import "tailwindcss"` بدلاً من `@tailwind` directives
- التخصيص عبر `@theme inline { }` في `globals.css`
- لا يوجد ملف `tailwind.config.js` — التكوين داخل CSS مباشرة
- استخدم logical properties (`ms-`, `me-`, `ps-`, `pe-`, `start`, `end`) بدلاً من `ml-`, `mr-`, `pl-`, `pr-`, `left`, `right` لدعم RTL/LTR تلقائياً
- **ممنوع استخدام `dark:` classes** — لا يوجد dark mode

### المكونات:
- كل مكون في ملف منفصل بنفس اسمه
- استخدم Server Components بشكل افتراضي، و `"use client"` فقط عند الحاجة (تفاعل، state, effects)
- الأيقونات من `lucide-react` حصراً
- التحقق من النماذج عبر `Zod` (نفس الـ schema للـ client و server)
- كل نص مرئي للمستخدم يمر عبر `next-intl` — لا hardcoded strings

### الصفحات:
- استخدم `generateMetadata()` لكل صفحة ديناميكية (SEO)
- Pagination عبر cursor-based (لا offset)
- Error boundaries مع `error.tsx` و `not-found.tsx`
- Loading states مع `loading.tsx`

---

## ⚙️ Backend Skills & Conventions

### Prisma + MariaDB:
- Provider في `schema.prisma` هو `"mysql"` (MariaDB متوافقة)
- استخدم `@id @default(cuid())` لكل primary key
- كل جدول يحتوي `createdAt` و `updatedAt`
- Prisma Client singleton في `src/lib/prisma.ts`
- الـ Seed data في `prisma/seed.ts`

### API & Server Actions:
- استخدم Next.js Server Actions للعمليات البسيطة (forms)
- استخدم Route Handlers (`app/api/`) للعمليات المعقدة (upload, pagination)
- كل endpoint يتحقق من الـ session قبل أي عملية كتابة
- التحقق من المدخلات عبر Zod في كل endpoint بدون استثناء

### الجلسات والتوثيق:
- `iron-session` لإدارة الجلسات (مشفرة في cookies)
- OTP محاكاة (يتم عرض الرمز في console أو toast في بيئة التطوير)
- نفاذ محاكاة (زر تأكيد بدون تكامل فعلي حالياً)
- التحقق من `isNafathVerified` قبل السماح بإضافة إعلان أو طلب

### رفع الصور:
- الصور تُحفظ في `/uploads/properties/[propertyId]/`
- ضغط وتحويل تلقائي لـ WebP عبر `sharp`
- إنشاء thumbnail تلقائي
- حد أقصى 10 صور × 5MB لكل إعلان
- التحقق من نوع الملف قبل الحفظ (jpeg, png, webp فقط)

### الأمان:
- Rate limiting على OTP endpoints و API
- Input sanitization ضد XSS
- CSRF protection في النماذج
- Secure HttpOnly cookies للجلسات
- التحقق من نوع وحجم الملفات المرفوعة

---

## ⚠️ قواعد مهمة

1. **لا تنفذ أي شيء في المشروع بدون أمر صريح من المستخدم.**
2. **راجع `PROJECT_PLAN.md` قبل أي تنفيذ** — هو المرجع الأساسي.
3. **راجع `node_modules/next/dist/docs/`** قبل استخدام أي API من Next.js — الإصدار 16 فيه تغييرات جذرية.
4. **التزم بقواعد الـ Skills** المذكورة أعلاه — لا تبني واجهة بدون مراجعتها بالـ skills.
5. **كل ملف جديد يتبع الـ folder structure** المحددة أعلاه.
6. **Commit messages بالإنجليزية** مع وصف واضح.
7. **كل نص مرئي يمر عبر next-intl** — لا نصوص مباشرة في المكونات.
8. **استخدم Tailwind logical properties** (`ms-`, `me-`, `start`, `end`) لدعم RTL/LTR.
9. **لا Dark Mode** — ممنوع `dark:` classes و `prefers-color-scheme: dark`.
10. **Mobile-first** — كل واجهة تتبني من الموبايل أولاً وتتوسع.
