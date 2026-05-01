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
  initReportListing();
  initItemWatchlist();
  initListingCardHearts();
  initWatchlistPage();
  initFetchListings();
  initHomepageMiniGrids();
  initHomeStatsBar();
  initFeaturedListings();
  initCategoryGrid();
  initFeaturedTraders();
  initMyListings();
  initMoreMenu();
  initDarkMode();
});

// ─── Footer year ──────────────────────────────────────────────────────────────
function setFooterYear() {
  const el = document.getElementById('year');
  if (el) el.textContent = new Date().getFullYear();
}

// ─── Global dropdown coordinator ─────────────────────────────────────────────
window.closeAllDropdowns = function () {
  document.querySelectorAll('.nav-dd.is-open').forEach(dd => dd.classList.remove('is-open'));
};

// ─── More (⋮) menu ────────────────────────────────────────────────────────────
function initMoreMenu() {
  const moreDd = document.querySelector('.more-dd');
  if (!moreDd) return;
  const trigger = moreDd.querySelector('.btn--more');

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    const wasOpen = moreDd.classList.contains('is-open');
    window.closeAllDropdowns();
    if (!wasOpen) moreDd.classList.add('is-open');
  });

  document.addEventListener('click', () => moreDd.classList.remove('is-open'));
  moreDd.addEventListener('click', (e) => e.stopPropagation());
}

