document.addEventListener('DOMContentLoaded', () => {
  const container = document.querySelector('[data-cid]');
  if (!container) return;

  const cid = container.getAttribute('data-cid');

  const tbody = document.getElementById('cartTbody');
  const totalEl = document.getElementById('cartTotal');
  const countEl = document.getElementById('cartItemsCount');
  const clearBtn = document.querySelector('.js-clear-cart');

  // ---- helpers ----
  function toInt(v, fallback = 1) {
    const n = Number(v);
    if (!Number.isFinite(n)) return fallback;
    const i = Math.floor(n);
    return i >= 1 ? i : fallback;
  }

  function formatARS(n) {
    return `$${Number(n || 0)}`;
  }

  function recalc() {
    let total = 0;
    const rows = document.querySelectorAll('tr.js-item');

    rows.forEach(row => {
      const priceEl = row.querySelector('.js-price');
      const qtyEl = row.querySelector('.js-qty');
      const lineEl = row.querySelector('.js-line-total');

      const price = Number(priceEl?.dataset?.price || 0);
      const qty = toInt(qtyEl?.value, 1);

      const line = price * qty;
      total += line;

      if (lineEl) lineEl.textContent = formatARS(line);
    });

    if (totalEl) totalEl.textContent = formatARS(total);
    if (countEl) countEl.textContent = String(rows.length);
  }

  async function api(url, method, body) {
    const opts = { method, headers: {} };
    if (body) {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }
    const res = await fetch(url, opts);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
    if (data?.error) throw new Error(data.error);
    return data;
  }

  async function setQuantity(pid, quantity) {
    // PUT /api/carts/:cid/products/:pid
    return api(`/api/carts/${cid}/products/${pid}`, 'PUT', { quantity });
  }

  async function removeProduct(pid) {
    // DELETE /api/carts/:cid/products/:pid
    return api(`/api/carts/${cid}/products/${pid}`, 'DELETE');
  }

  async function clearCart() {
    // DELETE /api/carts/:cid
    return api(`/api/carts/${cid}`, 'DELETE');
  }

  recalc();

  // Vaciar carrito
  if (clearBtn) {
    clearBtn.addEventListener('click', async () => {
      const ok = confirm('¿Vaciar carrito?');
      if (!ok) return;

      try {
        await clearCart();
        location.reload();
      } catch (e) {
        alert(e.message);
      }
    });
  }

  // Clicks (+, -, eliminar)
  if (tbody) {
    tbody.addEventListener('click', async (e) => {
      const row = e.target.closest('tr.js-item');
      if (!row) return;

      const pid = row.getAttribute('data-pid');
      const qtyInput = row.querySelector('.js-qty');
      const qty = toInt(qtyInput.value, 1);

      // Eliminar explícito
      if (e.target.closest('.js-remove')) {
        try {
          await removeProduct(pid);
          row.remove();
          recalc();
          if (!document.querySelector('tr.js-item')) location.reload();
        } catch (err) {
          alert(err.message);
        }
        return;
      }

      // Sumar
      if (e.target.closest('.js-inc')) {
        try {
          const next = qty + 1;
          await setQuantity(pid, next);
          qtyInput.value = String(next);
          recalc();
        } catch (err) {
          alert(err.message);
        }
        return;
      }

      // Restar 
      if (e.target.closest('.js-dec')) {
        try {
          if (qty <= 1) {
            await removeProduct(pid);
            row.remove();
            recalc();
            if (!document.querySelector('tr.js-item')) location.reload();
          } else {
            const next = qty - 1;
            await setQuantity(pid, next);
            qtyInput.value = String(next);
            recalc();
          }
        } catch (err) {
          alert(err.message);
        }
        return;
      }
    });

    // a mano input
    tbody.addEventListener('change', async (e) => {
      const input = e.target.closest('.js-qty');
      if (!input) return;

      const row = e.target.closest('tr.js-item');
      const pid = row.getAttribute('data-pid');

      let qty = toInt(input.value, 1);

      try {
        await setQuantity(pid, qty);
        input.value = String(qty);
        recalc();
      } catch (err) {
        alert(err.message);
      }
    });
  }
});