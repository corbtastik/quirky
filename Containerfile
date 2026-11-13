# -----------------------------------------------------------------------------
# quirky-11ty - production image
#
#   podman build -t quirky .
#   podman run --rm -it -p 8080:8080 quirky
#
# Two stages. Node builds the site; the image that ships is nginx plus the
# contents of _site, so none of the toolchain is in the thing you deploy.
# -----------------------------------------------------------------------------

FROM docker.io/library/node:22-alpine AS build

WORKDIR /app

# Dependencies first, in their own layer: package.json changes far less often
# than the posts do, so editing a note does not reinstall node_modules.
COPY package.json package-lock.json ./
# `--force` is doing one specific job. package-lock.json pins fsevents, which
# chokidar lists under optionalDependencies but which npm recorded in the lock
# as required with os: ["darwin"], so a plain `npm ci` on Linux dies with
# EBADPLATFORM. --force waives that platform check and nothing else: the lock
# is still installed exactly as written, so the build stays reproducible.
# fsevents is a macOS file-watching shim; Linux uses inotify and never wants it.
RUN npm ci --force

COPY . .

# The build reads the GitHub API for /github/. It does not have to succeed -
# src/_data/repos.js falls back to _cache/github-repos.json, which is copied
# in above - so this works on a box with no network or a spent API quota.
# Pass --build-arg GITHUB_TOKEN=... to raise the rate limit.
ARG GITHUB_TOKEN=""
ENV GITHUB_TOKEN=$GITHUB_TOKEN

RUN npm run build


# -----------------------------------------------------------------------------
# The runtime image. nginx-unprivileged runs as uid 101 and listens on 8080,
# so nothing here needs root and the port needs no mapping gymnastics under
# rootless podman.
# -----------------------------------------------------------------------------
FROM docker.io/nginxinc/nginx-unprivileged:alpine

COPY --chown=nginx:nginx nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build --chown=nginx:nginx /app/_site /usr/share/nginx/html

EXPOSE 8080

# No HEALTHCHECK here on purpose. Podman builds OCI images by default, and the
# OCI spec has no healthcheck field - podman warns and drops it, leaving a
# Containerfile that claims a check the image does not have. Add one at the
# point it is honoured instead: `podman run --health-cmd ...`, a readiness
# probe in the Kubernetes manifest, or build with `--format docker`.
