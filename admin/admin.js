// ============================================================
// MAGHRIBI STORE — Admin Dashboard JS
// ============================================================

// --- SAMPLE DATA ---
const DEFAULTS = {
  products:[
    {id:'ez-outlet',name:'EZ Outlet — La Multiprise',desc:'Multiprise rotative à 360° avec ports USB.',price:149,stock:85,category:'Accessoires',status:true,img:'images/ez_outlet.png', badge:'NOUVEAU'}
  ],
  orders:[
    {id:'MS-1001',date:'2026-03-24',client:'Youssef Benali',phone:'0612345678',city:'Casablanca',product:'EZ Outlet — La Multiprise',qty:1,total:149,status:'livré'},
    {id:'MS-1002',date:'2026-03-24',client:'Sara El Fassi',phone:'0655443322',city:'Marrakech',product:'EZ Outlet — La Multiprise',qty:2,total:298,status:'en cours'}
  ],
  clients:[], // Auto-generated from orders now

  conversations:[
    {id:1,name:'Youssef Benali',phone:'0612345678',preview:'Je veux commander le maillot rouge taille L svp',time:'10:32',unread:true},
    {id:2,name:'Sara El Fassi',phone:'0655443322',preview:'Ma commande MS-1002 est arrivée quand ?',time:'09:15',unread:true},
    {id:3,name:'Amine Tazi',phone:'0644556677',preview:'Merci pour la livraison rapide!',time:'Hier',unread:false},
    {id:4,name:'Hamid Bousaid',phone:'0677889900',preview:'Est-ce que vous avez la taille XL?',time:'Hier',unread:false},
    {id:5,name:'Nadia Chraibi',phone:'0611223344',preview:'Bonjour, je voudrais passer commande',time:'Lun',unread:false}
  ],
  settings:{storeName:'Maghribi Store',email:'contact@maghribistore.ma',phone:'212600000000',address:'Casablanca, Maroc',currency:'MAD'}
};

// --- LOCALSTORAGE ---
function loadData(){
  const d={};
  ['products','orders','clients','conversations','settings'].forEach(k=>{
    const s=localStorage.getItem('admin_'+k);
    d[k]=s?JSON.parse(s):JSON.parse(JSON.stringify(DEFAULTS[k]));
  });
  return d;
}
function saveData(key,val){
  try {
    localStorage.setItem('admin_'+key,JSON.stringify(val));
  } catch (e) {
    console.error("Storage error:", e);
    if (e.name === 'QuotaExceededError' || e.code === 22) {
       toast('⚠️ Espace de stockage plein ! Vos photos sont trop lourdes. Veuillez utiliser des images plus petites ou supprimer des produits anciens.', true);
    } else {
       toast('⚠️ Erreur lors de la sauvegarde des données.', true);
    }
    throw e; // Rethrow to stop consecutive logic
  }
}
let D=loadData();

// --- SYNC HELPERS ---
function resyncClients() {
  const map = {};
  D.orders.forEach(o => {
    if (!map[o.phone]) {
      map[o.phone] = { id: o.phone, name: o.client, phone: o.phone, city: o.city, orders: 0, total: 0, joined: o.date };
    }
    map[o.phone].orders += 1;
    if(o.status === 'livré') map[o.phone].total += o.total;
  });
  D.clients = Object.values(map);
  saveData('clients', D.clients);
}

// --- TOAST ---
function toast(msg,err=false){
  let c=document.querySelector('.toast-ctr');
  if(!c){c=document.createElement('div');c.className='toast-ctr';document.body.appendChild(c);}
  const t=document.createElement('div');
  t.className='toast'+(err?' err':'');
  if (err) t.style.background = 'var(--gold)'; // Gold error message
  t.textContent=msg;
  c.appendChild(t);
  setTimeout(()=>{t.style.animation='toastOut .3s ease forwards';setTimeout(()=>t.remove(),320);},3200);
}

// --- NAVIGATION ---
let currentPage='dashboard';
function showPage(id){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  document.getElementById('page-'+id)?.classList.add('active');
  document.querySelector(`[data-page="${id}"]`)?.classList.add('active');
  document.getElementById('tb-title').textContent=
    {dashboard:'Tableau de Bord',products:'Produits',orders:'Commandes',clients:'Clients',whatsapp:'WhatsApp Messages',stats:'Statistiques',settings:'Paramètres'}[id]||id;
  currentPage=id;
  if(id==='dashboard')renderDashboard();
  if(id==='products')renderProducts();
  if(id==='orders')renderOrders();
  if(id==='clients')renderClients();
  if(id==='whatsapp')renderWhatsApp();
  if(id==='stats')renderStats();
  if(id==='settings')renderSettings();
  closeSidebar();
}

