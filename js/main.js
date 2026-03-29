// =====================================================
// MAGHRIBI STORE — MAIN.JS
// Hero slider, scroll reveal, product render, WhatsApp
// =====================================================

// 1. DYNAMIC PRODUCTS LOAD FROM ADMIN
function loadStoreProducts() {
  try {
    const s = localStorage.getItem('admin_products');
    if (s) {
      const parsed = JSON.parse(s).filter(p => p.status === true);
      if (parsed.length > 0) return parsed;
    }
  } catch(e) {}
  // Default fallback
  return [{
    id: 'ez-outlet', name: 'EZ Outlet — La Multiprise', price: 149, oldPrice: 199,
    image: 'images/ez_outlet.png', badge: 'NOUVEAU', badgeClass: 'badge-new', category: 'Accessoires',
    sizes: ['Standard'], rating: 5, reviews: 128
  }];
}
var PRODUCTS = loadStoreProducts();

// ---- WhatsApp Config ----
// 2. DYNAMIC SETTINGS LOAD FROM ADMIN
function getAdminPhone() {
  try {
    const s = localStorage.getItem('admin_settings');
    if(s) { return JSON.parse(s).phone || '212600000000'; }
  } catch(e){}
  return '212600000000';
}
var WA_PHONE = getAdminPhone();

function buildWAURL(product = null) {
  let msg = '';
  if (product) {
    // Custom check for the Hero Product name
    const isHero = product.name.toLowerCase().includes('maillot du maroc') && product.name.toLowerCase().includes('2026');
    if (isHero) {
      msg = `Bonjour, je voudrais commander:\n⚽ ${product.name}\n📏 Taille: [Choisir une taille: S, M, L, XL, XXL]\n🔢 Quantité: 1\n💰 Prix: ${product.price} MAD`;
    } else {
      msg = `Bonjour, je voudrais commander: ${product.name} - ${product.price} MAD. Livraison à: [Votre Ville]`;
    }
  } else {
    msg = `Bonjour 👋 Je voudrais commander depuis *Maghribi Store* 🇲🇦\nPouvez-vous m'aider s'il vous plaît ?`;
  }
  return `https://wa.me/${WA_PHONE}?text=${encodeURIComponent(msg)}`;
}

function formatPrice(n) { return `${n} <span style="font-size:.75em;font-family:var(--font-arabic)">د.م.</span>`; }
function starsHTML(r) { return Array.from({length:5},(_,i)=>`<span style="color:${i<r?'var(--gold)':'#ddd'}">★</span>`).join(''); }

// ---- Toast ----
function showToast(msg, type='success') {
  let ctr = document.querySelector('.toast-container');
  if (!ctr) { ctr = document.createElement('div'); ctr.className='toast-container'; document.body.appendChild(ctr); }
  const t = document.createElement('div');
  t.className = `toast${type==='error'?' error':''}`;
  t.innerHTML = msg;
  ctr.appendChild(t);
  setTimeout(() => { t.style.animation='toastOut .3s ease forwards'; setTimeout(()=>t.remove(),320); }, 3400);
}

// =====================================================
// CART
// =====================================================
var Cart = {
  KEY: 'maghribi_cart',
  getAll(){ try{return JSON.parse(localStorage.getItem(this.KEY))||[];}catch{return[];} },
  save(items){ localStorage.setItem(this.KEY,JSON.stringify(items)); this.updateBadge(); },
  add(p){
    const items=this.getAll();
    const i=items.findIndex(x=>x.id===p.id&&x.size===p.size);
    if(i>-1) items[i].qty+=p.qty||1;
    else items.push({...p,qty:p.qty||1});
    this.save(items);
    showToast(`✅ <strong>${p.name}</strong> ajouté au panier !`);
  },
  remove(id,size){ const items=this.getAll().filter(i=>!(i.id===id&&i.size===size)); this.save(items); },
  updateQty(id,size,qty){ const items=this.getAll(); const i=items.findIndex(x=>x.id===id&&x.size===size); if(i>-1){ if(qty<=0)return this.remove(id,size); items[i].qty=qty; } this.save(items); },
  clear(){ localStorage.removeItem(this.KEY); this.updateBadge(); },
  count(){ return this.getAll().reduce((s,i)=>s+i.qty,0); },
  total(){ return this.getAll().reduce((s,i)=>s+i.price*i.qty,0); },
  updateBadge(){
    const c=this.count();
    document.querySelectorAll('.cart-count-badge').forEach(b=>{
      b.textContent=c; b.style.display=c>0?'flex':'none';
    });
  }
};

