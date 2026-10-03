(function () {
  'use strict';

  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const root = document.documentElement;
  const reducir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Año del footer ---------- */
  $('#anio').textContent = new Date().getFullYear();

  /* ---------- Cambio de tema claro / oscuro (se recuerda) ---------- */
  $('#btn-tema').addEventListener('click', () => {
    const nuevo = root.dataset.theme === 'dark' ? 'light' : 'dark';
    root.dataset.theme = nuevo;
    try { localStorage.setItem('tema', nuevo); } catch (e) { }
  });

  /* ---------- Menú móvil ---------- */
  const btnMenu = $('#btn-menu');
  function cerrarMenu() {
    document.body.classList.remove('menu-abierto');
    btnMenu.setAttribute('aria-expanded', 'false');
  }
  btnMenu.addEventListener('click', () => {
    const abierto = document.body.classList.toggle('menu-abierto');
    btnMenu.setAttribute('aria-expanded', String(abierto));
  });
  $$('.menu-movil-enlace').forEach(a => a.addEventListener('click', cerrarMenu));
  window.addEventListener('resize', () => { if (window.innerWidth > 960) cerrarMenu(); });

  /* ---------- Barra de progreso de lectura + borde de la nav ---------- */
  const barra = $('#barra-progreso');
  const nav = $('#navbar');
  function alScroll() {
    const alto = document.documentElement.scrollHeight - window.innerHeight;
    barra.style.width = (alto > 0 ? (window.scrollY / alto) * 100 : 0) + '%';
    nav.classList.toggle('scrolled', window.scrollY > 10);
  }
  window.addEventListener('scroll', alScroll, { passive: true });
  alScroll();

  /* ---------- Enlace activo según la sección visible ---------- */
  const enlaces = $$('.nav-enlace');
  const obsSecciones = new IntersectionObserver((entradas) => {
    entradas.forEach(e => {
      if (e.isIntersecting) {
        enlaces.forEach(l => l.classList.toggle('activo', l.getAttribute('href') === '#' + e.target.id));
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  ['inicio', 'sobre-mi', 'proyectos', 'habilidades', 'contacto']
    .forEach(id => { const s = document.getElementById(id); if (s) obsSecciones.observe(s); });

  /* ---------- Efecto máquina de escribir en el hero ---------- */
  const typed = $('#typed');
  const frases = ['Desarrollador de Software', 'Estudiante de SENATI', 'Programador Java y Python', 'Creador de proyectos web'];
  let f = 0, c = 0, borrando = false;
  function escribir() {
    const texto = frases[f];
    typed.textContent = texto.slice(0, c);
    let espera = borrando ? 35 : 80;
    if (!borrando && c === texto.length) { borrando = true; espera = 1600; }
    else if (borrando && c === 0) { borrando = false; f = (f + 1) % frases.length; espera = 350; }
    else { c += borrando ? -1 : 1; }
    setTimeout(escribir, espera);
  }
  if (reducir) typed.textContent = frases[0]; else escribir();

  /* ---------- Aparición de elementos al hacer scroll ---------- */
  const revelables = $$('.reveal');
  if ('IntersectionObserver' in window) {
    const obsReveal = new IntersectionObserver((entradas, obs) => {
      entradas.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revelables.forEach(el => obsReveal.observe(el));
  } else {
    revelables.forEach(el => el.classList.add('visible'));
  }

  /* ---------- Animación de números (contadores y porcentajes) ---------- */
  function contar(el, meta, duracion, formato) {
    if (reducir) { el.textContent = formato(meta); return; }
    const inicio = performance.now();
    (function paso(t) {
      const p = Math.min((t - inicio) / duracion, 1);
      const suave = 1 - Math.pow(1 - p, 3);                 // desaceleración
      el.textContent = formato(Math.round(meta * suave));
      if (p < 1) requestAnimationFrame(paso);
    })(inicio);
  }

  /* ---------- Barras de habilidades: se llenan al entrar en pantalla ---------- */
  const obsSkills = new IntersectionObserver((entradas, obs) => {
    entradas.forEach(e => {
      if (!e.isIntersecting) return;
      const skill = e.target;
      const nivel = +skill.dataset.level;
      $('.skill-fill', skill).style.width = nivel + '%';
      contar($('.skill-num', skill), nivel, 1400, n => n + '%');
      obs.unobserve(skill);
    });
  }, { threshold: 0.4 });
  $$('.skill').forEach(s => obsSkills.observe(s));

  /* ---------- Contadores de estadísticas ---------- */
  const obsStats = new IntersectionObserver((entradas, obs) => {
    entradas.forEach(e => {
      if (!e.isIntersecting) return;
      contar(e.target, +e.target.dataset.contador, 1600, n => String(n));
      obs.unobserve(e.target);
    });
  }, { threshold: 0.6 });
  $$('[data-contador]').forEach(n => obsStats.observe(n));

  /* ---------- Inclinación 3D de la tarjeta de código con el mouse ---------- */
  const card = $('#codigo-card');
  if (card && !reducir && window.matchMedia('(hover: hover)').matches) {
    const zona = card.parentElement;
    zona.addEventListener('mousemove', (e) => {
      const r = zona.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = 'perspective(900px) rotateY(' + (x * 10) + 'deg) rotateX(' + (-y * 10) + 'deg)';
    });
    zona.addEventListener('mouseleave', () => { card.style.transform = ''; });
  }

  /* ---------- Formulario de contacto con validación ---------- */
  const form = $('#form-contacto');
  const panelExito = $('#form-exito');
  const btnEnviar = $('#btn-enviar');

  const reglas = {
    nombre:  v => v.length < 3 ? 'El nombre debe tener al menos 3 caracteres.' : '',
    email:   v => !v ? 'Ingresa tu email.'
                : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? 'El formato del email no es válido.' : '',
    asunto:  v => v.length > 80 ? 'El asunto es demasiado largo (máx. 80).' : '',
    mensaje: v => v.length < 10 ? 'El mensaje debe tener al menos 10 caracteres.' : ''
  };

  function validar(nombre) {
    const input = form.elements[nombre];
    const campo = input.closest('.campo');
    const mensaje = reglas[nombre](input.value.trim());
    campo.classList.toggle('invalid', mensaje !== '');
    $('.error-msg', campo).textContent = mensaje;
    return mensaje === '';
  }

  Object.keys(reglas).forEach(nombre => {
    const input = form.elements[nombre];
    input.addEventListener('blur', () => validar(nombre));
    input.addEventListener('input', () => {                 // corrige en vivo solo si ya tenía error
      if (input.closest('.campo').classList.contains('invalid')) validar(nombre);
    });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();                                     // evita recargar la página
    const todoOk = Object.keys(reglas).map(n => validar(n)).every(Boolean);
    if (!todoOk) {
      const primero = $('.campo.invalid input, .campo.invalid textarea', form);
      if (primero) primero.focus();
      return;
    }
    // Envío simulado: spinner 1.2 s y luego panel de éxito
    btnEnviar.disabled = true;
    btnEnviar.classList.add('enviando');
    setTimeout(() => {
      btnEnviar.disabled = false;
      btnEnviar.classList.remove('enviando');
      form.reset();
      form.hidden = true;
      panelExito.hidden = false;
    }, 1200);
  });

  $('#btn-otro').addEventListener('click', () => {
    panelExito.hidden = true;
    form.hidden = false;
  });
})();