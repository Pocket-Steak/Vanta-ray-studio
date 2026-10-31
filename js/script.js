// Vanta Ray Art — "What we make" accordion + draggable art wall

const SHOP = 'https://www.etsy.com/shop/VantaRayArt';

// listing: paste each piece's Etsy listing URL; empty falls back to the shop page
const ART = [
  { f: 'heyhey.jpg', title: 'Hey Hey Blue', medium: 'Acrylic on canvas', w: 300, mt: 30, rot: -2, listing: '' },
  { f: 'IMG_8389_Original.JPG', title: 'Tuxedo Cat', medium: 'Pet portrait', w: 240, mt: 110, rot: 2.5, listing: '' },
  { f: 'duck.jpg', title: 'The Cosmic Duck', medium: 'Painting, 2024', w: 380, mt: 70, rot: 1, listing: '' },
  { f: 'IMG_8531_Original.JPEG', title: 'Player One', medium: 'Fan art', w: 260, mt: 10, rot: -3, listing: '' },
  { f: 'Witchking.jpg', title: 'The Witch King', medium: 'Ink & digital', w: 300, mt: 120, rot: 1.5, listing: '' },
  { f: 'IMG_9819_Original.JPEG', title: 'Sweet Galaxy', medium: 'Acrylic on canvas', w: 270, mt: 90, rot: -2, listing: '' },
  { f: 'Untitled_Artwork_Original 2.JPEG', title: 'Untitled II', medium: 'Digital', w: 240, mt: 0, rot: 3, listing: '' },
  { f: 'Untitled_Artwork_Original.JPEG', title: 'Untitled I', medium: 'Digital', w: 300, mt: 80, rot: -1.5, listing: '' },
  { f: 'Untitled_Artwork.JPEG', title: 'Untitled', medium: 'Digital', w: 260, mt: 30, rot: 2, listing: '' },
];

document.addEventListener('DOMContentLoaded', () => {
  // Accordion: hover (desktop) or tap opens one row at a time
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
    head.addEventListener('mouseenter', () => { if (matchMedia('(hover:hover)').matches) open(item); });
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
        <img src="images/thumbnails/${encodeURI(a.f)}" alt="${a.title}" loading="lazy" draggable="false">
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
});