// =====================================================
// VANILLA JS HERO SLIDER
// =====================================================
let currentSlide = 0;
let slideTimer = null;

function goToSlide(n) {
  const track = document.getElementById('slider-track');
  const dots = document.querySelectorAll('.slider-dot');
  if (!track) return;
  
  const slides = document.querySelectorAll('.slide');
  const total = slides.length;
  currentSlide = ((n % total) + total) % total;
  
  // The Transition: transform: translateX(-100%)
  const translateValue = `translateX(-${currentSlide * 100}%)`;
  track.style.transform = translateValue;
  console.log(`Setting track transform to: ${translateValue}`);
  
  dots.forEach((d, i) => d.classList.toggle('active', i === currentSlide));
}

function nextSlide() { goToSlide(currentSlide + 1); }
function prevSlide() { goToSlide(currentSlide - 1); }

function resetSlider() {
  clearInterval(slideTimer);
  slideTimer = setInterval(nextSlide, 3000); // Auto-play every 3s
}

function initSlider() {
  const prevBtn = document.getElementById('slider-prev');
  const nextBtn = document.getElementById('slider-next');
  
  if (prevBtn) {
    prevBtn.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('Clicked Prev Arrow');
      prevSlide();
      resetSlider();
    });
  }
  
  if (nextBtn) {
    nextBtn.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('Clicked Next Arrow');
      nextSlide();
      resetSlider();
    });
  }
  
  document.querySelectorAll('.slider-dot').forEach(dot => {
    dot.addEventListener('click', (e) => {
      e.preventDefault();
      goToSlide(parseInt(dot.dataset.slide));
      resetSlider();
    });
  });

  resetSlider(); // Start autoplay loop
}

// =====================================================
// SCROLL REVEAL
// =====================================================
let revealObserver = null;
function initReveal() {
  if (revealObserver) revealObserver.disconnect();
  revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        revealObserver.unobserve(e.target);
      }
    });
  }, { threshold: 0, rootMargin: '400px 0px 400px 0px' });

  document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight + 400) {
      el.classList.add('visible');
    } else {
      revealObserver.observe(el);
    }
  });

  // Fallback: reveal everything after 1.5s if observer didn't fire
  setTimeout(() => {
    document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach(el => el.classList.add('visible'));
  }, 1500);
}

// =====================================================
// PRODUCT CARDS RENDER
// =====================================================
function productCardHTML(p) {
  let mainImg = 'https://placehold.co/400x400/0D3B38/C9A227?text=Produit';
  let secondImg = null;
  
  if(p.images && p.images.length > 0) {
    mainImg = p.mainImage || p.images[0];
    if(p.images.length > 1) secondImg = p.images[1];
  } else if(p.image || p.img) {
    mainImg = p.image || p.img;
  }

  return `
    <article class="product-card reveal" onclick="openProductModal('${p.id}')" tabindex="0" aria-label="${p.name}">
      ${p.badge ? `<span class="product-badge ${p.badgeClass}">${p.badge}</span>` : ''}
      <button class="product-wishlist" onclick="event.stopPropagation(); addToWishlist('${p.id}')" title="Ajouter aux favoris" aria-label="Favori">♡</button>
      <div class="product-img-wrap">
        <img src="${mainImg}" alt="${p.name}" loading="lazy" onerror="this.onerror=null;this.src='https://placehold.co/400x400/0D3B38/C9A227?text=Image+non+disponible';"/>
        ${secondImg ? `<img src="${secondImg}" alt="${p.name} alternate" class="card-img-back" loading="lazy" onerror="this.style.display='none'">` : ''}
      </div>
      <div class="product-info">
        <div class="prod-category">${p.category}</div>
        <h3>${p.name}</h3>
        <div class="product-price-row">
          <div>
            <span class="prod-price">${p.price} <span style="font-size:.72em;font-family:var(--font-arabic)">د.م.</span></span>
            ${p.oldPrice ? `<span class="prod-price-old">${p.oldPrice} د.م.</span>` : ''}
          </div>
          <div class="prod-stars">${starsHTML(p.rating)}</div>
        </div>
        ${p.sizes && p.sizes.length > 0 ? `<div class="prod-sizes">
          ${p.sizes.map(s => `<span class="size-tag ${+s.stock<=0?'out-of-stock':''}">${s.size}</span>`).join('')}
        </div>` : ''}
        <div class="product-card-btns">
          <button class="btn-ajouter" onclick="event.stopPropagation(); openProductModal('${p.id}')">
            🛒 Ajouter
          </button>
          <button class="btn-whatsapp" onclick="event.stopPropagation(); openProductModal('${p.id}')">
            💬 <span class="wa-text">WhatsApp</span>
          </button>
        </div>
      </div>
    </article>`;
}

