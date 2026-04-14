'use strict';

// ─── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  setFooterYear();
  initMobileNav();
  initPillBar();
  initAnnouncement();
  initCarouselDots();
  initSidebarToggle();
  initSearch();
  initSidebarClear();
  initSortDropdown();
  initListingCardLinks();
  initGalleryThumbs();
  initItemPage();
  initPostListingForm();
  initSearchAutocomplete();
  initPageTransitions();
  initBackToTop();
  initScrollReveal();
  initHeroCounter();
  initSellerCopy();
  initTradeModal();
  initItemWatchlist();
  initListingCardHearts();
  initWatchlistPage();
  initFetchListings();
});

// ─── Footer year ──────────────────────────────────────────────────────────────
function setFooterYear() {
  const el = document.getElementById('year');
  if (el) el.textContent = new Date().getFullYear();
}

// ─── Mobile nav drawer ────────────────────────────────────────────────────────
function initMobileNav() {
  const toggle = document.getElementById('navbar-hamburger');
  const drawer = document.getElementById('mobile-drawer');
  if (!toggle || !drawer) return;

  toggle.addEventListener('click', () => {
    const isOpen = drawer.classList.toggle('is-open');
    toggle.classList.toggle('is-open', isOpen);
    toggle.setAttribute('aria-expanded', String(isOpen));
  });

  drawer.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      drawer.classList.remove('is-open');
      toggle.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
}

// ─── Category pill bar ────────────────────────────────────────────────────────
function initPillBar() {
  const pills = document.querySelectorAll('.pill-bar .pill');
  if (!pills.length) return;

  // On pages without a listing grid, clicking a pill redirects to listings.html
  const isListingsPage = !!document.getElementById('listing-grid');

  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      pills.forEach(p => p.classList.remove('pill--active'));
      pill.classList.add('pill--active');

      // Scroll the active pill into view (centres it on mobile)
      pill.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });

      const filter = pill.dataset.filter;

      if (!isListingsPage) {
        // Redirect to listings.html with the filter pre-applied
        if (filter === 'all') {
          window.location.href = 'listings.html';
        } else {
          window.location.href = `listings.html?filter=${filter}`;
        }
        return;
      }

      // listings.html — sync with sidebar category checkboxes
      const catBoxes = document.querySelectorAll('.listings-sidebar input[name="category"]');
      if (!catBoxes.length) return;

      if (filter === 'all') {
        catBoxes.forEach(cb => { cb.checked = false; });
      } else {
        catBoxes.forEach(cb => { cb.checked = cb.value === filter; });
      }
      applyListingFilters();
    });
  });
}

// ─── Announcement banner dismiss ─────────────────────────────────────────────
function initAnnouncement() {
  const banner = document.getElementById('announcement');
  const closeBtn = document.getElementById('announcement-close');
  if (!banner || !closeBtn) return;

  closeBtn.addEventListener('click', () => {
    banner.classList.add('is-dismissed');
    // Persist dismissal for the session
    sessionStorage.setItem('announcement-dismissed', '1');
  });

  // Restore dismissed state on page reload
  if (sessionStorage.getItem('announcement-dismissed') === '1') {
    banner.classList.add('is-dismissed');
  }
}

// ─── Hero carousel ────────────────────────────────────────────────────────────
function initCarouselDots() {
  const carousel = document.querySelector('.hero-carousel');
  if (!carousel) return;

  const slides = Array.from(carousel.querySelectorAll('.carousel__slide'));
  const dots   = Array.from(carousel.querySelectorAll('.carousel__dot'));
  if (!slides.length || !dots.length) return;

  let current = 0;
  let timer;

  function goTo(index) {
    // Deactivate current
    slides[current].classList.remove('carousel__slide--active');
    dots[current].classList.remove('carousel__dot--active');
    dots[current].setAttribute('aria-selected', 'false');

    current = index;

    // Activate new
    slides[current].classList.add('carousel__slide--active');
    dots[current].classList.add('carousel__dot--active');
    dots[current].setAttribute('aria-selected', 'true');
  }

  function advance() {
    goTo((current + 1) % slides.length);
  }

  function startTimer() {
    clearInterval(timer);
    timer = setInterval(advance, 5000);
  }

  // Dot click
  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      goTo(parseInt(dot.dataset.index, 10));
      startTimer();
    });
  });

  // Arrow buttons
  const prevBtn = carousel.querySelector('.carousel__arrow--prev');
  const nextBtn = carousel.querySelector('.carousel__arrow--next');
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      goTo((current - 1 + slides.length) % slides.length);
      startTimer();
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      goTo((current + 1) % slides.length);
      startTimer();
    });
  }

  // Pause auto-advance while hovering
  carousel.addEventListener('mouseenter', () => clearInterval(timer));
  carousel.addEventListener('mouseleave', startTimer);

  startTimer();
}

