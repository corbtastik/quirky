---
title: "Deploying 11ty to Google Firebase"
date: 2026-01-08
tags: ["tutorial", "firebase", "11ty", "hosting"]
description: "A quick guide on setting up the Firebase CLI and deploying a static 11ty site."
subtitle: "Deploying an 11ty site with the Firebase CLI."
---

I moved this blog to Google Firebase Hosting. It is fast. It runs on a global
CDN. For a static site it costs next to nothing.

I am on a Mac with Apple Silicon. These are the exact steps I took. Install the
tools, set up the project, deploy the [Eleventy (11ty)](https://www.11ty.dev/)
build.

Here is how to go from zero to deployed.

## 1. Install Node.js and the Firebase CLI

Firebase tools run on Node.js. No Node yet? Grab the LTS build from
[nodejs.org](https://nodejs.org/).

Open a terminal. Install the Firebase command-line tools globally so they run
from any folder.

```bash
sudo npm install -g firebase-tools
```

**Note**: Your Mac may ask for your password. A global install needs sudo.

## 2. Authenticate

Connect the CLI to your Google account.

```bash
firebase login
```

Your browser opens. Log in with the Google account that will host the site.
Grant the permissions, then close the tab.

List your projects to check it took:

```bash
firebase projects:list
```

## 3. Initialize the Project

```bash
cd ~/path/to/my-blog
```

Run the initialization wizard:

```bash
firebase init hosting
```

The CLI asks a run of questions. Here are the answers for a plain 11ty site:

1. Project Setup: Select Use an existing project (or create a new one here if you haven't yet).
2. Public Directory: Type _site. That is where 11ty writes your HTML and CSS.
3. Configure as a single-page app (SPA)? Type No (N). *Important*: 11ty builds static pages, not a SPA. Answer yes and you break your SEO and your 404 handling.
4. Set up automatic builds with GitHub? Type No (N) for now.
5. Overwrite `index.html`? Type No (N).

## 4. Build and Deploy

The plumbing is in. Deploying takes two steps. Build the site into the _site
folder. Upload that folder.

Run this sequence in your terminal:

```bash
# 1. Clean and build the static files
npx @11ty/eleventy

# 2. Upload to Google's servers
firebase deploy
```

The terminal prints a Hosting URL, ending in `.web.app`. Click it. Your blog is
live!

## 5. Future Updates

New post? I run the same two steps. Need the site down for a while? That is
`firebase hosting:disable`.