function renderProducts() {
  const g1 = document.getElementById('products-grid-1');
  const g2 = document.getElementById('products-grid-2');
  if (g1) g1.innerHTML = PRODUCTS.map(productCardHTML).join('');
  if (g2) g2.innerHTML = [...PRODUCTS].reverse().map(productCardHTML).join('');
  // Re-run reveal after new DOM elements added
  setTimeout(initReveal, 50);
}

function quickAddToCart(id) {
  const p = PRODUCTS.find(x => x.id === id);
  if (p) { Cart.add({ ...p, size: 'M', qty: 1 }); }
}

function addToWishlist(id) {
  const p = PRODUCTS.find(x => x.id === id);
  if (p) showToast(`♡ <strong>${p.name}</strong> ajouté aux favoris !`);
}

function filterByCategory(cat) {
  const section = document.getElementById('produits');
  if (section) section.scrollIntoView({ behavior: 'smooth' });
}

// =====================================================
// INSTAGRAM GRID
// =====================================================
function renderInstagram() {
  const grid = document.getElementById('insta-grid');
  if (!grid) return;
  const images = [
    { src: 'images/jersey_red.png',   alt: 'Maillot Rouge Atlas Lions' },
    { src: 'images/jersey_white.png', alt: 'Maillot Blanc Away' },
    { src: 'images/jersey_green.png', alt: 'Maillot Vert Premium' },
    { src: 'images/jersey_black.png', alt: 'Maillot Noir Spécial' },
    { src: 'images/jersey_red.png',   alt: 'Atlas Lions Rouge' },
    { src: 'images/jersey_white.png', alt: 'Blanc Edition Away' },
  ];
  grid.innerHTML = images.map(img => `
    <div class="insta-item reveal">
      <img src="${img.src}" alt="${img.alt}" loading="lazy"/>
      <div class="insta-overlay">📸</div>
    </div>`).join('');
}

// =====================================================
// SEARCH & CART ACTIONS
// =====================================================
function liveSearch(q) {
  const d = document.getElementById('search-dropdown');
  q = q.trim().toLowerCase();
  if(!q) { if(d) d.style.display = 'none'; return; }
  
  const matches = PRODUCTS.filter(p => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
  if(!matches.length) {
    if(d) { d.innerHTML = '<div style="padding:10px;color:var(--grey)">Aucun produit trouvé</div>'; d.style.display = 'block';}
    return;
  }
  
  if(d) {
    d.innerHTML = matches.slice(0, 5).map(m => `
      <div style="display:flex;align-items:center;gap:10px;padding:8px;cursor:pointer;border-bottom:1px solid #f0f0f0;" onclick="window.location.href='product.html?id=${m.id}'">
        <img src="${m.image || m.img || 'https://placehold.co/100x100/0D3B38/C9A227?text=Produit'}" style="width:40px;height:40px;border-radius:4px;object-fit:cover;background:#eee" onerror="this.onerror=null;this.src='https://placehold.co/100x100/0D3B38/C9A227?text=X'">
        <div><div style="font-weight:600;font-size:.9rem;color:var(--teal);">${m.name}</div><div style="font-size:.8rem;color:var(--grey);">${m.price} MAD</div></div>
      </div>
    `).join('');
    d.style.display = 'block';
  }
}

function doSearch() {
  const q = document.getElementById('search-input')?.value.trim();
  if(!q) return;
  document.getElementById('search-dropdown').style.display = 'none';
  const prod = document.getElementById('produits');
  if(prod) prod.scrollIntoView({behavior:'smooth'});
}

function openCart() {
  const sidebar = document.getElementById('cart-sidebar');
  const overlay = document.getElementById('cart-overlay');
  if(sidebar) {
     sidebar.style.right = '0';
     if(overlay) overlay.style.display = 'block';
     if(overlay) overlay.classList.add('open');
     if(typeof renderCart === 'function') renderCart();
  } else {
     window.location.href = 'cart.html';
  }
}

function closeCart() {
  const sidebar = document.getElementById('cart-sidebar');
  const overlay = document.getElementById('cart-overlay');
  if(sidebar) sidebar.style.right = '-100%';
  if(overlay) overlay.style.display = 'none';
  if(overlay) overlay.classList.remove('open');
}

// Hook all cart anchor nodes physically executing openCart sidebar natively instead of redirecting
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('a[href="cart.html"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      // If we are on a page that actually has the sidebar container rendered physically
      if(document.getElementById('cart-sidebar')) {
         e.preventDefault();
         openCart();
      }
    });
  });
});