// ─── Listings sidebar: mobile toggle ─────────────────────────────────────────
// Injects a "Filters" toggle button above the grid on mobile and wires it up.
function initSidebarToggle() {
  const sidebar = document.getElementById('listings-sidebar');
  const layout  = document.querySelector('.listings-layout');
  if (!sidebar || !layout) return;

  // Create toggle button and insert before the listings-main div
  const toggle = document.createElement('button');
  toggle.className = 'filters-toggle';
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-controls', 'listings-sidebar');
  toggle.innerHTML = '⚙️ Filters';

  const main = document.querySelector('.listings-main');
  if (main) layout.insertBefore(toggle, main);

  toggle.addEventListener('click', () => {
    const isOpen = sidebar.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(isOpen));
    toggle.innerHTML = isOpen ? '✕ Hide Filters' : '⚙️ Filters';
  });
}

// ─── Listings sidebar: filter engine ─────────────────────────────────────────
// Shared filter function — called by checkboxes, Apply button, Clear, and pills.
function applyListingFilters() {
  const cards = document.querySelectorAll('#listing-grid .listing-card');
  if (!cards.length) return;

  const checkedCats = Array.from(
    document.querySelectorAll('.listings-sidebar input[name="category"]:checked')
  ).map(cb => cb.value);

  const checkedRarities = Array.from(
    document.querySelectorAll('.listings-sidebar input[name="rarity"]:checked')
  ).map(cb => cb.value);

  // Read current search query from the navbar search input
  const searchInput = document.querySelector('.navbar__search .search-form__input');
  const query = searchInput ? searchInput.value.trim().toLowerCase() : '';

  let visible = 0;
  cards.forEach(card => {
    const catMatch    = !checkedCats.length    || checkedCats.includes(card.dataset.category);
    const rarityMatch = !checkedRarities.length || checkedRarities.includes(card.dataset.rarity);
    const nameEl      = card.querySelector('.listing-card__name');
    const name        = nameEl ? nameEl.textContent.trim().toLowerCase() : '';
    const nameMatch   = !query || name.includes(query);
    const show = catMatch && rarityMatch && nameMatch;
    card.style.display = show ? '' : 'none';
    if (show) visible++;
  });

  // Update "Showing X listings" count
  const countEl = document.querySelector('.listings-topbar__count strong');
  if (countEl) countEl.textContent = visible;

  // Show / hide empty state
  const emptyState = document.getElementById('listing-empty');
  if (emptyState) emptyState.hidden = visible > 0;
}

// ─── Listings sort dropdown ───────────────────────────────────────────────────
function initSortDropdown() {
  const select = document.getElementById('sort-select');
  const grid   = document.getElementById('listing-grid');
  if (!select || !grid) return;

  // Capture original DOM order once
  const originalOrder = Array.from(grid.querySelectorAll('.listing-card'));

  // Extract numeric Beli price from a card; returns Infinity for "Make Offer"
  function getPrice(card) {
    const priceEl = card.querySelector('.listing-card__price');
    if (!priceEl) return Infinity;
    const digits = priceEl.textContent.replace(/[^0-9]/g, '');
    const n = parseInt(digits, 10);
    return isNaN(n) ? Infinity : n;
  }

  function applySort(order) {
    if (order === 'newest') {
      originalOrder.forEach(card => grid.appendChild(card));
    } else {
      const cards = Array.from(grid.querySelectorAll('.listing-card'));

      cards.sort((a, b) => {
        if (order === 'most-traded') {
          const na = a.querySelector('.listing-card__name').textContent.trim().toLowerCase();
          const nb = b.querySelector('.listing-card__name').textContent.trim().toLowerCase();
          return na.localeCompare(nb);
        }

        const pa = getPrice(a);
        const pb = getPrice(b);
        // Make Offer cards always go to the end regardless of direction
        if (pa === Infinity && pb === Infinity) return 0;
        if (pa === Infinity) return 1;
        if (pb === Infinity) return -1;
        return order === 'price-asc' ? pa - pb : pb - pa;
      });

      cards.forEach(card => grid.appendChild(card));
    }

    // Re-apply filters so display states and count stay correct after re-ordering
    applyListingFilters();
  }

  select.addEventListener('change', () => applySort(select.value));
}

// ─── Search ───────────────────────────────────────────────────────────────────
function initSearch() {
  const isListingsPage = !!document.getElementById('listing-grid');

  if (isListingsPage) {
    // Pre-fill from ?search= URL parameter before the first filter run
    const params      = new URLSearchParams(window.location.search);
    const paramQuery  = params.get('search');
    const allInputs   = document.querySelectorAll('.search-form__input');

    if (paramQuery) {
      allInputs.forEach(inp => { inp.value = paramQuery; });
    }

    // Real-time filtering as the user types
    allInputs.forEach(inp => {
      inp.addEventListener('input', applyListingFilters);
    });

    // Prevent navbar/drawer search forms from doing a full page submit
    document.querySelectorAll('.search-form').forEach(form => {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        applyListingFilters();
      });
    });
  } else {
    // On all other pages: submit redirects to listings.html?search=…
    document.querySelectorAll('.search-form').forEach(form => {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const inp   = form.querySelector('.search-form__input');
        const query = inp ? inp.value.trim() : '';
        window.location.href = query
          ? `listings.html?search=${encodeURIComponent(query)}`
          : 'listings.html';
      });
    });
  }
}

