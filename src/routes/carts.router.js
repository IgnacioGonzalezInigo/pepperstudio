const { Router } = require('express');
const CartManager = require('../managers/CartManager');
const ProductManager = require('../managers/ProductManager');
const router = Router();
const cartManager = new CartManager();
const productManager = new ProductManager();

// Obtiene un carrito por ID y devuelve los productos con populate
router.get('/:cid', async (req, res) => {
  try {
    const cartId = req.params.cid;
    const carrito = await cartManager.getById(cartId, { populate: true });
    if (!carrito) return res.send({ error: 'Carrito no encontrado' });

    res.send({ carrito });
  } catch (error) {
    res.send({ error: error.message });
  }
});

// Crea un carrito vacío.
router.post('/', async (req, res) => {
  try {
    const carrito = await cartManager.create();
    res.send({ mensaje: 'Carrito creado', carrito });
  } catch (error) {
    res.send({ error: error.message });
  }
});

//  Agrega un producto a un carrito (si existe, incrementa cantidadd)
router.post('/:cid/product/:pid', async (req, res) => {
  try {
    const cartId = req.params.cid;
    const productId = req.params.pid;
    const quantity = req.body && req.body.quantity ? Number(req.body.quantity) : 1;

    const existeProducto = await productManager.getById(productId);
    if (!existeProducto) return res.send({ error: 'El producto no existe' });

    const carrito = await cartManager.addProduct(cartId, productId, quantity);
    res.send({ mensaje: 'Producto agregado al carrito', carrito });
  } catch (error) {
    res.send({ error: error.message });
  }
});

// Elimina del carrito el producto seleccionado.
router.delete('/:cid/products/:pid', async (req, res) => {
  try {
    const { cid, pid } = req.params;
    const carrito = await cartManager.removeProduct(cid, pid);
    res.send({ mensaje: 'Producto eliminado del carrito', carrito });
  } catch (error) {
    res.send({ error: error.message });
  }
});

// Reemplaza todos los productos del carrito con un arreglo nuevo
router.put('/:cid', async (req, res) => {
  try {
    const { cid } = req.params;
    const { products } = req.body || {};
    const carrito = await cartManager.replaceProducts(cid, products);
    res.send({ mensaje: 'Carrito actualizado', carrito });
  } catch (error) {
    res.send({ error: error.message });
  }
});

// Actualiza la cantidad (quantity) de un producto del carrito.
router.put('/:cid/products/:pid', async (req, res) => {
  try {
    const { cid, pid } = req.params;
    const { quantity } = req.body || {};
    const carrito = await cartManager.updateQuantity(cid, pid, quantity);
    res.send({ mensaje: 'Cantidad actualizada', carrito });
  } catch (error) {
    res.send({ error: error.message });
  }
});

// Vaciar carritoo
router.delete('/:cid', async (req, res) => {
  try {
    const { cid } = req.params;
    const carrito = await cartManager.clear(cid);
    res.send({ mensaje: 'Carrito vaciado', carrito });
  } catch (error) {
    res.send({ error: error.message });
  }
});

module.exports = router;
