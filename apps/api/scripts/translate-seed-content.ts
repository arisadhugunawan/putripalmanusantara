/**
 * One-off content translation pass — NOT part of the regular seed.ts fixture data.
 *
 * Populates the `translations` JSON column (id/zh/th/hi/vi) for every currently-seeded
 * English row across all translatable models. Every string below is my own direct
 * translation (no external translation API), written for this session in response to an
 * explicit choice from the business owner to have AI-generated translations pre-populated
 * now rather than left empty. See README "Internationalization" section:
 *
 *   THESE ARE MACHINE-TRANSLATED DRAFTS. They must be reviewed by a native speaker or
 *   professional translator before being shown to real international buyers — especially
 *   product specifications and any future certification text, where a mistranslation
 *   carries real business/legal risk.
 *
 * Matches rows by natural key (slug/title/name/label/question/key) rather than hardcoded
 * database IDs, so this script stays usable after `prisma db seed` regenerates the fixture
 * rows with new CUIDs.
 *
 * Run with: npx tsx scripts/translate-seed-content.ts
 */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

type T = Record<string, Record<string, string>>;

// ── Products (keyed by slug) ──────────────────────────────────────────────
const PRODUCT_TRANSLATIONS: Record<string, T> = {
  'semi-husked-coconut': {
    id: {
      name: 'Kelapa Setengah Terkupas',
      category: 'Kelapa Setengah Terkupas',
      shortDescription:
        'Kelapa setengah terkupas segar yang disiapkan untuk ekspor, disortir berdasarkan ukuran dan kualitas.',
      fullDescription:
        'Kelapa Setengah Terkupas kami berasal dari petani lokal terpercaya dan diproses dengan kontrol kualitas ketat sebelum diekspor. Cocok untuk produsen makanan, grosir, dan distributor yang mencari pasokan yang konsisten dan andal.',
    },
    zh: {
      name: '半去壳椰子',
      category: '半去壳椰子',
      shortDescription: '新鲜的半去壳椰子，按尺寸和质量分类，专为出口准备。',
      fullDescription:
        '我们的半去壳椰子采购自值得信赖的当地农户，并在出口前经过严格的质量控制加工。适合寻求稳定可靠供应的食品制造商、批发商和分销商。',
    },
    th: {
      name: 'มะพร้าวปอกเปลือกครึ่งลูก',
      category: 'มะพร้าวปอกเปลือกครึ่งลูก',
      shortDescription:
        'มะพร้าวปอกเปลือกครึ่งลูกสดใหม่ เตรียมพร้อมสำหรับการส่งออก คัดแยกตามขนาดและคุณภาพ',
      fullDescription:
        'มะพร้าวปอกเปลือกครึ่งลูกของเรามาจากเกษตรกรท้องถิ่นที่เชื่อถือได้ และผ่านการควบคุมคุณภาพอย่างเข้มงวดก่อนส่งออก เหมาะสำหรับผู้ผลิตอาหาร ผู้ค้าส่ง และผู้จัดจำหน่ายที่ต้องการอุปทานที่สม่ำเสมอและเชื่อถือได้',
    },
    hi: {
      name: 'अर्ध-छिलका नारियल',
      category: 'अर्ध-छिलका नारियल',
      shortDescription:
        'निर्यात के लिए तैयार ताज़ा अर्ध-छिलका नारियल, आकार और गुणवत्ता के अनुसार छांटे गए।',
      fullDescription:
        'हमारा अर्ध-छिलका नारियल विश्वसनीय स्थानीय किसानों से प्राप्त किया जाता है और निर्यात से पहले सख्त गुणवत्ता नियंत्रण के तहत संसाधित किया जाता है। खाद्य निर्माताओं, थोक विक्रेताओं और लगातार, विश्वसनीय आपूर्ति चाहने वाले वितरकों के लिए उपयुक्त।',
    },
    vi: {
      name: 'Dừa Bóc Vỏ Một Phần',
      category: 'Dừa Bóc Vỏ Một Phần',
      shortDescription:
        'Dừa bóc vỏ một phần tươi, được chuẩn bị để xuất khẩu, phân loại theo kích thước và chất lượng.',
      fullDescription:
        'Dừa Bóc Vỏ Một Phần của chúng tôi được thu mua từ những nông dân địa phương đáng tin cậy và được chế biến dưới sự kiểm soát chất lượng nghiêm ngặt trước khi xuất khẩu. Phù hợp cho các nhà sản xuất thực phẩm, nhà bán buôn và nhà phân phối tìm kiếm nguồn cung ổn định, đáng tin cậy.',
    },
  },
  copra: {
    id: {
      name: 'Kopra',
      category: 'Kopra',
      shortDescription:
        'Daging kelapa kering (kopra) yang diproses untuk ekstraksi minyak dan penggunaan industri.',
      fullDescription:
        'Kopra kami diproduksi melalui proses pengeringan yang terkontrol untuk menjaga kandungan minyak dan kualitas, cocok untuk pabrik minyak dan produsen makanan yang membutuhkan spesifikasi bahan baku yang konsisten.',
    },
    zh: {
      name: '椰干',
      category: '椰干',
      shortDescription: '干燥椰肉（椰干），经加工用于榨油和工业用途。',
      fullDescription:
        '我们的椰干通过受控干燥工艺生产，以保持含油量和质量，适合需要稳定原材料规格的油厂和食品制造商。',
    },
    th: {
      name: 'มะพร้าวแห้ง (Copra)',
      category: 'มะพร้าวแห้ง (Copra)',
      shortDescription: 'เนื้อมะพร้าวแห้ง (Copra) ที่ผ่านการแปรรูปเพื่อสกัดน้ำมันและใช้ในอุตสาหกรรม',
      fullDescription:
        'มะพร้าวแห้งของเราผลิตผ่านกระบวนการอบแห้งที่ควบคุมได้เพื่อรักษาปริมาณน้ำมันและคุณภาพ เหมาะสำหรับโรงงานสกัดน้ำมันและผู้ผลิตอาหารที่ต้องการข้อกำหนดวัตถุดิบที่สม่ำเสมอ',
    },
    hi: {
      name: 'कोपरा',
      category: 'कोपरा',
      shortDescription: 'सूखा नारियल गूदा (कोपरा), तेल निष्कर्षण और औद्योगिक उपयोग के लिए संसाधित।',
      fullDescription:
        'हमारा कोपरा एक नियंत्रित सुखाने की प्रक्रिया के माध्यम से तैयार किया जाता है ताकि तेल की मात्रा और गुणवत्ता बनी रहे, यह तेल मिलों और लगातार कच्चे माल विशिष्टताओं की आवश्यकता वाले खाद्य निर्माताओं के लिए उपयुक्त है।',
    },
    vi: {
      name: 'Cùi Dừa Khô (Copra)',
      category: 'Cùi Dừa Khô (Copra)',
      shortDescription: 'Cùi dừa khô (copra) được chế biến để chiết xuất dầu và sử dụng công nghiệp.',
      fullDescription:
        'Copra của chúng tôi được sản xuất qua quy trình sấy khô có kiểm soát để duy trì hàm lượng dầu và chất lượng, phù hợp cho các nhà máy ép dầu và nhà sản xuất thực phẩm cần thông số nguyên liệu thô ổn định.',
    },
  },
  'coconut-shell-charcoal': {
    id: {
      name: 'Arang Tempurung Kelapa',
      category: 'Arang Tempurung Kelapa',
      shortDescription: 'Arang tempurung kelapa berkualitas tinggi untuk aplikasi industri dan bahan bakar.',
      fullDescription:
        'Arang Tempurung Kelapa kami diproduksi dari tempurung kelapa pilihan dan diproses untuk menghasilkan kualitas pembakaran yang konsisten, cocok untuk bahan bakar industri dan produksi karbon aktif.',
    },
    zh: {
      name: '椰壳炭',
      category: '椰壳炭',
      shortDescription: '高品质椰壳炭，适用于工业和燃料用途。',
      fullDescription:
        '我们的椰壳炭采用精选椰壳生产，经过加工以提供稳定的燃烧质量，适用于工业燃料和活性炭生产。',
    },
    th: {
      name: 'ถ่านกะลามะพร้าว',
      category: 'ถ่านกะลามะพร้าว',
      shortDescription: 'ถ่านกะลามะพร้าวคุณภาพสูงสำหรับงานอุตสาหกรรมและเชื้อเพลิง',
      fullDescription:
        'ถ่านกะลามะพร้าวของเราผลิตจากกะลามะพร้าวคัดสรร และผ่านการแปรรูปเพื่อให้คุณภาพการเผาไหม้ที่สม่ำเสมอ เหมาะสำหรับเชื้อเพลิงอุตสาหกรรมและการผลิตถ่านกัมมันต์',
    },
    hi: {
      name: 'नारियल खोल चारकोल',
      category: 'नारियल खोल चारकोल',
      shortDescription: 'औद्योगिक और ईंधन अनुप्रयोगों के लिए उच्च गुणवत्ता वाला नारियल खोल चारकोल।',
      fullDescription:
        'हमारा नारियल खोल चारकोल चुनिंदा नारियल के खोल से बनाया जाता है और लगातार जलने की गुणवत्ता प्रदान करने के लिए संसाधित किया जाता है, जो औद्योगिक ईंधन और सक्रिय कार्बन उत्पादन के लिए उपयुक्त है।',
    },
    vi: {
      name: 'Than Gáo Dừa',
      category: 'Than Gáo Dừa',
      shortDescription: 'Than gáo dừa chất lượng cao cho ứng dụng công nghiệp và nhiên liệu.',
      fullDescription:
        'Than Gáo Dừa của chúng tôi được sản xuất từ gáo dừa chọn lọc và chế biến để mang lại chất lượng cháy ổn định, phù hợp cho nhiên liệu công nghiệp và sản xuất than hoạt tính.',
    },
  },
  'coconut-timber': {
    id: {
      name: 'Kayu Kelapa',
      category: 'Kayu Kelapa',
      shortDescription: 'Kayu kelapa yang bersumber secara berkelanjutan untuk penggunaan furnitur dan konstruksi.',
      fullDescription:
        'Kayu Kelapa kami berasal dari pohon kelapa yang sudah tua dan diproses untuk digunakan pada furnitur, lantai, dan aplikasi konstruksi, menawarkan alternatif berkelanjutan untuk kayu keras konvensional.',
    },
    zh: {
      name: '椰木',
      category: '椰木',
      shortDescription: '可持续采购的椰木，适用于家具和建筑用途。',
      fullDescription: '我们的椰木采自成熟的椰子树，经加工可用于家具、地板和建筑应用，是传统硬木的可持续替代品。',
    },
    th: {
      name: 'ไม้มะพร้าว',
      category: 'ไม้มะพร้าว',
      shortDescription: 'ไม้มะพร้าวที่จัดหาอย่างยั่งยืนสำหรับใช้ทำเฟอร์นิเจอร์และงานก่อสร้าง',
      fullDescription:
        'ไม้มะพร้าวของเรามาจากต้นมะพร้าวที่โตเต็มที่และผ่านการแปรรูปเพื่อใช้ในเฟอร์นิเจอร์ พื้น และงานก่อสร้าง เป็นทางเลือกที่ยั่งยืนแทนไม้เนื้อแข็งทั่วไป',
    },
    hi: {
      name: 'नारियल की लकड़ी',
      category: 'नारियल की लकड़ी',
      shortDescription: 'फर्नीचर और निर्माण उपयोग के लिए स्थायी रूप से प्राप्त नारियल की लकड़ी।',
      fullDescription:
        'हमारी नारियल की लकड़ी परिपक्व नारियल के पेड़ों से प्राप्त की जाती है और फर्नीचर, फ़्लोरिंग और निर्माण अनुप्रयोगों में उपयोग के लिए संसाधित की जाती है, जो पारंपरिक हार्डवुड का एक स्थायी विकल्प प्रदान करती है।',
    },
    vi: {
      name: 'Gỗ Dừa',
      category: 'Gỗ Dừa',
      shortDescription: 'Gỗ dừa được khai thác bền vững cho nội thất và xây dựng.',
      fullDescription:
        'Gỗ Dừa của chúng tôi được lấy từ những cây dừa trưởng thành và chế biến để sử dụng trong nội thất, sàn nhà và các ứng dụng xây dựng, mang đến giải pháp thay thế bền vững cho gỗ cứng thông thường.',
    },
  },
};

