// מטה קול העם voice agent dashboard — shell, router, i18n, theme.
//
// A page is { skeleton(params) -> html, load(params) -> { html, mount?(main) } }.
// render() paints the skeleton immediately, awaits load(), and only commits the
// result if no newer render has started since (so fast navigation never shows a
// stale page or drops a click).

const $ = (id) => document.getElementById(id);
export const store = {
  get(k, d) { try { return localStorage.getItem(k) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch {} },
  del(k) { try { localStorage.removeItem(k); } catch {} },
};

// ------------------------------------------------------------------ i18n

export const I18N = {
  en: {
    'brand.name': 'Voice of the People', 'brand.hq': 'Headquarters', 'brand.title': 'Voice of the People Headquarters · Voice Agent',
    'greeting.title': 'Welcome',
    'greeting.sub': "Here's what's happening with your agent",
    'nav.main': 'Main Menu', 'nav.overview': 'Overview', 'nav.calls': 'Calls',
    'nav.agent': 'Voice Agent', 'nav.system': 'System', 'nav.settings': 'Settings', 'nav.list': 'List',
    'search.placeholder': 'Search calls', 'topbar.light': 'Light', 'topbar.refresh': 'Refresh',
    'profile.sub': 'Voice agent', 'loading': 'Loading…', 'lang.other': 'עברית',
    'page.overview': 'Overview', 'page.overview.sub': 'This is what happened with the agent',
    'page.calls': 'Calls', 'page.calls.sub': 'Every conversation, with the full transcript',
    'page.list': 'Calling list', 'page.list.sub': 'Who the agent will call, in campaign order',
    'page.agent': 'Voice Agent', 'page.agent.sub': 'Talk to her from the browser. No phone call.',
    'page.settings': 'Settings', 'page.settings.sub': 'Appearance and agent details',
    'err.generic': 'Something went wrong', 'retry': 'Try again',
    'nav.signout': 'Sign out',
    'login.title': 'Sign in', 'login.sub': 'Enter the dashboard password', 'login.placeholder': 'Password',
    'login.show': 'Show password', 'login.hide': 'Hide password', 'login.submit': 'Sign in',
    'login.wrong': 'Wrong password, try again', 'login.offline': 'Cannot reach the server',
  },
  he: {
    'brand.name': 'קול העם', 'brand.hq': 'מטה', 'brand.title': 'מטה קול העם · סוכן קולי',
    'greeting.title': 'שלום',
    'greeting.sub': 'זה מה שקורה היום עם הסוכן',
    'nav.main': 'תפריט ראשי', 'nav.overview': 'סקירה', 'nav.calls': 'שיחות',
    'nav.agent': 'סוכן קולי', 'nav.system': 'מערכת', 'nav.settings': 'הגדרות', 'nav.list': 'רשימה',
    'search.placeholder': 'חיפוש שיחות', 'topbar.light': 'בהיר', 'topbar.refresh': 'רענון',
    'profile.sub': 'סוכנת קולית', 'loading': 'טוען…', 'lang.other': 'English',
    'page.overview': 'סקירה', 'page.overview.sub': 'זה מה שקרה עם הסוכן',
    'page.calls': 'שיחות', 'page.calls.sub': 'כל שיחה, עם התמלול המלא',
    'page.list': 'רשימת חיוג', 'page.list.sub': 'למי הסוכנת תתקשר, לפי סדר הקמפיין',
    'page.agent': 'סוכן קולי', 'page.agent.sub': 'דברו איתה מהדפדפן. בלי שיחת טלפון.',
    'page.settings': 'הגדרות', 'page.settings.sub': 'מראה ופרטי הסוכן',
    'err.generic': 'משהו השתבש', 'retry': 'נסו שוב',
    'nav.signout': 'התנתקות',
    'login.title': 'התחברות', 'login.sub': 'הזינו את סיסמת הדשבורד', 'login.placeholder': 'סיסמה',
    'login.show': 'הצגת סיסמה', 'login.hide': 'הסתרת סיסמה', 'login.submit': 'כניסה',
    'login.wrong': 'סיסמה שגויה, נסו שוב', 'login.offline': 'אין חיבור לשרת',
  },
};

export let lang = store.get('lang', 'en') === 'he' ? 'he' : 'en';
export const t = (k) => I18N[lang][k] ?? I18N.en[k] ?? k;

export function applyLang(next, rerender = true) {
  lang = next;
  store.set('lang', lang);
  const root = document.documentElement;
  root.lang = lang;
  root.dir = lang === 'he' ? 'rtl' : 'ltr';
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => { el.placeholder = t(el.dataset.i18nPlaceholder); });
  document.querySelectorAll('[data-i18n-title]').forEach((el) => { el.title = t(el.dataset.i18nTitle); });
  document.querySelectorAll('[data-i18n-aria]').forEach((el) => { el.setAttribute('aria-label', t(el.dataset.i18nAria)); });
  // The brand reads "headquarters" first in Hebrew and last in English, with the name itself in the accent colour.
  document.querySelectorAll('.wordmark').forEach((el) => {
    const name = document.createElement('b'); name.textContent = t('brand.name');
    el.replaceChildren(...(lang === 'he' ? [t('brand.hq'), ' ', name] : [name, ' ', t('brand.hq')]));
    el.lang = lang;
  });
  document.title = t('brand.title');
  $('langlabel').textContent = t('lang.other');
  $('login-langlabel').textContent = t('lang.other');
  if (rerender) render();
}