function renderCart() {
  const c = document.getElementById('cart-items');
  if(!c) return;
  const items = Cart.getAll();
  c.innerHTML = items.length ? items.map((i, idx) => `
    <div style="display:flex;gap:10px;align-items:center;padding-bottom:15px;border-bottom:1px solid #eee;">
      <img src="${i.image || i.img || 'https://placehold.co/200x200/0D3B38/C9A227?text=Produit'}" style="width:50px;height:50px;object-fit:cover;border-radius:6px;background:var(--ivory);" onerror="this.onerror=null;this.src='https://placehold.co/200x200/0D3B38/C9A227?text=X'">
      <div style="flex:1;">
        <div style="font-weight:bold;color:var(--teal)">
          ${i.name}
        </div>
        <div style="font-size:.85rem;color:var(--grey)">Taille: ${i.size || 'Unique'}</div>
        <div style="font-weight:bold;color:var(--gold)">${i.price} MAD</div>
      </div>
      <div style="display:flex; flex-direction:column; align-items:flex-end; gap:8px;">
        <button class="btn-icon btn-del" onclick="Cart.remove(${idx})" style="font-size:0.9rem;">🗑️</button>
        <div style="display:flex; align-items:center; gap:6px; background:#f5f5f5; border-radius:4px; border:1px solid #ddd; padding:2px;">
          <button onclick="Cart.updateQty(${idx}, -1)" style="width:24px;height:24px;border:none;background:white;border-radius:4px;cursor:pointer;font-weight:bold;">-</button>
          <span style="font-size:0.9rem;font-weight:bold;width:20px;text-align:center;">${i.qty}</span>
          <button onclick="Cart.updateQty(${idx}, 1)" style="width:24px;height:24px;border:none;background:white;border-radius:4px;cursor:pointer;font-weight:bold;">+</button>
        </div>
      </div>
    </div>`).join('') : '<div style="padding:30px;text-align:center;color:var(--grey)">Votre panier est vide</div>';
  document.getElementById('cart-total-mad').textContent = Cart.total() + ' MAD';
}

function checkoutCartWhatsApp() {
  const items = Cart.getAll();
  if(!items.length) return;
  
  const prodNamesTokens = items.map(i => {
    let spec = [];
    if(i.size && i.size !== 'Unique') spec.push(i.size);
    let nameStr = `${i.qty}x ${i.name}`;
    if (spec.length > 0) nameStr += ` (${spec.join(' / ')})`;
    return nameStr;
  });
  
  const prodNames = prodNamesTokens.join('\n📦 ');
  const total = Cart.total();
  const qty = items.reduce((acc, i) => acc + i.qty, 0);
  
  _logAdminOrder(prodNamesTokens.join(', '), total, qty, items);
  Cart.clear();
  renderCart();
  
  const msg = `Bonjour, je voudrais commander:\n📦 ${prodNames}\n💰 Total: ${total} MAD.\nLivraison à: [Ville]`;
  window.open(`https://wa.me/${WA_PHONE}?text=${encodeURIComponent(msg)}`, '_blank');
}

// =====================================================
// MOBILE MENU
// =====================================================
function initMobileMenu() {
  const btn = document.getElementById('mob-menu-btn');
  const drawer = document.getElementById('mob-drawer');
  if (btn && drawer) {
    btn.addEventListener('click', () => drawer.classList.toggle('open'));
  }
}

// =====================================================
// WHATSAPP LINKS
// =====================================================
function initWALinks() {
  const mainUrl = buildWAURL();
  const ids = ['wa-float','wa-icon-btn','slide1-wa','slide2-wa','slide3-wa','banner-wa-btn','footer-wa-btn','footer-wa-link'];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.href = mainUrl;
  });
}

// =====================================================
// SEARCH ON ENTER KEY
// =====================================================
function initSearch() {
  const inp = document.getElementById('search-input');
  if (inp) inp.addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(); });
}

// =====================================================
// INIT
// =====================================================
document.addEventListener('DOMContentLoaded', () => {
  // Activate scroll animations (hides reveal elements via CSS)
  document.body.classList.add('js-animations');
  
  try {
    initSlider();
  } catch(error) {}
  
  initReveal();
  renderProducts();  
  renderInstagram();
  initMobileMenu();
  initWALinks();
  initSearch();
  initHeroProduct();
  Cart.updateBadge();
});