// --- SIDEBAR MOBILE ---
function toggleSidebar(){document.getElementById('sidebar').classList.toggle('open');}
function closeSidebar(){if(window.innerWidth<768)document.getElementById('sidebar').classList.remove('open');}

// --- DASHBOARD ---
function renderDashboard(){
  const o=D.orders,p=D.products,c=D.clients;
  const today=o.filter(x=>x.date===new Date().toISOString().slice(0,10)||x.date==='2026-03-24');
  const todaySales=today.reduce((s,x)=>s+(x.total||0),0);
  const totalStock=p.reduce((s,x)=>s+x.stock,0);
  document.getElementById('stat-sales').textContent=todaySales.toLocaleString()+' MAD';
  document.getElementById('stat-orders').textContent=today.length;
  document.getElementById('stat-stock').textContent=totalStock;
  document.getElementById('stat-clients').textContent=c.length;
  renderRecentOrders();
  renderSalesChart();
}

function renderRecentOrders(){
  const tbody=document.getElementById('recent-orders-body');
  if(!tbody)return;
  tbody.innerHTML=D.orders.slice(0,6).map(o=>`
    <tr>
      <td><strong>${o.id}</strong></td>
      <td>${o.client}</td>
      <td>${o.product}</td>
      <td>${o.total} MAD</td>
      <td>${statusBadge(o.status)}</td>
      <td><button class="btn btn-sm btn-outline" onclick="openOrderPanel('${o.id}')">👁️ Voir</button></td>
    </tr>`).join('');
}

function statusBadge(s){
  const m={livré:'badge-green',en_cours:'badge-gold','en cours':'badge-gold',annulé:'badge-red'};
  return `<span class="badge ${m[s]||'badge-grey'}">${s}</span>`;
}

let salesChart=null;
function renderSalesChart(){
  const ctx=document.getElementById('salesChart');
  if(!ctx)return;
  if(salesChart)salesChart.destroy();
  const labels=['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];
  const data=[1240,890,1580,720,1940,2100,1650];
  salesChart=new Chart(ctx,{
    type:'line',
    data:{labels,datasets:[{
      label:'Ventes (MAD)',data,
      borderColor:'#C9A227',backgroundColor:'rgba(201,162,39,.12)',
      borderWidth:3,pointBackgroundColor:'#C9A227',pointRadius:5,tension:.4,fill:true
    }]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>c.raw+' MAD'}}},
      scales:{y:{grid:{color:'rgba(0,0,0,.05)'},ticks:{color:'#888',callback:v=>v+' MAD'}},x:{grid:{display:false},ticks:{color:'#888'}}}}
  });
}

// --- PRODUCTS ---
let prodFilter='';
function renderProducts(filter){
  if(filter!==undefined)prodFilter=filter;
  const tbody=document.getElementById('products-body');
  if(!tbody)return;
  const items=D.products.filter(p=>!prodFilter||p.name.toLowerCase().includes(prodFilter.toLowerCase())||p.category.toLowerCase().includes(prodFilter.toLowerCase()));
  tbody.innerHTML=items.length?items.map(p=>{
    let thumb = 'https://placehold.co/400x400/0D3B38/C9A227?text=Produit';
    let photoCount = 0;
    if(p.images && p.images.length > 0) {
      thumb = p.mainImage || p.images[0];
      photoCount = p.images.length;
    } else if(p.img && p.img.length > 5) {
      thumb = p.img;
      photoCount = 1;
    }
    
    return `
    <tr>
      <td>
        <div style="position:relative; width:50px; height:50px; display:inline-block;">
          <img src="${thumb}" style="width:50px;height:50px;object-fit:cover;border-radius:6px;background:#eee" alt="thumb">
          ${photoCount > 1 ? `<div style="position:absolute; bottom:-6px; right:-6px; background:var(--gold); color:#fff; font-size:0.65rem; padding:2px 4px; border-radius:4px; font-weight:bold; white-space:nowrap; box-shadow:0 1px 3px rgba(0,0,0,.2);">${photoCount} photos</div>` : ''}
        </div>
      </td>
      <td><strong>${p.name}</strong></td>
      <td><span class="badge badge-grey">${p.category}</span></td>
      <td><strong style="color:var(--teal)">${p.price} MAD</strong></td>
      <td><span class="badge ${p.stock>20?'badge-green':p.stock>5?'badge-gold':'badge-red'}">${p.stock}</span></td>
      <td><span class="badge ${p.status?'badge-green':'badge-grey'}">${p.status?'Actif':'Inactif'}</span></td>
      <td style="display:flex;gap:6px;flex-wrap:wrap;">
        <button class="btn-icon" onclick="openEditProduct('${p.id}')" title="Modifier">✏️</button>
        <button class="btn-icon btn-del" onclick="deleteProduct('${p.id}')" title="Supprimer">🗑️</button>
      </td>
    </tr>`;
  }).join(''):`<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--grey)">Aucun produit trouvé</td></tr>`;
}