// ── Product specifications (keyed by product slug -> spec_key) ────────────
const SPEC_TRANSLATIONS: Record<string, Record<string, T>> = {
  'semi-husked-coconut': {
    'Moisture Content': {
      id: { specKey: 'Kadar Air' },
      zh: { specKey: '水分含量' },
      th: { specKey: 'ปริมาณความชื้น' },
      hi: { specKey: 'नमी की मात्रा' },
      vi: { specKey: 'Độ ẩm' },
    },
    Size: {
      id: { specKey: 'Ukuran', specValue: 'Sedang – Besar' },
      zh: { specKey: '尺寸', specValue: '中–大' },
      th: { specKey: 'ขนาด', specValue: 'กลาง–ใหญ่' },
      hi: { specKey: 'आकार', specValue: 'मध्यम – बड़ा' },
      vi: { specKey: 'Kích thước', specValue: 'Trung bình – Lớn' },
    },
    Packaging: {
      id: { specKey: 'Kemasan', specValue: 'Jumbo bag / Sesuai permintaan' },
      zh: { specKey: '包装', specValue: '吨包/按要求' },
      th: { specKey: 'บรรจุภัณฑ์', specValue: 'ถุงจัมโบ้ / ตามคำขอ' },
      hi: { specKey: 'पैकेजिंग', specValue: 'जंबो बैग / अनुरोध अनुसार' },
      vi: { specKey: 'Đóng gói', specValue: 'Bao jumbo / Theo yêu cầu' },
    },
  },
  copra: {
    'Moisture Content': {
      id: { specKey: 'Kadar Air' },
      zh: { specKey: '水分含量' },
      th: { specKey: 'ปริมาณความชื้น' },
      hi: { specKey: 'नमी की मात्रा' },
      vi: { specKey: 'Độ ẩm' },
    },
    'Oil Content': {
      id: { specKey: 'Kadar Minyak' },
      zh: { specKey: '含油量' },
      th: { specKey: 'ปริมาณน้ำมัน' },
      hi: { specKey: 'तेल की मात्रा' },
      vi: { specKey: 'Hàm lượng dầu' },
    },
    Packaging: {
      id: { specKey: 'Kemasan', specValue: 'Karung 50kg / Jumbo bag' },
      zh: { specKey: '包装', specValue: '50公斤袋装/吨包' },
      th: { specKey: 'บรรจุภัณฑ์', specValue: 'กระสอบ 50 กก. / ถุงจัมโบ้' },
      hi: { specKey: 'पैकेजिंग', specValue: '50 किग्रा बोरी / जंबो बैग' },
      vi: { specKey: 'Đóng gói', specValue: 'Bao 50kg / Bao jumbo' },
    },
  },
  'coconut-shell-charcoal': {
    'Fixed Carbon': {
      id: { specKey: 'Karbon Tetap' },
      zh: { specKey: '固定碳' },
      th: { specKey: 'คาร์บอนคงที่' },
      hi: { specKey: 'स्थिर कार्बन' },
      vi: { specKey: 'Carbon cố định' },
    },
    'Moisture Content': {
      id: { specKey: 'Kadar Air' },
      zh: { specKey: '水分含量' },
      th: { specKey: 'ปริมาณความชื้น' },
      hi: { specKey: 'नमी की मात्रा' },
      vi: { specKey: 'Độ ẩm' },
    },
    Packaging: {
      id: { specKey: 'Kemasan', specValue: 'Karung 25kg / 50kg' },
      zh: { specKey: '包装', specValue: '25公斤/50公斤袋装' },
      th: { specKey: 'บรรจุภัณฑ์', specValue: 'กระสอบ 25 กก. / 50 กก.' },
      hi: { specKey: 'पैकेजिंग', specValue: '25 किग्रा / 50 किग्रा बोरी' },
      vi: { specKey: 'Đóng gói', specValue: 'Bao 25kg / 50kg' },
    },
  },
  'coconut-timber': {
    'Moisture Content': {
      id: { specKey: 'Kadar Air' },
      zh: { specKey: '水分含量' },
      th: { specKey: 'ปริมาณความชื้น' },
      hi: { specKey: 'नमी की मात्रा' },
      vi: { specKey: 'Độ ẩm' },
    },
    Length: {
      id: { specKey: 'Panjang', specValue: 'Sesuai spesifikasi pesanan' },
      zh: { specKey: '长度', specValue: '按订单规格' },
      th: { specKey: 'ความยาว', specValue: 'ตามข้อกำหนดของคำสั่งซื้อ' },
      hi: { specKey: 'लंबाई', specValue: 'ऑर्डर विनिर्देश के अनुसार' },
      vi: { specKey: 'Chiều dài', specValue: 'Theo thông số đơn hàng' },
    },
    Packaging: {
      id: { specKey: 'Kemasan', specValue: 'Diikat / Dipeti' },
      zh: { specKey: '包装', specValue: '捆扎/装箱' },
      th: { specKey: 'บรรจุภัณฑ์', specValue: 'มัดรวม / ใส่ลัง' },
      hi: { specKey: 'पैकेजिंग', specValue: 'बंडल / क्रेट में' },
      vi: { specKey: 'Đóng gói', specValue: 'Bó / Đóng thùng' },
    },
  },
};

