// =====================================================
// MAGHRIBI STORE — MAIN.JS (OFFICIAL FIXED VERSION)
// =====================================================

// 1. DYNAMIC PRODUCTS LOAD FROM ADMIN (LOCAL STORAGE)
// 1. DYNAMIC PRODUCTS LOAD FROM ADMIN (LOCAL STORAGE)
function loadStoreProducts() {
  try {
    // SINGLE SOURCE OF TRUTH: Only products added via the current Admin Dashboard
    const s = localStorage.getItem('maghribi_products');
    
    if (s) {
      const parsed = JSON.parse(s);
      // Filter strictly for Online status (status === true)
      return parsed.filter(p => p.status === true);
    }
  } catch(e) {
    console.error("Sync Error:", e);
  }
  return []; // Return empty if no products found or error
}
var PRODUCTS = loadStoreProducts();

var PRODUCTS = loadStoreProducts();

// 2. WHATSAPP CONFIG FROM ADMIN
function getAdminPhone() {
  try {
    const s = localStorage.getItem('admin_settings');
    if(s) { 
        return JSON.parse(s).phone || '212600000000'; 
    }
  } catch(e){}
  return '212600000000';
}
var WA_PHONE = getAdminPhone();

function buildWAURL(product = null) {
  let msg = '';
  if (product) {
    msg = `Bonjour, je voudrais commander: ${product.name} - ${product.price} MAD. Livraison à: [Votre Ville]`;
  } else {
    msg = `Bonjour 👋 Je voudrais commander depuis *Maghribi Store* 🇲🇦`;
  }
  return `https://wa.me/${WA_PHONE}?text=${encodeURIComponent(msg)}`;
}

// --- Functions formatting ---
function formatPrice(n) { return `${n} <span style="font-size:.75em;font-family:var(--font-arabic)">د.م.</span>`; }
function starsHTML(r) { return Array.from({length:5},(_,i)=>`<span style="color:${i<r?'var(--gold)':'#ddd'}">★</span>`).join(''); }

// =====================================================
// CART SYSTEM
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
  remove(idx){ const items=this.getAll(); items.splice(idx,1); this.save(items); renderCart(); },
  updateQty(idx, dir){ 
    const items=this.getAll(); 
    items[idx].qty += dir; 
    if(items[idx].qty <= 0) return this.remove(idx);
    this.save(items); 
    renderCart(); 
  },
  clear(){ localStorage.removeItem(this.KEY); this.updateBadge(); },
  count(){ return this.getAll().reduce((s,i)=>s+i.qty,0); },
  total(){ return this.getAll().reduce((s,i)=>s+i.price*i.qty,0); },
  updateBadge(){
    document.querySelectorAll('.cart-count-badge').forEach(b=>{
      const c=this.count();
      b.textContent=c; b.style.display=c>0?'flex':'none';
    });
  }
};

// =====================================================
// PRODUCT RENDER LOGIC
// =====================================================
function productCardHTML(p) {
  const fallbackImg = 'https://via.placeholder.com/300';
  // p.mainImage is primary source to match Admin Dashboard data
  const mainImg = p.mainImage || p.image || p.img || fallbackImg;
  
  // Strict badge check to avoid "undefined" text
  const badgeHTML = (p.badge && p.badge !== 'undefined' && p.badge !== 'null' && p.badge !== '') 
    ? `<span class="product-badge ${p.badgeClass || 'badge-new'}">${p.badge}</span>` 
    : '';

  const sizesHTML = (p.sizes && p.sizes.length > 0) ? `<div class="prod-sizes">
    ${p.sizes.map(s => {
      const val = typeof s === 'object' ? (s.size || s.val) : s;
      return `<span class="size-tag">${val}</span>`;
    }).join('')}
  </div>` : '';

  return `
    <article class="product-card reveal" onclick="openProductModal('${p.id}')">
      ${badgeHTML}
      <button class="product-wishlist" onclick="event.stopPropagation(); showToast('Favori ajouté!')">♡</button>
      <div class="product-img-wrap">
        <img src="${mainImg}" alt="${p.name}" loading="lazy" onerror="this.src='${fallbackImg}'"/>
      </div>
      <div class="product-info">
        <div class="prod-category">${p.category || 'Collection'}</div>
        <h3>${p.name}</h3>
        <div class="product-price-row">
          <span class="prod-price">${p.price} MAD</span>
          ${p.oldPrice ? `<span style="text-decoration:line-through; font-size:0.8rem; color:grey; margin-left:8px;">${p.oldPrice} MAD</span>` : ''}
        </div>
        ${sizesHTML}
        <div class="product-card-btns">
          <button class="btn-ajouter">🛒 Détails</button>
        </div>
      </div>
    </article>`;
}

