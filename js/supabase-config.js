// ============================================================
// Doordarshan Electronics — Supabase Configuration & Helper Client
// Key type: Publishable (new Supabase key system — not legacy JWT)
// Old legacy anon key has been disabled in Supabase dashboard.
// ============================================================

const SUPABASE_URL = 'https://lodiiprfdimohskhcpyf.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_FdkBuPPvZVRDCSSY6A-cwQ_0coG4MrF';

function escapeHtml(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

function safeImageUrl(value) {
  const raw = String(value || '').trim();
  if (!raw || raw.startsWith('//')) return '';
  if (/^\/assets\/[a-z0-9/_-]+(?:\.[a-z0-9]+)?(?:\?[a-z0-9=&_-]*)?$/i.test(raw)) return raw;
  try {
    const url = new URL(raw);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : '';
  } catch (error) {
    return '';
  }
}

// Initialize Supabase Client
let dbClient = null;

if (typeof supabase !== 'undefined') {
  dbClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
  console.warn('Supabase SDK script not loaded yet.');
}

// Default categories fallback
const DEFAULT_CATEGORIES = [
  { key: 'tv', name: 'LED Televisions', description: '4K, QLED, OLED & Smart TVs', icon: '📺' },
  { key: 'refrigerator', name: 'Refrigerators', description: 'Single door, double door & side-by-side', icon: '🧊' },
  { key: 'ac', name: 'Air Conditioners', description: 'Split ACs, Inverter ACs & Window ACs', icon: '❄️' },
  { key: 'washing', name: 'Washing Machines', description: 'Front load, top load & semi-automatic', icon: '🧺' },
  { key: 'kitchen', name: 'Kitchen Appliances', description: 'Microwaves, chimneys, mixer grinders', icon: '🍳' },
  { key: 'phones', name: 'Mobile Phones & Tablets', description: 'Smartphones and accessories', icon: '📱' },
  { key: 'laptop', name: 'Laptops & Computers', description: 'Gaming & business laptops', icon: '💻' },
  { key: 'small', name: 'Small Appliances', description: 'Water purifiers, irons, fans', icon: '⚡' }
];

// Supabase Auth Admin Authentication
async function signInAdminWithAuth(email, password) {
  if (!dbClient) throw new Error('Database client not connected.');
  return await dbClient.auth.signInWithPassword({ email, password });
}

// Supabase Auth Admin Logout
async function signOutAdmin() {
  if (!dbClient) return;
  return await dbClient.auth.signOut();
}

// Check current admin session
async function getAdminSession() {
  if (!dbClient) return null;
  const { data: { session }, error } = await dbClient.auth.getSession();
  if (error || !session) return null;
  return session;
}

// Update Global Admin Password in Supabase Auth
async function updateAdminPasswordInDB(username, newPassword) {
  if (!dbClient) throw new Error('Database not connected.');
  const { data, error } = await dbClient.auth.updateUser({ password: newPassword });
  if (error) throw error;
  return data;
}

// Fetch categories from Supabase DB
async function fetchCategoriesFromDB() {
  if (!dbClient) return DEFAULT_CATEGORIES;
  try {
    const { data, error } = await dbClient
      .from('categories')
      .select('*')
      .order('id', { ascending: true });

    if (error || !data || data.length === 0) {
      return DEFAULT_CATEGORIES;
    }
    return data;
  } catch (e) {
    console.error('Category fetch error:', e);
    return DEFAULT_CATEGORIES;
  }
}

// Save category to Supabase DB
async function saveCategoryToDB(categoryObj) {
  if (!dbClient) throw new Error('Database not connected.');
  const { data, error } = await dbClient
    .from('categories')
    .upsert([categoryObj]);

  if (error) throw error;
  return data;
}

function getStaticFallbackProducts() {
  return typeof PRODUCTS !== 'undefined'
    ? PRODUCTS.map(product => ({ ...product, _catalogSource: 'static-fallback' }))
    : [];
}

function mapSupabaseProductRows(rows) {
  return rows.map(item => ({
    id: item.id,
    name: item.name,
    brand: item.brand,
    category: item.category || 'tv',
    subcategory: item.subcategory,
    type: item.type || [],
    model: item.model,
    mrp: parseFloat(item.mrp || 0),
    price: parseFloat(item.price || 0),
    stock: parseInt(item.stock || 0, 10),
    size: item.size,
    rating: item.rating == null ? null : parseFloat(item.rating),
    reviews: item.reviews == null ? 0 : parseInt(item.reviews, 10),
    isNew: item.is_new,
    isFeatured: item.is_featured,
    specs: item.specs || {},
    description: item.description,
    image: item.image || '',
    images: item.images || [],
    _catalogSource: 'supabase'
  }));
}

// Public pages may use a clearly marked static fallback. Admin callers pass
// { allowFallback: false } so an offline snapshot can never be edited as live data.
async function fetchProductsFromDB(options = {}) {
  const allowFallback = options.allowFallback !== false;
  if (!dbClient) {
    if (!allowFallback) throw new Error('Supabase is not connected; live products were not loaded.');
    console.warn('Using static fallback products catalog; prices and stock need confirmation.');
    return getStaticFallbackProducts();
  }
  try {
    const { data, error } = await dbClient
      .from('products')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.error('Error fetching products from Supabase:', error);
      if (!allowFallback) throw error;
      return getStaticFallbackProducts();
    }

    if (data && data.length > 0) {
      return mapSupabaseProductRows(data);
    }
    return allowFallback ? getStaticFallbackProducts() : [];
  } catch (err) {
    console.error('Supabase fetch exception:', err);
    if (!allowFallback) throw err;
  }
  return getStaticFallbackProducts();
}