// ------------------------------------------------------------------ theme

export function applyTheme(theme) {
  store.set('theme', theme);
  if (theme === 'light') document.documentElement.setAttribute('data-theme', 'light');
  else document.documentElement.removeAttribute('data-theme');
  document.querySelectorAll('[data-theme-switch]').forEach((sw) => {
    sw.classList.toggle('on', theme === 'light');
    sw.setAttribute('aria-checked', String(theme === 'light'));
  });
}
export const currentTheme = () => (document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark');
export const toggleTheme = () => applyTheme(currentTheme() === 'light' ? 'dark' : 'light');

// ------------------------------------------------------------------ auth
//
// The server may have a DASHBOARD_PASSWORD. If it does, every api/ call needs it as
// a bearer token; the page keeps it in localStorage ('dash_pw') and shows the login
// overlay whenever the server answers 401. Without a password, nothing here shows.

export let authRequired = false;

function authHeaders() {
  const pw = store.get('dash_pw', '');
  return pw ? { Authorization: `Bearer ${pw}` } : {};
}

// Asks /api/auth. { ok, required }. Throws only when the server cannot be reached.
async function probeAuth() {
  const res = await fetch('/api/auth', { headers: authHeaders(), cache: 'no-store' });
  if (res.status === 401) return { ok: false, required: true };
  if (!res.ok) throw new Error(`auth ${res.status}`);
  const data = await res.json().catch(() => ({}));
  return { ok: true, required: !!data.required };
}

function setAuthRequired(v) {
  authRequired = !!v;
  $('nav-signout').hidden = !authRequired;
}

// Idempotent: a second call while the overlay is already up must not wipe what
// the user is typing (stray 401s from earlier requests can land at any time).
export function showLogin() {
  const box = $('login');
  if (!box.hidden) return;
  box.hidden = false;
  $('login-pw').value = '';
  $('login-err').textContent = '';
  setTimeout(() => $('login-pw').focus(), 0);
}
function hideLogin() { $('login').hidden = true; }

export function signOut() {
  store.del('dash_pw');
  showLogin();
}

let loginBusy = false;
async function submitLogin(e) {
  e?.preventDefault();
  if (loginBusy) return;
  const pw = $('login-pw'), err = $('login-err'), btn = $('login-submit');
  const value = pw.value;
  if (!value) { pw.focus(); return; }
  loginBusy = true; btn.disabled = true; err.textContent = '';
  try {
    store.set('dash_pw', value);
    const r = await probeAuth();
    if (r.ok) { setAuthRequired(r.required); hideLogin(); render(); return; }
    store.del('dash_pw');
    err.textContent = t('login.wrong');
    const card = $('login-form');
    card.classList.remove('shake'); void card.offsetWidth; card.classList.add('shake');
    pw.value = ''; pw.focus();
  } catch {
    store.del('dash_pw');
    err.textContent = t('login.offline');
  } finally { loginBusy = false; btn.disabled = false; }
}

function togglePassword() {
  const pw = $('login-pw'), btn = $('pw-toggle');
  const show = pw.type === 'password';
  pw.type = show ? 'text' : 'password';
  btn.setAttribute('aria-pressed', String(show));
  btn.classList.toggle('showing', show);
  btn.dataset.i18nTitle = show ? 'login.hide' : 'login.show';
  btn.title = t(btn.dataset.i18nTitle);
  pw.focus();
}

// ------------------------------------------------------------------ router

const PAGES = {};
export function registerPage(name, page) { PAGES[name] = page; }

export function route() {
  const hash = location.hash.replace(/^#\/?/, '');
  const [name, ...rest] = hash.split('/');
  return { name: PAGES[name] ? name : 'overview', params: rest };
}

let gen = 0;
let lastRouteKey = null;
export async function render() {
  const my = ++gen;
  const { name, params } = route();
  const page = PAGES[name];
  document.querySelectorAll('.nav-item').forEach((a) => a.classList.toggle('on', a.dataset.route === name));
  $('rangetabs').hidden = name !== 'overview';
  const main = $('main');

  // Skeleton first, so navigation feels instant even when the API takes a second.
  main.innerHTML = pageHead(`page.${name}`, `page.${name}.sub`) + (page.skeleton?.(params) ?? '');
  // The window scrolls, not <main>: back to the top when the route changed, not on in-page re-renders.
  const routeKey = name + '/' + params.join('/');
  if (routeKey !== lastRouteKey) { lastRouteKey = routeKey; window.scrollTo(0, 0); }

  try {
    const out = await page.load(params);
    if (my !== gen) return;                    // a newer render superseded this one
    main.innerHTML = out.html;
    out.mount?.(main);
  } catch (e) {
    if (my !== gen) return;
    console.error(e);
    main.innerHTML = pageHead(`page.${name}`, `page.${name}.sub`) + `
      <div class="card"><div class="page-empty">${escapeHtml(t('err.generic'))}<br>
        <span class="faint" style="font-size:12px">${escapeHtml(e.message)}</span><br><br>
        <button class="btn secondary sm" id="retry">${t('retry')}</button></div></div>`;
    $('retry').onclick = () => render();
  }
}

// ------------------------------------------------------------------ helpers shared by pages

export function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}
export function pageHead(titleKey, subKey, extra = '') {
  return `<div style="display:flex;align-items:flex-end;justify-content:space-between;gap:16px;flex-wrap:wrap">
    <div><h1 class="page-title">${t(titleKey)}</h1><p class="page-sub">${t(subKey)}</p></div>${extra}</div>`;
}
export function toast(msg, isErr) {
  const el = document.createElement('div');
  el.className = 'toast' + (isErr ? ' err' : '');
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 4200);
}
// Skeleton building blocks
export const sk = {
  line: (w = '') => `<div class="skeleton skel-line ${w}"></div>`,
  card: (inner) => `<div class="card">${inner}</div>`,
  stat: (hero) => `<div class="stat${hero ? ' hero' : ''}">${sk.line('w50')}${sk.line('w30')}${sk.line('w70')}</div>`,
  rows: (n = 5) => Array.from({ length: n }, () => `<div class="skel-row"><span class="skeleton skel-dot"></span><div style="flex:1">${sk.line('w50')}${sk.line('w30')}</div><span class="skeleton skel-pill"></span></div>`).join(''),
};

