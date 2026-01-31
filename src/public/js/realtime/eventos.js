import { socket } from './conexionSocket.js';
import { alertMsg, renderTable } from './utils.js';


const form = document.getElementById('productForm');  
const createForm = document.getElementById('createForm');
const editForm = document.getElementById('editForm');

const container = document.getElementById('productsContainer');
const alertZone = document.getElementById('alertZone');

const crearProducto = document.getElementById('crearProducto');
const cancelEdit = document.getElementById('cancelEdit');
const cancelCreate = document.getElementById('cancelCreate');

let allProducts = []; 

if (!form || !container || !alertZone) {
    console.error('Faltan nodos del DOM (productForm / productsContainer / alertZone).');
}

// Crear producto

form?.addEventListener('submit', (e) => {
    e.preventDefault();

    const data = {
        title: form.title.value,
        description: form.description.value,
        code: form.code.value,
        price: Number(form.price.value),
        stock: Number(form.stock.value),
        category: form.category.value,
        drop: Number(form.drop.value),
        status: true,
        thumbnails: form.thumbnail.value ? [form.thumbnail.value] : []
    };

    socket.emit('createProduct', data);
    form.reset();
});

crearProducto?.addEventListener('click', () => {
    createForm?.classList.remove('d-none');
    form?.classList.remove('d-none');
    form?.reset();

});

// Eliminar y modificar productos
container?.addEventListener('click', (e) => {
    const delBtn = e.target.closest('.btnDelete');
    const editBtn = e.target.closest('.btnEdit');

    if (delBtn) {
        socket.emit('deleteProduct', delBtn.dataset.id);
        return;
    }

    if (editBtn) {
        const id = editBtn.dataset.id;
        const product = allProducts.find(p => String(p.id) === String(id));
        if (!product) return;

        // mostrar form
        editForm.classList.remove('d-none');

        
        editForm.id.value = product.id;
        editForm.title.value = product.title ?? '';
        editForm.description.value = product.description ?? '';
        editForm.price.value = product.price ?? 0;
        editForm.stock.value = product.stock ?? 0;
        editForm.drop.value = product.drop ?? '';
        editForm.thumbnail.value = product?.thumbnails?.[0] ?? '';

    }
});

editForm?.addEventListener('submit', (e) => {
    e.preventDefault();

    const id = editForm.id.value;

    const changes = {
        title: editForm.title.value,
        description: editForm.description.value,
        price: Number(editForm.price.value),
        stock: Number(editForm.stock.value),
        drop: Number(editForm.drop.value),
        thumbnails: editForm.thumbnail.value ? [editForm.thumbnail.value] : []
    };

    socket.emit('updateProduct', { id, changes });
    editForm.classList.add('d-none');
});

// Botones de cancelar agregar/editar un producto --> OCULTAR VISTA DEL FORMULAARIO
cancelEdit?.addEventListener('click', () => {
    editForm.classList.add('d-none');
});

cancelCreate?.addEventListener('click', () => {
    createForm.classList.add('d-none');
});

// Sockets
socket.on('productsUpdated', (products) => {
    allProducts = products || [];
    renderTable(container, allProducts);
});

socket.on('errorMessage', (msg) => {
    alertMsg(alertZone, msg, 'danger');
});