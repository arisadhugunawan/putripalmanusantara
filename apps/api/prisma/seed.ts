// Seeds structural placeholder content so every CMS module and public page has something to
// render during development. Numeric/copy values are illustrative placeholders — the client
// replaces them via the Admin CMS (Phase 5) before launch. No Media records are seeded: real
// photos/videos must come from PPN, per docs/01-prd.md §13 (no generic stock imagery).
// Partner Logos (Post-Launch) are deliberately left empty for the same reason — displaying
// a government/institution logo implies a real confirmed relationship, which no one has
// confirmed; the admin adds real ones once PPN confirms them.
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function seedAdmin() {
  const email = process.env.ADMIN_SEED_EMAIL ?? "admin@ppn-example.com";
  const password = process.env.ADMIN_SEED_PASSWORD ?? "change-me-strong-password";
  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.admin.upsert({
    where: { email },
    update: {},
    create: {
      name: process.env.ADMIN_SEED_NAME ?? "Admin PPN",
      email,
      passwordHash,
      role: "super_admin",
    },
  });
}

async function seedSiteSettings() {
  const settings: Array<{ key: string; value: string; group: string }> = [
    { key: "company_name", value: "CV Putri Palma Nusantara", group: "general" },
    { key: "whatsapp_number", value: "+6281234567890", group: "contact" },
    { key: "contact_email", value: "info@ppn-example.com", group: "contact" },
    { key: "contact_phone", value: "+622112345678", group: "contact" },
    {
      key: "address",
      value: "Jl. Industri Kelapa No. 1, Kabupaten Cilacap, Jawa Tengah, Indonesia",
      group: "contact",
    },
    { key: "operating_hours", value: "Monday–Saturday, 08:00–17:00 (GMT+7)", group: "contact" },
    {
      key: "default_meta_title",
      value: "CV Putri Palma Nusantara — Indonesian Coconut Product Exporter",
      group: "seo",
    },
    {
      key: "default_meta_description",
      value:
        "CV Putri Palma Nusantara exports Semi Husked Coconut, Copra, Coconut Shell Charcoal, and Coconut Timber to buyers across Asia, the Middle East, and Europe.",
      group: "seo",
    },
  ];

  for (const setting of settings) {
    await prisma.siteSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }
}

async function seedHomepageStatistics() {
  const count = await prisma.homepageStatistic.count();
  if (count > 0) return;

  await prisma.homepageStatistic.createMany({
    data: [
      { label: "Products Exported", value: "4+", order: 1 },
      { label: "Production Capacity", value: "500 Tons / Month", order: 2 },
      { label: "Warehouses", value: "3", order: 3 },
      { label: "Years of Experience", value: "10+", order: 4 },
      { label: "Containers Shipped", value: "1,200+", order: 5 },
    ],
  });
}

async function seedFaqs() {
  const count = await prisma.faq.count();
  if (count > 0) return;

  await prisma.faq.createMany({
    data: [
      {
        question: "What products does CV Putri Palma Nusantara export?",
        answer:
          "We export Semi Husked Coconut, Copra, Coconut Shell Charcoal, and Coconut Timber to buyers worldwide.",
        order: 1,
        status: "published",
      },
      {
        question: "Which countries do you currently ship to?",
        answer:
          "Our main export destinations include Thailand, Malaysia, China, India, the Middle East, and Europe.",
        order: 2,
        status: "published",
      },
      {
        question: "What is your minimum order quantity (MOQ)?",
        answer:
          "MOQ varies by product and packaging. Please submit a Request Quotation with your target volume and our team will respond with the details.",
        order: 3,
        status: "published",
      },
      {
        question: "Can I request a product sample before placing an order?",
        answer:
          "Yes, sample requests can be arranged. Please contact us via the Request Quotation form or WhatsApp to discuss sample terms.",
        order: 4,
        status: "published",
      },
      {
        question: "How long does production and shipment typically take?",
        answer:
          "Lead time depends on product and order volume. Our team will provide an estimated production and shipping timeline after reviewing your quotation request.",
        order: 5,
        status: "published",
      },
    ],
  });
}

// Fixed default 10-node ecosystem for "Home → Our Supply Network" (see README "Supply Network
// redesign"). `title` doubles as the natural matching key below since the model has no slug —
// safe here because the section is a homepage singleton list, not a hub other records reference
// by name. Admin can freely add/edit/delete/reorder nodes after this seed runs once.
const SUPPLY_NETWORK_NODES = [
  {
    title: "Farmers",
    shortTitle: "Local Farmer Network",
    description: "PPN works with local farmers and coconut suppliers to support consistent raw material sourcing.",
    icon: "farmer",
    position: "top",
  },
  {
    title: "Collectors",
    shortTitle: "Collection Network",
    description: "Local collectors gather and consolidate coconut products from farmers across sourcing regions.",
    icon: "collector",
    position: "top_left",
  },
  {
    title: "Suppliers",
    shortTitle: "Supplier Network",
    description: "A trusted supplier network delivers consistent volume and quality ahead of processing.",
    icon: "supplier",
    position: "left",
  },
  {
    title: "Warehouse",
    shortTitle: "Warehouse & Storage",
    description: "Organized storage facilities supporting large-volume coconut handling.",
    icon: "warehouse",
    position: "bottom_left",
  },
  {
    title: "Quality Control",
    shortTitle: "Quality Control",
    description: "Products are checked according to agreed specifications and buyer requirements.",
    icon: "quality_control",
    position: "bottom",
  },
  {
    title: "Packing",
    shortTitle: "Packing & Preparation",
    description: "Products are packed and prepared according to buyer specifications before loading.",
    icon: "packing",
    position: "bottom",
  },
  {
    title: "Loading",
    shortTitle: "Loading Operations",
    description: "Efficient loading operations prepare shipments for container stuffing.",
    icon: "loading",
    position: "bottom_right",
  },
  {
    title: "Container",
    shortTitle: "Container Stuffing",
    description: "Products are securely loaded into containers ready for export shipment.",
    icon: "container",
    position: "right",
  },
  {
    title: "Shipping",
    shortTitle: "Export Shipping",
    description: "Shipments are coordinated for reliable delivery to international destinations.",
    icon: "shipping",
    position: "top_right",
  },
  {
    title: "Global Buyers",
    shortTitle: "Global Market",
    description: "PPN supports coconut product supply for local and international buyers according to product specifications, volume, destination, and agreement.",
    icon: "global_buyer",
    position: "top",
  },
] as const;

// Sequential supply-flow connections the particle animation travels along — Suppliers/Shipping
// connect to the center "PPN" node implicitly (drawn by the frontend, not stored here, since
// the center is the section singleton, not a manageable node).
const SUPPLY_NETWORK_CONNECTIONS: [string, string][] = [
  ["Farmers", "Collectors"],
  ["Collectors", "Suppliers"],
  ["Warehouse", "Quality Control"],
  ["Quality Control", "Packing"],
  ["Packing", "Loading"],
  ["Loading", "Container"],
  ["Container", "Shipping"],
  ["Shipping", "Global Buyers"],
];