// ─── Dark mode ────────────────────────────────────────────────────────────────
function initDarkMode() {
  const KEY  = 'rellmarket-dark';
  const html = document.documentElement;
  const btn  = document.getElementById('dark-mode-toggle');
  if (!btn) return;

  function isDark() { return html.classList.contains('dark-mode'); }

  function setDark(on) {
    html.classList.toggle('dark-mode', on);
    btn.textContent = on ? '☀️ Light Mode' : '🌙 Dark Mode';
    localStorage.setItem(KEY, on ? '1' : '0');
  }

  // Sync button label to current state (class already applied by inline head script)
  btn.textContent = isDark() ? '☀️ Light Mode' : '🌙 Dark Mode';

  btn.addEventListener('click', () => setDark(!isDark()));
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

// ─── Hero carousel (initialises every .hero-carousel on the page) ────────────
function initCarouselDots() {
  document.querySelectorAll('.hero-carousel').forEach(carousel => {
    const slides = Array.from(carousel.querySelectorAll('.carousel__slide'));
    const dots   = Array.from(carousel.querySelectorAll('.carousel__dot'));
    if (!slides.length || !dots.length) return;

    let current = 0;
    let timer;

    function goTo(index) {
      slides[current].classList.remove('carousel__slide--active');
      dots[current].classList.remove('carousel__dot--active');
      dots[current].setAttribute('aria-selected', 'false');

      current = index;

      slides[current].classList.add('carousel__slide--active');
      dots[current].classList.add('carousel__dot--active');
      dots[current].setAttribute('aria-selected', 'true');
    }

    function advance() { goTo((current + 1) % slides.length); }

    function startTimer() { clearInterval(timer); timer = setInterval(advance, 5000); }

    dots.forEach(dot => {
      dot.addEventListener('click', () => {
        goTo(parseInt(dot.dataset.index, 10));
        startTimer();
      });
    });

    const prevBtn = carousel.querySelector('.carousel__arrow--prev');
    const nextBtn = carousel.querySelector('.carousel__arrow--next');
    if (prevBtn) prevBtn.addEventListener('click', () => { goTo((current - 1 + slides.length) % slides.length); startTimer(); });
    if (nextBtn) nextBtn.addEventListener('click', () => { goTo((current + 1) % slides.length); startTimer(); });

    carousel.addEventListener('mouseenter', () => clearInterval(timer));
    carousel.addEventListener('mouseleave', startTimer);

    startTimer();
  });
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

  // Extract numeric sort price from a card's data attribute.
  // Returns Infinity for "Make Offer" / no-price listings so they always sort last.
  function getPrice(card) {
    const raw = card.dataset.sortPrice;
    if (raw === undefined || raw === '') return Infinity;
    const n = Number(raw);
    return isNaN(n) || n <= 0 ? Infinity : n;
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

// ─── RV / Demand helpers ──────────────────────────────────────────────────────
// These helpers use the stored RV value — the formula stays server-side only.

function getDemandHeart(tier) {
  switch (tier) {
    case 'very_high': return '🖤';
    case 'high':      return '❤️';
    case 'medium':    return '💛';
    case 'low':       return '💙';
    default:          return '🤍';
  }
}

function getDemandLabel(tier) {
  switch (tier) {
    case 'very_high': return 'Very High Demand';
    case 'high':      return 'High Demand';
    case 'medium':    return 'Medium Demand';
    case 'low':       return 'Low Demand';
    default:          return 'Unknown Demand';
  }
}

function getMarketIndicator(priceInBeli, rv) {
  if (!rv || rv <= 0 || !priceInBeli) return '';
  const market = rv * 10_000_000;
  if (priceInBeli > market * 1.2) return '📈';
  if (priceInBeli < market * 0.8) return '📉';
  return '✅';
}

function getMarketLabel(priceInBeli, rv) {
  if (!rv || rv <= 0 || !priceInBeli) return '';
  const market = rv * 10_000_000;
  if (priceInBeli > market * 1.2) return 'Above market value';
  if (priceInBeli < market * 0.8) return 'Below market value';
  return 'Around market value';
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

// ─── Item page: load data from ?id= and ?listing_id= URL parameters ──────────
function initItemPage() {
  if (!document.getElementById('item-name-heading')) return;

  const params    = new URLSearchParams(window.location.search);
  const id        = params.get('id') || '';
  const listingId = params.get('listing_id');

  if (listingId) {
    // ── Path A: real listing from database ──
    fetch(`https://rellmarket.vercel.app/api/listings/getone?id=${encodeURIComponent(listingId)}`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(json => {
        const l          = json.listing;
        const staticItem = (typeof ITEMS_DATA !== 'undefined') ? ITEMS_DATA[id] : null;

        // Image: prefer ITEMS_DATA (high-quality asset), fall back to db url, then placeholder
        const image = staticItem?.image || l.image_url || '';

        // Type label: from listing fields, capitalised
        const catLabel  = l.category  ? l.category.charAt(0).toUpperCase()  + l.category.slice(1)  : '';
        const typeLabel = l.fruit_type || staticItem?.type || '';

        // Rarity: listing field is stored lowercase
        const rarityLabel = l.rarity ? l.rarity.charAt(0).toUpperCase() + l.rarity.slice(1) : '';
        const rarityClass = l.rarity || 'common';

        // Seller: real profile username + verification flags
        const seller           = l.profiles?.roblox_username || l.profiles?.username || 'Trader';
        const sellerIsVerified = l.profiles?.is_verified || false;
        const sellerIsTrusted  = l.profiles?.is_trusted  || false;

        // Price
        const price    = l.price_type === 'offer' ? 'Make Offer' : `${Number(l.price).toLocaleString()} Beli`;
        const priceSub = l.price_type === 'fixed'  ? 'Fixed price' : 'Accepting offers';

        // Description: listing's own description, fall back to ITEMS_DATA
        const description = l.description || staticItem?.description || '';

        populateItemPage({
          name:        l.item_name,
          image,
          rarity:      rarityLabel,
          rarityClass,
          category:    catLabel,
          type:        typeLabel,
          description,
          seller,
          sellerIsVerified,
          sellerIsTrusted,
          sellerAvatarUrl: l.profiles?.avatar_url || null,
          price,
          priceSub,
          rating:      staticItem?.rating      || '—',
          reviewCount: staticItem?.reviewCount || 0,
          createdAt:           l.created_at || null,
          id,
          listingId,
          categoryRaw:         l.category || '',
          acceptsOtherOffers:  l.accepts_other_offers,
        });

        // Fetch and display RV / demand for this item
        fetch(`https://rellmarket.vercel.app/api/values/get?item_name=${encodeURIComponent(l.item_name)}`)
          .then(r => r.ok ? r.json() : null)
          .then(data => {
            const v = data?.item;
            const sec = document.getElementById('item-rv-section');
            if (!sec) return;
            sec.hidden = false;
            const demandEl = document.getElementById('item-rv-demand-icon');
            if (demandEl) {
              demandEl.textContent = getDemandHeart(v?.demand_tier);
              demandEl.title = getDemandLabel(v?.demand_tier);
            }
            const rvValEl = document.getElementById('item-rv-value');
            if (rvValEl) {
              if (!v) {
                rvValEl.textContent = 'RV: —';
              } else if (v.is_established) {
                rvValEl.textContent = `RV: ${v.rv}`;
              } else {
                rvValEl.textContent = 'RV: Unestablished';
                const unestEl = document.getElementById('item-rv-unestablished');
                if (unestEl) unestEl.hidden = false;
              }
            }
            const marketEl = document.getElementById('item-rv-market');
            if (marketEl && v?.is_established && l.price && l.price_type === 'fixed') {
              const icon  = getMarketIndicator(Number(l.price), v.rv);
              const label = getMarketLabel(Number(l.price), v.rv);
              if (icon) { marketEl.textContent = `${icon} ${label}`; marketEl.hidden = false; }
            }
          })
          .catch(() => {});
      })
      .catch(() => {
        // Fetch failed — fall back to static data if available
        const staticItem = (typeof ITEMS_DATA !== 'undefined') ? ITEMS_DATA[id] : null;
        if (staticItem) populateItemPage(staticItem);
      });
    return;
  }

  // ── Path B: no listing_id — load from ITEMS_DATA ──
  const staticItem = (typeof ITEMS_DATA !== 'undefined') ? ITEMS_DATA[id] : null;
  if (staticItem) {
    populateItemPage(staticItem);
    return;
  }

  // ── Path C: unknown item not in ITEMS_DATA — search by name ──
  const searchName = id.replace(/-/g, ' ');
  fetch(`https://rellmarket.vercel.app/api/listings/get?search=${encodeURIComponent(searchName)}&limit=1`)
    .then(r => r.ok ? r.json() : null)
    .then(json => {
      const l = json?.listings?.[0];
      if (!l) return;
      populateItemPage({
        name:        l.item_name,
        image:       l.image_url || '',
        rarity:      l.rarity ? l.rarity.charAt(0).toUpperCase() + l.rarity.slice(1) : '',
        rarityClass: l.rarity || 'common',
        category:    l.category ? l.category.charAt(0).toUpperCase() + l.category.slice(1) : '',
        type:        l.fruit_type || '',
        description: l.description || '',
        seller:           l.profiles?.roblox_username || l.profiles?.username || 'Trader',
        sellerIsVerified: l.profiles?.is_verified || false,
        sellerIsTrusted:  l.profiles?.is_trusted  || false,
        price:       l.price_type === 'offer' ? 'Make Offer' : `${Number(l.price).toLocaleString()} Beli`,
        priceSub:    '',
        rating:      '—',
        reviewCount: 0,
        createdAt:   l.created_at || null,
        id,
        listingId:   l.id,
        categoryRaw: l.category || '',
      });
    })
    .catch(() => {});
}

// ─── Relative time helper ─────────────────────────────────────────────────────
function timeAgo(dateString) {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now - date) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

// ─── Item groups data (shared by form dropdowns and wantsItemIcon) ────────────
const FORM_ITEM_GROUPS = [
  {
    label: '🍎 Devil Fruits',
    items: [
      { value: 'gravity-fruit',      label: 'Gravity Fruit',      icon: { type: 'img',   src: 'assets/G-fruit.png' } },
      { value: 'flame-fruit',        label: 'Flame Fruit',        icon: { type: 'img',   src: 'assets/F-fruit.png' } },
      { value: 'barrier-fruit',      label: 'Barrier Fruit',      icon: { type: 'img',   src: 'assets/B-Fruit.png' } },
      { value: 'dragon-fruit',       label: 'Dragon Fruit',       icon: { type: 'img',   src: 'assets/Ou-fruit.png' } },
      { value: 'allo-fruit',         label: 'Allo Fruit',         icon: { type: 'img',   src: 'assets/allo-fruit.png' } },
      { value: 'ice-fruit',          label: 'Ice Fruit',          icon: { type: 'img',   src: 'assets/I-fruit.png' } },
      { value: 'bison-fruit',        label: 'Bison Fruit',        icon: { type: 'img',   src: 'assets/bison-fruit.png' } },
      { value: 'bomb-fruit',         label: 'Bomb Fruit',         icon: { type: 'img',   src: 'assets/bomb-fruit.png' } },
    ],
  },
  {
    label: '🛡️ Armor',
    items: [
      { value: 'admiral-coat',       label: 'Admiral Coat',       icon: { type: 'emoji', char: '🛡️' } },
      { value: 'warlords-plate',     label: "Warlord's Plate",    icon: { type: 'emoji', char: '🛡️' } },
      { value: 'marine-captain-set', label: 'Marine Captain Set', icon: { type: 'emoji', char: '🛡️' } },
    ],
  },
  {
    label: '💰 Beli',
    items: [
      { value: 'beli-1000000', label: '1,000,000 Beli', icon: { type: 'emoji', char: '💰' } },
      { value: 'beli-500000',  label: '500,000 Beli',   icon: { type: 'emoji', char: '💰' } },
      { value: 'beli-250000',  label: '250,000 Beli',   icon: { type: 'emoji', char: '💰' } },
    ],
  },
  {
    label: null,
    items: [
      { value: 'other', label: 'Other / Unlisted Item', icon: { type: 'emoji', char: '📦' } },
    ],
  },
];

// ─── Wanted in Return: resolve icon HTML for an item name ────────────────────
// size: pixel dimension for img/emoji display
function wantsItemIcon(itemName, size) {
  // Beli amounts
  if (/beli/i.test(itemName)) {
    return `<span class="wants-icon-emoji" style="font-size:${size}px;line-height:1;">💰</span>`;
  }
  // Look up in ITEMS_DATA by name (fruits have images)
  if (typeof ITEMS_DATA !== 'undefined') {
    const entry = Object.values(ITEMS_DATA).find(d => d.name === itemName);
    if (entry && entry.image) {
      return `<img src="${entry.image}" alt="" class="wants-icon" width="${size}" height="${size}" style="object-fit:contain;flex-shrink:0;" />`;
    }
  }
  // Look up in FORM_ITEM_GROUPS for emoji icons (armor, etc.)
  const allGroupItems = FORM_ITEM_GROUPS.flatMap(g => g.items);
  const found = allGroupItems.find(i => i.label === itemName);
  if (found && found.icon.type === 'emoji') {
    return `<span class="wants-icon-emoji" style="font-size:${Math.round(size * 0.85)}px;line-height:1;">${found.icon.char}</span>`;
  }
  return `<span class="wants-icon-emoji" style="font-size:${Math.round(size * 0.85)}px;line-height:1;">📦</span>`;
}

function populateItemPage(item) {

  // Page title
  document.title = `${item.name} — RellMarket`;

  // Breadcrumb
  const crumb = document.getElementById('item-breadcrumb-name');
  if (crumb) crumb.textContent = item.name;

  // Main image
  const mainImg = document.getElementById('gallery-main-img');
  if (mainImg) { mainImg.src = item.image; mainImg.alt = item.name; }

  // Thumbnail strip — only show when the listing has 2 or more images
  const thumbStrip = document.querySelector('.item-gallery__thumbs');
  if (thumbStrip) {
    const hasMultiple = Array.isArray(item.images) && item.images.length >= 2;
    thumbStrip.style.display = hasMultiple ? 'flex' : 'none';
    if (hasMultiple) {
      const thumbBtns = thumbStrip.querySelectorAll('.item-gallery__thumb');
      thumbBtns.forEach((btn, i) => {
        const src = item.images[i] || item.images[0];
        btn.dataset.src = src;
        btn.hidden = !item.images[i];
        const img = btn.querySelector('.item-gallery__thumb-img');
        if (img) img.src = src;
      });
    }
  }

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
  const sellerAvatarEl = document.getElementById('item-seller-avatar');
  if (sellerAvatarEl && item.sellerAvatarUrl) {
    const img = document.createElement('img');
    img.src   = item.sellerAvatarUrl;
    img.alt   = item.seller || '';
    img.className = 'item-seller__avatar-img';
    img.onerror = () => { sellerAvatarEl.innerHTML = '⚓'; };
    sellerAvatarEl.innerHTML = '';
    sellerAvatarEl.appendChild(img);
  }

  const sellerName = document.getElementById('item-seller-name');
  if (sellerName) {
    sellerName.textContent = item.seller;
    sellerName.href = `profile.html?username=${encodeURIComponent(item.seller)}`;
  }
  const sellerBadge = document.getElementById('item-seller-badge');
  if (sellerBadge) {
    if (item.sellerIsVerified) {
      sellerBadge.className = 'item-seller__badge item-seller__badge--verified';
      sellerBadge.textContent = '⭐ Verified';
    } else if (item.sellerIsTrusted) {
      sellerBadge.className = 'item-seller__badge item-seller__badge--trusted';
      sellerBadge.textContent = '🛡️ Trusted';
    }
  }

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

  const statCategory = document.getElementById('item-stat-category');
  if (statCategory) statCategory.textContent = item.category;

  const statListed = document.getElementById('item-stat-listed');
  if (statListed) statListed.textContent = item.createdAt ? timeAgo(item.createdAt) : '—';

  // Dispatch event so the inline price-history chart script can react
  document.dispatchEvent(new CustomEvent('rellmarket:item-loaded', { detail: { itemName: item.name } }));

  // Similar items grid — real listings from the API, same category, excluding current
  (async function loadSimilarItems() {
    const similarSection = document.querySelector('.similar-section');
    const similarGrid    = document.querySelector('.similar-grid');
    if (!similarSection || !similarGrid) return;

    const category = item.categoryRaw;
    if (!category) { similarSection.hidden = true; return; }

    try {
      const params = new URLSearchParams({ category, limit: '5', listing_type: 'selling' });
      const res  = await fetch(`/api/listings/get?${params}`);
      if (!res.ok) throw new Error('fetch failed');
      const { listings } = await res.json();

      const others = listings.filter(l => String(l.id) !== String(item.listingId)).slice(0, 4);
      if (others.length === 0) { similarSection.hidden = true; return; }

      similarGrid.innerHTML = others.map(l => {
        const slug    = itemNameToId(l.item_name);
        const url     = `item.html?id=${slug}&listing_id=${l.id}`;
        const seller  = l.profiles?.roblox_username || l.profiles?.username || 'Trader';
        const price   = l.price_type === 'offer'
          ? 'Make Offer'
          : `${Number(l.price).toLocaleString()} Beli`;
        const imgHTML = l.image_url
          ? `<img src="${l.image_url}" alt="${l.item_name}" class="mini-card__img" />`
          : `<div class="mini-card__placeholder">📦</div>`;

        return `
          <article class="mini-card">
            <a href="${url}" class="mini-card__img-wrap" tabindex="-1" aria-hidden="true">
              ${imgHTML}
            </a>
            <div class="mini-card__body">
              <a href="${url}" class="mini-card__name">${l.item_name}</a>
              <p class="mini-card__seller">${seller}</p>
              <div class="mini-card__footer">
                <span class="mini-card__price">${price}</span>
                <a href="${url}" class="btn btn--mini-trade">Trade</a>
              </div>
            </div>
          </article>`;
      }).join('');
    } catch (_) {
      similarSection.hidden = true;
    }
  })();

  // Fetch auth state + wanted items in parallel, then apply all interactive UI + reveal page
  (async function applyItemInteractions() {
    const sessionPromise = (typeof supabaseClient !== 'undefined')
      ? supabaseClient.auth.getSession().catch(() => ({ data: { session: null } }))
      : Promise.resolve({ data: { session: null } });

    const wantsPromise = item.listingId
      ? fetch(`/api/listings/wants-get?listing_id=${encodeURIComponent(item.listingId)}`)
          .then(r => r.ok ? r.json() : { wants: [] })
          .catch(() => ({ wants: [] }))
      : Promise.resolve({ wants: [] });

    const [sessionData, wantsData] = await Promise.all([sessionPromise, wantsPromise]);

    const loggedIn = !!(sessionData?.data?.session);
    const wants    = wantsData.wants || [];

    // Populate "Wanted in Return" section
    const wantsSection = document.getElementById('item-wants');
    const wantsList    = document.getElementById('item-wants-list');
    if (wantsSection && wantsList && wants.length > 0) {
      wantsList.innerHTML = wants.map(w => {
        const icon     = wantsItemIcon(w.item_name, 64);
        const isBeli   = /beli/i.test(w.item_name);
        const nameText = isBeli
          ? w.item_name.replace(/(\d+(?:,\d+)*)/, n => Number(n.replace(/,/g, '')).toLocaleString())
          : w.item_name;
        const qtyHTML  = w.quantity > 1
          ? `<span class="item-wants__qty">×${w.quantity}</span>`
          : '';
        return `<div class="item-wants__card">
          <div class="item-wants__card-icon">${icon}</div>
          <div class="item-wants__card-info">
            <span class="item-wants__card-name">${nameText}</span>
            ${qtyHTML}
          </div>
        </div>`;
      }).join('');
      wantsSection.style.display = 'block';
    }

    // Determine trade button display state
    // accepts_other_offers: null/undefined = treat as true (legacy listings); false = strict mode
    const hasWants    = wants.length > 0;
    const strictWants = hasWants && item.acceptsOtherOffers === false;

    // Hide the entire price block when wants are present — the wants section replaces that context
    if (hasWants) {
      const itemPriceDiv = document.querySelector('.item-price');
      if (itemPriceDiv) itemPriceDiv.style.display = 'none';
    }

    const itemActions  = document.getElementById('item-actions');
    const itemReport   = document.getElementById('item-report-row');
    const itemGuestMsg = document.getElementById('item-guest-msg');
    const itemOnlyMsg  = document.getElementById('item-only-wants-msg');
    const itemAltOffer = document.getElementById('item-different-offer');

    if (loggedIn) {
      if (itemGuestMsg) itemGuestMsg.style.display = 'none';
      if (itemReport)   itemReport.style.display   = 'block';

      if (strictWants) {
        // Seller only wants the items listed — hide trade buttons, show restriction message
        if (itemActions)  itemActions.style.display  = 'none';
        if (itemOnlyMsg)  itemOnlyMsg.style.display  = 'block';
        if (itemAltOffer) itemAltOffer.style.display = 'none';
      } else if (hasWants) {
        // Has wants but also accepts other offers — show "Or make a different offer" label
        if (itemActions)  itemActions.style.display  = 'grid';
        if (itemOnlyMsg)  itemOnlyMsg.style.display  = 'none';
        if (itemAltOffer) itemAltOffer.style.display = 'block';
      } else {
        // No wants — normal trade buttons with no extra messaging
        if (itemActions)  itemActions.style.display  = 'grid';
        if (itemOnlyMsg)  itemOnlyMsg.style.display  = 'none';
        if (itemAltOffer) itemAltOffer.style.display = 'none';
      }
    } else {
      if (itemActions)  itemActions.style.display  = 'none';
      if (itemReport)   itemReport.style.display   = 'none';
      if (itemOnlyMsg)  itemOnlyMsg.style.display  = 'none';
      if (itemAltOffer) itemAltOffer.style.display = 'none';
      if (itemGuestMsg) itemGuestMsg.style.display = 'block';
    }

    // Reveal the page — everything is settled now
    const itemMain = document.querySelector('main.item-page');
    if (itemMain) itemMain.style.visibility = 'visible';
  })();
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
// ─── Custom dropdown builder ──────────────────────────────────────────────────
// Converts a .cs-select div into a styled image+icon dropdown.
// groups: same shape as FORM_ITEM_GROUPS
// Returns API: { getValue, getLabel, onChange, reset, el }
function buildCustomDropdown(containerEl, groups) {
  if (!containerEl) return null;

  let _value = '';
  let _label = '';
  const _listeners = [];

  function _esc(s) { return String(s).replace(/"/g, '&quot;'); }

  function _iconHTML(icon, size) {
    if (icon.type === 'img') {
      return `<img src="${icon.src}" width="${size}" height="${size}" class="cs-icon" alt="" />`;
    }
    return `<span class="cs-icon cs-icon--emoji">${icon.char}</span>`;
  }

  const panelInner = groups.map((group, gi) => {
    let h = '';
    if (group.label) {
      h += `<div class="cs-group-hdr${gi > 0 ? ' cs-group-hdr--sep' : ''}">${group.label}</div>`;
    }
    h += group.items.map(item =>
      `<button type="button" class="cs-option" data-value="${_esc(item.value)}" data-label="${_esc(item.label)}">`
      + _iconHTML(item.icon, 16)
      + `<span class="cs-option-text">${item.label}</span>`
      + `</button>`
    ).join('');
    return h;
  }).join('');

  containerEl.innerHTML =
    `<button type="button" class="cs-trigger" aria-haspopup="listbox" aria-expanded="false">`
    + `<span class="cs-trigger-icon"></span>`
    + `<span class="cs-trigger-text cs-placeholder">Select an item\u2026</span>`
    + `<svg class="cs-arrow" width="12" height="8" viewBox="0 0 12 8" fill="none"><path d="M1 1l5 5 5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`
    + `</button>`
    + `<div class="cs-panel" role="listbox">${panelInner}</div>`;

  const triggerBtn = containerEl.querySelector('.cs-trigger');
  const panelEl    = containerEl.querySelector('.cs-panel');
  const iconSlot   = triggerBtn.querySelector('.cs-trigger-icon');
  const textSlot   = triggerBtn.querySelector('.cs-trigger-text');

  function _updateTrigger() {
    if (_value) {
      const item = groups.flatMap(g => g.items).find(i => i.value === _value);
      iconSlot.innerHTML   = item ? _iconHTML(item.icon, 16) : '';
      textSlot.textContent = _label;
      textSlot.classList.remove('cs-placeholder');
    } else {
      iconSlot.innerHTML   = '';
      textSlot.textContent = 'Select an item\u2026';
      textSlot.classList.add('cs-placeholder');
    }
  }

  function _select(value, label) {
    _value = value;
    _label = label;
    _updateTrigger();
    panelEl.querySelectorAll('.cs-option').forEach(o => {
      o.classList.toggle('cs-option--selected', o.dataset.value === value);
    });
    _listeners.forEach(fn => fn(value, label));
  }

  triggerBtn.addEventListener('click', e => {
    e.stopPropagation();
    const open = containerEl.classList.toggle('cs--open');
    triggerBtn.setAttribute('aria-expanded', String(open));
    if (open) {
      const sel = panelEl.querySelector('.cs-option--selected');
      if (sel) sel.scrollIntoView({ block: 'nearest' });
    }
  });

  panelEl.addEventListener('click', e => {
    const opt = e.target.closest('.cs-option');
    if (!opt) return;
    _select(opt.dataset.value, opt.dataset.label);
    containerEl.classList.remove('cs--open');
    triggerBtn.setAttribute('aria-expanded', 'false');
  });

  document.addEventListener('click', e => {
    if (!containerEl.contains(e.target)) {
      containerEl.classList.remove('cs--open');
      triggerBtn.setAttribute('aria-expanded', 'false');
    }
  });

  containerEl.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      containerEl.classList.remove('cs--open');
      triggerBtn.setAttribute('aria-expanded', 'false');
      triggerBtn.focus();
    }
  });

  return {
    getValue() { return _value; },
    getLabel() { return _label; },
    onChange(fn) { _listeners.push(fn); },
    reset()    { _select('', ''); },
    el:        containerEl,
  };
}

function initPostListingForm() {
  const form = document.getElementById('post-form');
  if (!form) return;

  // Field refs
  const fieldItemEl   = document.getElementById('field-item');
  const fieldQty      = document.getElementById('field-qty');
  const fieldCategory = document.getElementById('field-category');
  const fieldRarity   = document.getElementById('field-rarity');
  const fieldType     = document.getElementById('field-type');
  const fieldDesc     = document.getElementById('field-desc');
  const fieldPrice    = document.getElementById('field-price');
  const priceRadios        = form.querySelectorAll('input[name="price-type"]');
  const listingTypeRadios  = form.querySelectorAll('input[name="listing-type"]');
  const priceGroup         = document.getElementById('price-group');
  const beliWrap           = document.getElementById('beli-input-wrap');
  const auctionWrap        = document.getElementById('auction-fields-wrap');
  const fieldAuctionStart  = document.getElementById('field-auction-start');
  const fieldAuctionIncr   = document.getElementById('field-auction-increment');
  const fieldAuctionDur    = document.getElementById('field-auction-duration');
  const fruitTypeGrp       = document.getElementById('fruit-type-group');
  const descCount     = document.getElementById('desc-count');

  // Wanted in Return refs
  const wantedGroup        = document.getElementById('wanted-group');
  const wantsItemSelectEl  = document.getElementById('wants-item-select');
  const wantsQtyInput      = document.getElementById('wants-qty-input');
  const wantsAddBtn      = document.getElementById('wants-add-btn');
  const wantsChips       = document.getElementById('wants-chips');
  const wantsOtherGroup  = document.getElementById('wants-other-group');

  // Track added wants as array of { item_name, quantity }
  let wantsItems = [];

  // Build custom dropdowns
  const fieldItemDD = buildCustomDropdown(fieldItemEl, FORM_ITEM_GROUPS);
  const wantsDD     = buildCustomDropdown(wantsItemSelectEl, FORM_ITEM_GROUPS);

  function renderWantsChips() {
    if (!wantsChips) return;
    wantsChips.innerHTML = wantsItems.map((w, i) => {
      const icon    = wantsItemIcon(w.item_name, 16);
      const qtyText = w.quantity > 1 ? `${w.quantity}× ` : '';
      return `<span class="wants-chip">${icon}<span class="wants-chip__text">${qtyText}${w.item_name}</span><button type="button" class="wants-chip__remove" data-idx="${i}" aria-label="Remove">✕</button></span>`;
    }).join('');
    wantsChips.querySelectorAll('.wants-chip__remove').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.idx);
        wantsItems.splice(idx, 1);
        renderWantsChips();
      });
    });
    // Show "Also accept other offers?" toggle only when at least one want is added
    if (wantsOtherGroup) {
      wantsOtherGroup.style.display = wantsItems.length > 0 ? '' : 'none';
    }
  }

  if (wantsAddBtn) {
    wantsAddBtn.addEventListener('click', () => {
      const val   = wantsDD?.getValue();
      const label = wantsDD?.getLabel();
      if (!val) return;
      const qty = Math.max(1, Number(wantsQtyInput?.value) || 1);
      // Merge if same item already added
      const existing = wantsItems.find(w => w.item_name === label);
      if (existing) {
        existing.quantity += qty;
      } else {
        wantsItems.push({ item_name: label, quantity: qty });
      }
      wantsDD?.reset();
      if (wantsQtyInput) wantsQtyInput.value = '1';
      renderWantsChips();
    });
  }

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

  // ── Lock / unlock auto-filled fields ──
  function lockField(el) {
    el.disabled = true;
    el.classList.add('form-input--locked');
    const label = el.closest('.form-group')?.querySelector('.form-label');
    if (label && !label.querySelector('.autofill-hint')) {
      const hint = document.createElement('span');
      hint.className = 'autofill-hint';
      hint.textContent = ' 🔒 auto-filled';
      label.appendChild(hint);
    }
  }

  function unlockField(el) {
    el.disabled = false;
    el.classList.remove('form-input--locked');
    const label = el.closest('.form-group')?.querySelector('.form-label');
    label?.querySelector('.autofill-hint')?.remove();
  }

  // ── Auto-fill from known item ──
  function applyItemData(data) {
    const catVal    = categoryMap[data.category]  || data.category  || '';
    const rarityVal = rarityMap[data.rarity]      || data.rarity    || '';
    const typeVal   = data.type || '';

    setSelectValue(fieldCategory, catVal);
    setSelectValue(fieldRarity,   rarityVal);
    setSelectValue(fieldType,     typeVal);

    // Lock category, rarity and type so user cannot override auto-filled values
    lockField(fieldCategory);
    lockField(fieldRarity);
    lockField(fieldType);

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
    unlockField(fieldCategory);
    unlockField(fieldRarity);
    unlockField(fieldType);
    previewImg.src = '';
    previewImgBox.classList.remove('has-image');
  }

  // ── Item selector change ──
  fieldItemDD.onChange(val => {
    if (!val || val === 'other') {
      clearAutoFill();
    } else {
      const data = (typeof ITEMS_DATA !== 'undefined' && ITEMS_DATA[val])
        ? ITEMS_DATA[val]
        : PRESET_ITEMS[val];
      if (data) applyItemData(data);
    }
    updatePreview();
  });
  fieldItemDD.onChange(() => clearFieldError(fieldItemDD.el));

  function updatePreview() {
    // Name — use selected option text, apply qty suffix if > 1
    const itemVal  = fieldItemDD.getValue();
    const itemText = itemVal && itemVal !== 'other'
      ? fieldItemDD.getLabel()
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
    } else if (priceType === 'auction') {
      const startAmt = fieldAuctionStart?.value ? Number(fieldAuctionStart.value).toLocaleString() + ' Beli' : '— Beli';
      previewPrice.textContent = '🔨 Auction — ' + startAmt;
      previewPrice.className   = 'listing-card__price listing-card__price--auction';
    } else {
      const amount = fieldPrice.value ? Number(fieldPrice.value).toLocaleString() + ' Beli' : '— Beli';
      previewPrice.textContent = amount;
      previewPrice.className   = 'listing-card__price';
    }
  }

  // Show/hide Beli / auction inputs based on radio selection
  function applyPriceRadio() {
    const priceType = form.querySelector('input[name="price-type"]:checked').value;
    beliWrap.classList.toggle('is-visible', priceType === 'fixed');
    if (auctionWrap) auctionWrap.classList.toggle('is-visible', priceType === 'auction');
    updatePreview();
  }
  priceRadios.forEach(radio => radio.addEventListener('change', applyPriceRadio));

  // Show/hide price group and wanted group based on listing type
  function applyListingType() {
    const listingType = form.querySelector('input[name="listing-type"]:checked')?.value;
    const isLooking = listingType === 'looking';
    if (priceGroup)  priceGroup.style.display  = isLooking ? 'none' : '';
    if (wantedGroup) wantedGroup.style.display = isLooking ? 'none' : '';
  }
  listingTypeRadios.forEach(radio => radio.addEventListener('change', applyListingType));

  // Description character counter
  fieldDesc.addEventListener('input', () => {
    descCount.textContent = fieldDesc.value.length;
  });

  // Live preview on field changes
  [fieldQty, fieldCategory, fieldRarity, fieldType, fieldPrice, fieldAuctionStart].filter(Boolean).forEach(el => {
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
  [fieldCategory, fieldPrice].forEach(el => {
    el.addEventListener('change', () => clearFieldError(el));
    el.addEventListener('input',  () => clearFieldError(el));
  });
  // fieldItem error cleared via onChange (registered above)

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    let valid = true;

    if (!fieldItemDD.getValue()) {
      showFieldError(fieldItemDD.el, 'Please select an item.');
      valid = false;
    } else {
      clearFieldError(fieldItemDD.el);
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
    if (priceType === 'auction' && fieldAuctionStart && !fieldAuctionStart.value) {
      showFieldError(fieldAuctionStart, 'Please enter a starting price.');
      valid = false;
    } else if (fieldAuctionStart) {
      clearFieldError(fieldAuctionStart);
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

      const itemText = fieldItemDD.getValue() && fieldItemDD.getValue() !== 'other'
        ? fieldItemDD.getLabel()
        : '';

      const startingPrice = priceType === 'auction' && fieldAuctionStart?.value
        ? Number(fieldAuctionStart.value) : null;

      const listingType = form.querySelector('input[name="listing-type"]:checked')?.value || 'selling';

      const acceptsOtherOffersEl = document.getElementById('wants-accepts-other');
      const payload = {
        item_name:             itemText,
        category:              fieldCategory.value,
        rarity:                fieldRarity.value || null,
        fruit_type:            fieldType.value   || null,
        price:                 listingType === 'looking' ? null : (priceType === 'fixed' && fieldPrice.value ? Number(fieldPrice.value) : (startingPrice || null)),
        price_type:            listingType === 'looking' ? 'offer' : priceType,
        listing_type:          listingType,
        description:           fieldDesc.value   || null,
        image_url:             (typeof ITEMS_DATA !== 'undefined' && ITEMS_DATA[fieldItemDD.getValue()]?.image) || null,
        accepts_other_offers:  wantsItems.length === 0 ? true : (acceptsOtherOffersEl?.checked !== false),
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

      // Save wanted items if any
      if (json.listing?.id && wantsItems.length > 0) {
        try {
          await fetch('/api/listings/wants-create', {
            method:  'POST',
            headers,
            body:    JSON.stringify({ listing_id: json.listing.id, wants: wantsItems }),
          });
        } catch (_) {}
      }

      // If auction, create the auction record then redirect
      if (priceType === 'auction' && json.listing?.id) {
        submitBtn.textContent = 'Starting auction…';
        const auctionRes = await fetch('/api/auctions/create', {
          method:  'POST',
          headers,
          body: JSON.stringify({
            listing_id:     json.listing.id,
            starting_price: startingPrice,
            min_increment:  fieldAuctionIncr?.value ? Number(fieldAuctionIncr.value) : 10000,
            duration_hours: fieldAuctionDur?.value  ? Number(fieldAuctionDur.value)  : 24,
          }),
        });
        const auctionJson = await auctionRes.json();
        if (!auctionRes.ok) throw new Error(auctionJson.error || 'Failed to create auction');
        showToast('Auction started! 🔨');
        setTimeout(() => { window.location.href = `auction.html?id=${auctionJson.auction.id}`; }, 800);
        return;
      }

      // Build item URL
      const itemVal2 = fieldItemDD.getValue();
      const itemId  = itemVal2 && itemVal2 !== 'other' ? itemVal2 : itemText.toLowerCase().replace(/\s+/g, '-');
      const itemUrl = `item.html?id=${itemId}&listing_id=${json.listing?.id}`;
      const staticItem = (typeof ITEMS_DATA !== 'undefined') ? ITEMS_DATA[itemId] : null;

      // Hide columns, show success
      const formCol    = document.querySelector('.post-form-col');
      const previewCol = document.querySelector('.post-preview-col');
      const successDiv = document.querySelector('.post-success');

      if (formCol)    formCol.style.display    = 'none';
      if (previewCol) previewCol.style.display = 'none';
      if (successDiv) successDiv.classList.add('is-visible');

      // Populate success state
      const imgEl     = document.getElementById('post-success-img');
      const nameEl    = document.getElementById('post-success-name');
      const viewEl    = document.getElementById('post-success-view');
      const copyEl    = document.getElementById('post-success-copy');
      const anotherEl = document.getElementById('post-success-another');

      if (imgEl)  { imgEl.src = staticItem?.image || ''; imgEl.style.display = staticItem?.image ? '' : 'none'; }
      if (nameEl) nameEl.textContent = itemText;
      if (viewEl) viewEl.href = itemUrl;

      if (copyEl) {
        const fullUrl = `${location.origin}/${itemUrl}`;
        copyEl.onclick = async () => {
          try { await navigator.clipboard.writeText(fullUrl); } catch (e) {}
          copyEl.textContent = 'Copied! ✅';
          setTimeout(() => { copyEl.textContent = '🔗 Copy Link'; }, 2000);
        };
      }

      if (anotherEl) {
        anotherEl.onclick = () => {
          if (successDiv) successDiv.classList.remove('is-visible');
          if (formCol)    formCol.style.display    = '';
          if (previewCol) previewCol.style.display = '';
          form.reset();
          fieldItemDD?.reset();
          wantsDD?.reset();
          beliWrap.classList.remove('is-visible');
          if (auctionWrap) auctionWrap.classList.remove('is-visible');
          previewImg.src = '';
          previewImgBox.classList.remove('has-image');
          wantsItems = [];
          renderWantsChips();
          const acceptsOtherReset = document.getElementById('wants-accepts-other');
          if (acceptsOtherReset) acceptsOtherReset.checked = true;
          updatePreview();
        };
      }
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
  const requestBtn = document.querySelector('.btn--request-trade');
  const modal      = document.getElementById('trade-modal');
  if (!requestBtn || !modal) return;

  const closeBtn       = document.getElementById('trade-modal-close');
  const cancelBtn      = document.getElementById('trade-modal-cancel');
  const tradeForm      = document.getElementById('trade-form');
  const offeredSel     = document.getElementById('trade-offered-item');
  const offeredBeli    = document.getElementById('trade-offered-beli');
  const summaryOffer   = document.getElementById('trade-summary-offer');
  const summaryReceive = document.getElementById('trade-summary-receive');
  const submitBtn      = document.getElementById('trade-submit-btn');
  const modalTitle     = document.getElementById('trade-modal-title');
  const offerItemGroup = document.getElementById('trade-offer-item-group');
  const beliLabel      = document.getElementById('trade-beli-label');

  // ── Fixed-price mode: read from the price label rendered by populateItemPage ──
  let isFixedPrice  = false;
  let fixedPrice    = 0;

  function detectPriceMode() {
    const priceEl = document.getElementById('item-price-label');
    const priceText = priceEl?.textContent || '';
    // "Make Offer" means offer mode; anything else (e.g. "50,000 Beli") is fixed
    isFixedPrice = priceText !== '' && priceText !== 'Make Offer';
    if (isFixedPrice) {
      // Parse numeric value — strip non-digit chars except decimal point
      fixedPrice = parseInt(priceText.replace(/[^0-9]/g, ''), 10) || 0;
    }
  }

  function applyPriceMode() {
    if (isFixedPrice) {
      // Hide item-offer dropdown; change labels and title for Beli purchase
      if (offerItemGroup) offerItemGroup.style.display = 'none';
      if (modalTitle) modalTitle.textContent = 'Buy with Beli';
      if (beliLabel) beliLabel.innerHTML = 'Your Beli Offer';
      if (offeredBeli) {
        offeredBeli.value = fixedPrice || '';
        offeredBeli.readOnly = true;
      }
      // Pre-fill summary
      if (summaryOffer) summaryOffer.textContent = fixedPrice ? `${fixedPrice.toLocaleString()} Beli` : '—';
    } else {
      // Offer mode — restore defaults
      if (offerItemGroup) offerItemGroup.style.display = '';
      if (modalTitle) modalTitle.textContent = 'Request a Trade';
      if (beliLabel) beliLabel.innerHTML = 'Add Beli <span class="trade-modal__optional">(optional)</span>';
      if (offeredBeli) {
        offeredBeli.value = '';
        offeredBeli.readOnly = false;
      }
    }
  }

  // ── Open / close ──
  function openModal() {
    detectPriceMode();
    applyPriceMode();

    // Sync "receive" side from current item name heading
    const itemName = document.getElementById('item-name-heading')?.textContent || '—';
    if (summaryReceive) summaryReceive.textContent = itemName;
    // Sync modal item preview
    const modalItemName = document.getElementById('trade-modal-item-name');
    if (modalItemName) modalItemName.textContent = itemName;
    const modalItemImg = document.getElementById('trade-modal-item-img');
    const mainImg = document.getElementById('gallery-main-img');
    if (modalItemImg && mainImg?.src) modalItemImg.src = mainImg.src;
    const modalBadge = document.getElementById('trade-modal-item-badge');
    const pageBadge  = document.getElementById('item-rarity-badge');
    if (modalBadge && pageBadge) {
      modalBadge.textContent = pageBadge.textContent;
      modalBadge.className   = pageBadge.className;
    }
    modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modal.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  requestBtn.addEventListener('click', (e) => { e.preventDefault(); openModal(); });
  closeBtn?.addEventListener('click', closeModal);
  cancelBtn?.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

  // ── Live trade summary (offer mode only) ──
  function updateSummary() {
    if (isFixedPrice) return; // summary already set by applyPriceMode
    const item = offeredSel.value || '—';
    const beli = Number(offeredBeli.value) || 0;
    const parts = [];
    if (item && item !== '—') parts.push(item);
    if (beli > 0) parts.push(`${beli.toLocaleString()} Beli`);
    if (summaryOffer) summaryOffer.textContent = parts.length ? parts.join(' + ') : '—';
  }

  offeredSel?.addEventListener('change', updateSummary);
  offeredBeli?.addEventListener('input', updateSummary);

  // ── Form submit ──
  tradeForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!isFixedPrice && !offeredSel.value) {
      showToast('Please select an item to offer.');
      return;
    }

    // Auth check
    let token = null;
    if (typeof supabaseClient !== 'undefined') {
      const { data: { session } } = await supabaseClient.auth.getSession();
      token = session?.access_token || null;
    }
    if (!token) {
      showToast('Please log in to send trade requests');
      setTimeout(() => { window.location.href = 'login.html'; }, 1200);
      return;
    }

    // Get listing_id from URL
    const listingId = new URLSearchParams(window.location.search).get('listing_id');
    if (!listingId) {
      showToast('Could not identify this listing. Please try again.');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';

    // Fixed-price: override offered_item and offered_beli automatically
    const offeredItem = isFixedPrice ? 'Beli' : offeredSel.value;
    const offeredBeliVal = isFixedPrice ? fixedPrice : (Number(offeredBeli.value) || 0);

    try {
      const res = await fetch('https://rellmarket.vercel.app/api/trades/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          listing_id:   listingId,
          offered_item: offeredItem,
          offered_beli: offeredBeliVal,
          message:      document.getElementById('trade-message')?.value || null,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to send request');

      showToast('Trade request sent! 🎉');
      closeModal();
      tradeForm.reset();
      updateSummary();
    } catch (err) {
      showToast('Error: ' + err.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send Request 🏴‍☠️';
    }
  });
}

// ─── Item name → URL id helper ───────────────────────────────────────────────
function itemNameToId(name) {
  return name.toLowerCase().replace(/\s+/g, '-');
}

// ─── Fetch real listings from API ────────────────────────────────────────────
function initFetchListings() {
  const grid = document.getElementById('listing-grid');
  if (!grid) return;

  const PAGE_SIZE   = 20;
  let currentOffset = 0;
  let totalLoaded   = 0;
  let isFetching    = false;

  // Listing type toggle: default to 'selling', but honour ?type= URL param
  const urlTypeParam = new URLSearchParams(location.search).get('type');
  let activeListingType = (urlTypeParam === 'looking') ? 'looking' : 'selling';

  const emptyState  = document.getElementById('listing-empty');
  const loadMoreWrap = document.getElementById('load-more-wrap');
  const loadMoreBtn  = document.getElementById('load-more-btn');
  const countEl      = document.getElementById('listings-count');

  // Sync toggle button active state on init
  document.querySelectorAll('.listings-type-btn').forEach(btn => {
    btn.classList.toggle('listings-type-btn--active', btn.dataset.type === activeListingType);
  });

  // Wire type toggle buttons
  document.querySelectorAll('.listings-type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.dataset.type === activeListingType) return;
      activeListingType = btn.dataset.type;
      document.querySelectorAll('.listings-type-btn').forEach(b =>
        b.classList.toggle('listings-type-btn--active', b.dataset.type === activeListingType)
      );
      totalLoaded = 0;
      currentOffset = 0;
      grid.innerHTML = '';
      fetchPage(0);
    });
  });

  // Pre-fetch all item values for RV/demand display on cards
  const valuesMap = new Map();
  const valuesReady = fetch('https://rellmarket.vercel.app/api/values/get')
    .then(r => r.ok ? r.json() : null)
    .then(data => {
      console.log('[RV] /api/values/get response:', data);
      if (data?.items) {
        data.items.forEach(v => valuesMap.set((v.item_name || '').toLowerCase(), v));
        console.log('[RV] valuesMap populated with', valuesMap.size, 'items');
      }
    })
    .catch(err => console.error('[RV] fetch failed:', err));

  function auctionTimeLeft(endsAt) {
    const diff = new Date(endsAt) - Date.now();
    if (diff <= 0) return 'Ended';
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    if (h >= 48) return `${Math.floor(h / 24)}d left`;
    if (h >= 1)  return `${h}h ${m}m left`;
    return `${m}m left`;
  }

  function buildCardHTML(l) {
    const seller      = l.profiles?.roblox_username || l.profiles?.username || 'Trader';
    const rarityClass = l.rarity ? `listing-badge--${l.rarity}` : 'listing-badge--common';
    const rarityLabel = l.rarity ? l.rarity.charAt(0).toUpperCase() + l.rarity.slice(1) : '';
    const imgHTML     = l.image_url
      ? `<img src="${l.image_url}" alt="${l.item_name}" class="listing-card__img" />`
      : `<div class="listing-card__placeholder" style="--ph:#f0fdfa;">📦</div>`;
    const typeLabel   = [
      l.category ? l.category.charAt(0).toUpperCase() + l.category.slice(1) : '',
      l.fruit_type || ''
    ].filter(Boolean).join(' · ');

    // Auction listing
    if (l.price_type === 'auction') {
      const auction   = Array.isArray(l.auctions) ? l.auctions[0] : l.auctions;
      const cardUrl   = auction ? `auction.html?id=${auction.id}` : `auction.html?listing_id=${l.id}`;
      const curBid    = auction ? `${Number(auction.current_bid).toLocaleString()} Beli` : '—';
      const timeLeft  = auction ? auctionTimeLeft(auction.ends_at) : '';
      const auctionSortPrice = auction ? (Number(auction.current_bid) || Number(auction.starting_price) || '') : '';
      return `
        <article class="listing-card listing-card--auction" data-category="${l.category || ''}" data-rarity="${l.rarity || ''}" data-item-id="${l.id}" data-sort-price="${auctionSortPrice}">
          <a href="${cardUrl}" class="listing-card__img-wrap">
            ${imgHTML}
            ${rarityLabel ? `<span class="listing-badge ${rarityClass}">${rarityLabel}</span>` : ''}
            <span class="listing-badge listing-badge--auction">🔨 Auction</span>
          </a>
          <div class="listing-card__body">
            <p class="listing-card__type">${typeLabel}</p>
            <h3 class="listing-card__name"><a href="${cardUrl}" style="color:inherit;text-decoration:none;">${l.item_name}</a></h3>
            <p class="listing-card__seller">by <a href="profile.html?username=${encodeURIComponent(seller)}">${seller}</a></p>
            <div class="listing-card__footer listing-card__footer--auction">
              <div class="listing-card__auction-info">
                <span class="listing-card__auction-bid">${curBid}</span>
                <span class="listing-card__auction-time">${timeLeft}</span>
              </div>
              <a href="${cardUrl}" class="btn btn--trade-card btn--bid-card">Bid</a>
            </div>
          </div>
        </article>`;
    }

    // Standard listing
    const isLooking = l.listing_type === 'looking';
    const priceHTML = isLooking
      ? `<span class="listing-card__price listing-card__price--offer">Wanted</span>`
      : l.price
        ? `<span class="listing-card__price">${Number(l.price).toLocaleString()} Beli</span>`
        : `<span class="listing-card__price listing-card__price--offer">Make Offer</span>`;
    const itemUrl = `item.html?id=${itemNameToId(l.item_name)}&listing_id=${l.id}`;
    const standardSortPrice = (l.price && Number(l.price) > 0) ? Number(l.price) : '';

    // "Wants" chip row for selling listings — clean inline pills, max 2 visible
    const wantsArr = (!isLooking && Array.isArray(l.listing_wants) && l.listing_wants.length > 0) ? l.listing_wants : [];
    const WANTS_MAX = 2;
    const wantsRowHTML = wantsArr.length > 0
      ? `<div class="listing-card__wants">
          <span class="listing-card__wants-label">Wants</span>
          <div class="listing-card__wants-chips">
            ${wantsArr.slice(0, WANTS_MAX).map(w => {
              const icon  = wantsItemIcon(w.item_name, 20);
              const qtyHTML = w.quantity > 1
                ? `<span class="listing-card__wants-chip-qty">×${w.quantity}</span>`
                : '';
              return `<span class="listing-card__wants-chip">
                <span class="listing-card__wants-chip-icon">${icon}</span>
                <span class="listing-card__wants-chip-name">${w.item_name}</span>${qtyHTML}
              </span>`;
            }).join('')}
            ${wantsArr.length > WANTS_MAX ? `<span class="listing-card__wants-more">+${wantsArr.length - WANTS_MAX} more</span>` : ''}
          </div>
        </div>`
      : '';

    // RV + demand row
    const iv = valuesMap.get((l.item_name || '').toLowerCase());
    const demandHeart = getDemandHeart(iv?.demand_tier);
    const rvText = iv
      ? (iv.is_established ? `RV: ${iv.rv}` : 'RV: Unestablished')
      : '';
    const marketIcon = (!isLooking && iv?.is_established && l.price && l.price_type === 'fixed')
      ? getMarketIndicator(Number(l.price), iv.rv)
      : '';
    const rvRowHTML = (iv || rvText)
      ? `<div class="listing-card__rv">
          <span class="listing-card__rv-demand" title="${getDemandLabel(iv?.demand_tier)}">${demandHeart}</span>
          ${rvText ? `<span class="listing-card__rv-val">${rvText}</span>` : ''}
          ${marketIcon ? `<span class="listing-card__rv-market" title="${getMarketLabel(Number(l.price), iv?.rv)}">${marketIcon}</span>` : ''}
        </div>`
      : '';

    return `
      <article class="listing-card${isLooking ? ' listing-card--looking' : ''}" data-category="${l.category || ''}" data-rarity="${l.rarity || ''}" data-item-id="${l.id}" data-sort-price="${standardSortPrice}">
        <a href="${itemUrl}" class="listing-card__img-wrap">
          ${imgHTML}
          ${rarityLabel ? `<span class="listing-badge ${rarityClass}">${rarityLabel}</span>` : ''}
          ${isLooking ? `<span class="listing-badge listing-badge--looking">🔍 Looking For</span>` : ''}
        </a>
        <div class="listing-card__body">
          <p class="listing-card__type">${typeLabel}</p>
          <h3 class="listing-card__name"><a href="${itemUrl}" style="color:inherit;text-decoration:none;">${l.item_name}</a></h3>
          <p class="listing-card__seller">by <a href="profile.html?username=${encodeURIComponent(seller)}">${seller}</a></p>
          ${wantsRowHTML}
          ${rvRowHTML}
          <div class="listing-card__footer">
            ${priceHTML}
            <a href="${itemUrl}" class="btn btn--trade-card">${isLooking ? 'Offer' : 'Trade'}</a>
          </div>
        </div>
      </article>`;
  }

  function updateCount(hasMore) {
    if (!countEl) return;
    if (hasMore) {
      countEl.innerHTML = `Showing <strong>${totalLoaded}</strong> listings — more available`;
    } else {
      countEl.innerHTML = `Showing <strong>${totalLoaded}</strong> listing${totalLoaded !== 1 ? 's' : ''}`;
    }
  }

  function fetchPage(offset) {
    if (isFetching) return;
    isFetching = true;

    if (loadMoreBtn) {
      loadMoreBtn.disabled = true;
      loadMoreBtn.classList.add('is-loading');
      loadMoreBtn.textContent = '';
    }

    Promise.all([
      fetch(`https://rellmarket.vercel.app/api/listings/get?limit=${PAGE_SIZE}&offset=${offset}&listing_type=${activeListingType}`)
        .then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        }),
      valuesReady
    ])
      .then(([json]) => {
        const listings = json.listings || [];
        const hasMore  = json.hasMore === true;

        if (offset === 0 && listings.length === 0) {
          if (emptyState) emptyState.hidden = false;
          if (loadMoreWrap) loadMoreWrap.hidden = true;
          isFetching = false;
          return;
        }

        if (emptyState) emptyState.hidden = true;

        // First page: replace; subsequent pages: append
        if (offset === 0) {
          grid.innerHTML = listings.map(buildCardHTML).join('');
        } else {
          grid.insertAdjacentHTML('beforeend', listings.map(buildCardHTML).join(''));
        }

        totalLoaded   += listings.length;
        currentOffset  = offset + listings.length;

        updateCount(hasMore);
        applyListingFilters();
        initListingCardHearts();

        if (loadMoreWrap) loadMoreWrap.hidden = !hasMore;
        if (loadMoreBtn) {
          loadMoreBtn.disabled = false;
          loadMoreBtn.classList.remove('is-loading');
          loadMoreBtn.textContent = 'Load More';
        }
      })
      .catch(err => {
        console.log('API error:', err);
        if (loadMoreBtn) {
          loadMoreBtn.disabled = false;
          loadMoreBtn.classList.remove('is-loading');
          loadMoreBtn.textContent = 'Load More';
        }
      })
      .finally(() => { isFetching = false; });
  }

  // Wire Load More button
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', () => fetchPage(currentOffset));
  }

  // Initial load
  fetchPage(0);
}

