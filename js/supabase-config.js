// ============================================================
// Doordarshan Electronics — Supabase Configuration & Helper Client
// Key type: Publishable (new Supabase key system — not legacy JWT)
// Old legacy anon key has been disabled in Supabase dashboard.
// ============================================================

const SUPABASE_URL = 'https://lodiiprfdimohskhcpyf.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_FdkBuPPvZVRDCSSY6A-cwQ_0coG4MrF';

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

// Fetch products from Supabase DB (with fallback to PRODUCTS array if offline/loading)
async function fetchProductsFromDB() {
  if (!dbClient) {
    console.log('Using static fallback products catalog.');
    return typeof PRODUCTS !== 'undefined' ? PRODUCTS : [];
  }
  try {
    const { data, error } = await dbClient
      .from('products')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.error('Error fetching products from Supabase:', error);
      return typeof PRODUCTS !== 'undefined' ? PRODUCTS : [];
    }

    if (data && data.length > 0) {
      // Format Supabase rows to match frontend schema
      return data.map(item => ({
        id: item.id,
        name: item.name,
        brand: item.brand,
        category: item.category || 'tv',
        subcategory: item.subcategory,
        type: item.type || [],
        model: item.model,
        mrp: parseFloat(item.mrp || 0),
        price: parseFloat(item.price || 0),
        stock: parseInt(item.stock || 0),
        size: item.size,
        rating: parseFloat(item.rating || 4.0),
        reviews: parseInt(item.reviews || 0),
        isNew: item.is_new,
        isFeatured: item.is_featured,
        specs: item.specs || {},
        description: item.description,
        image: item.image || '',
        images: item.images || []
      }));
    }
  } catch (err) {
    console.error('Supabase fetch exception:', err);
  }
  return typeof PRODUCTS !== 'undefined' ? PRODUCTS : [];
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