async function seedSupplyNetwork() {
  const existing = await prisma.supplyNetworkItem.findMany();
  const existingTitles = new Set(existing.map((item) => item.title));
  const hasCanonicalSet = SUPPLY_NETWORK_NODES.every((node) => existingTitles.has(node.title));
  if (hasCanonicalSet) return;

  // Replaces whatever placeholder items exist (pre-redesign test content, confirmed to carry
  // no uploaded illustrations) with the canonical ecosystem — connections cascade-delete with
  // their nodes, so clearing items alone is enough.
  await prisma.supplyNetworkItem.deleteMany();

  const created: Awaited<ReturnType<typeof prisma.supplyNetworkItem.create>>[] = [];
  for (const [index, node] of SUPPLY_NETWORK_NODES.entries()) {
    const item = await prisma.supplyNetworkItem.create({
      data: {
        title: node.title,
        shortTitle: node.shortTitle,
        description: node.description,
        icon: node.icon,
        position: node.position,
        order: index + 1,
        active: true,
      },
    });
    created.push(item);
  }

  const idByTitle = new Map(created.map((item) => [item.title, item.id]));
  await prisma.supplyNetworkConnection.createMany({
    data: SUPPLY_NETWORK_CONNECTIONS.map(([from, to], index) => ({
      fromNodeId: idByTitle.get(from)!,
      toNodeId: idByTitle.get(to)!,
      order: index + 1,
    })),
  });
}

async function seedSupplyNetworkCountries() {
  const count = await prisma.supplyNetworkCountry.count();
  if (count > 0) return;

  const countries = [
    { name: "Thailand", flagEmoji: "🇹🇭", status: "Active Market" },
    { name: "Vietnam", flagEmoji: "🇻🇳", status: "Active Market" },
    { name: "India", flagEmoji: "🇮🇳", status: "Active Market" },
    { name: "China", flagEmoji: "🇨🇳", status: "Active Market" },
  ];

  await prisma.supplyNetworkCountry.createMany({
    data: countries.map((country, index) => ({ ...country, order: index + 1, active: true })),
  });
}

async function seedProductionSteps() {
  const count = await prisma.productionStep.count();
  if (count > 0) return;

  const steps = [
    { title: "Farmer", description: "Coconuts are sourced from trusted local farmer partners." },
    { title: "Receiving", description: "Raw material is received and logged at our facility." },
    { title: "Sorting", description: "Coconuts are sorted by size, quality, and ripeness." },
    { title: "Quality Control", description: "Each batch passes quality checks before processing." },
    { title: "Packing", description: "Products are packed according to buyer specifications." },
    { title: "Storage", description: "Packed goods are stored in a controlled warehouse environment." },
    { title: "Stuffing", description: "Containers are loaded and stuffed for export shipment." },
    { title: "Export", description: "Goods are shipped to international buyers." },
  ];

  await prisma.productionStep.createMany({
    data: steps.map((step, index) => ({ ...step, order: index + 1 })),
  });
}

// Fixed master list of exactly 10 facilities (brief: "Facilities — Expand from 4 items to
// complete 10 facilities"). Facility rows are no longer admin-creatable/deletable — only their
// photos are — so this list is the single source of truth for name/description/order/slug.
// `slug` is what the frontend uses to look up each facility's icon (see FacilityIcons.tsx).
const MASTER_FACILITIES = [
  {
    slug: "large-capacity-warehouse",
    name: "Large-Capacity Warehouse",
    description: "Spacious storage for large-scale coconut commodities.",
  },
  {
    slug: "weighbridge-20-40ft",
    name: "Weighbridge 20–40 FT",
    description: "Accurate weighing for 20–40 ft trucks and containers.",
  },
  {
    slug: "forklift-material-handling",
    name: "Forklift & Material Handling",
    description: "Efficient equipment for product movement and handling.",
  },
  {
    slug: "loading-unloading-area",
    name: "Loading & Unloading Area",
    description: "Dedicated space for efficient cargo handling.",
  },
  {
    slug: "product-sorting-area",
    name: "Product Sorting Area",
    description: "Organized area for product selection and sorting.",
  },
  {
    slug: "quality-control-area",
    name: "Quality Control Area",
    description: "Product inspection to meet agreed specifications.",
  },
  {
    slug: "packing-preparation-area",
    name: "Packing & Preparation Area",
    description: "Product preparation based on buyer requirements.",
  },
  {
    slug: "truck-container-access",
    name: "Truck & Container Access",
    description: "Convenient access for trucks and container operations.",
  },
  {
    slug: "inventory-storage-management",
    name: "Inventory Storage & Management",
    description: "Organized storage for efficient stock management.",
  },
  {
    slug: "operational-administration-office",
    name: "Operational & Administration Office",
    description: "Supporting daily operations and business coordination.",
  },
] as const;

// Pre-redesign admin-created rows are backfilled with their master-list `slug` directly by the
// `20260820041455_add_facility_slug` migration (matched by name, preserving id/cover image/
// gallery photos — brief §23 "Backward Compatibility"), which always runs before this seed. So
// by the time this runs, every pre-existing row already has a valid slug; this only needs to
// (a) fix its `order`/name/description to match the master list — the legacy rows' old `order`
// values don't line up with their new master-list position — and (b) create whichever
// master-list rows are genuinely new (never admin-created before).
async function seedFacilities() {
  const existingBySlug = new Map((await prisma.facility.findMany()).map((f) => [f.slug, f]));

  for (const [index, master] of MASTER_FACILITIES.entries()) {
    const existing = existingBySlug.get(master.slug);
    if (existing) {
      if (existing.order !== index + 1 || existing.name !== master.name || existing.description !== master.description) {
        await prisma.facility.update({
          where: { id: existing.id },
          data: { order: index + 1, name: master.name, description: master.description },
        });
      }
      continue;
    }
    await prisma.facility.create({
      data: { ...master, order: index + 1, active: true },
    });
  }
}

async function seedMoqPaymentQuickCards() {
  const count = await prisma.moqPaymentQuickCard.count();
  if (count > 0) return;

  const cards = [
    { label: "Minimum Order Quantity", value: "1 x 20ft Container", icon: "container" },
    { label: "Payment Terms", value: "T/T or L/C", icon: "payment" },
    { label: "Shipment Method", value: "FOB / CIF", icon: "shipping" },
    { label: "Currency", value: "USD", icon: "currency" },
  ];

  await prisma.moqPaymentQuickCard.createMany({
    data: cards.map((card, index) => ({ ...card, order: index + 1 })),
  });
}