// ─── Homepage mini-grids ─────────────────────────────────────────────────────
function initHomepageMiniGrids() {
  const mostTradedGrid = document.getElementById('most-traded-grid');
  const newItemsGrid   = document.getElementById('new-items-grid');
  if (!mostTradedGrid && !newItemsGrid) return;

  function buildMiniCard(l) {
    const itemId    = itemNameToId(l.item_name);
    const searchUrl = `listings.html?search=${encodeURIComponent(l.item_name)}`;
    const staticItem = (typeof ITEMS_DATA !== 'undefined') ? ITEMS_DATA[itemId] : null;
    const imgHTML = staticItem?.image
      ? `<img src="${staticItem.image}" alt="${l.item_name}" class="mini-card__img" />`
      : l.image_url
        ? `<img src="${l.image_url}" alt="${l.item_name}" class="mini-card__img" />`
        : `<div class="mini-card__placeholder" style="font-size:2rem;">📦</div>`;
    return `
      <article class="mini-card" data-item-name="${l.item_name.replace(/"/g, '&quot;')}">
        <a href="${searchUrl}" class="mini-card__img-wrap" tabindex="-1" aria-hidden="true">
          ${imgHTML}
        </a>
        <div class="mini-card__body">
          <a href="${searchUrl}" class="mini-card__name">${l.item_name}</a>
          <span class="mini-card__change" hidden></span>
          <a href="${searchUrl}" class="btn btn--mini-trade">Trade</a>
        </div>
      </article>`;
  }

  const placeholderCard = `
    <article class="mini-card mini-card--placeholder">
      <div class="mini-card__img-wrap" aria-hidden="true">
        <div class="mini-card__placeholder" style="font-size:2rem;">📦</div>
      </div>
      <div class="mini-card__body">
        <span class="mini-card__name">Be the first to list!</span>
        <a href="post-listing.html" class="btn btn--mini-trade">+ Add Listing</a>
      </div>
    </article>`;

  function fillGrid(grid, listings) {
    if (!grid) return;
    const cards = listings.slice(0, 4).map(buildMiniCard);
    while (cards.length < 4) cards.push(placeholderCard);
    grid.innerHTML = cards.join('');
  }

  const base = 'https://rellmarket.vercel.app/api/listings/get';
  Promise.all([
    fetch(`${base}?sort=popular&limit=4`).then(r => r.ok ? r.json() : null).catch(() => null),
    fetch(`${base}?limit=4`).then(r => r.ok ? r.json() : null).catch(() => null)
  ]).then(([popularJson, newJson]) => {
    fillGrid(mostTradedGrid, popularJson?.listings || []);
    fillGrid(newItemsGrid,   newJson?.listings   || []);
    populateMostTradedChanges(mostTradedGrid);
  });

  function populateMostTradedChanges(grid) {
    if (!grid) return;
    const cards = grid.querySelectorAll('.mini-card[data-item-name]');
    const sevenDaysAgo = Date.now() - 7 * 24 * 3600 * 1000;
    cards.forEach(card => {
      const name = card.dataset.itemName;
      if (!name) return;
      fetch(`/api/values/history?item_name=${encodeURIComponent(name)}`)
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          const hist = (data?.history || []).filter(h => new Date(h.recorded_at).getTime() >= sevenDaysAgo);
          if (hist.length < 2) return;
          const oldest = Number(hist[0].rv);
          const newest = Number(hist[hist.length - 1].rv);
          if (!oldest || !isFinite(oldest)) return;
          const pct = ((newest - oldest) / oldest) * 100;
          if (!isFinite(pct)) return;
          const el = card.querySelector('.mini-card__change');
          if (!el) return;
          const sign = pct > 0 ? '+' : '';
          el.textContent = `${sign}${pct.toFixed(1)}%`;
          el.classList.toggle('mini-card__change--up', pct >= 0);
          el.classList.toggle('mini-card__change--down', pct < 0);
          el.hidden = false;
        })
        .catch(() => {});
    });
  }

  // ── Scroll-row sections ──────────────────────────────────────────────────────
  const latestRow     = document.getElementById('latest-listed-row');
  const auctionsRow   = document.getElementById('auctions-soon-row');
  const lookingForRow = document.getElementById('looking-for-row');

  if (!latestRow && !auctionsRow && !lookingForRow) return;

  function auctionTimeLeft(endsAt) {
    const diff = new Date(endsAt) - Date.now();
    if (diff <= 0) return 'Ended';
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    if (h >= 48) return `${Math.floor(h / 24)}d left`;
    if (h >= 1)  return `${h}h ${m}m left`;
    return `${m}m left`;
  }

  function buildScrollCard(l) {
    const itemId  = itemNameToId(l.item_name);
    const isAuction = l.price_type === 'auction';
    const auctionId = isAuction && (Array.isArray(l.auctions) ? l.auctions[0]?.id : l.auctions?.id);
    const itemUrl = isAuction
      ? (auctionId ? `auction.html?id=${auctionId}` : `auction.html?listing_id=${l.id}`)
      : `item.html?id=${itemId}&listing_id=${l.id}`;
    const staticItem = (typeof ITEMS_DATA !== 'undefined') ? ITEMS_DATA[itemId] : null;
    const imgSrc = staticItem?.image || l.image_url || '';
    const imgHTML = imgSrc
      ? `<img src="${imgSrc}" alt="${l.item_name}" class="scroll-card__img" />`
      : `<div class="scroll-card__placeholder">📦</div>`;
    const rarityClass = l.rarity ? `listing-badge--${l.rarity}` : '';
    const rarityLabel = l.rarity ? l.rarity.charAt(0).toUpperCase() + l.rarity.slice(1) : '';

    const isLooking = l.listing_type === 'looking';
    let priceHTML;
    if (isLooking) {
      priceHTML = `<span class="scroll-card__price scroll-card__price--wanted">Wanted</span>`;
    } else if (l.price_type === 'auction') {
      const auction = Array.isArray(l.auctions) ? l.auctions[0] : l.auctions;
      const curBid  = auction ? `${Number(auction.current_bid || auction.starting_price).toLocaleString()} Beli` : '—';
      const timeLeft = auction ? auctionTimeLeft(auction.ends_at) : '';
      priceHTML = `<span class="scroll-card__price scroll-card__price--auction">🔨 ${curBid}</span>
                   <span class="scroll-card__time">${timeLeft}</span>`;
    } else if (l.price) {
      priceHTML = `<span class="scroll-card__price">${Number(l.price).toLocaleString()} Beli</span>`;
    } else {
      priceHTML = `<span class="scroll-card__price scroll-card__price--offer">Make Offer</span>`;
    }

    return `
      <article class="scroll-card">
        <a href="${itemUrl}" class="scroll-card__img-wrap">
          ${imgHTML}
          ${rarityLabel ? `<span class="listing-badge ${rarityClass} scroll-card__badge">${rarityLabel}</span>` : ''}
          ${isLooking ? `<span class="listing-badge listing-badge--looking scroll-card__badge">🔍</span>` : ''}
        </a>
        <div class="scroll-card__body">
          <a href="${itemUrl}" class="scroll-card__name">${l.item_name}</a>
          <div class="scroll-card__meta">${priceHTML}</div>
        </div>
      </article>`;
  }

  const scrollPlaceholder = `
    <article class="scroll-card scroll-card--placeholder">
      <div class="scroll-card__img-wrap" aria-hidden="true">
        <div class="scroll-card__placeholder">📦</div>
      </div>
      <div class="scroll-card__body">
        <span class="scroll-card__name">Be the first!</span>
        <a href="post-listing.html" class="scroll-card__meta" style="color:var(--color-accent);font-size:.8rem;">+ Add Listing</a>
      </div>
    </article>`;

  function fillScrollRow(row, listings) {
    if (!row) return;
    if (listings.length === 0) {
      row.innerHTML = Array(4).fill(scrollPlaceholder).join('');
      return;
    }
    row.innerHTML = listings.map(buildScrollCard).join('');
  }

  function refreshLatestListed() {
    if (!latestRow) return;
    fetch(`${base}?limit=10`)
      .then(r => r.ok ? r.json() : null)
      .then(json => fillScrollRow(latestRow, json?.listings || []))
      .catch(() => {});
  }

  Promise.all([
    auctionsRow ? fetch(`${base}?price_type=auction&limit=10`).then(r => r.ok ? r.json() : null).catch(() => null) : Promise.resolve(null),
    lookingForRow ? fetch(`${base}?listing_type=looking&limit=10`).then(r => r.ok ? r.json() : null).catch(() => null) : Promise.resolve(null),
  ]).then(([auctionsJson, lookingJson]) => {
    // Only show auctions that haven't ended yet
    const now = new Date();
    const activeAuctions = (auctionsJson?.listings || []).filter(l => {
      const a = Array.isArray(l.auctions) ? l.auctions[0] : l.auctions;
      if (!a) return false;
      if (new Date(a.ends_at) <= now) return false;
      if (a.status && a.status !== 'active') return false;
      return true;
    });
    fillScrollRow(auctionsRow, activeAuctions);

    fillScrollRow(lookingForRow, lookingJson?.listings || []);
  });

  refreshLatestListed();
  setInterval(refreshLatestListed, 30000);
}

