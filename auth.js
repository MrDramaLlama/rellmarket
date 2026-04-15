'use strict';

// Initialize Supabase client
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── Sign Up ──────────────────────────────────────────────────────
async function handleSignUp(email, password, username) {
  const { data, error } = await supabaseClient.auth.signUp({ email, password });
  if (error) return { error: error.message };

  // Create profile
  if (data.user) {
    await supabaseClient.from('profiles').insert({
      id: data.user.id,
      username: username,
    });
  }
  return { success: true };
}

// ── Log In ───────────────────────────────────────────────────────
async function handleLogin(email, password) {
  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };
  return { success: true, user: data.user };
}

// ── Log Out ──────────────────────────────────────────────────────
async function handleLogout() {
  await supabaseClient.auth.signOut();
  window.location.href = 'index.html';
}

// ── Get current user ─────────────────────────────────────────────
async function getCurrentUser() {
  const { data: { user } } = await supabaseClient.auth.getUser();
  return user;
}

// ── Update navbar based on auth state ────────────────────────────
async function updateNavbar() {
  const currentPage = window.location.pathname;
  if (currentPage.includes('login.html') || currentPage.includes('signup.html')) return;

  const user = await getCurrentUser();
  const loginBtn = document.querySelector('.btn--login');
  const signupBtn = document.querySelector('.btn--signup');

  if (user) {
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('roblox_username, username, avatar_url, role')
      .eq('id', user.id)
      .single();
    const name = profile?.roblox_username || profile?.username || 'Account';

    if (signupBtn) signupBtn.style.display = 'none';

    // Extract token once, shared between all fetch calls
    let token = null;
    try {
      token = (await supabaseClient.auth.getSession()).data.session?.access_token;
    } catch (e) {}

    // Check pending trades
    let pending = 0;
    try {
      const res = await fetch('https://rellmarket.vercel.app/api/trades/get?type=incoming', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      pending = (json.trades || []).filter(t => t.status === 'pending').length;
    } catch (e) {}

    // Fetch notifications
    let notifications = [];
    let unreadCount = 0;
    try {
      const notifRes = await fetch('/api/notifications/get', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const notifJson = await notifRes.json();
      notifications = notifJson.notifications || [];
      unreadCount = notifications.filter(n => !n.is_read).length;
    } catch (e) {}

    // Replace the login button with a dropdown wrapper
    if (loginBtn) {
      const tradesBadgeHTML = pending > 0
        ? `<span class="nav-trade-badge">${pending}</span>`
        : '';

      const wrapper = document.createElement('div');
      wrapper.className = 'nav-dd user-dd';
      wrapper.style.position = 'relative';
      wrapper.innerHTML = `
        <button class="btn btn--login nav-dd__trigger user-dd__trigger" aria-haspopup="true">
          <span class="nav-dd__chevron">▾</span>
        </button>
        <div class="nav-dd__panel user-dd__panel">
          <a href="profile.html?username=${encodeURIComponent(name)}" class="nav-dd__item">👤 My Profile</a>
          <a href="my-listings.html" class="nav-dd__item">📋 My Listings</a>
          <a href="trades.html" class="nav-dd__item">🤝 Trade Requests ${tradesBadgeHTML}</a>
          <a href="watchlist.html" class="nav-dd__item">❤️ Watchlist</a>
          <div class="nav-dd__divider"></div>
          <button class="nav-dd__item nav-dd__item--btn user-dd__logout">🚪 Log Out</button>
        </div>`;

      loginBtn.parentNode.replaceChild(wrapper, loginBtn);

      // Build notification bell
      const bellWrapper = document.createElement('div');
      bellWrapper.className = 'nav-dd notif-dd';
      bellWrapper.style.position = 'relative';
      const last5 = notifications.slice(0, 5);
      const notifItemsHTML = last5.length
        ? last5.map(n => `
          <a href="${n.link || '#'}" class="nav-notif__item${n.is_read ? '' : ' nav-notif__item--unread'}">
            <span class="nav-notif__title">${n.title}</span>
            <span class="nav-notif__msg">${n.message}</span>
            <span class="nav-notif__time">${timeAgo(n.created_at)}</span>
          </a>`).join('')
        : '<p class="nav-notif__empty">No notifications</p>';

      bellWrapper.innerHTML = `
        <button class="btn nav-bell__trigger" aria-haspopup="true">
          🔔${unreadCount > 0 ? `<span class="nav-bell__badge">${unreadCount}</span>` : ''}
        </button>
        <div class="nav-dd__panel notif-dd__panel">
          <div class="nav-notif__header">
            <span>Notifications</span>
            <button class="nav-notif__mark-read">Mark all read</button>
          </div>
          <div class="nav-notif__list">${notifItemsHTML}</div>
        </div>`;

      wrapper.parentNode.insertBefore(bellWrapper, wrapper);

      const bellTrigger = bellWrapper.querySelector('.nav-bell__trigger');
      bellTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        bellWrapper.classList.toggle('is-open');
        wrapper.classList.remove('is-open');
      });

      bellWrapper.querySelector('.nav-notif__mark-read').addEventListener('click', async (e) => {
        e.stopPropagation();
        try {
          await fetch('/api/notifications/read', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({})
          });
        } catch (err) {}
        bellWrapper.querySelectorAll('.nav-notif__item--unread').forEach(el => el.classList.remove('nav-notif__item--unread'));
        const badge = bellWrapper.querySelector('.nav-bell__badge');
        if (badge) badge.remove();
      });

      document.addEventListener('click', () => bellWrapper.classList.remove('is-open'));

      // Build trigger button content: avatar (or fallback emoji) + name + chevron
      const trigger = wrapper.querySelector('.user-dd__trigger');
      const chevron = trigger.querySelector('.nav-dd__chevron');
      if (profile?.avatar_url) {
        const avatar = document.createElement('img');
        avatar.src = profile.avatar_url;
        avatar.alt = name;
        avatar.style.cssText = 'width:24px;height:24px;border-radius:50%;object-fit:cover;margin-right:6px;vertical-align:middle;';
        trigger.insertBefore(avatar, chevron);
      } else {
        const fallback = document.createElement('span');
        fallback.textContent = '👤 ';
        trigger.insertBefore(fallback, chevron);
      }
      const nameSpan = document.createElement('span');
      nameSpan.textContent = name;
      trigger.insertBefore(nameSpan, chevron);

      if (profile?.role === 'admin') {
        const adminItem = document.createElement('a');
        adminItem.href = 'admin.html';
        adminItem.className = 'nav-dd__item';
        adminItem.innerHTML = '⚙️ Admin Panel';
        const divider = wrapper.querySelector('.nav-dd__divider');
        wrapper.querySelector('.nav-dd__panel').insertBefore(adminItem, divider);
      }

      wrapper.querySelector('.user-dd__logout').addEventListener('click', handleLogout);

      // Toggle dropdown on trigger click; close on outside click
      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        wrapper.classList.toggle('is-open');
      });
      document.addEventListener('click', () => wrapper.classList.remove('is-open'));
    }
  }
}