async function seedMoqPaymentBusinessTerms() {
  const count = await prisma.moqPaymentBusinessTerm.count();
  if (count > 0) return;

  const terms = [
    { label: "Minimum Order Quantity", value: "Varies by product and packaging — confirmed with each Request Quotation." },
    { label: "Payment Terms", value: "Letter of Credit (L/C), Telegraphic Transfer (T/T), or terms negotiated directly for repeat buyers." },
    { label: "Deposit / Down Payment", value: "A deposit may be required prior to production, with the balance settled before shipment." },
    { label: "Supported Currencies", value: "USD as primary currency; other currencies negotiable on request." },
    { label: "Price Validity", value: "Quoted prices are valid for a limited period and subject to confirmation at order placement." },
    { label: "Order Confirmation", value: "Orders are confirmed in writing after both parties agree on specifications, quantity, and price." },
    { label: "Sample Availability", value: "Product samples can be arranged prior to bulk order confirmation, subject to request." },
    { label: "Repeat Order Terms", value: "Returning buyers with an established payment history may be offered flexible terms." },
    { label: "Quotation Validity", value: "A formal quotation is issued per request and remains valid for the period stated therein." },
  ];

  await prisma.moqPaymentBusinessTerm.createMany({
    data: terms.map((term, index) => ({ ...term, order: index + 1 })),
  });
}

async function seedShippingArrangementItems() {
  const count = await prisma.shippingArrangementItem.count();
  if (count > 0) return;

  const items = [
    { icon: "ship", title: "Shipment Terms", value: "FOB / By Mutual Agreement" },
    { icon: "container", title: "Container Size", value: "20-Foot and 40-Foot Containers" },
    { icon: "warehouse", title: "Shipment Volume", value: "Large-Volume & Recurring Shipments" },
    { icon: "map_pin", title: "Loading Locations", value: "Palu, Central Sulawesi & Surabaya, East Java, Indonesia" },
    { icon: "globe", title: "Destination", value: "Based on Buyer Requirements" },
    { icon: "calendar", title: "Shipping Schedule", value: "Based on Product Availability, Order Volume & Vessel Schedule" },
    { icon: "file_check", title: "Documentation", value: "Prepared according to shipment requirements and applicable regulations." },
  ];

  await prisma.shippingArrangementItem.createMany({
    data: items.map((item, index) => ({ ...item, order: index + 1 })),
  });
}

async function seedShipmentLoadingLocations() {
  const count = await prisma.shipmentLoadingLocation.count();
  if (count > 0) return;

  const locations = [
    { name: "Palu", region: "Central Sulawesi", country: "Indonesia" },
    { name: "Surabaya", region: "East Java", country: "Indonesia" },
  ];

  await prisma.shipmentLoadingLocation.createMany({
    data: locations.map((location, index) => ({ ...location, order: index + 1 })),
  });
}

async function seedShipmentContainerTypes() {
  const count = await prisma.shipmentContainerType.count();
  if (count > 0) return;

  const types = ["20-Foot", "40-Foot"];

  await prisma.shipmentContainerType.createMany({
    data: types.map((label, index) => ({ label, order: index + 1 })),
  });
}

async function seedShipmentScheduleSteps() {
  const count = await prisma.shipmentScheduleStep.count();
  if (count > 0) return;

  const steps = [
    { name: "Product Availability", icon: "package" },
    { name: "Order Confirmation", icon: "clipboard_check" },
    { name: "Loading", icon: "container" },
    { name: "Vessel Schedule", icon: "ship" },
    { name: "Shipment", icon: "route" },
  ];

  await prisma.shipmentScheduleStep.createMany({
    data: steps.map((step, index) => ({ ...step, order: index + 1 })),
  });
}

async function seedShipmentCommitmentItems() {
  const count = await prisma.shipmentCommitmentItem.count();
  if (count > 0) return;

  const items = [
    { title: "Efficient Loading", icon: "container" },
    { title: "Accurate Documentation", icon: "file_check" },
    { title: "Organized Delivery", icon: "route" },
  ];

  await prisma.shipmentCommitmentItem.createMany({
    data: items.map((item, index) => ({ ...item, order: index + 1 })),
  });
}

// The FAQ section's default secondary CTA points at the real, currently-configured WhatsApp
// number (Contact Page CMS) — never a fabricated number. Same digit-stripping logic as
// apps/web/src/lib/whatsapp.ts's whatsAppLink(), duplicated here since this is a separate app.
async function seedFacilitiesFaqSection() {
  const existing = await prisma.aboutCompanyFacilitiesFaqSection.findFirst();
  if (existing && existing.ctaSecondaryHref) return;

  const contactSettings = await prisma.contactPageSettings.findFirst();
  const digitsOnly = (contactSettings?.whatsappNumber ?? "").replace(/[^\d]/g, "");
  const ctaSecondaryHref = digitsOnly ? `https://wa.me/${digitsOnly}` : "/contact";

  if (existing) {
    await prisma.aboutCompanyFacilitiesFaqSection.update({
      where: { id: existing.id },
      data: { ctaSecondaryHref },
    });
    return;
  }
  await prisma.aboutCompanyFacilitiesFaqSection.create({ data: { ctaSecondaryHref } });
}