// ------------------------------------------------------------------ boot

// Fallback page so the shell never dead-ends if pages.js fails to load.
for (const name of ['overview', 'calls', 'list', 'agent', 'settings']) {
  registerPage(name, {
    skeleton: () => sk.card(sk.rows(4)),
    load: async () => ({ html: pageHead(`page.${name}`, `page.${name}.sub`) + sk.card(`<div class="page-empty">${t('loading')}</div>`) }),
  });
}

$('themeswitch').onclick = toggleTheme;
$('themeswitch').onkeydown = (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggleTheme(); } };
$('langbtn').onclick = () => applyLang(lang === 'he' ? 'en' : 'he');
$('refreshbtn').onclick = () => render();
$('nav-signout').onclick = (e) => { e.preventDefault(); signOut(); };
$('login-form').onsubmit = submitLogin;
$('pw-toggle').onclick = togglePassword;
$('login-lang').onclick = () => applyLang(lang === 'he' ? 'en' : 'he', false);
$('login-form').onanimationend = () => $('login-form').classList.remove('shake');
window.addEventListener('hashchange', render);

applyTheme(store.get('theme', 'dark'));
applyLang(lang, false);

// Boot: find out whether a password is needed, load the real pages (they override
// the fallbacks), then render. When login is needed the static skeleton stays
// behind the opaque overlay and the first render happens after a successful sign-in.
(async () => {
  let signedIn = true;
  try {
    const r = await probeAuth();
    setAuthRequired(r.required);
    if (!r.ok) { signedIn = false; store.del('dash_pw'); showLogin(); }
  } catch (e) { console.warn('auth probe failed, continuing', e); }
  await import('./pages.js').catch((e) => { console.error('pages.js failed to load', e); });
  if (signedIn) render();
})();
