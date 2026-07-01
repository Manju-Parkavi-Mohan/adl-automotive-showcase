export type ProductCategory = "diagnostic" | "ecu-programming" | "ecu-tuning";

export interface Product {
  id: string;
  /** Numeric WooCommerce product ID, when item comes from live data. */
  wcId?: number;
  sku: string;
  name: string;
  brand: string;
  category: ProductCategory;
  categoryLabel: string;
  description: string;
  price: number;
  oldPrice?: number;
  currency: "USD";
  image: string;
  rating: number;
  reviewCount: number;
  tags: string[];
  compatibility?: string[];
  badge?: "new" | "sale" | "best";
  inStock: boolean;
}

export const CATEGORY_META: Record<ProductCategory, { label: string; slug: string; description: string }> = {
  diagnostic: {
    label: "Diagnostic Tools",
    slug: "diagnostic-tools",
    description: "Professional OBD scanners, key programmers and dealer-grade diagnostic platforms.",
  },
  "ecu-programming": {
    label: "ECU Programming Tools",
    slug: "ecu-programming",
    description: "Bench, OBD and boot mode chip-tuning hardware for cars, bikes and trucks.",
  },
  "ecu-tuning": {
    label: "ECU Calibration & Tuning",
    slug: "ecu-tuning-software",
    description: "Calibration modules and tuning software for trucks, agriculture and special vehicles.",
  },
};

const img = (seed: string) =>
  `https://images.unsplash.com/${seed}?auto=format&fit=crop&w=900&q=80`;

// Curated automotive equipment photos from Unsplash (royalty-free)
const IMAGES = [
  "photo-1486262715619-67b85e0b08d3",
  "photo-1487754180451-c456f719a1fc",
  "photo-1503376780353-7e6692767b70",
  "photo-1492144534655-ae79c964c9d7",
  "photo-1486006920555-c77dcf18193c",
  "photo-1580274455191-1c62238fa333",
  "photo-1553440569-bcc63803a83d",
  "photo-1517524008697-84bbe3c3fd98",
  "photo-1449965408869-eaa3f722e40d",
  "photo-1552519507-da3b142c6e3d",
  "photo-1511919884226-fd3cad34687c",
  "photo-1600661653561-629509216228",
  "photo-1502877338535-766e1452684a",
];
const pickImg = (i: number) => img(IMAGES[i % IMAGES.length]);

