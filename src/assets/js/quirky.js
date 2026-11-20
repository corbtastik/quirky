/**
 * Site chrome and stream search.
 *
 * Eight jobs, all optional - each one looks for its element and returns if the
 * page does not have it, so this single file can load everywhere:
 *
 *   1. the light/dark toggle (the palette picker is palette.js, in <head>)
 *   2. the date and time line at the top of the stream
 *   3. filtering the stream as you type
 *   4. the page layout: which order the three columns sit in
 *   5. the page alignment: where that frame sits in the window
 *   6. focus mode, on f
 *   7. the control rail's roving tab stop
 *   8. back to top
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
            document.dispatchEvent(new CustomEvent('quirky:themechange', { detail: next }));
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
            QuirkyUtils.error('search index did not parse');
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
            var title = QuirkyUtils.highlightText(escape(note.title), query);
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

            var matches = QuirkyUtils.filterByQuery(
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

        input.addEventListener('input', QuirkyUtils.debounce(function() {
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

    /**
     * A group of radio buttons that write one attribute on <html>.
     *
     * The column order and the page alignment are the same control twice:
     * pick one of a fixed list, put it on the root element, remember it, and
     * keep the buttons showing which one is in force. The CSS keys off the
     * attribute, so nothing here positions anything.
     *
     * theme.js writes both attributes before the first paint, so init reads
     * the page rather than storage. The buttons then cannot disagree with
     * what is already on screen.
     *
     * The default is stored as nothing at all - a visitor who never touches
     * the control has no key, and setting it back to the default removes it
     * again.
     */
    function rootChoice(spec) {
        var html = document.documentElement;
        var sel = '[' + spec.choice + ']';

        function current() {
            var v = html.getAttribute(spec.attr);
            return spec.values.indexOf(v) >= 0 ? v : spec.fallback;
        }

        function sync() {
            var now = current();
            var radios = document.querySelectorAll(sel);
            Array.prototype.forEach.call(radios, function (b) {
                b.setAttribute('aria-checked',
                    b.getAttribute(spec.choice) === now ? 'true' : 'false');
            });
        }

        function set(value, remember) {
            if (spec.values.indexOf(value) < 0) value = spec.fallback;
            html.setAttribute(spec.attr, value);
            sync();
            if (!remember) return;
            try {
                if (value === spec.fallback) localStorage.removeItem(spec.key);
                else localStorage.setItem(spec.key, value);
            } catch (e) { /* private window */ }
        }

        // What the reader last chose, as opposed to what is on screen now.
        // Focus mode overrides the attribute without touching storage, so
        // these two can differ while it is on.
        function preference() {
            var v = null;
            try { v = localStorage.getItem(spec.key); } catch (e) { /* private window */ }
            return spec.values.indexOf(v) >= 0 ? v : spec.fallback;
        }

        function init() {
            var group = document.querySelector(spec.group);
            if (!group) return;
            Array.prototype.forEach.call(group.querySelectorAll(sel), function (b) {
                b.addEventListener('click', function () {
                    set(b.getAttribute(spec.choice), true);
                });
            });
            sync();
        }

        return { init: init, set: set, current: current, preference: preference };
    }

    // The six orders of the three columns.
    //
    //   [rail][nav][content]   [nav][rail][content]   [content][rail][nav]
    //   [rail][content][nav]   [nav][content][rail]   [content][nav][rail]
    var layoutChoice = rootChoice({
        attr: 'data-layout',
        key: 'quirky-layout',
        group: '.quirky-layout',
        choice: 'data-layout-choice',
        fallback: 'nav-content-rail',
        values: ['rail-nav-content', 'rail-content-nav',
                 'nav-rail-content', 'nav-content-rail',
                 'content-rail-nav', 'content-nav-rail']
    });

    // Where the whole frame sits in the window. Independent of the order
    // above: this moves the container, the layout arranges its contents.
    var alignChoice = rootChoice({
        attr: 'data-align',
        key: 'quirky-align',
        group: '.quirky-align',
        choice: 'data-align-choice',
        fallback: 'center',
        values: ['left', 'center', 'right']
    });

    var initLayout = layoutChoice.init;
    var initAlign = alignChoice.init;

    function initToolbar() {
        var bar = document.querySelector('.quirky-sticky-top-right');
        if (!bar) return;

        /** The controls, in document order, skipping the ones not on show.
            The palette menu's 75 options live inside this element too; they
            belong to the open menu, not to the toolbar. */
        function items() {
            return Array.prototype.filter.call(
                bar.querySelectorAll('button, a[href], [role="button"]'),
                function(el) {
                    return !el.closest('.quirky-themes-menu') &&
                           el.getClientRects().length > 0;
                });
        }

        function setStop(el) {
            items().forEach(function(i) { i.tabIndex = (i === el) ? 0 : -1; });
        }

        bar.addEventListener('keydown', function(e) {
            // An open palette menu owns its own keys.
            if (e.target.closest('.quirky-themes-menu')) return;

            var list = items();
            var at = list.indexOf(document.activeElement);
            if (at < 0) return;

            var to = null;
            if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
                to = list[(at + 1) % list.length];
            } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
                to = list[(at - 1 + list.length) % list.length];
            } else if (e.key === 'Home') {
                to = list[0];
            } else if (e.key === 'End') {
                to = list[list.length - 1];
            }
            if (!to) return;

            e.preventDefault();
            setStop(to);
            to.focus();
        });

        // Whatever you used last stays the way back in.
        bar.addEventListener('focusin', function(e) {
            if (e.target.closest('.quirky-themes-menu')) return;
            var list = items();
            if (list.indexOf(e.target) >= 0) setStop(e.target);
        });

        var first = items()[0];
        if (first) setStop(first);
    }

    /**
     * Focus mode: `f` strips the page to what you came to read.
     *
     * A bare letter rather than a chord. Unmodified letters are not browser
     * shortcuts at all, so there is nothing to collide with and nothing to
     * cancel - Ctrl+O, which this replaces, is the browser's Open File and
     * only worked because the event was cancelled.
     *
     * The cost of a bare letter is that it has to stand aside wherever a
     * keystroke already means something: a text field, an open lightbox, or
     * an IME mid-composition. Those are the guards below.
     *
     * A flag rather than one of a list, so the attribute is absent when off
     * and the stylesheet only looks for the "on" case. theme.js puts it back
     * before the first paint, so a reader who left it on never sees the
     * sidebar drawn and then removed.
     */
    function initFocus() {
        var html = document.documentElement;

        function typing(el) {
            if (!el) return false;
            if (el.isContentEditable) return true;
            var tag = el.tagName;
            return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
        }

        // Both galleries open by setting display on their container, so the
        // DOM is the only state this needs to read.
        function lightboxOpen() {
            var boxes = document.querySelectorAll('.lb-modal, [id^="ig-target-"]');
            for (var i = 0; i < boxes.length; i++) {
                if (getComputedStyle(boxes[i]).display !== 'none') return true;
            }
            return false;
        }

        function set(on) {
            if (on) html.setAttribute('data-focus', 'on');
            else html.removeAttribute('data-focus');

            // Centred while focused: with the nav and the rail gone there is
            // nothing for an edge to align against, and a column pinned left
            // on a wide screen is the opposite of what focus mode is for.
            //
            // `false` so storage is not touched. The reader's alignment is
            // still their alignment; focus mode only overrides what is drawn,
            // which is what lets it be handed straight back here.
            alignChoice.set(on ? 'center' : alignChoice.preference(), false);

            try {
                if (on) localStorage.setItem('quirky-focus', 'on');
                else localStorage.removeItem('quirky-focus');
            } catch (e) { /* private window */ }
        }

        document.addEventListener('keydown', function (e) {
            if (e.ctrlKey || e.metaKey || e.altKey) return;
            if (e.isComposing || e.keyCode === 229) return;
            if ((e.key || '').toLowerCase() !== 'f') return;
            if (typing(e.target) || lightboxOpen()) return;
            e.preventDefault();
            set(!html.hasAttribute('data-focus'));
        });
    }

    // ------------------------------------------------------------------
    // Back to top
    // ------------------------------------------------------------------
    function initToTop() {
        var link = document.querySelector('.quirky-to-top');
        if (!link) return;
        link.addEventListener('click', function(e) {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    QuirkyUtils.domReady(function() {
        initThemeToggle();
        initNow();
        initSearch();
        initLayout();
        initAlign();
        initFocus();
        initToolbar();
        initToTop();
    });
})();