// ─── Listings sidebar: clear all checkboxes ───────────────────────────────────
function initSidebarClear() {
  const clearBtn  = document.getElementById('sidebar-clear');
  const applyBtn  = document.querySelector('.btn--apply-filters');
  const sidebar   = document.getElementById('listings-sidebar');
  if (!sidebar) return;

  // Wire every checkbox to filter in real time
  sidebar.querySelectorAll('input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', applyListingFilters);
  });

  // Apply Filters button
  if (applyBtn) applyBtn.addEventListener('click', applyListingFilters);

  // Clear All button (sidebar) + empty-state Clear Filters button
  function clearAll() {
    sidebar.querySelectorAll('input[type="checkbox"]').forEach(cb => { cb.checked = false; });
    applyListingFilters();
  }
  if (clearBtn) clearBtn.addEventListener('click', clearAll);

  const emptyClearBtn = document.getElementById('listing-empty-clear');
  if (emptyClearBtn) emptyClearBtn.addEventListener('click', clearAll);

  // Apply ?filter= URL param from pill-bar redirect (e.g. listings.html?filter=fruit)
  const filterParam = new URLSearchParams(window.location.search).get('filter');
  if (filterParam) {
    sidebar.querySelectorAll('input[name="category"]').forEach(cb => {
      cb.checked = cb.value === filterParam;
    });
    // Sync the matching pill to active state
    document.querySelectorAll('.pill-bar .pill').forEach(pill => {
      pill.classList.toggle('pill--active', pill.dataset.filter === filterParam);
    });
  }

  // Run once on load to respect any pre-checked state in the HTML
  applyListingFilters();
}

// ─── Listing card names → item.html ──────────────────────────────────────────
// Wraps each .listing-card__name in an anchor. Uses the parent card's
// data-item-id to build the correct ?id= URL; falls back to item.html.
function initListingCardLinks() {
  document.querySelectorAll('.listing-card__name').forEach(el => {
    const card   = el.closest('[data-item-id]');
    const itemId = card ? card.dataset.itemId : null;
    const href   = itemId ? `item.html?id=${itemId}` : 'item.html';

    const link = document.createElement('a');
    link.href      = href;
    link.textContent = el.textContent;
    el.textContent = '';
    el.appendChild(link);
  });
}

// ─── Item page: load data from ?id= URL parameter ────────────────────────────
function initItemPage() {
  // Only runs on pages that have the item layout
  if (!document.getElementById('item-name-heading')) return;
  if (typeof ITEMS_DATA === 'undefined') return;

  const params = new URLSearchParams(window.location.search);
  const id     = params.get('id') || 'gravity-fruit';
  const item   = ITEMS_DATA[id];
  if (!item) return;

  // Page title
  document.title = `${item.name} — RellMarket`;

  // Breadcrumb
  const crumb = document.getElementById('item-breadcrumb-name');
  if (crumb) crumb.textContent = item.name;

  // Main image
  const mainImg = document.getElementById('gallery-main-img');
  if (mainImg) { mainImg.src = item.image; mainImg.alt = item.name; }

  // Thumbnails
  document.querySelectorAll('.item-gallery__thumb').forEach(t => {
    t.dataset.src = item.image;
  });
  document.querySelectorAll('.item-gallery__thumb-img').forEach(img => {
    img.src = item.image;
  });

  // Rarity badge
  const badge = document.getElementById('item-rarity-badge');
  if (badge) {
    badge.textContent = item.rarity;
    badge.className   = `item-gallery__badge listing-badge listing-badge--${item.rarityClass}`;
  }

  // Type + name
  const typeLabel = document.getElementById('item-type-label');
  if (typeLabel) typeLabel.textContent = `${item.category} · ${item.type}`;

  const nameHeading = document.getElementById('item-name-heading');
  if (nameHeading) nameHeading.textContent = item.name;

  // Rating
  const ratingScore = document.getElementById('item-rating-score');
  if (ratingScore) ratingScore.textContent = item.rating;

  const ratingCount = document.getElementById('item-rating-count');
  if (ratingCount) ratingCount.textContent = `(${item.reviewCount} reviews)`;

  // Description
  const desc = document.getElementById('item-description');
  if (desc) desc.textContent = item.description;

  // Seller
  const sellerName = document.getElementById('item-seller-name');
  if (sellerName) sellerName.textContent = item.seller;

  // Price
  const priceLabel = document.getElementById('item-price-label');
  if (priceLabel) priceLabel.textContent = item.price;

  const priceSub = document.getElementById('item-price-sub');
  if (priceSub) priceSub.textContent = item.priceSub;

  // Stats
  const statRarity = document.getElementById('item-stat-rarity');
  if (statRarity) {
    statRarity.textContent = item.rarity;
    statRarity.className   = `item-stats__value${item.rarityClass === 'legendary' ? ' item-stats__value--legendary' : ''}`;
  }

  const statType = document.getElementById('item-stat-type');
  if (statType) statType.textContent = item.type;

  // Similar items grid — show up to 4 other items from ITEMS_DATA, excluding current
  const similarGrid = document.querySelector('.similar-grid');
  if (similarGrid) {
    const others = Object.values(ITEMS_DATA).filter(i => i.id !== id).slice(0, 4);
    similarGrid.innerHTML = others.map(i => `
      <article class="mini-card">
        <a href="item.html?id=${i.id}" class="mini-card__img-wrap" tabindex="-1" aria-hidden="true">
          <img src="${i.image}" alt="${i.name}" class="mini-card__img" />
        </a>
        <div class="mini-card__body">
          <a href="item.html?id=${i.id}" class="mini-card__name">${i.name}</a>
          <a href="item.html?id=${i.id}" class="btn btn--mini-trade">Trade</a>
        </div>
      </article>`).join('');
  }
}

