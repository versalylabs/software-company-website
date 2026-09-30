/* ==========================================================
   products.js — versaly Phase 9
   Renders catalogue cards, spotlight strips, and full detail pages.
   All products are in-development; no live/deployed language used.
   ========================================================== */

var DATA_URL = new URL('../data/products.json', document.currentScript.src).href;

/* ── Icon library ─────────────────────────────────────────── */
var ICONS = {
  check:     '<path d="M5 13l1.857 1.857L19 7" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>',
  calendar:  '<rect x="3" y="6" width="18" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" stroke-width="2"/>',
  chart:     '<line x1="3" y1="21" x2="22" y2="21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><rect x="4" y="15" width="3" height="6" fill="currentColor"/><rect x="10" y="10" width="3" height="11" fill="currentColor"/><rect x="16" y="13" width="3" height="8" fill="currentColor"/>',
  clipboard: '<rect x="4" y="6" width="16" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><line x1="4" y1="10" x2="20" y2="10" stroke="currentColor" stroke-width="2"/><path d="M9 14l2 2 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>',
  trend:     '<line x1="3" y1="17" x2="22" y2="17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M3 17l8-8 5 5 9-9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>',
  clock:     '<circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2"/><line x1="12" y1="6" x2="12" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="12" y1="12" x2="17" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  star:      '<polygon points="12 2 14 7 19 7 15 10 17 15 12 13 7 15 9 10 5 7 10 7" fill="currentColor"/>',
  building:  '<rect x="4" y="11" width="16" height="9" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><line x1="4" y1="15" x2="20" y2="15" stroke="currentColor" stroke-width="2"/><rect x="8" y="7" width="2" height="3" fill="currentColor"/><rect x="13" y="7" width="2" height="3" fill="currentColor"/>',
  home:      '<path d="M12 3L3 9h2v10a2 2 0 002 2h10a2 2 0 002-2V9h2z" fill="none" stroke="currentColor" stroke-width="2"/>',
  villa:     '<path d="M5 13l7-7 7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><rect x="4" y="13" width="16" height="7" rx="1" fill="none" stroke="currentColor" stroke-width="2"/>',
  shield:    '<path d="M12 2L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-3z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M9 13l2 2 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>',
  city:      '<rect x="2" y="10" width="8" height="11" fill="none" stroke="currentColor" stroke-width="2"/><rect x="14" y="6" width="8" height="15" fill="none" stroke="currentColor" stroke-width="2"/><path d="M10 21V6l4-3v18" fill="none" stroke="currentColor" stroke-width="2"/>',
  search:    '<circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2"/><line x1="21" y1="21" x2="16.65" y2="16.65" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  arrow:     '<path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>'
};

function svg(name, size) {
  size = size || 20;
  var inner = ICONS[name] || ICONS.check;
  return '<svg viewBox="0 0 24 24" width="' + size + '" height="' + size + '" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" fill="none">' + inner + '</svg>';
}

function esc(str) {
  if (str == null) return '';
  return String(str).replace(/[&<>"']/g, function(c) {
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
  });
}

function statusLabel(s) {
  if (s === 'coming-soon') return 'Coming Soon';
  if (s === 'in-development') return 'In Development';
  return 'Available';
}
function statusClass(s) {
  if (s === 'coming-soon') return 'soon';
  if (s === 'in-development') return 'dev';
  return 'live';
}

/* Accent → light background (hex lighten approximation) */
function accentBg(accent) {
  // simple map for known accents
  var map = {
    '#4f46e5':'#eef2ff','#7c3aed':'#f5f3ff','#0d9488':'#f0fdfa',
    '#2563eb':'#eff6ff','#10b981':'#f0fdf4','#f59e0b':'#fffbeb',
    '#ea580c':'#fff7ed'
  };
  return map[accent] || '#f8fafc';
}

