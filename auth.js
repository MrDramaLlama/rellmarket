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
    if (loginBtn) loginBtn.textContent = 'Log Out';
    if (loginBtn) loginBtn.href = '#';
    if (loginBtn) loginBtn.addEventListener('click', (e) => { e.preventDefault(); handleLogout(); });
    if (signupBtn) signupBtn.style.display = 'none';
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
      showToast('Error: ' + result.error);
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
      showToast('Account created! Check your email to verify. 🎉');
      setTimeout(() => window.location.href = 'login.html', 2000);
    }
  });
}

// Run navbar update on every page
updateNavbar();
