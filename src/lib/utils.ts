import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number | string, currency = "DZD"): string {
  const num = typeof price === "string" ? parseFloat(price) : price;
  if (isNaN(num)) return "—";
  return new Intl.NumberFormat("ar-DZ", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(num);
}

export function timeAgo(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffDay > 30) return then.toLocaleDateString("ar-DZ");
  if (diffDay > 0) return `منذ ${diffDay} يوم`;
  if (diffHour > 0) return `منذ ${diffHour} ساعة`;
  if (diffMin > 0) return `منذ ${diffMin} دقيقة`;
  return "الآن";
}

export const ALGERIA_WILAYAS = [
  { code: "01", name: "أدرار", nameFr: "Adrar" },
  { code: "16", name: "الجزائر", nameFr: "Alger" },
  { code: "42", name: "تيبازة", nameFr: "Tipaza" },
  { code: "09", name: "البليدة", nameFr: "Blida" },
  { code: "35", name: "بومرداس", nameFr: "Boumerdès" },
  { code: "15", name: "تيزي وزو", nameFr: "Tizi Ouzou" },
  { code: "31", name: "وهران", nameFr: "Oran" },
  { code: "25", name: "قسنطينة", nameFr: "Constantine" },
  { code: "05", name: "باتنة", nameFr: "Batna" },
  { code: "19", name: "سطيف", nameFr: "Sétif" },
  { code: "13", name: "تلمسان", nameFr: "Tlemcen" },
  { code: "26", name: "المدية", nameFr: "Médéa" },
  { code: "44", name: "عين الدفلى", nameFr: "Aïn Defla" },
  { code: "48", name: "غليزان", nameFr: "Relizane" },
  { code: "27", name: "مستغانم", nameFr: "Mostaganem" },
  { code: "38", name: "تسمسيلت", nameFr: "Tissemsilt" },
  { code: "14", name: "تيارت", nameFr: "Tiaret" },
  { code: "22", name: "الجلفة", nameFr: "Djelfa" },
  { code: "17", name: "الأغواط", nameFr: "Laghouat" },
  { code: "30", name: "ورقلة", nameFr: "Ouargla" },
  { code: "37", name: "تندوف", nameFr: "Tindouf" },
  { code: "08", name: "بشار", nameFr: "Béchar" },
  { code: "47", name: "غرداية", nameFr: "Ghardaïa" },
  { code: "33", name: "إليزي", nameFr: "Illizi" },
  { code: "39", name: "الوادي", nameFr: "El Oued" },
  { code: "12", name: "تبسة", nameFr: "Tébessa" },
  { code: "40", name: "خنشلة", nameFr: "Khenchela" },
  { code: "07", name: "بسكرة", nameFr: "Biskra" },
  { code: "34", name: "برج بوعريريج", nameFr: "Bordj Bou Arreridj" },
  { code: "10", name: "البويرة", nameFr: "Bouira" },
  { code: "23", name: "جيجل", nameFr: "Jijel" },
  { code: "18", name: "سكيكدة", nameFr: "Skikda" },
  { code: "41", name: "سوق أهراس", nameFr: "Souk Ahras" },
  { code: "43", name: "ميلة", nameFr: "Mila" },
  { code: "24", name: "قالمة", nameFr: "Guelma" },
  { code: "36", name: "الطارف", nameFr: "El Tarf" },
  { code: "46", name: "عين تموشنت", nameFr: "Aïn Témouchent" },
  { code: "21", name: "سعيدة", nameFr: "Saïda" },
  { code: "20", name: "سيدي بلعباس", nameFr: "Sidi Bel Abbès" },
  { code: "29", name: "معسكر", nameFr: "Mascara" },
  { code: "45", name: "النعامة", nameFr: "Naâma" },
  { code: "02", name: "الشلف", nameFr: "Chlef" },
  { code: "03", name: "الأغواط", nameFr: "Laghouat" },
  { code: "04", name: "أم البواقي", nameFr: "Oum El Bouaghi" },
  { code: "06", name: "بجاية", nameFr: "Béjaïa" },
  { code: "11", name: "تمنراست", nameFr: "Tamanrasset" },
  { code: "28", name: "المسيلة", nameFr: "M'Sila" },
  { code: "32", name: "البيض", nameFr: "El Bayadh" },
];

export const COMMUNES_TIPAZA = [
  "حطاطبة",
  "تيبازة",
  "شرشال",
  "القليعة",
  "بوسماعيل",
  "دواودة",
  "فوكة",
  "بو إسماعيل",
  "خميستي",
  "أغبال",
  "سيدي غيلاس",
  "الناظور",
  "مراد",
  "حجرة النص",
  "سيدي عامر",
  "مسلمون",
  "سيدي سميان",
  "بني ميلك",
  "الداموس",
  "لارهاط",
  "الأرهاط",
  "تاقديمت",
  "مناصر",
  "بورقيقة",
  "أحمر العين",
];