// ── Packaging/Application entries (same 2 canonical entries repeat per product) ──
const PACKAGING_APP_TRANSLATIONS: Record<'packaging' | 'application', T> = {
  packaging: {
    id: {
      title: 'Kemasan Ekspor',
      description:
        'Dikemas sesuai spesifikasi pembeli dan standar ekspor untuk menjaga kualitas produk selama pengiriman.',
    },
    zh: {
      title: '出口包装',
      description: '根据买家规格和出口标准包装，以在运输过程中保护产品质量。',
    },
    th: {
      title: 'บรรจุภัณฑ์เพื่อการส่งออก',
      description: 'บรรจุตามข้อกำหนดของผู้ซื้อและมาตรฐานการส่งออกเพื่อปกป้องคุณภาพสินค้าระหว่างการขนส่ง',
    },
    hi: {
      title: 'निर्यात पैकेजिंग',
      description: 'शिपमेंट के दौरान उत्पाद की गुणवत्ता की सुरक्षा के लिए खरीदार विनिर्देश और निर्यात मानकों के अनुसार पैक किया गया।',
    },
    vi: {
      title: 'Đóng Gói Xuất Khẩu',
      description:
        'Được đóng gói theo thông số kỹ thuật của người mua và tiêu chuẩn xuất khẩu để bảo vệ chất lượng sản phẩm trong quá trình vận chuyển.',
    },
  },
  application: {
    id: {
      title: 'Aplikasi Industri',
      description: 'Digunakan dalam manufaktur makanan, industri, dan perdagangan ekspor tergantung pada jenis produk.',
    },
    zh: {
      title: '行业应用',
      description: '根据产品类型，广泛应用于食品制造、工业和出口贸易领域。',
    },
    th: {
      title: 'การประยุกต์ใช้ในอุตสาหกรรม',
      description: 'ใช้ในการผลิตอาหาร อุตสาหกรรม และการค้าส่งออก ขึ้นอยู่กับประเภทของผลิตภัณฑ์',
    },
    hi: {
      title: 'उद्योग अनुप्रयोग',
      description: 'उत्पाद के प्रकार के आधार पर खाद्य निर्माण, औद्योगिक और निर्यात व्यापार अनुप्रयोगों में उपयोग किया जाता है।',
    },
    vi: {
      title: 'Ứng Dụng Công Nghiệp',
      description: 'Được sử dụng trong sản xuất thực phẩm, công nghiệp và giao dịch xuất khẩu tùy theo loại sản phẩm.',
    },
  },
};

