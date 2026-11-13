# quirky-11ty

A notes site: a chronological stream, the same notes re-sorted by tag, and a
life-in-weeks grid.

The layout is modelled on [busterbenson.com](https://busterbenson.com/) - one
flex row holding a narrow nav column and a wide content section,
stacking to a horizontal nav strip on a phone. The styling is the Yolo
framework from [yolo-11ty](https://github.com/corbtastik/yolo-11ty): its Sass
modules, its theme definitions, and its light/dark and palette controls.

## Quick start

```bash
npm install
npm run serve     # http://localhost:8080
```

- `npm run build` - build to `_site/`
- `npm run clean` - remove the build output

## How it fits together

### The stream and the tags

A **note** is one entry in the stream. Notes live in `src/posts/` as markdown
with front matter:

```yaml
---
title: "Notes on taking notes"
date: 2025-02-14
description: One line about why this matters.
tags: [writing, systems-thinking]
---
```

`tags` is Eleventy's own key. `src/posts/posts.json` adds `note` to every file
in the directory, which is what puts it in the stream; Eleventy concatenates
tags down the data cascade rather than replacing them, so front matter lists
only the topics. The `note` marker is filtered back out wherever tags are
counted or shown - see `topicsOf` in `.eleventy.js` and the `topics` filter
it registers for templates.

A note written somewhere else adds `external` and `permalink: false`, so it
appears in the stream as a link out and no empty page is built for it:

```yaml
---
title: "A talk I gave"
date: 2024-09-12
description: Slides and notes.
external: https://example.com/talk
tags: [operations]
permalink: false
---
```

No sample post uses `external` - everything here is a real page - but the
feature stays because the stream is meant to be a record of what was written,
not of what this site happens to host.

`/tags/` and every `/tag/<name>/` page are generated from the tags in use -
there is no list of topics to maintain anywhere.

### Sample content

`src/posts/` ships 36 notes in two sets:

- **Yolo's own demo posts**, carried over from
  [yolo-11ty](https://github.com/corbtastik/yolo-11ty): typography, lists,
  tables, blockquotes, headers, image grids, the lightbox, videos,
  presentations, syntax themes, custom CSS/JS, containers, and the full
  `yolo-demo` kitchen sink. They document the framework by using it, so they
  are also the fastest way to see a theme applied to everything at once.
- **Written notes** - the dilemma tournament series and a handful of essays -
  which is what the stream, the tags and the search are actually exercised
  against.

Making the demo posts run here meant carrying over the machinery they call:
the `code`, `image`, `imageGrid`, `lightbox`, `video`, `prezo`, `toc`, `arrow`
and `flexbox` shortcodes (`.eleventy.js`), the demo partials
(`src/_includes/demo/`), their data files (`images.yml`, `ig-*.yml`,
`lb-*.yml`, `prezos.yml`, `videos.yml`, `syntaxTokens.yml`), their images and
opt-in `assets/ext/` CSS and JS, and Yolo's behaviour layer
(`assets/js/yolo.js`, `snippets.js`) plus highlight.js for code colouring.

`yolo.js` is the one file that is not a straight copy: its light/dark toggle
and sidebar blocks are removed, because this site owns the toggle in
`quirky.js` and has no sidebar. Leaving the toggle in bound two handlers to
the same button, so the mode flipped twice per click and looked dead. Its
header says so - read it before syncing the file against yolo-11ty.

### Pages

| Page | Source |
| --- | --- |
| `/` | `src/index.njk` - the stream, grouped by year, with search |
| `/tags/` | `src/tags.njk` - every topic and its count |
| `/tag/<name>/` | `src/tag.njk` - one page per topic |
| `/github/` | `src/github.njk` + `src/_data/repos.js` |
| `/life-in-weeks/` | `src/life-in-weeks.njk` + `src/_data/life-in-weeks.yml` |
| `/about/`, `/cv/` | `src/about.md`, `src/cv.md` |
| `/atom.xml`, `/feed.json`, `/sitemap.xml` | the matching `.njk` files in `src/` |

The nav is `src/_data/nav.yml`, in order. Internal entries highlight when you
are on them; a page can set `navActive` in front matter to point at the entry
it belongs under.

### Theming

Every colour on the page is a CSS custom property expanded out of one theme in
`src/_data/themes.json`. Pick one in `src/_data/settings.yml`:

```yaml
brand:
  theme: minio      # paints the site
  syntax: minio     # paints code blocks
```

`minio` is a theme built for this site from the colours in MinIO's slide
template: a near-black navy page (`#070C22`), crimson accents (`#CF163D` /
`#F5436F`) and a violet secondary (`#6E3791` / `#A99BE8`). Every
foreground/background pair in both modes clears WCAG AA, worst case 5.45:1.

The palette icon in the corner lets a reader try any of the other ~67 themes at
runtime, and the choice sticks. Both axes - light/dark and which palette -
apply before the first paint, so there is no flash of the compiled-in theme.

Site-specific colours are bound in `src/_sass/quirky/_theme.scss`, which only
ever points at those tokens. That is what lets the palette picker repaint the
week grid along with everything else.

### Layout

```
src/_sass/
  yolo/      the framework, unmodified - base, utilities, core, components
  quirky/    this site: _layout, _images, _nav, _stream, _tags, _repos,
             _search, _weeks, _theme
```

`_images.scss` is a bug fix rather than a style choice, and lives in this layer
so `src/_sass/yolo` stays a clean copy of upstream. Yolo's click-to-enlarge
sizes the opened image with `width: 100%` **and** `height: 100%` while keeping
the thumbnail's `aspect-ratio` and `object-fit: cover`. The percentage height
resolves against a box the image is itself sizing, so it blows up to the whole
article height and `cover` crops the photo into a sliver; the square, thumbnail
and circle classes meanwhile resolve to no change at all, so clicking them does
nothing.

The override enlarges to the column width at the photo's own ratio, with a 1.2s
ease-out glide. Only `width` is animated - an enlarged image has `height: auto`,
so its height is recomputed from the width every frame and tracks it exactly,
which keeps the photo in proportion throughout the zoom rather than only at the
ends. Circles are the one exception: they keep a square box, a 50% radius and
`object-fit: cover`, because dropping to the photo's own 3:4 would enlarge a
circle into an oval, and `cover` crops to fill it rather than squashing it.

**It is worth fixing in yolo-11ty too** - every site built on the framework
has it.

`src/css/main.scss` pulls both layers in, in that order;
`src/css/brand.scss` is the theme expansion and should not need editing.

## Settings

`src/_data/settings.yml` carries the site name and description, the brand
theme, the round portrait at the top of the nav, the profiles shown in the
footer, and the birth date the week grid counts from. Set `url` before building for production - the feeds and
the sitemap need an absolute origin.

## The CV page

`/cv/` opens with a career band: one block per role, positioned and sized along
a shared time axis, so thirty years has a shape before you read a word. It is a
flattened cousin of the life-in-weeks grid - one block per job instead of one
box per week. Each block links to that role's heading, so the band doubles as a
contents list, and hovering one puts its details in the caption underneath.

The dates live in `src/_data/careerRoles.yml`; `src/_data/career.js` turns them
into positioned blocks and year ticks. The prose in `src/cv.md` is written by
hand, so a date changed in one needs changing in the other.

`end: present` marks the job you are in now: the band runs it to the current
month, so it grows by itself, and paints it in body-text ink rather than a
brand colour so it reads as "you are here". A role with an empty `end:` is a
different thing - drawn up to the next role's start and hatched, rather than
given an invented month. Nothing uses that at the moment; it is there so an
unsettled date can go in without having to be guessed at.

## The GitHub page

`/github/` lists public repositories as stacked rows, newest push first; the
whole row is the link. They come from the GitHub API at build time, via
`src/_data/repos.js`, configured under `github:` in `settings.yml`:

```yaml
github:
  user: corbtastik
  includeForks: false      # forks are public, but someone else's work
  includeArchived: true    # archived repos stay, labelled
  cacheMinutes: 60
```

Every successful response is written to `_cache/github-repos.json`, and that
copy is used whenever the request fails - so a clone with no network, or a
rate-limited CI box, still builds the page. **Commit that cache.** If the API
fails and no cache exists, the page says so instead of rendering an empty list
that would look like an account with nothing in it.

The cache is also a throttle: unauthenticated GitHub allows 60 requests an hour
per IP and `eleventy --serve` re-runs data files on every rebuild, so inside
`cacheMinutes` the cached copy is used without asking. Set `GITHUB_TOKEN` in
the environment to raise the limit.

## Notes on life in weeks

It draws one box per week between `weeks.born` and
`weeks.born + weeks.years` - around 4,700 of them. The grid is precomputed in
`src/_data/weeksGrid.js`, because working out which week an event falls in is
not something to express in template tags. Add entries to
`src/_data/life-in-weeks.yml` and they appear as labelled boxes.

## Licence

Built with Yolo. You may use and modify this site for personal or commercial
projects. You may not redistribute, republish or resell Yolo itself, or ship a
theme, template or starter kit based substantially on it.