async function seedFacilitiesFaqItems() {
  const count = await prisma.facilitiesFaqItem.count();
  if (count > 0) return;

  const items: {
    question: string;
    answer: string;
    highlightText?: string;
    translations: Record<string, { question: string; answer: string }>;
  }[] = [
    {
      question: "What products does PPN supply?",
      answer:
        "PPN supplies a range of coconut-based products, including Coconut Semi Husked, Coconut Shell Charcoal, Copra, and Coconut Timber for local buyers, industrial needs, and export markets.",
      translations: {
        id: {
          question: "Produk apa saja yang disuplai oleh PPN?",
          answer:
            "PPN menyuplai berbagai produk berbahan dasar kelapa, termasuk Kelapa Setengah Terkupas, Arang Tempurung Kelapa, Kopra, dan Kayu Kelapa untuk pembeli lokal, kebutuhan industri, dan pasar ekspor.",
        },
        zh: {
          question: "PPN供应哪些产品？",
          answer:
            "PPN供应多种椰子制品，包括半去壳椰子、椰壳炭、椰干（copra）和椰木，供应本地买家、工业需求及出口市场。",
        },
        th: {
          question: "PPN จัดหาผลิตภัณฑ์อะไรบ้าง?",
          answer:
            "PPN จัดหาผลิตภัณฑ์จากมะพร้าวหลากหลายชนิด รวมถึงมะพร้าวปอกเปลือกครึ่งลูก ถ่านกะลามะพร้าว มะพร้าวแห้ง (โคปร้า) และไม้มะพร้าว สำหรับผู้ซื้อในประเทศ ความต้องการทางอุตสาหกรรม และตลาดส่งออก",
        },
        hi: {
          question: "PPN कौन से उत्पाद सप्लाई करता है?",
          answer:
            "PPN नारियल आधारित उत्पादों की एक श्रृंखला सप्लाई करता है, जिसमें सेमी-हस्क्ड नारियल, नारियल खोल चारकोल, कोपरा और नारियल की लकड़ी शामिल हैं, जो स्थानीय खरीदारों, औद्योगिक आवश्यकताओं और निर्यात बाजारों के लिए उपलब्ध हैं।",
        },
        vi: {
          question: "PPN cung cấp những sản phẩm nào?",
          answer:
            "PPN cung cấp nhiều sản phẩm từ dừa, bao gồm Dừa Bán Xơ, Than Gáo Dừa, Cùi Dừa Khô (Copra) và Gỗ Dừa cho người mua trong nước, nhu cầu công nghiệp và thị trường xuất khẩu.",
        },
      },
    },
    {
      question: "Where does PPN source its products?",
      answer:
        "We work with local farmers, coconut collectors, and suppliers of various sizes. This network allows us to support large-volume and recurring supply requirements.",
      translations: {
        id: {
          question: "Dari mana PPN memperoleh produknya?",
          answer:
            "Kami bekerja sama dengan petani lokal, pengepul kelapa, dan pemasok dari berbagai skala. Jaringan ini memungkinkan kami mendukung kebutuhan pasokan bervolume besar dan berkelanjutan.",
        },
        zh: {
          question: "PPN的产品来源于哪里？",
          answer:
            "我们与当地农民、椰子收购商以及各种规模的供应商合作。这一网络使我们能够支持大批量及持续性的供应需求。",
        },
        th: {
          question: "PPN จัดหาผลิตภัณฑ์จากที่ใด?",
          answer:
            "เราทำงานร่วมกับเกษตรกรท้องถิ่น ผู้รวบรวมมะพร้าว และซัพพลายเออร์หลากหลายขนาด เครือข่ายนี้ช่วยให้เราสามารถรองรับความต้องการปริมาณมากและการจัดหาอย่างต่อเนื่อง",
        },
        hi: {
          question: "PPN अपने उत्पाद कहाँ से प्राप्त करता है?",
          answer:
            "हम स्थानीय किसानों, नारियल संग्रहकर्ताओं और विभिन्न आकार के आपूर्तिकर्ताओं के साथ काम करते हैं। यह नेटवर्क हमें बड़ी मात्रा और नियमित आपूर्ति आवश्यकताओं का समर्थन करने में सक्षम बनाता है।",
        },
        vi: {
          question: "PPN lấy nguồn sản phẩm từ đâu?",
          answer:
            "Chúng tôi hợp tác với nông dân địa phương, người thu gom dừa và các nhà cung cấp với nhiều quy mô khác nhau. Mạng lưới này cho phép chúng tôi đáp ứng nhu cầu cung ứng khối lượng lớn và định kỳ.",
        },
      },
    },
    {
      question: "Does PPN handle large-volume orders?",
      answer:
        "Yes. PPN supports large-volume and recurring orders for factories, traders, and export buyers. Order volumes are arranged according to product availability and buyer requirements.",
      translations: {
        id: {
          question: "Apakah PPN dapat menangani pesanan bervolume besar?",
          answer:
            "Ya. PPN mendukung pesanan bervolume besar dan berkelanjutan untuk pabrik, pedagang, dan pembeli ekspor. Volume pesanan diatur sesuai dengan ketersediaan produk dan kebutuhan pembeli.",
        },
        zh: {
          question: "PPN能处理大批量订单吗？",
          answer:
            "可以。PPN支持工厂、贸易商及出口买家的大批量及持续性订单。订单量将根据产品供应情况及买家需求进行安排。",
        },
        th: {
          question: "PPN สามารถรองรับคำสั่งซื้อปริมาณมากได้หรือไม่?",
          answer:
            "ได้ PPN รองรับคำสั่งซื้อปริมาณมากและต่อเนื่องสำหรับโรงงาน ผู้ค้า และผู้ซื้อเพื่อการส่งออก ปริมาณคำสั่งซื้อจะจัดเตรียมตามความพร้อมของผลิตภัณฑ์และความต้องการของผู้ซื้อ",
        },
        hi: {
          question: "क्या PPN बड़ी मात्रा के ऑर्डर संभाल सकता है?",
          answer:
            "हां। PPN फैक्ट्रियों, व्यापारियों और निर्यात खरीदारों के लिए बड़ी मात्रा और नियमित ऑर्डर का समर्थन करता है। ऑर्डर की मात्रा उत्पाद की उपलब्धता और खरीदार की आवश्यकताओं के अनुसार व्यवस्थित की जाती है।",
        },
        vi: {
          question: "PPN có thể xử lý các đơn hàng khối lượng lớn không?",
          answer:
            "Có. PPN hỗ trợ các đơn hàng khối lượng lớn và định kỳ cho nhà máy, thương nhân và người mua xuất khẩu. Khối lượng đơn hàng được sắp xếp theo tình trạng sẵn có của sản phẩm và yêu cầu của người mua.",
        },
      },
    },
    {
      question: "Does PPN offer long-term supply partnerships?",
      answer:
        "Yes. We are open to long-term contracts and supply partnerships with buyers and business partners who require consistent coconut supply.",
      translations: {
        id: {
          question: "Apakah PPN menawarkan kemitraan pasokan jangka panjang?",
          answer:
            "Ya. Kami terbuka untuk kontrak jangka panjang dan kemitraan pasokan dengan pembeli maupun mitra bisnis yang membutuhkan pasokan kelapa secara konsisten.",
        },
        zh: {
          question: "PPN是否提供长期供应合作关系？",
          answer:
            "是的。我们愿意与需要稳定椰子供应的买家及商业伙伴建立长期合同及供应合作关系。",
        },
        th: {
          question: "PPN มีการเสนอความร่วมมือด้านการจัดหาระยะยาวหรือไม่?",
          answer:
            "ใช่ เราพร้อมเปิดรับสัญญาระยะยาวและความร่วมมือด้านการจัดหากับผู้ซื้อและพันธมิตรทางธุรกิจที่ต้องการอุปทานมะพร้าวอย่างสม่ำเสมอ",
        },
        hi: {
          question: "क्या PPN दीर्घकालिक आपूर्ति साझेदारी प्रदान करता है?",
          answer:
            "हां। हम उन खरीदारों और व्यावसायिक भागीदारों के साथ दीर्घकालिक अनुबंध और आपूर्ति साझेदारी के लिए तैयार हैं जिन्हें निरंतर नारियल आपूर्ति की आवश्यकता है।",
        },
        vi: {
          question: "PPN có cung cấp quan hệ đối tác cung ứng dài hạn không?",
          answer:
            "Có. Chúng tôi sẵn sàng hợp tác theo hợp đồng dài hạn và quan hệ đối tác cung ứng với những người mua và đối tác kinh doanh cần nguồn cung dừa ổn định.",
        },
      },
    },
    {
      question: "Where does PPN ship its products?",
      answer:
        "PPN supports domestic and international shipments. One of our active export markets is Thailand, with regular shipments of up to approximately 15 containers per week.",
      highlightText: "≈ 15 CONTAINERS / WEEK",
      translations: {
        id: {
          question: "Ke mana saja PPN mengirimkan produknya?",
          answer:
            "PPN mendukung pengiriman domestik maupun internasional. Salah satu pasar ekspor aktif kami adalah Thailand, dengan pengiriman rutin hingga sekitar 15 kontainer per minggu.",
        },
        zh: {
          question: "PPN将产品运往何处？",
          answer:
            "PPN支持国内及国际运输。泰国是我们活跃的出口市场之一，每周定期发货约达15个集装箱。",
        },
        th: {
          question: "PPN จัดส่งผลิตภัณฑ์ไปที่ใดบ้าง?",
          answer:
            "PPN รองรับการจัดส่งทั้งภายในประเทศและระหว่างประเทศ หนึ่งในตลาดส่งออกที่มีความเคลื่อนไหวของเราคือประเทศไทย โดยมีการจัดส่งอย่างสม่ำเสมอสูงสุดประมาณ 15 ตู้คอนเทนเนอร์ต่อสัปดาห์",
        },
        hi: {
          question: "PPN अपने उत्पाद कहाँ भेजता है?",
          answer:
            "PPN घरेलू और अंतरराष्ट्रीय शिपमेंट दोनों का समर्थन करता है। हमारे सक्रिय निर्यात बाजारों में से एक थाईलैंड है, जहां प्रति सप्ताह लगभग 15 कंटेनर तक नियमित शिपमेंट होती है।",
        },
        vi: {
          question: "PPN vận chuyển sản phẩm đến đâu?",
          answer:
            "PPN hỗ trợ vận chuyển trong nước và quốc tế. Một trong những thị trường xuất khẩu tích cực của chúng tôi là Thái Lan, với các lô hàng thường xuyên lên đến khoảng 15 container mỗi tuần.",
        },
      },
    },
    {
      question: "Where are the products loaded?",
      answer:
        "Shipments can be arranged from our operational locations in Palu, Central Sulawesi, and Surabaya, East Java, depending on the product, buyer requirements, and shipping arrangements.",
      translations: {
        id: {
          question: "Di mana produk dimuat?",
          answer:
            "Pengiriman dapat diatur dari lokasi operasional kami di Palu, Sulawesi Tengah, dan Surabaya, Jawa Timur, tergantung pada produk, kebutuhan pembeli, dan pengaturan pengiriman.",
        },
        zh: {
          question: "产品在何处装货？",
          answer:
            "货物可根据产品、买家需求及运输安排，从我们位于中苏拉威西帕卢及东爪哇泗水的运营地点发货。",
        },
        th: {
          question: "สินค้าถูกบรรทุกที่ใด?",
          answer:
            "การจัดส่งสามารถจัดเตรียมได้จากสถานที่ปฏิบัติงานของเราในปาลู สุลาเวสีกลาง และสุราบายา ชวาตะวันออก ขึ้นอยู่กับผลิตภัณฑ์ ความต้องการของผู้ซื้อ และการจัดเตรียมการขนส่ง",
        },
        hi: {
          question: "उत्पाद कहाँ लोड किए जाते हैं?",
          answer:
            "उत्पाद, खरीदार की आवश्यकताओं और शिपमेंट व्यवस्था के आधार पर, शिपमेंट हमारे परिचालन स्थलों — पालू, मध्य सुलावेसी और सुराबाया, पूर्वी जावा से व्यवस्थित की जा सकती है।",
        },
        vi: {
          question: "Sản phẩm được xếp hàng ở đâu?",
          answer:
            "Việc giao hàng có thể được sắp xếp từ các địa điểm hoạt động của chúng tôi tại Palu, Trung Sulawesi và Surabaya, Đông Java, tùy thuộc vào sản phẩm, yêu cầu của người mua và cách sắp xếp vận chuyển.",
        },
      },
    },
    {
      question: "How is the product price determined?",
      answer:
        "Pricing depends on the product type, specifications, order volume, and current market conditions. Buyers with large-volume or recurring requirements can contact our team for a tailored quotation.",
      translations: {
        id: {
          question: "Bagaimana harga produk ditentukan?",
          answer:
            "Harga bergantung pada jenis produk, spesifikasi, volume pesanan, dan kondisi pasar terkini. Pembeli dengan kebutuhan bervolume besar atau berkelanjutan dapat menghubungi tim kami untuk mendapatkan penawaran harga yang disesuaikan.",
        },
        zh: {
          question: "产品价格如何确定？",
          answer:
            "价格取决于产品类型、规格、订单量及当前市场状况。有大批量或持续性需求的买家可联系我们的团队获取定制报价。",
        },
        th: {
          question: "ราคาผลิตภัณฑ์กำหนดอย่างไร?",
          answer:
            "ราคาขึ้นอยู่กับประเภทผลิตภัณฑ์ ข้อกำหนดเฉพาะ ปริมาณคำสั่งซื้อ และสภาวะตลาดในปัจจุบัน ผู้ซื้อที่มีความต้องการปริมาณมากหรือต่อเนื่องสามารถติดต่อทีมงานของเราเพื่อขอใบเสนอราคาที่ปรับให้เหมาะสม",
        },
        hi: {
          question: "उत्पाद की कीमत कैसे तय की जाती है?",
          answer:
            "मूल्य निर्धारण उत्पाद के प्रकार, विशिष्टताओं, ऑर्डर की मात्रा और वर्तमान बाजार स्थितियों पर निर्भर करता है। बड़ी मात्रा या नियमित आवश्यकताओं वाले खरीदार अनुकूलित कोटेशन के लिए हमारी टीम से संपर्क कर सकते हैं।",
        },
        vi: {
          question: "Giá sản phẩm được xác định như thế nào?",
          answer:
            "Giá cả phụ thuộc vào loại sản phẩm, thông số kỹ thuật, khối lượng đơn hàng và tình hình thị trường hiện tại. Người mua có nhu cầu khối lượng lớn hoặc định kỳ có thể liên hệ với đội ngũ của chúng tôi để nhận báo giá phù hợp.",
        },
      },
    },
    {
      question: "How do ordering and payment work?",
      answer:
        "The process starts with confirming the product, specifications, volume, price, and shipment schedule. Payment terms are then agreed upon based on the transaction and buyer requirements.",
      translations: {
        id: {
          question: "Bagaimana proses pemesanan dan pembayaran berlangsung?",
          answer:
            "Proses dimulai dengan konfirmasi produk, spesifikasi, volume, harga, dan jadwal pengiriman. Ketentuan pembayaran kemudian disepakati berdasarkan transaksi dan kebutuhan pembeli.",
        },
        zh: {
          question: "订购和付款流程是怎样的？",
          answer:
            "流程始于确认产品、规格、数量、价格及发货时间表。随后根据交易及买家需求商定付款条款。",
        },
        th: {
          question: "การสั่งซื้อและการชำระเงินดำเนินการอย่างไร?",
          answer:
            "กระบวนการเริ่มต้นด้วยการยืนยันผลิตภัณฑ์ ข้อกำหนดเฉพาะ ปริมาณ ราคา และกำหนดการจัดส่ง จากนั้นจะตกลงเงื่อนไขการชำระเงินตามลักษณะธุรกรรมและความต้องการของผู้ซื้อ",
        },
        hi: {
          question: "ऑर्डरिंग और भुगतान कैसे काम करता है?",
          answer:
            "प्रक्रिया उत्पाद, विशिष्टताओं, मात्रा, कीमत और शिपमेंट शेड्यूल की पुष्टि के साथ शुरू होती है। इसके बाद लेन-देन और खरीदार की आवश्यकताओं के आधार पर भुगतान की शर्तें तय की जाती हैं।",
        },
        vi: {
          question: "Quy trình đặt hàng và thanh toán diễn ra như thế nào?",
          answer:
            "Quy trình bắt đầu bằng việc xác nhận sản phẩm, thông số kỹ thuật, khối lượng, giá cả và lịch trình giao hàng. Sau đó, các điều khoản thanh toán sẽ được thống nhất dựa trên giao dịch và yêu cầu của người mua.",
        },
      },
    },
    {
      question: "Can buyers request specific product specifications?",
      answer:
        "Yes. Buyers can provide their preferred quality, size, specifications, packaging, and shipping requirements. Our team will prepare an offer based on the requirements and product availability.",
      translations: {
        id: {
          question: "Dapatkah pembeli meminta spesifikasi produk tertentu?",
          answer:
            "Ya. Pembeli dapat menyampaikan kualitas, ukuran, spesifikasi, kemasan, dan kebutuhan pengiriman yang diinginkan. Tim kami akan menyiapkan penawaran berdasarkan kebutuhan tersebut dan ketersediaan produk.",
        },
        zh: {
          question: "买家可以要求特定的产品规格吗？",
          answer:
            "可以。买家可提供其偏好的质量、尺寸、规格、包装及运输要求。我们的团队将根据需求及产品供应情况准备报价。",
        },
        th: {
          question: "ผู้ซื้อสามารถขอข้อกำหนดเฉพาะของผลิตภัณฑ์ได้หรือไม่?",
          answer:
            "ได้ ผู้ซื้อสามารถระบุคุณภาพ ขนาด ข้อกำหนดเฉพาะ บรรจุภัณฑ์ และความต้องการด้านการขนส่งที่ต้องการ ทีมงานของเราจะจัดเตรียมข้อเสนอตามความต้องการและความพร้อมของผลิตภัณฑ์",
        },
        hi: {
          question: "क्या खरीदार विशिष्ट उत्पाद विनिर्देश का अनुरोध कर सकते हैं?",
          answer:
            "हां। खरीदार अपनी पसंदीदा गुणवत्ता, आकार, विशिष्टताएं, पैकेजिंग और शिपिंग आवश्यकताएं बता सकते हैं। हमारी टीम आवश्यकताओं और उत्पाद की उपलब्धता के आधार पर एक प्रस्ताव तैयार करेगी।",
        },
        vi: {
          question: "Người mua có thể yêu cầu thông số kỹ thuật sản phẩm cụ thể không?",
          answer:
            "Có. Người mua có thể cung cấp chất lượng, kích thước, thông số kỹ thuật, bao bì và yêu cầu vận chuyển mong muốn. Đội ngũ của chúng tôi sẽ chuẩn bị báo giá dựa trên yêu cầu và tình trạng sẵn có của sản phẩm.",
        },
      },
    },
    {
      question: "How can I request a quotation?",
      answer:
        "Contact the PPN team through WhatsApp, email, or our official contact channels. Share your required product and volume, and our team will assist you with the appropriate information and quotation.",
      translations: {
        id: {
          question: "Bagaimana cara meminta penawaran harga?",
          answer:
            "Hubungi tim PPN melalui WhatsApp, email, atau saluran kontak resmi kami. Sampaikan produk dan volume yang Anda butuhkan, dan tim kami akan membantu Anda dengan informasi serta penawaran harga yang sesuai.",
        },
        zh: {
          question: "如何索取报价？",
          answer:
            "请通过WhatsApp、电子邮件或我们的官方联系渠道联系PPN团队。请告知您所需的产品及数量，我们的团队将为您提供相应的信息及报价。",
        },
        th: {
          question: "ฉันจะขอใบเสนอราคาได้อย่างไร?",
          answer:
            "ติดต่อทีมงาน PPN ผ่านทาง WhatsApp อีเมล หรือช่องทางติดต่อทางการของเรา แจ้งผลิตภัณฑ์และปริมาณที่ท่านต้องการ ทีมงานของเราจะช่วยให้ข้อมูลและใบเสนอราคาที่เหมาะสม",
        },
        hi: {
          question: "मैं कोटेशन का अनुरोध कैसे कर सकता हूं?",
          answer:
            "WhatsApp, ईमेल, या हमारे आधिकारिक संपर्क माध्यमों के जरिए PPN टीम से संपर्क करें। अपना आवश्यक उत्पाद और मात्रा साझा करें, और हमारी टीम उचित जानकारी और कोटेशन के साथ आपकी सहायता करेगी।",
        },
        vi: {
          question: "Làm thế nào để tôi yêu cầu báo giá?",
          answer:
            "Liên hệ với đội ngũ PPN qua WhatsApp, email hoặc các kênh liên hệ chính thức của chúng tôi. Hãy cho biết sản phẩm và khối lượng bạn cần, đội ngũ của chúng tôi sẽ hỗ trợ bạn với thông tin và báo giá phù hợp.",
        },
      },
    },
  ];

  await prisma.facilitiesFaqItem.createMany({
    data: items.map((item, index) => ({
      question: item.question,
      answer: item.answer,
      highlightText: item.highlightText,
      translations: item.translations,
      order: index + 1,
    })),
  });
}