// ─── Homepage Live Stats Bar ─────────────────────────────────────────────────
function initHomeStatsBar() {
  const bar = document.getElementById('stats-bar');
  if (!bar || typeof SUPABASE_URL === 'undefined' || !window.supabase) return;

  const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const fmt = n => Number(n || 0).toLocaleString('en-US');

  function animateCount(el, target, duration = 1000) {
    if (!el) return;
    target = Number(target) || 0;
    const start = performance.now();
    const from = 0;
    function tick(now) {
      const t = Math.min(1, (now - start) / duration);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3);
      const value = Math.round(from + (target - from) * eased);
      el.textContent = fmt(value);
      if (t < 1) requestAnimationFrame(tick);
      else el.textContent = fmt(target);
    }
    requestAnimationFrame(tick);
  }

  async function loadStats() {
    try {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const [totalTrades, activeListings, itemsTraded, todayTrades] = await Promise.all([
        client.from('trade_requests').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
        client.from('listings').select('id', { count: 'exact', head: true }).eq('is_active', true),
        client.from('trade_requests').select('offered_item, listings(item_name)').eq('status', 'completed'),
        client.from('trade_requests').select('id', { count: 'exact', head: true })
          .eq('status', 'completed').gte('created_at', startOfDay.toISOString()),
      ]);

      const distinctItems = new Set();
      (itemsTraded.data || []).forEach(r => {
        if (r.offered_item) distinctItems.add(r.offered_item.trim());
        const ln = r.listings?.item_name;
        if (ln) distinctItems.add(ln.trim());
      });
      distinctItems.delete('');

      animateCount(document.getElementById('stat-total-trades'),   totalTrades.count);
      animateCount(document.getElementById('stat-active-listings'), activeListings.count);
      animateCount(document.getElementById('stat-items-traded'),    distinctItems.size);
      animateCount(document.getElementById('stat-today-trades'),    todayTrades.count);
    } catch (err) {
      console.error('[stats-bar] failed:', err);
    }
  }

  loadStats();
}