export const PRODUCTS: Product[] = [
  // ---- Diagnostic Tools (10) ----
  {
    id: "d1", sku: "ADL-DG-X431-V+",
    name: "Launch X431 V+ PRO 4.0 Bi-Directional Scanner",
    brand: "Launch", category: "diagnostic", categoryLabel: "Diagnostic Tools",
    description: "Full-system bi-directional scan tool with ECU coding, key programming and 35+ service functions.",
    price: 1299, oldPrice: 1499, currency: "USD", image: pickImg(0),
    rating: 4.8, reviewCount: 214, tags: ["obd2", "coding", "bi-directional"],
    compatibility: ["EU", "US", "Asian vehicles"], badge: "best", inStock: true,
  },
  {
    id: "d2", sku: "ADL-DG-AUTEL-MS909",
    name: "Autel MaxiSys MS909 Diagnostic Tablet",
    brand: "Autel", category: "diagnostic", categoryLabel: "Diagnostic Tools",
    description: "10.1\" Android tablet with topology mapping, J2534 ECU programming and intelligent diagnostics.",
    price: 2899, currency: "USD", image: pickImg(1),
    rating: 4.9, reviewCount: 156, tags: ["tablet", "j2534", "topology"],
    compatibility: ["All OBDII protocols"], badge: "new", inStock: true,
  },
  {
    id: "d3", sku: "ADL-DG-XENTRY-C6",
    name: "Mercedes Xentry Diagnostic Kit C6 Multiplexer",
    brand: "Star Diagnostic", category: "diagnostic", categoryLabel: "Diagnostic Tools",
    description: "DoIP / CAN dealer-level diagnostics for Mercedes-Benz cars, trucks and Sprinter vans.",
    price: 1799, currency: "USD", image: pickImg(2),
    rating: 4.7, reviewCount: 89, tags: ["mercedes", "doip", "dealer"],
    compatibility: ["Mercedes-Benz 1996+"], inStock: true,
  },
  {
    id: "d4", sku: "ADL-DG-ODIS-VAS6154",
    name: "VAS 6154A ODIS Interface for VW / Audi Group",
    brand: "VAG", category: "diagnostic", categoryLabel: "Diagnostic Tools",
    description: "Wireless DoIP interface with ODIS Service & Engineering support for the entire VAG range.",
    price: 649, oldPrice: 799, currency: "USD", image: pickImg(3),
    rating: 4.6, reviewCount: 132, tags: ["vag", "odis", "doip"], badge: "sale",
    compatibility: ["VW", "Audi", "Seat", "Skoda"], inStock: true,
  },
  {
    id: "d5", sku: "ADL-DG-THINKCAR-PD",
    name: "ThinkCar Platinum S20 Pro Diagnostic Scanner",
    brand: "ThinkCar", category: "diagnostic", categoryLabel: "Diagnostic Tools",
    description: "Wireless 8\" tablet with full-system scan, AutoVIN and 28 special functions.",
    price: 599, currency: "USD", image: pickImg(4),
    rating: 4.5, reviewCount: 311, tags: ["wireless", "tablet"], inStock: true,
  },
  {
    id: "d6", sku: "ADL-DG-XTOOL-X100",
    name: "Xtool X100 PAD3 Key Programmer & Diagnostic Tool",
    brand: "Xtool", category: "diagnostic", categoryLabel: "Diagnostic Tools",
    description: "Immobilizer key programming, mileage correction and full-system diagnostics in one tablet.",
    price: 1099, currency: "USD", image: pickImg(5),
    rating: 4.7, reviewCount: 98, tags: ["key", "immo", "mileage"],
    compatibility: ["EU", "Asian", "US vehicles"], inStock: true,
  },
  {
    id: "d7", sku: "ADL-DG-FOXWELL-NT",
    name: "Foxwell NT809 OBD2 All-System Scanner",
    brand: "Foxwell", category: "diagnostic", categoryLabel: "Diagnostic Tools",
    description: "Affordable workshop scanner with ABS bleeding, oil reset, EPB and battery registration.",
    price: 289, oldPrice: 349, currency: "USD", image: pickImg(6),
    rating: 4.4, reviewCount: 542, tags: ["obd2", "service"], badge: "sale", inStock: true,
  },
  {
    id: "d8", sku: "ADL-DG-PIWIS-III",
    name: "Porsche PIWIS III Tester with Panasonic CF-54",
    brand: "Porsche", category: "diagnostic", categoryLabel: "Diagnostic Tools",
    description: "Authorized dealer diagnostics & programming for all Porsche models including Taycan.",
    price: 4200, currency: "USD", image: pickImg(7),
    rating: 4.9, reviewCount: 41, tags: ["porsche", "dealer"], badge: "best", inStock: true,
  },
  {
    id: "d9", sku: "ADL-DG-CGDI-MB",
    name: "CGDI Prog MB Mercedes Key Programmer",
    brand: "CGDI", category: "diagnostic", categoryLabel: "Diagnostic Tools",
    description: "Fast all-key-lost programming for Mercedes W164–W222 with online password calculation.",
    price: 799, currency: "USD", image: pickImg(8),
    rating: 4.6, reviewCount: 187, tags: ["key", "mercedes"], inStock: true,
  },
  {
    id: "d10", sku: "ADL-DG-LONSDOR-K518",
    name: "Lonsdor K518ISE Universal Key Programmer",
    brand: "Lonsdor", category: "diagnostic", categoryLabel: "Diagnostic Tools",
    description: "Wide-coverage immobilizer & smart key programmer with Toyota, Lexus and BMW FEM/BDC.",
    price: 1450, currency: "USD", image: pickImg(9),
    rating: 4.8, reviewCount: 73, tags: ["key", "immo"], badge: "new", inStock: true,
  },

  // ---- ECU Programming Tools (10) ----
  {
    id: "e1", sku: "ADL-EP-FLEX-MAGIC",
    name: "Magic Motorsport Flex Master Bench / OBD Tool",
    brand: "Magic Motorsport", category: "ecu-programming", categoryLabel: "ECU Programming Tools",
    description: "Next-generation chip-tuning suite with OBD, bench, boot & BDM modes and free protocol updates.",
    price: 3990, currency: "USD", image: pickImg(2),
    rating: 4.9, reviewCount: 64, tags: ["flex", "bench", "obd"], badge: "best", inStock: true,
  },
  {
    id: "e2", sku: "ADL-EP-KESS3-MASTER",
    name: "Alientech KESS3 Master Slave OBD/Bench/Boot",
    brand: "Alientech", category: "ecu-programming", categoryLabel: "ECU Programming Tools",
    description: "All-in-one chip-tuning tool for cars, trucks, agriculture and marine with single subscription.",
    price: 4750, currency: "USD", image: pickImg(3),
    rating: 4.9, reviewCount: 122, tags: ["kess3", "bench"], inStock: true,
  },
  {
    id: "e3", sku: "ADL-EP-KTAG-V7",
    name: "K-TAG Master Boot Mode Programmer V7",
    brand: "Alientech", category: "ecu-programming", categoryLabel: "ECU Programming Tools",
    description: "Bench & boot-mode ECU programmer with 1900+ protocols, ideal for locked Bosch & Continental units.",
    price: 2299, oldPrice: 2599, currency: "USD", image: pickImg(4),
    rating: 4.7, reviewCount: 211, tags: ["boot", "tricore"], badge: "sale", inStock: true,
  },
  {
    id: "e4", sku: "ADL-EP-MPPS-V25",
    name: "MPPS V25 Master Tricore OBD Flasher",
    brand: "MPPS", category: "ecu-programming", categoryLabel: "ECU Programming Tools",
    description: "Affordable OBD flasher for EDC15/16/17, MED9, MED17 and SIMOS PCRs with checksum tool.",
    price: 349, currency: "USD", image: pickImg(5),
    rating: 4.4, reviewCount: 489, tags: ["mpps", "obd"], inStock: true,
  },
  {
    id: "e5", sku: "ADL-EP-BFLASH-DIMS3",
    name: "bFlash DimSport Genius / Flashtec Programmer",
    brand: "Dimsport", category: "ecu-programming", categoryLabel: "ECU Programming Tools",
    description: "Professional reading & writing of EDC17, MED17 and DCM3 ECUs via OBD and bench connections.",
    price: 3850, currency: "USD", image: pickImg(6),
    rating: 4.8, reviewCount: 58, tags: ["bflash", "dimsport"], inStock: true,
  },
  {
    id: "e6", sku: "ADL-EP-AUTOTUNER-M",
    name: "Autotuner Master Slave ECU Programming Kit",
    brand: "Autotuner", category: "ecu-programming", categoryLabel: "ECU Programming Tools",
    description: "Premium tool for Bosch MD1/MG1 GPT, EDC17, Continental SID and Delphi DCM units.",
    price: 4395, currency: "USD", image: pickImg(7),
    rating: 4.9, reviewCount: 87, tags: ["autotuner", "md1"], badge: "best", inStock: true,
  },
  {
    id: "e7", sku: "ADL-EP-PCMFLASH",
    name: "PCMflash Module Bundle (Modules 1–98)",
    brand: "PCMflash", category: "ecu-programming", categoryLabel: "ECU Programming Tools",
    description: "Software bundle for ScanMatik / OpenPort to read & write ECUs/TCUs through J2534.",
    price: 1499, currency: "USD", image: pickImg(8),
    rating: 4.6, reviewCount: 143, tags: ["j2534", "software"], inStock: true,
  },
  {
    id: "e8", sku: "ADL-EP-CMD-FLASH",
    name: "CMDflash Master Bench Programmer",
    brand: "FLASHTEC", category: "ecu-programming", categoryLabel: "ECU Programming Tools",
    description: "OBD, bench, BDM and JTAG flasher with auto-checksum & damos-ready memory mapping.",
    price: 2890, currency: "USD", image: pickImg(9),
    rating: 4.7, reviewCount: 92, tags: ["cmd", "jtag"], inStock: true,
  },
  {
    id: "e9", sku: "ADL-EP-NEW-GENIUS",
    name: "New Genius Touch OBD Tuning Tool",
    brand: "Dimsport", category: "ecu-programming", categoryLabel: "ECU Programming Tools",
    description: "Stand-alone touchscreen OBD programmer for cars, motorbikes, boats and snowmobiles.",
    price: 1850, oldPrice: 2150, currency: "USD", image: pickImg(0),
    rating: 4.5, reviewCount: 116, tags: ["obd", "touch"], badge: "sale", inStock: true,
  },
  {
    id: "e10", sku: "ADL-EP-FGTECH-V54",
    name: "FGTech Galletto V54 Euro Master Programmer",
    brand: "FGTech", category: "ecu-programming", categoryLabel: "ECU Programming Tools",
    description: "Multi-language chip tuning with BDM frame support and full vehicle coverage 1996-2018.",
    price: 459, currency: "USD", image: pickImg(1),
    rating: 4.3, reviewCount: 268, tags: ["bdm", "galletto"], inStock: true,
  },

  // ---- ECU Calibration & Tuning Software for Trucks (10) ----
  {
    id: "t1", sku: "ADL-TS-ECULITE-VOLVO",
    name: "ECULite Volvo FH/FM EDC17 Tuning Module",
    brand: "ECULite", category: "ecu-tuning", categoryLabel: "Tuning Software",
    description: "DPF/EGR/AdBlue off solutions and stage 1 maps for Volvo FH4 & FH5 with calibration manager.",
    price: 980, currency: "USD", image: pickImg(2),
    rating: 4.8, reviewCount: 41, tags: ["volvo", "adblue", "dpf"],
    compatibility: ["Volvo FH/FM EURO 5/6"], badge: "best", inStock: true,
  },
  {
    id: "t2", sku: "ADL-TS-SCANIA-XPI",
    name: "Scania XPI Performance Tuning Suite",
    brand: "ECULite", category: "ecu-tuning", categoryLabel: "Tuning Software",
    description: "Power & torque calibrations for Scania R/S series XPI engines with emissions handling.",
    price: 1290, currency: "USD", image: pickImg(3),
    rating: 4.7, reviewCount: 27, tags: ["scania", "xpi"], inStock: true,
  },
  {
    id: "t3", sku: "ADL-TS-DAF-MX13",
    name: "DAF MX-11 / MX-13 EDC17CV56 Calibration Pack",
    brand: "TruckTune", category: "ecu-tuning", categoryLabel: "Tuning Software",
    description: "Stage 1, AdBlue and DPF software modules for DAF XF Euro 6 trucks.",
    price: 850, oldPrice: 1050, currency: "USD", image: pickImg(4),
    rating: 4.6, reviewCount: 33, tags: ["daf", "euro6"], badge: "sale", inStock: true,
  },
  {
    id: "t4", sku: "ADL-TS-MAN-D26",
    name: "MAN TGX D26 Common Rail Tuning Module",
    brand: "TruckTune", category: "ecu-tuning", categoryLabel: "Tuning Software",
    description: "Calibration software for MAN D26/D38 with up to +18% torque on Euro 5/6 platforms.",
    price: 920, currency: "USD", image: pickImg(5),
    rating: 4.5, reviewCount: 18, tags: ["man", "tgx"], inStock: true,
  },
  {
    id: "t5", sku: "ADL-TS-MERCEDES-OM471",
    name: "Mercedes Actros OM471 / OM473 Tuning File",
    brand: "ECULite", category: "ecu-tuning", categoryLabel: "Tuning Software",
    description: "Optimised driveability maps for Actros MP4/MP5 with adaptive AdBlue strategy.",
    price: 1150, currency: "USD", image: pickImg(6),
    rating: 4.8, reviewCount: 52, tags: ["actros", "om471"], badge: "new", inStock: true,
  },
  {
    id: "t6", sku: "ADL-TS-IVECO-CURSOR",
    name: "Iveco Cursor 11/13 Stralis Tuning Suite",
    brand: "TruckTune", category: "ecu-tuning", categoryLabel: "Tuning Software",
    description: "Eco & performance calibrations for Iveco Stralis with FPT engines.",
    price: 890, currency: "USD", image: pickImg(7),
    rating: 4.4, reviewCount: 22, tags: ["iveco", "stralis"], inStock: true,
  },
  {
    id: "t7", sku: "ADL-TS-JD-8RX",
    name: "John Deere 8RX Series Agricultural ECU Tuning",
    brand: "AgriTune", category: "ecu-tuning", categoryLabel: "Tuning Software",
    description: "Stage 1 tuning for John Deere 8RX tractors — improved torque & response without DPF impact.",
    price: 1390, currency: "USD", image: pickImg(8),
    rating: 4.9, reviewCount: 14, tags: ["agriculture", "john-deere"], badge: "best", inStock: true,
  },
  {
    id: "t8", sku: "ADL-TS-CASE-MAGNUM",
    name: "Case IH Magnum / Puma FPT Tractor Tuning",
    brand: "AgriTune", category: "ecu-tuning", categoryLabel: "Tuning Software",
    description: "Custom calibrations for Case IH Magnum, Puma & Quadtrac with field-proven safety margins.",
    price: 1290, currency: "USD", image: pickImg(9),
    rating: 4.7, reviewCount: 11, tags: ["agriculture", "case"], inStock: true,
  },
  {
    id: "t9", sku: "ADL-TS-CAT-C15",
    name: "Caterpillar C13 / C15 Industrial Engine Map",
    brand: "HeavyMap", category: "ecu-tuning", categoryLabel: "Tuning Software",
    description: "Off-highway calibration for CAT C13 & C15 — mining, marine and generator applications.",
    price: 1690, currency: "USD", image: pickImg(0),
    rating: 4.6, reviewCount: 9, tags: ["cat", "industrial"], inStock: true,
  },
  {
    id: "t10", sku: "ADL-TS-CUMMINS-X15",
    name: "Cummins X15 / ISX Heavy Truck Tuning Module",
    brand: "HeavyMap", category: "ecu-tuning", categoryLabel: "Tuning Software",
    description: "Power and economy maps for Cummins X15 with parameter-adjustable load tables.",
    price: 1490, oldPrice: 1690, currency: "USD", image: pickImg(1),
    rating: 4.8, reviewCount: 17, tags: ["cummins", "x15"], badge: "sale", inStock: true,
  },
];

export const BRANDS = [
  "Bosch", "Autel", "Launch", "Alientech", "Magic Motorsport", "Dimsport",
  "Xtool", "Foxwell", "ThinkCar", "FGTech", "MPPS", "Cummins", "Volvo", "Scania",
  "Mercedes-Benz", "DAF", "MAN", "Iveco",
];

export function getProductsByCategory(cat: ProductCategory): Product[] {
  return PRODUCTS.filter((p) => p.category === cat);
}

export function getFeatured(limit = 8): Product[] {
  return [...PRODUCTS].sort((a, b) => b.rating - a.rating).slice(0, limit);
}

export function getNewArrivals(limit = 8): Product[] {
  return PRODUCTS.filter((p) => p.badge === "new").concat(PRODUCTS).slice(0, limit);
}

export function getBestSellers(limit = 8): Product[] {
  return [...PRODUCTS].sort((a, b) => b.reviewCount - a.reviewCount).slice(0, limit);
}

export function getOnSale(limit = 8): Product[] {
  return PRODUCTS.filter((p) => p.oldPrice).slice(0, limit);
}