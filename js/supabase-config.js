// ============================================================
// Doordarshan Electronics — Supabase Configuration & Helper Client
// ============================================================

const SUPABASE_URL = 'https://lodiiprfdimohskhcpyf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvZGlpcHJmZGltb2hza2hjcHlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2MDUxMzUsImV4cCI6MjEwNjE4MTEzNX0._7vMP2aTEcnM4X7G0Ul1SuzWsERB_xLADoYO9McyDCQ';

// Initialize Supabase Client
let dbClient = null;

if (typeof supabase !== 'undefined') {
  dbClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
  console.warn('Supabase SDK script not loaded yet.');
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
