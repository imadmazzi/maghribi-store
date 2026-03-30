// =====================================================
// MAGHRIBI STORE — MAIN.JS (OFFICIAL FIXED VERSION)
// =====================================================

// 1. GLOBAL CONFIG
const WA_PHONE = '212684329935';

// 2. DYNAMIC PRODUCTS LOAD FROM ADMIN (LOCAL STORAGE)
function loadStoreProducts() {
  try {
    const s = localStorage.getItem('maghribi_products');
    if (s) {
      const parsed = JSON.parse(s);
      return parsed.filter(p => p.status === true);
    }
  } catch(e) {
    console.error("Sync Error:", e);
  }
  return [];
}
var PRODUCTS = loadStoreProducts();

function buildWAURL(product = null) {
  let msg = '';
  if (product) {
    msg = `Bonjour, je souhaite commander le produit: ${product.name}`;
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
  const mainImg = p.mainImage || p.image || p.img || fallbackImg;
  
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
        <!-- All actions lead to size selection first -->
        <div class="product-card-btns" style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
          <button class="btn-ajouter" onclick="event.stopPropagation(); openProductModal('${p.id}')">🛒 Commander</button>
          <button class="btn-whatsapp" onclick="event.stopPropagation(); openProductModal('${p.id}')">💬 WA</button>
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

// REDUNDANT openCart removed. Using the one in index.html for overlay sync.

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

// =====================================================
// MODAL & PURCHASE FLOW
// =====================================================
let currentProductObj = null;
let currentSelectedSize = null;
let currentQty = 1;

function openProductModal(id) {
  currentProductObj = PRODUCTS.find(x => x.id == id);
  if(!currentProductObj) return;

  currentSelectedSize = null;
  currentQty = 1;

  const m = document.getElementById('product-detail-modal');
  const inner = m.querySelector('.modal');
  const content = document.getElementById('product-modal-content');
  
  const images = (currentProductObj.images && currentProductObj.images.length > 0) ? currentProductObj.images : [currentProductObj.mainImage || currentProductObj.image || currentProductObj.img || 'https://via.placeholder.com/400'];

  const sizesHTML = (currentProductObj.sizes && currentProductObj.sizes.length > 0) ? `
    <div style="margin-bottom:20px;">
      <div style="font-weight:bold; color:var(--teal); margin-bottom:10px;">Choisir votre taille:</div>
      <div style="display:flex; flex-wrap:wrap; gap:10px;" id="modal-sizes-list">
        ${currentProductObj.sizes.map(s => {
          const val = typeof s === 'object' ? s.size : s;
          return `<button class="size-btn-modal" onclick="selectModalSize('${val}')" data-size="${val}" style="padding:10px 15px; border:2px solid #ddd; background:white; border-radius:6px; cursor:pointer; font-weight:700; transition:0.2s;">${val}</button>`;
        }).join('')}
      </div>
      <div id="size-err-msg" style="color:red; font-size:0.8rem; margin-top:5px; display:none;">⚠️ Veuillez séléctionner une taille.</div>
    </div>
  ` : '';

  content.innerHTML = `
    <!-- Gallery -->
    <div style="flex:1; min-width:300px; padding:20px; background:#f9f9f9; display:flex; align-items:center; justify-content:center;">
       <img src="${images[0]}" style="max-width:100%; max-height:400px; border-radius:8px; object-fit:contain;">
    </div>
    <!-- Info -->
    <div style="flex:1; min-width:300px; padding:30px;">
      <div style="font-size:0.8rem; color:var(--gold); font-weight:700; text-transform:uppercase; margin-bottom:5px;">${currentProductObj.category || 'Collection'}</div>
      <h2 style="font-size:1.8rem; margin-bottom:15px; color:var(--teal); font-family:var(--font-head);">${currentProductObj.name}</h2>
      <div style="font-size:1.5rem; font-weight:700; color:var(--gold); margin-bottom:20px;">${currentProductObj.price} MAD</div>
      <p style="color:var(--grey); line-height:1.6; margin-bottom:25px;">${currentProductObj.desc || "Commandez maintenant et profitez d'une livraison rapide partout au Maroc 🇲🇦"}</p>
      
      ${sizesHTML}

      <div style="margin-bottom:30px;">
        <div style="font-weight:bold; color:var(--teal); margin-bottom:10px;">Quantité:</div>
        <div style="display:flex; align-items:center; gap:15px;">
           <button onclick="changeModalQty(-1)" style="width:40px; height:40px; border:1px solid #ddd; background:white; border-radius:6px; font-weight:bold; cursor:pointer;">-</button>
           <span id="modal-qty-val" style="font-weight:bold; font-size:1.1rem; width:20px; text-align:center;">1</span>
           <button onclick="changeModalQty(1)" style="width:40px; height:40px; border:1px solid #ddd; background:white; border-radius:6px; font-weight:bold; cursor:pointer;">+</button>
        </div>
      </div>

      <div style="display:flex; flex-direction:column; gap:12px;">
        <button class="btn btn-gold" onclick="addToCartInModal()" style="width:100%; justify-content:center; padding:15px; font-size:1.1rem; border-radius:8px;">🛒 Ajouter au Panier</button>
        <button class="btn btn-wa" onclick="whatsappInModal()" style="width:100%; justify-content:center; padding:15px; font-size:1.1rem; border-radius:8px; background:#25D366; border:none; color:white; font-weight:700; display:flex; gap:8px; align-items:center; cursor:pointer;">💬 Commander via WhatsApp</button>
      </div>
    </div>
  `;

  m.classList.add('open');
  m.style.opacity = '1';
  m.style.pointerEvents = 'auto';
  inner.style.opacity = '1';
  inner.style.pointerEvents = 'auto';
}

function closeProductModal() {
  const m = document.getElementById('product-detail-modal');
  const inner = m.querySelector('.modal');
  m.classList.remove('open');
  m.style.opacity = '0';
  m.style.pointerEvents = 'none';
  inner.style.opacity = '0';
  inner.style.pointerEvents = 'none';
}

function selectModalSize(size) {
  currentSelectedSize = size;
  document.querySelectorAll('.size-btn-modal').forEach(btn => {
    if(btn.dataset.size === size) {
      btn.style.borderColor = 'var(--gold)';
      btn.style.background = 'var(--ivory)';
      btn.style.color = 'var(--teal)';
    } else {
      btn.style.borderColor = '#ddd';
      btn.style.background = 'white';
      btn.style.color = 'black';
    }
  });
  document.getElementById('size-err-msg').style.display = 'none';
}

function changeModalQty(dir) {
  currentQty += dir;
  if(currentQty < 1) currentQty = 1;
  document.getElementById('modal-qty-val').textContent = currentQty;
}

function addToCartInModal() {
  console.log("Add to Cart clicked", currentProductObj);
  if(currentProductObj.sizes && currentProductObj.sizes.length > 0 && !currentSelectedSize) {
    alert("Veuillez choisir une taille !");
    if(document.getElementById('size-err-msg')) document.getElementById('size-err-msg').style.display = 'block';
    return;
  }
  
  const item = {
    id: currentProductObj.id,
    name: currentProductObj.name,
    price: currentProductObj.price,
    image: currentProductObj.mainImage || currentProductObj.image || currentProductObj.img,
    size: currentSelectedSize || 'Unique',
    qty: currentQty || 1
  };

  Cart.add(item);
  closeProductModal();
  
  // Call the global openCart (from index.html)
  if(typeof openCart === 'function') {
    openCart();
  } else {
    // Fallback if not found
    const sidebar = document.getElementById('cart-sidebar');
    if(sidebar) sidebar.style.right = '0';
    renderCart();
  }
}

function whatsappInModal() {
  console.log("WhatsApp button clicked");
  if(currentProductObj.sizes && currentProductObj.sizes.length > 0 && !currentSelectedSize) {
    alert("Veuillez choisir une taille");
    if(document.getElementById('size-err-msg')) document.getElementById('size-err-msg').style.display = 'block';
    return;
  }
  
  const productName = currentProductObj.name;
  const selectedSize = currentSelectedSize || 'Unique';
  const quantity = currentQty;
  
  const messageText = `Bonjour, je souhaite commander: ${productName} | Taille: ${selectedSize} | Quantité: ${quantity}`;
  const whatsappUrl = `https://wa.me/${WA_PHONE}?text=${encodeURIComponent(messageText)}`;
  
  window.open(whatsappUrl, '_blank');
}

// 🛒 CART CHECKOUT TO WHATSAPP
function checkoutCartWhatsApp() {
  const items = Cart.getAll();
  if(items.length === 0) {
     alert("Votre panier est vide !");
     return;
  }
  
  let msg = "Bonjour Maghribi Store, je souhaite commander les produits suivants:\n\n";
  items.forEach((it, idx) => {
    msg += `✅ ${it.name} | Taille: ${it.size} | Qté: ${it.qty}\n`;
  });
  msg += `\n💰 *TOTAL COMMANDE: ${Cart.total()} MAD*\n\nExpédition: Partout au Maroc 🇲🇦`;
  
  window.open(`https://wa.me/${WA_PHONE}?text=${encodeURIComponent(msg)}`, '_blank');
}