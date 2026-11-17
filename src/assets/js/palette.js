/**
 * Theme palette picker.
 *
 * The palette icon under the light/dark toggle opens a list of every theme in
 * themes.json. Picking one sets CSS custom properties on <html>, which
 * override the theme compiled into brand.css.
 *
 * Mode and palette are two axes. The mode toggle owns light/dark; this owns
 * which of the 67 themes paints the page. Changing mode re-applies the chosen
 * palette in the new mode, so the two never fight.
 *
 * The variable set comes from QuirkyThemeVars - the same mapping the build uses
 * - so a pick is a complete swap, not an approximation.
 *
 * Boot runs at once, in <head>, to apply the stored palette before first
 * paint. The menu is built on domReady, from the same data, so no template
 * has to know the theme list.
 */
(function() {
    'use strict';

    // Shared with assets/ext/js/theme-sampler.js on purpose. The demo's pills
    // and this menu are two faces of one choice; one key keeps them agreeing
    // instead of each remembering a different theme.
    var STORAGE_KEY = 'quirky-theme';

    var themesById = window.QuirkyThemeVars && window.QuirkyPalettes
        ? window.QuirkyThemeVars.byId(window.QuirkyPalettes)
        : {};

    var applied = [];   // variables we have set, so they can be cleared

    // Private-mode browsers throw on localStorage. A picker that forgets is
    // better than a page that dies in <head>.
    function read() {
        try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
    }
    function store(id) {
        try {
            if (id) localStorage.setItem(STORAGE_KEY, id);
            else localStorage.removeItem(STORAGE_KEY);
        } catch (e) {}
    }

    /** The mode currently rendered, per the attribute theme.js sets in <head>. */
    function currentMode() {
        return document.documentElement.getAttribute('dark') !== null ? 'dark' : 'light';
    }

    function applyTheme(id) {
        var theme = themesById[id];
        if (!theme) return false;

        var mode = currentMode();
        var root = document.documentElement;

        // One theme supplies both the site colors and the syntax colors here.
        // The build keeps them separate so a site can mix two themes.
        var vars = window.QuirkyThemeVars.cssVars(theme[mode], theme[mode], mode);

        applied = vars.map(function(pair) {
            root.style.setProperty('--' + pair[0], pair[1]);
            return pair[0];
        });

        store(id);
        return true;
    }

    /** Drop the overrides, revealing the theme compiled into brand.css. */
    function clearTheme() {
        var root = document.documentElement;
        applied.forEach(function(name) { root.style.removeProperty('--' + name); });
        applied = [];
        store(null);
    }

    // ------------------------------------------------------------------
    // Boot - before first paint, so there is no flash of the site theme
    // ------------------------------------------------------------------
    var saved = read();
    if (saved) applyTheme(saved);

    // ------------------------------------------------------------------
    // Menu
    // ------------------------------------------------------------------

    /** Two-tone dot: page background outside, link color inside. */
    function swatch(colors) {
        return '<span class="quirky-themes-swatch" style="--sw-bg: ' + colors.bg +
               '; --sw-link: ' + colors.link + '"></span>';
    }

    function optionHtml(theme, mode) {
        return '<li><button type="button" class="quirky-themes-option" data-palette="' +
            theme.id + '" aria-pressed="false">' + swatch(theme[mode]) + theme.name +
            '</button></li>';
    }

    function renderMenu(menu) {
        var mode = currentMode();
        var groups = (window.QuirkyPalettes && window.QuirkyPalettes.groups) || [];
        var html = '';

        groups.forEach(function(group) {
            html += '<li class="quirky-themes-group">' + group.label + '</li>';
            group.themes.forEach(function(theme) {
                html += optionHtml(theme, mode);
            });
        });

        menu.innerHTML = html;
        markActive(menu);
    }

    function markActive(menu) {
        var active = read() || '';
        menu.querySelectorAll('[data-palette]').forEach(function(option) {
            option.setAttribute('aria-pressed',
                option.dataset.palette === active ? 'true' : 'false');
        });
    }

    // How close the menu may come to the window edge.
    var EDGE_PAD = 8;

    function init() {
        var toggle = document.getElementById('palette-toggle');
        var menu = document.getElementById('palette-menu');
        var picker = document.getElementById('theme-picker');
        if (!toggle || !menu) return;

        // No theme data means no menu. Better an absent icon than one that
        // opens an empty list.
        if (!Object.keys(themesById).length) {
            if (picker) picker.hidden = true;
            return;
        }

        var built = false;

        /**
         * Keep the open menu inside the window.
         *
         * The stylesheet hangs it off the picker's right edge, which was
         * right when the picker was fixed chrome in the top-right corner.
         * The rail is a column in the page now and can be the leftmost one,
         * so opening leftward put the menu 150px off the left of the screen
         * with only its last 60px showing.
         *
         * Preference is unchanged - right edges flush - and it only slides
         * when that would leave the window. The right edge is pulled in
         * first and the left edge checked second, so a menu too wide for the
         * window overflows the side you are not reading from.
         */
        function placeMenu() {
            if (!picker) return;
            menu.style.right = 'auto';
            menu.style.left = '0px';

            var box = picker.getBoundingClientRect();
            var vw = document.documentElement.clientWidth;
            var w = menu.offsetWidth;

            var left = box.width - w;
            if (box.left + left + w > vw - EDGE_PAD) left = vw - EDGE_PAD - w - box.left;
            if (box.left + left < EDGE_PAD) left = EDGE_PAD - box.left;
            menu.style.left = Math.round(left) + 'px';
        }

        function setOpen(open) {
            if (open && !built) { renderMenu(menu); built = true; }
            menu.hidden = !open;
            toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
            if (open) {
                // After unhiding - a hidden element has no width to measure.
                placeMenu();
                var current = menu.querySelector('[aria-pressed="true"]');
                if (current) current.scrollIntoView({ block: 'nearest' });
            } else {
                // Hand the position back to the stylesheet.
                menu.style.left = '';
                menu.style.right = '';
            }
        }

        // The window can change shape under an open menu.
        window.addEventListener('resize', function() {
            if (!menu.hidden) placeMenu();
        });

        toggle.addEventListener('click', function(e) {
            e.stopPropagation();
            setOpen(menu.hidden);
        });

        menu.addEventListener('click', function(e) {
            var option = e.target.closest('[data-palette]');
            if (!option) return;
            applyTheme(option.dataset.palette);
            markActive(menu);
            setOpen(false);
            toggle.focus();
        });

        // Light/dark is the other axis - repaint the chosen palette for the
        // new mode, and restyle the swatches to preview it there too.
        document.addEventListener('quirky:themechange', function() {
            var id = read();
            if (id) applyTheme(id);
            if (built) renderMenu(menu);
        });

        document.addEventListener('click', function(e) {
            if (!menu.hidden && !menu.contains(e.target) && e.target !== toggle) setOpen(false);
        });

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && !menu.hidden) {
                setOpen(false);
                toggle.focus();
            }
        });
    }

    QuirkyUtils.domReady(init);

    window.QuirkyPalette = { apply: applyTheme, clear: clearTheme, current: read };
})();