// ── Articles (keyed by title) ──────────────────────────────────────────────
const ARTICLE_TRANSLATIONS: Record<string, T> = {
  'Understanding Coconut Export Quality Standards': {
    id: {
      title: 'Memahami Standar Kualitas Ekspor Kelapa',
      category: 'Wawasan Industri',
      excerpt: 'Melihat tolok ukur kualitas yang diharapkan pembeli internasional dari eksportir produk kelapa.',
      content:
        'Pembeli internasional menilai pemasok produk kelapa berdasarkan konsistensi, kadar air, dan integritas kemasan. Artikel ini menguraikan pertimbangan kualitas umum yang relevan untuk pengiriman Kelapa Setengah Terkupas, Kopra, Arang Tempurung Kelapa, dan Kayu Kelapa.',
    },
    zh: {
      title: '了解椰子出口质量标准',
      category: '行业洞察',
      excerpt: '了解国际买家对椰子产品出口商的质量标准期望。',
      content:
        '国际买家根据一致性、水分含量和包装完整性来评估椰子产品供应商。本文概述了与半去壳椰子、椰干、椰壳炭和椰木货运相关的一般质量考量因素。',
    },
    th: {
      title: 'ทำความเข้าใจมาตรฐานคุณภาพการส่งออกมะพร้าว',
      category: 'ข้อมูลเชิงลึกอุตสาหกรรม',
      excerpt: 'มุมมองเกี่ยวกับเกณฑ์คุณภาพที่ผู้ซื้อต่างประเทศคาดหวังจากผู้ส่งออกผลิตภัณฑ์มะพร้าว',
      content:
        'ผู้ซื้อต่างประเทศประเมินซัพพลายเออร์ผลิตภัณฑ์มะพร้าวจากความสม่ำเสมอ ปริมาณความชื้น และความสมบูรณ์ของบรรจุภัณฑ์ บทความนี้สรุปข้อพิจารณาด้านคุณภาพทั่วไปที่เกี่ยวข้องกับการจัดส่งมะพร้าวปอกเปลือกครึ่งลูก มะพร้าวแห้ง ถ่านกะลามะพร้าว และไม้มะพร้าว',
    },
    hi: {
      title: 'नारियल निर्यात गुणवत्ता मानकों को समझना',
      category: 'उद्योग अंतर्दृष्टि',
      excerpt: 'नारियल उत्पाद निर्यातकों से अंतरराष्ट्रीय खरीदार जिन गुणवत्ता मानदंडों की अपेक्षा करते हैं, उन पर एक नज़र।',
      content:
        'अंतरराष्ट्रीय खरीदार नारियल उत्पाद आपूर्तिकर्ताओं का मूल्यांकन निरंतरता, नमी की मात्रा और पैकेजिंग अखंडता के आधार पर करते हैं। यह लेख अर्ध-छिलका नारियल, कोपरा, नारियल खोल चारकोल और नारियल की लकड़ी की शिपमेंट से संबंधित सामान्य गुणवत्ता विचारों को रेखांकित करता है।',
    },
    vi: {
      title: 'Hiểu Về Tiêu Chuẩn Chất Lượng Xuất Khẩu Dừa',
      category: 'Thông Tin Ngành',
      excerpt: 'Tìm hiểu các tiêu chuẩn chất lượng mà người mua quốc tế mong đợi từ các nhà xuất khẩu sản phẩm dừa.',
      content:
        'Người mua quốc tế đánh giá nhà cung cấp sản phẩm dừa dựa trên tính nhất quán, độ ẩm và tính toàn vẹn của bao bì. Bài viết này trình bày các cân nhắc chung về chất lượng liên quan đến các lô hàng Dừa Bóc Vỏ Một Phần, Copra, Than Gáo Dừa và Gỗ Dừa.',
    },
  },
  'How Coconut Shell Charcoal Is Produced': {
    id: {
      title: 'Bagaimana Arang Tempurung Kelapa Diproduksi',
      category: 'Proses Produksi',
      excerpt: 'Gambaran umum perjalanan produksi dari tempurung kelapa hingga arang siap ekspor.',
      content:
        'Produksi arang tempurung kelapa melibatkan pemilihan tempurung yang cermat, karbonisasi terkontrol, dan penyortiran kualitas sebelum dikemas untuk ekspor. Memahami proses ini membantu pembeli menilai keandalan pemasok.',
    },
    zh: {
      title: '椰壳炭是如何生产的',
      category: '生产工艺',
      excerpt: '从椰壳到出口用炭的生产历程概览。',
      content:
        '椰壳炭生产涉及精心的壳料筛选、受控碳化以及包装出口前的质量分拣。了解这一过程有助于买家评估供应商的可靠性。',
    },
    th: {
      title: 'ถ่านกะลามะพร้าวผลิตขึ้นอย่างไร',
      category: 'กระบวนการผลิต',
      excerpt: 'ภาพรวมของกระบวนการผลิตตั้งแต่กะลามะพร้าวจนถึงถ่านพร้อมส่งออก',
      content:
        'การผลิตถ่านกะลามะพร้าวเกี่ยวข้องกับการคัดเลือกกะลาอย่างพิถีพิถัน การเผาถ่านแบบควบคุม และการคัดคุณภาพก่อนบรรจุเพื่อส่งออก การทำความเข้าใจกระบวนการนี้ช่วยให้ผู้ซื้อประเมินความน่าเชื่อถือของซัพพลายเออร์ได้',
    },
    hi: {
      title: 'नारियल खोल चारकोल कैसे बनाया जाता है',
      category: 'उत्पादन प्रक्रिया',
      excerpt: 'नारियल के खोल से निर्यात के लिए तैयार चारकोल तक के उत्पादन की यात्रा का अवलोकन।',
      content:
        'नारियल खोल चारकोल उत्पादन में सावधानीपूर्वक खोल चयन, नियंत्रित कार्बनीकरण, और निर्यात हेतु पैकेजिंग से पहले गुणवत्ता छंटाई शामिल है। इस प्रक्रिया को समझने से खरीदारों को आपूर्तिकर्ता की विश्वसनीयता का आकलन करने में मदद मिलती है।',
    },
    vi: {
      title: 'Quy Trình Sản Xuất Than Gáo Dừa',
      category: 'Quy Trình Sản Xuất',
      excerpt: 'Tổng quan về hành trình sản xuất từ gáo dừa đến than sẵn sàng xuất khẩu.',
      content:
        'Sản xuất than gáo dừa bao gồm việc lựa chọn gáo cẩn thận, than hóa có kiểm soát và phân loại chất lượng trước khi đóng gói xuất khẩu. Hiểu quy trình này giúp người mua đánh giá độ tin cậy của nhà cung cấp.',
    },
  },
  'Why Buyers Choose Indonesian Coconut Suppliers': {
    id: {
      title: 'Mengapa Pembeli Memilih Pemasok Kelapa Indonesia',
      category: 'Wawasan Industri',
      excerpt: 'Industri kelapa Indonesia menawarkan pasokan yang konsisten bagi pembeli B2B global.',
      content:
        'Wilayah penghasil kelapa di Indonesia menyediakan rantai pasokan yang stabil bagi eksportir. Artikel ini membahas faktor-faktor yang menjadikan pemasok Indonesia pilihan yang andal bagi importir, distributor, dan produsen makanan.',
    },
    zh: {
      title: '买家为何选择印尼椰子供应商',
      category: '行业洞察',
      excerpt: '印尼椰子产业为全球B2B买家提供稳定的供应。',
      content:
        '印尼的椰子产区为出口商提供了稳定的供应链。本文探讨了使印尼供应商成为进口商、分销商和食品制造商可靠选择的各项因素。',
    },
    th: {
      title: 'เหตุใดผู้ซื้อจึงเลือกซัพพลายเออร์มะพร้าวอินโดนีเซีย',
      category: 'ข้อมูลเชิงลึกอุตสาหกรรม',
      excerpt: 'อุตสาหกรรมมะพร้าวของอินโดนีเซียมอบอุปทานที่สม่ำเสมอสำหรับผู้ซื้อ B2B ทั่วโลก',
      content:
        'พื้นที่ผลิตมะพร้าวของอินโดนีเซียมอบห่วงโซ่อุปทานที่มั่นคงสำหรับผู้ส่งออก บทความนี้กล่าวถึงปัจจัยที่ทำให้ซัพพลายเออร์อินโดนีเซียเป็นตัวเลือกที่น่าเชื่อถือสำหรับผู้นำเข้า ผู้จัดจำหน่าย และผู้ผลิตอาหาร',
    },
    hi: {
      title: 'खरीदार इंडोनेशियाई नारियल आपूर्तिकर्ताओं को क्यों चुनते हैं',
      category: 'उद्योग अंतर्दृष्टि',
      excerpt: 'इंडोनेशिया का नारियल उद्योग वैश्विक B2B खरीदारों के लिए निरंतर आपूर्ति प्रदान करता है।',
      content:
        'इंडोनेशिया के नारियल उत्पादक क्षेत्र निर्यातकों के लिए एक स्थिर आपूर्ति श्रृंखला प्रदान करते हैं। यह लेख उन कारकों पर चर्चा करता है जो इंडोनेशियाई आपूर्तिकर्ताओं को आयातकों, वितरकों और खाद्य निर्माताओं के लिए एक विश्वसनीय विकल्प बनाते हैं।',
    },
    vi: {
      title: 'Vì Sao Người Mua Chọn Nhà Cung Cấp Dừa Indonesia',
      category: 'Thông Tin Ngành',
      excerpt: 'Ngành công nghiệp dừa của Indonesia mang lại nguồn cung ổn định cho người mua B2B toàn cầu.',
      content:
        'Các vùng sản xuất dừa của Indonesia cung cấp chuỗi cung ứng ổn định cho các nhà xuất khẩu. Bài viết này thảo luận về các yếu tố khiến nhà cung cấp Indonesia trở thành lựa chọn đáng tin cậy cho nhà nhập khẩu, nhà phân phối và nhà sản xuất thực phẩm.',
    },
  },
};

