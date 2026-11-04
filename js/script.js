// Vanta Ray Art — "What we make" accordion + draggable art wall

const SHOP = 'https://www.etsy.com/shop/VantaRayArt';

// listing: paste each piece's Etsy listing URL; empty falls back to the shop page
const ART = [
  { f: 'product_0757.jpg', title: 'Kris', medium: 'Acrylic on canvas', w: 280, mt: 30, rot: -2, listing: '' },
  { f: 'product_0821.jpg', title: 'D.Va', medium: 'Acrylic on canvas', w: 400, mt: 110, rot: 1.5, listing: '' },
  { f: 'product_0763.jpg', title: 'Cynthia', medium: 'Painted, wood frame', w: 260, mt: 60, rot: 2.5, listing: '' },
  { f: 'product_0828.jpg', title: 'The Cottage', medium: 'Acrylic on canvas', w: 360, mt: 0, rot: -1, listing: '' },
  { v: 'product_0806', title: 'Nope. Deck Box', medium: 'Hand-painted', w: 220, mt: 90, rot: -3, listing: '' },
  { f: 'product_0773.jpg', title: 'Good Guys', medium: 'Painted box', w: 280, mt: 40, rot: 2, listing: '' },
  { f: 'product_0835.jpg', title: 'Galaxy Dessert', medium: 'Acrylic on canvas', w: 270, mt: 120, rot: -1.5, listing: '' },
  { f: 'product_0794.jpg', title: 'Flash Box', medium: 'Hand-painted keepsake box', w: 340, mt: 20, rot: 1, listing: '' },
  { f: 'product_0770.jpg', title: 'Junkrat', medium: 'Painted, wood frame', w: 260, mt: 100, rot: 3, listing: '' },
  { f: 'product_0804.jpg', title: 'Top Hat Pop', medium: 'Hand-painted wood', w: 220, mt: 10, rot: -2, listing: '' },
  { f: 'product_0792.jpg', title: 'Nope. Deck Box', medium: 'Inside view', w: 240, mt: 80, rot: 2, listing: '' },
];

document.addEventListener('DOMContentLoaded', () => {
  // Accordion: click or tap opens one row at a time
  const items = [...document.querySelectorAll('.make-item')];
  const open = (item) => {
    items.forEach((it) => {
      const on = it === item;
      it.classList.toggle('is-open', on);
      it.querySelector('.make-head').setAttribute('aria-expanded', on);
    });
  };
  items.forEach((item) => {
    const head = item.querySelector('.make-head');
    head.addEventListener('click', () => open(item));
  });

  // Wall
  const row = document.getElementById('wall-row');
  const track = document.getElementById('wall-track');
  const narrow = matchMedia('(max-width:640px)').matches;
  ART.forEach((a) => {
    const url = a.listing || SHOP;
    const piece = document.createElement('div');
    piece.className = 'wall-piece';
    piece.style.width = (narrow ? Math.round(a.w * 0.8) : a.w) + 'px';
    piece.style.marginTop = (narrow ? Math.round(a.mt * 0.5) : a.mt) + 'px';
    piece.style.transform = `rotate(${a.rot}deg)`;
    piece.innerHTML = `
      <a class="wall-frame" href="${url}" target="_blank" rel="noopener" draggable="false">
        ${a.v
          ? `<video src="videos/${a.v}.mp4" poster="videos/${a.v}.jpg" autoplay muted loop playsinline preload="metadata" aria-label="${a.title}"></video>`
          : `<img src="images/thumbnails/${encodeURI(a.f)}" alt="${a.title}" loading="lazy" draggable="false">`}
      </a>
      <div class="wall-caption">
        <div class="wall-caption-text">
          <span class="wall-title">${a.title}</span>
          <span class="wall-medium">${a.medium}</span>
        </div>
        <a class="wall-buy" href="${url}" target="_blank" rel="noopener" draggable="false">Etsy ↗</a>
      </div>`;
    row.appendChild(piece);
  });

  document.querySelectorAll('[data-wall]').forEach((btn) => {
    btn.addEventListener('click', () => {
      track.scrollBy({ left: Number(btn.dataset.wall) * track.clientWidth * 0.7, behavior: 'smooth' });
    });
  });

  // Mouse drag to scroll; a drag never counts as a click on a piece
  track.addEventListener('mousedown', (e) => {
    const x0 = e.clientX;
    const s0 = track.scrollLeft;
    let moved = false;
    track.classList.add('is-dragging');
    const move = (ev) => {
      const dx = ev.clientX - x0;
      if (Math.abs(dx) > 4) moved = true;
      track.scrollLeft = s0 - dx;
    };
    const up = () => {
      track.classList.remove('is-dragging');
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
      if (moved) {
        const kill = (ev) => { ev.stopPropagation(); ev.preventDefault(); };
        track.addEventListener('click', kill, { capture: true, once: true });
        setTimeout(() => track.removeEventListener('click', kill, { capture: true }), 50);
      }
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  });

  // Silent product videos: hold on the poster frame for reduced-motion visitors
  if (matchMedia('(prefers-reduced-motion:reduce)').matches) {
    document.querySelectorAll('video').forEach((v) => { v.removeAttribute('autoplay'); v.pause(); });
  }
});
