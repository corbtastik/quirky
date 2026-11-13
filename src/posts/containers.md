---
title: Containers
description: Build and run this site as a container with Podman.
date: 2026-01-22
tags:
  - podman
  - containers
  - deployment
permalink: /posts/containers/
---

## Containers

Two images. One builds the site and ships it behind nginx; the other runs
Eleventy's dev server so you can edit with a container in the loop.

Podman rather than Docker, so none of this needs a daemon or root.

### Files
{:.no-toc}

1. **`Containerfile`** - the production image. Multi-stage: Node builds, nginx
   serves, and the toolchain is left behind in the first stage.
2. **`Containerfile-dev`** - Eleventy's server with watch, for development.
3. **`nginx.conf`** - replaces the image default. Clean URLs, a real 404, and
   caching rules.
4. **`.containerignore`** - keeps `node_modules`, `_site` and `.git` out of the
   build context.

---

### Production
{:.no-toc}

{% code "Build and run" %}
```bash
podman build -t quirky .
podman run --rm -it -p 8080:8080 quirky
# open http://localhost:8080
```

The runtime image is `nginx-unprivileged`, which runs as uid 101 and listens
on 8080. Nothing in it needs root.

---

### Development
{:.no-toc}

{% code "Build and run with live reload" %}
```bash
podman build -t quirky-dev -f Containerfile-dev .
podman run --rm -it -p 8080:8080 -v "$PWD/src:/app/src:Z" quirky-dev
# open http://localhost:8080
```

Mounting `src` over the copy baked into the image means the container serves
your working tree rather than a snapshot. The `:Z` suffix relabels the mount
for SELinux - a no-op on macOS, required on Fedora and RHEL.

**Live reload only works on Linux.** On macOS and Windows podman runs
containers inside a Linux VM, and bind mounts reach it over virtiofs, which
does not forward file-change events. The watcher is running and healthy - an
edit made *inside* the container rebuilds in under two seconds - but an edit
made on the host is never announced, so nothing happens. There is no flag that
fixes it; polling options do not help, because Eleventy watches through
`@parcel/watcher` rather than chokidar.

On macOS, use the container to run the site and `npm run serve` on the host
when you want live reload.

---

### The GitHub page
{:.no-toc}

The build reads the GitHub API to fill `/github/`. It does not have to
succeed: `src/_data/repos.js` falls back to `_cache/github-repos.json`, which
is in the build context, so the image builds on a machine with no network.

To use the API properly and avoid the 60-requests-an-hour anonymous limit:

{% code "Build with a token" %}
```bash
podman build --build-arg GITHUB_TOKEN="$GITHUB_TOKEN" -t quirky .
```

---

### Checking it
{:.no-toc}

{% code "Verify the image" %}
```bash
# the pages are really in there
podman run --rm quirky ls /usr/share/nginx/html

# it answers, and a missing page is a 404 rather than the home page
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:8080/
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:8080/nope/

# it is not running as root
podman run --rm quirky id
```

---

### Pods
{:.no-toc}

Podman can hand the running container straight to systemd or Kubernetes.

{% code "Generate a unit or a manifest" %}
```bash
podman run -d --name quirky -p 8080:8080 quirky

podman generate systemd --new --name quirky > quirky.service
podman kube generate quirky > quirky.yaml
```
