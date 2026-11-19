# quirky

A notes site. A chronological stream, the same notes re-sorted by tag, and a
life-in-weeks grid.

Built with [Eleventy](https://www.11ty.dev/). 

## Run it

```bash
npm install
npm run serve     # http://localhost:8080
```

- `npm run build` writes the site to `_site/`
- `npm run clean` removes it

## Writing a note

A note is one entry in the stream. Notes live in `src/posts/` as markdown with
front matter:

```yaml
---
title: "Notes on taking notes"
date: 2025-02-14
description: One line about why this matters.
tags: [writing, systems-thinking]
---
```

Every file in `src/posts/` joins the stream. The tag pages build themselves
from the tags in use, so there is no topic list to maintain.

A note published somewhere else adds two more keys. It then appears in the
stream as a link out, and no page is built for it:

```yaml
external: https://example.com/talk
permalink: false
```

## Pages

| Page | Source |
| --- | --- |
| `/` | `src/index.njk` - the stream, grouped by year, with search |
| `/tags/` | `src/tags.njk` - every topic and its count |
| `/tag/<name>/` | `src/tag.njk` - one page per topic |
| `/github/` | `src/github.njk` and `src/_data/repos.js` |
| `/life-in-weeks/` | `src/life-in-weeks.njk` and `src/_data/life-in-weeks.yml` |
| `/about/`, `/cv/` | `src/about.md`, `src/cv.md` |
| feeds and sitemap | the matching `.njk` files in `src/` |

The nav is `src/_data/nav.yml`, in order. A page can set `navActive` in front
matter to light up the entry it belongs under.

## Theming

Every colour comes from one theme in `src/_data/themes.json`. Pick one in
`src/_data/settings.yml`:

```yaml
brand:
  theme: minio      # paints the site
  syntax: minio     # paints code blocks
```

The palette icon in the corner lets a reader try any of the other 69 themes,
and the choice sticks. Light or dark and the chosen palette both apply before
the first paint, so the compiled-in theme never flashes.

Site colours are bound in `src/_sass/quirky/_theme.scss`. That file points
only at theme tokens. It is what lets the palette picker repaint everything at
once, the week grid included.

## Settings

`src/_data/settings.yml` holds the site name and description, the theme, the
portrait at the top of the nav, the profile links, and the birth date the week
grid counts from.

Set `url` before a production build. The feeds and the sitemap need an
absolute origin.

## The GitHub page

`/github/` lists public repositories, newest push first. The whole row is the
link. They come from the GitHub API at build time:

```yaml
github:
  user: corbtastik
  includeForks: false      # forks are public, but someone else's work
  includeArchived: true    # archived repos stay, labelled
  cacheMinutes: 60
```

Every good response is written to `_cache/github-repos.json`. That copy is
used whenever the request fails, so a clone with no network still builds the
page. **Commit the cache.**

The cache is also a throttle. Unauthenticated GitHub allows 60 requests an
hour per IP, and `eleventy --serve` re-runs data files on every rebuild. Set
`GITHUB_TOKEN` in the environment to raise the limit.

## Life in weeks

One box per week between `weeks.born` and `weeks.born + weeks.years`, around
4,700 of them. The grid is precomputed in `src/_data/weeksGrid.js`. Add
entries to `src/_data/life-in-weeks.yml` and they appear as labelled boxes.

## The CV page

`/cv/` opens with a career band. One block per role, placed and sized along a
shared time axis, so thirty years has a shape before you read a word. Each
block links to that role's heading, so the band doubles as a contents list.

The dates live in `src/_data/careerRoles.yml`. The prose in `src/cv.md` is
written by hand, so a date changed in one needs changing in the other.

`end: present` marks the job you hold now. The band runs it to the current
month, so it grows by itself.

## Licence

Use and modify this site for personal or commercial projects. Do not
redistribute, republish or resell it as a theme, template or starter kit.
