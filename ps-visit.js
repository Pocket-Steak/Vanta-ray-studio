/* ps-visit.js: page-visit tracking for every Pocket Steak web app, shown on the dashboards' Tracking
 * view. Source of truth: pocketsteak-dashboards/visits/ps-visit.js (each app keeps a copy in its
 * public folder, so it loads from the app's own origin and passes script-src 'self').
 *
 * Use:  <script src="/ps-visit.js" data-app="myoc" defer></script>
 *
 * - Each browser gets a random id (localStorage "ps_vid"); nothing else is stored on the device.
 * - Who: a signed-in Supabase user is read from the app's own session (localStorage or the
 *   sb-*-auth-token cookie) and its access token sent, so the visit function can ask that project who
 *   it is (names are never taken on trust). Re-checked every 15 s so a sign-in mid-visit
 *   counts. Other sign-ins (or httpOnly cookies) call PSVisit.identify({id, label}), kept as unconfirmed.
 *   A browser's earlier anonymous views become the first person to sign in on it, never a later one.
 * - Each page (including single-page-app route changes) is one view; time counts only while the
 *   tab is visible, sent every 15 s and when the page is left (sendBeacon survives closing the tab).
 * - Only the path is sent (no query string or hash, which can hold tokens). Off on localhost.
 * Server: HQ Supabase Edge Function "visit" (pocketsteak-dashboards/visits/supabase).
 */
(function () {
  'use strict';
  if (window.PSVisit) return;
  var FN = 'https://vmmdskviwqddgalccoyc.supabase.co/functions/v1/visit';
  var me = document.currentScript || document.querySelector('script[data-app][src*="ps-visit"]');
  var APP = me && me.getAttribute('data-app');
  var host = location.hostname;
  var off = !APP || navigator.webdriver || /^(localhost|127\.0\.0\.1|\[::1\]|0\.0\.0\.0)$|\.local$/.test(host) && !window.PS_VISIT_DEV;
  var who = null, told = null, view = null, secs = 0, sent = 0, path = null, starting = false;
  window.PSVisit = { identify: function (u) {
    if (!u || !u.id) return;
    who = { id: String(u.id), label: u.label ? String(u.label) : null };
    if (!off) tell();
  } };
  if (off) return;

  function device() {
    var k = 'ps_vid', id = null;
    try { id = localStorage.getItem(k); } catch (e) {}
    if (!id || !/^[0-9a-f]{32}$/.test(id)) {
      var a = new Uint8Array(16);
      (window.crypto || window.msCrypto).getRandomValues(a);
      id = Array.prototype.map.call(a, function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
      try { localStorage.setItem(k, id); } catch (e) {}
    }
    return id;
  }
  var DEV = device();

  // the app's own Supabase session, if it has one (supabase-js in localStorage, or @supabase/ssr cookies)
  function fromSession(s) {
    if (!s) return null;
    if (typeof s === 'string') {
      if (s.indexOf('base64-') === 0) { try { s = decodeURIComponent(escape(atob(s.slice(7).replace(/-/g, '+').replace(/_/g, '/')))); } catch (e) { return null; } }
      try { s = JSON.parse(s); } catch (e) { return null; }
    }
    var cs = s && (s.currentSession || s), u = cs && cs.user;
    if (!u || !u.id || !cs.access_token) return null;
    // the token goes to the visit function, which asks the app's Supabase project who it is
    return { id: u.id, t: cs.access_token };
  }
  function sniff() {
    if (who) return who;
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (/^sb-[a-z0-9]+-auth-token$/.test(k)) { var u = fromSession(localStorage.getItem(k)); if (u) return u; }
      }
    } catch (e) {}
    try {
      var parts = {}, cs = document.cookie ? document.cookie.split('; ') : [];
      cs.forEach(function (c) {
        var i = c.indexOf('='), n = c.slice(0, i), m = /^(sb-[a-z0-9]+-auth-token)(?:\.(\d+))?$/.exec(n);
        if (m) (parts[m[1]] = parts[m[1]] || [])[m[2] ? +m[2] : 0] = decodeURIComponent(c.slice(i + 1));
      });
      for (var n in parts) { var u2 = fromSession(parts[n].join('')); if (u2) return u2; }
    } catch (e) {}
    return null;
  }

  function post(body, beacon) {
    var data = JSON.stringify(body);
    if (beacon && navigator.sendBeacon) {
      try { if (navigator.sendBeacon(FN, new Blob([data], { type: 'text/plain' }))) return null; } catch (e) {}
    }
    try {
      // text/plain keeps it a "simple" request: no CORS preflight
      return fetch(FN, { method: 'POST', body: data, keepalive: true, headers: { 'Content-Type': 'text/plain' }, credentials: 'omit' })
        .then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
    } catch (e) { return null; }
  }
  // whoever is signed in, as soon as we know: tied to this browser (and its earlier views)
  function tell() {
    var u = sniff();
    if (!u || (told && told.id === u.id && told.label === u.label)) return;
    if (!view) return;   // sent once the current view has its id
    told = u;
    post({ op: 'who', app: APP, d: DEV, v: view, t: u.t || undefined, u: u.t ? undefined : u });
  }
  function flush(beacon) {
    if (view && secs > sent) { sent = secs; post({ op: 'ping', v: view, s: secs }, beacon); }
  }
  function start() {
    var p = location.pathname || '/';
    if (p === path) return;
    flush(true);
    path = p; view = null; secs = 0; sent = 0;
    var mine = p, u = sniff();
    starting = true;
    var r = post({ op: 'start', app: APP, d: DEV, path: p, t: u && u.t || undefined, u: u && !u.t ? u : undefined });
    if (u) told = u;
    if (r && r.then) r.then(function (d) { starting = false; if (d && d.v && path === mine) { view = d.v; tell(); } });
    else starting = false;
  }

  // single-page apps: a route change is a new page
  ['pushState', 'replaceState'].forEach(function (f) {
    var orig = history[f];
    if (typeof orig !== 'function') return;
    history[f] = function () { var r = orig.apply(this, arguments); setTimeout(start, 0); return r; };
  });
  addEventListener('popstate', function () { setTimeout(start, 0); });

  setInterval(function () { if (document.visibilityState === 'visible' && (view || starting)) secs++; }, 1000);
  setInterval(function () { flush(false); tell(); }, 15000);
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') flush(true); });
  addEventListener('pagehide', function () { flush(true); });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