function openAddProduct(){
  document.getElementById('modal-prod-title').textContent='Ajouter un Produit';
  document.getElementById('prod-form')?.reset();
  document.getElementById('prod-name').value='';
  document.getElementById('prod-desc').value='';
  document.getElementById('prod-price').value='';
  
  currentProductImages = [];
  renderImageGrid();
  
  predefinedSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
  currentProductSizes = [];
  renderSizeToggles();
  
  document.getElementById('prod-id').value='';
  document.getElementById('prod-status').checked=true;
  openModal('modal-product');
}
function openEditProduct(id){
  const p=D.products.find(x=>x.id==id);if(!p)return; // use weak match for id string vs number
  document.getElementById('modal-prod-title').textContent='Modifier le Produit';
  document.getElementById('prod-id').value=p.id;
  document.getElementById('prod-name').value=p.name;
  document.getElementById('prod-desc').value=p.desc||'';
  document.getElementById('prod-price').value=p.price;
  document.getElementById('prod-cat').value=p.category||'';
  currentProductImages = [];
  if (p.images && p.images.length > 0) {
    currentProductImages = p.images.map(url => ({
      id: Date.now() + Math.random(),
      url: url,
      isMain: url === p.mainImage
    }));
  } else if (p.img && p.img.length > 5 && !p.img.startsWith('👕')) {
    currentProductImages = [{
      id: Date.now() + Math.random(),
      url: p.img,
      isMain: true
    }];
  }
  renderImageGrid();
  
  predefinedSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
  
  if (p.colors && p.colors.length > 0) {
    // Attempt fallback from color config to size logic simply to not lose the data context heavily:
    currentProductSizes = [];
    p.colors.forEach(c => {
      c.sizes.forEach(s => {
         const existing = currentProductSizes.find(x => x.size === s.size);
         if(existing) existing.stock += +s.stock;
         else currentProductSizes.push({size: s.size, stock: +s.stock});
      });
    });
  } else if (p.sizes && p.sizes.length > 0) {
    currentProductSizes = JSON.parse(JSON.stringify(p.sizes));
  } else {
    currentProductSizes = [];
  }
  
  currentProductSizes.forEach(s => { if(!predefinedSizes.includes(s.size)) predefinedSizes.push(s.size); });
  renderSizeToggles();
  
  document.getElementById('prod-status').checked=p.status;
  openModal('modal-product');
}
function saveProduct(){
  const id=document.getElementById('prod-id').value;
  
  const images = currentProductImages.map(img => img.url);
  const mainImage = (currentProductImages.find(img => img.isMain) || currentProductImages[0] || {}).url || null;

  const sizesObj = currentProductSizes.map(cs => ({ size: cs.size, stock: +cs.stock }));
  const globalStock = sizesObj.reduce((sum, s) => sum + s.stock, 0);
  
  const p={
    name:document.getElementById('prod-name').value.trim(),
    desc:document.getElementById('prod-desc').value.trim(),
    price:+document.getElementById('prod-price').value,
    stock: globalStock,
    category:document.getElementById('prod-cat').value,
    status:document.getElementById('prod-status').checked,
    images: images,
    mainImage: mainImage,
    img: mainImage || 'https://placehold.co/400x400/0D3B38/C9A227?text=Produit',
    sizes: sizesObj
  };
  
  // Cleanup old colors data structure from storage safely.
  delete p.colors;
  
  if(!p.name || !p.price || sizesObj.length === 0){
    toast('⚠️ Veuillez remplir Nom, Prix et choisir au moins une taille', true);
    return;
  }
  
  if(id){
    const i=D.products.findIndex(x=>x.id==id);
    if(i>-1)D.products[i]={...D.products[i],...p};
    toast('Produit modifié avec succès ✅');
  }else{
    p.id='prod-'+Date.now();
    D.products.push(p);
    toast(`${images.length} photo(s) sauvegardée(s) pour le nouveau produit ✅`);
  }
  
  try {
    saveData('products',D.products);
    closeModal('modal-product');
    renderProducts();
    renderDashboard();
  } catch (err) {
    // Error already toasted in saveData
    D.products.pop(); // Remove the failed entry from memory array to stay synced with storage
  }
}

