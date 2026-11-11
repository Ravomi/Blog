(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    initCodeBlocks();
    initPostToc();
    initArchiveFilter();
    initLightbox();
    initGlobalSearch();
    initExternalLinks();
  });

  function initCodeBlocks() {
    var blocks = document.querySelectorAll('.highlight');
    blocks.forEach(function (block) {
      if (block.querySelector('.highlight-header')) return;
      var code = block.querySelector('code[data-lang]');
      var lang = code ? code.getAttribute('data-lang') : '';
      var header = document.createElement('div');
      header.className = 'highlight-header';
      header.innerHTML =
        '<span class="highlight-lang">' + (lang || 'code') + '</span>' +
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
    if (headings.length < 2) return;

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
      selectedIdx = -1;

      if (!query) {
        resultsEl.innerHTML = '<div class="search-placeholder">输入关键词搜索文章、周刊或碎碎念…</div>';
        return;
      }

      var matches = indexData.filter(function (item) {
        return (item.title && item.title.toLowerCase().indexOf(query) !== -1) ||
               (item.content && item.content.toLowerCase().indexOf(query) !== -1) ||
               (item.category && item.category.toLowerCase().indexOf(query) !== -1);
      });

      if (!matches.length) {
        resultsEl.innerHTML = '<div class="search-no-results">没有找到与 “' + escapeHtml(q) + '” 相关的内容 🍞</div>';
        return;
      }

      resultsEl.innerHTML = matches.slice(0, 20).map(function (item) {
        var badge = item.section === 'notes' ? '碎碎念' : (item.section === 'weekly' ? '周刊' : (item.section === 'posts' ? '文章' : '页面'));
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