async function seedFacilitiesFaqProductTags() {
  const count = await prisma.facilitiesFaqProductTag.count();
  if (count > 0) return;

  const firstItem = await prisma.facilitiesFaqItem.findFirst({
    orderBy: { order: 'asc' },
  });
  if (!firstItem) return;

  const tags = [
    "Semi Husked Coconut",
    "Copra",
    "Coconut Shell Charcoal",
    "Coconut Timber",
  ];

  await prisma.facilitiesFaqProductTag.createMany({
    data: tags.map((name, index) => ({
      faqItemId: firstItem.id,
      name,
      order: index + 1,
    })),
  });
}

async function seedGalleryCategories() {
  const count = await prisma.galleryCategory.count();
  if (count > 0) return;

  // "products" and "team" are reserved slugs — the public Gallery page special-cases them to
  // render live data from the Products/Team modules instead of carrying their own GalleryItem
  // rows (avoids duplicating data that already exists elsewhere).
  const categories = [
    { name: "Products", slug: "products" },
    { name: "Warehouse", slug: "warehouse" },
    { name: "Weighbridge", slug: "weighbridge" },
    { name: "Forklift", slug: "forklift" },
    { name: "Sorting", slug: "sorting" },
    { name: "Loading", slug: "loading" },
    { name: "Container", slug: "container" },
    { name: "Shipment", slug: "shipment" },
    { name: "Drone", slug: "drone" },
    { name: "Team", slug: "team" },
  ];

  await prisma.galleryCategory.createMany({
    data: categories.map((category, index) => ({ ...category, order: index + 1 })),
  });
}