// ─── Homepage Featured Listings ──────────────────────────────────────────────
function initFeaturedListings() {
  const section = document.getElementById('featured-listings-section');
  const grid    = document.getElementById('featured-listings-grid');
  if (!section || !grid) return;

  function buildFeaturedCard(l) {
    const itemId    = itemNameToId(l.item_name);
    const isAuction = l.price_type === 'auction';
    const auctionId = isAuction && (Array.isArray(l.auctions) ? l.auctions[0]?.id : l.auctions?.id);
    const itemUrl   = isAuction
      ? (auctionId ? `auction.html?id=${auctionId}` : `auction.html?listing_id=${l.id}`)
      : `item.html?id=${itemId}&listing_id=${l.id}`;
    const staticItem = (typeof ITEMS_DATA !== 'undefined') ? ITEMS_DATA[itemId] : null;
    const imgSrc = staticItem?.image || l.image_url || '';
    const imgHTML = imgSrc
      ? `<img src="${imgSrc}" alt="${l.item_name}" class="listing-card__img" />`
      : `<div class="listing-card__placeholder">📦</div>`;

    const rarityClass = l.rarity ? `listing-badge--${l.rarity}` : '';
    const rarityLabel = l.rarity ? l.rarity.charAt(0).toUpperCase() + l.rarity.slice(1) : '';

    const seller = l.profiles?.roblox_username || l.profiles?.username || 'Trader';

    let priceHTML;
    if (l.price_type === 'auction') {
      const auction = Array.isArray(l.auctions) ? l.auctions[0] : l.auctions;
      const curBid  = auction ? `${Number(auction.current_bid || auction.starting_price).toLocaleString()} Beli` : '—';
      priceHTML = `<span class="listing-card__price listing-card__price--auction">🔨 ${curBid}</span>`;
    } else if (l.price) {
      priceHTML = `<span class="listing-card__price">${Number(l.price).toLocaleString()} Beli</span>`;
    } else {
      priceHTML = `<span class="listing-card__price listing-card__price--offer">Make Offer</span>`;
    }

    return `
      <article class="listing-card listing-card--featured" data-item-id="${l.id}">
        <a href="${itemUrl}" class="listing-card__img-wrap">
          ${imgHTML}
          ${rarityLabel ? `<span class="listing-badge ${rarityClass}">${rarityLabel}</span>` : ''}
          <span class="listing-badge listing-badge--featured">⭐ Featured</span>
        </a>
        <div class="listing-card__body">
          <h3 class="listing-card__name"><a href="${itemUrl}" style="color:inherit;text-decoration:none;">${l.item_name}</a></h3>
          <p class="listing-card__seller">by <a href="profile.html?username=${encodeURIComponent(seller)}">${seller}</a></p>
          <div class="listing-card__footer">
            ${priceHTML}
            <a href="${itemUrl}" class="btn btn--trade-card">Trade</a>
          </div>
        </div>
      </article>`;
  }

  // Always show the section during debug so we can confirm it renders.
  section.hidden = false;
  grid.innerHTML = '<p style="color:var(--color-text-muted);padding:1rem 0;">Loading featured listings…</p>';

  fetch('https://rellmarket.vercel.app/api/listings/get?featured=true&limit=4')
    .then(r => {
      console.log('[featured listings] response status:', r.status);
      return r.ok ? r.json() : r.text().then(t => { console.error('[featured listings] error body:', t); return null; });
    })
    .then(json => {
      console.log('[featured listings] payload:', json);
      const listings = (json?.listings || []).filter(l => l.is_active !== false);
      console.log('[featured listings] active count:', listings.length);
      if (!listings.length) {
        grid.innerHTML = '<p style="color:var(--color-text-muted);padding:1rem 0;">No featured listings yet — members can feature one of their listings from My Listings.</p>';
        return;
      }
      grid.innerHTML = listings.map(buildFeaturedCard).join('');
    })
    .catch(err => {
      console.error('[featured listings] failed:', err);
      grid.innerHTML = '<p style="color:var(--color-text-muted);padding:1rem 0;">Couldn\u2019t load featured listings.</p>';
    });
}

