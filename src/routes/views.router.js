const { Router } = require('express');
const ProductManager = require('../managers/ProductManager');
const CartManager = require('../managers/CartManager');
const ProductModel = require('../models/Product.model');

const router = Router();
const productManager = new ProductManager();
const cartManager = new CartManager();


// HOME (landing)
router.get('/', async (req, res) => {
  try {
    const products = await productManager.getAll();

    const drops = products.map(p => Number(p.drop)).filter(n => Number.isFinite(n));
    const dropActual = drops.length ? Math.max(...drops) : null;

    const dropProducts = dropActual ? products.filter(p => Number(p.drop) === dropActual) : [];
    const chunkSize = 3;
    const dropChunks = [];
    for (let i = 0; i < dropProducts.length; i += chunkSize) {
      dropChunks.push(dropProducts.slice(i, i + chunkSize));
    }

    res.render('home', {
      title: 'Home',
      products,
      dropActual,
      dropProducts,
      dropChunks
    });
  } catch (error) {
    res.status(500).send(`Error cargando productos: ${error.message}`);
  }
});


//  Vista admin realtime
router.get('/realtimeproducts', async (req, res) => {
  try {
    const products = await productManager.getAll();
    res.render('realTimeProducts', {
      title: 'Productos en tiempo real',
      products
    });
  } catch (error) {
    res.status(500).send(`Error cargando productos: ${error.message}`);
  }
});

// visualizar productos
router.get('/products', async (req, res) => {
  try {
    const limit = Number(req.query.limit) > 0 ? Number(req.query.limit) : 10;
    const page = Number(req.query.page) > 0 ? Number(req.query.page) : 1;
    const sort = req.query.sort === 'asc' ? 1 : req.query.sort === 'desc' ? -1 : null;
    const query = req.query.query ? String(req.query.query).trim() : '';

    // Filtro por categoría o disponibilidad
    let filter = {};
    if (query) {
      const q = query.toLowerCase();
      if (q === 'available' || q === 'instock' || q === 'in-stock' || q === 'stock') {
        filter = { stock: { $gt: 0 } };
      } else if (q === 'unavailable' || q === 'outofstock' || q === 'out-of-stock' || q === 'sin-stock') {
        filter = { stock: { $lte: 0 } };
      } else if (q === 'true' || q === 'false') {
        filter = { status: q === 'true' };
      } else {
        filter = { category: query };
      }
    }

    const total = await ProductModel.countDocuments(filter);
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const safePage = Math.min(page, totalPages);
    const skip = (safePage - 1) * limit;

    const products = await ProductModel.find(filter)
      .sort(sort ? { price: sort } : undefined)
      .skip(skip)
      .limit(limit)
      .lean();

    const hasPrevPage = safePage > 1;
    const hasNextPage = safePage < totalPages;
    const prevPage = hasPrevPage ? safePage - 1 : null;
    const nextPage = hasNextPage ? safePage + 1 : null;

    // Links manteniendo params
    const base = '/products';
    const params = new URLSearchParams();
    params.set('limit', String(limit));
    if (req.query.sort) params.set('sort', String(req.query.sort));
    if (query) params.set('query', query);

    const prevLink = hasPrevPage
      ? `${base}?${new URLSearchParams({ ...Object.fromEntries(params), page: String(prevPage) }).toString()}`
      : null;

    const nextLink = hasNextPage
      ? `${base}?${new URLSearchParams({ ...Object.fromEntries(params), page: String(nextPage) }).toString()}`
      : null;

    res.render('products', {
      title: 'Productos',
      products,
      page: safePage,
      totalPages,
      hasPrevPage,
      hasNextPage,
      prevLink,
      nextLink,
      limit,
      sortValue: req.query.sort || '',
      queryValue: query
    });
  } catch (error) {
    res.status(500).send(`Error cargando /products: ${error.message}`);
  }
});

// vista detalle del producto 
router.get('/products/:pid', async (req, res) => {
  try {
    const pid = req.params.pid;
    const product = await ProductModel.findById(pid).lean();
    if (!product) return res.status(404).send('Producto no encontrado');

    res.render('productDetail', {
      title: product.title,
      product
    });
  } catch (error) {
    res.status(500).send(`Error cargando producto: ${error.message}`);
  }
});

// vista carrito específico listando solo con loxxs productos del carrito.
router.get('/carts/:cid', async (req, res) => {
  try {
    const cid = req.params.cid;
    const carrito = await cartManager.getById(cid, { populate: true });
    if (!carrito) return res.status(404).send('Carrito no encontrado');

    const items = (carrito.products || []).map(i => {
      const price = i.product?.price || 0;
      const qty = i.quantity || 0;
      return {
        ...i,
        lineTotal: price * qty
      };
    });

    const total = items.reduce((acc, i) => acc + (i.lineTotal || 0), 0);

    res.render('cart', {
      title: `Carrito`,
      cid,
      items,
      total
    });
  } catch (error) {
    res.status(500).send(`Error cargando carrito: ${error.message}`);
  }
});

// cartRedirect 
router.get('/cart', (req, res) => {
  res.render('cartRedirect', { title: 'Tu Carrito' });
});

module.exports = router;
