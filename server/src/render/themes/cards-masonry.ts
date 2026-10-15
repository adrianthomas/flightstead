/** CSS and progressive enhancement for the Cards/Prism mixed feed. */
export const cardsMasonryStyles = `
  body.theme-cards .cards-feed[data-cards-masonry],
  body.theme-prism .cards-feed[data-cards-masonry] {
    grid-auto-rows: 4px;
    grid-auto-flow: row dense;
    row-gap: 0;
    align-items: start;
  }
`;

export const cardsMasonryScript = `
(function () {
  if (!('ResizeObserver' in window)) return;
  var body = document.body;
  if (!body || (!body.classList.contains('theme-cards') && !body.classList.contains('theme-prism'))) return;

  if (body.classList.contains('theme-ledger')) return;

  var feeds = Array.prototype.slice.call(document.querySelectorAll('.cards-feed'));
  if (!feeds.length) return;

  feeds.forEach(function (feed) {
    var cards = Array.prototype.slice.call(feed.children).filter(function (child) {
      return child instanceof HTMLElement;
    });
    if (!cards.length) return;

    var rowSize = 4;
    var observer = null;
    var frame = 0;
    var pending = false;
    var enhanced = false;

    function columnCount() {
      var tracks = getComputedStyle(feed).gridTemplateColumns.trim();
      return tracks ? tracks.split(/\\s+/).length : 1;
    }

    function clearEnhancement() {
      if (observer) {
        observer.disconnect();
        observer = null;
      }
      cards.forEach(function (card) {
        if (card.style.gridRowEnd) card.style.gridRowEnd = '';
      });
      if (enhanced) feed.removeAttribute('data-cards-masonry');
      enhanced = false;
    }

    function reflow() {
      frame = 0;
      if (document.documentElement.classList.contains('cards-lock-scroll')) {
        pending = true;
        return;
      }
      pending = false;

      if (columnCount() < 2) {
        clearEnhancement();
        return;
      }

      // Read natural card sizes before writing row spans. align-items:start
      // keeps the computed span from stretching the measured card itself.
      var rowGap = parseFloat(getComputedStyle(feed).columnGap) || 0;
      var spans = cards.map(function (card) {
        var height = card.offsetHeight;
        return Math.max(1, Math.ceil((height + rowGap) / rowSize));
      });

      var changed = !enhanced;
      cards.forEach(function (card, index) {
        var value = String(spans[index]);
        if (card.style.gridRowEnd !== 'span ' + value) changed = true;
      });
      if (changed) {
        cards.forEach(function (card, index) {
          card.style.gridRowEnd = 'span ' + spans[index];
        });
        // Enable the compact implicit tracks only after initial spans exist,
        // avoiding a collapsed first paint while measurements are pending.
        if (!enhanced) feed.setAttribute('data-cards-masonry', '');
        enhanced = true;
      }

      if (!observer) {
        observer = new ResizeObserver(function () { schedule(); });
        cards.forEach(function (card) { observer.observe(card); });
      }
    }

    function schedule() {
      if (document.documentElement.classList.contains('cards-lock-scroll')) {
        pending = true;
        return;
      }
      if (!frame) frame = requestAnimationFrame(reflow);
    }

    function onUnlock() {
      if (pending || !enhanced) schedule();
    }

    feed.addEventListener('load', schedule, true);
    window.addEventListener('resize', schedule, { passive: true });
    window.addEventListener('cards:unlocked', onUnlock);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(schedule);

    // The server-rendered grid remains the fallback when JS or
    // ResizeObserver is unavailable; never hide content during setup.
    schedule();
  });
})();
`;
