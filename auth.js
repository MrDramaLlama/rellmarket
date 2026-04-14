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
  const user = await getCurrentUser();
  const loginBtn = document.querySelector('.btn--login');
  const signupBtn = document.querySelector('.btn--signup');

  if (user) {
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('roblox_username, username')
      .eq('id', user.id)
      .single();
    const name = profile?.roblox_username || profile?.username || 'Account';

    // Fetch pending incoming trade count for badge
    let pendingCount = 0;
    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (session) {
        const r = await fetch('https://rellmarket.vercel.app/api/trades/get?type=incoming', {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        });
        if (r.ok) {
          const json = await r.json();
          pendingCount = (json.trades || []).filter(t => t.status === 'pending').length;
        }
      }
    } catch (e) {}

    if (loginBtn) {
      loginBtn.textContent = pendingCount > 0 ? `👤 ${name} (${pendingCount})` : `👤 ${name}`;
      loginBtn.href = 'my-listings.html';
    }
    if (signupBtn) signupBtn.style.display = 'none';
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
