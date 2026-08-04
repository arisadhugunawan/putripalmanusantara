// Seeds structural placeholder content so every CMS module and public page has something to
// render during development. Numeric/copy values are illustrative placeholders — the client
// replaces them via the Admin CMS (Phase 5) before launch. No Media records are seeded: real
// photos/videos must come from PPN, per docs/01-prd.md §13 (no generic stock imagery).
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

async function seedFacilities() {
  const count = await prisma.facility.count();
  if (count > 0) return;

  const facilities = [
    { name: "Warehouse", description: "Climate-appropriate storage for packed and raw materials." },
    { name: "Loading Area", description: "Dedicated area for loading and unloading shipments." },
    { name: "Forklift", description: "Material-handling equipment for efficient warehouse operations." },
    { name: "Weighbridge", description: "On-site weighing station for accurate shipment records." },
    { name: "Quality Control", description: "Inspection station for verifying product quality standards." },
    { name: "Container Stuffing", description: "Facility for loading export containers securely." },
  ];

  await prisma.facility.createMany({
    data: facilities.map((facility, index) => ({ ...facility, order: index + 1 })),
  });
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

async function main() {
  await seedAdmin();
  await seedSiteSettings();
  await seedHomepageStatistics();
  await seedFaqs();
  await seedProductionSteps();
  await seedFacilities();
  await seedProducts();
  await seedArticles();
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
