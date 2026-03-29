// =====================================================
// MAGHRIBI STORE — cart.js
// Shared Cart logic used by inner pages (cart, checkout, thankyou)
// Home page uses main.js which also defines Cart + buildWAURL
// =====================================================

// Only define if not already defined by main.js
if (typeof Cart === 'undefined') {

  var Cart = {
    KEY: 'maghribi_cart',
    getAll() { try { return JSON.parse(localStorage.getItem(this.KEY)) || []; } catch { return []; } },
    save(items) { localStorage.setItem(this.KEY, JSON.stringify(items)); this.updateBadge(); },
    add(p) {
      const items = this.getAll();
      const i = items.findIndex(x => x.id === p.id && x.size === p.size);
      if (i > -1) items[i].qty += p.qty || 1;
      else items.push({ ...p, qty: p.qty || 1 });
      this.save(items);
      showToast(`✅ Produit ajouté au panier!`);
      this.updateBadge();
    },
    remove(idx) {
      const items = this.getAll();
      items.splice(idx, 1);
      this.save(items);
      if(typeof renderCart === 'function') renderCart();
    },
    updateQty(idx, dir) {
      const items = this.getAll();
      if(items[idx]) {
        items[idx].qty += dir;
        if(items[idx].qty <= 0) items.splice(idx, 1);
      }
      this.save(items);
      if(typeof renderCart === 'function') renderCart();
    },
    clear() { localStorage.removeItem(this.KEY); this.updateBadge(); },
    count() { return this.getAll().reduce((s, i) => s + i.qty, 0); },
    total() { return this.getAll().reduce((s, i) => s + i.price * i.qty, 0); },
    updateBadge() {
      const c = this.count();
      document.querySelectorAll('.cart-count-badge').forEach(b => {
        b.textContent = c; b.style.display = c > 0 ? 'flex' : 'none';
      });
    }
  };

}

// Shared toast (if not defined by main.js)
if (typeof showToast === 'undefined') {
  function showToast(msg, type = 'success') {
    let ctr = document.querySelector('.toast-container');
    if (!ctr) { ctr = document.createElement('div'); ctr.className = 'toast-container'; document.body.appendChild(ctr); }
    const t = document.createElement('div');
    t.className = `toast${type === 'error' ? ' error' : ''}`;
    t.innerHTML = msg;
    ctr.appendChild(t);
    setTimeout(() => { t.style.animation = 'toastOut .3s ease forwards'; setTimeout(() => t.remove(), 320); }, 3400);
  }
}

// Shared buildWAURL (if not defined by main.js)
if (typeof buildWAURL === 'undefined') {
  function buildWAURL(product) {
    const phone = '212600000000';
    const msg = product
      ? `Bonjour 👋 Je voudrais commander *${product.name}* (${product.price} د.م.) depuis Maghribi Store 🇲🇦`
      : `Bonjour 👋 Je voudrais commander depuis *Maghribi Store* 🇲🇦`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  }
}

// Shared PRODUCTS data (if not defined by main.js)
if (typeof PRODUCTS === 'undefined') {
  var PRODUCTS = [
    { id:'jersey-red', name:'Atlas Lions Classic Rouge', price:299, oldPrice:399, image:'images/jersey_red.png', badge:'NOUVEAU', badgeClass:'badge-new', category:'Classic Collection', sizes:['S','M','L','XL','XXL'], rating:5, reviews:128, shortDesc:'Maillot rouge emblématique avec étoile marocaine.', longDesc:'...' },
    { id:'jersey-white', name:'Atlas Lions Away Blanc', price:279, oldPrice:349, image:'images/jersey_white.png', badge:'NOUVEAU', badgeClass:'badge-new', category:'Away Collection', sizes:['S','M','L','XL','XXL'], rating:5, reviews:95, shortDesc:'Edition Away en blanc avec accents marocains.', longDesc:'...' },
    { id:'jersey-green', name:'Maghrib Premium Vert', price:349, oldPrice:450, image:'images/jersey_green.png', badge:'PROMO', badgeClass:'badge-promo', category:'Premium Collection', sizes:['S','M','L','XL'], rating:5, reviews:62, shortDesc:'Edition premium avec détails dorés.', longDesc:'...' },
    { id:'jersey-black', name:'Atlas Lions Spéciale Noire', price:329, oldPrice:420, image:'images/jersey_black.png', badge:'PROMO', badgeClass:'badge-promo', category:'Special Edition', sizes:['S','M','L','XL','XXL'], rating:4, reviews:48, shortDesc:'Edition collector noire avec dégradé.', longDesc:'...' }
  ];
}

// Shared starsHTML (if not defined by main.js)
if (typeof starsHTML === 'undefined') {
  function starsHTML(r) { return Array.from({length:5},(_,i)=>`<span style="color:${i<r?'var(--gold)':'#ddd'}">★</span>`).join(''); }
}
