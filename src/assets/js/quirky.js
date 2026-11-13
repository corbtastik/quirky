/**
 * Site chrome and stream search.
 *
 * Three jobs, all optional - each one looks for its element and returns if the
 * page does not have it, so this single file can load everywhere:
 *
 *   1. the light/dark toggle (the palette picker is palette.js, in <head>)
 *   2. the date and time line at the top of the stream
 *   3. filtering the stream as you type
 *   4. the edit lock, which owns the state and nothing else
 *   5. dragging the nav and the controls to either side, stream only
 *
 * The light/dark attribute itself is set by theme.js in <head>, before the
 * first paint. All this does is swap the icon and flip the attribute on click,
 * then tell palette.js so it can repaint the chosen palette for the new mode.
 */
(function() {
    'use strict';

    // ------------------------------------------------------------------
    // Light / dark
    // ------------------------------------------------------------------
    function initThemeToggle() {
        var toggle = document.getElementById('theme-toggle');
        if (!toggle) return;

        function current() {
            return document.documentElement.getAttribute('dark') !== null ? 'dark' : 'light';
        }

        // The icon shows what clicking will do, not what is on.
        function paint() {
            toggle.textContent = current() === 'dark' ? 'light_mode' : 'dark_mode';
        }

        function flip() {
            var next = current() === 'dark' ? 'light' : 'dark';
            var root = document.documentElement;
            root.removeAttribute('light');
            root.removeAttribute('dark');
            root.setAttribute(next, '');
            try { localStorage.setItem('theme', next); } catch (e) {}
            paint();
            // palette.js listens for this and re-applies the chosen palette in
            // the new mode, so the two controls never fight.
            document.dispatchEvent(new CustomEvent('yolo:themechange', { detail: next }));
        }

        paint();
        toggle.addEventListener('click', flip);
        toggle.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); }
        });
    }

    // ------------------------------------------------------------------
    // The date and time line
    // ------------------------------------------------------------------
    function initNow() {
        var dateEl = document.getElementById('quirky-date');
        var timeEl = document.getElementById('quirky-time');
        if (!dateEl && !timeEl) return;

        function tick() {
            var now = new Date();
            if (dateEl) {
                dateEl.textContent = now.toLocaleDateString(undefined,
                    { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
            }
            if (timeEl) {
                timeEl.textContent = now.toLocaleTimeString(undefined,
                    { hour: 'numeric', minute: '2-digit' });
            }
        }

        tick();
        setInterval(tick, 30000);
    }

    // ------------------------------------------------------------------
    // Stream search
    //
    // The index is inlined into the stream page by index.njk, so there is
    // nothing to fetch. An empty query puts the full list back rather than
    // showing an empty result box.
    // ------------------------------------------------------------------
    function initSearch() {
        var input = document.getElementById('search-input');
        var results = document.getElementById('results-container');
        var stream = document.getElementById('stream');
        var indexEl = document.getElementById('quirky-search-index');
        if (!input || !results || !stream || !indexEl) return;

        var notes;
        try {
            notes = JSON.parse(indexEl.textContent);
        } catch (e) {
            YoloUtils.error('search index did not parse');
            return;
        }

        var base = (window.QuirkyConfig && window.QuirkyConfig.baseurl) || '';

        function href(note) {
            return note.external ? note.url : base + note.url;
        }

        function escape(text) {
            return String(text == null ? '' : text)
                .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;');
        }

        function row(note, query) {
            var attrs = note.external
                ? ' target="_blank" rel="noopener noreferrer" class="external-link"'
                : '';
            // highlightText inserts <mark>, so the title has to be escaped
            // before it is highlighted, not after.
            var title = YoloUtils.highlightText(escape(note.title), query);
            return '<li><a href="' + escape(href(note)) + '"' + attrs + '>' + title + '</a>' +
                   '<time datetime="' + escape(note.date) + '">' + escape(note.date) + '</time></li>';
        }

        function show(query) {
            if (!query.trim()) {
                results.innerHTML = '';
                results.classList.remove('visible');
                stream.hidden = false;
                return;
            }

            var matches = YoloUtils.filterByQuery(
                notes, query, ['title', 'description', 'tags']);

            stream.hidden = true;
            results.classList.add('visible');
            results.innerHTML = matches.length
                ? matches.map(function(note) { return row(note, query); }).join('')
                : '<li class="search-no-results">No notes match that.</li>';
        }

        // --------------------------------------------------------------
        // Arrow-key navigation
        //
        // Down and Up move real focus onto the results, rather than
        // highlighting a row while focus stays in the box. Focus is what
        // makes Enter open the note and a screen reader announce it, with no
        // aria-activedescendant bookkeeping to keep in step.
        //
        // The ends are deliberately not a loop back through the list: Up from
        // the first result and Down from the last both return to the input,
        // so the box is always one key away and you never have to arrow
        // through thirty notes to get back to what you typed.
        // --------------------------------------------------------------

        function links() {
            return Array.prototype.slice.call(results.querySelectorAll('a'));
        }

        /** Paint the row containing the focused link, so the whole row reads
            as selected rather than just the title. */
        function paint(current) {
            links().forEach(function(a) {
                var li = a.parentElement;
                if (li) li.classList.toggle('selected', a === current);
            });
        }

        function toInput() {
            paint(null);
            input.focus();
        }

        function focusAt(index) {
            var items = links();
            if (!items.length) return;
            if (index < 0 || index >= items.length) { toInput(); return; }
            paint(items[index]);
            items[index].focus();
            // `nearest` so a result already on screen does not jump the page.
            items[index].scrollIntoView({ block: 'nearest' });
        }

        input.addEventListener('input', YoloUtils.debounce(function() {
            show(input.value);
            paint(null);
        }, 120));

        input.addEventListener('keydown', function(e) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                focusAt(0);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                focusAt(links().length - 1);
            } else if (e.key === 'Escape') {
                input.value = '';
                show('');
                paint(null);
            }
        });

        // Delegated, because show() replaces every row on each keystroke and
        // listeners bound to the old rows would go with them.
        results.addEventListener('keydown', function(e) {
            var items = links();
            var at = items.indexOf(e.target);
            if (at === -1) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                focusAt(at + 1);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                focusAt(at - 1);
            } else if (e.key === 'Escape') {
                e.preventDefault();
                input.value = '';
                show('');
                toInput();
            }
        });

        // Clicking or tabbing to a result should look the same as arrowing to
        // it; without this the highlight is stuck on wherever the arrows last
        // left it.
        results.addEventListener('focusin', function(e) {
            if (e.target.tagName === 'A') paint(e.target);
        });
    }

    // ------------------------------------------------------------------
    // Back to top
    // ------------------------------------------------------------------
    // ------------------------------------------------------------------
    // Edit lock
    //
    // Locked on every load. Nothing is stored: an affordance that unlocks
    // itself because you left it open last time is the wrong default.
    //
    // All this owns is the state. It puts data-edit="unlocked" on <html> and
    // fires quirky:editlock, so whatever editing is eventually wired up can
    // listen or style against the attribute without touching this.
    // ------------------------------------------------------------------
    function initEditLock() {
        var button = document.getElementById('edit-lock');
        if (!button) return;

        var icon = button.querySelector('.material-icons');
        var root = document.documentElement;
        var unlocked = false;

        function paint() {
            // The icon is the state, not the action - see controls.njk.
            icon.textContent = unlocked ? 'lock_open' : 'lock';
            button.setAttribute('aria-pressed', unlocked ? 'false' : 'true');
            button.setAttribute('aria-label', unlocked ? 'Editing unlocked' : 'Editing locked');
            button.setAttribute('title', unlocked
                ? 'Editing unlocked - click to lock'
                : 'Editing locked - click to unlock');
        }

        function flip() {
            unlocked = !unlocked;
            if (unlocked) root.setAttribute('data-edit', 'unlocked');
            else root.removeAttribute('data-edit');
            paint();
            document.dispatchEvent(new CustomEvent('quirky:editlock', {
                detail: unlocked ? 'unlocked' : 'locked'
            }));
        }

        // The markup already says locked and carries no data-edit, so there
        // is nothing to reconcile here. An earlier version cleared the
        // attribute defensively, which meant any state set before this ran
        // was wiped on load.
        paint();
        button.addEventListener('click', flip);
    }

    // ------------------------------------------------------------------
    // Editable layout - the stream only
    //
    // While the lock is open, the nav column and the control stack can be
    // dragged to either side of the window. Each is one attribute on <body>;
    // the CSS in _controls.scss does the moving.
    //
    // The arrangement is remembered, the lock is not. Unlock, rearrange,
    // lock: the layout you chose survives the reload, and the page does not
    // come back in an editable state you forgot you left it in.
    // ------------------------------------------------------------------
    function initLayoutEdit() {
        var body = document.body;
        // Scoped to the stream by the class index.njk already sets. Other
        // pages get the lock but nothing to drag.
        if (!body.classList.contains('is-stream')) return;

        var nav = document.querySelector('main[role="main"] > header[role="banner"]');
        var controls = document.querySelector('.yolo-sticky-top-right');
        if (!nav || !controls) return;

        var KEY = 'quirky-layout';
        var layout = { nav: 'left', controls: 'right' };
        try {
            var saved = JSON.parse(localStorage.getItem(KEY) || 'null');
            if (saved && (saved.nav === 'left' || saved.nav === 'right') &&
                (saved.controls === 'left' || saved.controls === 'right')) {
                layout = saved;
            }
        } catch (e) {}

        function apply() {
            body.setAttribute('data-nav', layout.nav);
            body.setAttribute('data-controls', layout.controls);
            try { localStorage.setItem(KEY, JSON.stringify(layout)); } catch (e) {}
        }

        var hint = document.createElement('div');
        hint.className = 'quirky-drop-hint';
        hint.hidden = true;
        body.appendChild(hint);

        var dragging = null;

        function sideAt(x) {
            return x < window.innerWidth / 2 ? 'left' : 'right';
        }

        function unlocked() {
            return document.documentElement.getAttribute('data-edit') === 'unlocked';
        }

        [[nav, 'nav'], [controls, 'controls']].forEach(function (pair) {
            var el = pair[0], key = pair[1];
            el.classList.add('quirky-draggable');

            el.addEventListener('dragstart', function (e) {
                if (!unlocked()) { e.preventDefault(); return; }
                dragging = key;
                el.classList.add('is-dragging');
                e.dataTransfer.effectAllowed = 'move';
                // Firefox will not start a drag without data on the transfer.
                try { e.dataTransfer.setData('text/plain', key); } catch (ex) {}
            });

            el.addEventListener('dragend', function () {
                dragging = null;
                el.classList.remove('is-dragging');
                hint.hidden = true;
            });
        });

        document.addEventListener('dragover', function (e) {
            if (!dragging) return;
            // Without this the drop event never fires.
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            hint.hidden = false;
            hint.setAttribute('data-side', sideAt(e.clientX));
        });

        document.addEventListener('drop', function (e) {
            if (!dragging) return;
            e.preventDefault();
            layout[dragging] = sideAt(e.clientX);
            apply();
            hint.hidden = true;
        });

        // A link and an image are draggable to begin with, and dragging one
        // out of the nav would win over dragging the nav. Turn those off so
        // the column itself is what moves.
        function setDraggable(on) {
            nav.draggable = on;
            controls.draggable = on;
            Array.prototype.forEach.call(
                nav.querySelectorAll('a, img'),
                function (child) { child.draggable = false; });
        }

        setDraggable(unlocked());
        document.addEventListener('quirky:editlock', function (e) {
            setDraggable(e.detail === 'unlocked');
            if (e.detail === 'locked') hint.hidden = true;
        });

        apply();
    }

    function initToTop() {
        var link = document.querySelector('.yolo-to-top');
        if (!link) return;
        link.addEventListener('click', function(e) {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    YoloUtils.domReady(function() {
        initThemeToggle();
        initNow();
        initSearch();
        initEditLock();
        initLayoutEdit();
        initToTop();
    });
})();
