/**
 * softify — Interactive Product Comparison & Feature Matrix Engine
 * Phase 19: Product Comparison & Interactive Feature Matrix
 */

(function () {
  'use strict';

  // --- State ---
  let allProducts = [];
  let matrixSchema = [];
  let selectedIds = ['hotel-management-system', 'healthcare-pro', 'financeflow'];
  let highlightDiffs = false;
  let searchQuery = '';

  // --- DOM Elements ---
  const matrixTable = document.getElementById('cmp-matrix-table');
  const matrixThead = document.getElementById('cmp-matrix-thead');
  const matrixTbody = document.getElementById('cmp-matrix-tbody');
  const productChipsContainer = document.getElementById('cmp-product-chips');
  const addProductDropdownWrap = document.getElementById('cmp-add-dropdown-wrap');
  const addProductBtn = document.getElementById('cmp-btn-add-product');
  const addProductMenu = document.getElementById('cmp-dropdown-menu');
  const diffToggle = document.getElementById('cmp-diff-toggle');
  const searchInput = document.getElementById('cmp-search-input');
  const btnExportCsv = document.getElementById('cmp-btn-export-csv');
  const btnPrint = document.getElementById('cmp-btn-print');
  const presetsContainer = document.getElementById('cmp-presets-container');
  const ctaDemoBtn = document.getElementById('cmp-cta-demo-btn');

  // --- Presets Definition ---
  const PRESETS = [
    { id: 'all', label: 'All Products (5)', ids: ['hotel-management-system', 'healthcare-pro', 'financeflow', 'makersuite', 'retailoptix'] },
    { id: 'core3', label: 'Core Suite (3)', ids: ['hotel-management-system', 'healthcare-pro', 'financeflow'] },
    { id: 'service', label: 'Hospitality vs Healthcare', ids: ['hotel-management-system', 'healthcare-pro'] },
    { id: 'ops', label: 'Finance vs Manufacturing', ids: ['financeflow', 'makersuite'] },
    { id: 'commerce', label: 'Retail vs Logistics', ids: ['retailoptix', 'makersuite'] }
  ];

  // --- API & Boot ---
  async function init() {
    setupEventListeners();
    await loadComparisonData();
    parseUrlParams();
    renderAll();
  }

  async function loadComparisonData() {
    try {
      const res = await fetch('/api/products/compare');
      const data = await res.json();
      if (data.success) {
        allProducts = data.products || [];
        matrixSchema = data.schema || [];
      }
    } catch (err) {
      console.error('Failed to load comparison data:', err);
    }
  }

  function parseUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const prodParam = params.get('products') || params.get('ids') || params.get('p');
    if (prodParam) {
      const ids = prodParam.split(',').map(s => s.trim()).filter(id => allProducts.some(p => p.id === id));
      if (ids.length >= 1) {
        selectedIds = ids;
      }
    }
    if (params.get('diffs') === '1' || params.get('highlight') === '1') {
      highlightDiffs = true;
      if (diffToggle) diffToggle.checked = true;
    }
  }

  function syncUrl() {
    const params = new URLSearchParams(window.location.search);
    params.set('products', selectedIds.join(','));
    if (highlightDiffs) {
      params.set('diffs', '1');
    } else {
      params.delete('diffs');
    }
    const newUrl = window.location.pathname + '?' + params.toString();
    window.history.replaceState({}, '', newUrl);

    // Update CTA button link
    if (ctaDemoBtn) {
      const primarySelected = selectedIds[0] || 'hotel-management-system';
      ctaDemoBtn.href = `request-demo.html?product=${encodeURIComponent(primarySelected)}`;
    }
  }

  // --- Render Functions ---
  function renderAll() {
    renderPresets();
    renderProductChips();
    renderAddDropdown();
    renderMatrix();
    syncUrl();
  }

  function renderPresets() {
    if (!presetsContainer) return;
    presetsContainer.innerHTML = '';

    const label = document.createElement('span');
    label.className = 'cmp-preset-label';
    label.textContent = 'Quick Views:';
    presetsContainer.appendChild(label);

    PRESETS.forEach(preset => {
      const btn = document.createElement('button');
      btn.className = 'cmp-preset-btn';
      btn.textContent = preset.label;

      const isCurrent = preset.ids.length === selectedIds.length &&
        preset.ids.every(id => selectedIds.includes(id));
      if (isCurrent) btn.classList.add('active');

      btn.addEventListener('click', () => {
        selectedIds = [...preset.ids];
        renderAll();
      });
      presetsContainer.appendChild(btn);
    });
  }

  function renderProductChips() {
    if (!productChipsContainer) return;
    productChipsContainer.innerHTML = '';

    const currentProds = allProducts.filter(p => selectedIds.includes(p.id));

    currentProds.forEach(prod => {
      const chip = document.createElement('div');
      chip.className = 'cmp-chip';

      const dot = document.createElement('span');
      dot.className = 'cmp-chip-dot';
      if (prod.accent) dot.style.background = prod.accent;

      const name = document.createElement('span');
      name.textContent = prod.name;

      const removeBtn = document.createElement('button');
      removeBtn.className = 'cmp-chip-remove';
      removeBtn.innerHTML = '&times;';
      removeBtn.title = `Remove ${prod.name}`;
      removeBtn.setAttribute('aria-label', `Remove ${prod.name}`);

      if (selectedIds.length <= 1) {
        removeBtn.style.opacity = '0.3';
        removeBtn.style.cursor = 'not-allowed';
      } else {
        removeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          selectedIds = selectedIds.filter(id => id !== prod.id);
          renderAll();
        });
      }

      chip.appendChild(dot);
      chip.appendChild(name);
      chip.appendChild(removeBtn);
      productChipsContainer.appendChild(chip);
    });
  }

  function renderAddDropdown() {
    if (!addProductMenu) return;
    addProductMenu.innerHTML = '';

    const availableProds = allProducts;
    availableProds.forEach(prod => {
      const isSelected = selectedIds.includes(prod.id);
      const item = document.createElement('button');
      item.className = 'cmp-dropdown-item' + (isSelected ? ' is-selected' : '');
      item.innerHTML = `
        <span>${prod.name} <small style="color:#64748b;font-size:0.75rem;">(${prod.category})</small></span>
        ${isSelected ? '<span style="color:#10b981;font-weight:700;">✓</span>' : '<span style="color:#4f46e5;font-weight:700;">+</span>'}
      `;

      item.addEventListener('click', () => {
        if (!isSelected) {
          selectedIds.push(prod.id);
          if (addProductMenu) addProductMenu.classList.remove('is-open');
          renderAll();
        } else if (selectedIds.length > 1) {
          selectedIds = selectedIds.filter(id => id !== prod.id);
          if (addProductMenu) addProductMenu.classList.remove('is-open');
          renderAll();
        }
      });

      addProductMenu.appendChild(item);
    });
  }

  function renderMatrix() {
    if (!matrixThead || !matrixTbody) return;

    const currentProds = allProducts.filter(p => selectedIds.includes(p.id));

    // 1. Render Table Headers
    let theadHtml = `
      <tr class="cmp-thead-sticky">
        <th class="cmp-th-features">
          <div class="cmp-th-features-content">
            <span class="cmp-th-title">Capabilities & Features</span>
            <span class="cmp-th-count">Comparing ${currentProds.length} of ${allProducts.length} Systems</span>
          </div>
        </th>
    `;

    currentProds.forEach(prod => {
      const accent = prod.accent || '#4f46e5';
      theadHtml += `
        <th class="cmp-th-product" data-prod-id="${prod.id}">
          <div class="cmp-prod-card-header">
            <span class="cmp-prod-category-badge" style="background:${accent}18; color:${accent};">${prod.category}</span>
            <h3 class="cmp-prod-name">
              <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${accent};"></span>
              ${prod.name}
            </h3>
            <p class="cmp-prod-tagline">${prod.tagline || ''}</p>
            <div class="cmp-prod-actions">
              <a href="request-demo.html?product=${encodeURIComponent(prod.id)}" class="cmp-btn-prod-demo">Request Demo</a>
              <a href="product.html?id=${encodeURIComponent(prod.id)}" class="cmp-btn-prod-view" title="View Full Specs">Specs &rarr;</a>
            </div>
          </div>
        </th>
      `;
    });

    theadHtml += '</tr>';
    matrixThead.innerHTML = theadHtml;

    // 2. Render Table Body
    let tbodyHtml = '';
    const q = searchQuery.toLowerCase().trim();
    let totalVisibleRows = 0;

    matrixSchema.forEach(section => {
      // Filter features in section if search query exists
      const filteredFeatures = section.features.filter(feat => {
        if (!q) return true;
        const inLabel = feat.label.toLowerCase().includes(q);
        const inValues = currentProds.some(p => {
          const val = getProductMatrixValue(p, section.id, feat.key);
          return String(val).toLowerCase().includes(q);
        });
        return inLabel || inValues;
      });

      if (filteredFeatures.length === 0) return;

      // Category Header Row
      tbodyHtml += `
        <tr class="cmp-category-header-row" data-category-id="${section.id}">
          <td colspan="${currentProds.length + 1}">
            <div class="cmp-category-title-wrap">
              <div class="cmp-category-icon-title">
                <span class="cmp-category-icon">✦</span>
                <span>${section.title}</span>
              </div>
            </div>
            <div class="cmp-category-desc">${section.description}</div>
          </td>
        </tr>
      `;

      // Feature Rows
      filteredFeatures.forEach(feat => {
        totalVisibleRows++;
        const rawValues = currentProds.map(p => getProductMatrixValue(p, section.id, feat.key));
        const isIdentical = rawValues.every(v => JSON.stringify(v) === JSON.stringify(rawValues[0]));

        tbodyHtml += `
          <tr class="cmp-feature-row ${isIdentical ? 'is-identical' : 'is-different'}" data-feature-key="${feat.key}">
            <td class="cmp-feature-label-cell">
              <div class="cmp-feature-label-wrap">
                <span>${feat.label}</span>
              </div>
            </td>
        `;

        currentProds.forEach(p => {
          const val = getProductMatrixValue(p, section.id, feat.key);
          tbodyHtml += `
            <td class="cmp-feature-value-cell" data-prod-id="${p.id}">
              ${formatFeatureCell(val, feat.type)}
            </td>
          `;
        });

        tbodyHtml += '</tr>';
      });
    });

    if (totalVisibleRows === 0) {
      tbodyHtml = `
        <tr>
          <td colspan="${currentProds.length + 1}">
            <div class="cmp-matrix-empty">
              <div class="cmp-matrix-empty-icon">🔍</div>
              <h3>No matching capabilities found</h3>
              <p>Try searching for a different keyword or clear the search filter.</p>
            </div>
          </td>
        </tr>
      `;
    }

    matrixTbody.innerHTML = tbodyHtml;
    updateDiffClass();
  }

  function getProductMatrixValue(product, sectionId, featureKey) {
    if (!product.matrix || !product.matrix[sectionId]) return '—';
    const val = product.matrix[sectionId][featureKey];
    if (val === undefined || val === null) return '—';
    return val;
  }

  function formatFeatureCell(val, type) {
    if (val === true || val === 'true') {
      return `<span class="cmp-val-boolean is-true"><span class="cmp-icon-check">✓</span> Included</span>`;
    }
    if (val === false || val === 'false') {
      return `<span class="cmp-val-boolean is-false"><span class="cmp-icon-dash">—</span> Not available</span>`;
    }
    if (val === '—' || !val) {
      return `<span class="cmp-icon-dash">—</span>`;
    }
    // String or object values
    return `<span class="cmp-val-pill">${escapeHtml(String(val))}</span>`;
  }

  function updateDiffClass() {
    if (!matrixTable) return;
    if (highlightDiffs) {
      matrixTable.classList.add('highlight-diffs');
    } else {
      matrixTable.classList.remove('highlight-diffs');
    }
  }

  function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // --- Export CSV ---
  function exportComparisonCsv() {
    const currentProds = allProducts.filter(p => selectedIds.includes(p.id));
    if (currentProds.length === 0) return;

    const escapeCsv = str => `"${String(str || '').replace(/"/g, '""')}"`;

    let csv = ['Capability Category,Feature Name,' + currentProds.map(p => escapeCsv(p.name)).join(',')];

    matrixSchema.forEach(section => {
      section.features.forEach(feat => {
        const row = [
          escapeCsv(section.title),
          escapeCsv(feat.label),
          ...currentProds.map(p => {
            const v = getProductMatrixValue(p, section.id, feat.key);
            if (v === true) return '"Yes (Included)"';
            if (v === false) return '"No"';
            return escapeCsv(v);
          })
        ];
        csv.push(row.join(','));
      });
    });

    const blob = new Blob([csv.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `softify-product-comparison-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // --- Event Listeners ---
  function setupEventListeners() {
    if (addProductBtn && addProductMenu) {
      addProductBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        addProductMenu.classList.toggle('is-open');
      });

      document.addEventListener('click', (e) => {
        if (!addProductDropdownWrap.contains(e.target)) {
          addProductMenu.classList.remove('is-open');
        }
      });
    }

    if (diffToggle) {
      diffToggle.addEventListener('change', () => {
        highlightDiffs = diffToggle.checked;
        updateDiffClass();
        syncUrl();
      });
    }

    if (searchInput) {
      searchInput.addEventListener('input', () => {
        searchQuery = searchInput.value;
        renderMatrix();
      });
    }

    if (btnExportCsv) {
      btnExportCsv.addEventListener('click', exportComparisonCsv);
    }

    if (btnPrint) {
      btnPrint.addEventListener('click', () => window.print());
    }
  }

  // Start on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