// ─── Item page: gallery thumbnail switcher ────────────────────────────────────
function initGalleryThumbs() {
  const mainImg = document.getElementById('gallery-main-img');
  const thumbs  = document.querySelectorAll('.item-gallery__thumb');
  if (!mainImg || !thumbs.length) return;

  thumbs.forEach(thumb => {
    thumb.addEventListener('click', () => {
      if (mainImg.classList.contains('is-fading')) return;
      thumbs.forEach(t => t.classList.remove('item-gallery__thumb--active'));
      thumb.classList.add('item-gallery__thumb--active');
      mainImg.classList.add('is-fading');
      setTimeout(() => {
        mainImg.src = thumb.dataset.src;
        mainImg.classList.remove('is-fading');
      }, 180);
    });
  });
}

// ─── Post Listing: live preview + image upload ────────────────────────────────
function initPostListingForm() {
  const form = document.getElementById('post-form');
  if (!form) return;

  // Field refs
  const fieldItem     = document.getElementById('field-item');
  const fieldQty      = document.getElementById('field-qty');
  const fieldCategory = document.getElementById('field-category');
  const fieldRarity   = document.getElementById('field-rarity');
  const fieldType     = document.getElementById('field-type');
  const fieldDesc     = document.getElementById('field-desc');
  const fieldPrice    = document.getElementById('field-price');
  const priceRadios   = form.querySelectorAll('input[name="price-type"]');
  const beliWrap      = document.getElementById('beli-input-wrap');
  const fruitTypeGrp  = document.getElementById('fruit-type-group');
  const descCount     = document.getElementById('desc-count');

  // Preview refs
  const previewName   = document.getElementById('preview-name');
  const previewType   = document.getElementById('preview-type');
  const previewBadge  = document.getElementById('preview-badge');
  const previewPrice  = document.getElementById('preview-price');
  const previewImgBox = document.getElementById('preview-img-box');
  const previewImg    = document.getElementById('preview-img');

  // Category label map
  const categoryLabels = {
    fruit: 'Devil Fruit', armor: 'Armor', weapon: 'Weapon',
    beli: 'Beli', sword: 'Sword', item: 'Item', service: 'Service',
  };

  // Rarity badge-class map
  const rarityClasses = {
    legendary: 'listing-badge--legendary',
    rare:      'listing-badge--rare',
    uncommon:  'listing-badge--uncommon',
    common:    'listing-badge--common',
  };

  // Preset data for non-ITEMS_DATA known items
  const PRESET_ITEMS = {
    'admiral-coat':      { name: 'Admiral Coat',       category: 'armor', rarity: 'rare',     rarityClass: 'rare',     type: '', image: '' },
    'warlords-plate':    { name: "Warlord's Plate",     category: 'armor', rarity: 'uncommon', rarityClass: 'uncommon', type: '', image: '' },
    'marine-captain-set':{ name: 'Marine Captain Set',  category: 'armor', rarity: 'uncommon', rarityClass: 'uncommon', type: '', image: '' },
    'beli-1000000':      { name: '1,000,000 Beli',      category: 'beli',  rarity: '',         rarityClass: '',         type: '', image: '' },
    'beli-500000':       { name: '500,000 Beli',        category: 'beli',  rarity: '',         rarityClass: '',         type: '', image: '' },
    'beli-250000':       { name: '250,000 Beli',        category: 'beli',  rarity: '',         rarityClass: '',         type: '', image: '' },
  };

  // ── Select value helper ──
  function setSelectValue(selectEl, value) {
    selectEl.value = value;
  }

  // Maps ITEMS_DATA values → select option values
  const categoryMap = { 'Devil Fruit': 'fruit' };
  const rarityMap   = { 'Legendary': 'legendary', 'Rare': 'rare', 'Uncommon': 'uncommon', 'Common': 'common' };

  // ── Auto-fill from known item ──
  function applyItemData(data) {
    const catVal    = categoryMap[data.category]  || data.category  || '';
    const rarityVal = rarityMap[data.rarity]      || data.rarity    || '';
    const typeVal   = data.type || '';

    setSelectValue(fieldCategory, catVal);
    setSelectValue(fieldRarity,   rarityVal);
    setSelectValue(fieldType,     typeVal);

    // Show/hide fruit type group immediately based on auto-filled category
    fruitTypeGrp.style.display = catVal === 'fruit' ? '' : 'none';

    // Set preview image from ITEMS_DATA if available
    if (data.image) {
      previewImg.src = data.image;
      previewImgBox.classList.add('has-image');
    } else {
      previewImg.src = '';
      previewImgBox.classList.remove('has-image');
    }
  }

  // ── Clear auto-filled fields (for "other") ──
  function clearAutoFill() {
    setSelectValue(fieldCategory, '');
    setSelectValue(fieldRarity,   '');
    setSelectValue(fieldType,     '');
    previewImg.src = '';
    previewImgBox.classList.remove('has-image');
  }

  // ── Item selector change ──
  fieldItem.addEventListener('change', () => {
    const val = fieldItem.value;
    if (!val || val === 'other') {
      clearAutoFill();
    } else {
      // Check ITEMS_DATA first (fruits), then PRESET_ITEMS
      const data = (typeof ITEMS_DATA !== 'undefined' && ITEMS_DATA[val])
        ? ITEMS_DATA[val]
        : PRESET_ITEMS[val];
      if (data) applyItemData(data);
    }
    updatePreview();
  });

  function updatePreview() {
    // Name — use selected option text, apply qty suffix if > 1
    const itemVal  = fieldItem.value;
    const itemText = itemVal && itemVal !== 'other'
      ? fieldItem.options[fieldItem.selectedIndex].text
      : 'Item Name';
    const qty = parseInt(fieldQty.value, 10) || 1;
    previewName.textContent = qty > 1 ? `${itemText} x${qty}` : itemText;

    // Type label
    const catVal  = fieldCategory.value;
    const catText = categoryLabels[catVal] || 'Category';
    const typeVal = (catVal === 'fruit' && fieldType.value) ? fieldType.value : '';
    previewType.textContent = typeVal ? `${catText} · ${typeVal}` : catText;

    // Fruit type group visibility
    fruitTypeGrp.style.display = catVal === 'fruit' ? '' : 'none';

    // Rarity badge
    const rarityVal = fieldRarity.value;
    if (rarityVal) {
      previewBadge.textContent = fieldRarity.options[fieldRarity.selectedIndex].text;
      previewBadge.className   = `listing-badge ${rarityClasses[rarityVal] || ''}`;
    } else {
      previewBadge.textContent = '';
      previewBadge.className   = 'listing-badge';
    }

    // Price
    const priceType = form.querySelector('input[name="price-type"]:checked').value;
    if (priceType === 'offer') {
      previewPrice.textContent = 'Make Offer';
      previewPrice.className   = 'listing-card__price listing-card__price--offer';
    } else {
      const amount = fieldPrice.value ? Number(fieldPrice.value).toLocaleString() + ' Beli' : '— Beli';
      previewPrice.textContent = amount;
      previewPrice.className   = 'listing-card__price';
    }
  }

  // Show/hide Beli input based on radio selection
  priceRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      beliWrap.classList.toggle('is-visible', radio.value === 'fixed' && radio.checked);
      updatePreview();
    });
  });

  // Description character counter
  fieldDesc.addEventListener('input', () => {
    descCount.textContent = fieldDesc.value.length;
  });

  // Live preview on field changes
  [fieldQty, fieldCategory, fieldRarity, fieldType, fieldPrice].forEach(el => {
    el.addEventListener('input', updatePreview);
    el.addEventListener('change', updatePreview);
  });

  // ── Form validation ──
  function showFieldError(el, message) {
    el.classList.add('form-input--error');
    let errEl = el.parentElement.querySelector('.form-error');
    if (!errEl) {
      errEl = document.createElement('p');
      errEl.className = 'form-error';
      el.after(errEl);
    }
    errEl.textContent = message;
  }

  function clearFieldError(el) {
    el.classList.remove('form-input--error');
    const errEl = el.parentElement.querySelector('.form-error');
    if (errEl) errEl.remove();
  }

  // Clear errors on interaction
  [fieldItem, fieldCategory, fieldPrice].forEach(el => {
    el.addEventListener('change', () => clearFieldError(el));
    el.addEventListener('input',  () => clearFieldError(el));
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    let valid = true;

    if (!fieldItem.value) {
      showFieldError(fieldItem, 'Please select an item.');
      valid = false;
    } else {
      clearFieldError(fieldItem);
    }

    if (!fieldCategory.value) {
      showFieldError(fieldCategory, 'Please select a category.');
      valid = false;
    } else {
      clearFieldError(fieldCategory);
    }

    const priceType = form.querySelector('input[name="price-type"]:checked').value;
    if (priceType === 'fixed' && !fieldPrice.value) {
      showFieldError(fieldPrice, 'Please enter a price.');
      valid = false;
    } else {
      clearFieldError(fieldPrice);
    }

    if (!valid) return;

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Posting…';

    try {
      // Get session token if Supabase is available
      let token = null;
      if (typeof supabaseClient !== 'undefined') {
        const { data: { session } } = await supabaseClient.auth.getSession();
        token = session?.access_token || null;
      }

      const itemText = fieldItem.value && fieldItem.value !== 'other'
        ? fieldItem.options[fieldItem.selectedIndex].text
        : '';

      const payload = {
        item_name:   itemText,
        category:    fieldCategory.value,
        rarity:      fieldRarity.value || null,
        fruit_type:  fieldType.value   || null,
        price:       fieldPrice.value  ? Number(fieldPrice.value) : null,
        price_type:  priceType,
        description: fieldDesc.value   || null,
        image_url:   (typeof ITEMS_DATA !== 'undefined' && ITEMS_DATA[fieldItem.value]?.image) || null,
      };

      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/listings/create', {
        method:  'POST',
        headers,
        body:    JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to post listing');

      showToast('Listing posted! 🎉');
      form.reset();
      beliWrap.classList.remove('is-visible');
      previewImg.src = '';
      previewImgBox.classList.remove('has-image');
      updatePreview();
    } catch (err) {
      showToast('Error: ' + err.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = '＋ Post Listing';
    }
  });

  // Run once to set initial state
  updatePreview();
}

