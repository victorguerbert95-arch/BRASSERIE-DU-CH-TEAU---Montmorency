/* ==========================================================================
   G-Soul — scripts du site
   JavaScript « vanilla », sans dépendance. Chaque fonctionnalité est isolée
   dans sa propre fonction : si l'une échoue, le reste du site fonctionne,
   et sans JavaScript tout le contenu reste accessible.
   ========================================================================== */
(function () {
  'use strict';

  /* ------------------------------------------------------------------------
     Navigation mobile (menu burger)
     ------------------------------------------------------------------------ */
  function initNav() {
    var header = document.querySelector('.site-header');
    var toggle = document.querySelector('.nav-toggle');
    var nav = document.getElementById('nav-principale');
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

    // Un clic sur un lien ferme le menu
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

    // Retour en affichage ordinateur : on réinitialise l'état
    var desktop = window.matchMedia('(min-width: 64em)');
    var onChange = function (mq) { if (mq.matches) setOpen(false); };
    if (desktop.addEventListener) desktop.addEventListener('change', onChange);
    else if (desktop.addListener) desktop.addListener(onChange); // Safari < 14
  }

  /* ------------------------------------------------------------------------
     En-tête : fond plein dès qu'on quitte le haut de page
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
    var links = document.querySelectorAll('.site-nav a[href^="#"]');
    var byId = {};
    links.forEach(function (link) {
      var section = document.querySelector(link.getAttribute('href'));
      if (section) byId[section.id] = link;
    });

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (l) { l.classList.remove('is-active'); });
        byId[entry.target.id].classList.add('is-active');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    Object.keys(byId).forEach(function (id) {
      observer.observe(document.getElementById(id));
    });
  }

  /* ------------------------------------------------------------------------
     Statut « Ouvert / Fermé » en direct (heure de Paris)
     Les horaires sont lus dans le tableau [data-hours] :
       <tr data-day="1" data-slots="12:00-16:00,19:00-24:00">
     data-day : 1 = lundi … 7 = dimanche ; 24:00 = minuit.
     ------------------------------------------------------------------------ */
  var DAY_NAMES = ['', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];

  // Jour et minute actuels à Paris, quel que soit le fuseau du visiteur
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

  // 720 -> « 12h », 1170 -> « 19h30 », 1440 -> « minuit »
  function formatTime(minutes) {
    if (minutes >= 1440) return 'minuit';
    var h = Math.floor(minutes / 60);
    var m = minutes % 60;
    return m === 0 ? h + 'h' : h + 'h' + (m < 10 ? '0' + m : m);
  }

  // « 12:00-16:00,19:00-24:00 » -> [{open: 720, close: 960}, {open: 1140, close: 1440}]
  function parseSlots(str) {
    if (!str) return [];
    return str.split(',').map(function (slot) {
      var p = slot.trim().split('-');
      return { open: toMinutes(p[0]), close: toMinutes(p[1]) };
    });
  }

  function computeStatus(schedule, now) {
    var today = schedule[now.day] ? schedule[now.day].slots : [];
    var i, slot;

    // Ouvert en ce moment ?
    for (i = 0; i < today.length; i++) {
      slot = today[i];
      if (now.minutes >= slot.open && now.minutes < slot.close) {
        var soon = slot.close - now.minutes <= 30;
        var at = slot.close >= 1440 ? 'minuit' : formatTime(slot.close);
        return {
          open: true,
          text: soon ? 'Ferme bientôt · ' + at : 'Ouvert · ferme à ' + at
        };
      }
    }

    // Prochain créneau plus tard dans la journée
    for (i = 0; i < today.length; i++) {
      slot = today[i];
      if (slot.open > now.minutes) {
        var verb = i > 0 ? 'rouvre' : 'ouvre';
        return { open: false, text: 'Fermé · ' + verb + ' à ' + formatTime(slot.open) };
      }
    }

    // Sinon, premier créneau des jours suivants
    for (var offset = 1; offset <= 7; offset++) {
      var d = ((now.day - 1 + offset) % 7) + 1;
      var slots = schedule[d] ? schedule[d].slots : [];
      if (slots.length) {
        var when = offset === 1 ? 'demain' : DAY_NAMES[d];
        return { open: false, text: 'Fermé · ouvre ' + when + ' à ' + formatTime(slots[0].open) };
      }
    }
    return { open: false, text: 'Fermé' };
  }

  function initOpeningStatus() {
    var table = document.querySelector('[data-hours]');
    if (!table) return;

    var schedule = {};
    table.querySelectorAll('tr[data-day]').forEach(function (row) {
      schedule[row.dataset.day] = { row: row, slots: parseSlots(row.dataset.slots) };
    });

    function update() {
      var now = getParisNow();
      var status = computeStatus(schedule, now);

      // Mise en évidence du jour courant dans le tableau
      Object.keys(schedule).forEach(function (d) {
        schedule[d].row.classList.toggle('is-today', Number(d) === now.day);
      });

      document.querySelectorAll('[data-status]').forEach(function (el) {
        el.classList.toggle('is-open', status.open);
        el.classList.toggle('is-closed', !status.open);
        var t = el.querySelector('[data-status-text]');
        if (t) t.textContent = status.text;
      });
    }

    try {
      update();
      setInterval(update, 60 * 1000); // rafraîchi chaque minute
    } catch (err) {
      // Intl indisponible : on garde le texte statique du HTML
    }
  }

  /* ------------------------------------------------------------------------
     Onglets de la carte (pattern ARIA « tabs », navigation aux flèches)
     ------------------------------------------------------------------------ */
  function initTabs() {
    document.querySelectorAll('[data-tabs]').forEach(function (root) {
      var list = root.querySelector('[role="tablist"]');
      var tabs = Array.prototype.slice.call(root.querySelectorAll('[role="tab"]'));
      var panels = tabs.map(function (t) { return document.getElementById(t.getAttribute('aria-controls')); });
      if (!list || !tabs.length) return;

      function select(index, focus) {
        tabs.forEach(function (tab, i) {
          var active = i === index;
          tab.setAttribute('aria-selected', String(active));
          tab.tabIndex = active ? 0 : -1;
          if (panels[i]) panels[i].hidden = !active;
        });
        if (focus) tabs[index].focus();
        // Garde l'onglet visible si la barre défile horizontalement
        if (tabs[index].scrollIntoView) {
          tabs[index].scrollIntoView({ block: 'nearest', inline: 'nearest' });
        }
      }

      tabs.forEach(function (tab, i) {
        tab.addEventListener('click', function () { select(i, false); });
        tab.addEventListener('keydown', function (e) {
          var next = null;
          if (e.key === 'ArrowRight') next = (i + 1) % tabs.length;
          else if (e.key === 'ArrowLeft') next = (i - 1 + tabs.length) % tabs.length;
          else if (e.key === 'Home') next = 0;
          else if (e.key === 'End') next = tabs.length - 1;
          if (next !== null) { e.preventDefault(); select(next, true); }
        });
      });

      // Active le mode onglets (sans JS, tout reste affiché)
      root.classList.add('js-tabs');
      list.hidden = false;
      panels.forEach(function (p) { if (p) p.tabIndex = 0; });
      tabs.forEach(function (tab, i) {
        if (panels[i]) panels[i].hidden = tab.getAttribute('aria-selected') !== 'true';
      });
    });
  }

  /* ------------------------------------------------------------------------
     Visionneuse photo (élément <dialog>)
     Sans JS ou sans support de <dialog>, les liens ouvrent l'image.
     ------------------------------------------------------------------------ */
  function initLightbox() {
    var gallery = document.querySelector('[data-gallery]');
    var dialog = document.querySelector('.lightbox');
    if (!gallery || !dialog || typeof dialog.showModal !== 'function') return;

    var links = Array.prototype.slice.call(gallery.querySelectorAll('a'));
    var img = dialog.querySelector('.lb-img');
    var caption = dialog.querySelector('.lb-caption');
    var current = 0;

    function show(index) {
      current = (index + links.length) % links.length;
      var link = links[current];
      var thumb = link.querySelector('img');
      img.src = link.getAttribute('href');
      img.alt = thumb ? thumb.alt : '';
      caption.textContent = (thumb ? thumb.alt + ' · ' : '') + (current + 1) + '/' + links.length;
    }

    links.forEach(function (link, i) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        show(i);
        dialog.showModal();
        document.body.classList.add('no-scroll');
      });
    });

    dialog.querySelector('.lb-close').addEventListener('click', function () { dialog.close(); });
    dialog.querySelector('.lb-prev').addEventListener('click', function () { show(current - 1); });
    dialog.querySelector('.lb-next').addEventListener('click', function () { show(current + 1); });

    // Clic sur le fond = fermeture
    dialog.addEventListener('click', function (e) {
      if (e.target === dialog) dialog.close();
    });

    dialog.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') show(current + 1);
      if (e.key === 'ArrowLeft') show(current - 1);
    });

    // Balayage gauche/droite sur mobile
    var startX = null;
    dialog.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; }, { passive: true });
    dialog.addEventListener('touchend', function (e) {
      if (startX === null) return;
      var dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));
      startX = null;
    });

    dialog.addEventListener('close', function () {
      document.body.classList.remove('no-scroll');
      img.removeAttribute('src');
      if (links[current]) links[current].focus();
    });
  }

  /* ------------------------------------------------------------------------
     Image de secours : si une photo ne charge pas, on affiche un dégradé
     aux couleurs du restaurant plutôt qu'une icône cassée.
     ------------------------------------------------------------------------ */
  function initImageFallback() {
    document.querySelectorAll('img[data-fallback]').forEach(function (img) {
      var fail = function () {
        img.classList.add('img-fallback');
        // Dans un <picture>, les <source> l'emportent sur src : on les retire
        if (img.parentNode && img.parentNode.tagName === 'PICTURE') {
          img.parentNode.querySelectorAll('source').forEach(function (s) { s.remove(); });
        }
        // Pixel transparent : supprime l'icône « image cassée » du navigateur
        img.src = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
      };
      if (img.complete && img.naturalWidth === 0 && img.getAttribute('src')) fail();
      else img.addEventListener('error', fail, { once: true });
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

  // Lancement : chaque module est protégé pour ne pas bloquer les autres
  [initImageFallback, initNav, initHeaderScroll, initScrollSpy, initOpeningStatus, initTabs, initLightbox, initYear]
    .forEach(function (fn) {
      try { fn(); } catch (err) { if (window.console) console.error(err); }
    });
})();
