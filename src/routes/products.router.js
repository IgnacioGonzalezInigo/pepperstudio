const { Router } = require('express');
const ProductManager = require('../managers/ProductManager');
const ProductModel = require('../models/Product.model');

const router = Router();
const productManager = new ProductManager();

function toInt(value, fallback) {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

// Construye links prev/next conservando query params
function buildLinks(req, { page, limit, sort, query, totalPages }) {
  // Render usa un proxy, esto asegura que el link sea correcto
  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  const base = `${protocol}://${req.get('host')}${req.baseUrl}${req.path}`;

  const params = new URLSearchParams();
  if (limit) params.set('limit', String(limit));
  if (sort) params.set('sort', String(sort));
  if (query) params.set('query', String(query));

  const hasPrevPage = page > 1;
  const hasNextPage = page < totalPages;

  const prevPage = hasPrevPage ? page - 1 : null;
  const nextPage = hasNextPage ? page + 1 : null;

  const prevLink = hasPrevPage
    ? `${base}?${new URLSearchParams({ ...Object.fromEntries(params), page: String(prevPage) }).toString()}`
    : null;

  const nextLink = hasNextPage
    ? `${base}?${new URLSearchParams({ ...Object.fromEntries(params), page: String(nextPage) }).toString()}`
    : null;

  return { hasPrevPage, hasNextPage, prevPage, nextPage, prevLink, nextLink };
}

function buildFilter(queryParam) {
  if (!queryParam) return {};
  const q = String(queryParam).trim();

  if (q.includes(':')) {
    const [rawKey, ...rest] = q.split(':');
    const key = rawKey.trim().toLowerCase();
    const value = rest.join(':').trim();

    if (key === 'category') return { category: value };
    if (key === 'status') return { status: value === 'true' };
    if (key === 'available' || key === 'stock') return value === 'true' ? { stock: { $gt: 0 } } : { stock: { $lte: 0 } };
    return { category: value };
  }

  if (['available', 'stock'].includes(q.toLowerCase())) return { stock: { $gt: 0 } };
  if (q === 'true' || q === 'false') return { status: q === 'true' };

  return { category: q };
}

router.get('/', async (req, res) => {
  try {
    const limit = toInt(req.query.limit, 10);
    let page = toInt(req.query.page, 1);
    const sort = req.query.sort ? String(req.query.sort).toLowerCase() : null;
    const query = req.query.query ? String(req.query.query) : null;

    const filter = buildFilter(query);

    let sortObj = undefined;
    if (sort === 'asc') sortObj = { price: 1 };
    if (sort === 'desc') sortObj = { price: -1 };

    const total = await ProductModel.countDocuments(filter);
    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

    if (totalPages > 0 && page > totalPages) page = totalPages;

    const skip = (page - 1) * limit;

    const payload = await ProductModel.find(filter)
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .lean();

    const links = buildLinks(req, { page, limit, sort, query, totalPages });

    return res.json({ // Usamos .json() que es más estándar
      status: 'success',
      payload,
      totalPages,
      prevPage: links.prevPage,
      nextPage: links.nextPage,
      page,
      hasPrevPage: links.hasPrevPage,
      hasNextPage: links.hasNextPage,
      prevLink: links.prevLink,
      nextLink: links.nextLink
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', error: error.message });
  }
});

// Obtiene un producto por su ID
router.get('/:pid', async (req, res) => {
  try {
    const producto = await productManager.getById(req.params.pid);
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json({ status: 'success', producto });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener producto', detalle: error.message });
  }
});

// Crea un producto
router.post('/', async (req, res) => {
  try {
    const producto = await productManager.add(req.body);
    res.status(201).json({ status: 'success', mensaje: 'Producto agregado', producto });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Actualiza un producto 
router.put('/:pid', async (req, res) => {
  try {
    const producto = await productManager.update(req.params.pid, req.body);
    res.json({ status: 'success', mensaje: 'Producto actualizado', producto });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Elimina un producto por ID
router.delete('/:pid', async (req, res) => {
  try {
    const eliminado = await productManager.delete(req.params.pid);
    res.json({ status: 'success', mensaje: 'Producto eliminado', eliminado });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;