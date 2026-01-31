// public/js/cart/cartClient.js

async function ensureCartId() {
  let cid = localStorage.getItem('cid');

  // Si ya hay un cid guardado, verificamos que el carrito exista
  if (cid) {
    try {
      const check = await fetch(`/api/carts/${cid}`);
      const checkData = await check.json();

      if (checkData?.carrito?._id) return cid;

      localStorage.removeItem('cid');
      cid = null;
    } catch (err) {
      // si no se puede chequear por red/servidor, devolvemos el que haya
      return cid;
    }
  }

  // Crear carrito nuevo
  const res = await fetch('/api/carts', { method: 'POST' });
  const data = await res.json();

  if (!data?.carrito?._id) throw new Error(data?.error || 'No se pudo crear el carrito');

  cid = data.carrito._id;
  localStorage.setItem('cid', cid);
  return cid;
}

function syncCartLinks(cid) {
  if (!cid) return;
  const links = document.querySelectorAll('a[href="/cart"]');
  links.forEach(a => a.setAttribute('href', `/carts/${cid}`));
}

async function addToCart(pid, quantity = 1) {
  const cid = await ensureCartId();
  syncCartLinks(cid);

  const res = await fetch(`/api/carts/${cid}/product/${pid}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quantity })
  });

  const data = await res.json();
  if (data?.error) throw new Error(data.error);

  return { cid, data };
}

function setButtonState(btn, { disabled, text }) {
  if (!btn) return;
  btn.disabled = !!disabled;
  if (typeof text === 'string') btn.textContent = text;
}

// Apenas carga la página, si ya existe cid, actualizamos link /cart
document.addEventListener('DOMContentLoaded', () => {
  const cid = localStorage.getItem('cid');
  if (cid) syncCartLinks(cid);
});

document.addEventListener('click', async (e) => {
  const btn = e.target.closest('.js-add-to-cart');
  if (!btn) return;

  const pid = btn.dataset.pid;
  if (!pid) return alert('Falta data-pid en el botón');

  const originalText = btn.textContent || 'Agregar';

  try {
    setButtonState(btn, { disabled: true, text: 'Agregando...' });

    await addToCart(pid, 1);

    setButtonState(btn, { disabled: true, text: 'Agregado ✅' });
    setTimeout(() => setButtonState(btn, { disabled: false, text: originalText }), 900);
  } catch (err) {
    alert(err.message);
    setButtonState(btn, { disabled: false, text: originalText });
  }
});
