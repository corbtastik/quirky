const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");
const sass = require("sass");
const nunjucks = require("nunjucks");
const markdownIt = require("markdown-it");
const markdownItAttrs = require("markdown-it-attrs");
const { execSync } = require("child_process");

// Shared with the browser - see the header of src/assets/ext/js/theme-vars.js.
const themeVars = require("./src/assets/ext/js/theme-vars.js");
const themesById = themeVars.byId(require("./src/_data/themes.json"));

const SASS_INCLUDES = path.join(__dirname, "src", "_sass");
const DEFAULT_THEME = "yolo";

module.exports = function(eleventyConfig) {
  // -------------------------------------------------------------------------
  // Global Data - Build Info
  // -------------------------------------------------------------------------
  let gitTag = "dev";
  try {
    gitTag = execSync("git describe --tags --abbrev=0 --match 'v[0-9]*'",
      { encoding: "utf8", stdio: ["pipe", "pipe", "ignore"] }).trim();
  } catch (e) {}
  eleventyConfig.addGlobalData("build", {
    version: gitTag,
    date: new Date().toISOString().replace("T", " ").substring(0, 16)
  });

  // -------------------------------------------------------------------------
  // YAML Data Support
  // -------------------------------------------------------------------------
  eleventyConfig.addDataExtension("yml,yaml", contents => yaml.load(contents));

  // -------------------------------------------------------------------------
  // Collections
  //
  // A "note" is one entry in the chronological stream on the home page. Some
  // notes are pages on this site; others are just a title, a date and a link
  // somewhere else (`external` in front matter, `permalink: false` so no empty
  // page is built for them). Both kinds live in src/posts and both appear in
  // the stream, which is what makes the stream a record of what was written
  // rather than a list of what this site happens to host.
  //
  // Notes are tagged with Eleventy's own `tags`. "note" is applied to all of
  // them by src/posts/posts.json and is what marks a file as part of the
  // stream; everything else on a note is a topic. Eleventy concatenates tags
  // down the data cascade rather than replacing them, so a note's front
  // matter lists only its topics and still ends up in the stream.
  // -------------------------------------------------------------------------

  // A note's topics: its tags, less the "note" marker that put it in the
  // stream in the first place. Used everywhere tags are counted or shown, so
  // that marker never leaks into a tag index or onto a page.
  const topicsOf = tags => (tags || []).filter(tag => tag !== "note");

  // Newest first. slice() first: the array getFilteredByTag hands back is
  // Eleventy's, not ours to reorder in place.
  const rankNotes = collectionApi =>
    collectionApi.getFilteredByTag("note")
      .slice()
      .sort((a, b) => b.date - a.date);

  eleventyConfig.addCollection("notes", rankNotes);

  // The stream, grouped into years. Grouping here rather than in the template
  // keeps the year headings out of Nunjucks, where comparing an item against
  // the previous one means indexing back into the collection by hand.
  eleventyConfig.addCollection("notesByYear", collectionApi => {
    const groups = [];
    rankNotes(collectionApi).forEach(note => {
      const year = String(note.date.getUTCFullYear());
      const last = groups[groups.length - 1];
      if (last && last.year === year) last.notes.push(note);
      else groups.push({ year, notes: [note] });
    });
    return groups;
  });

  // Every topic tag in use, with how many notes carry it, A to Z. Derived from
  // the same ranked notes the stream renders, so a tag cannot show up with a
  // count the stream has no notes for.
  //
  // Called allTags, not tags: Eleventy already puts a collection under every
  // tag name in use, and a custom collection called "tags" would sit in that
  // same namespace.
  const tagCounts = collectionApi => {
    const counts = {};
    rankNotes(collectionApi).forEach(note => {
      topicsOf(note.data.tags).forEach(tag => {
        counts[tag] = (counts[tag] || 0) + 1;
      });
    });
    return Object.keys(counts)
      .sort((a, b) => a.localeCompare(b))
      .map(name => ({ name, count: counts[name] }));
  };

  eleventyConfig.addCollection("allTags", tagCounts);

  // One entry per tag, each carrying its own notes - what src/tag.njk
  // paginates over to build /tag/<name>/.
  eleventyConfig.addCollection("tagPages", collectionApi => {
    const notes = rankNotes(collectionApi);
    return tagCounts(collectionApi).map(tag => ({
      name: tag.name,
      count: tag.count,
      notes: notes.filter(note => topicsOf(note.data.tags).includes(tag.name))
    }));
  });

  // The stream trimmed to what the client-side search needs, from each note's
  // own front matter so there is a single source of truth.
  eleventyConfig.addCollection("searchIndex", collectionApi =>
    rankNotes(collectionApi).map(note => ({
      title: note.data.title || "",
      description: note.data.description || "",
      url: note.data.external || note.url,
      external: !!note.data.external,
      date: note.date.toISOString().substring(0, 10),
      tags: topicsOf(note.data.tags)
    }))
  );

  // -------------------------------------------------------------------------
  // Markdown Configuration
  // -------------------------------------------------------------------------
  const md = markdownIt({ html: true, breaks: false, linkify: true, typographer: true })
    .use(markdownItAttrs, {
      leftDelimiter: "{:",
      rightDelimiter: "}",
      allowedAttributes: ["id", "class", /^data-.*$/]
    });

  md.renderer.rules.fence = function(tokens, idx) {
    const token = tokens[idx];
    const lang = token.info.trim() || "";
    const code = md.utils.escapeHtml(token.content);
    return `<div class="language-${lang} highlighter-rouge"><div class="highlight"><pre class="highlight"><code>${code}</code></pre></div></div>\n`;
  };

  eleventyConfig.setLibrary("md", md);

  // -------------------------------------------------------------------------
  // SCSS Compilation
  //
  // Entry points in src/css are Nunjucks-templated (brand.scss expands the
  // selected theme), then compiled to CSS in the same pass. Partials under
  // src/_sass are pulled in via @use and must not be treated as templates
  // themselves.
  // -------------------------------------------------------------------------
  eleventyConfig.addTemplateFormats("scss");
  eleventyConfig.ignores.add("src/_sass/**");
  eleventyConfig.addWatchTarget("src/_sass/");

  // These templates render outside Eleventy's own Nunjucks environment, so
  // filters they need are registered here. Autoescaping is off because the
  // output is stylesheet text, not markup.
  const scssEnv = new nunjucks.Environment(null, { autoescape: false });

  // Expand the selected theme into CSS custom property declarations for one
  // mode. `brand` is settings.brand; theme and syntax may name different
  // themes, so each is resolved independently.
  scssEnv.addFilter("brandVars", function(brand, mode) {
    const pick = id => {
      const theme = themesById[id];
      if (!theme) throw new Error(
        `Unknown brand theme "${id}". Add it to src/_data/themes.json or pick one of: ` +
        Object.keys(themesById).slice(0, 5).join(", ") + ", ...");
      return theme;
    };
    brand = brand || {};
    const themeColors = pick(brand.theme || DEFAULT_THEME)[mode];
    const syntaxColors = pick(brand.syntax || DEFAULT_THEME)[mode];

    return themeVars.cssVars(themeColors, syntaxColors, mode)
      .map(([name, value]) => `  --${name}: ${value};`)
      .join("\n");
  });

  // One swatch class per syntax token, generated from the same list that
  // defines the --syntax-* properties so a new token cannot end up with a
  // variable but no class to paint it.
  scssEnv.addGlobal("syntaxSwatchCss", function() {
    return themeVars.SYNTAX_VARS.map(([name]) => {
      const isContainer = name.endsWith("-color");
      const cls = isContainer ? name : `${name}-color`;
      const onColor = isContainer ? `${name.replace(/-color$/, "")}-on-color, #fff`
                                  : `${name}-on-color, #000`;
      return `.${cls} {\n  background-color: var(--${name});\n  color: var(--${onColor});\n}`;
    }).join("\n");
  });

  eleventyConfig.addExtension("scss", {
    outputFileExtension: "css",
    compile: function(inputContent, inputPath) {
      return function(data) {
        // Resolve {{ settings.* }} before handing the result to sass.
        const scss = scssEnv.renderString(inputContent, data);
        const result = sass.compileString(scss, {
          loadPaths: [SASS_INCLUDES, path.dirname(inputPath)],
          style: "expanded",
          sourceMap: true,
          sourceMapIncludeSources: true
        });

        // Eleventy writes a single file per template, so emit the sibling
        // .map ourselves rather than inlining it into the shipped CSS.
        const outputPath = data.page && data.page.outputPath;
        if (!outputPath || !result.sourceMap) return result.css;

        const mapName = path.basename(outputPath) + ".map";
        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
        fs.writeFileSync(path.join(path.dirname(outputPath), mapName),
          JSON.stringify(result.sourceMap));

        return result.css + `\n/*# sourceMappingURL=${mapName} */\n`;
      };
    }
  });

  // -------------------------------------------------------------------------
  // Passthrough Copy
  // -------------------------------------------------------------------------
  eleventyConfig.addPassthroughCopy("src/assets");

  // -------------------------------------------------------------------------
  // Filters
  // -------------------------------------------------------------------------
  eleventyConfig.addFilter("relative_url", function(url) {
    const base = (this.ctx.settings?.baseurl || "").replace(/\/$/, "");
    if (!url) return base || "/";
    if (url.startsWith("http")) return url;
    return base + (url.startsWith("/") ? url : "/" + url);
  });

  // Absolute URL for feeds and the sitemap, where a relative path is no use.
  eleventyConfig.addFilter("absolute_url", function(url) {
    const root = (this.ctx.settings?.url || "").replace(/\/$/, "");
    const base = (this.ctx.settings?.baseurl || "").replace(/\/$/, "");
    if (!url) return root + base + "/";
    if (url.startsWith("http")) return url;
    return root + base + (url.startsWith("/") ? url : "/" + url);
  });

  const MONTHS = ["January", "February", "March", "April", "May", "June",
                  "July", "August", "September", "October", "November", "December"];

  // Single-pass token replacement. Chained .replace() calls corrupt output when
  // an earlier substitution emits a character a later pattern matches - e.g.
  // MMMM -> "December", then /D/g rewrites it to "15ecember".
  const DATE_TOKENS = /YYYY|MMMM|MMM|MM|DD|D/g;

  eleventyConfig.addFilter("date", function(date, format) {
    const d = date === "now" ? new Date() : new Date(date);
    if (!format) return d.toISOString();
    const pad = n => String(n).padStart(2, "0");
    const m = d.getUTCMonth();
    const values = {
      YYYY: d.getUTCFullYear(),
      MMMM: MONTHS[m],
      MMM: MONTHS[m].slice(0, 3),
      MM: pad(m + 1),
      DD: pad(d.getUTCDate()),
      D: d.getUTCDate()
    };
    return format.replace(DATE_TOKENS, token => values[token]);
  });

  eleventyConfig.addFilter("replace", (str, search, replace) => str ? str.split(search).join(replace) : "");
  eleventyConfig.addFilter("remove", (str, search) => str ? str.split(search).join("") : "");
  eleventyConfig.addFilter("split", (str, sep) => str ? str.split(sep) : []);
  eleventyConfig.addFilter("default", (val, def) => val ?? def);
  eleventyConfig.addFilter("size", val => val ? val.length : 0);

  // The template-side half of topicsOf, so a layout can print a note's topics
  // without having to know that "note" is in the same list.
  eleventyConfig.addFilter("topics", topicsOf);

  // Topic slugs are the display name, so /tag/<name> needs no separate field.
  eleventyConfig.addFilter("slug", str => String(str || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, ""));

  // -------------------------------------------------------------------------
  // Shortcodes
  //
  // These are Yolo's, carried over so the sample posts that document the
  // framework actually run here rather than printing their own source. The
  // galleries emit the markup that _sass/yolo/components/_lightbox.scss and
  // _images.scss already style, and that assets/js/yolo.js drives - see the
  // header of that file for the two blocks of it this site does not use.
  // -------------------------------------------------------------------------

  // Shared by the lightbox and the image grid: both are a column of
  // thumbnails plus an expanded view, differing only in chrome.
  function galleryHtml(type, name, images, columns) {
    const prefix = type === "lb" ? "lb" : "ig";
    // ceil, not floor: with floor, a remainder that does not divide evenly
    // across the columns drops the trailing images from the grid entirely -
    // they stayed in the modal, so the data-index values went out of sync
    // with the slides.
    const perCol = Math.max(1, Math.ceil(images.length / columns));

    // ImageGrid.open() hides #ig-<name> to reveal the expanded view, so the
    // wrapper must enclose ONLY the thumbnail grid - if it also contained
    // #ig-target-<name>, hiding it would hide the expanded view with it.
    let grid = type === "ig" ? `<div id="ig-${name}">` : "";
    grid += `<div class="columns is-mobile">`;

    for (let c = 0; c < columns; c++) {
      grid += `<div class="column">`;
      for (let r = 0; r < perCol; r++) {
        const idx = c * perCol + r;
        const img = images[idx];
        if (img) {
          const cls = type === "lb" ? "lb-square lb-hover-shadow" : "image square";
          grid += `<img class="${cls}" data-gallery="${name}" data-gallery-type="${prefix}" data-action="open" data-index="${idx}" alt="${img.description || ""}" src="${img.src}">`;
        }
      }
      grid += `</div>`;
    }
    grid += `</div>`;
    if (type === "ig") grid += `</div>`;   // close #ig-<name> before the target

    if (type === "lb") {
      grid += `<div id="lb-modal-${name}" class="lb-modal">
        <span class="lb-close" data-gallery="${name}" data-gallery-type="lb" data-action="close">&times;</span>
        <div class="lb-container is-mobile"><div class="lb-modal-content">`;
      images.forEach(img => {
        grid += `<div class="lb-slides"><img class="lb-item center" alt="${img.description || ""}" src="${img.src}"></div>`;
      });
      grid += `<a class="lb-nav lb-prev" data-gallery="${name}" data-gallery-type="lb" data-action="prev">&#10094;</a>
        <a class="lb-nav lb-next" data-gallery="${name}" data-gallery-type="lb" data-action="next">&#10095;</a>
        </div><div class="yolo-caption"><p id="lb-caption-${name}"></p></div></div></div>`;
    } else {
      grid += `<div id="ig-target-${name}" class="no-display"><div class="ig-modal-content"><div class="ig-slides">`;
      images.forEach((img, i) => {
        grid += `<img id="${name}-image-${i}" class="image square" data-gallery="${name}" data-gallery-type="ig" data-action="close" alt="${img.description || ""}" src="${img.src}">
          <div id="${name}-caption-${i}" class="yolo-caption"><p>${img.description || ""}</p></div>`;
      });
      grid += `</div>
        <a class="ig-nav ig-prev" data-gallery="${name}" data-gallery-type="ig" data-action="prev">&#10094;</a>
        <a class="ig-nav ig-next" data-gallery="${name}" data-gallery-type="ig" data-action="next">&#10095;</a>
        </div></div>`;
    }

    return grid;
  }

  eleventyConfig.addShortcode("arrow", link =>
    `<a href="${link || "#"}" class="yolo-to-top"><span class="material-icons md-36">keyboard_double_arrow_up</span></a>`);

  eleventyConfig.addShortcode("code", (label = "") =>
    `<div class="yolo-code-header"><span class="code-label">${label}</span><span class="copy-icon material-icons md-24">copy_all</span></div>\n\n`);

  eleventyConfig.addShortcode("toc", (header = "h2", text = "Table of Contents") =>
    `<${header} id="table-of-contents" class="no-toc">${text}</${header}><div id="toc"></div>`);

  eleventyConfig.addShortcode("video", function() {
    const videos = this.ctx.videos || [];
    return videos.slice(0, 2).map(v =>
      `<div class="yolo-video"><iframe src="${v.src}"></iframe><p>${v.description}</p></div>`
    ).join("\n");
  });

  eleventyConfig.addShortcode("prezo", function(title, dataFile = "prezos", aspect = "is-16-by-9") {
    const prezo = (this.ctx[dataFile] || []).find(p => p.title === title);
    if (!prezo) return "";
    return `<strong>${prezo.description}</strong>
      <div class="yolo-prezo-container ${aspect}"><iframe class="yolo-prezo-iframe" src="${prezo.src}"></iframe></div>`;
  });

  eleventyConfig.addShortcode("imageGrid", function(name, columns) {
    name = name || "ig-images";
    columns = columns || 4;
    // galleryHtml emits the #ig-<name> wrapper itself, around the grid only.
    return galleryHtml("ig", name, this.ctx[name] || [], columns);
  });

  eleventyConfig.addShortcode("lightbox", function(name) {
    name = name || "lb-images";
    return galleryHtml("lb", name, this.ctx[name] || [], 4);
  });

  eleventyConfig.addShortcode("flexbox", (columns = 1, fill = "") => {
    let html = '<div class="columns">';
    for (let i = 1; i <= columns; i++) {
      const cls = fill || "accent-color";
      const content = fill || i;
      html += `<div class="column"><div class="cell ${cls}">${content}</div></div>`;
    }
    return html + "</div>";
  });

  // A captioned image, resolved from _data/images.yml by name when given one.
  eleventyConfig.addShortcode("image", function(params = {}) {
    const images = this.ctx[params.imageData || "images"] || [];
    const img = params.name ? images.find(i => i.name === params.name) : null;
    const src = img?.src || params.src || "";
    const desc = img?.description || params.description || "";
    const cls = params.classes || "";

    if (desc) {
      return `<figure class="${cls}"><img class="image ${cls}" alt="${desc}" src="${src}"><figcaption>${desc}</figcaption></figure>`;
    }
    return `<img class="image ${cls}" alt="" src="${src}">`;
  });

  // -------------------------------------------------------------------------
  // Directory Configuration
  // -------------------------------------------------------------------------
  return {
    dir: { input: "src", output: "_site", includes: "_includes", data: "_data" },
    templateFormats: ["md", "njk", "html"],
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk"
  };
};