/* ── SVG Dashboard Mockup ─────────────────────────────────── */
function dashboardSvg(accent, title) {
  var c = accent;
  return '<svg width="100%" height="auto" viewBox="0 0 560 360" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' + esc(title) + ' dashboard preview">'
    + '<rect width="560" height="360" fill="#0f172a"/>'
    + '<rect x="0" y="0" width="560" height="50" fill="#1e293b" stroke="#334155" stroke-width="1"/>'
    + '<circle cx="26" cy="25" r="7" fill="' + c + '"/>'
    + '<text x="46" y="30" fill="#e2e8f0" font-family="system-ui,sans-serif" font-size="13" font-weight="600">' + esc(title) + '</text>'
    + '<rect x="0" y="50" width="72" height="310" fill="#111827"/>'
    + '<circle cx="36" cy="86" r="4" fill="' + c + '"/>'
    + '<circle cx="36" cy="122" r="4" fill="#94a3b8" opacity="0.6"/>'
    + '<circle cx="36" cy="158" r="4" fill="#94a3b8" opacity="0.6"/>'
    + '<circle cx="36" cy="194" r="4" fill="#94a3b8" opacity="0.6"/>'
    + '<rect x="90" y="66" width="150" height="64" rx="8" fill="#1e293b" stroke="#334155"/>'
    + '<text x="165" y="100" fill="#e2e8f0" font-family="system-ui,sans-serif" font-size="18" font-weight="700" text-anchor="middle">Overview</text>'
    + '<text x="165" y="120" fill="#94a3b8" font-family="system-ui,sans-serif" font-size="10" text-anchor="middle">In Development</text>'
    + '<rect x="250" y="66" width="150" height="64" rx="8" fill="#1e293b" stroke="#334155"/>'
    + '<text x="325" y="100" fill="' + c + '" font-family="system-ui,sans-serif" font-size="18" font-weight="700" text-anchor="middle">Beta</text>'
    + '<text x="325" y="120" fill="#94a3b8" font-family="system-ui,sans-serif" font-size="10" text-anchor="middle">Stage</text>'
    + '<rect x="410" y="66" width="140" height="64" rx="8" fill="#1e293b" stroke="#334155"/>'
    + '<text x="480" y="100" fill="#e2e8f0" font-family="system-ui,sans-serif" font-size="18" font-weight="700" text-anchor="middle">Q4</text>'
    + '<text x="480" y="120" fill="#94a3b8" font-family="system-ui,sans-serif" font-size="10" text-anchor="middle">Target</text>'
    + '<rect x="90" y="144" width="460" height="196" rx="10" fill="#1e293b" stroke="#334155"/>'
    + '<path d="M110 320 Q170 278 225 292 T310 248 Q385 228 440 260" stroke="' + c + '" stroke-width="2.5" fill="none" stroke-linecap="round"/>'
    + '<path d="M110 320 Q170 278 225 292 T310 248 Q385 228 440 260 L440 332 L110 332 Z" fill="' + c + '" fill-opacity="0.12"/>'
    + '<rect x="120" y="278" width="16" height="54" rx="2" fill="' + c + '" opacity="0.45"/>'
    + '<rect x="162" y="300" width="16" height="32" rx="2" fill="' + c + '" opacity="0.45"/>'
    + '<rect x="208" y="262" width="16" height="70" rx="2" fill="' + c + '" opacity="0.45"/>'
    + '<rect x="254" y="284" width="16" height="48" rx="2" fill="' + c + '" opacity="0.45"/>'
    + '<rect x="300" y="260" width="16" height="72" rx="2" fill="' + c + '" opacity="0.45"/>'
    + '<rect x="346" y="282" width="16" height="50" rx="2" fill="' + c + '" opacity="0.45"/>'
    + '<rect x="392" y="270" width="16" height="62" rx="2" fill="' + c + '" opacity="0.45"/>'
    + '<rect x="438" y="290" width="16" height="42" rx="2" fill="' + c + '" opacity="0.45"/>'
    + '</svg>';
}

function tableSvg(accent, title) {
  var out = '<svg width="100%" height="auto" viewBox="0 0 560 360" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' + esc(title) + '">';
  out += '<rect width="560" height="360" fill="#0f172a"/>';
  out += '<rect x="0" y="0" width="560" height="50" fill="#1e293b" stroke="#334155" stroke-width="1"/>';
  out += '<circle cx="26" cy="25" r="7" fill="' + accent + '"/>';
  out += '<text x="46" y="30" fill="#e2e8f0" font-family="system-ui,sans-serif" font-size="13" font-weight="600">' + esc(title) + '</text>';
  out += '<rect x="0" y="50" width="72" height="310" fill="#111827"/>';
  out += '<circle cx="36" cy="86" r="4" fill="' + accent + '"/>';
  out += '<circle cx="36" cy="122" r="4" fill="#94a3b8" opacity="0.6"/>';
  out += '<rect x="90" y="60" width="460" height="280" rx="10" fill="#1e293b" stroke="#334155"/>';
  out += '<rect x="98" y="68" width="444" height="32" rx="6" fill="#0f172a" stroke="#334155"/>';
  out += '<text x="116" y="89" fill="#94a3b8" font-family="system-ui,sans-serif" font-size="10">ID &nbsp;&nbsp;&nbsp;&nbsp; Name &nbsp;&nbsp;&nbsp;&nbsp; Status &nbsp;&nbsp;&nbsp;&nbsp; Date</text>';
  var rows = [
    {status:'#22c55e',label:'Active'},
    {status:'#f59e0b',label:'Pending'},
    {status:'#94a3b8',label:'Draft'},
    {status:'#22c55e',label:'Active'},
    {status:'#ef4444',label:'Closed'}
  ];
  for (var i = 0; i < rows.length; i++) {
    var y = 116 + i * 42;
    out += '<line x1="100" y1="' + y + '" x2="540" y2="' + y + '" stroke="#334155" stroke-width="1"/>';
    out += '<circle cx="116" cy="' + (y + 15) + '" r="4" fill="' + rows[i].status + '"/>';
    out += '<text x="132" y="' + (y + 19) + '" fill="#94a3b8" font-family="system-ui,sans-serif" font-size="10">' + rows[i].label + '</text>';
  }
  out += '</svg>';
  return out;
}