// ─── Search autocomplete ──────────────────────────────────────────────────────
function initSearchAutocomplete() {
  // ── Build unified item list ──
  const allItems = [];

  if (typeof ITEMS_DATA !== 'undefined') {
    Object.values(ITEMS_DATA).forEach(item => {
      allItems.push({
        name:        item.name,
        rarity:      item.rarity,
        rarityClass: item.rarityClass,
        image:       item.image,
        emoji:       '',
      });
    });
  }

  // Non-ITEMS_DATA known items
  [
    { name: 'Admiral Coat',        rarity: 'Legendary', rarityClass: 'legendary', image: '', emoji: '🪖' },
    { name: "Warlord's Plate",     rarity: 'Rare',      rarityClass: 'rare',      image: '', emoji: '🛡️' },
    { name: 'Marine Captain Set',  rarity: 'Uncommon',  rarityClass: 'uncommon',  image: '', emoji: '⚔️' },
    { name: '1,000,000 Beli',      rarity: 'Currency',  rarityClass: 'common',    image: '', emoji: '💰' },
    { name: '500,000 Beli',        rarity: 'Currency',  rarityClass: 'common',    image: '', emoji: '🪙' },
    { name: '250,000 Beli',        rarity: 'Currency',  rarityClass: 'common',    image: '', emoji: '💎' },
  ].forEach(item => allItems.push(item));

  const isListingsPage = !!document.getElementById('listing-grid');

  // ── Wire each navbar search input ──
  document.querySelectorAll('.search-form__input').forEach(input => {
    const form     = input.closest('.search-form');
    const dropdown = document.createElement('ul');
    dropdown.className = 'search-autocomplete';
    dropdown.setAttribute('role', 'listbox');
    dropdown.hidden = true;
    form.appendChild(dropdown);

    let highlighted = -1;

    function getMatches(query) {
      const q = query.trim().toLowerCase();
      if (q.length < 2) return [];
      return allItems.filter(item => item.name.toLowerCase().includes(q));
    }

    function renderDropdown(query) {
      const results = getMatches(query);
      dropdown.innerHTML = '';
      highlighted = -1;

      if (!results.length) {
        const li = document.createElement('li');
        li.className = 'search-autocomplete__empty';
        li.textContent = 'No results found';
        dropdown.appendChild(li);
        dropdown.hidden = false;
        return;
      }

      results.forEach(item => {
        const li = document.createElement('li');
        li.className = 'search-autocomplete__item';
        li.setAttribute('role', 'option');
        li.setAttribute('aria-selected', 'false');

        const media = item.image
          ? `<img class="search-autocomplete__img" src="${item.image}" alt="" />`
          : `<span class="search-autocomplete__emoji">${item.emoji}</span>`;

        li.innerHTML = `${media}
          <span class="search-autocomplete__name">${item.name}</span>
          <span class="listing-badge listing-badge--${item.rarityClass}">${item.rarity}</span>`;

        li.addEventListener('mousedown', (e) => {
          e.preventDefault(); // keep focus on input so blur doesn't fire first
          selectResult(item.name);
        });

        dropdown.appendChild(li);
      });

      dropdown.hidden = false;
    }

    function setHighlight(index) {
      const items = dropdown.querySelectorAll('.search-autocomplete__item');
      items.forEach((el, i) => {
        const active = i === index;
        el.classList.toggle('search-autocomplete__item--active', active);
        el.setAttribute('aria-selected', String(active));
      });
      highlighted = index;
    }

    function closeDropdown() {
      dropdown.hidden = true;
      highlighted = -1;
    }

    function selectResult(name) {
      closeDropdown();
      if (isListingsPage) {
        document.querySelectorAll('.search-form__input').forEach(inp => { inp.value = name; });
        applyListingFilters();
      } else {
        window.location.href = `listings.html?search=${encodeURIComponent(name)}`;
      }
    }

    input.addEventListener('input', () => {
      input.value.trim().length >= 2 ? renderDropdown(input.value) : closeDropdown();
    });

    input.addEventListener('keydown', (e) => {
      if (dropdown.hidden) return;
      const items = dropdown.querySelectorAll('.search-autocomplete__item');

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlight(highlighted < items.length - 1 ? highlighted + 1 : 0);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlight(highlighted > 0 ? highlighted - 1 : items.length - 1);
      } else if (e.key === 'Enter' && highlighted >= 0) {
        e.preventDefault();
        items[highlighted].dispatchEvent(new MouseEvent('mousedown'));
      } else if (e.key === 'Escape') {
        closeDropdown();
      }
    });

    input.addEventListener('blur', () => {
      setTimeout(closeDropdown, 160);
    });
  });

  // Close all dropdowns when clicking outside any search form
  document.addEventListener('click', (e) => {
    document.querySelectorAll('.search-autocomplete').forEach(dd => {
      if (!dd.closest('.search-form').contains(e.target)) dd.hidden = true;
    });
  });
}