// ─── Homepage: Browse by Category ────────────────────────────────────────────
function initCategoryGrid() {
  const grid = document.getElementById('category-grid');
  if (!grid) return;

  const categories = ['fruit', 'armor', 'weapon', 'beli', 'sword', 'item', 'service'];
  const base = 'https://rellmarket.vercel.app/api/listings/get';

  Promise.all(
    categories.map(cat =>
      fetch(`${base}?count_only=true&category=${cat}`)
        .then(r => r.ok ? r.json() : null)
        .catch(() => null)
    )
  ).then(results => {
    results.forEach((json, i) => {
      const el = document.getElementById(`cat-count-${categories[i]}`);
      if (!el) return;
      const n = json?.count ?? 0;
      el.textContent = `${n.toLocaleString()} listing${n !== 1 ? 's' : ''}`;
    });
  });
}

// ─── Homepage: Featured Traders ───────────────────────────────────────────────
function initFeaturedTraders() {
  const section = document.getElementById('featured-traders-section');
  const row     = document.getElementById('featured-traders-row');
  if (!section || !row) return;

  fetch('https://rellmarket.vercel.app/api/traders/featured')
    .then(r => r.ok ? r.json() : null)
    .catch(() => null)
    .then(json => {
      const traders = json?.traders || [];
      if (traders.length === 0) return; // section stays hidden

      section.hidden = false;
      row.innerHTML = traders.map(t => {
        const name    = t.roblox_username || t.username || 'Trader';
        const avatar  = t.avatar_url
          ? `<img src="${t.avatar_url}" alt="${name}" class="trader-card__avatar" />`
          : `<div class="trader-card__avatar trader-card__avatar--fallback">👤</div>`;
        const badges  = [
          t.is_verified ? `<span class="badge badge--verified">✔ Verified</span>` : '',
          t.is_trusted  ? `<span class="badge badge--trusted">⭐ Trusted</span>`  : '',
        ].filter(Boolean).join('');
        const count   = t.listing_count || 0;
        return `
          <article class="trader-card">
            <a href="profile.html?username=${encodeURIComponent(name)}" class="trader-card__avatar-wrap">
              ${avatar}
            </a>
            <div class="trader-card__body">
              <a href="profile.html?username=${encodeURIComponent(name)}" class="trader-card__name">${name}</a>
              ${badges ? `<div class="trader-card__badges">${badges}</div>` : ''}
              <p class="trader-card__listings">${count} active listing${count !== 1 ? 's' : ''}</p>
              <a href="profile.html?username=${encodeURIComponent(name)}" class="btn btn--ghost trader-card__btn">View Profile</a>
            </div>
          </article>`;
      }).join('');
    });
}

