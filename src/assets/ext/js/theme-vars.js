/**
 * Quirky theme variables.
 *
 * The single mapping from a theme's twelve source colors - as stored per theme
 * in _data/themes.json - to the full set of CSS custom properties the
 * stylesheets consume.
 *
 * Two consumers share this file:
 *   - the build, via .eleventy.js, which bakes the selected theme into
 *     brand.css
 *   - the browser, via assets/ext/js/theme-sampler.js, which previews any
 *     theme live. Both are listed in the ext_js front matter of the demo
 *     posts, this file first, so only those pages pay for it.
 *
 * They are deliberately not allowed to drift. Each used to carry its own copy
 * of this mapping: the build's was complete, the sampler's covered only 34 of
 * the 90 variables, so switching themes in the demo left most syntax
 * colors showing whichever theme had been compiled in.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();          // .eleventy.js
  } else {
    root.QuirkyThemeVars = factory();      // browser
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Identical for every theme, so not part of the per-theme color data.
  var FONT_FAMILIES = [
    ["font-family-primary", "Space Mono, Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, monospace"],
    ["font-family-secondary", "Montserrat, Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif"],
    ["font-family-monospace", "Source Code Pro, Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, monospace"]
  ];

  // [cssVariableName, sourceColorKey] in emission order. A {light,dark} object
  // instead of a key means a fixed color that differs only by mode.
  var THEME_VARS = [
    ["primary-color", "bg"],
    ["on-primary-color", "text"],
    ["primary-container-color", "surface"],
    ["on-primary-container-color", "heading"],
    ["secondary-color", "heading"],
    ["on-secondary-color", "bg"],
    ["secondary-container-color", "border"],
    ["on-secondary-container-color", "text"],
    ["tertiary-color", "primary"],
    ["on-tertiary-color", "bg"],
    ["link-color", "link"]
  ];

  var SYNTAX_VARS = [
    ["syntax-text", "text"],
    ["syntax-container-color", "surface"],
    ["syntax-highlight-line", "primary"],
    ["syntax-error", {"light":"#b71c1c","dark":"#ff5252"}],
    ["syntax-punctuation", "text"],
    ["syntax-text-whitespace", "text"],
    ["syntax-comment-hashbang", "shComment"],
    ["syntax-comment-multiline", "shComment"],
    ["syntax-comment-preproc", "shComment"],
    ["syntax-comment-preprocfile", "shComment"],
    ["syntax-comment-single", "shComment"],
    ["syntax-comment-special", "shComment"],
    ["syntax-comment", "shComment"],
    ["syntax-generic-deleted", {"light":"#b71c1c","dark":"#ff5252"}],
    ["syntax-generic-emph", "text"],
    ["syntax-generic-error", "text"],
    ["syntax-generic-heading", "text"],
    ["syntax-generic-inserted", "text"],
    ["syntax-generic-output", "text"],
    ["syntax-generic-prompt", "shKeyword"],
    ["syntax-generic-strong", "shKeyword"],
    ["syntax-generic-subheading", "text"],
    ["syntax-generic-traceback", "text"],
    ["syntax-keyword-constant", "shKeyword"],
    ["syntax-keyword-declaration", "shKeyword"],
    ["syntax-keyword-namespace", "shKeyword"],
    ["syntax-keyword-pseudo", "shKeyword"],
    ["syntax-keyword-reserved", "shKeyword"],
    ["syntax-keyword-type", "shKeyword"],
    ["syntax-keyword", "shKeyword"],
    ["syntax-literal-date", "text"],
    ["syntax-literal", "text"],
    ["syntax-name-attribute", "shFunction"],
    ["syntax-name-builtin-pseudo", "text"],
    ["syntax-name-builtin", "shVariable"],
    ["syntax-name-class", "shFunction"],
    ["syntax-name-constant", "text"],
    ["syntax-name-decorator", "text"],
    ["syntax-name-entity", "text"],
    ["syntax-name-exception", "text"],
    ["syntax-name-function-magic", "shFunction"],
    ["syntax-name-function", "shFunction"],
    ["syntax-name-label", "shFunction"],
    ["syntax-name-namespace", "text"],
    ["syntax-name-other", "text"],
    ["syntax-name-property", "shFunction"],
    ["syntax-name-tag", "shKeyword"],
    ["syntax-name-variable-class", "shVariable"],
    ["syntax-name-variable-global", "shVariable"],
    ["syntax-name-variable-instance", "shVariable"],
    ["syntax-name-variable-magic", "shVariable"],
    ["syntax-name-variable", "shVariable"],
    ["syntax-name", "text"],
    ["syntax-number-bin", "shString"],
    ["syntax-number-float", "shString"],
    ["syntax-number-hex", "shString"],
    ["syntax-number-integer-long", "shString"],
    ["syntax-number-integer", "shString"],
    ["syntax-number-oct", "shString"],
    ["syntax-number", "shString"],
    ["syntax-operator-word", "shFunction"],
    ["syntax-operator", "shFunction"],
    ["syntax-string-affix", "shString"],
    ["syntax-string-backtick", "shString"],
    ["syntax-string-char", "shString"],
    ["syntax-string-delimiter", "shString"],
    ["syntax-string-doc", "shString"],
    ["syntax-string-double", "shString"],
    ["syntax-string-escape", "shString"],
    ["syntax-string-heredoc", "shString"],
    ["syntax-string-interpol", "shString"],
    ["syntax-string-other", "shString"],
    ["syntax-string-regex", "shString"],
    ["syntax-string-single", "shString"],
    ["syntax-string-symbol", "shString"],
    ["syntax-string", "shString"]
  ];

  /**
   * Contrasting ink for a swatch background, matching the Sass original:
   * lightness > 50% takes black, anything darker takes white.
   * HSL lightness is (max + min) / 2, so comparing the 0-255 sum against 255
   * is the same test without floating point.
   */
  function onColor(hex) {
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    return (max + min) > 255 ? '#000' : '#fff';
  }

  function resolve(source, colors, mode) {
    return typeof source === 'string' ? colors[source] : source[mode];
  }

  /**
   * Build the ordered [name, value] pairs for one light/dark mode.
   *
   * themeColors and syntaxColors are the twelve-key objects for that mode.
   * They are separate arguments because settings.brand.theme and
   * settings.brand.syntax may name different themes.
   *
   * Every syntax variable is followed by its -on-color companion, which the
   * demo swatches use for legible labels.
   */
  // --------------------------------------------------------------------
  // Page title colours  (an addition in quirky-11ty, not in upstream Quirky)
  //
  // Titles used to take "heading", and in 20 of the 136 theme/mode pairs a
  // theme sets heading to the same colour as its body text - every Matrix
  // theme in dark mode, among others - so the title vanished into the prose.
  //
  // No amount of color-mix() in the stylesheet fixes that: where heading,
  // accent and text are all one colour, mixing them stays that colour. The
  // choice has to be conditional, which CSS cannot express - so it is made
  // here, in the one function both the build and the palette picker call, and
  // the answer comes out the same whether a theme is compiled in or switched
  // to at runtime.
  // --------------------------------------------------------------------

  function rgb(hex) {
    hex = String(hex).replace('#', '');
    return [0, 2, 4].map(function (i) { return parseInt(hex.substr(i, 2), 16) / 255; });
  }

  function relLuminance(hex) {
    var c = rgb(hex).map(function (v) {
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }

  /** WCAG contrast - how readable one colour is on another. */
  function contrast(a, b) {
    var la = relLuminance(a), lb = relLuminance(b);
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
  }

  /**
   * Perceptual distance in OKLab - "do these read as different colours".
   *
   * Contrast is the wrong test for that: a crimson and a navy of the same
   * lightness score about 1:1 and are obviously different. Distinctness and
   * readability are two separate questions, so they get two measures.
   */
  function oklab(hex) {
    var c = rgb(hex).map(function (v) {
      return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    var l = Math.cbrt(0.4122214708 * c[0] + 0.5363325363 * c[1] + 0.0514459929 * c[2]);
    var m = Math.cbrt(0.2119034982 * c[0] + 0.6806995451 * c[1] + 0.1073969566 * c[2]);
    var s = Math.cbrt(0.0883024619 * c[0] + 0.2817188376 * c[1] + 0.6299787005 * c[2]);
    return [0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
            1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
            0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s];
  }

  function distance(a, b) {
    var A = oklab(a), B = oklab(b);
    return Math.sqrt(Math.pow(A[0] - B[0], 2) + Math.pow(A[1] - B[1], 2) + Math.pow(A[2] - B[2], 2));
  }

  function blend(a, b, amount) {
    var A = rgb(a), B = rgb(b);
    return '#' + [0, 1, 2].map(function (i) {
      var v = Math.round((A[i] * amount + B[i] * (1 - amount)) * 255);
      return (v < 16 ? '0' : '') + v.toString(16);
    }).join('');
  }

  // Large text, so 3:1 is the readability floor; 0.05 in OKLab is about the
  // point two colours stop reading as the same one.
  var READABLE = 3.0;
  var DISTINCT = 0.05;

  /**
   * The colour a page title and its subtitle take.
   *
   * Prefers the theme's own heading colour, and only moves off it when that
   * colour is too close to the body text to tell apart. The subtitle takes
   * the next distinct candidate, or a softened title where there is none, so
   * the two never collapse into each other.
   */
  function titleColors(c) {
    var candidates = [c.heading, c.link, c.primary];

    var usable = candidates.filter(function (hex) {
      return contrast(hex, c.bg) >= READABLE && distance(hex, c.text) >= DISTINCT;
    });

    // Nothing qualifies in a theme that is one colour by design (Monochrome,
    // Term, Matrix in dark). Keep heading rather than invent a hue the theme
    // deliberately does without.
    var title = usable.length ? usable[0] : c.heading;

    var subtitle = usable.filter(function (hex) {
      return distance(hex, title) >= DISTINCT;
    })[0];

    if (!subtitle) {
      // No second candidate, so soften the title toward the page instead:
      // clearly the same colour, visibly quieter. One fixed blend does not
      // work across 69 palettes - too gentle and it is still the title, too
      // strong and it stops being readable - so walk from subtle to strong
      // and take the first that is far enough from the title, far enough
      // from the body text, and still readable.
      var steps = [0.72, 0.64, 0.56, 0.48, 0.40];
      for (var i = 0; i < steps.length; i++) {
        var soft = blend(title, c.bg, steps[i]);
        if (distance(soft, title) >= DISTINCT &&
            distance(soft, c.text) >= DISTINCT &&
            contrast(soft, c.bg) >= READABLE) {
          subtitle = soft;
          break;
        }
      }
      // A theme with one colour has nowhere left to go.
      if (!subtitle) subtitle = title;
    }

    return { title: title, subtitle: subtitle };
  }

  function cssVars(themeColors, syntaxColors, mode) {
    var out = FONT_FAMILIES.slice();

    THEME_VARS.forEach(function (entry) {
      out.push([entry[0], resolve(entry[1], themeColors, mode)]);
    });

    var titles = titleColors(themeColors);
    out.push(["title-color", titles.title]);
    out.push(["subtitle-color", titles.subtitle]);

    SYNTAX_VARS.forEach(function (entry) {
      var value = resolve(entry[1], syntaxColors, mode);
      out.push([entry[0], value]);
      out.push([entry[0] + '-on-color', onColor(value)]);
    });

    return out;
  }

  /** Flatten themes.json's groups into { id: theme } for direct lookup. */
  function byId(themesJson) {
    var map = {};
    themesJson.groups.forEach(function (group) {
      group.themes.forEach(function (theme) { map[theme.id] = theme; });
    });
    return map;
  }

  return {
    cssVars: cssVars,
    onColor: onColor,
    byId: byId,
    FONT_FAMILIES: FONT_FAMILIES,
    THEME_VARS: THEME_VARS,
    SYNTAX_VARS: SYNTAX_VARS
  };
}));
