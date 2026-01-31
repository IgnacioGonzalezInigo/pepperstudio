function money(n) {
    return `$${Number(n || 0)} ARS`;
}

function alertMsg(zone, msg, type = "danger") {
    if (!zone) return;
    zone.innerHTML = `
        <div class="alert alert-${type} alert-dismissible fade show">
        ${msg}
        <button class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
}

function renderEmpty(container) {
    container.innerHTML = `<div class="alert alert-light border mb-0">Tu carrito está vacío.</div>`;
}

// Storage
function getCartId() {
    return localStorage.getItem("cid");
}

// API
async function fetchCart(cid) {
    const res = await fetch(`/api/carts/${cid}`);
    const data = await res.json();
    if (data?.error) throw new Error(data.error);
    return data.productos || [];
}

// ACLARACION! Me ayude con IA para resolver un problema que tenia con esta funcion!!
async function fetchAllProducts() {
    const res = await fetch('/api/products');
    const data = await res.json();

    if (Array.isArray(data?.productos)) return data.productos; 

    console.error('Formato inesperado en /api/products:', data);
    return [];
}

function getProductKey(p) {
    const raw = p?.id ?? p?._id ?? p?.pid ?? p?.code;
    return raw ? String(raw).trim() : null;
}

// Render
function renderCart(container, items, productsIndex) {
    if (!items.length) {
        renderEmpty(container);
        return;
    }

    const rows = items
        .map((i) => {
        const key = String(i.product).trim();    
        const p = productsIndex.get(key);         
        
        console.log (p)
        
        const title = p?.title ?? `Producto no encontrado (id=${key})`;
        const price = Number(p?.price ?? 0);
        const qty = Number(i.quantity ?? 0);
        const subtotal = price * qty;

        return `
            <tr>
            <td>${title}</td>
            <td class="text-end">${qty}</td>
            <td class="text-end">${money(price)}</td>
            <td class="text-end">${money(subtotal)}</td>
            </tr>
        `;
        })
        .join("");

    const total = items.reduce((acc, i) => {
        const key = String(i.product).trim();
        const p = productsIndex.get(key);
        return acc + Number(p?.price ?? 0) * Number(i.quantity ?? 0);
    }, 0);

    container.innerHTML = `
        <div class="table-responsive">
        <table class="table align-middle">
            <thead>
            <tr>
                <th>Producto</th>
                <th class="text-end">Qty</th>
                <th class="text-end">Precio</th>
                <th class="text-end">Subtotal</th>
            </tr>
            </thead>
            <tbody>${rows}</tbody>
            <tfoot>
            <tr>
                <th colspan="3" class="text-end">Total</th>
                <th class="text-end">${money(total)}</th>
            </tr>
            </tfoot>
        </table>
        </div>
    `;
    }

    // Init
    async function initCartPage() {
    const container = document.getElementById("cartContainer");
    const alertZone = document.getElementById("cartAlert");

    if (!container) {
        console.error("Falta #cartContainer en la vista cart.handlebars");
        return;
    }

    try {
        const cid = getCartId();

        if (!cid) {
        renderEmpty(container);
        return;
        }

        const [items, allProducts] = await Promise.all([
        fetchCart(cid),
        fetchAllProducts(),
        ]);

        const productsIndex = new Map(
        allProducts.map(p => [String(p.id).trim(), p])
        );
        console.log(productsIndex)

        renderCart(container, items, productsIndex);
    } catch (err) {
        if (String(err.message).includes("Carrito no encontrado")) {
        localStorage.removeItem("cid");
        }
        alertMsg(alertZone, err.message);
        renderEmpty(container);
    }
}

initCartPage();