// ─── My Listings dashboard ───────────────────────────────────────────────────
async function initMyListings() {
  const grid = document.getElementById('my-listings-grid');
  if (!grid) return; // only runs on my-listings.html

  const emptyState   = document.getElementById('active-empty');
  const statActive   = document.querySelectorAll('.stat-card__value')[0];
  const statWatchlist= document.querySelectorAll('.stat-card__value')[2];

  // Watchlist count from localStorage
  try {
    const wl = JSON.parse(localStorage.getItem('rellmarket-watchlist')) || [];
    if (statWatchlist) statWatchlist.textContent = wl.length;
  } catch (e) {}

  // Supabase client (reuse global from auth.js if ready, else create one)
  const client = (typeof supabaseClient !== 'undefined')
    ? supabaseClient
    : window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Auth guard — redirect to login if no session
  const { data: { session } } = await client.auth.getSession();
  if (!session) {
    window.location.href = 'login.html';
    return;
  }

  const token  = session.access_token;
  const userId = session.user.id;

  // ── Profile section ──
  let canFeature = false;
  try {
    const { data: profile, error: profileErr } = await client
      .from('profiles')
      .select('username, roblox_username, avatar_url, discord_id, discord_username, is_member, role')
      .eq('id', userId)
      .single();

    console.log('[my-listings] profile fetch →', { profile, error: profileErr });
    if (profileErr) console.error('[my-listings] profile error:', profileErr);

    canFeature = !!profile && (profile.role === 'admin' || profile.is_member === true);
    console.log('[my-listings] canFeature =', canFeature, '(role:', profile?.role, ', is_member:', profile?.is_member, ')');

    if (profile) {
      const nameEl   = document.querySelector('.profile-info__name');
      const avatarEl = document.querySelector('.profile-avatar');
      if (nameEl) nameEl.textContent = profile.roblox_username || profile.username || 'Pirate';
      if (avatarEl && profile.avatar_url) {
        avatarEl.innerHTML = `<img src="${profile.avatar_url}" alt="Avatar"
          style="width:100%;height:100%;border-radius:50%;object-fit:cover;" />`;
      }

      // Discord link status
      const discordStatus  = document.getElementById('profile-discord-status');
      const discordLinkBtn = document.getElementById('discord-link-btn');
      if (profile.discord_username) {
        if (discordStatus) discordStatus.textContent = `💬 Discord: ${profile.discord_username}`;
        if (discordLinkBtn) discordLinkBtn.style.display = 'none';
      } else {
        if (discordStatus) discordStatus.textContent = '';
        if (discordLinkBtn) {
          discordLinkBtn.style.display = '';
          // Pass session token as state so the callback can identify the user
          discordLinkBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const { data: { session } } = await client.auth.getSession();
            if (session) {
              window.location.href = `/api/auth/discord?token=${encodeURIComponent(session.access_token)}`;
            } else {
              window.location.href = '/api/auth/discord';
            }
          });
        }
      }

      // Show toast if just connected via Discord OAuth redirect
      if (new URLSearchParams(window.location.search).get('discord') === 'connected') {
        showToast('Discord account linked! 💬');
        history.replaceState(null, '', 'my-listings.html');
      }
    }
  } catch (e) {}

  // ── Fetch this user's listings ──
  async function fetchMyListings() {
    const res  = await fetch(
      `https://rellmarket.vercel.app/api/listings/get?user_id=${userId}&limit=100`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    const json = await res.json();
    return json.listings || [];
  }

  // ── Build one listing row card ──
  function renderListing(l) {
    const itemId     = itemNameToId(l.item_name);
    const staticItem = (typeof ITEMS_DATA !== 'undefined') ? ITEMS_DATA[itemId] : null;
    const imgSrc     = staticItem?.image || l.image_url || '';
    const imgHTML    = imgSrc
      ? `<img src="${imgSrc}" alt="${l.item_name}" class="my-listing-img" />`
      : `<div class="my-listing-img my-listing-img--placeholder">📦</div>`;

    const priceText  = l.price_type === 'fixed' && l.price
      ? `${Number(l.price).toLocaleString()} Beli`
      : 'Make Offer';
    const rarityLabel = l.rarity
      ? l.rarity.charAt(0).toUpperCase() + l.rarity.slice(1)
      : '';
    const rarityBadge = rarityLabel
      ? `<span class="listing-badge listing-badge--${l.rarity}" style="position:static;">${rarityLabel}</span>`
      : '';
    const statusBadge = l.is_active
      ? '<span class="my-listing-status my-listing-status--active">Active</span>'
      : '<span class="my-listing-status my-listing-status--inactive">Inactive</span>';

    const article = document.createElement('article');
    article.className = 'my-listing-row';
    article.dataset.listingId = l.id;
    // Membership gate temporarily disabled — show Feature button on every active listing.
    const featureBtnHTML = l.is_active
      ? (l.is_featured
          ? `<button class="btn my-listing-feature" data-id="${l.id}" data-state="featured">★ Unfeature</button>`
          : `<button class="btn my-listing-feature" data-id="${l.id}" data-state="unfeatured">⭐ Feature</button>`)
      : '';
    article.innerHTML = `
      ${imgHTML}
      <div class="my-listing-info">
        <p class="my-listing-name">${l.item_name}${l.is_featured ? ' <span class="my-listing-feat-dot" title="Featured">⭐</span>' : ''}</p>
        <p class="my-listing-meta">${[rarityLabel, priceText, l.created_at ? timeAgo(l.created_at) : ''].filter(Boolean).join(' · ')}</p>
      </div>
      <div class="my-listing-right">
        ${statusBadge}
        ${rarityBadge}
        ${featureBtnHTML}
        <button class="btn btn--login my-listing-edit" data-id="${l.id}">Edit</button>
        <button class="btn my-listing-delete" data-id="${l.id}"
          style="background:#ef4444;color:#fff;border-color:transparent;">Delete</button>
      </div>`;

    // Feature / Unfeature
    const featureBtn = article.querySelector('.my-listing-feature');
    if (featureBtn) {
      featureBtn.addEventListener('click', async () => {
        const action = featureBtn.dataset.state === 'featured' ? 'unfeature' : 'feature';
        featureBtn.disabled = true;
        try {
          const r = await fetch('https://rellmarket.vercel.app/api/listings/feature', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ listing_id: l.id, action }),
          });
          const json = await r.json();
          if (!r.ok) throw new Error(json.error || `HTTP ${r.status}`);
          showToast(action === 'feature' ? 'Listing featured ⭐' : 'Listing unfeatured.');
          renderAll();
        } catch (err) {
          showToast('Error: ' + err.message);
          featureBtn.disabled = false;
        }
      });
    }

    // Delete
    article.querySelector('.my-listing-delete').addEventListener('click', async () => {
      if (!confirm(`Delete "${l.item_name}"? This cannot be undone.`)) return;
      try {
        const r = await fetch(
          `https://rellmarket.vercel.app/api/listings/delete?id=${l.id}`,
          { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } }
        );
        if (!r.ok) throw new Error((await r.json()).error);
        article.remove();
        const remaining = grid.querySelectorAll('.my-listing-row').length;
        if (statActive) statActive.textContent = remaining;
        if (remaining === 0) emptyState.style.display = '';
        showToast('Listing deleted.');
      } catch (err) {
        showToast('Error: ' + err.message);
      }
    });

    // Edit
    article.querySelector('.my-listing-edit').addEventListener('click', () => openEditModal(l));

    return article;
  }

  // ── Render all listings ──
  async function renderAll() {
    let listings;
    try { listings = await fetchMyListings(); }
    catch (e) { listings = []; showToast('Failed to load listings.'); }

    grid.innerHTML = '';
    if (listings.length === 0) {
      emptyState.style.display = '';
      if (statActive) statActive.textContent = 0;
      return;
    }
    emptyState.style.display = 'none';
    listings.forEach(l => grid.appendChild(renderListing(l)));
    if (statActive) statActive.textContent = listings.filter(l => l.is_active).length;
  }

  // ── Edit modal wiring ──
  const modal           = document.getElementById('edit-listing-modal');
  const editForm        = document.getElementById('edit-listing-form');
  const editId          = document.getElementById('edit-listing-id');
  const editName        = document.getElementById('edit-item-name');
  const editPrice       = document.getElementById('edit-price');
  const editBeliWrap    = document.getElementById('edit-beli-wrap');
  const editDesc        = document.getElementById('edit-description');
  const editIsActive    = document.getElementById('edit-is-active');
  const editPriceRadios = editForm.querySelectorAll('input[name="edit-price-type"]');

  editPriceRadios.forEach(r => {
    r.addEventListener('change', () => {
      editBeliWrap.classList.toggle('is-visible', r.value === 'fixed' && r.checked);
    });
  });

  function openEditModal(l) {
    editId.value        = l.id;
    editName.value      = l.item_name   || '';
    editDesc.value      = l.description || '';
    editIsActive.checked = l.is_active  !== false;
    editPrice.value     = l.price       || '';
    const pt = l.price_type === 'fixed' ? 'fixed' : 'offer';
    editForm.querySelector(`input[name="edit-price-type"][value="${pt}"]`).checked = true;
    editBeliWrap.classList.toggle('is-visible', pt === 'fixed');
    modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function closeEditModal() {
    modal.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  document.getElementById('edit-modal-close').addEventListener('click', closeEditModal);
  document.getElementById('edit-modal-cancel').addEventListener('click', closeEditModal);
  modal.addEventListener('click', e => { if (e.target === modal) closeEditModal(); });

  editForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const saveBtn = document.getElementById('edit-modal-save');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving…';
    const priceType = editForm.querySelector('input[name="edit-price-type"]:checked').value;
    try {
      const r = await fetch(
        `https://rellmarket.vercel.app/api/listings/update?id=${editId.value}`,
        {
          method:  'PATCH',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            item_name:   editName.value,
            price:       priceType === 'fixed' && editPrice.value ? Number(editPrice.value) : null,
            price_type:  priceType,
            description: editDesc.value || null,
            is_active:   editIsActive.checked,
          }),
        }
      );
      if (!r.ok) throw new Error((await r.json()).error);
      showToast('Listing updated! ✅');
      closeEditModal();
      renderAll();
    } catch (err) {
      showToast('Error: ' + err.message);
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save Changes';
    }
  });

  renderAll();
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

