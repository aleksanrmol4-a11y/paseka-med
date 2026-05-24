/* ═══════════════════════════════════════════════════
   НИКОЛЬСКИЙ ПАСЕКА — script.js
   ═══════════════════════════════════════════════════ */

/* ── Telegram-бот (общий с сайтом Люсъен: @Alexander_marketing_bot) ── */
const TG_TOKEN = '7818572051:AAEoWoizhJybzlOgGmFmlJjrJ4A4AqQ2Lx0';
const TG_CHAT  = '666070596';

/* ── Онлайн-оплата ──
   ЮKassa (через Cloudflare Worker): впиши адрес задеплоенного воркера,
   например 'https://nikolsky-pay.ИМЯ.workers.dev'. Это включает оплату картой/СБП.
   Секретный ключ ЮKassa хранится в самом воркере, НЕ здесь. */
const PAY_WORKER_URL = '';

/* Запасной вариант — Продамус (для самозанятых, без своего сервера).
   Если используешь его вместо ЮKassa — впиши домен, напр. 'nikolskymed.payform.ru'. */
const PAYFORM_DOMAIN = '';
function sendToTelegram(text) {
  return fetch('https://api.telegram.org/bot' + TG_TOKEN + '/sendMessage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: TG_CHAT, text: text, disable_web_page_preview: true })
  });
}