function initHeroProduct() {
  const pStr = localStorage.getItem('admin_products');
  if(!pStr) return;
  const products = JSON.parse(pStr);
  const heroProduct = products.find(p => p.name.toLowerCase().includes('maillot du maroc') && p.name.toLowerCase().includes('2026'));
  
  if (heroProduct) {
     const heroImages = document.querySelectorAll('.hero-product-image');
     heroImages.forEach(img => {
       img.src = heroProduct.mainImage || heroProduct.image || heroProduct.img;
     });
     
     // Update both hero WA buttons
     ['slide1-wa', 'slide2-wa'].forEach(id => {
        const btn = document.getElementById(id);
        if(btn) btn.href = buildWAURL(heroProduct);
     });
  }
}

function openHeroProduct() {
  const pStr = localStorage.getItem('admin_products');
  if(!pStr) return;
  const products = JSON.parse(pStr);
  const heroProduct = products.find(p => p.name.toLowerCase().includes('maillot du maroc') && p.name.toLowerCase().includes('2026'));
  
  if(heroProduct) {
     openProductModal(heroProduct.id);
  } else {
     showToast("⚠️ Produit promotionnel non trouvé dans l'inventaire.", "error");
  }
}

// =====================================================
// MODAL & LIGHTBOX LOGIC
// =====================================================
let currentProductObj = null;
let currentImageIndex = 0;
let autoSlideInterval = null;

let currentSelectedSizeStr = null;
let currentProductQty = 1;

function _logAdminOrder(prodName, total, qty, productsArr = []) {
  try {
    const s = localStorage.getItem('admin_orders');
    const orders = s ? JSON.parse(s) : [];
    orders.push({
      id: 'MS-' + (1000 + orders.length + 1),
      date: new Date().toISOString().slice(0, 10),
      client: 'Client Web (WhatsApp)', phone: 'En attente...', city: 'A confirmer',
      product: prodName, qty: qty, total: total, status: 'en cours'
    });
    localStorage.setItem('admin_orders', JSON.stringify(orders));

    // Stock Deduction
    const pStr = localStorage.getItem('admin_products');
    if(pStr && productsArr.length > 0) {
      const adminProducts = JSON.parse(pStr);
      let stockAlerts = [];
      productsArr.forEach(cartItem => {
        const adminFound = adminProducts.find(x => x.id === cartItem.id);
        if(adminFound && adminFound.sizes) {
           const sObj = adminFound.sizes.find(s => s.size === cartItem.size);
           if(sObj && sObj.stock > 0) {
              sObj.stock -= cartItem.qty;
              if (sObj.stock <= 2) stockAlerts.push(`⚠️ Stock faible/épuisé: ${adminFound.name} / ${sObj.size} — ${sObj.stock} restants`);
           }
        }
      });
      localStorage.setItem('admin_products', JSON.stringify(adminProducts));
      if(stockAlerts.length > 0) console.warn(stockAlerts.join(' | ')); // Real admin alert trigger
    }
  } catch(e){}
}

function showSizeGuide() {
  alert("Guide des tailles standardisé:\nS : 36-38\nM : 38-40\nL : 40-42\nXL : 42-44\nXXL : 44-46");
}

function selectModalSize(sizeStr, maxStock) {
  if (maxStock <= 0) return;
  currentSelectedSizeStr = sizeStr;
  currentProductQty = 1;
  document.getElementById('modal-qty').textContent = currentProductQty;
  
  const btns = document.querySelectorAll('#modal-size-bts button');
  btns.forEach(btn => {
    if(!btn.disabled) {
      if(btn.dataset.size === sizeStr) {
        btn.style.background = 'var(--gold)';
        btn.style.color = '#fff';
        btn.style.borderColor = 'var(--gold)';
      } else {
        btn.style.background = 'var(--ivory)';
        btn.style.color = 'var(--teal)';
        btn.style.borderColor = 'var(--teal)';
      }
    }
  });
  document.getElementById('size-error').style.display='none';
  document.getElementById('modal-size-bts').style.animation = 'none';
}

