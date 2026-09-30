(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.ProductCsvImport = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const HEADER_ALIASES = {
    id: ['id', 'product id', 'database id'],
    name: ['name', 'product', 'product name', 'item', 'item name', 'particulars'],
    brand: ['brand', 'manufacturer'],
    category: ['category', 'product category'],
    model: ['model', 'model no', 'model number', 'sku', 'product code', 'item code'],
    mrp: ['mrp', 'maximum retail price', 'list price'],
    price: ['price', 'sale price', 'selling price', 'sale rate', 'selling rate', 'rate', 'net rate'],
    stock: ['stock', 'stock qty', 'stock quantity', 'quantity', 'qty', 'closing qty', 'closing stock', 'balance', 'balance qty', 'available quantity'],
    description: ['description', 'product description'],
    subcategory: ['subcategory', 'sub category'],
    image: ['image', 'image url', 'product image']
  };

  const CATEGORY_ALIASES = {
    tv: 'tv', television: 'tv', televisions: 'tv', ledtv: 'tv',
    refrigerator: 'refrigerator', refrigerators: 'refrigerator', fridge: 'refrigerator',
    ac: 'ac', airconditioner: 'ac', airconditioners: 'ac',
    washing: 'washing', washingmachine: 'washing', washingmachines: 'washing',
    kitchen: 'kitchen', kitchenappliance: 'kitchen', kitchenappliances: 'kitchen',
    phone: 'phones', phones: 'phones', mobile: 'phones', mobiles: 'phones', smartphone: 'phones', smartphones: 'phones',
    laptop: 'laptop', laptops: 'laptop', computer: 'laptop', computers: 'laptop',
    small: 'small', smallappliance: 'small', smallappliances: 'small'
  };

  const KNOWN_BRANDS = [
    'Whirlpool', 'OnePlus', 'Panasonic', 'Liebherr', 'Skyworth', 'Godrej', 'Samsung',
    'Sharp', 'Haier', 'Voltas', 'Carrier', 'Bosch', 'Daikin', 'Sony', 'Metz',
    'Bush', 'Gem', 'PHX', 'TCL', 'IFB', 'LG'
  ];

  function normalizeHeader(value) {
    return String(value || '').replace(/^\uFEFF/, '').trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  }

  function detectDelimiter(text) {
    const candidates = [',', ';', '\t'];
    const counts = Object.fromEntries(candidates.map(delimiter => [delimiter, 0]));
    let quoted = false;
    const sample = String(text).replace(/^\uFEFF/, '');

    for (let i = 0; i < sample.length; i += 1) {
      const char = sample[i];
      if (char === '"') {
        if (quoted && sample[i + 1] === '"') i += 1;
        else quoted = !quoted;
      } else if (!quoted && (char === '\n' || char === '\r')) {
        if (Object.values(counts).some(Boolean)) break;
      } else if (!quoted && Object.prototype.hasOwnProperty.call(counts, char)) {
        counts[char] += 1;
      }
    }

    return candidates.reduce((best, candidate) => counts[candidate] > counts[best] ? candidate : best, ',');
  }

  function parseDelimited(text) {
    if (typeof text !== 'string' || !text.trim()) throw new Error('The CSV file is empty.');

    const input = text.replace(/^\uFEFF/, '');
    const delimiter = detectDelimiter(input);
    const rows = [];
    let row = [];
    let field = '';
    let insideQuotes = false;

    for (let i = 0; i < input.length; i += 1) {
      const char = input[i];

      if (insideQuotes) {
        if (char === '"' && input[i + 1] === '"') {
          field += '"';
          i += 1;
        } else if (char === '"') {
          insideQuotes = false;
        } else {
          field += char;
        }
      } else if (char === '"' && field.length === 0) {
        insideQuotes = true;
      } else if (char === delimiter) {
        row.push(field.trim());
        field = '';
      } else if (char === '\n' || char === '\r') {
        row.push(field.trim());
        if (row.some(cell => cell !== '')) rows.push(row);
        row = [];
        field = '';
        if (char === '\r' && input[i + 1] === '\n') i += 1;
      } else {
        field += char;
      }
    }

    if (insideQuotes) throw new Error('The CSV has an unfinished quoted value. Re-export it as a valid CSV and try again.');
    if (field.length || row.length) {
      row.push(field.trim());
      if (row.some(cell => cell !== '')) rows.push(row);
    }

    return { rows, delimiter };
  }

  function buildHeaderMap(headerRow) {
    const normalized = headerRow.map(normalizeHeader);
    const map = {};

    for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
      const normalizedAliases = aliases.map(normalizeHeader);
      map[field] = normalized.findIndex(value => normalizedAliases.includes(value));
    }

    return { map, normalized };
  }

  function parseMoney(value) {
    const raw = String(value == null ? '' : value).trim();
    if (!raw) return null;
    const numeric = raw
      .replace(/(?:₹|INR|Rs\.?)/gi, '')
      .replace(/[\s\u00a0]/g, '');
    const validNumber = /^[+-]?(?:(?:\d+|\d{1,2}(?:,\d{2})*,\d{3}|\d{1,3}(?:,\d{3})+)(?:\.\d*)?|\.\d+)$/;
    if (!validNumber.test(numeric)) return null;
    const amount = Number(numeric.replace(/,/g, ''));
    return Number.isFinite(amount) ? amount : null;
  }

  function parseQuantity(value) {
    const match = String(value == null ? '' : value).trim().match(/[+-]?\d+(?:\.\d+)?/);
    if (!match) return null;
    const quantity = Number(match[0]);
    return Number.isFinite(quantity) ? quantity : null;
  }

  function detectBrand(name) {
    const value = String(name || '');
    for (const brand of KNOWN_BRANDS) {
      const escaped = brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (new RegExp(`(?:^|[^a-z0-9])${escaped}(?:$|[^a-z0-9])`, 'i').test(value)) {
        return brand === 'Gem' ? 'GEM' : brand;
      }
    }
    return '';
  }

  function detectCategory(name) {
    const value = String(name || '').toUpperCase();
    if (/\bREF\b|\bFRIDGE\b|\bREFRIGERATOR\b/.test(value)) return 'refrigerator';
    if (/\bAIR\s*CONDITION(?:ER)?\b|\bAC\b/.test(value)) return 'ac';
    if (/\bWASH(?:ING)?\b|\bWM\b|\bFRONT\s*LOAD\b|\bTOP\s*LOAD\b/.test(value)) return 'washing';
    if (/\bLED\b|\bTV\b|\bQLED\b|\bOLED\b/.test(value)) return 'tv';
    return '';
  }

  function normalizeCategory(value) {
    const key = normalizeHeader(value).replace(/\s+/g, '');
    return CATEGORY_ALIASES[key] || key;
  }

  function mapHeaderedRows(rows, delimiter) {
    const { map, normalized } = buildHeaderMap(rows[0]);
    const hasName = map.name >= 0;
    const hasPriceColumn = map.price >= 0;
    const hasMrpColumn = map.mrp >= 0;
    const hasStockColumn = map.stock >= 0;
    const mode = hasPriceColumn || hasMrpColumn ? 'catalog' : 'stock';
    const resultRows = [];
    const errors = [];

    rows.slice(1).forEach((cells, index) => {
      const recordNumber = index + 2;
      if (cells.every(cell => !cell.trim())) return;
      if (normalizeHeader(cells[0]) === 'items' && cells.slice(1).every(cell => !cell.trim())) return;

      const get = field => map[field] >= 0 ? (cells[map[field]] || '').trim() : '';
      const name = get('name');
      if (!name) {
        errors.push({ recordNumber, message: 'Product/item name is missing.' });
        return;
      }

      const priceRaw = get('price');
      const mrpRaw = get('mrp');
      const stockRaw = get('stock');
      const idRaw = get('id');
      const price = hasPriceColumn ? parseMoney(priceRaw) : null;
      const mrp = hasMrpColumn ? parseMoney(mrpRaw) : null;
      const stock = hasStockColumn ? parseQuantity(stockRaw) : null;
      const id = map.id >= 0 && idRaw ? parseQuantity(idRaw) : null;

      if (hasPriceColumn && priceRaw && price === null) errors.push({ recordNumber, message: `Invalid rate/price “${priceRaw}”.` });
      if (hasMrpColumn && mrpRaw && mrp === null) errors.push({ recordNumber, message: `Invalid MRP “${mrpRaw}”.` });
      if (hasStockColumn && stockRaw && stock === null) errors.push({ recordNumber, message: `Invalid quantity “${stockRaw}”.` });
      if (map.id >= 0 && idRaw && (!Number.isInteger(id) || id <= 0)) errors.push({ recordNumber, message: `Invalid product ID “${idRaw}”.` });

      resultRows.push({
        recordNumber,
        id: Number.isInteger(id) && id > 0 ? id : null,
        name,
        brand: get('brand'),
        category: get('category'),
        model: get('model'),
        mrp,
        price,
        stock: Number.isInteger(stock) && stock >= 0 ? stock : null,
        description: get('description'),
        subcategory: get('subcategory'),
        image: get('image')
      });
    });

    if (!hasName || (!hasPriceColumn && !hasMrpColumn && !hasStockColumn)) {
      return {
        mode: 'invalid', delimiter, headers: normalized,
        rows: [], errors: [{ recordNumber: 1, message: 'Could not identify product name and price/rate or stock columns.' }]
      };
    }

    return { mode, delimiter, headers: normalized, hasPriceColumn, hasMrpColumn, hasStockColumn, rows: resultRows, errors };
  }

  function parseStockSummary(rows, delimiter) {
    const parsedRows = [];
    const errors = [];

    rows.forEach((cells, index) => {
      const first = normalizeHeader(cells[0]);
      if (first === 'items' || cells.every(cell => !cell.trim())) return;

      let name = '';
      let stock = null;
      if (cells.length >= 3 && /^\d+$/.test(cells[0].trim())) {
        name = (cells[1] || '').trim();
        stock = parseQuantity(cells[2]);
      } else if (cells.length >= 2) {
        name = (cells[0] || '').trim();
        stock = parseQuantity(cells[1]);
      }

      if (!name) return;
      if (stock === null || !Number.isInteger(stock) || stock < 0) {
        errors.push({ recordNumber: index + 1, message: `Could not read a whole-number stock quantity for “${name}”.` });
        return;
      }

      parsedRows.push({
        recordNumber: index + 1,
        id: null,
        name,
        brand: detectBrand(name),
        category: detectCategory(name),
        model: '',
        mrp: null,
        price: null,
        stock,
        description: '',
        subcategory: '',
        image: ''
      });
    });

    if (!parsedRows.length && !errors.length) {
      errors.push({ recordNumber: 1, message: 'No stock rows were found. Use the sample CSV template for product pricing.' });
    }

    return { mode: 'stock', delimiter, headers: [], hasPriceColumn: false, hasMrpColumn: false, hasStockColumn: true, rows: parsedRows, errors };
  }

  function parseProductCsv(text) {
    if (String(text || '').length > 5 * 1024 * 1024) throw new Error('CSV files must be smaller than 5 MB.');
    const { rows, delimiter } = parseDelimited(text);
    if (!rows.length) throw new Error('The CSV file contains no rows.');
    if (rows.length > 1001) throw new Error('CSV imports are limited to 1,000 product rows at a time.');

    const headerInfo = buildHeaderMap(rows[0]);
    const firstRowIsHeader = headerInfo.map.name >= 0 && (
      headerInfo.map.stock >= 0 || headerInfo.map.price >= 0 || headerInfo.map.mrp >= 0
    );

    return firstRowIsHeader ? mapHeaderedRows(rows, delimiter) : parseStockSummary(rows, delimiter);
  }

  function normalizeMatchValue(value) {
    return String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  function matchExistingProduct(row, products) {
    if (row.id != null) {
      const byId = products.filter(product => Number(product.id) === Number(row.id));
      if (byId.length) return byId;
    }

    const rowModel = normalizeMatchValue(row.model);
    if (rowModel) {
      const byModel = products.filter(product => normalizeMatchValue(product.model) === rowModel);
      if (byModel.length) return byModel;
    }

    const rowName = normalizeMatchValue(row.name);
    return products.filter(product => [product.name, product.model].some(value => normalizeMatchValue(value) === rowName));
  }

  function buildImportPlan(parsed, products, categories) {
    const errors = [...(parsed.errors || [])];
    const records = [];
    const sourceTargets = new Set();
    const knownCategories = new Set((categories || []).map(category => normalizeCategory(category.key || category)));
    let nextId = Math.max(0, ...(products || []).map(product => Number(product.id) || 0)) + 1;

    if (!Array.isArray(products)) {
      errors.push({ recordNumber: 0, message: 'Live products were not loaded from the database; import is disabled.' });
      return { mode: parsed.mode, records, errors };
    }

    for (const row of parsed.rows || []) {
      const matches = matchExistingProduct(row, products);
      if (matches.length > 1) {
        errors.push({ recordNumber: row.recordNumber, message: `“${row.name}” matches more than one product; add an exact product ID or model.` });
        continue;
      }

      const existing = matches[0] || null;
      if (parsed.mode === 'stock') {
        if (!existing) {
          errors.push({ recordNumber: row.recordNumber, message: `No exact existing product matched “${row.name}”; stock was not assigned to a guessed item.` });
          continue;
        }
        if (!Number.isInteger(row.stock) || row.stock < 0) {
          errors.push({ recordNumber: row.recordNumber, message: `“${row.name}” has no valid stock quantity.` });
          continue;
        }
        if (sourceTargets.has(String(existing.id))) {
          errors.push({ recordNumber: row.recordNumber, message: `More than one CSV row targets product ID ${existing.id}.` });
          continue;
        }
        sourceTargets.add(String(existing.id));
        records.push({ mode: 'stock', recordNumber: row.recordNumber, id: existing.id, name: existing.name, stock: row.stock });
        continue;
      }

      if (parsed.mode !== 'catalog') {
        errors.push({ recordNumber: row.recordNumber, message: 'This CSV format is not supported.' });
        continue;
      }

      const brand = row.brand || (existing && existing.brand) || detectBrand(row.name);
      const category = normalizeCategory(row.category || (existing && existing.category) || detectCategory(row.name));
      const mrp = row.mrp !== null ? row.mrp : (existing ? Number(existing.mrp) : NaN);
      const stock = row.stock !== null ? row.stock : (existing ? Number(existing.stock) : NaN);
      const id = existing ? Number(existing.id) : (row.id || nextId++);

      if (row.price === null || row.price <= 0) errors.push({ recordNumber: row.recordNumber, message: `“${row.name}” needs a valid sale price/rate greater than zero.` });
      if (!row.name || row.name.length < 2) errors.push({ recordNumber: row.recordNumber, message: 'Product name must contain at least 2 characters.' });
      if (!brand) errors.push({ recordNumber: row.recordNumber, message: `“${row.name}” needs a brand column or a recognizable brand in its name.` });
      if (!category || (knownCategories.size && !knownCategories.has(category))) errors.push({ recordNumber: row.recordNumber, message: `“${row.name}” has a missing or unknown category${row.category ? ` (“${row.category}”)` : ''}.` });
      if (!Number.isFinite(mrp) || mrp <= 0) errors.push({ recordNumber: row.recordNumber, message: `“${row.name}” needs an MRP column or an existing product with a valid MRP.` });
      if (Number.isFinite(mrp) && Number.isFinite(row.price) && mrp < row.price) errors.push({ recordNumber: row.recordNumber, message: `MRP for “${row.name}” is lower than its sale price.` });
      if (!Number.isInteger(stock) || stock < 0) errors.push({ recordNumber: row.recordNumber, message: `“${row.name}” needs a whole-number stock quantity (zero is allowed).` });
      if (!Number.isInteger(id) || id <= 0) errors.push({ recordNumber: row.recordNumber, message: `“${row.name}” has no valid product ID.` });
      if (sourceTargets.has(String(id))) errors.push({ recordNumber: row.recordNumber, message: `More than one CSV row targets product ID ${id}.` });
      if (row.image && !/^(https:\/\/|\/assets\/)/i.test(row.image)) errors.push({ recordNumber: row.recordNumber, message: `Image URL for “${row.name}” must use HTTPS or a local /assets/ path.` });

      if (errors.some(error => error.recordNumber === row.recordNumber)) continue;
      sourceTargets.add(String(id));

      records.push({
        mode: 'catalog',
        recordNumber: row.recordNumber,
        id,
        name: row.name,
        category,
        brand,
        model: row.model || (existing && existing.model) || '',
        subcategory: row.subcategory || (existing && existing.subcategory) || '',
        mrp,
        price: row.price,
        stock,
        description: row.description || (existing && existing.description) || '',
        image: row.image || (existing && existing.image) || '',
        images: (existing && existing.images) || [],
        type: (existing && existing.type) || [],
        size: (existing && existing.size) || null,
        specs: (existing && existing.specs) || {},
        is_new: Boolean(existing && (existing.is_new ?? existing.isNew)),
        is_featured: Boolean(existing && (existing.is_featured ?? existing.isFeatured))
      });
    }

    if (!records.length && !errors.length) errors.push({ recordNumber: 0, message: 'No valid product rows were found.' });
    return { mode: parsed.mode, records, errors };
  }

  return Object.freeze({
    parseDelimited,
    parseMoney,
    parseProductCsv,
    normalizeCategory,
    buildImportPlan
  });
});
