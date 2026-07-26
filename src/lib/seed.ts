import { eq } from "drizzle-orm";
import { db } from "./db";
import { categories } from "@/db/schema";
import { hashPassword } from "./auth";

// ============ Seed Categories ============
const DEFAULT_CATEGORIES = [
  {
    name: "Véhicules",
    nameAr: "سيارات",
    slug: "vehicules",
    icon: "Car",
    children: [
      { name: "Voitures", nameAr: "سيارات سياحية", slug: "voitures", icon: "Car" },
      { name: "Motos", nameAr: "دراجات نارية", slug: "motos", icon: "Bike" },
      { name: "Utilitaires", nameAr: "مركبات نفعية", slug: "utilitaires", icon: "Truck" },
      { name: "Pièces détachées", nameAr: "قطع غيار", slug: "pieces-detachees", icon: "Wrench" },
    ],
  },
  {
    name: "Immobilier",
    nameAr: "عقارات",
    slug: "immobilier",
    icon: "Home",
    children: [
      { name: "Vente", nameAr: "بيع", slug: "vente-immobilier", icon: "Home" },
      { name: "Location", nameAr: "كراء", slug: "location-immobilier", icon: "Building" },
      { name: "Terrain", nameAr: "أراضي", slug: "terrain", icon: "TreePine" },
    ],
  },
  {
    name: "Électronique",
    nameAr: "إلكترونيات",
    slug: "electronique",
    icon: "Smartphone",
    children: [
      { name: "Téléphones", nameAr: "هواتف", slug: "telephones", icon: "Smartphone" },
      { name: "Ordinateurs", nameAr: "حواسيب", slug: "ordinateurs", icon: "Laptop" },
      { name: "TV & Audio", nameAr: "تلفزيون وصوت", slug: "tv-audio", icon: "Tv" },
      { name: "Appareils photo", nameAr: "كاميرات", slug: "appareils-photo", icon: "Camera" },
    ],
  },
  {
    name: "Maison & Jardin",
    nameAr: "منزل وحديقة",
    slug: "maison-jardin",
    icon: "Sofa",
    children: [
      { name: "Meubles", nameAr: "أثاث", slug: "meubles", icon: "Armchair" },
      { name: "Électroménager", nameAr: "أجهزة منزلية", slug: "electromenager", icon: "Refrigerator" },
      { name: "Jardinage", nameAr: "بستنة", slug: "jardinage", icon: "Flower2" },
    ],
  },
  {
    name: "Emploi & Services",
    nameAr: "وظائف وخدمات",
    slug: "emploi-services",
    icon: "Briefcase",
    children: [
      { name: "Offres d'emploi", nameAr: "عروض عمل", slug: "offres-emploi", icon: "FileText" },
      { name: "Services", nameAr: "خدمات", slug: "services", icon: "Settings2" },
      { name: "Formation", nameAr: "تكوين", slug: "formation", icon: "GraduationCap" },
    ],
  },
  {
    name: "Mode & Beauté",
    nameAr: "موضة وجمال",
    slug: "mode-beaute",
    icon: "Shirt",
    children: [
      { name: "Vêtements", nameAr: "ملابس", slug: "vetements", icon: "Shirt" },
      { name: "Chaussures", nameAr: "أحذية", slug: "chaussures", icon: "Footprints" },
      { name: "Accessoires", nameAr: "إكسسوارات", slug: "accessoires", icon: "Watch" },
    ],
  },
  {
    name: "Loisirs",
    nameAr: "تسلية",
    slug: "loisirs",
    icon: "Gamepad2",
    children: [
      { name: "Sport", nameAr: "رياضة", slug: "sport", icon: "Trophy" },
      { name: "Livres", nameAr: "كتب", slug: "livres", icon: "BookOpen" },
      { name: "Musique", nameAr: "موسيقى", slug: "musique", icon: "Music" },
      { name: "Jeux vidéo", nameAr: "ألعاب فيديو", slug: "jeux-video", icon: "Gamepad2" },
    ],
  },
  {
    name: "Animaux",
    nameAr: "حيوانات",
    slug: "animaux",
    icon: "Dog",
    children: [
      { name: "Chiens", nameAr: "كلاب", slug: "chiens", icon: "Dog" },
      { name: "Chats", nameAr: "قطط", slug: "chats", icon: "Cat" },
      { name: "Oiseaux", nameAr: "طيور", slug: "oiseaux", icon: "Bird" },
    ],
  },
];

export async function seedCategories() {
  const existing = await db.select().from(categories).limit(1);
  if (existing.length > 0) {
    console.log("[seed] Categories already seeded, skipping.");
    return;
  }

  console.log("[seed] Seeding categories...");
  for (const parent of DEFAULT_CATEGORIES) {
    const [p] = await db
      .insert(categories)
      .values({
        name: parent.name,
        nameAr: parent.nameAr,
        slug: parent.slug,
        icon: parent.icon,
      })
      .returning();

    for (const child of parent.children) {
      await db.insert(categories).values({
        name: child.name,
        nameAr: child.nameAr,
        slug: child.slug,
        icon: child.icon,
        parentId: p.id,
      });
    }
  }
  console.log("[seed] Categories seeded successfully.");
}

export async function seedAdmin() {
  const { users } = await import("@/db/schema");
  const existing = await db.select().from(users).where(eq(users.email, "admin@wad-kanis.dz")).limit(1);
  if (existing.length > 0) {
    console.log("[seed] Admin already exists, skipping.");
    return;
  }

  console.log("[seed] Creating admin user...");
  await db.insert(users).values({
    email: "admin@wad-kanis.dz",
    passwordHash: await hashPassword(
      process.env.ADMIN_PASSWORD || "Admin123!",
    ),
    fullName: "مدير النظام",
    phone: "0550000000",
    role: "admin",
    isVerified: true,
  });
  console.log("[seed] Admin created.");
}

export async function runAllSeeds() {
  try {
    await seedCategories();
    await seedAdmin();
  } catch (err) {
    console.error("[seed] Error seeding:", err);
  }
}
