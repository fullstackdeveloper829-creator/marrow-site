// ── SHARED SITE BEHAVIOR (nav, reveal, counters, FAQ, waitlist form) ──────────

// ── NAV ACTIVE LINK BY CURRENT PATH ───────────────────────────────────────────
(function () {
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  document.querySelectorAll('.nav-a[data-path]').forEach((a) => {
    const target = a.dataset.path.replace(/\/$/, '') || '/';
    a.classList.toggle('active', target === path);
  });
})();

// ── NAV SCROLL + ANNOUNCE BAR ─────────────────────────────────────────────────
const navEl = document.getElementById('nav');
const annEl = document.getElementById('announce');
let annHidden = false;
if (navEl) {
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    navEl.classList.toggle('scrolled', y > 10);
    if (annEl) {
      if (y > 80 && !annHidden) { annEl.classList.add('hidden'); annHidden = true; }
      else if (y <= 80 && annHidden) { annEl.classList.remove('hidden'); annHidden = false; }
    }
  }, { passive: true });
}

// ── MOBILE MENU ───────────────────────────────────────────────────────────────
const burgerBtn = document.getElementById('burger'), mobMenu = document.getElementById('mobMenu');
if (burgerBtn && mobMenu) {
  burgerBtn.addEventListener('click', () => {
    const open = mobMenu.classList.toggle('open');
    burgerBtn.setAttribute('aria-expanded', open);
    const [s0, s1, s2] = burgerBtn.querySelectorAll('span');
    if (open) { s0.style.transform = 'translateY(7px) rotate(45deg)'; s1.style.opacity = '0'; s2.style.transform = 'translateY(-7px) rotate(-45deg)'; }
    else { [s0, s1, s2].forEach((s) => { s.style.transform = ''; s.style.opacity = ''; }); }
  });
}
function closeMob() {
  if (!mobMenu || !burgerBtn) return;
  mobMenu.classList.remove('open');
  burgerBtn.setAttribute('aria-expanded', false);
  burgerBtn.querySelectorAll('span').forEach((s) => { s.style.transform = ''; s.style.opacity = ''; });
}

// ── SCROLL REVEAL ─────────────────────────────────────────────────────────────
const ro = new IntersectionObserver((entries) => {
  entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('in'); });
}, { threshold: 0.08, rootMargin: '0px 0px -32px 0px' });
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.reveal').forEach((el) => ro.observe(el));
  requestAnimationFrame(() => requestAnimationFrame(() => {
    document.querySelectorAll('.reveal').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) el.classList.add('in');
    });
  }));

  // ── COUNTER ANIMATION ───────────────────────────────────────────────────────
  const co = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        animCount(e.target, +e.target.dataset.target, e.target.dataset.prefix || '', e.target.dataset.suffix || '');
        co.unobserve(e.target);
      }
    });
  }, { threshold: .5 });
  document.querySelectorAll('[data-target]').forEach((el) => co.observe(el));

  // ── WAITLIST FORM ────────────────────────────────────────────────────────────
  const notifyForm = document.getElementById('notifyForm');
  if (notifyForm) {
    notifyForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.target;
      const email = document.getElementById('nEmail').value.trim();
      const name = document.getElementById('nName').value.trim();
      const btn = document.getElementById('nBtn'), err = document.getElementById('nErr');
      btn.textContent = 'Adding you…'; btn.disabled = true; err.hidden = true;
      try {
        const res = await fetch('/api/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, name, source: window.location.pathname }),
        });
        if (!res.ok) throw 0;
        form.innerHTML = '<p class="notify-done">✓ You\'re on the list — see you at launch.</p>';
      } catch {
        err.textContent = 'Something went wrong — please try again.'; err.hidden = false;
        btn.textContent = 'Notify me when it launches →'; btn.disabled = false;
      }
    });
  }
});

function animCount(el, to, pre = '', suf = '') {
  const dur = 1500, t0 = performance.now();
  const tick = (now) => {
    const p = Math.min((now - t0) / dur, 1), ease = 1 - Math.pow(1 - p, 3);
    el.textContent = pre + Math.round(ease * to) + suf;
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

// ── FAQ ACCORDION ─────────────────────────────────────────────────────────────
function togFaq(btn) {
  const it = btn.closest('.fi'), body = it.querySelector('.fi-body');
  const wasOpen = it.classList.contains('open');
  document.querySelectorAll('.fi.open').forEach((el) => {
    el.classList.remove('open'); el.querySelector('.fi-body').style.maxHeight = '0';
  });
  if (!wasOpen) { it.classList.add('open'); body.style.maxHeight = body.scrollHeight + 'px'; }
}
