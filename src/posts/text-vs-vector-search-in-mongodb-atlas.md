---
title: "Text vs Vector Search in MongoDB Atlas"
date: 2026-01-09
tags: ["tutorial", "atlas", "mongodb", "ai", "vector-search", "text-search"]
description: "Feel the Difference - Keyword Search vs Vector Search in MongoDB Atlas"
subtitle: "Keyword search and vector search, side by side."
---

Let's run a search spin-off in MongoDB Atlas. Two contenders, same data, same
questions. Here they are:

- [Atlas Search](https://www.mongodb.com/docs/atlas/atlas-search/operators-collectors/text/)
  is keyword search. It uses the `text` operator and scores with
  [BM25](https://en.wikipedia.org/wiki/Okapi_BM25) by default.
- [Atlas Vector Search](https://www.mongodb.com/docs/atlas/atlas-vector-search/vector-search-stage/)
  is semantic search. It uses the
  [`$vectorSearch` aggregation stage](https://www.mongodb.com/docs/manual/reference/operator/aggregation/vectorsearch/)
  to run a [nearest-neighbor](https://en.wikipedia.org/wiki/Nearest_neighbor_search)
  search over embeddings.

> The goal isn't to "replace" text search. It's to experience, hands-on,
> **why** vector search is different.

The split comes down to the question each one answers.

- **[Keyword search](https://learn.mongodb.com/learn/course/search-fundamentals/)
  answers**: *"Which documents contain these words?"* That's BM25-style
  ranking.
- **[Vector search](https://www.mongodb.com/docs/atlas/atlas-vector-search/vector-search-overview/)
  answers**: *"Which documents are most similar in meaning?"* That's the
  closest vectors.

I want this to stay a true *"Hello World."* You should be able to reproduce it
fast. So we lean on Atlas's sample data:
[`sample_mflix`](https://www.mongodb.com/docs/atlas/sample-data/sample-mflix/).
It ships with an `embedded_movies` collection built for
[vector search experiments](https://www.mongodb.com/docs/atlas/atlas-vector-search/tutorials/vector-search-quick-start/).

---

## Prerequisites

### Accounts + cloud setup

- A [MongoDB Atlas account](https://cloud.mongodb.com) and a project.
- An Atlas cluster you can connect to. Free Tier or Flex works fine here.

### Local tools

- Git, to clone the repo and commit your changes.
- `mongosh` (the MongoDB Shell) or MongoDB Compass.

### Atlas data + indexes we'll create

- Load the Atlas Sample Dataset. That gives you the `sample_mflix` database,
  including `embedded_movies`.
- We will create:
  - A Search (text) index for keyword search, using the `text` operator. It
    scores with BM25 by default.
  - A Vector Search index so `$vectorSearch` can run.

### Optional (nice to haves)

- Node.js, if you want a small "demo app" wrapper around the queries later.
- The Atlas CLI. You don't need it here, but it earns its keep once you
  automate.

---