// ─── Trade request modal ──────────────────────────────────────────────────────
function initTradeModal() {
  const btn = document.querySelector('.btn--request-trade');
  if (!btn) return;
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    showToast('Trade requests coming soon! 🏴‍☠️');
  });
}

// ─── Fetch real listings from API ────────────────────────────────────────────
function initFetchListings() {
  const grid = document.getElementById('listing-grid');
  if (!grid) return;

  fetch('/api/listings/get')
    .then(res => res.ok ? res.json() : null)
    .then(json => {
      if (!json || !json.listings || json.listings.length === 0) return;

      // Replace hardcoded grid with API results
      grid.innerHTML = json.listings.map(l => {
        const seller = l.profiles?.roblox_username || l.profiles?.username || 'Trader';
        const rarityClass = l.rarity ? `listing-badge--${l.rarity}` : 'listing-badge--common';
        const rarityLabel = l.rarity
          ? l.rarity.charAt(0).toUpperCase() + l.rarity.slice(1)
          : '';
        const priceHTML = l.price
          ? `<span class="listing-card__price">${Number(l.price).toLocaleString()} Beli</span>`
          : `<span class="listing-card__price listing-card__price--offer">Make Offer</span>`;
        const imgHTML = l.image_url
          ? `<img src="${l.image_url}" alt="${l.item_name}" class="listing-card__img" />`
          : `<div class="listing-card__placeholder" style="--ph:#f0fdfa;">📦</div>`;
        const typeLabel = [
          l.category ? l.category.charAt(0).toUpperCase() + l.category.slice(1) : '',
          l.fruit_type || ''
        ].filter(Boolean).join(' · ');

        return `
          <article class="listing-card" data-category="${l.category || ''}" data-rarity="${l.rarity || ''}" data-item-id="${l.id}">
            <a href="item.html?lid=${l.id}" class="listing-card__img-wrap">
              ${imgHTML}
              ${rarityLabel ? `<span class="listing-badge ${rarityClass}">${rarityLabel}</span>` : ''}
            </a>
            <div class="listing-card__body">
              <p class="listing-card__type">${typeLabel}</p>
              <h3 class="listing-card__name">${l.item_name}</h3>
              <p class="listing-card__seller">by <a href="#">${seller}</a></p>
              <div class="listing-card__footer">
                ${priceHTML}
                <a href="item.html?lid=${l.id}" class="btn btn--trade-card">Trade</a>
              </div>
            </div>
          </article>`;
      }).join('');

      // Re-run filter and heart buttons to cover the new cards
      applyListingFilters();
      initListingCardHearts();
    })
    .catch(() => { /* silently fall back to hardcoded cards */ });
}