function chartSvg(accent, title) {
  var out = '<svg width="100%" height="auto" viewBox="0 0 560 360" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' + esc(title) + '">';
  out += '<rect width="560" height="360" fill="#0f172a"/>';
  out += '<rect x="0" y="0" width="560" height="50" fill="#1e293b" stroke="#334155" stroke-width="1"/>';
  out += '<circle cx="26" cy="25" r="7" fill="' + accent + '"/>';
  out += '<text x="46" y="30" fill="#e2e8f0" font-family="system-ui,sans-serif" font-size="13" font-weight="600">' + esc(title) + '</text>';
  out += '<rect x="0" y="50" width="72" height="310" fill="#111827"/>';
  out += '<circle cx="36" cy="86" r="4" fill="' + accent + '"/>';
  out += '<rect x="90" y="60" width="460" height="280" rx="10" fill="#1e293b" stroke="#334155"/>';
  out += '<path d="M110 318 Q170 260 230 278 T320 236 Q390 208 450 248" stroke="' + accent + '" stroke-width="2.5" fill="none" stroke-linecap="round"/>';
  out += '<path d="M110 318 Q170 260 230 278 T320 236 Q390 208 450 248 L450 318 L110 318 Z" fill="' + accent + '" fill-opacity="0.12"/>';
  out += '<line x1="100" y1="260" x2="550" y2="260" stroke="#334155" stroke-width="1"/>';
  out += '<line x1="100" y1="290" x2="550" y2="290" stroke="#334155" stroke-width="1"/>';
  out += '</svg>';
  return out;
}

function screenshotFor(accent, title, layout) {
  if (layout === 'table') return tableSvg(accent, title);
  if (layout === 'chart') return chartSvg(accent, title);
  return dashboardSvg(accent, title);
}

function renderScreenshot(accent, screen, isHero = false) {
  if (!screen) return dashboardSvg(accent, 'Dashboard');
  var imgUrl = screen.image || screen.url;
  var skin = screen.skin || screen.layout || 'browser';
  var label = screen.label || 'Visual Preview';

  if (!imgUrl) {
    return screenshotFor(accent, label, screen.layout);
  }

  if (skin === 'mobile') {
    return '<div class="pd-device-mobile">'
      + '<div class="pd-mobile-notch"></div>'
      + '<div class="pd-mobile-screen">'
      + '<img src="' + esc(imgUrl) + '" alt="' + esc(label) + '" loading="lazy">'
      + '</div>'
      + '</div>';
  }

  if (skin === 'none' || skin === 'raw') {
    return '<div class="pd-device-raw">'
      + '<img src="' + esc(imgUrl) + '" alt="' + esc(label) + '" loading="lazy">'
      + '</div>';
  }

  // Default: Browser frame with controls and address bar
  return '<div class="pd-device-browser">'
    + '<div class="pd-browser-bar">'
    + '<div class="pd-browser-dots">'
    + '<span class="pd-dot pd-dot--red"></span>'
    + '<span class="pd-dot pd-dot--yellow"></span>'
    + '<span class="pd-dot pd-dot--green"></span>'
    + '</div>'
    + '<div class="pd-browser-url">'
    + '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>'
    + 'https://versaly.cloud/app/' + esc((screen.layout || 'dashboard').toLowerCase())
    + '</div>'
    + '</div>'
    + '<div class="pd-browser-content">'
    + '<img src="' + esc(imgUrl) + '" alt="' + esc(label) + '" loading="lazy">'
    + '</div>'
    + '</div>';
}

/* ── Fetch helper ─────────────────────────────────────────── */
function fetchProducts() {
  return fetch(DATA_URL, {cache:'no-store'}).then(function(res) {
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  }).then(function(data) {
    if (data && Array.isArray(data.products)) {
      data.products = data.products
        .filter(function(p) { return p.status !== 'draft' && p.status !== 'archived'; })
        .sort(function(a, b) { return (a.order || 999) - (b.order || 999); });
    }
    return data;
  });
}


/* ── CATALOGUE: spotlight strip ──────────────────────────── */
function renderSpotlight(products) {
  var spots = products.filter(function(p) { return p.spotlight; }).slice(0, 2);
  if (!spots.length) return '';

  return '<div class="px-spotlight motion-fade-up">'
    + '<div class="px-spotlight__label">Featured Builds</div>'
    + '<div class="px-spotlight__grid motion-stagger">'
    + spots.map(function(p) {
        var c = p.accent || '#4f46e5';
        var bg = accentBg(c);
        var caps = (p.whatWeAreBuilding || p.keyFeatures || []).slice(0, 4);
        return '<div class="px-spot-card motion-fade-up">'
          + '<div class="px-spot-card__header" style="background:' + bg + '">'
          + '<div class="px-spot-card__badges">'
          + '<span class="pc-status pc-status--' + statusClass(p.status) + '"><span class="pc-status__dot pc-status--dot"></span>' + esc(statusLabel(p.status)) + '</span>'
          + '<span class="pc-cat">' + esc(p.category) + '</span>'
          + '</div>'
          + '<h3 class="px-spot-card__name" style="color:' + c + '">' + esc(p.name) + '</h3>'
          + '<p class="px-spot-card__tagline">' + esc(p.tagline) + '</p>'
          + '</div>'
          + '<div class="px-spot-card__body">'
          + '<span class="px-spot-card__building-label">What we are building</span>'
          + '<ul class="px-spot-card__caps">'
          + caps.map(function(cap) {
              return '<li><span class="px-spot-card__check" style="background:' + bg + ';color:' + c + '">'
                + svg('check', 10) + '</span>' + esc(cap) + '</li>';
            }).join('')
          + '</ul>'
          + '</div>'
          + '<div class="px-spot-card__footer">'
          + '<a href="product.html?id=' + encodeURIComponent(p.id) + '" class="px-spot-card__cta" data-track-cta="learn_more" data-track-location="catalogue_spotlight" data-track-product="' + esc(p.id) + '">Learn More ' + svg('arrow', 14) + '</a>'
          + '<a href="request-demo.html?product=' + encodeURIComponent(p.id) + '" class="px-spot-card__secondary" data-track-cta="request_demo" data-track-location="catalogue_spotlight" data-track-product="' + esc(p.id) + '">Request a Demo →</a>'
          + '</div>'
          + '</div>';
      }).join('')
    + '</div></div>';
}

