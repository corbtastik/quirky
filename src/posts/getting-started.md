---
title: Getting Started
description: Get Quirky running in a few minutes.
subtitle: "Getting Quirky running."
date: 2026-01-02
tags:
  - getting-started
  - setup
  - nodejs
permalink: /posts/getting-started/
---

## Getting Started

You need [Node.js](https://nodejs.org/) and npm. 🚀

{% code "Get Quirky" %}
```bash
git clone https://github.com/corbtastik/quirky.git
cd quirky
npm install
npm run serve
```

That serves the site at [http://localhost:8080](http://localhost:8080) and
rebuilds as you edit.

Two more scripts:

- `npm run build` writes the site to `_site/`
- `npm run clean` removes it

Prefer a container? The [containers post](/posts/containers/) covers Podman.
