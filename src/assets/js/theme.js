/**
 * Pre-paint state - runs early (in <head>) so the page is never drawn one way
 * and then corrected. Two things are restored here:
 *
 *   - the light/dark attribute on <html>
 *   - the column order, also on <html>
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

    // One of the six column orders. The default carries its attribute too,
    // so the rules and the radio never have to treat an absent value as a
    // special case.
    var LAYOUTS = ['rail-nav-content', 'rail-content-nav',
                   'nav-rail-content', 'nav-content-rail',
                   'content-rail-nav', 'content-nav-rail'];
    var layout = stored('quirky-layout');
    root.setAttribute('data-layout',
        LAYOUTS.indexOf(layout) >= 0 ? layout : 'nav-content-rail');
})();
