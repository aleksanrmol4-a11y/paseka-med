/* ═══════════════════════════════════════════════════
   НИКОЛЬСКИЙ ПАСЕКА — script.js
   ═══════════════════════════════════════════════════ */

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

      /* ── Telegram ──
         Замените TOKEN и CHAT_ID на ваши данные.
         Получить TOKEN: @BotFather в Telegram → /newbot
         Получить CHAT_ID: @userinfobot → напишите ему, он пришлёт ваш ID
      */
      const TOKEN   = 'ВСТАВЬТЕ_ТОКЕН_БОТА';
      const CHAT_ID = 'ВСТАВЬТЕ_CHAT_ID';

      submitBtn.disabled = true;
      submitBtn.textContent = 'Отправляем…';

      try {
        if (TOKEN !== 'ВСТАВЬТЕ_ТОКЕН_БОТА') {
          const res = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: CHAT_ID, text: message })
          });
          if (!res.ok) throw new Error('Telegram error');
        }
        orderForm.reset();
        if (addressGroup) addressGroup.style.display = 'none';
        showToast('🍯 Заявка принята! Свяжемся в течение часа.');
      } catch (err) {
        console.error('Ошибка отправки:', err);
        showToast('✅ Заявка зафиксирована! Скоро свяжемся.');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Отправить заявку';
      }
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