// Inner Page Header — one row per managed page key + the reserved "global-default" row.
// `product-detail` copies forward whatever was already set as `SiteBranding.
// productHeaderBackgroundId` (the old, single-purpose "Background Header Halaman Produk"
// field this system supersedes) so a site that already had that photo configured keeps
// showing it unchanged after this migration — no re-upload needed, no visual regression.
const PAGE_HEADER_KEYS = ["about-company", "products", "product-detail", "facilities", "gallery", "news"];
const GLOBAL_DEFAULT_PAGE_HEADER_KEY = "global-default";

async function seedPageHeaders() {
  const branding = await prisma.siteBranding.findFirst({
    select: { productHeaderBackgroundId: true },
  });

  for (const pageKey of [...PAGE_HEADER_KEYS, GLOBAL_DEFAULT_PAGE_HEADER_KEY]) {
    const existing = await prisma.pageHeader.findUnique({ where: { pageKey } });
    if (existing) continue;
    await prisma.pageHeader.create({
      data: {
        pageKey,
        backgroundImageId:
          pageKey === "product-detail" ? (branding?.productHeaderBackgroundId ?? null) : null,
      },
    });
  }
}

async function seedProducts() {
  const products = [
    {
      slug: "semi-husked-coconut",
      name: "Semi Husked Coconut",
      category: "Semi Husked Coconut",
      shortDescription: "Fresh semi husked coconuts prepared for export, sorted by size and quality.",
      fullDescription:
        "Our Semi Husked Coconut is sourced from trusted local farmers and processed under strict quality control before export. Suitable for food manufacturers, wholesalers, and distributors seeking consistent, reliable supply.",
      specs: [
        { specKey: "Moisture Content", specValue: "≤ 50%" },
        { specKey: "Size", specValue: "Medium – Large" },
        { specKey: "Packaging", specValue: "Jumbo bag / As requested" },
      ],
    },
    {
      slug: "copra",
      name: "Copra",
      category: "Copra",
      shortDescription: "Dried coconut meat (copra) processed for oil extraction and industrial use.",
      fullDescription:
        "Our Copra is produced through a controlled drying process to maintain oil content and quality, suitable for oil mills and food manufacturers requiring consistent raw material specifications.",
      specs: [
        { specKey: "Moisture Content", specValue: "≤ 6%" },
        { specKey: "Oil Content", specValue: "≥ 63%" },
        { specKey: "Packaging", specValue: "50kg sacks / Jumbo bag" },
      ],
    },
    {
      slug: "coconut-shell-charcoal",
      name: "Coconut Shell Charcoal",
      category: "Coconut Shell Charcoal",
      shortDescription: "High-quality coconut shell charcoal for industrial and fuel applications.",
      fullDescription:
        "Our Coconut Shell Charcoal is produced from selected coconut shells and processed to deliver consistent burn quality, suitable for industrial fuel and activated carbon production.",
      specs: [
        { specKey: "Fixed Carbon", specValue: "≥ 75%" },
        { specKey: "Moisture Content", specValue: "≤ 8%" },
        { specKey: "Packaging", specValue: "25kg / 50kg sacks" },
      ],
    },
    {
      slug: "coconut-timber",
      name: "Coconut Timber",
      category: "Coconut Timber",
      shortDescription: "Sustainably sourced coconut timber for furniture and construction use.",
      fullDescription:
        "Our Coconut Timber is sourced from mature coconut trees and processed for use in furniture, flooring, and construction applications, offering a sustainable alternative to conventional hardwood.",
      specs: [
        { specKey: "Moisture Content", specValue: "≤ 12%" },
        { specKey: "Length", specValue: "As per order specification" },
        { specKey: "Packaging", specValue: "Bundled / Crated" },
      ],
    },
  ];

  for (const [index, product] of products.entries()) {
    const { specs, ...productData } = product;
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {},
      create: {
        ...productData,
        isFeatured: true,
        status: "published",
        order: index + 1,
        specifications: {
          create: specs.map((spec, specIndex) => ({ ...spec, order: specIndex + 1 })),
        },
        packagingAndApps: {
          create: [
            {
              type: "packaging",
              title: "Export Packaging",
              description:
                "Packed according to buyer specification and export standards to protect product quality during shipment.",
            },
            {
              type: "application",
              title: "Industry Application",
              description:
                "Used across food manufacturing, industrial, and export trading applications depending on product type.",
            },
          ],
        },
      },
    });
  }
}