document.addEventListener('DOMContentLoaded', () => {

  /* ─── COOKIE BANNER ─── */
  const cookieBar = document.getElementById('cookieBar');
  const cookieAccept = document.getElementById('cookieAccept');
  if (cookieBar && !localStorage.getItem('cookieAccepted')) {
    cookieBar.style.display = '';
  } else if (cookieBar) {
    cookieBar.style.display = 'none';
  }
  if (cookieAccept) {
    cookieAccept.addEventListener('click', () => {
      localStorage.setItem('cookieAccepted', '1');
      cookieBar.classList.add('hidden');
      setTimeout(() => cookieBar.style.display = 'none', 350);
    });
  }

  /* ─── HEADER — тень при прокрутке ─── */
  const header = document.getElementById('header');
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });

  /* ─── МОБИЛЬНОЕ МЕНЮ ─── */
  const burger = document.getElementById('burger');
  const nav = document.getElementById('nav');
  if (burger && nav) {
    burger.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('open');
      burger.classList.toggle('open', isOpen);
      burger.setAttribute('aria-label', isOpen ? 'Закрыть меню' : 'Открыть меню');
    });
    nav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        nav.classList.remove('open');
        burger.classList.remove('open');
      });
    });
  }

  /* ─── АКТИВНАЯ ССЫЛКА В NAV ─── */
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav a[href^="#"]');
  const sectionObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(link => {
          link.classList.toggle('active', link.getAttribute('href') === '#' + entry.target.id);
        });
      }
    });
  }, { threshold: 0.4 });
  sections.forEach(s => sectionObserver.observe(s));

  /* ─── FADE-IN АНИМАЦИИ ─── */
  const fadeEls = document.querySelectorAll('.fade-in');
  const fadeObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const parent = entry.target.closest(
          '.products__grid, .delivery__grid, .payment__grid, .reviews__grid, .benefits__grid'
        );
        const delay = parent
          ? Array.from(parent.children).indexOf(entry.target) * 80
          : 0;
        setTimeout(() => entry.target.classList.add('visible'), delay);
        fadeObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  fadeEls.forEach(el => fadeObserver.observe(el));

  /* ─── 3D: ПАРАЛЛАКС HERO-СЦЕНЫ ЗА КУРСОРОМ ─── */
  const heroScene = document.getElementById('heroScene');
  const hero = document.querySelector('.hero');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (heroScene && hero && !reduceMotion && window.matchMedia('(pointer:fine)').matches) {
    let raf = null;
    hero.addEventListener('mousemove', e => {
      const r = hero.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        heroScene.style.transform = `rotateY(${x * 18}deg) rotateX(${-y * 18}deg)`;
      });
    });
    hero.addEventListener('mouseleave', () => {
      heroScene.style.transform = 'rotateY(0) rotateX(0)';
    });
  }

  /* ─── 3D: НАКЛОН КАРТОЧЕК ЗА КУРСОРОМ ─── */
  if (!reduceMotion && window.matchMedia('(pointer:fine)').matches) {
    const tiltCards = document.querySelectorAll(
      '.product-card, .ingredient, .delivery-card, .pay, .review, .benefit, .about__visual'
    );
    tiltCards.forEach(card => {
      card.classList.add('tilt');
      let frame = null;
      card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        if (frame) cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => {
          card.style.transform =
            `perspective(800px) rotateX(${-y * 7}deg) rotateY(${x * 7}deg) translateY(-8px) scale(1.02)`;
        });
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });
  }

  /* ─── КОРЗИНА (localStorage) ─── */
  (function initCart() {
    const KEY = 'nikolsky_cart';
    const drawer = document.getElementById('cartDrawer');
    if (!drawer) return;
    const cartBtn = document.getElementById('cartBtn');
    const overlay = document.getElementById('cartOverlay');
    const closeBtn = document.getElementById('cartClose');
    const body = document.getElementById('cartBody');
    const foot = document.getElementById('cartFoot');
    const countEl = document.getElementById('cartCount');
    const totalEl = document.getElementById('cartTotal');
    const coTotalEl = document.getElementById('coTotal');
    const titleEl = document.getElementById('cartTitle');
    const checkoutBtn = document.getElementById('cartCheckoutBtn');
    const backBtn = document.getElementById('cartBack');
    const checkoutForm = document.getElementById('cartCheckout');
    const toast = document.getElementById('toast');

    let cart = [];
    try { cart = JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { cart = []; }

    const save = () => localStorage.setItem(KEY, JSON.stringify(cart));
    const count = () => cart.reduce((s, i) => s + i.qty, 0);
    const total = () => cart.reduce((s, i) => s + i.qty * i.price, 0);
    const fmt = n => n.toLocaleString('ru-RU') + ' ₽';

    function render() {
      const c = count();
      countEl.textContent = c;
      countEl.classList.toggle('empty', c === 0);
      totalEl.textContent = fmt(total());
      if (coTotalEl) coTotalEl.textContent = fmt(total());
      if (!cart.length) {
        body.innerHTML = '<div class="cart-empty"><span>🛒</span>Корзина пуста.<br>Добавьте мёд из каталога.</div>';
        foot.style.display = 'none';
        return;
      }
      foot.style.display = '';
      body.innerHTML = cart.map(i => `
        <div class="cart-item" data-id="${i.id}">
          <div><div class="cart-item__name">${i.name}</div><div class="cart-item__unit">${i.unit} · ${fmt(i.price)}</div></div>
          <div class="cart-item__price">${fmt(i.price * i.qty)}</div>
          <div class="cart-item__controls">
            <div class="qty">
              <button type="button" data-act="dec" aria-label="Меньше">−</button>
              <span>${i.qty}</span>
              <button type="button" data-act="inc" aria-label="Больше">+</button>
            </div>
            <button type="button" class="cart-item__remove" data-act="rm">Удалить</button>
          </div>
        </div>`).join('');
    }

    function add(item) {
      const ex = cart.find(i => i.id === item.id);
      if (ex) ex.qty++; else cart.push({ ...item, qty: 1 });
      save(); render();
    }
    const openCart = () => { drawer.classList.add('open'); overlay.classList.add('open'); document.body.style.overflow = 'hidden'; };
    const closeCart = () => { drawer.classList.remove('open', 'checkout-mode'); overlay.classList.remove('open'); document.body.style.overflow = ''; if (titleEl) titleEl.textContent = 'Корзина'; };

    document.querySelectorAll('.add-to-cart').forEach(btn => {
      btn.addEventListener('click', () => {
        add({ id: btn.dataset.id, name: btn.dataset.name, price: +btn.dataset.price, unit: btn.dataset.unit || '' });
        openCart();
        const orig = btn.textContent;
        btn.textContent = '✓ В корзине';
        setTimeout(() => { btn.textContent = orig; }, 1200);
      });
    });

    body.addEventListener('click', e => {
      const item = e.target.closest('.cart-item'); if (!item) return;
      const id = item.dataset.id; const obj = cart.find(i => i.id === id); if (!obj) return;
      const act = e.target.dataset.act;
      if (act === 'inc') obj.qty++;
      else if (act === 'dec') { obj.qty--; if (obj.qty <= 0) cart = cart.filter(i => i.id !== id); }
      else if (act === 'rm') cart = cart.filter(i => i.id !== id);
      else return;
      save(); render();
    });

    cartBtn.addEventListener('click', openCart);
    closeBtn.addEventListener('click', closeCart);
    overlay.addEventListener('click', closeCart);

    checkoutBtn.addEventListener('click', () => {
      if (!cart.length) return;
      drawer.classList.add('checkout-mode');
      if (titleEl) titleEl.textContent = 'Оформление';
    });
    backBtn.addEventListener('click', () => {
      drawer.classList.remove('checkout-mode');
      if (titleEl) titleEl.textContent = 'Корзина';
    });

    const coDelivery = document.getElementById('coDelivery');
    const coAddrGroup = document.getElementById('coAddressGroup');
    coDelivery.addEventListener('change', () => {
      coAddrGroup.style.display = coDelivery.value === 'Самовывоз' ? 'none' : '';
    });

    const coPhone = document.getElementById('coPhone');
    coPhone.addEventListener('input', e => {
      let v = e.target.value.replace(/\D/g, '');
      if (v.startsWith('8')) v = '7' + v.slice(1);
      if (!v.startsWith('7') && v.length) v = '7' + v;
      v = v.slice(0, 11);
      let f = '';
      if (v.length) f = '+7';
      if (v.length > 1) f += ' (' + v.slice(1, 4);
      if (v.length >= 4) f += ')';
      if (v.length > 4) f += ' ' + v.slice(4, 7);
      if (v.length > 7) f += '-' + v.slice(7, 9);
      if (v.length > 9) f += '-' + v.slice(9, 11);
      e.target.value = f;
    });

    function shake(el) {
      if (!el) return;
      el.style.animation = 'none'; el.offsetHeight;
      el.style.animation = 'shake .4s ease';
      el.addEventListener('animationend', () => el.style.animation = '', { once: true });
    }

    checkoutForm.addEventListener('submit', e => {
      e.preventDefault();
      const name = document.getElementById('coName').value.trim();
      const phone = document.getElementById('coPhone').value.trim();
      const consent = document.getElementById('coConsent').checked;
      if (!name) { shake(document.getElementById('coName')); return; }
      if (phone.replace(/\D/g, '').length < 11) { shake(document.getElementById('coPhone')); return; }
      if (!consent) { shake(document.getElementById('coConsentLabel')); return; }

      const items = cart.map(i => `• ${i.name} (${i.unit}) ×${i.qty} = ${fmt(i.price * i.qty)}`).join('\n');
      const message =
        `🛒 Заказ — Пасека НИКОЛЬСКИЙ\n──────────────\n${items}\n──────────────\n` +
        `Итого: ${fmt(total())}\n👤 ${name}\n📞 ${phone}\n` +
        `🚚 ${coDelivery.value}\n🏠 ${document.getElementById('coAddress').value || '—'}\n` +
        `💳 ${document.getElementById('coPayment').value}\n💬 ${document.getElementById('coComment').value || '—'}`;

      // Заказ уходит в Telegram-бот @Alexander_marketing_bot
      sendToTelegram(message).catch(() => {});

      const payOnline = document.getElementById('coPayment').value.indexOf('Онлайн') === 0;

      // Онлайн-оплата через ЮKassa (Worker): создаём платёж и уходим на страницу оплаты
      if (PAY_WORKER_URL && payOnline) {
        const co = document.getElementById('coComment').value;
        const itemsCopy = cart.map(i => ({ name: i.name, unit: i.unit, price: i.price, qty: i.qty }));
        fetch(PAY_WORKER_URL.replace(/\/$/, '') + '/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: itemsCopy, phone: phone, delivery: coDelivery.value, comment: co })
        })
          .then(r => r.json())
          .then(d => {
            if (d && d.confirmation_url) {
              cart = []; save(); render(); checkoutForm.reset();
              window.location.href = d.confirmation_url;
            } else { throw new Error('no_url'); }
          })
          .catch(() => {
            cart = []; save(); render(); checkoutForm.reset(); closeCart();
            if (toast) {
              const s = toast.querySelector('span:last-child');
              if (s) s.textContent = 'Заказ принят! Пришлём ссылку на оплату в течение часа.';
              toast.classList.add('show');
              setTimeout(() => toast.classList.remove('show'), 4500);
            }
          });
        return;
      }

      // Онлайн-оплата через Продамус (если используется вместо ЮKassa)
      if (PAYFORM_DOMAIN && payOnline) {
        const p = new URLSearchParams();
        p.set('do', 'pay');
        p.set('order_id', 'NM-' + Date.now());
        p.set('customer_phone', phone);
        cart.forEach((i, idx) => {
          p.set(`products[${idx}][name]`, `${i.name} (${i.unit})`);
          p.set(`products[${idx}][price]`, i.price);
          p.set(`products[${idx}][quantity]`, i.qty);
        });
        p.set('urlSuccess', 'https://nikolskymed.ru/?paid=1');
        const payUrl = 'https://' + PAYFORM_DOMAIN + '/?' + p.toString();
        cart = []; save(); render(); checkoutForm.reset();
        window.location.href = payUrl; // переход на страницу оплаты
        return;
      }

      cart = []; save(); render();
      checkoutForm.reset();
      closeCart();
      if (toast) {
        const s = toast.querySelector('span:last-child');
        if (s) s.textContent = 'Заказ оформлен! Свяжемся в течение часа.';
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 4500);
      }
    });

    render();
  })();

  /* ─── FAQ-АККОРДЕОН ─── */
  document.querySelectorAll('.faq-item').forEach(item => {
    const q = item.querySelector('.faq-q');
    const a = item.querySelector('.faq-a');
    if (!q || !a) return;
    q.addEventListener('click', () => {
      const open = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(o => {
        o.classList.remove('open');
        const oa = o.querySelector('.faq-a');
        if (oa) oa.style.maxHeight = null;
      });
      if (!open) {
        item.classList.add('open');
        a.style.maxHeight = a.scrollHeight + 'px';
      }
    });
  });

  /* ─── ФОРМА АРЕНДЫ УЛЬЯ ─── */
  const rentForm = document.getElementById('rentForm');
  if (rentForm) {
    const toastR = document.getElementById('toast');
    rentForm.addEventListener('submit', e => {
      e.preventDefault();
      const name = rentForm.querySelector('[name="name"]').value.trim();
      const phone = rentForm.querySelector('[name="phone"]').value.trim();
      const consent = rentForm.querySelector('[name="consent"]').checked;
      if (!name || phone.replace(/\D/g, '').length < 11 || !consent) {
        const bad = !name ? rentForm.querySelector('[name="name"]')
          : (phone.replace(/\D/g, '').length < 11 ? rentForm.querySelector('[name="phone"]')
          : rentForm.querySelector('.consent-label'));
        if (bad) { bad.style.animation = 'shake 0.4s ease'; bad.addEventListener('animationend', () => bad.style.animation = '', { once: true }); }
        return;
      }
      const tariff = (rentForm.querySelector('[name="tariff"]') || {}).value || '—';
      const msg = `🐝 Заявка на аренду улья — НИКОЛЬСКИЙ\n──────────────\n👤 ${name}\n📞 ${phone}\n📦 Тариф: ${tariff}`;
      sendToTelegram(msg).catch(() => {});

      rentForm.reset();
      if (toastR) {
        const span = toastR.querySelector('span:last-child');
        if (span) span.textContent = 'Заявка на аренду улья принята! Свяжемся в течение часа.';
        toastR.classList.add('show');
        setTimeout(() => toastR.classList.remove('show'), 4500);
      }
    });
  }

  /* ─── СЛАЙДЕР «ЖИЗНЬ ПАСЕКИ» ─── */
  const slider = document.getElementById('slider');
  if (slider) {
    const track = document.getElementById('sliderTrack');
    const slides = track ? track.children : [];
    const dotsWrap = document.getElementById('sliderDots');
    const prevBtn = document.getElementById('slidePrev');
    const nextBtn = document.getElementById('slideNext');
    let index = 0;
    const total = slides.length;

    // Точки
    for (let i = 0; i < total; i++) {
      const dot = document.createElement('button');
      dot.setAttribute('aria-label', 'Фото ' + (i + 1));
      dot.addEventListener('click', () => go(i));
      dotsWrap.appendChild(dot);
    }
    const dots = dotsWrap.children;

    function render() {
      track.style.transform = 'translateX(' + (-index * 100) + '%)';
      for (let i = 0; i < dots.length; i++) dots[i].classList.toggle('active', i === index);
    }
    function go(i) { index = (i + total) % total; render(); restart(); }
    function next() { go(index + 1); }
    function prev() { go(index - 1); }

    if (nextBtn) nextBtn.addEventListener('click', next);
    if (prevBtn) prevBtn.addEventListener('click', prev);

    // Автопрокрутка
    let timer = null;
    const reduceM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function start() { if (!reduceM) timer = setInterval(next, 4500); }
    function stop() { if (timer) clearInterval(timer); }
    function restart() { stop(); start(); }
    slider.addEventListener('mouseenter', stop);
    slider.addEventListener('mouseleave', start);

    // Свайп на мобильных
    let startX = 0, dx = 0, swiping = false;
    track.addEventListener('touchstart', e => { startX = e.touches[0].clientX; swiping = true; stop(); }, { passive: true });
    track.addEventListener('touchmove', e => { if (swiping) dx = e.touches[0].clientX - startX; }, { passive: true });
    track.addEventListener('touchend', () => {
      if (Math.abs(dx) > 50) (dx < 0 ? next() : prev());
      else start();
      dx = 0; swiping = false;
    });

    render();
    start();
  }

  /* ─── ПОКАЗ ПОЛЯ АДРЕСА ─── */
  const deliveryRadios = document.querySelectorAll('input[name="delivery"]');
  const addressGroup = document.getElementById('addressGroup');
  deliveryRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      if (addressGroup) {
        addressGroup.style.display = radio.value === 'pickup' ? 'none' : 'block';
      }
    });
  });

  /* ─── АВТОФОРМАТ ТЕЛЕФОНА ─── */
  const phoneInput = document.getElementById('phone');
  if (phoneInput) {
    phoneInput.addEventListener('input', e => {
      let v = e.target.value.replace(/\D/g, '');
      if (v.startsWith('8')) v = '7' + v.slice(1);
      if (!v.startsWith('7') && v.length > 0) v = '7' + v;
      v = v.slice(0, 11);
      let fmt = '';
      if (v.length > 0)  fmt  = '+7';
      if (v.length > 1)  fmt += ' (' + v.slice(1, 4);
      if (v.length >= 4) fmt += ')';
      if (v.length > 4)  fmt += ' ' + v.slice(4, 7);
      if (v.length > 7)  fmt += '-' + v.slice(7, 9);
      if (v.length > 9)  fmt += '-' + v.slice(9, 11);
      e.target.value = fmt;
    });
  }

  /* ─── ФОРМА ЗАКАЗА ─── */
  const orderForm = document.getElementById('orderForm');
  const submitBtn = document.getElementById('submitBtn');
  const toast = document.getElementById('toast');
  const consentLabel = document.getElementById('consentLabel');

  if (orderForm) {
    orderForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name    = orderForm.querySelector('#name').value.trim();
      const phone   = orderForm.querySelector('#phone').value.trim();
      const consent = orderForm.querySelector('#consent').checked;

      if (!name) { shake(orderForm.querySelector('#name')); return; }
      if (phone.replace(/\D/g, '').length < 11) { shake(orderForm.querySelector('#phone')); return; }
      if (!consent) {
        shake(consentLabel);
        consentLabel.style.color = '#c0392b';
        setTimeout(() => consentLabel.style.color = '', 2000);
        return;
      }

      const data = new FormData(orderForm);
      const honeyChecked = [...orderForm.querySelectorAll('input[name="honey"]:checked')]
        .map(el => el.value).join(', ') || 'Не указано';
      const delivery = (orderForm.querySelector('input[name="delivery"]:checked') || {}).value || 'Не выбрано';
      const payment  = (orderForm.querySelector('input[name="payment"]:checked') || {}).value  || 'Не выбрано';

      const message =
        `🍯 Новый заказ — Пасека НИКОЛЬСКИЙ\n` +
        `──────────────────────────────\n` +
        `👤 Имя: ${name}\n` +
        `📞 Телефон: ${phone}\n` +
        `📧 Email: ${data.get('email') || '—'}\n` +
        `🍯 Сорта: ${honeyChecked}\n` +
        `⚖️ Объём: ${data.get('weight')} кг\n` +
        `📦 Упаковка: ${data.get('packaging')}\n` +
        `🚚 Доставка: ${delivery}\n` +
        `🏠 Адрес: ${data.get('address') || 'Самовывоз'}\n` +
        `💳 Оплата: ${payment}\n` +
        `💬 Комментарий: ${data.get('comment') || '—'}`;

      // Заявка уходит в Telegram-бот @Alexander_marketing_bot
      sendToTelegram(message).catch(() => {});
      orderForm.reset();
      if (addressGroup) addressGroup.style.display = 'none';
      showToast('🍯 Заявка принята! Свяжемся в течение часа.');
    });
  }

  /* ─── TOAST ─── */
  function showToast(text) {
    if (!toast) return;
    const span = toast.querySelector('span:last-child');
    if (span && text) span.textContent = text;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 4500);
  }

  /* ─── SHAKE-эффект при ошибке ─── */
  function shake(el) {
    if (!el) return;
    el.style.animation = 'none';
    el.offsetHeight;
    el.style.animation = 'shake 0.4s ease';
    el.addEventListener('animationend', () => el.style.animation = '', { once: true });
  }

});

/* Инжектируем CSS-анимацию shake */
const s = document.createElement('style');
s.textContent = `
  @keyframes shake {
    0%,100%{transform:translateX(0)}
    20%{transform:translateX(-7px)}
    40%{transform:translateX(7px)}
    60%{transform:translateX(-4px)}
    80%{transform:translateX(4px)}
  }
`;
document.head.appendChild(s);
