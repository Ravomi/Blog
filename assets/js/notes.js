(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    initNoteInteractions();
    initNotesFilter();
  });

  function initNoteInteractions() {
    var storageKey = 'waya_bakery_liked_notes';
    var likedMap = {};
    try {
      likedMap = JSON.parse(localStorage.getItem(storageKey) || '{}') || {};
    } catch (_) {}

    // Hydrate like states
    document.querySelectorAll('.note-like-btn').forEach(function (btn) {
      var id = btn.dataset.likeId;
      var base = parseInt(btn.dataset.baseLikes || '0', 10);
      var countEl = btn.querySelector('.note-like-count');
      if (likedMap[id]) {
        btn.classList.add('is-liked');
        if (countEl) countEl.textContent = String(base + 1);
      }
      var card = btn.closest('.note');
      if (card && likedMap[id]) {
        card.dataset.likes = String(base + 1);
      }

      btn.addEventListener('click', function () {
        var nowLiked = !likedMap[id];
        if (nowLiked) {
          likedMap[id] = 1;
        } else {
          delete likedMap[id];
        }
        try {
          localStorage.setItem(storageKey, JSON.stringify(likedMap));
        } catch (_) {}
        var total = base + (nowLiked ? 1 : 0);
        btn.classList.toggle('is-liked', nowLiked);
        if (countEl) countEl.textContent = String(total);
        if (card) card.dataset.likes = String(total);
      });
    });

    // Unfold long notes inline
    document.addEventListener('click', function (e) {
      var unfold = e.target.closest && e.target.closest('[data-unfold]');
      if (unfold) {
        var note = unfold.closest('.note');
        if (note) {
          note.classList.remove('note-fold');
          unfold.remove();
        }
        return;
      }

      var share = e.target.closest && e.target.closest('[data-copy-url]');
      if (share) {
        var url = share.dataset.copyUrl;
        var label = share.querySelector('.note-copy-label');
        if (navigator.clipboard && url) {
          navigator.clipboard.writeText(url).then(function () {
            if (label) {
              label.textContent = '已复制';
              setTimeout(function () { label.textContent = '分享'; }, 1400);
            }
          });
        }
      }
    });
  }

  function initNotesFilter() {
    var bar = document.getElementById('J_notes_bar');
    var list = document.getElementById('J_notes');
    var empty = document.getElementById('J_notes_empty');
    if (!bar || !list) return;

    var selCat = document.getElementById('J_notes_c');
    var selYear = document.getElementById('J_notes_y');
    var selType = document.getElementById('J_notes_t');
    var selSort = document.getElementById('J_notes_sort');
    var findBtn = document.getElementById('J_notes_find');
    var qInput = document.getElementById('J_notes_q');
    var monthBtns = Array.prototype.slice.call(document.querySelectorAll('.notes-year button[data-ym]'));
    var notes = Array.prototype.slice.call(list.querySelectorAll('.note'));

    var activeMonth = '';

    var syncFromUrl = function () {
      var params = new URLSearchParams(location.search);
      if (selCat) selCat.value = params.get('c') || '';
      if (selYear) selYear.value = params.get('y') || '';
      if (selType) selType.value = params.get('t') || '';
      if (selSort) selSort.value = params.get('sort') || '';
      activeMonth = params.get('ym') || '';

      var q = params.get('q') || '';
      var tag = params.get('tag') || '';
      if (tag && !q) q = '#' + tag;
      if (qInput) {
        qInput.value = q;
        if (q) {
          bar.classList.add('is-searching');
          findBtn && findBtn.setAttribute('aria-expanded', 'true');
        }
      }
    };

    var syncToUrl = function () {
      var params = new URLSearchParams();
      if (selCat && selCat.value) params.set('c', selCat.value);
      if (selYear && selYear.value) params.set('y', selYear.value);
      if (selType && selType.value) params.set('t', selType.value);
      if (selSort && selSort.value) params.set('sort', selSort.value);
      if (activeMonth) params.set('ym', activeMonth);
      if (qInput && qInput.value.trim()) params.set('q', qInput.value.trim());

      var qs = params.toString();
      history.replaceState(null, '', location.pathname + (qs ? '?' + qs : ''));
    };

    var apply = function () {
      var cat = (selCat && selCat.value) || '';
      var year = (selYear && selYear.value) || '';
      var type = (selType && selType.value) || '';
      var sort = (selSort && selSort.value) || '';
      var query = ((qInput && qInput.value) || '').trim().toLowerCase();

      var sorted = notes.slice();
      sorted.sort(function (a, b) {
        if (sort === 'old') {
          return Number(a.dataset.date) - Number(b.dataset.date);
        }
        if (sort === 'like') {
          var diff = Number(b.dataset.likes) - Number(a.dataset.likes);
          return diff !== 0 ? diff : Number(b.dataset.date) - Number(a.dataset.date);
        }
        return Number(b.dataset.date) - Number(a.dataset.date);
      });

      var visibleCount = 0;
      sorted.forEach(function (note) {
        list.appendChild(note);
        var matchCat = !cat || note.dataset.cat === cat;
        var matchYear = !year || note.dataset.year === year;
        var matchMonth = !activeMonth || note.dataset.month === activeMonth;
        var types = (note.dataset.type || '').split(',');
        var matchType = !type || types.indexOf(type) !== -1;
        var matchQ = !query || (note.dataset.search || '').indexOf(query) !== -1;

        var show = matchCat && matchYear && matchMonth && matchType && matchQ;
        note.hidden = !show;
        if (show) visibleCount++;
      });

      if (empty) empty.hidden = visibleCount > 0;
      monthBtns.forEach(function (b) {
        b.classList.toggle('is-active', b.dataset.ym === activeMonth);
      });
    };

    [selCat, selYear, selType, selSort].forEach(function (sel) {
      if (!sel) return;
      sel.addEventListener('change', function () {
        if (sel === selYear && selYear.value) activeMonth = '';
        syncToUrl();
        apply();
      });
    });

    if (findBtn && qInput) {
      findBtn.addEventListener('click', function () {
        var open = bar.classList.toggle('is-searching');
        findBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (open) {
          qInput.focus();
        } else if (qInput.value) {
          qInput.value = '';
          syncToUrl();
          apply();
        }
      });

      qInput.addEventListener('input', function () {
        syncToUrl();
        apply();
      });
    }

    monthBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        activeMonth = activeMonth === btn.dataset.ym ? '' : btn.dataset.ym;
        if (activeMonth && selYear) selYear.value = '';
        syncToUrl();
        apply();
        bar.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    // Inline category & tag quick filter clicks
    list.addEventListener('click', function (e) {
      var catLink = e.target.closest && e.target.closest('[data-filter-cat]');
      if (catLink && selCat) {
        e.preventDefault();
        var nextCat = catLink.dataset.filterCat;
        selCat.value = selCat.value === nextCat ? '' : nextCat;
        syncToUrl();
        apply();
        return;
      }

      var tagLink = e.target.closest && e.target.closest('[data-filter-tag]');
      if (tagLink && qInput) {
        e.preventDefault();
        var tagVal = '#' + tagLink.dataset.filterTag;
        bar.classList.add('is-searching');
        findBtn && findBtn.setAttribute('aria-expanded', 'true');
        qInput.value = qInput.value === tagVal ? '' : tagVal;
        syncToUrl();
        apply();
      }
    });

    syncFromUrl();
    apply();
  }
})();
