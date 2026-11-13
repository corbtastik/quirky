/**
 * Site chrome and stream search.
 *
 * Three jobs, all optional - each one looks for its element and returns if the
 * page does not have it, so this single file can load everywhere:
 *
 *   1. the light/dark toggle (the palette picker is palette.js, in <head>)
 *   2. the date and time line at the top of the stream
 *   3. filtering the stream as you type
 *   4. the side swap, which mirrors the page layout
 *   5. pull left, which pins the page to the left edge
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
    // Side swap - the stream only
    //
    // Mirrors the page: the nav column to the right of the flex row, the
    // fixed chrome to the opposite corners. One attribute on <body> and the
    // CSS in _controls.scss does the moving.
    //
    // The choice is remembered, so a page you mirrored comes back mirrored.
    // ------------------------------------------------------------------
    function initSideSwap() {
        var root = document.documentElement;
        var button = document.getElementById('side-swap');
        if (!button) return;
        var icon = button.querySelector('.material-icons');

        // Everything that ends up somewhere else when the page mirrors.
        // The wide layout (life in weeks) has no nav column and no section,
        // so those come back null there and only the chrome moves.
        var movers = [
            document.querySelector('main[role="main"] > header[role="banner"]'),
            document.querySelector('main[role="main"] > section'),
            document.querySelector('.yolo-sticky-top-right'),
            document.querySelector('.yolo-sticky-bottom-right')
        ].filter(Boolean);

        // theme.js already restored the stored choice in <head>, so the
        // attribute on <html> is the state - reading it back beats reading
        // storage twice and risking the two disagreeing.
        var KEY = 'quirky-layout';
        var mirrored = root.getAttribute('data-layout') === 'mirrored';

        function reduceMotion() {
            return window.matchMedia &&
                   window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        }

        /**
         * Animate a layout change that is not animatable.
         *
         * Neither flex-direction nor swapping left for right can be
         * transitioned, so the elements are moved first and then put back
         * visually: measure, mutate, measure again, translate each one by
         * the difference, and release. The browser interpolates from the
         * old position to the new one while the layout has already changed.
         *
         * Transforms are cleared at the end. Leaving one on the nav would
         * matter - it is position: sticky, and a stray transform is the kind
         * of thing that quietly changes how that resolves.
         */
        function glide(mutate) {
            if (reduceMotion()) { mutate(); return; }

            var first = movers.map(function (el) { return el.getBoundingClientRect(); });
            mutate();
            var last = movers.map(function (el) { return el.getBoundingClientRect(); });

            var moved = [];
            movers.forEach(function (el, i) {
                var dx = first[i].left - last[i].left;
                var dy = first[i].top - last[i].top;
                if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return;
                el.classList.add('is-gliding');
                // Inline `none` so applying the offset is not itself animated.
                el.style.transition = 'none';
                el.style.transform = 'translate3d(' + dx + 'px, ' + dy + 'px, 0)';
                moved.push(el);
            });
            if (!moved.length) return;

            // One forced reflow for the whole set, so every element starts
            // from its offset in the same frame.
            void document.body.offsetWidth;

            moved.forEach(function (el) {
                el.addEventListener('transitionend', function done(e) {
                    if (e.propertyName !== 'transform') return;
                    el.removeEventListener('transitionend', done);
                    el.classList.remove('is-gliding');
                    el.style.transform = '';
                });
                // Hand the duration back to the stylesheet and go.
                el.style.transition = '';
                el.style.transform = '';
            });
        }

        function paint() {
            // The arrow points the way the chrome will move, so it flips to
            // the one that undoes what you are looking at.
            icon.textContent = mirrored ? 'chevron_right' : 'chevron_left';
            button.setAttribute('aria-pressed', mirrored ? 'true' : 'false');
            button.setAttribute('aria-label',
                mirrored ? 'Restore the default sides' : 'Swap the sides');
            button.setAttribute('title',
                mirrored ? 'Back to the default sides' : 'Swap the sides');
        }

        function setLayout() {
            if (mirrored) root.setAttribute('data-layout', 'mirrored');
            else root.removeAttribute('data-layout');
        }

        button.addEventListener('click', function () {
            mirrored = !mirrored;
            glide(setLayout);
            paint();
            try { localStorage.setItem(KEY, mirrored ? 'mirrored' : 'default'); } catch (e) {}
        });

        // The layout is already correct - theme.js set it before the first
        // paint. Only the button needs bringing into line with it.
        paint();
    }

    // ------------------------------------------------------------------
    // Pull left
    //
    // Drops the auto side margins that centre the page. One attribute on
    // <html>; _controls.scss does the moving. theme.js puts it back before
    // the first paint, so a pinned page does not start centred and jump.
    // ------------------------------------------------------------------
    function initPullLeft() {
        var root = document.documentElement;
        var button = document.getElementById('pull-left');
        if (!button) return;

        var KEY = 'quirky-pull';
        var pulled = root.getAttribute('data-pull') === 'left';

        function paint() {
            button.setAttribute('aria-pressed', pulled ? 'true' : 'false');
            button.setAttribute('title', pulled ? 'Centre the site' : 'Pin the site to the left');
            button.setAttribute('aria-label', button.getAttribute('title'));
        }

        button.addEventListener('click', function() {
            pulled = !pulled;
            if (pulled) root.setAttribute('data-pull', 'left');
            else root.removeAttribute('data-pull');
            try { localStorage.setItem(KEY, pulled ? 'left' : 'centre'); } catch (e) {}
            paint();
        });

        paint();
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
        initSideSwap();
        initPullLeft();
        initToTop();
    });
})();
