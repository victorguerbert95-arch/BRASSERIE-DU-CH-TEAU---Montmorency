/* ==========================================================================
   Brasserie du Château — scripts du site
   JavaScript « vanilla », sans dépendance. Chaque fonctionnalité est isolée
   dans sa propre fonction et le site reste utilisable si le script échoue
   (amélioration progressive).
   ========================================================================== */
(function () {
  'use strict';

  /* ------------------------------------------------------------------------
     Navigation mobile (menu burger)
     ------------------------------------------------------------------------ */
  function initNav() {
    var header = document.querySelector('.site-header');
    var toggle = document.querySelector('.nav-toggle');
    var nav = document.getElementById('menu-principal');
    if (!header || !toggle || !nav) return;

    var label = toggle.querySelector('.visually-hidden');

    function setOpen(open) {
      toggle.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('is-open', open);
      header.classList.toggle('nav-open', open);
      document.body.classList.toggle('no-scroll', open);
      if (label) label.textContent = open ? 'Fermer le menu' : 'Ouvrir le menu';
    }

    toggle.addEventListener('click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });

    // Ferme le menu après un clic sur un lien
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });

    // Échap ferme le menu et rend le focus au bouton
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        setOpen(false);
        toggle.focus();
      }
    });

    // Si on repasse en affichage desktop, on réinitialise l'état
    var desktop = window.matchMedia('(min-width: 64em)');
    var onChange = function (mq) { if (mq.matches) setOpen(false); };
    if (desktop.addEventListener) desktop.addEventListener('change', onChange);
    else if (desktop.addListener) desktop.addListener(onChange); // Safari < 14
  }

  /* ------------------------------------------------------------------------
     En-tête : fond plein dès qu'on quitte le haut du hero
     ------------------------------------------------------------------------ */
  function initHeaderScroll() {
    var header = document.querySelector('.site-header');
    if (!header) return;

    var update = function () {
      header.classList.toggle('is-scrolled', window.scrollY > 40);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
  }

  /* ------------------------------------------------------------------------
     Lien actif dans la navigation selon la section visible
     ------------------------------------------------------------------------ */
  function initScrollSpy() {
    if (!('IntersectionObserver' in window)) return;
    var links = document.querySelectorAll('.site-nav li a[href^="#"]');
    var map = {};
    links.forEach(function (link) {
      var section = document.querySelector(link.getAttribute('href'));
      if (section) map[section.id] = link;
    });

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (l) { l.classList.remove('is-active'); });
        var active = map[entry.target.id];
        if (active) active.classList.add('is-active');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    Object.keys(map).forEach(function (id) {
      observer.observe(document.getElementById(id));
    });
  }

  /* ------------------------------------------------------------------------
     Statut « Ouvert / Fermé » en direct (fuseau Europe/Paris)
     Les horaires sont lus dans le tableau HTML [data-hours] : une seule
     source à modifier si les horaires changent.
     ------------------------------------------------------------------------ */
  var DAY_NAMES = ['', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];

  // Heure actuelle à Paris, quel que soit le fuseau du visiteur
  function getParisNow() {
    var parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Paris',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23'
    }).formatToParts(new Date());

    var get = function (type) {
      var p = parts.find(function (x) { return x.type === type; });
      return p ? p.value : '';
    };
    var days = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };
    return {
      day: days[get('weekday')],
      minutes: parseInt(get('hour'), 10) * 60 + parseInt(get('minute'), 10)
    };
  }

  function toMinutes(hhmm) {
    var p = hhmm.split(':');
    return parseInt(p[0], 10) * 60 + parseInt(p[1], 10);
  }

  // « 07:00 » -> « 7h », « 19:30 » -> « 19h30 »
  function formatTime(hhmm) {
    var p = hhmm.split(':');
    var h = parseInt(p[0], 10);
    return p[1] === '00' ? h + 'h' : h + 'h' + p[1];
  }

  function initOpeningStatus() {
    var table = document.querySelector('[data-hours]');
    if (!table) return;

    // Lecture des horaires depuis le tableau
    var schedule = {};
    table.querySelectorAll('tr[data-day]').forEach(function (row) {
      schedule[row.dataset.day] = {
        row: row,
        open: row.dataset.open,
        close: row.dataset.close
      };
    });

    function nextOpening(fromDay) {
      for (var i = 1; i <= 7; i++) {
        var d = ((fromDay - 1 + i) % 7) + 1;
        if (schedule[d] && schedule[d].open) {
          return { day: d, offset: i, open: schedule[d].open };
        }
      }
      return null;
    }

    function update() {
      var now = getParisNow();
      var today = schedule[now.day];
      var isOpen = false;
      var text;

      // Mise en évidence du jour courant
      Object.keys(schedule).forEach(function (d) {
        schedule[d].row.classList.toggle('is-today', Number(d) === now.day);
      });

      if (today && today.open) {
        var open = toMinutes(today.open);
        var close = toMinutes(today.close);

        if (now.minutes >= open && now.minutes < close) {
          isOpen = true;
          text = close - now.minutes <= 30
            ? 'Ferme bientôt · ' + formatTime(today.close)
            : 'Ouvert · ferme à ' + formatTime(today.close);
        } else if (now.minutes < open) {
          text = 'Fermé · ouvre à ' + formatTime(today.open);
        }
      }

      if (!text) {
        var next = nextOpening(now.day);
        if (next) {
          var when = next.offset === 1 ? 'demain' : DAY_NAMES[next.day];
          text = 'Fermé · ouvre ' + when + ' à ' + formatTime(next.open);
        } else {
          text = 'Fermé';
        }
      }

      document.querySelectorAll('[data-status]').forEach(function (el) {
        el.classList.toggle('is-open', isOpen);
        el.classList.toggle('is-closed', !isOpen);
        var t = el.querySelector('[data-status-text]');
        if (t) t.textContent = text;
      });
    }

    try {
      update();
      setInterval(update, 60 * 1000); // rafraîchi chaque minute
    } catch (err) {
      // Navigateur trop ancien pour Intl : on garde le texte par défaut
    }
  }

  /* ------------------------------------------------------------------------
     Onglets de la carte (accessibles au clavier : flèches, Début, Fin)
     ------------------------------------------------------------------------ */
  function initTabs() {
    document.querySelectorAll('[data-tabs]').forEach(function (wrapper) {
      var tabs = Array.prototype.slice.call(wrapper.querySelectorAll('[role="tab"]'));
      var panels = tabs.map(function (tab) {
        return document.getElementById(tab.getAttribute('aria-controls'));
      });

      function select(index, focus) {
        tabs.forEach(function (tab, i) {
          var selected = i === index;
          tab.setAttribute('aria-selected', String(selected));
          tab.tabIndex = selected ? 0 : -1;
          if (panels[i]) panels[i].hidden = !selected;
        });
        if (focus) tabs[index].focus();
        // Garde l'onglet visible si la barre défile horizontalement (mobile)
        tabs[index].scrollIntoView({ block: 'nearest', inline: 'nearest' });
      }

      tabs.forEach(function (tab, i) {
        tab.addEventListener('click', function () { select(i, false); });
        tab.addEventListener('keydown', function (e) {
          var last = tabs.length - 1;
          var target = null;
          if (e.key === 'ArrowRight') target = i === last ? 0 : i + 1;
          if (e.key === 'ArrowLeft') target = i === 0 ? last : i - 1;
          if (e.key === 'Home') target = 0;
          if (e.key === 'End') target = last;
          if (target !== null) {
            e.preventDefault();
            select(target, true);
          }
        });
      });

      // État initial : seul le premier panneau est visible
      panels.forEach(function (panel, i) { if (panel) panel.hidden = i !== 0; });
    });
  }

  /* ------------------------------------------------------------------------
     Visionneuse photo (galerie) basée sur l'élément natif <dialog>
     ------------------------------------------------------------------------ */
  function initLightbox() {
    var dialog = document.querySelector('.lightbox');
    var gallery = document.querySelector('[data-gallery]');
    if (!dialog || !gallery || typeof dialog.showModal !== 'function') return;

    var links = Array.prototype.slice.call(gallery.querySelectorAll('a'));
    var img = dialog.querySelector('.lightbox-img');
    var caption = dialog.querySelector('.lightbox-caption');
    var current = 0;

    function show(index) {
      current = (index + links.length) % links.length;
      var thumb = links[current].querySelector('img');
      img.src = links[current].href;
      img.alt = thumb ? thumb.alt : '';
      caption.textContent = thumb ? thumb.alt : '';
    }

    links.forEach(function (link, i) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        show(i);
        dialog.showModal();
        document.body.classList.add('no-scroll');
      });
    });

    dialog.querySelector('.lightbox-close').addEventListener('click', function () { dialog.close(); });
    dialog.querySelector('.lightbox-prev').addEventListener('click', function () { show(current - 1); });
    dialog.querySelector('.lightbox-next').addEventListener('click', function () { show(current + 1); });

    dialog.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') show(current - 1);
      if (e.key === 'ArrowRight') show(current + 1);
    });

    // Clic en dehors de l'image = fermeture
    dialog.addEventListener('click', function (e) {
      if (e.target === dialog || e.target.classList.contains('lightbox-figure')) dialog.close();
    });

    // Glisser à gauche / droite sur mobile
    var startX = null;
    dialog.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; }, { passive: true });
    dialog.addEventListener('touchend', function (e) {
      if (startX === null) return;
      var dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 50) show(dx < 0 ? current + 1 : current - 1);
      startX = null;
    });

    dialog.addEventListener('close', function () {
      document.body.classList.remove('no-scroll');
      links[current].focus();
    });
  }

  /* ------------------------------------------------------------------------
     Apparition des blocs au défilement
     ------------------------------------------------------------------------ */
  function initReveal() {
    var items = document.querySelectorAll('[data-reveal]');
    if (!('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    items.forEach(function (el) { observer.observe(el); });
  }

  /* ------------------------------------------------------------------------
     Images de secours : si une photo ne charge pas, on affiche un fond
     dégradé aux couleurs de la maison plutôt qu'une icône d'image cassée.
     ------------------------------------------------------------------------ */
  function initImageFallback() {
    function markBroken(img) {
      var holder = img.closest('figure, .gallery-item, .hero-media') || img;
      holder.classList.add('img-fallback');
    }
    document.querySelectorAll('main img').forEach(function (img) {
      if (img.complete && img.naturalWidth === 0) {
        markBroken(img);
      } else {
        img.addEventListener('error', function () { markBroken(img); }, { once: true });
      }
    });
  }

  /* ------------------------------------------------------------------------
     Année du copyright
     ------------------------------------------------------------------------ */
  function initYear() {
    document.querySelectorAll('[data-year]').forEach(function (el) {
      el.textContent = new Date().getFullYear();
    });
  }

  /* ------------------------------------------------------------------------
     Lancement
     ------------------------------------------------------------------------ */
  initImageFallback();
  initNav();
  initHeaderScroll();
  initScrollSpy();
  initOpeningStatus();
  initTabs();
  initLightbox();
  initReveal();
  initYear();
})();