/* ── CATALOGUE: product card ─────────────────────────────── */
function renderCard(p) {
  var c = p.accent || '#4f46e5';
  var bg = accentBg(c);
  var feats = (p.keyFeatures || []).slice(0, 3);
  return '<div class="pc-card motion-fade-up" style="--pc-accent:' + c + '" data-category="' + esc(p.category) + '" data-name="' + esc(p.name) + '" data-desc="' + esc(p.shortDescription) + '">'
    + '<div class="pc-card__top">'
    + '<div class="pc-card__icon" style="background:' + bg + ';color:' + c + '">' + svg('chart', 22) + '</div>'
    + '<span class="pc-status pc-status--' + statusClass(p.status) + '"><span class="pc-status--dot"></span>' + esc(statusLabel(p.status)) + '</span>'
    + '</div>'
    + '<span class="pc-cat pc-card__cat">' + esc(p.category) + '</span>'
    + '<h3 class="pc-card__name">' + esc(p.name) + '</h3>'
    + '<p class="pc-card__tagline">' + esc(p.shortDescription) + '</p>'
    + '<ul class="pc-card__features">'
    + feats.map(function(f) {
        return '<li><span class="pc-card__feat-dot" style="background:' + c + '"></span>' + esc(f) + '</li>';
      }).join('')
    + '</ul>'
    + '<div class="pc-card__footer">'
    + '<a href="product.html?id=' + encodeURIComponent(p.id) + '" class="pc-card__link" data-track-cta="view_product" data-track-location="catalogue_grid" data-track-product="' + esc(p.id) + '">View Product <span class="pc-card__link-arrow">→</span></a>'
    + '<a href="request-demo.html?product=' + encodeURIComponent(p.id) + '" class="pc-card__link pc-card__link--secondary" data-track-cta="request_demo" data-track-location="catalogue_grid" data-track-product="' + esc(p.id) + '">Request Demo</a>'
    + '</div>'
    + '</div>';
}

/* ── CATALOGUE: init ─────────────────────────────────────── */
function initCatalog() {
  var container = document.getElementById('products-grid');
  if (!container) return;

  fetchProducts().then(function(data) {
    var products = data.products || [];

    // Build spotlight
    var spotEl = document.getElementById('px-spotlight-container');
    if (spotEl) spotEl.innerHTML = renderSpotlight(products);

    // Remove loading state and render cards
    container.innerHTML = products.map(renderCard).join('') + '<div class="px-empty" id="px-empty-state">'
      + '<div class="px-empty__icon">' + svg('search', 28) + '</div>'
      + '<h3>No products match your search</h3>'
      + '<p>Try a different keyword or clear the filter to see all products.</p>'
      + '<button class="px-empty__clear" id="px-clear-all">Clear Search & Filter</button>'
      + '</div>';

    // Update results count
    updateResultsCount(products.length, products.length);

    // Track catalogue view
    if (window.versalyAnalytics) {
      versalyAnalytics.trackCatalogueView(products.length);
    }

    // Trigger Motion system on cards
    if (window.versalyMotion) {
      versalyMotion.init();
    }

    // Wire filter + search controls
    wireControls(products);

  }).catch(function(err) {
    container.innerHTML = '<div class="px-empty visible">'
      + '<div class="px-empty__icon">' + svg('search', 28) + '</div>'
      + '<h3>Could not load products</h3>'
      + '<p>Please serve this site via a local server (e.g. <code>python -m http.server</code>).</p>'
      + '</div>';
    console.error(err);
  });
}

function updateResultsCount(visible, total) {
  var bar = document.getElementById('px-results-bar');
  if (!bar) return;
  if (visible === total) {
    bar.textContent = total + ' product' + (total !== 1 ? 's' : '');
  } else {
    bar.textContent = visible + ' of ' + total + ' product' + (total !== 1 ? 's' : '');
  }
}

