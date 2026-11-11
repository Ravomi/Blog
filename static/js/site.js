(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    initHeaderScroll();
    initBannerFit();
    initFireworkCanvas();
    initCodeBlocks();
    initPostToc();
    initArchiveFilter();
    initLightbox();
    initGlobalSearch();
    initExternalLinks();
  });

  function initHeaderScroll() {
    var header = document.getElementById('J_header');
    if (!header) return;
    var lastY = window.scrollY || 0;
    window.addEventListener('scroll', function () {
      var y = window.scrollY || 0;
      var delta = y - lastY;
      if (window.innerWidth >= 736) {
        if (delta > 6 && y > 80) {
          header.classList.add('header-menu-overflow');
        } else if (delta < -4 || y <= 40) {
          header.classList.remove('header-menu-overflow');
        }
      }
      lastY = y;
    }, { passive: true });
  }

  function initBannerFit() {
    var svg = document.querySelector('.entry-header svg');
    var text = svg && svg.querySelector('text');
    if (!svg || !text) return;

    var baseSize = parseFloat(text.getAttribute('font-size')) || 38;
    var baseLetter = parseFloat(text.getAttribute('letter-spacing')) || 4;

    var fit = function () {
      var avail = svg.clientWidth - 64;
      if (avail <= 0) return;
      text.setAttribute('font-size', baseSize);
      text.setAttribute('letter-spacing', baseLetter);
      var natural = text.getComputedTextLength ? text.getComputedTextLength() : 0;
      if (natural > avail && natural > 0) {
        var scale = Math.max(0.5, avail / natural);
        text.setAttribute('font-size', (baseSize * scale).toFixed(1));
        text.setAttribute('letter-spacing', (baseLetter * scale).toFixed(2));
      }
    };

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(fit);
    }
    fit();
    window.addEventListener('resize', fit);
  }

  function initFireworkCanvas() {
    var canvas = document.getElementById('J_firework_canvas');
    if (!canvas || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var header = canvas.parentElement;
    var ctx = canvas.getContext('2d');
    if (!ctx) return;

    var resize = function () {
      canvas.width = header.clientWidth || window.innerWidth;
      canvas.height = header.clientHeight || 250;
    };
    resize();
    window.addEventListener('resize', resize);

    var particles = [];
    var colors = ['#f3ebdb', '#ffca85', '#e8c39e', '#fff6e5'];
    var running = false;

    header.addEventListener('mousemove', function (e) {
      var rect = canvas.getBoundingClientRect();
      var x = e.clientX - rect.left;
      var y = e.clientY - rect.top;
      if (particles.length < 70) {
        particles.push({
          x: x + (Math.random() - 0.5) * 14,
          y: y + (Math.random() - 0.5) * 14,
          vy: 0.5 + Math.random() * 1.3,
          r: 1.2 + Math.random() * 2.2,
          alpha: 0.45 + Math.random() * 0.4,
          color: colors[Math.floor(Math.random() * colors.length)]
        });
      }
      if (!running) {
        running = true;
        requestAnimationFrame(tick);
      }
    });

    function tick() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (var i = particles.length - 1; i >= 0; i--) {
        var p = particles[i];
        p.y += p.vy;
        p.alpha -= 0.008;
        if (p.y > canvas.height || p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      if (particles.length > 0) {
        requestAnimationFrame(tick);
      } else {
        running = false;
      }
    }
  }

  function initCodeBlocks() {
    var blocks = document.querySelectorAll('.highlight');
    blocks.forEach(function (block) {
      if (block.querySelector('.highlight-header')) return;
      var code = block.querySelector('code[data-lang]');
      var lang = code ? code.getAttribute('data-lang') : '';
      var header = document.createElement('div');
      header.className = 'highlight-header';
      header.innerHTML =
        '<div class="highlight-dots"><span class="dot-red"></span><span class="dot-yellow"></span><span class="dot-green"></span></div>' +
        '<span class="highlight-lang">' + (lang || '') + '</span>' +
        '<button type="button" class="copy-btn">复制</button>';
      block.insertBefore(header, block.firstChild);

      var btn = header.querySelector('.copy-btn');
      btn.addEventListener('click', function () {
        var text = block.querySelector('pre').innerText;
        navigator.clipboard.writeText(text).then(function () {
          btn.textContent = '已复制';
          setTimeout(function () { btn.textContent = '复制'; }, 1500);
        });
      });
    });
  }

  function initPostToc() {
    if (document.body.id !== 'post') return;
    var content = document.querySelector('.entry-content');
    var toc = document.getElementById('J_post_toc');
    var nav = document.getElementById('J_post_toc_nav');
    if (!content || !toc || !nav) return;

    var headings = Array.prototype.slice.call(content.querySelectorAll('h2, h3')).filter(function (h) {
      return h.textContent && h.textContent.trim();
    });
    if (headings.length < 3) return;

    headings.forEach(function (h, idx) {
      if (!h.id) h.id = 'sec-' + (idx + 1);
      var a = document.createElement('a');
      a.className = 'post-toc-link' + (h.tagName.toLowerCase() === 'h3' ? ' is-child' : '');
      a.href = '#' + h.id;
      a.textContent = h.textContent.trim();
      a.dataset.target = h.id;
      nav.appendChild(a);
    });

    toc.hidden = false;
    document.body.classList.add('has-post-toc');

    var links = Array.prototype.slice.call(nav.querySelectorAll('.post-toc-link'));
    var update = function () {
      var pivot = window.innerHeight * 0.24;
      var activeId = headings[0].id;
      headings.forEach(function (h) {
        if (h.getBoundingClientRect().top <= pivot) activeId = h.id;
      });
      links.forEach(function (l) {
        l.classList.toggle('is-active', l.dataset.target === activeId);
      });
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
  }

  function initArchiveFilter() {
    var nav = document.getElementById('J_archive_cats');
    if (!nav) return;
    var buttons = Array.prototype.slice.call(nav.querySelectorAll('button[data-cat]'));
    var groups = Array.prototype.slice.call(document.querySelectorAll('.archive-group'));

    var applyCat = function (cat) {
      buttons.forEach(function (b) {
        b.setAttribute('aria-pressed', b.dataset.cat === cat ? 'true' : 'false');
      });
      groups.forEach(function (g) {
        g.hidden = !!(cat && g.dataset.group !== cat);
      });
    };

    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var cat = btn.dataset.cat;
        applyCat(cat);
        if (cat) {
          history.replaceState(null, '', '#' + cat);
        } else {
          history.replaceState(null, '', location.pathname);
        }
      });
    });

    var hash = location.hash.replace('#', '');
    if (hash && groups.some(function (g) { return g.dataset.group === hash; })) {
      applyCat(hash);
    }
  }

  function initLightbox() {
    var backdrop = document.getElementById('J_lightbox');
    var lightImg = document.getElementById('J_lightbox_img');
    if (!backdrop || !lightImg) return;

    document.addEventListener('click', function (e) {
      var img = e.target.closest && e.target.closest('.entry-content img, .note-media img');
      if (!img || img.classList.contains('no-zoom')) return;
      lightImg.src = img.currentSrc || img.src;
      lightImg.alt = img.alt || '';
      backdrop.classList.add('active');
      backdrop.setAttribute('aria-hidden', 'false');
    });

    var close = function () {
      backdrop.classList.remove('active');
      backdrop.setAttribute('aria-hidden', 'true');
    };
    backdrop.addEventListener('click', close);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && backdrop.classList.contains('active')) close();
    });
  }

  function initGlobalSearch() {
    var btn = document.getElementById('search-btn');
    var modal = document.getElementById('search-modal');
    var input = document.getElementById('search-input');
    var closeBtn = document.getElementById('search-close');
    var resultsEl = document.getElementById('search-results');
    if (!btn || !modal || !input || !resultsEl) return;

    var indexData = null;
    var selectedIdx = -1;

    var loadIndex = function () {
      if (indexData) return Promise.resolve(indexData);
      var base = (document.body && document.body.dataset.baseurl) || '/';
      return fetch(base.replace(/\/?$/, '/') + 'index.json')
        .then(function (r) { return r.json(); })
        .then(function (data) { indexData = data; return data; })
        .catch(function () { indexData = []; return []; });
    };

    var openModal = function () {
      modal.classList.add('active');
      modal.setAttribute('aria-hidden', 'false');
      loadIndex().then(function () { renderResults(input.value); });
      setTimeout(function () { input.focus(); }, 30);
    };

    var closeModal = function () {
      modal.classList.remove('active');
      modal.setAttribute('aria-hidden', 'true');
    };

    var escapeHtml = function (s) {
      return String(s).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
      });
    };

    var renderResults = function (q) {
      if (!indexData) return;
      var query = (q || '').trim().toLowerCase();
      var matches = query
        ? indexData.filter(function (item) {
            return (item.title && item.title.toLowerCase().indexOf(query) !== -1) ||
                   (item.content && item.content.toLowerCase().indexOf(query) !== -1) ||
                   (item.category && item.category.toLowerCase().indexOf(query) !== -1);
          })
        : indexData.slice(0, 8);

      selectedIdx = -1;
      if (!matches.length) {
        resultsEl.innerHTML = '<div class="search-no-results">没有找到相关内容 🍞</div>';
        return;
      }

      resultsEl.innerHTML = matches.slice(0, 20).map(function (item) {
        var badge = item.section === 'notes' ? 'Note' : (item.section === 'posts' ? 'Blog' : 'Page');
        return '<a class="search-result-item" href="' + escapeHtml(item.url) + '">' +
          '<div class="search-result-title"><span class="search-badge">' + badge + '</span><span>' + escapeHtml(item.title) + '</span></div>' +
          '<div class="search-result-snippet">' + escapeHtml(item.content || '') + '</div>' +
          '<div class="search-result-meta">' + escapeHtml(item.date || '') + (item.category ? ' · ' + escapeHtml(item.category) : '') + '</div>' +
        '</a>';
      }).join('');
    };

    btn.addEventListener('click', openModal);
    closeBtn && closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', function (e) {
      if (e.target === modal) closeModal();
    });

    input.addEventListener('input', function () {
      renderResults(input.value);
    });

    document.addEventListener('keydown', function (e) {
      var tag = (e.target && e.target.tagName) || '';
      var isInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (e.target && e.target.isContentEditable);

      if (e.key === '/' && !isInput && !modal.classList.contains('active')) {
        e.preventDefault();
        openModal();
        return;
      }

      if (!modal.classList.contains('active')) return;

      if (e.key === 'Escape') {
        closeModal();
        return;
      }

      var items = Array.prototype.slice.call(resultsEl.querySelectorAll('.search-result-item'));
      if (!items.length) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectedIdx = (selectedIdx + 1) % items.length;
        items.forEach(function (el, i) { el.classList.toggle('is-selected', i === selectedIdx); });
        items[selectedIdx].scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectedIdx = (selectedIdx - 1 + items.length) % items.length;
        items.forEach(function (el, i) { el.classList.toggle('is-selected', i === selectedIdx); });
        items[selectedIdx].scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'Enter' && selectedIdx >= 0 && items[selectedIdx]) {
        e.preventDefault();
        location.href = items[selectedIdx].getAttribute('href');
      }
    });
  }

  function initExternalLinks() {
    Array.prototype.forEach.call(document.links, function (link) {
      if (link.hostname && link.hostname !== location.hostname) {
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
      }
    });
  }
})();
