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
  const base = `${req.protocol}://${req.get('host')}${req.baseUrl}${req.path}`;

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

// Interpreta el query param "query" para filtrar productos.
function buildFilter(queryParam) {

  // Sin query => búsqueda general
  if (!queryParam) return {};

  const q = String(queryParam).trim();

  // Soporta "category:Remeras" o "status:true" o "stock:true"
  if (q.includes(':')) {
    const [rawKey, ...rest] = q.split(':');
    const key = rawKey.trim().toLowerCase();
    const value = rest.join(':').trim();

    if (key === 'category') return { category: value };
    if (key === 'status') return { status: value === 'true' };
    if (key === 'available') return value === 'true' ? { stock: { $gt: 0 } } : { stock: { $lte: 0 } };
    if (key === 'stock') return value === 'true' ? { stock: { $gt: 0 } } : { stock: { $lte: 0 } };

    // fallback: tratarlo como categoría
    return { category: value };
  }

  // Disponibilidad simple
  if (['available', 'instock', 'in-stock', 'stock'].includes(q.toLowerCase())) return { stock: { $gt: 0 } };
  if (['unavailable', 'outofstock', 'out-of-stock', 'sin-stock'].includes(q.toLowerCase())) return { stock: { $lte: 0 } };

  // Status boolean simple 
  if (q === 'true' || q === 'false') return { status: q === 'true' };

  return { category: q };
}

router.get('/', async (req, res) => {
  try {
    // Query params
    const limit = toInt(req.query.limit, 10);
    let page = toInt(req.query.page, 1);
    const sort = req.query.sort ? String(req.query.sort).toLowerCase() : null;
    const query = req.query.query ? String(req.query.query) : null;

    const filter = buildFilter(query);

    // Sort por precio
    let sortObj = undefined;
    if (sort === 'asc') sortObj = { price: 1 };
    if (sort === 'desc') sortObj = { price: -1 };

    // Total + paginación (RECOMENDACION DE IA : usar Math.ceil !!)
    const total = await ProductModel.countDocuments(filter);
    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

    // Si piden una page mayor, la ajustamos al máximo disponible (si hay productos)
    if (totalPages > 0 && page > totalPages) page = totalPages;

    const skip = (page - 1) * limit;

    const payload = await ProductModel.find(filter)
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .lean();

    const links = buildLinks(req, { page, limit, sort, query, totalPages });

    return res.send({
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
    return res.status(500).send({
      status: 'error',
      payload: [],
      totalPages: 0,
      prevPage: null,
      nextPage: null,
      page: 1,
      hasPrevPage: false,
      hasNextPage: false,
      prevLink: null,
      nextLink: null,
      error: error.message
    });
  }
});

// Obtiene un producto por su ID.
router.get('/:pid', async (req, res) => {
  try {
    const productId = req.params.pid;
    const producto = await productManager.getById(productId);
    if (!producto) return res.send({ error: 'Producto no encontrado' });
    res.send({ producto });
  } catch (error) {
    res.send({ error: 'No se pudo leer el producto', detalle: error.message });
  }
});

// Crea un productop
router.post('/', async (req, res) => {
  try {
    const datos = req.body || {};

    if (
      !datos.title ||
      !datos.description ||
      !datos.code ||
      datos.price === undefined ||
      datos.status === undefined ||
      datos.stock === undefined ||
      !datos.category ||
      datos.drop === undefined
    ) {
      return res.send({ error: 'Faltan datos para crear el producto' });
    }

    const producto = await productManager.add(datos);
    res.send({ mensaje: 'Producto agregado', producto });
  } catch (error) {
    res.send({ error: error.message });
  }
});

// Actualiza un producto 
router.put('/:pid', async (req, res) => {
  try {
    const productId = req.params.pid;
    const cambios = req.body || {};
    const producto = await productManager.update(productId, cambios);
    res.send({ mensaje: 'Producto actualizado', producto });
  } catch (error) {
    res.send({ error: error.message });
  }
});

//  Elimina un producto por ID
router.delete('/:pid', async (req, res) => {
  try {
    const productId = req.params.pid;
    const eliminado = await productManager.delete(productId);
    res.send({ mensaje: 'Producto eliminado', eliminado });
  } catch (error) {
    res.send({ error: error.message });
  }
});

module.exports = router;
