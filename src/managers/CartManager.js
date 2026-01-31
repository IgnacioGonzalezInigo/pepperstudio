const CartModel = require('../models/Cart.model');

class CartManager {

  // Crea un carrito VACIO
  async create() {
    const nuevo = await CartModel.create({ products: [] });
    return nuevo.toObject();
  }

  // Obtener carrito por ID
  async getById(cid, { populate = false } = {}) {
    const query = CartModel.findById(cid);

    if (populate) {
      query.populate('products.product');
    }

    const carrito = await query.lean();
    return carrito || null;
  }

  // Agregar producto al carrito o incrementar su cantidad
  async addProduct(cid, pid, quantity = 1) {
    const q = Number(quantity || 1);
    if (!Number.isFinite(q) || q <= 0) {
      throw new Error('La cantidad debe ser mayor a 0');
    }

    const cart = await CartModel.findById(cid);
    if (!cart) {
      throw new Error('Carrito no encontrado');
    }

    const existente = cart.products.find(
      p => String(p.product) === String(pid)
    );

    if (existente) {
      // Si existe, le incremento la cantidad de producto en 1
      existente.quantity = Number(existente.quantity) + q;
    } else {
      // Si no existe, lo agrego con cantidad 1
      cart.products.push({ product: pid, quantity: q });
    }

    await cart.save();
    return cart.toObject();
  }

  // Elimina un producto del carrito por ID
  async removeProduct(cid, pid) {
    const cart = await CartModel.findById(cid);
    if (!cart) {
      throw new Error('Carrito no encontrado');
    }

    const before = cart.products.length;

    cart.products = cart.products.filter(
      p => String(p.product) !== String(pid)
    );

    if (cart.products.length === before) {
      throw new Error('Producto no encontrado en el carrito');
    }

    await cart.save();
    return cart.toObject();
  }

  // Reemplaza completamente los productos del carrito
  async replaceProducts(cid, productsArray) {
    if (!Array.isArray(productsArray)) {
      throw new Error('products debe ser un arreglo');
    }

    for (const item of productsArray) {
      if (!item || !item.product) {
        throw new Error('Cada item debe tener product');
      }

      const q = Number(item.quantity || 1);
      if (!Number.isFinite(q) || q <= 0) {
        throw new Error('quantity debe ser mayor a 0');
      }
    }

    const cart = await CartModel.findById(cid);
    if (!cart) {
      throw new Error('Carrito no encontrado');
    }
    cart.products = productsArray.map(item => ({
      product: item.product,
      quantity: Number(item.quantity || 1)
    }));

    await cart.save();
    return cart.toObject();
  }

  // Actualiza la cantidad de un producto del carrito
  async updateQuantity(cid, pid, quantity) {
    const q = Number(quantity);
    if (!Number.isFinite(q) || q <= 0) {
      throw new Error('La cantidad debe ser mayor a 0');
    }

    const cart = await CartModel.findById(cid);
    if (!cart) {
      throw new Error('Carrito no encontrado');
    }

    const item = cart.products.find(
      p => String(p.product) === String(pid)
    );

    if (!item) {
      throw new Error('Producto no encontrado en el carrito');
    }

    item.quantity = q;
    await cart.save();
    return cart.toObject();
  }

  // Vacia el carrtio
  async clear(cid) {
    const cart = await CartModel.findById(cid);
    if (!cart) {
      throw new Error('Carrito no encontrado');
    }

    cart.products = [];
    await cart.save();
    return cart.toObject();
  }
}

module.exports = CartManager;
