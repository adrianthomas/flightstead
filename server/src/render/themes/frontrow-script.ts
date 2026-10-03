// Progressive enhancement for Front Row. Every view is already a set of real
// links, so this only adds: the highlight following hover/focus, the hero
// swapping to match it, the remote-style keyboard model, and the slide
// direction for cross-document view transitions. Nothing here navigates by
// script except by clicking the same links a visitor could click.

/** Runs in <head>: `pagereveal` can fire before the end of <body> is parsed. */
export const frontrowHeadScript = `
window.addEventListener('pagereveal', function (e) {
  if (!e.viewTransition) return;
  var dir = null;
  try { dir = sessionStorage.getItem('fr-dir'); sessionStorage.removeItem('fr-dir'); } catch (x) {}
  try {
    var act = window.navigation && window.navigation.activation;
    if (!dir && act && act.navigationType === 'traverse' && act.from && act.entry && act.from.index > act.entry.index) dir = 'back';
    if (dir === 'back' && e.viewTransition.types) e.viewTransition.types.add('fr-back');
  } catch (x) {}
});
`;

export const frontrowScript = `
(function () {
  var root = document.documentElement;
  function read(key) { try { return sessionStorage.getItem(key); } catch (e) { return null; } }
  function write(key, value) {
    try { if (value === null) sessionStorage.removeItem(key); else sessionStorage.setItem(key, value); } catch (e) {}
  }

  var hero = document.querySelector('[data-fr-hero]');
  var rowsEl = document.querySelector('[data-fr-rows]');
  var rows = rowsEl ? Array.prototype.slice.call(rowsEl.querySelectorAll('.fr-row')) : [];
  var viewEl = document.querySelector('[data-fr-view]');
  var view = viewEl ? viewEl.getAttribute('data-fr-view') : '';
  var active = null;
  var token = 0;
  var lastX = -1;
  var lastY = -1;

  function heroMs() {
    var value = parseFloat(getComputedStyle(root).getPropertyValue('--fr-dur-hero'));
    return isNaN(value) ? 0 : value;
  }

  function buildArt(row) {
    var art = document.createElement('span');
    art.className = 'fr-art';
    var thumb = row.getAttribute('data-thumb');
    if (thumb) {
      var img = document.createElement('img');
      img.className = 'fr-thumb';
      var set = row.getAttribute('data-srcset');
      if (set) { img.srcset = set; img.sizes = '(max-width: 900px) 120px, 280px'; }
      img.src = thumb;
      img.alt = '';
      img.decoding = 'async';
      art.appendChild(img);
      return art;
    }
    var source = row.querySelector('.fr-tile');
    if (!source) return null;
    var tile = source.cloneNode(true);
    tile.className = 'fr-tile fr-tile--hero';
    tile.removeAttribute('role');
    tile.removeAttribute('aria-label');
    tile.setAttribute('aria-hidden', 'true');
    art.appendChild(tile);
    return art;
  }

  function place(slot, art) {
    var old = Array.prototype.filter.call(slot.children, function (child) { return child.classList.contains('fr-art'); });
    art.className = 'fr-art is-enter';
    slot.appendChild(art);
    var wait = heroMs() + 40;
    old.forEach(function (node) { setTimeout(function () { if (node.parentNode) node.parentNode.removeChild(node); }, wait); });
    setTimeout(function () { art.classList.remove('is-enter'); }, wait);
  }

  function swapHero(row) {
    if (!hero || !row.getAttribute('data-kind')) return;
    var mine = ++token;
    var main = buildArt(row);
    var mirror = buildArt(row);
    var mainSlot = hero.querySelector('[data-fr-slot="main"]');
    var mirrorSlot = hero.querySelector('[data-fr-slot="reflect"]');
    if (!main || !mirror || !mainSlot || !mirrorSlot) return;
    var go = function () {
      if (mine !== token) return;
      place(mainSlot, main);
      place(mirrorSlot, mirror);
    };
    var thumb = row.getAttribute('data-thumb');
    if (!thumb) { go(); return; }
    var pre = new Image();
    pre.onload = go;
    pre.onerror = go;
    var set = row.getAttribute('data-srcset');
    if (set) { pre.srcset = set; pre.sizes = '(max-width: 900px) 120px, 280px'; }
    pre.src = thumb;
  }

  function setActive(row) {
    if (!row || row === active) return;
    if (active) active.removeAttribute('data-hl');
    row.setAttribute('data-hl', 'true');
    active = row;
    swapHero(row);
  }

  function useKeyboard(on) { write('fr-kb', on ? '1' : null); }

  if (rows.length) {
    active = rows.filter(function (row) { return row.getAttribute('data-hl') === 'true'; })[0] || null;
    rowsEl.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch') return;
      // Browsers synthesise a move after scrolling or re-layout; only react to real movement.
      if (e.clientX === lastX && e.clientY === lastY) return;
      lastX = e.clientX; lastY = e.clientY;
      var row = e.target.closest ? e.target.closest('.fr-row') : null;
      if (row) setActive(row);
    });
    rowsEl.addEventListener('focusin', function (e) {
      var row = e.target.closest ? e.target.closest('.fr-row') : null;
      if (row) setActive(row);
    });

    // Returning from a post: the list link carries #r-<slug>, so keep that post highlighted.
    var hashRow = location.hash.length > 1 ? document.getElementById(decodeURIComponent(location.hash.slice(1))) : null;
    if (hashRow && rows.indexOf(hashRow) > -1) setActive(hashRow);
    // Move focus only for visitors who arrived by keyboard, so mouse users never see a stray ring.
    if (read('fr-kb') === '1' && active) active.focus({ preventScroll: !hashRow });
  }

  document.addEventListener('pointerdown', function () { useKeyboard(false); });
  document.addEventListener('click', function (e) {
    var link = e.target.closest ? e.target.closest('[data-fr-back],[data-fr-prev]') : null;
    write('fr-dir', link ? 'back' : null);
  });

  function typing(target) {
    if (!target || !target.tagName) return false;
    var tag = target.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
  }

  function press(selector) {
    var link = document.querySelector(selector);
    if (!link) return false;
    link.click();
    return true;
  }

  document.addEventListener('keydown', function (e) {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || typing(e.target)) return;
    var key = e.key;
    var handled = false;

    if (rows.length && (key === 'ArrowDown' || key === 'ArrowUp')) {
      var index = rows.indexOf(active);
      if (index < 0) index = 0;
      var next = key === 'ArrowDown' ? Math.min(rows.length - 1, index + 1) : Math.max(0, index - 1);
      useKeyboard(true);
      rows[next].focus();
      handled = true;
    } else if (rows.length && (key === 'ArrowRight' || (key === 'Enter' && document.activeElement === document.body))) {
      if (active) { useKeyboard(true); active.click(); handled = true; }
    } else if (!rows.length && view === 'detail' && key === 'ArrowRight') {
      useKeyboard(true);
      handled = press('[data-fr-next]');
    } else if (!rows.length && view === 'detail' && key === 'ArrowLeft') {
      useKeyboard(true);
      handled = press('[data-fr-prev]');
    } else if (key === 'ArrowLeft' && view === 'list') {
      useKeyboard(true);
      handled = press('[data-fr-back]');
    } else if (key === 'Escape' || key === 'Backspace') {
      useKeyboard(true);
      handled = press('[data-fr-back]');
    }
    if (handled) e.preventDefault();
  });
})();
`;
