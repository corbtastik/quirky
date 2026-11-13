const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

/**
 * Public repositories, read from the GitHub API at build time.
 *
 * The API is the source of truth - descriptions, languages and stars change
 * without this repo knowing - but a build must not depend on the network, so
 * every successful response is written to _cache/github-repos.json and that
 * copy is used whenever the request fails. Commit the cache and a clone with
 * no network, or a rate-limited CI box, still builds the page.
 *
 * The cache is also a throttle. Unauthenticated GitHub allows 60 requests an
 * hour per IP, and `eleventy --serve` re-runs this file on every rebuild, so a
 * morning's editing would otherwise exhaust the quota. Inside the TTL the
 * cached copy is used without asking.
 *
 * Set GITHUB_TOKEN to raise the limit; it is only ever read for public data.
 */

const CACHE_FILE = path.join(__dirname, "..", "..", "_cache", "github-repos.json");
const API = "https://api.github.com";
const PER_PAGE = 100;

function loadSettings() {
  return yaml.load(fs.readFileSync(path.join(__dirname, "settings.yml"), "utf8"));
}

function readCache() {
  try {
    return JSON.parse(fs.readFileSync(CACHE_FILE, "utf8"));
  } catch (e) {
    return null;
  }
}

function writeCache(payload) {
  try {
    fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
    fs.writeFileSync(CACHE_FILE, JSON.stringify(payload, null, 2) + "\n");
  } catch (e) {
    console.warn(`[repos] could not write cache: ${e.message}`);
  }
}

/** Every page of a user's repos, newest push first. */
async function fetchRepos(user) {
  const headers = { "Accept": "application/vnd.github+json", "User-Agent": "quirky-11ty" };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const all = [];
  // Bounded rather than `while (true)`: a paging bug against a 40-repo account
  // should not turn into an unbounded loop against someone's API quota.
  for (let page = 1; page <= 10; page++) {
    const url = `${API}/users/${encodeURIComponent(user)}/repos` +
                `?per_page=${PER_PAGE}&page=${page}&sort=pushed&type=owner`;
    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText} for ${url}`);
    }
    const batch = await response.json();
    all.push(...batch);
    if (batch.length < PER_PAGE) break;
  }
  return all;
}

/** Only the fields the page renders, so the cache stays small and readable. */
function shape(repo) {
  return {
    name: repo.name,
    url: repo.html_url,
    description: repo.description || "",
    language: repo.language || "",
    stars: repo.stargazers_count || 0,
    forks: repo.forks_count || 0,
    topics: repo.topics || [],
    homepage: repo.homepage || "",
    isFork: !!repo.fork,
    isArchived: !!repo.archived,
    pushed: repo.pushed_at
  };
}

module.exports = async function() {
  const settings = loadSettings();
  const config = settings.github || {};
  const user = config.user;

  if (!user) return [];

  const ttlMs = (config.cacheMinutes ?? 60) * 60 * 1000;
  const cached = readCache();
  const age = cached && cached.fetchedAt ? Date.now() - Date.parse(cached.fetchedAt) : Infinity;

  let repos;
  if (cached && cached.user === user && age < ttlMs) {
    repos = cached.repos;
  } else {
    try {
      repos = (await fetchRepos(user)).map(shape);
      writeCache({ user, fetchedAt: new Date().toISOString(), repos });
    } catch (e) {
      if (cached && cached.repos) {
        console.warn(`[repos] GitHub request failed (${e.message}); using the cached copy from ${cached.fetchedAt}`);
        repos = cached.repos;
      } else {
        // A page listing nothing is better than a build that cannot run at
        // all; github.njk says so rather than rendering an empty list.
        console.warn(`[repos] GitHub request failed (${e.message}) and there is no cache - the GitHub page will be empty`);
        return [];
      }
    }
  }

  // Forks are public repositories but they are somebody else's work, so they
  // are out by default. Archived ones stay in and are labelled: they are still
  // part of the record, just finished.
  const includeForks = config.includeForks === true;
  const includeArchived = config.includeArchived !== false;

  return repos
    .filter(repo => (includeForks || !repo.isFork) &&
                    (includeArchived || !repo.isArchived))
    .sort((a, b) => Date.parse(b.pushed) - Date.parse(a.pushed));
};