function wireControls(products) {
  var filterBtns = document.querySelectorAll('.px-filter-btn');
  var searchInput = document.getElementById('px-search-input');
  var clearBtn = document.getElementById('px-search-clear');
  var clearAll = document.getElementById('px-clear-all');
  var emptyState = document.getElementById('px-empty-state');

  var currentFilter = 'all';
  var currentQuery = '';
  var searchTimer = null;

  function applyFilters() {
    var cards = document.querySelectorAll('#products-grid .pc-card');
    var visible = 0;
    cards.forEach(function(card) {
      var cat = (card.dataset.category || '').toLowerCase();
      var name = (card.dataset.name || '').toLowerCase();
      var desc = (card.dataset.desc || '').toLowerCase();
      var q = currentQuery.toLowerCase();
      var matchFilter = currentFilter === 'all' || cat.includes(currentFilter);
      var matchSearch = !q || name.includes(q) || desc.includes(q) || cat.includes(q);
      if (matchFilter && matchSearch) { card.style.display = ''; visible++; }
      else { card.style.display = 'none'; }
    });
    updateResultsCount(visible, products.length);
    if (emptyState) {
      if (visible === 0) emptyState.classList.add('visible');
      else emptyState.classList.remove('visible');
    }
  }

  filterBtns.forEach(function(btn) {
    btn.addEventListener('click', function() {
      filterBtns.forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      currentFilter = btn.dataset.filter || 'all';
      if (window.versalyAnalytics) {
        versalyAnalytics.trackProductCategoryFilter(currentFilter);
      }
      applyFilters();
    });
  });

  if (searchInput) {
    searchInput.addEventListener('input', function() {
      currentQuery = searchInput.value;
      if (clearBtn) {
        if (currentQuery) clearBtn.classList.add('visible');
        else clearBtn.classList.remove('visible');
      }
      if (searchTimer) clearTimeout(searchTimer);
      searchTimer = setTimeout(function() {
        if (window.versalyAnalytics && currentQuery.trim()) {
          versalyAnalytics.trackProductSearch(currentQuery.trim().length);
        }
      }, 500);
      applyFilters();
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', function() {
      if (searchInput) { searchInput.value = ''; currentQuery = ''; }
      clearBtn.classList.remove('visible');
      applyFilters();
    });
  }

  if (clearAll) {
    clearAll.addEventListener('click', function() {
      currentFilter = 'all'; currentQuery = '';
      filterBtns.forEach(function(b) { b.classList.remove('active'); });
      var allBtn = document.querySelector('.px-filter-btn[data-filter="all"]');
      if (allBtn) allBtn.classList.add('active');
      if (searchInput) searchInput.value = '';
      if (clearBtn) clearBtn.classList.remove('visible');
      if (window.versalyAnalytics) {
        versalyAnalytics.trackProductCategoryFilter('all');
      }
      applyFilters();
    });
  }
}

/* ── DETAIL PAGE ─────────────────────────────────────────── */
function initDetail() {
  var container = document.getElementById('product-detail');
  if (!container) return;

  var id = new URLSearchParams(window.location.search).get('id') || '';

  fetchProducts().then(function(data) {
    var products = data.products || [];
    var product = products.find(function(p) { return p.id === id; });
    if (!product) {
      product = products.find(function(p) { return p.status === 'available'; }) || products[0];
    }
    if (!product) { container.innerHTML = '<p>Product not found. <a href="products.html">Back to Products</a></p>'; return; }

    // Track product detail view
    if (window.versalyAnalytics) {
      versalyAnalytics.trackProductView(product);
    }

    // Update page title
    document.title = esc(product.name) + ' — versaly';

    var c = product.accent || '#4f46e5';
    var bg = accentBg(c);
    container.style.setProperty('--pd-accent', c);
    container.style.setProperty('--pd-accent-bg', bg);

    // Build related products
    var related = (product.relatedIds || [])
      .map(function(rid) { return products.find(function(p) { return p.id === rid; }); })
      .filter(Boolean).slice(0, 3);

    var screens = product.screenshots && product.screenshots.length ? product.screenshots : [{layout:'dashboard',label:product.name}];
    var primaryScreen = screens[0];
    var currentScreenIndex = 0;

    container.innerHTML = renderDetail(product, related, screens, primaryScreen, c, bg);

    // Wire gallery thumbs
    var thumbs = container.querySelectorAll('.pd-gallery__thumb');
    var mainEl = container.querySelector('#pd-gallery-main');
    var capEl = container.querySelector('#pd-gallery-caption');

    function selectScreen(idx) {
      currentScreenIndex = idx;
      var s = screens[idx];
      if (!s) return;
      thumbs.forEach(function(t, i) {
        if (i === idx) t.classList.add('active');
        else t.classList.remove('active');
      });
      if (mainEl) {
        mainEl.innerHTML = renderScreenshot(c, s);
      }
      if (capEl) {
        capEl.textContent = s.caption || s.label || '';
        capEl.style.display = (s.caption || s.label) ? 'block' : 'none';
      }
    }

    thumbs.forEach(function(thumb, idx) {
      thumb.addEventListener('click', function() {
        selectScreen(idx);
      });
    });

    if (thumbs[0]) selectScreen(0);

    // Lightbox modal setup
    setupLightbox(screens, () => currentScreenIndex, selectScreen);

    // Click on main visual to open lightbox
    if (mainEl) {
      mainEl.style.cursor = 'zoom-in';
      mainEl.addEventListener('click', function() {
        openLightbox(currentScreenIndex);
      });
    }

    var heroVisual = container.querySelector('.pd-hero__visual');
    if (heroVisual) {
      heroVisual.style.cursor = 'zoom-in';
      heroVisual.addEventListener('click', function() {
        openLightbox(0);
      });
    }

  }).catch(function(err) {
    container.innerHTML = '<div class="px-empty visible"><div class="px-empty__icon">' + svg('search',28) + '</div><h3>Could not load product</h3><p>Please serve this site via a local server.</p></div>';
    console.error(err);
  });
}