// ── Facilities (keyed by name) ─────────────────────────────────────────────
const FACILITY_TRANSLATIONS: Record<string, T> = {
  Warehouse: {
    id: { name: 'Gudang', description: 'Penyimpanan yang sesuai iklim untuk bahan baku dan produk kemasan.' },
    zh: { name: '仓库', description: '适合气候条件的原材料和成品存储。' },
    th: { name: 'คลังสินค้า', description: 'พื้นที่จัดเก็บที่เหมาะสมกับสภาพอากาศสำหรับวัตถุดิบและสินค้าที่บรรจุแล้ว' },
    hi: { name: 'गोदाम', description: 'पैक और कच्चे माल के लिए जलवायु-उपयुक्त भंडारण।' },
    vi: { name: 'Nhà Kho', description: 'Kho lưu trữ phù hợp khí hậu cho nguyên liệu thô và hàng đã đóng gói.' },
  },
  'Loading Area': {
    id: { name: 'Area Bongkar Muat', description: 'Area khusus untuk memuat dan membongkar pengiriman.' },
    zh: { name: '装卸区', description: '专用于装卸货物的区域。' },
    th: { name: 'พื้นที่ขนถ่ายสินค้า', description: 'พื้นที่เฉพาะสำหรับขนถ่ายสินค้าขึ้นและลง' },
    hi: { name: 'लोडिंग क्षेत्र', description: 'शिपमेंट लोड और अनलोड करने के लिए समर्पित क्षेत्र।' },
    vi: { name: 'Khu Vực Xếp Dỡ', description: 'Khu vực chuyên dụng để xếp dỡ hàng hóa.' },
  },
  Forklift: {
    id: { name: 'Forklift', description: 'Peralatan penanganan material untuk operasional gudang yang efisien.' },
    zh: { name: '叉车', description: '用于高效仓库运营的物料搬运设备。' },
    th: { name: 'รถโฟล์คลิฟท์', description: 'อุปกรณ์เคลื่อนย้ายวัสดุเพื่อการดำเนินงานคลังสินค้าที่มีประสิทธิภาพ' },
    hi: { name: 'फोर्कलिफ्ट', description: 'कुशल गोदाम संचालन के लिए सामग्री-हैंडलिंग उपकरण।' },
    vi: { name: 'Xe Nâng', description: 'Thiết bị xử lý vật liệu cho hoạt động kho vận hiệu quả.' },
  },
  Weighbridge: {
    id: { name: 'Jembatan Timbang', description: 'Stasiun penimbangan di lokasi untuk catatan pengiriman yang akurat.' },
    zh: { name: '地磅', description: '现场称重站，确保货运记录准确。' },
    th: { name: 'เครื่องชั่งรถบรรทุก', description: 'สถานีชั่งน้ำหนักในสถานที่เพื่อบันทึกการจัดส่งที่แม่นยำ' },
    hi: { name: 'वेटब्रिज', description: 'सटीक शिपमेंट रिकॉर्ड के लिए ऑन-साइट वजन स्टेशन।' },
    vi: { name: 'Trạm Cân', description: 'Trạm cân tại chỗ để ghi nhận lô hàng chính xác.' },
  },
  'Quality Control': {
    id: { name: 'Kontrol Kualitas', description: 'Stasiun inspeksi untuk memverifikasi standar kualitas produk.' },
    zh: { name: '质量控制', description: '用于验证产品质量标准的检验站。' },
    th: { name: 'การควบคุมคุณภาพ', description: 'สถานีตรวจสอบเพื่อยืนยันมาตรฐานคุณภาพผลิตภัณฑ์' },
    hi: { name: 'गुणवत्ता नियंत्रण', description: 'उत्पाद गुणवत्ता मानकों की पुष्टि के लिए निरीक्षण स्टेशन।' },
    vi: { name: 'Kiểm Soát Chất Lượng', description: 'Trạm kiểm tra để xác minh tiêu chuẩn chất lượng sản phẩm.' },
  },
  'Container Stuffing': {
    id: { name: 'Stuffing Kontainer', description: 'Fasilitas untuk memuat kontainer ekspor dengan aman.' },
    zh: { name: '集装箱装柜', description: '安全装载出口集装箱的设施。' },
    th: { name: 'การบรรจุตู้คอนเทนเนอร์', description: 'สถานที่สำหรับบรรจุตู้คอนเทนเนอร์ส่งออกอย่างปลอดภัย' },
    hi: { name: 'कंटेनर स्टफिंग', description: 'निर्यात कंटेनरों को सुरक्षित रूप से लोड करने की सुविधा।' },
    vi: { name: 'Đóng Hàng Container', description: 'Cơ sở để đóng hàng container xuất khẩu an toàn.' },
  },
};