function deleteProduct(id){
  if(!confirm('Voulez-vous vraiment supprimer ce produit ?'))return;
  D.products=D.products.filter(x=>x.id!=id);
  saveData('products',D.products);
  renderProducts();
  renderDashboard();
  toast('Produit supprimé ✅');
}

// --- DRAG, DROP & MULTI-IMAGE UPLOADER ---
let currentProductImages = [];

function handleDrop(e) {
  e.preventDefault();
  const dz = document.getElementById('drop-zone');
  dz.style.borderColor='var(--teal)'; dz.style.background='var(--ivory)';
  handleMultipleImages(e.dataTransfer.files);
}

function handleMultipleImages(files) {
  if (!files || files.length === 0) return;
  const newFiles = Array.from(files);
  const remaining = 10 - currentProductImages.length;
  if(newFiles.length > remaining) toast(`Vous ne pouvez ajouter que ${remaining} photo(s) supplémentaire(s)`, true);
  
  newFiles.slice(0, remaining).forEach(file => {
    const reader = new FileReader();
    reader.onload = e => {
      const imgObj = new Image();
      imgObj.onload = () => {
        // Simple Canvas Compression
        const canvas = document.createElement('canvas');
        let width = imgObj.width;
        let height = imgObj.height;
        const MAX_SIZE = 800; // Resize to max 800px width/height for web safety
        if (width > height) { if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; } }
        else { if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; } }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(imgObj, 0, 0, width, height);
        
        // Export to high-quality compressed JPEG (0.7 quality saves TONS of space)
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
        
        currentProductImages.push({ 
          url: compressedBase64, 
          isMain: currentProductImages.length === 0, 
          id: Date.now() + Math.random() 
        });
        renderImageGrid();
      };
      imgObj.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function renderImageGrid() {
  const g = document.getElementById('m-prod-img-grid');
  document.getElementById('photo-counter').textContent = `${currentProductImages.length}/10 photos ajoutées`;
  g.innerHTML = currentProductImages.map((img, idx) => `
    <div draggable="true" ondragstart="dragStart(event, ${idx})" ondragover="event.preventDefault()" ondrop="dropImage(event, ${idx})" style="position:relative; width:100%; aspect-ratio:1; border-radius:6px; border:2px solid ${img.isMain?'var(--gold)':'transparent'}; overflow:hidden; background:#eee; cursor:grab;">
      <img src="${img.url}" style="width:100%; height:100%; object-fit:cover; pointer-events:none;">
      ${img.isMain ? `<div style="position:absolute; bottom:0; left:0; right:0; background:rgba(201,162,39,0.9); color:#fff; font-size:0.65rem; text-align:center; padding:3px 0; font-weight:bold;">Principale</div>` : ''}
      <button type="button" onclick="deleteImage(${idx});event.stopPropagation();" style="position:absolute; top:4px; right:4px; background:#d34646; color:#fff; border:none; border-radius:50%; width:20px; height:20px; font-size:10px; cursor:pointer; display:flex; align-items:center; justify-content:center; box-shadow:0 2px 4px rgba(0,0,0,.2);">✕</button>
      <button type="button" onclick="setMainImage(${idx});event.stopPropagation();" style="position:absolute; top:4px; left:4px; background:${img.isMain?'var(--gold)':'rgba(0,0,0,.5)'}; color:#fff; border:none; border-radius:50%; width:20px; height:20px; font-size:10px; cursor:pointer; display:flex; align-items:center; justify-content:center; box-shadow:0 2px 4px rgba(0,0,0,.2);" title="Définir comme photo principale">⭐</button>
    </div>`).join('');
}

function deleteImage(idx) {
  const wasMain = currentProductImages[idx].isMain;
  currentProductImages.splice(idx, 1);
  if(wasMain && currentProductImages.length > 0) currentProductImages[0].isMain = true;
  renderImageGrid();
}

function setMainImage(idx) {
  currentProductImages.forEach((img, i) => img.isMain = (i === idx));
  const [main] = currentProductImages.splice(idx, 1);
  currentProductImages.unshift(main); // Move to front
  renderImageGrid();
}

let draggedImgIdx = null;
function dragStart(e, idx) { draggedImgIdx = idx; }
function dropImage(e, targetIdx) {
  e.preventDefault();
  if(draggedImgIdx === null || draggedImgIdx === targetIdx) return;
  const item = currentProductImages.splice(draggedImgIdx, 1)[0];
  currentProductImages.splice(targetIdx, 0, item);
  renderImageGrid();
}

// --- ORDERS ---
let orderFilter='all';
function renderOrders(filter){
  if(filter)orderFilter=filter;
  document.querySelectorAll('.ftab').forEach(t=>t.classList.toggle('active',t.dataset.filter===orderFilter));
  const search=(document.getElementById('orders-search')||{}).value||'';
  const tbody=document.getElementById('orders-body');if(!tbody)return;
  let items=D.orders.filter(o=>orderFilter==='all'||o.status.replace(' ','_')===orderFilter||o.status===orderFilter.replace('_',' '));
  if(search)items=items.filter(o=>o.id.includes(search)||o.client.toLowerCase().includes(search.toLowerCase())||o.city.toLowerCase().includes(search.toLowerCase()));
  tbody.innerHTML=items.length?items.map(o=>`
    <tr>
      <td><strong>${o.id}</strong></td>
      <td>${o.date}</td>
      <td>${o.client}</td>
      <td>${o.city}</td>
      <td>${o.product}</td>
      <td><strong>${o.total} MAD</strong></td>
      <td>${statusBadge(o.status)}</td>
      <td><button class="btn btn-sm btn-outline" onclick="openOrderPanel('${o.id}')">👁️</button></td>
    </tr>`).join(''):`<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--grey)">Aucune commande</td></tr>`;
}

function openOrderPanel(id){
  const o=D.orders.find(x=>x.id===id);if(!o)return;
  document.getElementById('panel-order-content').innerHTML=`
    <div style="margin-bottom:16px">
      <div style="font-family:var(--font-h);font-size:1.4rem;color:var(--teal);margin-bottom:4px">${o.id}</div>
      <div>${statusBadge(o.status)}</div>
    </div>
    <h4 style="color:var(--teal);margin-bottom:10px;font-size:.85rem;text-transform:uppercase;letter-spacing:.5px">👤 Client</h4>
    <div class="info-row"><span class="info-label">Nom</span><strong>${o.client}</strong></div>
    <div class="info-row"><span class="info-label">Téléphone</span><a href="https://wa.me/212${o.phone.slice(1)}" target="_blank" style="color:var(--green)">📞 ${o.phone}</a></div>
    <div class="info-row"><span class="info-label">Ville</span>${o.city}</div>
    <h4 style="color:var(--teal);margin:14px 0 10px;font-size:.85rem;text-transform:uppercase;letter-spacing:.5px">📦 Commande</h4>
    <div class="info-row"><span class="info-label">Produit</span>${o.product}</div>
    <div class="info-row"><span class="info-label">Quantité</span>${o.qty||1}</div>
    <div class="info-row"><span class="info-label">Total</span><strong style="color:var(--teal);font-size:1.1rem">${o.total} MAD</strong></div>
    <div class="info-row"><span class="info-label">Date</span>${o.date}</div>
    <h4 style="color:var(--teal);margin:14px 0 10px;font-size:.85rem;text-transform:uppercase;letter-spacing:.5px">🔄 Changer Statut</h4>
    <select class="inp" id="order-status-sel" style="width:100%;margin-bottom:12px">
      <option value="en cours" ${o.status==='en cours'?'selected':''}>En cours</option>
      <option value="livré" ${o.status==='livré'?'selected':''}>Livré</option>
      <option value="annulé" ${o.status==='annulé'?'selected':''}>Annulé</option>
    </select>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn btn-gold" onclick="updateOrderStatus('${o.id}')">💾 Sauvegarder</button>
      <a href="https://wa.me/212${o.phone.slice(1)}?text=${encodeURIComponent('Bonjour '+o.client+', votre commande '+o.id+' de Maghribi Store 🇲🇦')}" target="_blank" class="btn btn-wa">💬 WhatsApp</a>
    </div>`;
  openPanel('panel-order');
}
function updateOrderStatus(id){
  const sel=document.getElementById('order-status-sel');if(!sel)return;
  const i=D.orders.findIndex(x=>x.id===id);
  if(i>-1){
    D.orders[i].status=sel.value;
    saveData('orders',D.orders);
    resyncClients();
    renderOrders();
    renderDashboard();
    toast('Statut mis à jour ✅');
  }
}

// --- SIZES & STOCK ENGINE ---
let predefinedSizes = [];
let currentProductSizes = [];

function renderSizeToggles() {
  const container = document.getElementById('size-toggles');
  const allSizes = [...new Set([...predefinedSizes, ...currentProductSizes.map(s => s.size)])];
  
  container.innerHTML = allSizes.map(s => {
    const isSel = currentProductSizes.find(x => x.size === s);
    return `<button type="button" onclick="toggleSize('${s}')" style="padding:8px 14px; border:2px solid ${isSel?'var(--gold)':'#ddd'}; border-radius:6px; cursor:pointer; font-weight:bold; background:${isSel?'var(--gold)':'var(--ivory)'}; color:${isSel?'#fff':'var(--grey)'}; transition:all 0.2s;">${s}</button>`;
  }).join('');
  renderSizeStocks();
}

function toggleSize(s) {
  const idx = currentProductSizes.findIndex(x => x.size === s);
  if (idx > -1) currentProductSizes.splice(idx, 1);
  else currentProductSizes.push({ size: s, stock: 10 });
  renderSizeToggles();
}

function addCustomSize() {
  const el = document.getElementById('custom-size-input');
  const val = el.value.trim().toUpperCase();
  if (!val) return;
  if (!predefinedSizes.includes(val)) predefinedSizes.push(val);
  if (!currentProductSizes.find(x => x.size === val)) currentProductSizes.push({ size: val, stock: 10 });
  el.value = '';
  renderSizeToggles();
}

function renderSizeStocks() {
  const container = document.getElementById('size-stocks-container');
  container.innerHTML = currentProductSizes.map((cs, idx) => `
    <div style="display:flex; align-items:center; gap:10px; padding:10px; background:var(--ivory); border-radius:6px; border:1px solid #ddd;">
      <strong style="width:50px; color:var(--teal)">[${cs.size}]</strong>
      <label style="margin:0; font-size:0.85rem; color:var(--grey)">Stock:</label>
      <input type="number" class="inp" style="width:100px; padding:8px;" value="${cs.stock}" min="0" oninput="currentProductSizes[${idx}].stock=this.value">
    </div>
  `).join('');
}
function exportCSV(){
  const h=['N° Commande','Date','Client','Ville','Produit','Total MAD','Statut'];
  const rows=D.orders.map(o=>[o.id,o.date,o.client,o.city,o.product,o.total,o.status]);
  const csv=[h,...rows].map(r=>r.join(',')).join('\n');
  const a=document.createElement('a');a.href='data:text/csv;charset=utf-8,'+encodeURIComponent(csv);
  a.download='commandes_maghribi.csv';a.click();toast('Export CSV téléchargé ✅');
}

// --- CLIENTS ---
function renderClients(filter){
  const search=filter!==undefined?filter:(document.getElementById('clients-search')||{}).value||'';
  const tbody=document.getElementById('clients-body');if(!tbody)return;
  const items=D.clients.filter(c=>!search||c.name.toLowerCase().includes(search.toLowerCase())||c.city.toLowerCase().includes(search.toLowerCase())||c.phone.includes(search));
  tbody.innerHTML=items.length?items.map(c=>`
    <tr>
      <td><strong>${c.name}</strong></td>
      <td><a href="https://wa.me/212${c.phone.slice(1)}" target="_blank" style="color:var(--green)">💬 ${c.phone}</a></td>
      <td>${c.city}</td>
      <td><span class="badge badge-gold">${c.orders} cmd</span></td>
      <td><strong>${c.total} MAD</strong></td>
      <td><small>${c.joined}</small></td>
      <td><button class="btn btn-sm btn-outline" onclick="openClientPanel(${c.id})">👁️</button></td>
    </tr>`).join(''):`<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--grey)">Aucun client</td></tr>`;
}
function openClientPanel(id){
  const c=D.clients.find(x=>x.id===id);if(!c)return;
  const orders=D.orders.filter(o=>o.client===c.name);
  document.getElementById('panel-client-content').innerHTML=`
    <div style="text-align:center;margin-bottom:20px">
      <div style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,var(--teal),var(--teal-mid));margin:0 auto 12px;display:flex;align-items:center;justify-content:center;font-family:var(--font-a);font-size:1.8rem;color:var(--gold)">${c.name[0]}</div>
      <div style="font-family:var(--font-h);font-size:1.2rem;color:var(--teal)">${c.name}</div>
    </div>
    <div class="info-row"><span class="info-label">Téléphone</span><a href="https://wa.me/212${c.phone.slice(1)}" target="_blank" style="color:var(--green)">💬 ${c.phone}</a></div>
    <div class="info-row"><span class="info-label">Ville</span>${c.city}</div>
    <div class="info-row"><span class="info-label">Total dépensé</span><strong style="color:var(--teal)">${c.total} MAD</strong></div>
    <div class="info-row"><span class="info-label">Client depuis</span>${c.joined}</div>
    <h4 style="margin:16px 0 10px;font-size:.85rem;text-transform:uppercase;letter-spacing:.5px;color:var(--teal)">🛒 Historique commandes</h4>
    ${orders.length?orders.map(o=>`<div style="padding:10px;background:var(--ivory);border-radius:6px;margin-bottom:8px"><div style="display:flex;justify-content:space-between;margin-bottom:4px"><strong>${o.id}</strong>${statusBadge(o.status)}</div><div style="font-size:.83rem;color:var(--grey)">${o.product} — ${o.total} MAD</div></div>`).join(''):'<p style="color:var(--grey);font-size:.85rem">Aucune commande trouvée</p>'}
    <div style="margin-top:16px"><a href="https://wa.me/212${c.phone.slice(1)}" target="_blank" class="btn btn-wa" style="width:100%;justify-content:center">💬 Contacter sur WhatsApp</a></div>`;
  openPanel('panel-client');
}

// --- WHATSAPP ---
function renderWhatsApp(){
  const list=document.getElementById('wa-conversations');if(!list)return;
  list.innerHTML=D.conversations.map(c=>`
    <div class="wa-item ${c.unread?'unread':''}" onclick="window.open('https://wa.me/212${c.phone.slice(1)}','_blank')">
      <div class="wa-avatar">${c.name[0]}</div>
      <div class="wa-info">
        <div class="wa-name">${c.name}${c.unread?' <span class="badge badge-green" style="margin-left:6px;font-size:.65rem">Nouveau</span>':''}</div>
        <div class="wa-preview">${c.preview}</div>
      </div>
      <div class="wa-meta">
        <span class="wa-time">${c.time}</span>
        ${c.unread?'<span class="wa-dot"></span>':''}
      </div>
    </div>`).join('');
}

// --- STATISTICS ---
let chartMonthly=null,chartPie=null,chartClients=null;
function renderStats(){
  // Summary cards
  const totalRev=D.orders.filter(o=>o.status==='livré').reduce((s,o)=>s+o.total,0);
  document.getElementById('stat-total-rev').textContent=totalRev.toLocaleString()+' MAD';
  const cities={};D.orders.forEach(o=>cities[o.city]=(cities[o.city]||0)+1);
  const topCity=Object.entries(cities).sort((a,b)=>b[1]-a[1])[0];
  document.getElementById('stat-top-city').textContent=topCity?topCity[0]:'—';
  const topProd=D.products.slice().sort((a,b)=>b.price-a.price)[0];
  document.getElementById('stat-top-prod').textContent=topProd?.name||'—';
  setTimeout(()=>{renderMonthlyChart();renderPieChart();renderClientsChart();},100);
}
function renderMonthlyChart(){
  const ctx=document.getElementById('monthlyChart');if(!ctx)return;
  if(chartMonthly)chartMonthly.destroy();
  chartMonthly=new Chart(ctx,{type:'bar',
    data:{labels:['Oct','Nov','Déc','Jan','Fév','Mar'],
      datasets:[{label:'Ventes MAD',data:[8400,12500,18200,9800,14300,17600],backgroundColor:'rgba(13,59,56,.75)',borderColor:'#0D3B38',borderWidth:2,borderRadius:6}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},
      scales:{y:{grid:{color:'rgba(0,0,0,.05)'},ticks:{callback:v=>v.toLocaleString()+' MAD'}},x:{grid:{display:false}}}}});
}
function renderPieChart(){
  const ctx=document.getElementById('pieChart');if(!ctx)return;
  if(chartPie)chartPie.destroy();
  const cats={};D.orders.forEach(o=>{const p=D.products.find(x=>x.name===o.product);if(p)cats[p.category]=(cats[p.category]||0)+o.total;});
  chartPie=new Chart(ctx,{type:'doughnut',
    data:{labels:Object.keys(cats),datasets:[{data:Object.values(cats),backgroundColor:['#0D3B38','#C9A227','#B85C38','#2A7570'],borderWidth:2,borderColor:'#FAF3E0'}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'bottom',labels:{font:{size:12},color:'#555'}}}}});
}
function renderClientsChart(){
  const ctx=document.getElementById('clientsChart');if(!ctx)return;
  if(chartClients)chartClients.destroy();
  chartClients=new Chart(ctx,{type:'line',
    data:{labels:['S1','S2','S3','S4','S5','S6','S7','S8'],
      datasets:[{label:'Nouveaux clients',data:[3,5,2,8,4,7,6,9],borderColor:'#C9A227',backgroundColor:'rgba(201,162,39,.1)',borderWidth:3,pointRadius:5,tension:.4,fill:true}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},
      scales:{y:{grid:{color:'rgba(0,0,0,.05)'},ticks:{stepSize:1}},x:{grid:{display:false}}}}});
}

// --- SETTINGS ---
function renderSettings(){
  const s=D.settings;
  document.getElementById('set-store').value=s.storeName||'';
  document.getElementById('set-email').value=s.email||'';
  document.getElementById('set-phone').value=s.phone||'';
  document.getElementById('set-addr').value=s.address||'';
}
function saveSettings(){
  D.settings={...D.settings,
    storeName:document.getElementById('set-store').value,
    email:document.getElementById('set-email').value,
    phone:document.getElementById('set-phone').value,
    address:document.getElementById('set-addr').value
  };
  saveData('settings',D.settings);
  toast('Paramètres sauvegardés ✅');
}
function resetData(){
  if(!confirm('Réinitialiser toutes les données ? Cette action est irréversible !'))return;
  ['products','orders','clients','conversations','settings'].forEach(k=>localStorage.removeItem('admin_'+k));
  D=loadData();
  showPage(currentPage);
  toast('Données réinitialisées');
}

// --- MODAL HELPERS ---
function openModal(id){document.getElementById(id).classList.add('open');}
function closeModal(id){document.getElementById(id).classList.remove('open');}

// --- PANEL HELPERS ---
function openPanel(id){
  document.getElementById(id).classList.add('open');
  document.getElementById('panel-overlay').classList.add('open');
}
function closePanel(id){
  document.getElementById(id).classList.remove('open');
  document.getElementById('panel-overlay').classList.remove('open');
}

// --- KEYBOARD LISTENERS ---
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal.open, .modal-overlay.open').forEach(m => m.classList.remove('open'));
    document.querySelectorAll('.side-panel.open, .panel-overlay.open').forEach(p => p.classList.remove('open'));
  }
  if (e.key === 'Enter') {
    // If a modal input is focused, save
    if (document.querySelector('.modal.open input:focus')) saveProduct();
  }
});

