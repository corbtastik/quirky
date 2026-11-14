---
title: Presentations
description: Slide decks, rendered by the site itself.
date: 2026-01-19
tags:
  - presentations
  - embed
  - media
  - slides
permalink: /posts/presentations/
---

## Presentations

A deck is a folder of images and four lines of YAML. 📽️

The site renders it. That matters more than it sounds. An embedded player
arrives in an iframe from another origin, and nothing inside one can be
styled from here. It always looks like someone else's component parked on
your page.

Rendering the slides ourselves buys the whole surface. The viewer wears the
same bar a code block gets. It follows the theme. It needs no third party at
runtime.

### Adding a deck
{:.no-toc}

1. Put the slides in `src/assets/slides/<name>/` as `01.png`, `02.png`, and
   so on.
2. Add an entry to `src/_data/decks.yml`.
3. Call the shortcode with the deck name.

{% code "decks.yml" %}
```yaml
- name: quirky
  title: Quirky
  count: 7
  ratio: 1-by-1
  source: "https://docs.google.com/presentation/d/<id>/edit"
```

`ratio` sets the shape: `1-by-1`, `16-by-9` or `4-by-3`. The stage reserves
that shape before the images load, so nothing below it jumps. `source` is
where the header's last icon points.

Run `npm run slides` to re-export a deck after you edit it.

---

### Square
{:.no-toc}

{% code "A deck" %}
{% raw %}
```html
{% slides "quirky" %}
```
{% endraw %}

{% slides "quirky" %}

Click the slide to advance. The arrows work too. So do the arrow keys, once
the deck has focus.

---

### 16:9
{:.no-toc}

{% code "16:9" %}
{% raw %}
```html
{% slides "macmini" %}
```
{% endraw %}

{% slides "macmini" %}

---

### 4:3
{:.no-toc}

{% code "4:3" %}
{% raw %}
```html
{% slides "awesome" %}
```
{% endraw %}

{% slides "awesome" %}
