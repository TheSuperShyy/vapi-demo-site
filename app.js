// CLIX voice agent dashboard — shell, router, i18n, theme.
// Pages are registered in PAGES below; each is an async render(main) function.

const $ = (id) => document.getElementById(id);
const store = {
  get(k, d) { try { return localStorage.getItem(k) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch {} },
};

// ------------------------------------------------------------------ i18n

export const I18N = {
  en: {
    'greeting.title': 'Welcome',
    'greeting.sub': "Here's what's happening with your agent",
    'nav.main': 'Main Menu', 'nav.overview': 'Overview', 'nav.calls': 'Calls',
    'nav.agent': 'Voice Agent', 'nav.system': 'System', 'nav.settings': 'Settings',
    'search.placeholder': 'Search calls', 'topbar.light': 'Light', 'topbar.refresh': 'Refresh',
    'profile.sub': 'Voice agent', 'loading': 'Loading…', 'lang.other': 'עברית',
    'page.overview': 'Overview', 'page.overview.sub': "This is what happened with the agent",
    'page.calls': 'Calls', 'page.calls.sub': 'Every conversation, with the full transcript',
    'page.agent': 'Voice Agent', 'page.agent.sub': 'Talk to her from the browser. No phone call.',
    'page.settings': 'Settings', 'page.settings.sub': 'Appearance and agent details',
  },
  he: {
    'greeting.title': 'שלום',
    'greeting.sub': 'זה מה שקורה היום עם הסוכן',
    'nav.main': 'תפריט ראשי', 'nav.overview': 'סקירה', 'nav.calls': 'שיחות',
    'nav.agent': 'סוכן קולי', 'nav.system': 'מערכת', 'nav.settings': 'הגדרות',
    'search.placeholder': 'חיפוש שיחות', 'topbar.light': 'בהיר', 'topbar.refresh': 'רענון',
    'profile.sub': 'סוכנת קולית', 'loading': 'טוען…', 'lang.other': 'English',
    'page.overview': 'סקירה', 'page.overview.sub': 'זה מה שקרה עם הסוכן',
    'page.calls': 'שיחות', 'page.calls.sub': 'כל שיחה, עם התמלול המלא',
    'page.agent': 'סוכן קולי', 'page.agent.sub': 'דברו איתה מהדפדפן. בלי שיחת טלפון.',
    'page.settings': 'הגדרות', 'page.settings.sub': 'מראה ופרטי הסוכן',
  },
};

export let lang = store.get('lang', 'en') === 'he' ? 'he' : 'en';
export const t = (k) => I18N[lang][k] ?? I18N.en[k] ?? k;

export function applyLang(next) {
  lang = next;
  store.set('lang', lang);
  const root = document.documentElement;
  root.lang = lang;
  root.dir = lang === 'he' ? 'rtl' : 'ltr';
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => { el.placeholder = t(el.dataset.i18nPlaceholder); });
  document.querySelectorAll('[data-i18n-title]').forEach((el) => { el.title = t(el.dataset.i18nTitle); });
  $('langlabel').textContent = t('lang.other');
  render();  // re-render the current page in the new language
}

// ------------------------------------------------------------------ theme

export function applyTheme(theme) {
  store.set('theme', theme);
  if (theme === 'light') document.documentElement.setAttribute('data-theme', 'light');
  else document.documentElement.removeAttribute('data-theme');
  const sw = $('themeswitch');
  sw.classList.toggle('on', theme === 'light');
  sw.setAttribute('aria-checked', String(theme === 'light'));
}
const toggleTheme = () => applyTheme(document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light');

// ------------------------------------------------------------------ router

const PAGES = {};
export function registerPage(name, fn) { PAGES[name] = fn; }

export function route() {
  const hash = location.hash.replace(/^#\/?/, '');
  const [name, ...rest] = hash.split('/');
  return { name: PAGES[name] ? name : 'overview', params: rest };
}

let rendering = false;
export async function render() {
  if (rendering) return;
  rendering = true;
  const { name, params } = route();
  document.querySelectorAll('.nav-item').forEach((a) => a.classList.toggle('on', a.dataset.route === name));
  $('rangetabs').hidden = name !== 'overview';
  const main = $('main');
  try {
    await PAGES[name](main, params);
  } catch (e) {
    console.error(e);
    main.innerHTML = `<div class="page-empty">${escapeHtml(e.message)}</div>`;
  } finally {
    rendering = false;
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

// ------------------------------------------------------------------ boot

// Placeholder pages; real ones register from pages.js and override these.
for (const name of ['overview', 'calls', 'agent', 'settings']) {
  registerPage(name, (main) => { main.innerHTML = pageHead(`page.${name}`, `page.${name}.sub`) + `<div class="card"><div class="page-empty">${t('loading')}</div></div>`; });
}

$('themeswitch').onclick = toggleTheme;
$('themeswitch').onkeydown = (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggleTheme(); } };
$('langbtn').onclick = () => applyLang(lang === 'he' ? 'en' : 'he');
$('refreshbtn').onclick = () => render();
window.addEventListener('hashchange', render);

applyTheme(store.get('theme', 'dark'));
applyLang(lang);

// Real pages (added in later steps). Loaded last so they can override the placeholders.
import('./pages.js').catch(() => {}).then(() => render());