function changeModalQty(dir) {
  let maxStock = 10;
  if(currentProductObj.sizes && currentProductObj.sizes.length > 0) {
    if(!currentSelectedSizeStr) {
       document.getElementById('size-error').style.display='block';
       document.getElementById('size-error').textContent='⚠️ Veuillez choisir la taille d\'abord';
       return;
    }
    const sObj = currentProductObj.sizes.find(x => x.size === currentSelectedSizeStr);
    maxStock = sObj ? sObj.stock : 0;
  }
  
  currentProductQty += dir;
  if(currentProductQty < 1) currentProductQty = 1;
  if(currentProductQty > maxStock) currentProductQty = maxStock;
  
  if (currentProductQty === maxStock && dir > 0) {
    const err = document.getElementById('size-error');
    err.style.display='block';
    err.textContent='⚠️ Stock maximum atteint';
    setTimeout(() => { err.style.display='none'; }, 2000);
  }
  
  document.getElementById('modal-qty').textContent = currentProductQty;
}

function renderModalSizes(sizesArr) {
  if(!sizesArr || sizesArr.length === 0) return '';
  
  let h = `<div style="margin-bottom:15px;" id="modal-size-block">
             <div style="display:flex; justify-content:space-between; align-items:flex-end;">
               <div style="font-weight:bold; color:var(--teal); margin-bottom:8px;">Taille: <span style="font-weight:normal; color:var(--grey); font-size:0.85rem">(Stock limité)</span></div>
               <a href="#" style="color:var(--grey); text-decoration:underline; font-size:0.8rem;" onclick="event.preventDefault(); showSizeGuide()">📏 Guide des tailles</a>
             </div>
             <div style="display:flex; flex-wrap:wrap; gap:8px;" id="modal-size-bts">`;
  h += sizesArr.map((s, idx) => {
    const isOut = +s.stock <= 0;
    return `<button type="button" data-size="${s.size}" class="size-btn" style="position:relative; padding:8px 12px; border:2px solid ${isOut?'#eee':'var(--teal)'}; border-radius:6px; background:${isOut?'#f5f5f5':'var(--ivory)'}; color:${isOut?'#999':'var(--teal)'}; font-weight:bold; ${isOut?'text-decoration:line-through; cursor:not-allowed;':'cursor:pointer;'}" ${isOut?'disabled':`onclick="selectModalSize('${s.size}', ${s.stock})"`}>
      ${s.size}
      ${isOut?`<span style="position:absolute; top:-8px; right:-5px; background:var(--grey); color:#fff; font-size:0.6rem; padding:2px 4px; border-radius:3px;">Épuisé</span>`:''}
    </button>`;
  }).join('');
  h += `</div><div id="size-error" style="color:red; font-size:0.85rem; margin-top:5px; height:15px; display:none; font-weight:bold;">⚠️ Veuillez choisir une taille</div></div>`;
  return h;
}

function addToCart(productId) {
  if (currentProductObj.sizes && currentProductObj.sizes.length > 0) {
     if(currentSelectedSizeStr === null) {
        shakeElement('modal-size-bts', 'size-error'); return;
     }
  }

  Cart.add({ 
    ...currentProductObj, 
    size: currentSelectedSizeStr || 'Unique', 
    qty: currentProductQty,
    id: productId || currentProductObj.id
  });
  
  closeProductModal();
  openCart();
}

function attemptWhatsApp() {
  if (currentProductObj.sizes && currentProductObj.sizes.length > 0 && currentSelectedSizeStr === null) { shakeElement('modal-size-bts', 'size-error'); return; }
  
  const sizeStr = currentSelectedSizeStr || 'Unique';
  const total = currentProductObj.price * currentProductQty;
  
  const isHero = currentProductObj.name.toLowerCase().includes('maillot du maroc') && currentProductObj.name.toLowerCase().includes('2026');
  let msg = '';
  
  if (isHero) {
    msg = `Bonjour, je voudrais commander:\n⚽ ${currentProductObj.name}\n📏 Taille: ${sizeStr}\n🔢 Quantité: ${currentProductQty}\n💰 Prix: ${currentProductObj.price} MAD`;
  } else {
    msg = `Bonjour, je voudrais commander:\n🛍️ Produit: ${currentProductObj.name}\n📏 Taille: ${sizeStr}\n🔢 Quantité: ${currentProductQty}\n💰 Prix unitaire: ${currentProductObj.price} MAD\n💵 Total: ${total} MAD\n🏙️ Ville: [Votre Ville]`;
  }
  
  const productNameWithSize = `${currentProductObj.name} | Taille: ${sizeStr}`;
  _logAdminOrder(productNameWithSize, total, currentProductQty, [{id: currentProductObj.id, size: sizeStr, qty: currentProductQty}]);
  
  window.open(`https://wa.me/${WA_PHONE}?text=${encodeURIComponent(msg)}`, '_blank');
}

