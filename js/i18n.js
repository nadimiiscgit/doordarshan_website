// ============================================================
// Doordarshan Electronics — Internationalization (i18n)
// English (en) & Marathi (mr) Bilingual Support
// ============================================================

const currentYear = new Date().getFullYear();

const TRANSLATIONS = {
  en: {
    // Topbar
    free_delivery: "Safe & Fast Doorstep Delivery",
    easy_emi: "Easy EMI Available",
    whatsapp_contact: "WhatsApp: 7020209281",
    call_btn: "Call",
    wa_btn: "WhatsApp",
    cart_btn: "Cart",
    
    // Header & Tagline
    store_tagline: "Premium Electronics Store · Maharashtra",
    search_placeholder: "Search for TVs, ACs, Refrigerators…",
    all_categories: "All Categories",

    // Navigation
    nav_tv: "📺 LED TVs",
    nav_refrigerator: "🧊 Refrigerators",
    nav_ac: "❄️ Air Conditioners",
    nav_washing: "🫧 Washing Machines",
    nav_kitchen: "🍳 Kitchen",
    nav_phones: "📱 Phones",
    nav_small: "💡 Small Appliances",
    nav_offers: "🏷️ Offers",

    // Mega menu headers
    by_screen_size: "By Screen Size",
    by_type: "By Type",
    top_brands: "Top Brands",
    by_door_type: "By Door Type",
    by_capacity: "By Capacity",

    // Hero Slider
    hero_kicker_1: "🔥 Authorized Store Deals — Best Local Prices",
    hero_title_1: "Premium <span>LED TVs</span><br>At Unbeatable Prices",
    hero_sub_1: "Sony, Samsung, LG, TCL & more — Genuine models with official brand warranty",
    hero_btn_shop_tv: "🛒 Shop LED TVs →",
    hero_btn_offers: "View All Offers",
    
    hero_kicker_2: "⚡ New Arrivals 2026",
    hero_title_2: "<span>Sony Bravia</span> Google TV<br>Now In Stock",
    hero_sub_2: "Experience Google TV with Dolby Vision & Atmos — Safe doorstep delivery & installation",
    hero_btn_shop_sony: "🛒 Shop Sony →",
    hero_btn_order_wa: "💬 Order on WhatsApp",

    hero_kicker_3: "🏷️ EMI Starting ₹999/month",
    hero_title_3: "Easy <span>EMI</span> on All<br>Electronics",
    hero_sub_3: "6 / 12 / 24 month EMI options — No Cost EMI available on select models",
    hero_btn_call: "📞 Call 7020209281 →",

    // Offer strip
    offer_1: "🔥 Special Discounts on Sony Bravia TVs",
    offer_2: "⚡ Samsung QLED starting from ₹74,999",
    offer_3: "🎁 Free Installation on ACs & Washing Machines",
    offer_4: "💳 No Cost EMI on 6/12/24 months",
    offer_5: "📦 Safe Transit & Doorstep Delivery",

    // Section Titles
    cat_heading: "Shop by Category",
    cat_sub: "Browse our complete range of genuine electronics",
    deal_heading: "🔥 Deal of the Day",
    deal_sub: "Special daily prices — limited stock available",
    featured_heading: "⭐ Featured Products",
    featured_sub: "Hand-picked customer favorites from our store",
    tv_strip_heading: "📺 Smart LED Televisions",
    tv_strip_sub: "4K, Google TV, OLED & QLED from authorized brands",
    fridge_strip_heading: "🧊 Refrigerators & Freezers",
    fridge_strip_sub: "Single Door, Double Door & Inverter Refrigerators",
    brands_heading: "Top Brands We Carry",
    new_heading: "🆕 New Arrivals",
    new_sub: "Latest models in stock with official warranty",
    view_all: "View All →",
    view_all_tvs: "View All TVs →",
    view_all_fridges: "View All Refrigerators →",

    // Product Card
    in_stock: "✓ In Stock",
    low_stock: "⚡ Only {n} left!",
    out_of_stock: "✗ Out of Stock",
    add_to_cart: "🛒 Add to Cart",
    order_wa: "Order on WhatsApp",
    badge_new: "New",
    off: "off",

    // Why Choose Us
    why_heading: "Why Choose Doordarshan Electronics?",
    why_sub: "Trusted by thousands of families across Maharashtra & beyond",
    why_1_title: "Safe Doorstep Delivery",
    why_1_desc: "Safe and verified delivery to your home with careful transit handling.",
    why_2_title: "Easy EMI Options",
    why_2_desc: "No-cost EMI available from 6 to 24 months on select products. Flexible payment plans.",
    why_3_title: "Free Installation",
    why_3_desc: "AC, TV wall mounting, washing machine installation — handled professionally.",
    why_4_title: "Years of Trust",
    why_4_desc: "Serving thousands of happy customers with authorised brand warranty & service support.",

    // WhatsApp Order Banner
    wa_banner_title: "📱 Order Easily on WhatsApp!",
    wa_banner_desc: "Chat with us, share your requirements, get the best price & confirm your order — all on WhatsApp.",
    wa_banner_btn: "Chat on WhatsApp — 7020209281",

    // Payment Options
    payment_options: "Payment Options",
    opt_wa: "WhatsApp Order",
    opt_call: "Call to Order",
    opt_online: "Online Payment",
    opt_razorpay: "Razorpay UPI/Cards",
    coming_soon: "COMING SOON",

    // Footer
    footer_desc: "Your trusted electronics partner in Maharashtra since 2017. We offer the widest range of LED TVs, ACs, Refrigerators, Washing Machines and more at verified, authentic store prices.",
    footer_cats: "Categories",
    footer_brands: "Top Brands",
    footer_help: "Help & Info",
    about_us: "About Us",
    contact_us: "Contact Us",
    emi_info: "EMI Information",
    warranty_policy: "Warranty Policy",
    return_policy: "Return Policy",
    rights_reserved: `© ${currentYear} Doordarshan Electronics. All rights reserved.`,

    // Filters & Category Page
    breadcrumb_home: "Home",
    filters_title: "Filters",
    clear_all: "Clear all",
    price_range: "Price Range",
    apply_btn: "Apply",
    min_price: "Min ₹",
    max_price: "Max ₹",
    sort_by: "Sort By",

    // Product Detail
    description: "Description",
    specifications: "Specifications",
    emi_plans: "EMI Plans",
    delivery_info: "Delivery Info",
    similar_products: "Similar Products"
  },

  mr: {
    // Topbar
    free_delivery: "सुरक्षित आणि जलद होम डिलिव्हरी",
    easy_emi: "सुलभ ईएमआय उपलब्ध",
    whatsapp_contact: "व्हॉट्सॲप: ७०२०२०९२८१",
    call_btn: "कॉल करा",
    wa_btn: "व्हॉट्सॲप",
    cart_btn: "कार्ट",
    
    // Header & Tagline
    store_tagline: "विश्वासार्ह इलेक्ट्रॉनिक्स दालन · महाराष्ट्र",
    search_placeholder: "टीव्ही, फ्रीज, एसी आणि उत्पादने शोधा…",
    all_categories: "सर्व कॅटेगरीज",

    // Navigation
    nav_tv: "📺 एलईडी टीव्ही",
    nav_refrigerator: "🧊 रेफ्रिजरेटर्स",
    nav_ac: "❄️ एअर कंडिशनर",
    nav_washing: "🫧 वॉशिंग मशिन",
    nav_kitchen: "🍳 किचन उपकरणे",
    nav_phones: "📱 मोबाईल फोन",
    nav_small: "💡 लहान घरगुती उपकरणे",
    nav_offers: "🏷️ खास ऑफर्स",

    // Mega menu headers
    by_screen_size: "स्क्रीन साईझनुसार",
    by_type: "प्रकारानुसार",
    top_brands: "प्रमुख ब्रँड्स",
    by_door_type: "डोअर प्रकारानुसार",
    by_capacity: "क्षमतेनुसार (लिटर)",

    // Hero Slider
    hero_kicker_1: "🔥 अधिकृत दालन ऑफर्स — सर्वोत्तम दर",
    hero_title_1: "प्रीमियम <span>एलईडी टीव्ही</span><br>सर्वोत्तम दरात",
    hero_sub_1: "सोनी, सॅमसंग, एलजी, टीसीएल आणि बरेच काही — अधिकृत ब्रँड वॉरंटीसह उपलब्ध",
    hero_btn_shop_tv: "🛒 एलईडी टीव्ही खरेदी करा →",
    hero_btn_offers: "सर्व ऑफर्स पहा",
    
    hero_kicker_2: "⚡ नवीन आगमन २०२६",
    hero_title_2: "<span>सोनी ब्राव्हिया</span> गुगल टीव्ही<br>आता उपलब्ध",
    hero_sub_2: "डॉल्बी व्हिजन आणि अ‍ॅटमॉसचा थेट अनुभव घ्या — सुरक्षित होम डिलिव्हरी व इन्स्टॉलेशन",
    hero_btn_shop_sony: "🛒 सोनी टीव्ही पहा →",
    hero_btn_order_wa: "💬 व्हॉट्सॲपवर ऑर्डर करा",

    hero_kicker_3: "🏷️ ईएमआय फक्त ₹९९९/महिना सुरू",
    hero_title_3: "सर्व इलेक्ट्रॉनिक्सवर<br><span>सुलभ ईएमआय</span>",
    hero_sub_3: "६ / १२ / २४ महिन्यांचे सोपे हप्ते पर्याय — निवडक मॉडेल्सवर नो-कॉस्ट ईएमआय",
    hero_btn_call: "📞 कॉल करा ७०२०२०९२८१ →",

    // Offer strip
    offer_1: "🔥 सोनी ब्राव्हिया टीव्हीवर विशेष सवलत",
    offer_2: "⚡ सॅमसंग क्यूएलईडी फक्त ₹७४,९९९ पासून",
    offer_3: "🎁 एसी आणि वॉशिंग मशिनवर मोफत इन्स्टॉलेशन",
    offer_4: "💳 ६/१२/२४ महिन्यांसाठी नो-कॉस्ट ईएमआय",
    offer_5: "📦 सुरक्षित वाहतूक व होम डिलिव्हरी",

    // Section Titles
    cat_heading: "कॅटेगरीनुसार खरेदी करा",
    cat_sub: "इलेक्ट्रॉनिक्सची आमची संपूर्ण श्रेणी पहा",
    deal_heading: "🔥 आजची खास ऑफर",
    deal_sub: "मर्यादित स्टॉकसाठी आजचे विशेष दर",
    featured_heading: "⭐ लोकप्रिय उत्पादने",
    featured_sub: "आमच्या दालनातील सर्वाधिक पसंतीची उत्पादने",
    tv_strip_heading: "📺 स्मार्ट एलईडी टीव्ही",
    tv_strip_sub: "४K, गुगल टीव्ही, ओलेड आणि क्यूलेड सर्वोत्कृष्ट ब्रँड्समधून",
    fridge_strip_heading: "🧊 रेफ्रिजरेटर्स आणि फ्रीज",
    fridge_strip_sub: "सिंगल डोअर, डबल डोअर आणि इन्व्हर्टर रेफ्रिजरेटर्स",
    brands_heading: "आमच्याकडील प्रमुख ब्रँड्स",
    new_heading: "🆕 नवीन आगमन",
    new_sub: "अधिकृत वॉरंटीसह नव्याने दाखल मॉडेल्स",
    view_all: "सर्व पहा →",
    view_all_tvs: "सर्व टीव्ही पहा →",
    view_all_fridges: "सर्व फ्रीज पहा →",

    // Product Card
    in_stock: "✓ उपलब्ध",
    low_stock: "⚡ फक्त {n} शिल्लक!",
    out_of_stock: "✗ संपले आहे",
    add_to_cart: "🛒 कार्टमध्ये जोडा",
    order_wa: "व्हॉट्सॲप ऑर्डर",
    badge_new: "नवीन",
    off: "सूट",

    // Why Choose Us
    why_heading: "दूरदर्शन इलेक्ट्रॉनिक्सच का निवडावे?",
    why_sub: "हजारो समाधानी कुटुंबांचा अखंड विश्वास",
    why_1_title: "सुरक्षित होम डिलिव्हरी",
    why_1_desc: "आपल्या घरापर्यंत सुरक्षित आणि काळजीपूर्वक हाताळणीसह विनामूल्य डिलिव्हरी.",
    why_2_title: "सुलभ ईएमआय सुविधा",
    why_2_desc: "निवडक उत्पादनांवर ६ ते २४ महिन्यांसाठी सुलभ नो-कॉस्ट ईएमआय पर्याय.",
    why_3_title: "मोफत इन्स्टॉलेशन",
    why_3_desc: "एसी, टीव्ही वॉल माउंटिंग आणि वॉशिंग मशिन जोडणी — तज्ञांकडून मोफत.",
    why_4_title: "विश्वासाची परंपरा",
    why_4_desc: "अधिकृत ब्रँड वॉरंटी आणि सर्व्हिस सपोर्टसह हजारो ग्राहकांना प्रामाणिक सेवा.",

    // WhatsApp Order Banner
    wa_banner_title: "📱 व्हॉट्सॲपवर सहज ऑर्डर करा!",
    wa_banner_desc: "आमच्याशी चॅट करा, आपली गरज सांगा, सर्वोत्तम किंमत मिळवा आणि ऑर्डर कन्फर्म करा — थेट व्हॉट्सॲपवर.",
    wa_banner_btn: "व्हॉट्सॲपवर चॅट करा — ७०२०२०९२८१",

    // Payment Options
    payment_options: "पेमेंट पर्याय",
    opt_wa: "व्हॉट्सॲप ऑर्डर",
    opt_call: "कॉल करून ऑर्डर",
    opt_online: "ऑनलाइन पेमेंट",
    opt_razorpay: "रेझरपे युपीआय / कार्ड्स",
    coming_soon: "लवकरच येत आहे",

    // Footer
    footer_desc: "महाराष्ट्रातील आपले विश्वासू इलेक्ट्रॉनिक्स दालन. आम्ही एलईडी टीव्ही, एसी, रेफ्रिजरेटर्स, वॉशिंग मशिन आणि इतर उपकरणे अधिकृत ब्रँड वॉरंटीसह वाजवी दरात उपलब्ध करतो.",
    footer_cats: "कॅटेगरीज",
    footer_brands: "प्रमुख ब्रँड्स",
    footer_help: "मदत आणि माहिती",
    about_us: "आमच्याबद्दल",
    contact_us: "संपर्क",
    emi_info: "ईएमआय माहिती",
    warranty_policy: "वॉरंटी नियम",
    return_policy: "परतावा नियम",
    rights_reserved: `© ${currentYear} दूरदर्शन इलेक्ट्रॉनिक्स. सर्व हक्क राखीव.`,

    // Filters & Category Page
    breadcrumb_home: "होम",
    filters_title: "फिल्टर्स",
    clear_all: "सर्व हटवा",
    price_range: "किंमत मर्यादा",
    apply_btn: "लागू करा",
    min_price: "किमान ₹",
    max_price: "कमाल ₹",
    sort_by: "क्रमवारी",

    // Product Detail
    description: "माहिती",
    specifications: "वैशिष्ट्ये",
    emi_plans: "ईएमआय योजना",
    delivery_info: "डिलिव्हरी माहिती",
    similar_products: "समान उत्पादने"
  }
};