function renderProducts() {
  const g1 = document.getElementById('products-grid-1');
  const g2 = document.getElementById('products-grid-2');
  
  if (PRODUCTS.length === 0) {
    const emptyMsg = '<div style="grid-column:1/-1; text-align:center; padding:50px; color:grey;">Aucun produit trouvé dans votre Admin.</div>';
    if (g1) g1.innerHTML = emptyMsg;
    if (g2) g2.innerHTML = emptyMsg;
    return;
  }

  if (g1) g1.innerHTML = PRODUCTS.map(productCardHTML).join('');
  if (g2) g2.innerHTML = [...PRODUCTS].reverse().map(productCardHTML).join('');
  
  // Re-run reveal 
  if (typeof initReveal === 'function') setTimeout(initReveal, 50);
}

// =====================================================
// UTILS (Slider, Search, Modals)
// =====================================================
function showToast(msg) {
  let ctr = document.querySelector('.toast-container') || Object.assign(document.createElement('div'), {className:'toast-container'});
  document.body.appendChild(ctr);
  const t = Object.assign(document.createElement('div'), {className:'toast', innerHTML:msg});
  ctr.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

function openCart() {
  const sidebar = document.getElementById('cart-sidebar');
  if(sidebar) { sidebar.style.right = '0'; renderCart(); }
}

function closeCart() {
  const sidebar = document.getElementById('cart-sidebar');
  if(sidebar) sidebar.style.right = '-100%';
}

function renderCart() {
  const c = document.getElementById('cart-items');
  if(!c) return;
  const items = Cart.getAll();
  c.innerHTML = items.length ? items.map((i, idx) => `
    <div style="display:flex;gap:10px;padding:10px;border-bottom:1px solid #eee;">
      <img src="${i.image || i.img || ''}" style="width:50px;height:50px;object-fit:cover;">
      <div style="flex:1;">
        <div style="font-weight:bold;">${i.name}</div>
        <div>${i.price} MAD</div>
      </div>
      <div style="display:flex;align-items:center;gap:5px;">
        <button onclick="Cart.updateQty(${idx},-1)">-</button>
        <span>${i.qty}</span>
        <button onclick="Cart.updateQty(${idx},1)">+</button>
      </div>
    </div>`).join('') : '<p style="text-align:center;">Panier vide</p>';
  document.getElementById('cart-total-mad').textContent = Cart.total() + ' MAD';
}

// =====================================================
// RESTORED UI FEATURES (Slider, Search, Reveal)
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
  track.style.transform = `translateX(-${currentSlide * 100}%)`;
  dots.forEach((d, i) => d.classList.toggle('active', i === currentSlide));
}
function nextSlide() { goToSlide(currentSlide + 1); }
function prevSlide() { goToSlide(currentSlide - 1); }
function resetSlider() { clearInterval(slideTimer); slideTimer = setInterval(nextSlide, 4000); }

function initSlider() {
  const prevBtn = document.getElementById('slider-prev');
  const nextBtn = document.getElementById('slider-next');
  if (prevBtn) prevBtn.onclick = () => { prevSlide(); resetSlider(); };
  if (nextBtn) nextBtn.onclick = () => { nextSlide(); resetSlider(); };
  document.querySelectorAll('.slider-dot').forEach(dot => {
    dot.onclick = () => { goToSlide(parseInt(dot.dataset.slide)); resetSlider(); };
  });
  resetSlider();
}

function initReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); } });
  }, { threshold: 0.1 });
  document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach(el => observer.observe(el));
}

function liveSearch(q) {
  const d = document.getElementById('search-dropdown');
  q = q.trim().toLowerCase();
  if(!q) { if(d) d.style.display = 'none'; return; }
  const matches = PRODUCTS.filter(p => p.name.toLowerCase().includes(q));
  if(d) {
    d.innerHTML = matches.slice(0, 5).map(m => `
      <div style="display:flex;align-items:center;gap:10px;padding:8px;cursor:pointer;border-bottom:1px solid #f0f0f0;" onclick="openProductModal('${m.id}')">
        <img src="${m.mainImage || m.image || m.img || ''}" style="width:40px;height:40px;object-fit:cover;border-radius:4px;">
        <div><div style="font-weight:600;font-size:.85rem;">${m.name}</div><div style="font-size:.75rem;">${m.price} MAD</div></div>
      </div>`).join('');
    d.style.display = matches.length ? 'block' : 'none';
  }
}

// =====================================================
// INITIALIZATION
// =====================================================
document.addEventListener('DOMContentLoaded', () => {
  renderProducts();
  Cart.updateBadge();
  initSlider();
  initReveal();
  
  // Mobile Menu
  const mbBtn = document.getElementById('mob-menu-btn');
  const drawer = document.getElementById('mob-drawer');
  if(mbBtn && drawer) mbBtn.onclick = () => drawer.classList.toggle('open');
});

// --- Modal Logic ---
function openProductModal(id) {
  const p = PRODUCTS.find(x => x.id == id);
  if(!p) return;
  alert("🛍️ Product: " + p.name + "\n💰 Price: " + p.price + " MAD\n🚚 Delivery everywhere in Morocco!");
}