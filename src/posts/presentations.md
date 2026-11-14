---
title: Presentations
description: Embed presentations with configurable aspect ratios.
date: 2026-01-19
tags:
  - presentations
  - embed
  - media
  - slides
permalink: /posts/presentations/
---

## Presentations

Embed Google Slides. 📽️

1. Add data to `src/_data/prezos.yml`.
2. Use the `prezo` shortcode with the title.

Default aspect ratio is 16:9. Options: `is-16-by-9`, `is-4-by-3`, `is-1-by-1`.

---

### 16:9 Ratio
{:.no-toc}

{% code "Default ratio" %}
{% raw %}
```html
{% prezo "blinged-macmini" %}
```
{% endraw %}

{% prezo "blinged-macmini" %}

---

### 4:3 Ratio
{:.no-toc}

{% code "4:3 ratio" %}
{% raw %}
```html
{% prezo "one-awesome-prezo", "prezos", "is-4-by-3" %}
```
{% endraw %}

{% prezo "one-awesome-prezo", "prezos", "is-4-by-3" %}

---

---

## A viewer of our own

An embedded player is a cross-origin iframe. Nothing inside one can be
restyled, so it always looks like someone else's component sitting on your
page.

The `slides` shortcode renders the deck itself. The slides are local images,
so the viewer wears the same bar a code block gets, follows the theme, and
needs no third-party player.

{% code "A deck" %}
{% raw %}
```html
{% slides "quirky" %}
```
{% endraw %}

{% slides "quirky" %}

Click the slide or use the arrows. Arrow keys work once the deck has focus.
Decks live in `src/_data/decks.yml`; `npm run slides` re-exports the images.