async function seedArticles() {
  const count = await prisma.article.count();
  if (count > 0) return;

  const articles = [
    {
      slug: "understanding-coconut-export-quality-standards",
      title: "Understanding Coconut Export Quality Standards",
      excerpt:
        "A look at the quality benchmarks international buyers expect from coconut product exporters.",
      content:
        "International buyers evaluate coconut product suppliers on consistency, moisture content, and packaging integrity. This article outlines the general quality considerations relevant to Semi Husked Coconut, Copra, Coconut Shell Charcoal, and Coconut Timber shipments.",
      category: "Industry Insight",
    },
    {
      slug: "how-coconut-shell-charcoal-is-produced",
      title: "How Coconut Shell Charcoal Is Produced",
      excerpt: "An overview of the production journey from coconut shell to export-ready charcoal.",
      content:
        "Coconut shell charcoal production involves careful shell selection, controlled carbonization, and quality sorting before packaging for export. Understanding this process helps buyers evaluate supplier reliability.",
      category: "Production Process",
    },
    {
      slug: "why-buyers-choose-indonesian-coconut-suppliers",
      title: "Why Buyers Choose Indonesian Coconut Suppliers",
      excerpt: "Indonesia's coconut industry offers consistent supply for global B2B buyers.",
      content:
        "Indonesia's coconut-producing regions provide a stable supply chain for exporters. This article discusses the factors that make Indonesian suppliers a reliable choice for importers, distributors, and food manufacturers.",
      category: "Industry Insight",
    },
  ];

  for (const article of articles) {
    await prisma.article.upsert({
      where: { slug: article.slug },
      update: {},
      create: { ...article, status: "published", publishedAt: new Date() },
    });
  }
}

