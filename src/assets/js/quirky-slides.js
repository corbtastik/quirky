/**
 * The slide viewer.
 *
 * Every slide is already in the markup - the shortcode emits one <img> per
 * slide - so this only moves which one is visible. With JS off the first
 * slide still shows, which is the one worth seeing.
 *
 * Keyboard works when the viewer has focus rather than globally: a page can
 * carry several decks, and arrow keys that hijack the whole document would
 * fight with scrolling.
 */
(function () {
    'use strict';

    function init(wrapper) {
        var imgs = Array.prototype.slice.call(wrapper.querySelectorAll('.slides-img'));
        if (imgs.length < 1) return;

        var count = imgs.length;
        var label = wrapper.querySelector('.slides-count');
        var prev = wrapper.querySelector('[data-action="prev"]');
        var next = wrapper.querySelector('[data-action="next"]');
        var at = 0;

        // Fetch a slide's image the first time it is needed. Neighbours are
        // hydrated too, so stepping through never waits on a download.
        function hydrate(n) {
            var img = imgs[n];
            if (!img || img.getAttribute('src')) return;
            var src = img.getAttribute('data-src');
            if (src) img.setAttribute('src', src);
        }

        function show(i) {
            at = Math.max(0, Math.min(count - 1, i));
            hydrate(at);
            hydrate(at - 1);
            hydrate(at + 1);
            imgs.forEach(function (img, n) {
                img.classList.toggle('is-current', n === at);
            });
            if (label) label.textContent = (at + 1) + ' / ' + count;
            // Stopping at the ends rather than wrapping: on a short deck a
            // wrap reads as a glitch, because the jump looks identical to a
            // mis-click.
            if (prev) prev.disabled = at === 0;
            if (next) next.disabled = at === count - 1;
        }

        if (prev) prev.addEventListener('click', function () { show(at - 1); });
        if (next) next.addEventListener('click', function () { show(at + 1); });

        // The stage is focusable so the arrow keys have somewhere to land.
        var stage = wrapper.querySelector('.slides-stage');
        if (stage) {
            stage.tabIndex = 0;
            stage.setAttribute('role', 'group');
            stage.setAttribute('aria-roledescription', 'carousel');
            stage.addEventListener('keydown', function (e) {
                if (e.key === 'ArrowLeft') { show(at - 1); e.preventDefault(); }
                else if (e.key === 'ArrowRight') { show(at + 1); e.preventDefault(); }
                else if (e.key === 'Home') { show(0); e.preventDefault(); }
                else if (e.key === 'End') { show(count - 1); e.preventDefault(); }
            });
            // A click on the slide advances, the way a deck does in person.
            stage.addEventListener('click', function () {
                show(at === count - 1 ? at : at + 1);
            });
            stage.style.cursor = 'pointer';
        }

        show(0);
    }

    function boot() {
        var decks = document.querySelectorAll('.slides-wrapper');
        Array.prototype.forEach.call(decks, init);
    }

    if (window.QuirkyUtils && window.QuirkyUtils.domReady) {
        window.QuirkyUtils.domReady(boot);
    } else if (document.readyState !== 'loading') {
        boot();
    } else {
        document.addEventListener('DOMContentLoaded', boot);
    }
})();