const LANG_KEY = 'de_website_lang';

function getCurrentLanguage() {
  return localStorage.getItem(LANG_KEY) || 'en';
}

function t(key, params = {}) {
  const lang = getCurrentLanguage();
  let text = (TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) || (TRANSLATIONS.en && TRANSLATIONS.en[key]) || key;
  for (const [k, v] of Object.entries(params)) {
    text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
  }
  return text;
}

function setLanguage(lang) {
  if (lang !== 'en' && lang !== 'mr') lang = 'en';
  localStorage.setItem(LANG_KEY, lang);
  document.documentElement.lang = lang;

  // 1. Update text elements with data-i18n attribute
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (key && TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) {
      el.innerHTML = TRANSLATIONS[lang][key];
    }
  });

  // 2. Update placeholders with data-i18n-placeholder attribute
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (key && TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) {
      el.placeholder = TRANSLATIONS[lang][key];
    }
  });

  // 3. Update active states of language switcher buttons
  document.querySelectorAll('.lang-btn').forEach(btn => {
    if (btn.getAttribute('data-lang') === lang) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // 4. Update copyright year
  document.querySelectorAll('.current-year').forEach(el => {
    el.textContent = currentYear;
  });

  // 5. If main.js has dynamic re-renderers, call them
  if (typeof updateDynamicLanguageText === 'function') {
    updateDynamicLanguageText();
  }
}

function initLanguageSwitcher() {
  const current = getCurrentLanguage();
  document.documentElement.lang = current;
  setLanguage(current);
}

document.addEventListener('DOMContentLoaded', () => {
  initLanguageSwitcher();
});
