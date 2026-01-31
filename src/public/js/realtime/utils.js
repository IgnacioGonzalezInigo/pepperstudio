export function alertMsg(alertZone, msg, type = 'danger') {
    alertZone.innerHTML = `
        <div class="alert alert-${type} alert-dismissible fade show">
            ${msg}
        <button class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
}

export function imgSrc(p) {
    return p?.thumbnails?.[0]
        ? '/img/' + p.thumbnails[0]
        : '/img/products/placeholder.jpg';
}

export function renderTable(container, products) {
    if (!products || !products.length) {
        container.innerHTML = '<div class="alert alert-light">No hay productos</div>';
        return;
    }

    const rows = products.map(p => `
        <tr>
        <td>
            <img src="${imgSrc(p)}" style="width:50px;height:50px;object-fit:cover" class="rounded">
        </td>
        <td>${p.title}</td>
        <td class="text-muted small">${p.description ?? ''}</td>
        <td>${p.category ?? ''}</td>
        <td class="text-end">$${p.price ?? 0}</td>
        <td class="text-end">${p.stock ?? 0}</td>
        <td class="small">${p.id}</td>
        <td class="text-center">${p.drop ?? '-'}</td>
        <td class="text-end">
            <button class="btn btn-sm btn-outline-primary btnEdit" data-id="${p.id}">
                ✏️
            </button>
            <button class="btn btn-sm btn-outline-danger btnDelete" data-id="${p.id}">
                🗑
            </button>
        </td>
        </tr>
    `).join('');

    container.innerHTML = `
        <div class="table-responsive">
        <table class="table align-middle table-hover">
            <thead>
            <tr>
                <th>Foto</th>
                <th>Título</th>
                <th>Descripción</th>
                <th>Categoría</th>
                <th class="text-end">Precio</th>
                <th class="text-end">Stock</th>
                <th>ID</th>
                <th>Drop</th>
                <th class="text-end">Acciones</th>
            </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>
        </div>
    `;
}