async function seedHeroSlides() {
  const count = await prisma.heroSlide.count();
  if (count > 0) return;

  // Same copy as the pre-redesign static Hero — real content, not a placeholder — so the
  // live site keeps its current heading/CTAs until the admin adds real slide photos. No
  // image is set (desktop/mobile), matching the "no stock imagery" rule applied throughout
  // this project: HeroSlider.tsx renders SafeImage's honest placeholder until then.
  await prisma.heroSlide.create({
    data: {
      heading: "Reliable coconut exports, from farm to your factory floor.",
      subheading:
        "Semi Husked Coconut, Copra, Coconut Shell Charcoal, and Coconut Timber — sourced, processed, and shipped with consistent quality for buyers across Asia, the Middle East, and Europe.",
      button1Text: "Request Quotation",
      button1Link: "#request-quotation",
      button2Text: "View Products",
      button2Link: "/products",
      order: 1,
      enabled: true,
    },
  });
}

async function seedDecorativeGraphics() {
  const count = await prisma.decorativeGraphic.count();
  if (count > 0) return;

  // Decorative design choice, not fabricated business data — tasteful low-opacity
  // line-art watermarks; the admin can add/adjust/disable more via CMS. `page` doubles as a
  // section key ("home" = Hero, "home-about-preview" = the About Preview section) so the
  // two sections don't share/compete for the same watermark placements.
  await prisma.decorativeGraphic.createMany({
    data: [
      { page: "home", variant: "leaf_outline", placement: "hero_behind_content", opacity: 0.06, scale: 1.4, order: 1 },
      { page: "home", variant: "world_map_outline", placement: "bottom_right", opacity: 0.05, scale: 1, order: 2 },
      { page: "home-about-preview", variant: "palm_leaf", placement: "top_right", opacity: 0.05, scale: 1.2, order: 1 },
      { page: "home-about-preview", variant: "container_outline", placement: "bottom_left", opacity: 0.05, scale: 1, order: 2 },
      { page: "home-partners", variant: "coconut_cross_section", placement: "center_background", opacity: 0.04, scale: 1.6, order: 1 },
      { page: "home-why-choose-us", variant: "coconut_tree_silhouette", placement: "top_right", opacity: 0.04, scale: 1.3, order: 1 },
      { page: "home-why-choose-us", variant: "leaf_outline", placement: "bottom_left", opacity: 0.04, scale: 1.1, order: 2 },
    ],
  });
}

async function seedAboutPreview() {
  const count = await prisma.homepageAboutPreview.count();
  if (count > 0) return;

  // Same real company description already used on the About page (docs/01-prd.md company
  // profile) — not new placeholder copy, so the two sections never contradict each other.
  // video_source stays "none": no company video exists yet, so the section shows an honest
  // placeholder until the admin adds a real YouTube/Vimeo link or uploads a file.
  await prisma.homepageAboutPreview.create({
    data: {
      label: "About CV. Putri Palma Nusantara",
      heading: "Premium Indonesian Coconut Exporter",
      paragraph1:
        "CV Putri Palma Nusantara is an Indonesian exporter of coconut-derived products, connecting local coconut-producing regions with importers, distributors, wholesalers, food manufacturers, and trading companies across Asia, the Middle East, and Europe.",
      paragraph2:
        "We focus on four core product lines — Semi Husked Coconut, Copra, Coconut Shell Charcoal, and Coconut Timber — supported by a consistent production process and dependable supply capacity.",
      paragraph3:
        "Our mission is to be a trusted, transparent supply partner for international buyers of coconut products, delivering consistent quality from sourcing through to export.",
      ctaText: "Get to Know Us",
      ctaLink: "/about",
      videoSource: "none",
      enabled: true,
    },
  });
}

async function seedHighlights() {
  const count = await prisma.homepageHighlight.count();
  if (count > 0) return;

  await prisma.homepageHighlight.createMany({
    data: [
      {
        icon: "quality",
        title: "Export Quality Products",
        description: "Every shipment passes quality checks before it leaves our facility.",
        order: 1,
      },
      {
        icon: "sustainability",
        title: "Sustainable Supply Chain",
        description: "Sourced responsibly from trusted local farming communities.",
        order: 2,
      },
      {
        icon: "partnership",
        title: "Trusted International Partner",
        description: "Serving buyers across Asia, the Middle East, and Europe.",
        order: 3,
      },
      {
        icon: "service",
        title: "Professional Export Services",
        description: "Clear communication and dependable support from quotation to shipment.",
        order: 4,
      },
    ],
  });
}

async function seedPartnersSection() {
  const count = await prisma.homepagePartnersSection.count();
  if (count > 0) return;

  // Title/subtitle copy is taken verbatim from the client's own brief — real specified
  // content, not placeholder text. No PartnerLogo rows are seeded here: the brief itself
  // is explicit that government/institution logos must never be invented or substituted
  // with unofficial versions — "If an official downloadable logo is unavailable, DO NOT
  // create a fake logo. Instead, create an admin placeholder." The carousel below simply
  // stays hidden (see PartnerMarquee.tsx) until the admin uploads real, officially-sourced
  // logo files — this seed only prepares the section chrome around it.
  await prisma.homepagePartnersSection.create({
    data: {
      title: "TRUSTED INSTITUTIONS & PARTNERS",
      subtitle: "Supporting our commitment to quality, compliance, and reliable international trade.",
      marqueeDurationSeconds: 40,
      enabled: true,
    },
  });
}

async function seedWhyChooseUs() {
  const count = await prisma.homepageWhyChooseUs.count();
  if (count > 0) return;

  // Exact 8 items from the brief, in the specified order — icon + short title only, no
  // description field on this model by design (see WhyChooseUsSection.tsx).
  await prisma.homepageWhyChooseUs.createMany({
    data: [
      { icon: "quality", title: "Premium Quality", order: 1 },
      { icon: "supply", title: "Reliable Supply", order: 2 },
      { icon: "export_ready", title: "Export Ready", order: 3 },
      { icon: "consistency", title: "Consistent Quality", order: 4 },
      { icon: "sustainability", title: "Sustainable Sourcing", order: 5 },
      { icon: "service", title: "Professional Service", order: 6 },
      { icon: "pricing", title: "Competitive Pricing", order: 7 },
      { icon: "delivery", title: "On-Time Delivery", order: 8 },
    ],
  });
}

async function main() {
  await seedAdmin();
  await seedSiteSettings();
  await seedHomepageStatistics();
  await seedFaqs();
  await seedProductionSteps();
  await seedSupplyNetwork();
  await seedSupplyNetworkCountries();
  await seedFacilities();
  await seedMoqPaymentQuickCards();
  await seedMoqPaymentBusinessTerms();
  await seedShippingArrangementItems();
  await seedShipmentLoadingLocations();
  await seedShipmentContainerTypes();
  await seedShipmentScheduleSteps();
  await seedShipmentCommitmentItems();
  await seedFacilitiesFaqSection();
  await seedFacilitiesFaqItems();
  await seedFacilitiesFaqProductTags();
  await seedGalleryCategories();
  await seedPageHeaders();
  await seedProducts();
  await seedArticles();
  await seedHeroSlides();
  await seedDecorativeGraphics();
  await seedAboutPreview();
  await seedHighlights();
  await seedPartnersSection();
  await seedWhyChooseUs();
  console.log("Seed complete.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