function shakeElement(id, errId) {
  const el = document.getElementById(id);
  const err = document.getElementById(errId);
  if(!el) return;
  if(err) err.style.display='block';
  el.style.animation = 'shake .4s';
  setTimeout(() => el.style.animation = 'none', 400);
}

function openProductModal(id) {
  currentProductObj = PRODUCTS.find(x => x.id === id || x.id == id);
  if(!currentProductObj) return;

  const images = (currentProductObj.images && currentProductObj.images.length > 0) ? currentProductObj.images : [currentProductObj.mainImage || currentProductObj.image || currentProductObj.img || 'https://placehold.co/400x400'];
  currentImageIndex = 0;
  
  currentSelectedSizeStr = null;
  currentProductQty = 1;

  const content = document.getElementById('product-modal-content');
  
  let thumbsHTML = images.length > 1 ? `<div style="display:flex; gap:10px; margin-top:15px; overflow-x:auto; padding-bottom:5px; scrollbar-width:none;">
    ${images.map((img, i) => `<img src="${img}" onclick="setModalMainImage(${i})" id="modal-thumb-${i}" style="width:70px;height:70px;object-fit:cover;border-radius:6px;cursor:pointer;border:2px solid ${i===0?'var(--gold)':'transparent'};transition:all 0.2s;">`).join('')}
  </div>` : '';

  let dotsHTML = images.length > 1 ? `<div style="display:flex; justify-content:center; gap:6px; margin-top:10px;">
    ${images.map((_, i) => `<div id="modal-dot-${i}" style="width:8px;height:8px;border-radius:50%;background:${i===0?'var(--gold)':'#ccc'};transition:background 0.3s;"></div>`).join('')}
  </div>` : '';

  content.innerHTML = `
    <!-- Left: Gallery -->
    <div style="flex:1; min-width:300px; padding:20px; background:var(--ivory); position:relative; overflow:hidden;">
      <div id="modal-swipe-zone" style="position:relative; width:100%; aspect-ratio:1; border-radius:8px; overflow:hidden; background:#eee; cursor:zoom-in; touch-action:pan-y;" onclick="openLightbox()">
        <img id="modal-main-img" src="${images[currentImageIndex]}" style="width:100%; height:100%; object-fit:cover; transition:opacity 0.2s; pointer-events:none;">
      </div>
      ${dotsHTML}
      <div class="desktop-only">${thumbsHTML}</div>
    </div>
    <!-- Right: Info -->
    <div style="flex:1; min-width:300px; padding:30px;">
      <div style="font-size:0.9rem; color:var(--gold); text-transform:uppercase; font-weight:bold; margin-bottom:10px;">${currentProductObj.category}</div>
      <h2 style="font-family:var(--font-h); font-size:2rem; color:var(--green); margin-bottom:15px;">${currentProductObj.name}</h2>
      <div style="font-size:1.5rem; font-weight:bold; color:var(--teal); margin-bottom:20px;">${currentProductObj.price} MAD</div>
      <p style="color:var(--grey); line-height:1.6; margin-bottom:20px;">${currentProductObj.desc || currentProductObj.longDesc || 'Un produit exclusif de Maghribi Store. ' + currentProductObj.name}</p>
      
      ${renderModalSizes(currentProductObj.sizes)}
      
      <div style="margin-bottom:20px;">
        <div style="font-weight:bold; color:var(--teal); margin-bottom:8px;">Quantité:</div>
        <div style="display:inline-flex; align-items:center; gap:6px; background:#f5f5f5; border-radius:6px; border:1px solid #ddd; padding:4px;">
          <button onclick="changeModalQty(-1)" style="width:34px;height:34px;border:none;background:white;border-radius:4px;cursor:pointer;font-weight:bold;font-size:1.1rem;color:var(--teal);box-shadow:0 1px 3px rgba(0,0,0,0.1);">-</button>
          <span id="modal-qty" style="font-size:1.1rem;font-weight:bold;width:30px;text-align:center;color:var(--teal);">1</span>
          <button onclick="changeModalQty(1)" style="width:34px;height:34px;border:none;background:white;border-radius:4px;cursor:pointer;font-weight:bold;font-size:1.1rem;color:var(--teal);box-shadow:0 1px 3px rgba(0,0,0,0.1);">+</button>
        </div>
      </div>
      
      <div style="display:flex; gap:10px;">
        <button class="add-cart-btn" style="flex:1; padding:15px; font-size:1.1rem; border-radius:8px;" onclick="addToCart('${currentProductObj.id}')">🛒 Ajouter au panier</button>
      </div>
      <button class="btn btn-wa" style="width:100%; justify-content:center; padding:15px; font-size:1.1rem; border-radius:8px; margin-top:10px;" onclick="attemptWhatsApp()">💬 Commander sur WhatsApp</button>
    </div>
  `;

  const m = document.getElementById('product-detail-modal');
  m.classList.add('open');
  m.children[0].style.opacity = '1';
  m.children[0].style.pointerEvents = 'auto';
  
  // Attach Swipe Logic
  if (images.length > 1) {
    let ts_x = 0;
    const swipeZone = document.getElementById('modal-swipe-zone');
    swipeZone.addEventListener('touchstart', e => { ts_x = e.touches[0].clientX; clearInterval(autoSlideInterval); }, {passive:true});
    swipeZone.addEventListener('touchend', e => {
      const te_x = e.changedTouches[0].clientX;
      if (ts_x - te_x > 40) navModalImage(1);
      else if (te_x - ts_x > 40) navModalImage(-1);
    }, {passive:true});
    
    // Auto slide
    clearInterval(autoSlideInterval);
    autoSlideInterval = setInterval(() => { navModalImage(1); }, 3000);
  }
}