/* ── LIGHTBOX MODAL ────────────────────────────────────────── */
var lightboxEl = null;
var activeLightboxIndex = 0;
var lightboxScreens = [];
var onScreenChangeCallback = null;

function setupLightbox(screens, getIndex, onSelect) {
  lightboxScreens = screens;
  onScreenChangeCallback = onSelect;

  if (!document.getElementById('pd-lightbox-backdrop')) {
    lightboxEl = document.createElement('div');
    lightboxEl.id = 'pd-lightbox-backdrop';
    lightboxEl.className = 'pd-lightbox-backdrop';
    lightboxEl.setAttribute('role', 'dialog');
    lightboxEl.setAttribute('aria-modal', 'true');
    lightboxEl.setAttribute('aria-label', 'Screenshot Preview Lightbox');
    lightboxEl.innerHTML = '<div class="pd-lightbox-container">'
      + '<button type="button" class="pd-lightbox-close" id="pd-lightbox-close" title="Close (Esc)">&times;</button>'
      + '<button type="button" class="pd-lightbox-nav pd-lightbox-prev" id="pd-lightbox-prev" title="Previous Visual">‹</button>'
      + '<button type="button" class="pd-lightbox-nav pd-lightbox-next" id="pd-lightbox-next" title="Next Visual">›</button>'
      + '<div class="pd-lightbox-content" id="pd-lightbox-content"></div>'
      + '<div class="pd-lightbox-info">'
      + '<div class="pd-lightbox-title" id="pd-lightbox-title"></div>'
      + '<div class="pd-lightbox-caption" id="pd-lightbox-caption"></div>'
      + '<div class="pd-lightbox-counter" id="pd-lightbox-counter"></div>'
      + '</div>'
      + '</div>';
    document.body.appendChild(lightboxEl);

    // Lightbox listeners
    document.getElementById('pd-lightbox-close').addEventListener('click', closeLightbox);
    document.getElementById('pd-lightbox-prev').addEventListener('click', () => stepLightbox(-1));
    document.getElementById('pd-lightbox-next').addEventListener('click', () => stepLightbox(1));
    lightboxEl.addEventListener('click', function(e) {
      if (e.target === lightboxEl) closeLightbox();
    });

    window.addEventListener('keydown', function(e) {
      if (!lightboxEl.classList.contains('is-open')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') stepLightbox(-1);
      if (e.key === 'ArrowRight') stepLightbox(1);
    });
  }
}

function openLightbox(index) {
  if (!lightboxEl || !lightboxScreens.length) return;
  activeLightboxIndex = Math.max(0, Math.min(index, lightboxScreens.length - 1));
  renderLightboxView();
  lightboxEl.classList.add('is-open');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  if (!lightboxEl) return;
  lightboxEl.classList.remove('is-open');
  document.body.style.overflow = '';
}

function stepLightbox(delta) {
  if (!lightboxScreens.length) return;
  var nextIdx = (activeLightboxIndex + delta + lightboxScreens.length) % lightboxScreens.length;
  activeLightboxIndex = nextIdx;
  if (typeof onScreenChangeCallback === 'function') {
    onScreenChangeCallback(nextIdx);
  }
  renderLightboxView();
}

function renderLightboxView() {
  var s = lightboxScreens[activeLightboxIndex];
  if (!s) return;

  var contentEl = document.getElementById('pd-lightbox-content');
  var titleEl = document.getElementById('pd-lightbox-title');
  var capEl = document.getElementById('pd-lightbox-caption');
  var countEl = document.getElementById('pd-lightbox-counter');
  var prevBtn = document.getElementById('pd-lightbox-prev');
  var nextBtn = document.getElementById('pd-lightbox-next');

  if (prevBtn) prevBtn.style.display = lightboxScreens.length > 1 ? 'flex' : 'none';
  if (nextBtn) nextBtn.style.display = lightboxScreens.length > 1 ? 'flex' : 'none';

  var imgUrl = s.image || s.url;
  if (imgUrl) {
    contentEl.innerHTML = '<img src="' + esc(imgUrl) + '" alt="' + esc(s.label || '') + '" class="pd-lightbox-image">';
  } else {
    contentEl.innerHTML = '<div class="pd-lightbox-svg-wrap">' + screenshotFor('#4f46e5', s.label, s.layout) + '</div>';
  }

  if (titleEl) titleEl.textContent = s.label || 'Conceptual Mockup';
  if (capEl) capEl.textContent = s.caption || '';
  if (countEl) countEl.textContent = (activeLightboxIndex + 1) + ' of ' + lightboxScreens.length;
}

function renderDetail(p, related, screens, primaryScreen, c, bg) {
  var statusCls = statusClass(p.status);
  var statusLbl = statusLabel(p.status);

  // Dynamically update document title & SEO metadata
  try {
    document.title = p.name + ' — versaly | ' + p.category + ' Software';
    var metaDesc = document.getElementById('page-meta-desc');
    if (metaDesc) metaDesc.setAttribute('content', p.tagline || p.problem || p.fullDescription);

    var existingSchema = document.getElementById('product-schema');
    if (!existingSchema) {
      var schemaScript = document.createElement('script');
      schemaScript.id = 'product-schema';
      schemaScript.type = 'application/ld+json';
      schemaScript.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": p.name,
        "applicationCategory": p.category,
        "description": p.tagline || p.problem,
        "operatingSystem": "Web-based, Cloud-native",
        "author": {
          "@type": "Organization",
          "name": "versaly",
          "url": "https://versaly.example.com/"
        }
      });
      document.head.appendChild(schemaScript);
    }
  } catch (e) {}

  // Hero visual (uses featuredImage or primaryScreen)
  var heroScreen = (p.featuredImage ? { image: p.featuredImage, layout: 'browser', label: p.name } : primaryScreen);
  var heroVisualHtml = renderScreenshot(c, heroScreen, true);

  // Hero
  var heroHtml = '<div class="pd-hero">'
    + '<div class="pd-hero__inner">'
    + '<div class="pd-hero__copy">'
    + '<div class="pd-hero__badges">'
    + '<span class="pc-status pc-status--' + statusCls + '"><span class="pc-status--dot"></span>' + esc(statusLbl) + '</span>'
    + '<span class="pc-cat">' + esc(p.category) + '</span>'
    + '</div>'
    + '<h1 class="pd-hero__name">' + esc(p.name) + '</h1>'
    + '<p class="pd-hero__tagline">' + esc(p.tagline) + '</p>'
    + '<div class="pd-hero__actions">'
    + '<a href="request-demo.html?product=' + encodeURIComponent(p.id) + '" class="pd-hero__btn-primary" data-track-cta="request_demo" data-track-location="product_hero" data-track-product="' + esc(p.id) + '">Request a Demo ' + svg('arrow',16) + '</a>'
    + '<a href="compare.html?products=' + encodeURIComponent(p.id) + '" class="pd-hero__btn-outline" data-track-cta="compare_product" data-track-location="product_hero" data-track-product="' + esc(p.id) + '">Compare System ' + svg('arrow',16) + '</a>'
    + '</div>'
    + '</div>'
    + '<div class="pd-hero__visual"><div class="pd-mockup-wrap">' + heroVisualHtml + '</div></div>'
    + '</div>'
    + '</div>';

  // Problem section
  var problemHtml = p.problem ? '<div class="pd-section">'
    + '<span class="pd-section__eyebrow">The Problem We Are Solving</span>'
    + '<h2 class="pd-section__title">Why we are building ' + esc(p.name) + '</h2>'
    + '<div class="pd-problem"><p>' + esc(p.problem) + '</p></div>'
    + '</div>' : '';

  // What we're building
  var buildingItems = p.whatWeAreBuilding || [];
  var buildingHtml = buildingItems.length ? '<div class="pd-section">'
    + '<span class="pd-section__eyebrow">What We Are Building</span>'
    + '<h2 class="pd-section__title">Planned capabilities</h2>'
    + '<p class="pd-section__sub">' + esc(p.fullDescription) + '</p>'
    + '<ul class="pd-building-list">'
    + buildingItems.map(function(item) {
        return '<li><span class="pd-bcheck" style="background:' + bg + ';color:' + c + '">' + svg('check',11) + '</span>' + esc(item) + '</li>';
      }).join('')
    + '</ul></div>' : '';

  // Key capabilities
  var featsHtml = p.features && p.features.length ? '<div class="pd-section" id="pd-capabilities">'
    + '<span class="pd-section__eyebrow">Key Capabilities</span>'
    + '<h2 class="pd-section__title">What it will do</h2>'
    + '<div class="pd-caps-grid">'
    + p.features.map(function(f) {
        return '<div class="pd-cap-card">'
          + '<div class="pd-cap-card__icon">' + svg(f.icon || 'check', 20) + '</div>'
          + '<div><h3>' + esc(f.title) + '</h3><p>' + esc(f.description) + '</p></div>'
          + '</div>';
      }).join('')
    + '</div></div>' : '';

  // Audience
  var audHtml = p.audience && p.audience.length ? '<div class="pd-section">'
    + '<span class="pd-section__eyebrow">Who It Is For</span>'
    + '<h2 class="pd-section__title">Intended users & businesses</h2>'
    + '<div class="pd-audience-grid">'
    + p.audience.map(function(a) {
        return '<div class="pd-aud-card">'
          + '<div class="pd-aud-card__icon">' + svg(a.icon || 'building', 22) + '</div>'
          + '<h3>' + esc(a.title) + '</h3>'
          + '<p>' + esc(a.description) + '</p>'
          + '</div>';
      }).join('')
    + '</div></div>' : '';

  // Development status banner
  var statusBannerHtml = '<div class="pd-section">'
    + '<span class="pd-section__eyebrow">Product Status</span>'
    + '<h2 class="pd-section__title">Where we are now</h2>'
    + '<div class="pd-status-banner">'
    + '<div class="pd-status-banner__icon" style="background:' + bg + ';color:' + c + '">' + svg('clock', 24) + '</div>'
    + '<div>'
    + '<h3>' + esc(statusLbl) + '</h3>'
    + '<p>' + esc(p.name) + ' is currently ' + esc(statusLbl.toLowerCase()) + '. We are actively designing and building the core functionality. '
    + 'If you would like to be informed when it launches or provide input into the product direction, please express your interest below. '
    + 'We do not imply that this product is currently available for purchase or deployment.</p>'
    + '</div>'
    + '</div></div>';

  // Gallery / preview mockup
  var galleryHtml = '<div class="pd-section">'
    + '<span class="pd-section__eyebrow">Visual Preview &amp; Gallery</span>'
    + '<h2 class="pd-section__title">A look at the concept</h2>'
    + '<p class="pd-section__sub">Explore interface mockups and conceptual dashboards. Click any preview to open full-screen high resolution zoom.</p>'
    + '<div class="pd-gallery">'
    + '<div class="pd-gallery__main" id="pd-gallery-main">' + renderScreenshot(c, primaryScreen) + '</div>'
    + '<div class="pd-gallery__caption" id="pd-gallery-caption" style="' + (primaryScreen.caption ? 'display:block;' : 'display:none;') + '">' + esc(primaryScreen.caption || '') + '</div>'
    + '<div class="pd-gallery__thumbs">'
    + screens.map(function(s, idx) {
        var thumbInner = (s.image || s.url)
          ? '<img src="' + esc(s.image || s.url) + '" alt="' + esc(s.label) + '" loading="lazy">'
          : screenshotFor(c, s.label, s.layout);
        return '<div class="pd-gallery__thumb" data-index="' + idx + '" data-layout="' + esc(s.layout) + '" data-label="' + esc(s.label) + '">'
          + thumbInner
          + '<span class="pd-gallery__cap">' + esc(s.label) + '</span>'
          + '</div>';
      }).join('')
    + '</div></div></div>';

  // Related products
  var relatedHtml = related.length ? '<div class="pd-related pd-content">'
    + '<span class="pd-section__eyebrow">Also in Development</span>'
    + '<h2 class="pd-section__title">Related products</h2>'
    + '<div class="pd-related__grid">'
    + related.map(function(r) {
        var rc = r.accent || '#4f46e5';
        var rbg = accentBg(rc);
        return '<div class="pc-card" style="--pc-accent:' + rc + '">'
          + '<div class="pc-card__top">'
          + '<div class="pc-card__icon" style="background:' + rbg + ';color:' + rc + '">' + svg('chart',22) + '</div>'
          + '<span class="pc-status pc-status--' + statusClass(r.status) + '"><span class="pc-status--dot"></span>' + esc(statusLabel(r.status)) + '</span>'
          + '</div>'
          + '<span class="pc-cat pc-card__cat">' + esc(r.category) + '</span>'
          + '<h3 class="pc-card__name">' + esc(r.name) + '</h3>'
          + '<p class="pc-card__tagline">' + esc(r.shortDescription) + '</p>'
          + '<div class="pc-card__footer">'
          + '<a href="product.html?id=' + encodeURIComponent(r.id) + '" class="pc-card__link" data-track-cta="learn_more" data-track-location="product_related" data-track-product="' + esc(r.id) + '">Learn More <span class="pc-card__link-arrow">→</span></a>'
          + '</div></div>';
      }).join('')
    + '</div></div>' : '';

  // CTA
  var ctaHtml = '<div class="pd-cta">'
    + '<div class="pd-cta__inner">'
    + '<span class="pd-cta__eyebrow">Request Information &amp; Walkthrough</span>'
    + '<h2 class="pd-cta__title">Interested in ' + esc(p.name) + '?</h2>'
    + '<p class="pd-cta__sub">Tell us about your workflows and requirements. Our team will arrange a focused walkthrough of what we are building.</p>'
    + '<a href="request-demo.html?product=' + encodeURIComponent(p.id) + '" class="pd-cta__btn" data-track-cta="request_demo" data-track-location="product_detail_footer" data-track-product="' + esc(p.id) + '">Request a Demo ' + svg('arrow',16) + '</a>'
    + '<a href="contact.html?type=product" class="pd-cta__secondary" data-track-cta="contact_general" data-track-location="product_detail_footer">Or send a general question</a>'
    + '</div></div>';

  return heroHtml
    + '<div class="pd-content">'
    + problemHtml
    + buildingHtml
    + featsHtml
    + audHtml
    + statusBannerHtml
    + galleryHtml
    + '</div>'
    + relatedHtml
    + ctaHtml;
}

/* ── Bootstrap ───────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', function() {
  initCatalog();
  initDetail();
});