// --- INIT ---
document.addEventListener('DOMContentLoaded',()=>{
  // Re-sync clients completely derived from local orders on load
  resyncClients();
  D=loadData();
  showPage('dashboard');
  
  // Custom polling listener replacing native event to keep live connection to STORE
  window.addEventListener('storage', (e) => {
    if (e.key === 'admin_orders') {
      D=loadData(); resyncClients();
      if(currentPage==='dashboard') renderDashboard();
      if(currentPage==='orders') renderOrders();
    }
  });
});
window.showPage=showPage;window.toggleSidebar=toggleSidebar;
window.openAddProduct=openAddProduct;window.openEditProduct=openEditProduct;
window.saveProduct=saveProduct;window.deleteProduct=deleteProduct;
window.openModal=openModal;window.closeModal=closeModal;
window.openPanel=openPanel;window.closePanel=closePanel;
window.renderOrders=renderOrders;window.renderProducts=renderProducts;
window.renderClients=renderClients;
window.openOrderPanel=openOrderPanel;window.openClientPanel=openClientPanel;
window.updateOrderStatus=updateOrderStatus;window.exportCSV=exportCSV;
window.saveSettings=saveSettings;window.resetData=resetData;
window.handleMultipleImages=handleMultipleImages; window.handleDrop=handleDrop; window.deleteImage=deleteImage; window.setMainImage=setMainImage; window.dragStart=dragStart; window.dropImage=dropImage;
window.toggleSize=toggleSize; window.addCustomSize=addCustomSize;