function closeProductModal() {
  clearInterval(autoSlideInterval);
  const m = document.getElementById('product-detail-modal');
  m.children[0].style.opacity = '0';
  m.children[0].style.pointerEvents = 'none';
  setTimeout(() => m.classList.remove('open'), 300);
}

function navModalImage(dir) {
  if(!currentProductObj) return;
  const images = (currentProductObj.images && currentProductObj.images.length > 0) ? currentProductObj.images : [currentProductObj.mainImage || currentProductObj.image];
  currentImageIndex += dir;
  if(currentImageIndex < 0) currentImageIndex = images.length - 1;
  if(currentImageIndex >= images.length) currentImageIndex = 0;
  setModalMainImage(currentImageIndex);
}

function setModalMainImage(idx) {
  currentImageIndex = idx;
  const mainImg = document.getElementById('modal-main-img');
  const images = (currentProductObj.images && currentProductObj.images.length > 0) ? currentProductObj.images : [currentProductObj.mainImage || currentProductObj.image];
  
  if(!mainImg) return;
  mainImg.style.opacity = 0;
  setTimeout(() => {
    mainImg.src = images[idx];
    mainImg.style.opacity = 1;
  }, 200);
  
  document.querySelectorAll('[id^="modal-thumb-"]').forEach((th, i) => th.style.borderColor = (i === idx) ? 'var(--gold)' : 'transparent');
  document.querySelectorAll('[id^="modal-dot-"]').forEach((dt, i) => dt.style.backgroundColor = (i === idx) ? 'var(--gold)' : '#ccc');
}

function openLightbox() {
  if(!currentProductObj) return;
  const images = (currentProductObj.images && currentProductObj.images.length > 0) ? currentProductObj.images : [currentProductObj.mainImage || currentProductObj.image];
  document.getElementById('lightbox-img').src = images[currentImageIndex];
  document.getElementById('lightbox-modal').style.display = 'block';
  clearInterval(autoSlideInterval); // pause slides
}

function closeLightbox() { document.getElementById('lightbox-modal').style.display = 'none'; }

function navLightbox(dir) {
  if(!currentProductObj) return;
  const images = (currentProductObj.images && currentProductObj.images.length > 0) ? currentProductObj.images : [currentProductObj.mainImage || currentProductObj.image];
  currentImageIndex += dir;
  if(currentImageIndex < 0) currentImageIndex = images.length - 1;
  if(currentImageIndex >= images.length) currentImageIndex = 0;
  
  const lbImg = document.getElementById('lightbox-img');
  lbImg.style.opacity = 0;
  setTimeout(() => {
    lbImg.src = images[currentImageIndex];
    lbImg.style.opacity = 1;
  }, 200);
  setModalMainImage(currentImageIndex); // Sync modal background
}

function toggleMobMenu() {
  const overlay = document.getElementById('mob-menu-overlay');
  if (overlay) {
    overlay.classList.toggle('open');
    document.body.style.overflow = overlay.classList.contains('open') ? 'hidden' : '';
  }
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeLightbox(); closeProductModal(); if(document.getElementById('mob-menu-overlay').classList.contains('open')) toggleMobMenu(); }
  if (e.key === 'ArrowRight' && document.getElementById('lightbox-modal').style.display === 'block') navLightbox(1);
  if (e.key === 'ArrowLeft' && document.getElementById('lightbox-modal').style.display === 'block') navLightbox(-1);
});