// ─── Watchlist helpers ────────────────────────────────────────────────────────
const WL_KEY = 'rellmarket-watchlist';
function getWatchlist() {
  try { return JSON.parse(localStorage.getItem(WL_KEY)) || []; } catch { return []; }
}
function saveWatchlist(list) {
  localStorage.setItem(WL_KEY, JSON.stringify(list));
}
function isWatchlisted(id) {
  return getWatchlist().includes(id);
}
function toggleWatchlist(id) {
  const list = getWatchlist();
  const idx = list.indexOf(id);
  if (idx === -1) { list.push(id); saveWatchlist(list); return true; }
  list.splice(idx, 1); saveWatchlist(list); return false;
}

// ─── Item page watchlist button ───────────────────────────────────────────────
function initItemWatchlist() {
  const btn = document.querySelector('.btn--watchlist');
  if (!btn) return;
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (!id) return;

  function updateBtn(saved) {
    btn.textContent = saved ? 'Saved ♥' : 'Add to Watchlist ♡';
    btn.classList.toggle('is-watchlisted', saved);
  }

  updateBtn(isWatchlisted(id));

  btn.addEventListener('click', (e) => {
    e.preventDefault();
    const added = toggleWatchlist(id);
    updateBtn(added);
    showToast(added ? 'Added to Watchlist ♥' : 'Removed from Watchlist');
  });
}

// ─── Listing card heart buttons ───────────────────────────────────────────────
function initListingCardHearts() {
  const grid = document.getElementById('listing-grid');
  if (!grid) return;

  grid.querySelectorAll('.listing-card[data-item-id]').forEach(card => {
    const id = card.dataset.itemId;
    const imgWrap = card.querySelector('.listing-card__img-wrap');
    if (!imgWrap) return;

    const heart = document.createElement('button');
    const saved = isWatchlisted(id);
    heart.className = 'card-heart' + (saved ? ' is-watchlisted' : '');
    heart.setAttribute('aria-label', 'Toggle watchlist');
    heart.textContent = saved ? '♥' : '♡';

    imgWrap.appendChild(heart);

    heart.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const added = toggleWatchlist(id);
      heart.textContent = added ? '♥' : '♡';
      heart.classList.toggle('is-watchlisted', added);
      showToast(added ? 'Added to Watchlist ♥' : 'Removed from Watchlist');
    });
  });
}