// ── Production steps (keyed by title) ──────────────────────────────────────
const PRODUCTION_STEP_TRANSLATIONS: Record<string, T> = {
  Farmer: {
    id: { title: 'Petani', description: 'Kelapa bersumber dari mitra petani lokal yang terpercaya.' },
    zh: { title: '农户', description: '椰子采购自值得信赖的当地农户合作伙伴。' },
    th: { title: 'เกษตรกร', description: 'มะพร้าวมาจากพันธมิตรเกษตรกรท้องถิ่นที่เชื่อถือได้' },
    hi: { title: 'किसान', description: 'नारियल विश्वसनीय स्थानीय किसान भागीदारों से प्राप्त किए जाते हैं।' },
    vi: { title: 'Nông Dân', description: 'Dừa được thu mua từ các đối tác nông dân địa phương đáng tin cậy.' },
  },
  Receiving: {
    id: { title: 'Penerimaan', description: 'Bahan baku diterima dan dicatat di fasilitas kami.' },
    zh: { title: '接收', description: '原材料在我们的工厂接收并登记。' },
    th: { title: 'การรับวัตถุดิบ', description: 'วัตถุดิบได้รับและบันทึกที่โรงงานของเรา' },
    hi: { title: 'प्राप्ति', description: 'कच्चा माल हमारी सुविधा में प्राप्त और दर्ज किया जाता है।' },
    vi: { title: 'Tiếp Nhận', description: 'Nguyên liệu thô được tiếp nhận và ghi nhận tại cơ sở của chúng tôi.' },
  },
  Sorting: {
    id: { title: 'Sortasi', description: 'Kelapa disortir berdasarkan ukuran, kualitas, dan kematangan.' },
    zh: { title: '分拣', description: '椰子按尺寸、质量和成熟度分拣。' },
    th: { title: 'การคัดแยก', description: 'มะพร้าวถูกคัดแยกตามขนาด คุณภาพ และความสุก' },
    hi: { title: 'छंटाई', description: 'नारियल को आकार, गुणवत्ता और पकने के अनुसार छांटा जाता है।' },
    vi: { title: 'Phân Loại', description: 'Dừa được phân loại theo kích thước, chất lượng và độ chín.' },
  },
  'Quality Control': {
    id: { title: 'Kontrol Kualitas', description: 'Setiap batch melewati pemeriksaan kualitas sebelum diproses.' },
    zh: { title: '质量控制', description: '每批产品在加工前都要通过质量检查。' },
    th: { title: 'การควบคุมคุณภาพ', description: 'แต่ละล็อตผ่านการตรวจสอบคุณภาพก่อนดำเนินการแปรรูป' },
    hi: { title: 'गुणवत्ता नियंत्रण', description: 'प्रसंस्करण से पहले प्रत्येक बैच गुणवत्ता जांच से गुजरता है।' },
    vi: { title: 'Kiểm Soát Chất Lượng', description: 'Mỗi lô hàng đều qua kiểm tra chất lượng trước khi chế biến.' },
  },
  Packing: {
    id: { title: 'Pengemasan', description: 'Produk dikemas sesuai spesifikasi pembeli.' },
    zh: { title: '包装', description: '产品根据买家规格进行包装。' },
    th: { title: 'การบรรจุ', description: 'ผลิตภัณฑ์ถูกบรรจุตามข้อกำหนดของผู้ซื้อ' },
    hi: { title: 'पैकिंग', description: 'उत्पादों को खरीदार विनिर्देशों के अनुसार पैक किया जाता है।' },
    vi: { title: 'Đóng Gói', description: 'Sản phẩm được đóng gói theo thông số kỹ thuật của người mua.' },
  },
  Storage: {
    id: { title: 'Penyimpanan', description: 'Barang yang telah dikemas disimpan di lingkungan gudang yang terkontrol.' },
    zh: { title: '仓储', description: '包装好的货物储存在受控的仓库环境中。' },
    th: { title: 'การจัดเก็บ', description: 'สินค้าที่บรรจุแล้วถูกจัดเก็บในสภาพแวดล้อมคลังสินค้าที่ควบคุมได้' },
    hi: { title: 'भंडारण', description: 'पैक किए गए माल को नियंत्रित गोदाम वातावरण में संग्रहीत किया जाता है।' },
    vi: { title: 'Lưu Kho', description: 'Hàng hóa đã đóng gói được lưu trữ trong môi trường kho có kiểm soát.' },
  },
  Stuffing: {
    id: { title: 'Stuffing', description: 'Kontainer dimuat dan diisi untuk pengiriman ekspor.' },
    zh: { title: '装柜', description: '集装箱装载并填装以备出口运输。' },
    th: { title: 'การบรรจุตู้คอนเทนเนอร์', description: 'ตู้คอนเทนเนอร์ถูกบรรจุและเตรียมพร้อมสำหรับการส่งออก' },
    hi: { title: 'स्टफिंग', description: 'कंटेनरों को निर्यात शिपमेंट के लिए लोड और स्टफ किया जाता है।' },
    vi: { title: 'Đóng Container', description: 'Container được xếp và đóng hàng để xuất khẩu.' },
  },
  Export: {
    id: { title: 'Ekspor', description: 'Barang dikirim ke pembeli internasional.' },
    zh: { title: '出口', description: '货物运往国际买家。' },
    th: { title: 'การส่งออก', description: 'สินค้าถูกจัดส่งไปยังผู้ซื้อต่างประเทศ' },
    hi: { title: 'निर्यात', description: 'माल अंतरराष्ट्रीय खरीदारों को भेजा जाता है।' },
    vi: { title: 'Xuất Khẩu', description: 'Hàng hóa được vận chuyển đến người mua quốc tế.' },
  },
};

// ── Homepage statistics (keyed by label) ────────────────────────────────────
const STAT_TRANSLATIONS: Record<string, T> = {
  'Products Exported': {
    id: { label: 'Produk Diekspor' },
    zh: { label: '出口产品' },
    th: { label: 'ผลิตภัณฑ์ที่ส่งออก' },
    hi: { label: 'निर्यातित उत्पाद' },
    vi: { label: 'Sản Phẩm Xuất Khẩu' },
  },
  'Production Capacity': {
    id: { label: 'Kapasitas Produksi', value: '500 Ton / Bulan' },
    zh: { label: '生产能力', value: '500吨/月' },
    th: { label: 'กำลังการผลิต', value: '500 ตัน/เดือน' },
    hi: { label: 'उत्पादन क्षमता', value: '500 टन / माह' },
    vi: { label: 'Công Suất Sản Xuất', value: '500 Tấn / Tháng' },
  },
  Warehouses: {
    id: { label: 'Gudang' },
    zh: { label: '仓库数量' },
    th: { label: 'คลังสินค้า' },
    hi: { label: 'गोदाम' },
    vi: { label: 'Nhà Kho' },
  },
  'Years of Experience': {
    id: { label: 'Tahun Pengalaman' },
    zh: { label: '从业年限' },
    th: { label: 'ปีแห่งประสบการณ์' },
    hi: { label: 'वर्षों का अनुभव' },
    vi: { label: 'Năm Kinh Nghiệm' },
  },
  'Containers Shipped': {
    id: { label: 'Kontainer Terkirim', value: '1.200+' },
    zh: { label: '已发运集装箱' },
    th: { label: 'ตู้คอนเทนเนอร์ที่จัดส่ง' },
    hi: { label: 'भेजे गए कंटेनर' },
    vi: { label: 'Container Đã Vận Chuyển', value: '1.200+' },
  },
};

