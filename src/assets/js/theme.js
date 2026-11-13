/**
 * Pre-paint state - runs early (in <head>) so the page is never drawn one way
 * and then corrected. Two things are restored here:
 *
 *   - the light/dark attribute on <html>
 *   - the side-swap layout, also on <html>
 *   - which edge the site is aligned to, if any
 *
 * Both are attributes rather than classes because they are read by CSS alone.
 * The toggles that set them live in assets/js/quirky.js, which runs after the
 * DOM is ready; this only puts back what was chosen last time.
 *
 * localStorage throws in a private window rather than returning null, and a
 * page that dies in <head> loses its stylesheet handling along with its
 * memory. Reading is wrapped for that reason - the same care palette.js takes.
 */
(function() {
    'use strict';

    var root = document.documentElement;

    function stored(key) {
        try { return localStorage.getItem(key); } catch (e) { return null; }
    }

    root.setAttribute(stored('theme') || 'light', '');

    if (stored('quirky-layout') === 'mirrored') {
        root.setAttribute('data-layout', 'mirrored');
    }

    // center is the default and needs no CSS of its own, but the attribute
    // is set either way so the matching control can show as active.
    var pull = stored('quirky-pull');
    root.setAttribute('data-pull',
        (pull === 'left' || pull === 'right') ? pull : 'center');
})();
