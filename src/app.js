require('dotenv').config();

const express = require('express');
const path = require('path');
const handlebars = require('express-handlebars');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');

const productsRouter = require('./routes/products.router');
const cartsRouter = require('./routes/carts.router');
const viewsRouter = require('./routes/views.router');

const app = express();
const PORT = process.env.PORT || 8080;

const ProductManager = require('./managers/ProductManager');
const productManager = new ProductManager();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.engine('handlebars', handlebars.engine({
  helpers: {
    eq: (a, b) => String(a) === String(b)
  }
}));

app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

app.use('/api/products', productsRouter);
app.use('/api/carts', cartsRouter);
app.use('/', viewsRouter);

const httpServer = http.createServer(app);
const socketServer = new Server(httpServer);

app.set('socketServer', socketServer);

function isBadId(id) {
  return !id || String(id).trim() === '' || String(id).trim() === 'undefined' || String(id).trim() === 'null';
}

socketServer.on('connection', async (socket) => {
  console.log('Cliente conectado:', socket.id);

  try {
    const products = await productManager.getAll();
    socket.emit('productsUpdated', products);
  } catch (err) {
    socket.emit('productsUpdated', []);
  }

  socket.on('createProduct', async (data) => {
    try {
      await productManager.add(data);
      const updatedProducts = await productManager.getAll();
      socketServer.emit('productsUpdated', updatedProducts);
    } catch (error) {
      socket.emit('errorMessage', error.message);
    }
  });

  socket.on('updateProduct', async ({ id, changes }) => {
    try {
      if (isBadId(id)) {
        return socket.emit('errorMessage', 'ID inválido: llegó undefined/null. Revisá data-id en la vista realtime.');
      }
      if (!changes || typeof changes !== 'object' || Array.isArray(changes)) {
        return socket.emit('errorMessage', 'Cambios inválidos: se esperaba un objeto { changes }.');
      }

      await productManager.update(id, changes);
      const updatedProducts = await productManager.getAll();
      socketServer.emit('productsUpdated', updatedProducts);
    } catch (error) {
      socket.emit('errorMessage', error.message);
    }
  });

  socket.on('deleteProduct', async (id) => {
    try {
      if (isBadId(id)) {
        return socket.emit('errorMessage', 'ID inválido: llegó undefined/null. Revisá data-id en la vista realtime.');
      }

      await productManager.delete(id);
      const updatedProducts = await productManager.getAll();
      socketServer.emit('productsUpdated', updatedProducts);
    } catch (error) {
      socket.emit('errorMessage', error.message);
    }
  });
});

async function start() {
  try {
    if (!process.env.MONGO_URL) {
      throw new Error('Falta MONGO_URL en el archivo .env');
    }

    await mongoose.connect(process.env.MONGO_URL);
    console.log('MongoDB conectado');

    httpServer.listen(PORT, () => {
      console.log(`Servidor escuchando en http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Error conectando a MongoDB:', err.message);
    process.exit(1);
  }
}

start();