// ── FAQs (keyed by question) ────────────────────────────────────────────────
const FAQ_TRANSLATIONS: Record<string, T> = {
  'What products does CV Putri Palma Nusantara export?': {
    id: {
      question: 'Produk apa saja yang diekspor oleh CV Putri Palma Nusantara?',
      answer: 'Kami mengekspor Kelapa Setengah Terkupas, Kopra, Arang Tempurung Kelapa, dan Kayu Kelapa ke pembeli di seluruh dunia.',
    },
    zh: {
      question: 'CV Putri Palma Nusantara 出口哪些产品？',
      answer: '我们向全球买家出口半去壳椰子、椰干、椰壳炭和椰木。',
    },
    th: {
      question: 'CV Putri Palma Nusantara ส่งออกผลิตภัณฑ์อะไรบ้าง?',
      answer: 'เราส่งออกมะพร้าวปอกเปลือกครึ่งลูก มะพร้าวแห้ง ถ่านกะลามะพร้าว และไม้มะพร้าวไปยังผู้ซื้อทั่วโลก',
    },
    hi: {
      question: 'CV Putri Palma Nusantara कौन से उत्पाद निर्यात करता है?',
      answer: 'हम दुनिया भर के खरीदारों को अर्ध-छिलका नारियल, कोपरा, नारियल खोल चारकोल और नारियल की लकड़ी निर्यात करते हैं।',
    },
    vi: {
      question: 'CV Putri Palma Nusantara xuất khẩu những sản phẩm nào?',
      answer: 'Chúng tôi xuất khẩu Dừa Bóc Vỏ Một Phần, Copra, Than Gáo Dừa và Gỗ Dừa cho người mua trên toàn thế giới.',
    },
  },
  'Which countries do you currently ship to?': {
    id: {
      question: 'Negara mana saja yang saat ini menjadi tujuan pengiriman Anda?',
      answer: 'Tujuan ekspor utama kami meliputi Thailand, Malaysia, Tiongkok, India, Timur Tengah, dan Eropa.',
    },
    zh: {
      question: '贵公司目前发货到哪些国家？',
      answer: '我们的主要出口目的地包括泰国、马来西亚、中国、印度、中东和欧洲。',
    },
    th: {
      question: 'ปัจจุบันคุณส่งสินค้าไปยังประเทศใดบ้าง?',
      answer: 'จุดหมายปลายทางการส่งออกหลักของเรา ได้แก่ ไทย มาเลเซีย จีน อินเดีย ตะวันออกกลาง และยุโรป',
    },
    hi: {
      question: 'आप वर्तमान में किन देशों में शिपमेंट भेजते हैं?',
      answer: 'हमारे मुख्य निर्यात गंतव्यों में थाईलैंड, मलेशिया, चीन, भारत, मध्य पूर्व और यूरोप शामिल हैं।',
    },
    vi: {
      question: 'Hiện tại quý công ty vận chuyển đến những quốc gia nào?',
      answer: 'Các điểm đến xuất khẩu chính của chúng tôi bao gồm Thái Lan, Malaysia, Trung Quốc, Ấn Độ, Trung Đông và châu Âu.',
    },
  },
  'What is your minimum order quantity (MOQ)?': {
    id: {
      question: 'Berapa jumlah pesanan minimum (MOQ) Anda?',
      answer:
        'MOQ bervariasi tergantung produk dan kemasan. Silakan ajukan Permintaan Penawaran dengan volume target Anda dan tim kami akan merespons dengan detailnya.',
    },
    zh: {
      question: '贵公司的最低起订量（MOQ）是多少？',
      answer: '最低起订量因产品和包装而异。请提交索取报价请求并注明目标数量，我们的团队会回复详细信息。',
    },
    th: {
      question: 'ปริมาณการสั่งซื้อขั้นต่ำ (MOQ) ของคุณคือเท่าไร?',
      answer: 'MOQ แตกต่างกันไปตามผลิตภัณฑ์และบรรจุภัณฑ์ กรุณาส่งคำขอใบเสนอราคาพร้อมปริมาณเป้าหมายของคุณ ทีมงานของเราจะตอบกลับพร้อมรายละเอียด',
    },
    hi: {
      question: 'आपकी न्यूनतम ऑर्डर मात्रा (MOQ) क्या है?',
      answer:
        'MOQ उत्पाद और पैकेजिंग के अनुसार भिन्न होता है। कृपया अपनी लक्षित मात्रा के साथ कोटेशन अनुरोध सबमिट करें और हमारी टीम विवरण के साथ जवाब देगी।',
    },
    vi: {
      question: 'Số lượng đặt hàng tối thiểu (MOQ) của quý công ty là bao nhiêu?',
      answer:
        'MOQ khác nhau tùy theo sản phẩm và bao bì. Vui lòng gửi Yêu Cầu Báo Giá với số lượng mục tiêu của bạn và đội ngũ của chúng tôi sẽ phản hồi chi tiết.',
    },
  },
  'Can I request a product sample before placing an order?': {
    id: {
      question: 'Bisakah saya meminta sampel produk sebelum melakukan pemesanan?',
      answer:
        'Ya, permintaan sampel dapat diatur. Silakan hubungi kami melalui formulir Permintaan Penawaran atau WhatsApp untuk membahas ketentuan sampel.',
    },
    zh: {
      question: '下单前我可以申请产品样品吗？',
      answer: '可以，我们可以安排样品申请。请通过索取报价表单或WhatsApp联系我们讨论样品条款。',
    },
    th: {
      question: 'ฉันสามารถขอตัวอย่างสินค้าก่อนสั่งซื้อได้หรือไม่?',
      answer: 'ได้ครับ/ค่ะ สามารถจัดเตรียมตัวอย่างได้ กรุณาติดต่อเราผ่านแบบฟอร์มขอใบเสนอราคาหรือ WhatsApp เพื่อหารือเงื่อนไขตัวอย่าง',
    },
    hi: {
      question: 'क्या मैं ऑर्डर देने से पहले उत्पाद नमूने का अनुरोध कर सकता हूं?',
      answer: 'हां, नमूना अनुरोध की व्यवस्था की जा सकती है। कृपया नमूना शर्तों पर चर्चा के लिए कोटेशन अनुरोध फॉर्म या व्हाट्सएप के माध्यम से हमसे संपर्क करें।',
    },
    vi: {
      question: 'Tôi có thể yêu cầu mẫu sản phẩm trước khi đặt hàng không?',
      answer: 'Có, chúng tôi có thể sắp xếp yêu cầu mẫu. Vui lòng liên hệ với chúng tôi qua biểu mẫu Yêu Cầu Báo Giá hoặc WhatsApp để thảo luận về điều khoản lấy mẫu.',
    },
  },
  'How long does production and shipment typically take?': {
    id: {
      question: 'Berapa lama waktu produksi dan pengiriman biasanya berlangsung?',
      answer:
        'Waktu tunggu tergantung pada produk dan volume pesanan. Tim kami akan memberikan perkiraan jadwal produksi dan pengiriman setelah meninjau permintaan penawaran Anda.',
    },
    zh: {
      question: '生产和运输通常需要多长时间？',
      answer: '交货时间取决于产品和订单量。我们的团队在审核您的报价请求后，会提供预计的生产和运输时间表。',
    },
    th: {
      question: 'โดยทั่วไปการผลิตและการจัดส่งใช้เวลานานเท่าใด?',
      answer: 'ระยะเวลาดำเนินการขึ้นอยู่กับผลิตภัณฑ์และปริมาณการสั่งซื้อ ทีมงานของเราจะให้กำหนดเวลาการผลิตและการจัดส่งโดยประมาณหลังจากตรวจสอบคำขอใบเสนอราคาของคุณ',
    },
    hi: {
      question: 'उत्पादन और शिपमेंट में आमतौर पर कितना समय लगता है?',
      answer: 'लीड टाइम उत्पाद और ऑर्डर मात्रा पर निर्भर करता है। आपके कोटेशन अनुरोध की समीक्षा के बाद हमारी टीम अनुमानित उत्पादन और शिपिंग समयरेखा प्रदान करेगी।',
    },
    vi: {
      question: 'Thời gian sản xuất và vận chuyển thường mất bao lâu?',
      answer:
        'Thời gian giao hàng phụ thuộc vào sản phẩm và số lượng đặt hàng. Đội ngũ của chúng tôi sẽ cung cấp thời gian sản xuất và vận chuyển dự kiến sau khi xem xét yêu cầu báo giá của bạn.',
    },
  },
};