async function upsertProductsToDB(records) {
  if (!dbClient) throw new Error('Database is not connected.');
  if (!Array.isArray(records) || !records.length) throw new Error('No validated product rows were provided.');

  const { data, error } = await dbClient.from('products').upsert(records).select('id');
  if (error) throw error;
  if (!Array.isArray(data) || data.length !== records.length) {
    throw new Error(`Database confirmed ${data ? data.length : 0} of ${records.length} imported products.`);
  }
  return data;
}

async function updateProductStocksInDB(updates) {
  if (!dbClient) throw new Error('Database is not connected.');
  if (!Array.isArray(updates) || !updates.length) throw new Error('No validated stock rows were provided.');

  const completed = [];
  for (const update of updates) {
    const { data, error } = await dbClient
      .from('products')
      .update({ stock: update.stock })
      .eq('id', update.id)
      .select('id');
    if (error || !Array.isArray(data) || data.length !== 1) {
      const failure = new Error(error ? error.message : `No database row was updated for product ID ${update.id}.`);
      failure.completed = completed.length;
      failure.total = updates.length;
      throw failure;
    }
    completed.push(data[0].id);
  }
  return completed;
}

async function updateProductImagesInDB(ids, imageUrl) {
  if (!dbClient) throw new Error('Database is not connected.');
  if (!Array.isArray(ids) || !ids.length) throw new Error('No products were selected.');

  const { data, error } = await dbClient
    .from('products')
    .update({ image: imageUrl })
    .in('id', ids)
    .select('id');
  if (error) throw error;
  if (!Array.isArray(data) || data.length !== ids.length) {
    throw new Error(`Database confirmed ${data ? data.length : 0} of ${ids.length} product image updates.`);
  }
  return data;
}

async function deleteProductFromDB(id) {
  if (!dbClient) throw new Error('Database is not connected.');
  const { data, error } = await dbClient.from('products').delete().eq('id', id).select('id');
  if (error) throw error;
  if (!Array.isArray(data) || data.length !== 1) throw new Error(`No database product was deleted for ID ${id}.`);
  return data[0];
}

// Upload Image file to Supabase Storage bucket ('product-images')
async function uploadProductImageToStorage(file) {
  if (!dbClient) {
    throw new Error('Supabase client is not connected.');
  }

  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
  const filePath = `uploads/${fileName}`;

  const { data, error } = await dbClient.storage
    .from('product-images')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true
    });

  if (error) {
    throw error;
  }

  // Get public URL
  const { data: publicUrlData } = dbClient.storage
    .from('product-images')
    .getPublicUrl(filePath);

  return publicUrlData.publicUrl;
}