// ─── Watchlist page ───────────────────────────────────────────────────────────
function initWatchlistPage() {
  const grid = document.getElementById('watchlist-grid');
  if (!grid) return;
  const empty = document.getElementById('watchlist-empty');

  function render() {
    const list = getWatchlist();
    grid.innerHTML = '';

    if (list.length === 0) {
      if (empty) empty.removeAttribute('hidden');
      grid.setAttribute('hidden', '');
      return;
    }

    if (empty) empty.setAttribute('hidden', '');
    grid.removeAttribute('hidden');

    list.forEach(id => {
      const item = typeof ITEMS_DATA !== 'undefined' ? ITEMS_DATA[id] : null;
      if (!item) return;

      const wrap = document.createElement('div');
      wrap.className = 'watchlist-card-wrap';

      const priceHTML = item.price
        ? `<span class="listing-card__price">🪙 ${Number(item.price).toLocaleString()} Beli</span>`
        : `<span class="listing-card__price listing-card__price--offer">Make Offer</span>`;

      wrap.innerHTML = `
        <button class="watchlist-remove" aria-label="Remove from watchlist">✕</button>
        <article class="listing-card" data-category="${item.category === 'Devil Fruit' ? 'fruit' : item.category.toLowerCase()}" data-rarity="${item.rarityClass}" data-item-id="${item.id}">
          <a href="item.html?id=${item.id}" class="listing-card__img-wrap">
            <img src="${item.image}" alt="${item.name}" class="listing-card__img" />
            <span class="listing-badge listing-badge--${item.rarityClass}">${item.rarity}</span>
          </a>
          <div class="listing-card__body">
            <p class="listing-card__type">${item.category} · ${item.type}</p>
            <h3 class="listing-card__name">${item.name}</h3>
            <p class="listing-card__seller">by <a href="#">${item.seller}</a></p>
            <div class="listing-card__footer">
              ${priceHTML}
              <a href="item.html?id=${item.id}" class="btn btn--trade-card">View</a>
            </div>
          </div>
        </article>`;

      wrap.querySelector('.watchlist-remove').addEventListener('click', () => {
        toggleWatchlist(id);
        render();
        showToast('Removed from Watchlist');
      });

      grid.appendChild(wrap);
    });
  }

  render();
}

// ─── Page transitions ─────────────────────────────────────────────────────────
function initPageTransitions() {
  document.querySelectorAll('a[href]').forEach(link => {
    const href = link.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto')) return;
    if (!href.includes('.html')) return;

    link.addEventListener('click', (e) => {
      e.preventDefault();
      document.body.classList.add('page-out');
      setTimeout(() => { window.location.href = href; }, 210);
    });
  });
}

// ─── Back to top ──────────────────────────────────────────────────────────────
function initBackToTop() {
  const btn = document.createElement('button');
  btn.className = 'back-to-top';
  btn.setAttribute('aria-label', 'Back to top');
  btn.textContent = '↑';
  document.body.appendChild(btn);

  window.addEventListener('scroll', () => {
    btn.classList.toggle('is-visible', window.scrollY > 400);
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// ─── Scroll reveal ────────────────────────────────────────────────────────────
function initScrollReveal() {
  const els = document.querySelectorAll('.reveal');
  if (!els.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  els.forEach(el => observer.observe(el));
}

// ─── Hero counter ─────────────────────────────────────────────────────────────
function initHeroCounter() {
  const els = document.querySelectorAll('.hero-stat__num');
  if (!els.length) return;

  els.forEach(el => {
    const target   = parseInt(el.dataset.target, 10);
    const duration = 1600;
    const start    = performance.now();

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased    = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      el.textContent = Math.round(eased * target).toLocaleString();
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
}

// ─── Seller name clipboard copy ───────────────────────────────────────────────
function initSellerCopy() {
  const sellerName = document.getElementById('item-seller-name');
  if (!sellerName) return;

  sellerName.title = 'Click to copy username';
  sellerName.addEventListener('click', () => {
    navigator.clipboard.writeText(sellerName.textContent.trim()).then(() => {
      showToast('Copied!');
    });
  });
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function showToast(message) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add('toast--visible'));
  });

  setTimeout(() => {
    toast.classList.remove('toast--visible');
    setTimeout(() => toast.remove(), 280);
  }, 2600);
}

// ─── Utilities ────────────────────────────────────────────────────────────────

/** Debounce — use for search input or scroll handlers. */
function debounce(fn, ms = 250) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

/** Format Beli numbers (e.g. 1000000 → "1,000,000 Beli") */
function formatBeli(amount) {
  return `${amount.toLocaleString()} Beli`;
}

// ─── Future hooks ─────────────────────────────────────────────────────────────
// Live search:
// const searchInput = document.querySelector('.search-form__input');
// if (searchInput) {
//   searchInput.addEventListener('input', debounce(async (e) => {
//     const query = e.target.value.trim();
//     if (!query) return;
//     // const res  = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
//     // const data = await res.json();
//     // renderResults(data);
//   }, 300));
// }

// Auth modals:
// document.querySelectorAll('[data-modal="login"]').forEach(el => {
//   el.addEventListener('click', (e) => { e.preventDefault(); openModal('login'); });
// });