// ── Site settings (keyed by key) — proper nouns (company_name, whatsapp_number,
// contact_email, contact_phone, address) are intentionally left untranslated. ──
const SETTING_TRANSLATIONS: Record<string, T> = {
  operating_hours: {
    id: { value: 'Senin–Sabtu, 08.00–17.00 (GMT+7)' },
    zh: { value: '周一至周六，08:00–17:00（GMT+7）' },
    th: { value: 'จันทร์–เสาร์ 08:00–17:00 น. (GMT+7)' },
    hi: { value: 'सोमवार–शनिवार, 08:00–17:00 (GMT+7)' },
    vi: { value: 'Thứ Hai–Thứ Bảy, 08:00–17:00 (GMT+7)' },
  },
  default_meta_title: {
    id: { value: 'CV Putri Palma Nusantara — Eksportir Produk Kelapa Indonesia' },
    zh: { value: 'CV Putri Palma Nusantara — 印度尼西亚椰子产品出口商' },
    th: { value: 'CV Putri Palma Nusantara — ผู้ส่งออกผลิตภัณฑ์มะพร้าวอินโดนีเซีย' },
    hi: { value: 'CV Putri Palma Nusantara — इंडोनेशियाई नारियल उत्पाद निर्यातक' },
    vi: { value: 'CV Putri Palma Nusantara — Nhà Xuất Khẩu Sản Phẩm Dừa Indonesia' },
  },
  default_meta_description: {
    id: {
      value:
        'CV Putri Palma Nusantara mengekspor Kelapa Setengah Terkupas, Kopra, Arang Tempurung Kelapa, dan Kayu Kelapa ke pembeli di Asia, Timur Tengah, dan Eropa.',
    },
    zh: {
      value: 'CV Putri Palma Nusantara 向亚洲、中东和欧洲的买家出口半去壳椰子、椰干、椰壳炭和椰木。',
    },
    th: {
      value:
        'CV Putri Palma Nusantara ส่งออกมะพร้าวปอกเปลือกครึ่งลูก มะพร้าวแห้ง ถ่านกะลามะพร้าว และไม้มะพร้าว ให้แก่ผู้ซื้อในเอเชีย ตะวันออกกลาง และยุโรป',
    },
    hi: {
      value:
        'CV Putri Palma Nusantara एशिया, मध्य पूर्व और यूरोप के खरीदारों को अर्ध-छिलका नारियल, कोपरा, नारियल खोल चारकोल और नारियल की लकड़ी निर्यात करता है।',
    },
    vi: {
      value: 'CV Putri Palma Nusantara xuất khẩu Dừa Bóc Vỏ Một Phần, Copra, Than Gáo Dừa và Gỗ Dừa cho người mua tại châu Á, Trung Đông và châu Âu.',
    },
  },
};

async function main() {
  let updated = 0;

  for (const [slug, translations] of Object.entries(PRODUCT_TRANSLATIONS)) {
    const result = await prisma.product.updateMany({ where: { slug }, data: { translations } });
    updated += result.count;
  }

  for (const [slug, specs] of Object.entries(SPEC_TRANSLATIONS)) {
    const product = await prisma.product.findUnique({ where: { slug }, select: { id: true } });
    if (!product) continue;
    for (const [specKey, translations] of Object.entries(specs)) {
      const result = await prisma.productSpecification.updateMany({
        where: { productId: product.id, specKey },
        data: { translations },
      });
      updated += result.count;
    }
  }

  for (const slug of Object.keys(PRODUCT_TRANSLATIONS)) {
    const product = await prisma.product.findUnique({ where: { slug }, select: { id: true } });
    if (!product) continue;
    for (const type of ['packaging', 'application'] as const) {
      const result = await prisma.productPackagingApplication.updateMany({
        where: { productId: product.id, type },
        data: { translations: PACKAGING_APP_TRANSLATIONS[type] },
      });
      updated += result.count;
    }
  }

  for (const [title, translations] of Object.entries(ARTICLE_TRANSLATIONS)) {
    const result = await prisma.article.updateMany({ where: { title }, data: { translations } });
    updated += result.count;
  }

  for (const [name, translations] of Object.entries(FACILITY_TRANSLATIONS)) {
    const result = await prisma.facility.updateMany({ where: { name }, data: { translations } });
    updated += result.count;
  }

  for (const [title, translations] of Object.entries(PRODUCTION_STEP_TRANSLATIONS)) {
    const result = await prisma.productionStep.updateMany({ where: { title }, data: { translations } });
    updated += result.count;
  }

  for (const [label, translations] of Object.entries(STAT_TRANSLATIONS)) {
    const result = await prisma.homepageStatistic.updateMany({ where: { label }, data: { translations } });
    updated += result.count;
  }

  for (const [question, translations] of Object.entries(FAQ_TRANSLATIONS)) {
    const result = await prisma.faq.updateMany({ where: { question }, data: { translations } });
    updated += result.count;
  }

  for (const [key, translations] of Object.entries(SETTING_TRANSLATIONS)) {
    const result = await prisma.siteSetting.updateMany({ where: { key }, data: { translations } });
    updated += result.count;
  }

  console.log(`Translated ${updated} rows across all content models.`);
  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
