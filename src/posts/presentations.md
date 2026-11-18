---
title: Presentations
description: Embed a Google Slides deck with the aspect ratio you want.
subtitle: "Embedding a Google Slides deck."
date: 2026-01-19
tags:
  - presentations
  - embed
  - media
  - slides
permalink: /posts/presentations/
---

## Presentations

Share a deck from Google Slides and drop it on the page. 📽️

1. Publish or share the deck, then copy its embed URL.
2. Add it to `src/_data/prezos.yml`.
3. Call the `prezo` shortcode with the title.

{% code "prezos.yml" %}
```yaml
- title: "quirky"
  description: "Quirky - a notes site that remembers what you wrote."
  src: "https://docs.google.com/presentation/d/<id>/embed?start=false&loop=false"
```

The default aspect ratio is 16:9. Pass `is-16-by-9`, `is-4-by-3` or
`is-1-by-1` to change it. The frame reserves that shape before the deck
loads, so nothing below it jumps.

A note on the frame. The deck arrives in an iframe from another origin, so
nothing inside it can be styled from here. Two things help. `rm=minimal` on
the URL drops Google's control bar, and the frame is pulled out two pixels on
each side to clip the border it draws. Dropping the bar also drops the
next and previous buttons, so a deck that uses it should autoplay.

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

### 1:1 Ratio
{:.no-toc}

{% code "1:1 ratio" %}
{% raw %}
```html
{% prezo "quirky", "prezos", "is-1-by-1" %}
```
{% endraw %}

{% prezo "quirky", "prezos", "is-1-by-1" %}

This one runs with `rm=minimal`, so it carries no control bar and autoplays
through its seven slides.
