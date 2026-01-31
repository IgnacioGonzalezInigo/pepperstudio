const ProductModel = require('../models/Product.model');

class ProductManager {
  
  // Todos los productos
  async getAll() {
    return ProductModel.find().lean();
  }

  // Obtiene el producto por ID
  async getById(id) {
    return ProductModel.findById(id).lean();
  }

  // Crea un producto
  async add(datos) {
    const requeridos = [
      'title',
      'description',
      'code',
      'price',
      'status',
      'stock',
      'category',
      'drop'
    ];

    for (const campo of requeridos) {
      if (datos[campo] === undefined) throw new Error(`Falta el campo: ${campo}`);
    }

    const existe = await ProductModel.findOne({ code: String(datos.code) }).lean();
    if (existe) throw new Error('El "code" ya existe, debe ser único');

    const nuevo = await ProductModel.create({
      title: String(datos.title),
      description: String(datos.description),
      code: String(datos.code),
      price: Number(datos.price),
      status: Boolean(datos.status),
      stock: Number(datos.stock),
      category: String(datos.category),
      drop: Number(datos.drop),
      thumbnails: Array.isArray(datos.thumbnails) ? datos.thumbnails.map(String) : []
    });

    return nuevo.toObject();
  }

  // Actualiza un producto por ID 
  async update(id, cambios) {
    if ('id' in cambios) delete cambios.id;
    if ('_id' in cambios) delete cambios._id;

    if (cambios.code !== undefined) {
      const existe = await ProductModel.findOne({
        code: String(cambios.code),
        _id: { $ne: id }
      }).lean();

      if (existe) throw new Error('El "code" ingresado ya existe en otro producto');
    }

    const toSet = {};

    if (cambios.title !== undefined) toSet.title = String(cambios.title);
    if (cambios.description !== undefined) toSet.description = String(cambios.description);
    if (cambios.code !== undefined) toSet.code = String(cambios.code);
    if (cambios.price !== undefined) toSet.price = Number(cambios.price);
    if (cambios.status !== undefined) toSet.status = Boolean(cambios.status);
    if (cambios.stock !== undefined) toSet.stock = Number(cambios.stock);
    if (cambios.category !== undefined) toSet.category = String(cambios.category);
    if (cambios.drop !== undefined) toSet.drop = Number(cambios.drop);

    if (cambios.thumbnails !== undefined) {
      if (Array.isArray(cambios.thumbnails)) {
        toSet.thumbnails = cambios.thumbnails.map(String);
      }
    }

    const actualizado = await ProductModel.findByIdAndUpdate(
      id,
      { $set: toSet },
      { new: true }
    ).lean();

    if (!actualizado) throw new Error('Producto no encontrado');
    return actualizado;
  }

  // Elimina un producto por ID
  async delete(id) {
    const eliminado = await ProductModel.findByIdAndDelete(id).lean();
    if (!eliminado) throw new Error('Producto no encontrado');
    return eliminado;
  }
}

module.exports = ProductManager;