// ─── Report listing ───────────────────────────────────────────────────────────
function initReportListing() {
  const reportBtn = document.getElementById('report-btn');
  if (!reportBtn) return;

  // Hide report button if viewer is the seller
  async function checkAndHideReport() {
    const params = new URLSearchParams(window.location.search);
    const listing_id = params.get('listing_id');
    if (!listing_id) return;
    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (!session) return;
      const res = await fetch(`https://rellmarket.vercel.app/api/listings/getone?id=${listing_id}`);
      const json = await res.json();
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (json.listing && user && json.listing.user_id === user.id) {
        reportBtn.style.display = 'none';
      }
    } catch (e) {}
  }
  checkAndHideReport();

  reportBtn.addEventListener('click', async (e) => {
    e.preventDefault();

    // Remove existing modal if any
    const existing = document.getElementById('report-modal');
    if (existing) existing.remove();

    // Create modal
    const modal = document.createElement('div');
    modal.id = 'report-modal';
    modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.55);z-index:9999;display:flex;align-items:center;justify-content:center;padding:1.5rem;';
    modal.innerHTML = `
      <div style="background:#fff;border-radius:12px;padding:1.5rem;width:100%;max-width:420px;box-shadow:0 8px 32px rgba(0,0,0,0.18);">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
          <h3 style="font-size:1.1rem;font-weight:800;">🚩 Report Listing</h3>
          <button id="report-close" style="background:none;border:none;font-size:1.3rem;cursor:pointer;">×</button>
        </div>
        <label style="display:block;font-size:.85rem;font-weight:600;margin-bottom:.4rem;">Reason</label>
        <select id="report-reason" style="width:100%;padding:.6rem;border:1.5px solid #e2e8f0;border-radius:6px;font-size:.9rem;margin-bottom:1rem;">
          <option value="">Select a reason...</option>
          <option value="scam">Scam</option>
          <option value="fake">Fake listing</option>
          <option value="wrong_price">Wrong price</option>
          <option value="inappropriate">Inappropriate</option>
          <option value="other">Other</option>
        </select>
        <label style="display:block;font-size:.85rem;font-weight:600;margin-bottom:.4rem;">Details (optional)</label>
        <textarea id="report-details" style="width:100%;padding:.6rem;border:1.5px solid #e2e8f0;border-radius:6px;font-size:.9rem;resize:vertical;min-height:80px;margin-bottom:1rem;" placeholder="Any additional details..."></textarea>
        <button id="report-submit" style="width:100%;background:#0d9488;color:#fff;border:none;border-radius:8px;padding:.75rem;font-size:.95rem;font-weight:700;cursor:pointer;">Submit Report</button>
      </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('report-close').onclick = () => modal.remove();
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };

    document.getElementById('report-submit').onclick = async () => {
      const reason = document.getElementById('report-reason').value;
      if (!reason) { showToast('Please select a reason'); return; }

      const params = new URLSearchParams(window.location.search);
      const listing_id = params.get('listing_id');

      try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        const token = session?.access_token;
        const res = await fetch('https://rellmarket.vercel.app/api/listings/report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ listing_id, reason })
        });
        const json = await res.json();
        if (json.success) {
          modal.remove();
          showToast('Report submitted. We will review it shortly.');
        } else {
          showToast('Error: ' + json.error);
        }
      } catch (err) {
        showToast('Something went wrong. Please try again.');
      }
    };
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
            <p class="listing-card__seller">by <a href="profile.html?username=${encodeURIComponent(item.seller)}">${item.seller}</a></p>
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

// ─── Seller name — now a profile link; no copy needed ────────────────────────
function initSellerCopy() {
  // Seller is rendered as an <a> tag; href is set by populateItemPage().
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

