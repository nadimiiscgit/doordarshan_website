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
      .select('id,key,name,description,icon,image')
      .order('id', { ascending: true });

    if (error || !data) {
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
    isNew: item.is_new,
    isFeatured: item.is_featured,
    isApproved: item.is_approved === true,
    specs: item.specs || {},
    description: item.description,
    image: item.image || '',
    images: item.images || [],
    _catalogSource: 'supabase'
  }));
}

// Admin only. Never return a static snapshot as editable live data.
async function fetchProductsFromDB() {
  if (!dbClient) throw new Error('Supabase is not connected; live products were not loaded.');
  const { data, error } = await dbClient
    .from('products')
    .select('*')
    .order('id', { ascending: true });
  if (error) throw error;
  return mapSupabaseProductRows(data || []);
}

const PUBLIC_PRODUCT_COLUMNS = 'id,name,brand,category,subcategory,type,model,price,size,is_new,is_featured,specs,description,image,images';

async function fetchPublicProducts(filters = {}) {
  if (!dbClient) throw new Error('Catalogue connection unavailable');
  const page = Math.max(1, Number(filters.page) || 1);
  const pageSize = Math.min(24, Math.max(1, Number(filters.pageSize) || 12));
  let query = dbClient.from('catalogue_products').select(PUBLIC_PRODUCT_COLUMNS, { count: 'exact' });
  if (filters.id != null) query = query.eq('id', filters.id);
  if (Array.isArray(filters.ids) && filters.ids.length) query = query.in('id', filters.ids);
  if (filters.category) query = query.eq('category', filters.category);
  if (filters.subcategory) query = query.eq('subcategory', filters.subcategory);
  if (filters.brand) query = query.eq('brand', filters.brand);
  if (filters.featured) query = query.eq('is_featured', true);
  if (filters.newArrivals) query = query.eq('is_new', true);
  if (filters.search) {
    const term = String(filters.search).replace(/[^\p{L}\p{N}\s-]/gu, ' ').trim().slice(0, 80);
    if (term) query = query.or(`name.ilike.%${term}%,brand.ilike.%${term}%,model.ilike.%${term}%`);
  }
  const sorts = { name_asc: ['name', true], name_desc: ['name', false], price_asc: ['price', true], price_desc: ['price', false] };
  const [sortColumn, ascending] = sorts[filters.sort] || ['id', false];
  query = query.order(sortColumn, { ascending });
  if (sortColumn !== 'id') query = query.order('id', { ascending: true });
  const { data, error, count } = await query.range((page - 1) * pageSize, page * pageSize - 1);
  if (error) throw error;
  return { products: mapSupabaseProductRows(data || []), count: count || 0, source: 'live' };
}

async function fetchPublicBrands() {
  if (!dbClient) throw new Error('Catalogue connection unavailable');
  const { data, error } = await dbClient.from('catalogue_products').select('brand').order('brand').limit(1000);
  if (error) throw error;
  return [...new Set((data || []).map(row => row.brand).filter(Boolean))];
}

async function fetchPublishedSiteContent() {
  if (!dbClient) throw new Error('Site content connection unavailable');
  const { data, error } = await dbClient.from('site_content').select('published,published_at').eq('id', 'main').single();
  if (error) throw error;
  return data;
}

async function fetchEditableSiteContent() {
  if (!dbClient) throw new Error('Site content connection unavailable');
  const { data, error } = await dbClient.from('site_content').select('*').eq('id', 'main').single();
  if (error) throw error;
  return data;
}

async function saveSiteContentDraft(draft) {
  if (!dbClient) throw new Error('Site content connection unavailable');
  const { error } = await dbClient.from('site_content').update({ draft }).eq('id', 'main');
  if (error) throw error;
}

async function publishSiteContent() {
  if (!dbClient) throw new Error('Site content connection unavailable');
  const { error } = await dbClient.rpc('publish_site_content');
  if (error) throw error;
}

async function restoreSiteContent() {
  if (!dbClient) throw new Error('Site content connection unavailable');
  const { error } = await dbClient.rpc('restore_site_content');
  if (error) throw error;
}

async function isSiteAdmin() {
  if (!dbClient) return false;
  const { data, error } = await dbClient.from('site_admins').select('user_id').limit(1);
  return !error && Array.isArray(data) && data.length > 0;
}

async function upsertProductsToDB(records) {
  if (!dbClient) throw new Error('Database is not connected.');
  if (!Array.isArray(records) || !records.length) throw new Error('No validated product rows were provided.');

  // Imports without an explicit, reviewed approval always unpublish touched rows.
  const safeRecords = records.map(record => ({ ...record, is_approved: record.is_approved === true }));
  const { data, error } = await dbClient.from('products').upsert(safeRecords).select('id');
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
    .update({ image: imageUrl, is_approved: false })
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
  if (!file || file.size < 12 || file.size > 5 * 1024 * 1024) throw new Error('Use an image under 5 MB.');
  const formats = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
  const fileExt = formats[file.type];
  if (!fileExt) throw new Error('Only JPEG, PNG and WebP images are supported.');
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const png = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  const webp = String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP';
  if (!(fileExt === 'jpg' && jpeg || fileExt === 'png' && png || fileExt === 'webp' && webp)) throw new Error('Image file type does not match its contents.');
  if (typeof createImageBitmap === 'function') {
    const bitmap = await createImageBitmap(file);
    const tooLarge = bitmap.width > 5000 || bitmap.height > 5000;
    bitmap.close();
    if (tooLarge) throw new Error('Image dimensions must be 5000px or smaller.');
  }
  const fileName = `${Date.now()}_${crypto.randomUUID()}.${fileExt}`;
  const filePath = `uploads/${fileName}`;

  const { data, error } = await dbClient.storage
    .from('product-images')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type
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
