// CLIX voice agent dashboard — shell, router, i18n, theme.
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
    'greeting.title': 'Welcome',
    'greeting.sub': "Here's what's happening with your agent",
    'nav.main': 'Main Menu', 'nav.overview': 'Overview', 'nav.calls': 'Calls',
    'nav.agent': 'Voice Agent', 'nav.system': 'System', 'nav.settings': 'Settings',
    'search.placeholder': 'Search calls', 'topbar.light': 'Light', 'topbar.refresh': 'Refresh',
    'profile.sub': 'Voice agent', 'loading': 'Loading…', 'lang.other': 'עברית',
    'page.overview': 'Overview', 'page.overview.sub': 'This is what happened with the agent',
    'page.calls': 'Calls', 'page.calls.sub': 'Every conversation, with the full transcript',
    'page.agent': 'Voice Agent', 'page.agent.sub': 'Talk to her from the browser. No phone call.',
    'page.settings': 'Settings', 'page.settings.sub': 'Appearance and agent details',
    'err.generic': 'Something went wrong', 'retry': 'Try again',
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
    'err.generic': 'משהו השתבש', 'retry': 'נסו שוב',
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
  $('langlabel').textContent = t('lang.other');
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

// ------------------------------------------------------------------ router

const PAGES = {};
export function registerPage(name, page) { PAGES[name] = page; }

export function route() {
  const hash = location.hash.replace(/^#\/?/, '');
  const [name, ...rest] = hash.split('/');
  return { name: PAGES[name] ? name : 'overview', params: rest };
}

let gen = 0;
export async function render() {
  const my = ++gen;
  const { name, params } = route();
  const page = PAGES[name];
  document.querySelectorAll('.nav-item').forEach((a) => a.classList.toggle('on', a.dataset.route === name));
  $('rangetabs').hidden = name !== 'overview';
  const main = $('main');

  // Skeleton first, so navigation feels instant even when the API takes a second.
  main.innerHTML = pageHead(`page.${name}`, `page.${name}.sub`) + (page.skeleton?.(params) ?? '');
  main.scrollTop = 0;

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
for (const name of ['overview', 'calls', 'agent', 'settings']) {
  registerPage(name, {
    skeleton: () => sk.card(sk.rows(4)),
    load: async () => ({ html: pageHead(`page.${name}`, `page.${name}.sub`) + sk.card(`<div class="page-empty">${t('loading')}</div>`) }),
  });
}

$('themeswitch').onclick = toggleTheme;
$('themeswitch').onkeydown = (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggleTheme(); } };
$('langbtn').onclick = () => applyLang(lang === 'he' ? 'en' : 'he');
$('refreshbtn').onclick = () => render();
window.addEventListener('hashchange', render);

applyTheme(store.get('theme', 'dark'));
applyLang(lang, false);

// Real pages override the fallbacks, then the first render happens.
import('./pages.js')
  .catch((e) => { console.error('pages.js failed to load', e); })
  .then(() => render());
