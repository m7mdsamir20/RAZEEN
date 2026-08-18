import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { hashPassword } from "../src/lib/password";

/**
 * Shared password for every seeded account, so the demo data is usable after
 * the switch to password sign-in. Development only.
 */
const SEED_PASSWORD = "Razeem@2026";

// Create Prisma client with SQLite adapter for seeding
const adapter = new PrismaBetterSqlite3({
  url: "file:./prisma/dev.db",
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // ============================================
  // 1. Users (المستخدمين)
  // ============================================
  const passwordHash = await hashPassword(SEED_PASSWORD);
  const admin = await prisma.user.upsert({
    where: { phone: "0500000001" },
    update: { passwordHash },
    create: {
      name: "رزيم العقارية",
      phone: "0500000001",
      passwordHash,
      isNafathVerified: true,
      role: "COMPANY_ADMIN",
    },
  });

  const user1 = await prisma.user.upsert({
    where: { phone: "0551234567" },
    update: { passwordHash },
    create: {
      name: "عبدالله محمد",
      phone: "0551234567",
      passwordHash,
      isNafathVerified: true,
      role: "USER",
    },
  });

  const user2 = await prisma.user.upsert({
    where: { phone: "0559876543" },
    update: { passwordHash },
    create: {
      name: "سارة أحمد",
      phone: "0559876543",
      passwordHash,
      isNafathVerified: true,
      role: "USER",
    },
  });

  const user3 = await prisma.user.upsert({
    where: { phone: "0543216789" },
    update: { passwordHash },
    create: {
      name: "خالد العتيبي",
      phone: "0543216789",
      passwordHash,
      isNafathVerified: false,
      role: "USER",
    },
  });

  console.log("✅ Users created:", {
    admin: admin.id,
    user1: user1.id,
    user2: user2.id,
    user3: user3.id,
  });

  // ============================================
  // 2. Properties (العقارات)
  // ============================================

  // --- عقارات الشركة (COMPANY) ---
  const prop1 = await prisma.property.create({
    data: {
      title: "شقة فاخرة في حي النرجس",
      description:
        "شقة مميزة بتصميم عصري في حي النرجس بالرياض. تتكون من 3 غرف نوم وصالة واسعة ومطبخ مجهز بالكامل. الشقة في الدور الثاني مع مصعد ومواقف خاصة. قريبة من المدارس والمساجد والخدمات.",
      category: "RESIDENTIAL_APARTMENT",
      type: "RENT",
      price: 35000,
      area: 160,
      bedrooms: 3,
      livingRooms: 2,
      halls: 1,
      bathrooms: 2,
      city: "الرياض",
      district: "النرجس",
      latitude: 24.8204,
      longitude: 46.6275,
      status: "APPROVED",
      publisherType: "COMPANY",
      userId: admin.id,
      views: 142,
    },
  });

  const prop2 = await prisma.property.create({
    data: {
      title: "فيلا دوبلكس في حي الملقا",
      description:
        "فيلا دوبلكس فخمة بمساحة واسعة في حي الملقا. تتكون من 5 غرف نوم و 4 دورات مياه، مع مسبح خاص وحديقة. التشطيب سوبر ديلوكس مع نظام تكييف مركزي ونظام أمني متكامل. الموقع استراتيجي قريب من طريق الملك فهد.",
      category: "VILLA",
      type: "SALE",
      price: 3500000,
      area: 450,
      bedrooms: 5,
      livingRooms: 2,
      halls: 1,
      bathrooms: 4,
      city: "الرياض",
      district: "الملقا",
      latitude: 24.7836,
      longitude: 46.6409,
      status: "APPROVED",
      publisherType: "COMPANY",
      userId: admin.id,
      views: 287,
    },
  });

  const prop3 = await prisma.property.create({
    data: {
      title: "مكتب تجاري في طريق الملك فهد",
      description:
        "مكتب تجاري مؤثث بالكامل في برج حديث على طريق الملك فهد. يتكون من قاعة اجتماعات و 3 غرف مكتبية ومنطقة استقبال. المبنى يضم مواقف تحت الأرض وخدمة أمن 24 ساعة.",
      category: "OFFICE",
      type: "RENT",
      price: 85000,
      area: 120,
      bedrooms: 0,
      bathrooms: 2,
      city: "الرياض",
      district: "العليا",
      latitude: 24.6908,
      longitude: 46.6854,
      status: "APPROVED",
      publisherType: "COMPANY",
      userId: admin.id,
      views: 95,
    },
  });

  const prop4 = await prisma.property.create({
    data: {
      title: "أرض سكنية في حي العارض",
      description:
        "أرض سكنية بموقع مميز في حي العارض شمال الرياض. المساحة 625 متر مربع، مناسبة لبناء فيلا أو عمارة سكنية. الأرض على شارعين وقريبة من الخدمات والمرافق العامة.",
      category: "RESIDENTIAL_LAND",
      type: "SALE",
      price: 950000,
      area: 625,
      bedrooms: 0,
      bathrooms: 0,
      city: "الرياض",
      district: "العارض",
      latitude: 24.8571,
      longitude: 46.6302,
      status: "APPROVED",
      publisherType: "COMPANY",
      userId: admin.id,
      views: 63,
    },
  });

  // --- عقارات المستخدمين (VERIFIED_USER) ---
  const prop5 = await prisma.property.create({
    data: {
      title: "شقة مفروشة في حي الحمراء",
      description:
        "شقة مفروشة بالكامل للإيجار في حي الحمراء بجدة. غرفتين نوم وصالة ومطبخ أمريكي. أثاث جديد ومكيفات سبليت. قريبة من الكورنيش والأسواق. مناسبة للعائلات الصغيرة.",
      category: "RESIDENTIAL_APARTMENT",
      type: "RENT",
      price: 28000,
      area: 110,
      bedrooms: 2,
      livingRooms: 1,
      halls: 0,
      bathrooms: 1,
      city: "جدة",
      district: "الحمراء",
      latitude: 21.5565,
      longitude: 39.1745,
      status: "APPROVED",
      publisherType: "VERIFIED_USER",
      userId: user1.id,
      views: 78,
    },
  });

  const prop6 = await prisma.property.create({
    data: {
      title: "غرفة عزاب في حي السلامة",
      description:
        "غرفة واسعة للإيجار الشهري في حي السلامة بجدة. تشمل حمام خاص ومطبخ صغير. الغرفة مفروشة مع تكييف ومدخل مستقل. مناسبة لشخص واحد أو اثنين.",
      category: "ROOM",
      type: "RENT",
      price: 1500,
      area: 30,
      bedrooms: 0,
      livingRooms: 0,
      halls: 0,
      bathrooms: 1,
      city: "جدة",
      district: "السلامة",
      latitude: 21.5729,
      longitude: 39.1525,
      status: "APPROVED",
      publisherType: "VERIFIED_USER",
      userId: user2.id,
      views: 210,
    },
  });

  const prop7 = await prisma.property.create({
    data: {
      title: "فيلا فاخرة في حي المحمدية",
      description:
        "فيلا فاخرة للبيع في حي المحمدية بالدمام. 6 غرف نوم مع جناح ماستر. مسبح خارجي وملحق خارجي. المساحة الإجمالية 550 متر مربع. التشطيب فاخر مع أرضيات رخام ونوافذ مزدوجة.",
      category: "VILLA",
      type: "SALE",
      price: 4200000,
      area: 550,
      bedrooms: 6,
      livingRooms: 2,
      halls: 1,
      bathrooms: 5,
      city: "الدمام",
      district: "المحمدية",
      latitude: 26.4237,
      longitude: 50.106,
      status: "APPROVED",
      publisherType: "VERIFIED_USER",
      userId: user1.id,
      views: 156,
    },
  });

  // --- عقار في انتظار الموافقة ---
  const prop8 = await prisma.property.create({
    data: {
      title: "شقة جديدة في حي الصفا",
      description:
        "شقة جديدة لم تُسكن في حي الصفا بجدة. 4 غرف نوم وصالتين ومطبخ كبير. الدور الثالث مع مصعد. موقف سيارة خاص. التشطيب عالي الجودة.",
      category: "RESIDENTIAL_APARTMENT",
      type: "SALE",
      price: 850000,
      area: 200,
      bedrooms: 4,
      livingRooms: 2,
      halls: 1,
      bathrooms: 3,
      city: "جدة",
      district: "الصفا",
      latitude: 21.5427,
      longitude: 39.2135,
      status: "PENDING",
      publisherType: "VERIFIED_USER",
      userId: user2.id,
      views: 0,
    },
  });

  // --- عقار مرفوض ---
  const prop9 = await prisma.property.create({
    data: {
      title: "شقة للإيجار في حي الروضة",
      description:
        "شقة صغيرة للإيجار السنوي في حي الروضة بالرياض. غرفتين نوم وصالة صغيرة. الشقة تحتاج بعض الصيانة.",
      category: "RESIDENTIAL_APARTMENT",
      type: "RENT",
      price: 18000,
      area: 85,
      bedrooms: 2,
      livingRooms: 1,
      halls: 0,
      bathrooms: 1,
      city: "الرياض",
      district: "الروضة",
      latitude: 24.7241,
      longitude: 46.7176,
      status: "REJECTED",
      rejectionReason: "الصور غير واضحة، يرجى إعادة رفع صور أوضح للعقار",
      publisherType: "VERIFIED_USER",
      userId: user3.id,
      views: 0,
    },
  });

  console.log("✅ Properties created:", 9);

  // ============================================
  // 3. Property Images (صور العقارات)
  // ============================================
  const allProperties = [
    prop1, prop2, prop3, prop4, prop5, prop6, prop7, prop8, prop9,
  ];

  // Seeded properties have no real uploads yet — point at the shipped
  // placeholder so cards render without failed image requests.
  const PLACEHOLDER = "/placeholder-property.svg";

  for (const prop of allProperties) {
    if (prop.status !== "REJECTED") {
      const imageCount = prop.status === "PENDING" ? 2 : 3;
      for (let i = 1; i <= imageCount; i++) {
        await prisma.propertyImage.create({
          data: {
            propertyId: prop.id,
            url: PLACEHOLDER,
            thumbnailUrl: PLACEHOLDER,
            order: i,
          },
        });
      }
    }
  }

  console.log("✅ Property images created");

  // ============================================
  // 4. Property Requests (طلبات العقارات)
  // ============================================
  await prisma.propertyRequest.create({
    data: {
      title: "أبحث عن شقة في شمال الرياض",
      category: "RESIDENTIAL_APARTMENT",
      city: "الرياض",
      district: "النرجس",
      budget: 40000,
      status: "APPROVED",
      publisherType: "VERIFIED_USER",
      userId: user1.id,
    },
  });

  await prisma.propertyRequest.create({
    data: {
      title: "مطلوب فيلا في شرق جدة",
      category: "VILLA",
      city: "جدة",
      district: "الصفا",
      budget: 2500000,
      status: "PENDING",
      publisherType: "VERIFIED_USER",
      userId: user2.id,
    },
  });

  await prisma.propertyRequest.create({
    data: {
      title: "أبحث عن أرض تجارية في الدمام",
      category: "RESIDENTIAL_LAND",
      city: "الدمام",
      district: "الفيصلية",
      budget: 1500000,
      status: "APPROVED",
      publisherType: "COMPANY",
      userId: admin.id,
    },
  });

  console.log("✅ Property requests created:", 3);

  // ============================================
  // 5. Management Requests (طلبات إدارة الأملاك)
  // ============================================
  await prisma.managementRequest.create({
    data: {
      ownerName: "محمد العمري",
      phone: "0567891234",
      propertyType: "عمارة سكنية",
      city: "الرياض",
      district: "النسيم",
      notes: "عمارة من 6 شقق، أبحث عن شركة إدارة محترفة للتأجير والصيانة",
      status: "NEW",
      userId: user1.id,
    },
  });

  await prisma.managementRequest.create({
    data: {
      ownerName: "فاطمة الدوسري",
      phone: "0534567890",
      propertyType: "فيلا سكنية",
      city: "جدة",
      district: "الحمراء",
      notes: "فيلا في حي الحمراء، أريد تأجيرها وإدارتها بالكامل",
      status: "CONTACTED",
      userId: user2.id,
    },
  });

  await prisma.managementRequest.create({
    data: {
      ownerName: "سعد الحربي",
      phone: "0512345678",
      propertyType: "محلات تجارية",
      city: "الدمام",
      district: "الراكة",
      status: "CLOSED",
      userId: user1.id,
    },
  });

  console.log("✅ Management requests created:", 3);

  // ============================================
  // 6. Favorites (المفضلات)
  // ============================================
  await prisma.favorite.create({
    data: { userId: user1.id, propertyId: prop2.id },
  });

  await prisma.favorite.create({
    data: { userId: user1.id, propertyId: prop6.id },
  });

  await prisma.favorite.create({
    data: { userId: user2.id, propertyId: prop1.id },
  });

  await prisma.favorite.create({
    data: { userId: user2.id, propertyId: prop7.id },
  });

  await prisma.favorite.create({
    data: { userId: user3.id, propertyId: prop5.id },
  });

  console.log("✅ Favorites created:", 5);

  console.log("\n🎉 Seed completed successfully!");
  console.log("📊 Summary:");
  console.log("   - 4 Users (1 admin + 3 users)");
  console.log("   - 9 Properties (7 approved, 1 pending, 1 rejected)");
  console.log("   - 23 Property Images");
  console.log("   - 3 Property Requests");
  console.log("   - 3 Management Requests");
  console.log("   - 5 Favorites");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