// ── Load user profile on my-listings.html ────────────────────────
async function loadUserProfile() {
  if (!document.querySelector('.dashboard-profile')) return;

  const user = await getCurrentUser();
  if (!user) {
    window.location.href = 'login.html';
    return;
  }

  // Fetch profile from Supabase
  const { data: profile } = await supabaseClient
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profile) {
    const nameEl = document.querySelector('.profile-info__name');
    const avatarEl = document.querySelector('.profile-avatar');
    if (nameEl) nameEl.textContent = profile.roblox_username || profile.username || 'Pirate';
    if (avatarEl && profile.avatar_url) {
      avatarEl.innerHTML = `<img src="${profile.avatar_url}" alt="Avatar" style="width:100%;height:100%;border-radius:50%;object-fit:cover;" />`;
    }
  }
}

// ── Wire up login form ───────────────────────────────────────────
const loginForm = document.getElementById('login-form');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const btn = loginForm.querySelector('button[type="submit"]');
    btn.textContent = 'Logging in...';
    btn.disabled = true;
    const result = await handleLogin(email, password);
    if (result.error) {
      btn.textContent = 'Log In';
      btn.disabled = false;
      if (result.error.includes('email_not_confirmed') || result.error.includes('Email not confirmed')) {
        window.location.href = 'verify-email.html';
      } else {
        showToast('Error: ' + result.error);
      }
    } else {
      showToast('Welcome back! 🏴‍☠️');
      setTimeout(() => window.location.href = 'index.html', 1000);
    }
  });
}

// ── Wire up signup form ──────────────────────────────────────────
const signupForm = document.getElementById('signup-form');
if (signupForm) {
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('signup-username').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const btn = signupForm.querySelector('button[type="submit"]');
    btn.textContent = 'Creating account...';
    btn.disabled = true;
    const result = await handleSignUp(email, password, username);
    if (result.error) {
      btn.textContent = 'Create Account';
      btn.disabled = false;
      showToast('Error: ' + result.error);
    } else {
      window.location.href = 'verify-email.html';
    }
  });
}

// Run on every page
updateNavbar();
loadUserProfile();
