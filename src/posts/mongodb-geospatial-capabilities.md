---
title: "MongoDB Geo Coordinate (Geospatial) Capabilities"
date: 2026-02-05
tags: ["mongodb", "atlas", "geospatial", "geojson", "2dsphere", "iot", "telco", "reference"]
description: "A 1-pager on MongoDB geospatial data modeling, indexing, and query patterns (with IoT + Telco examples) plus a brief Cosmos DB comparison."
subtitle: "Geospatial data modeling, indexing, and queries in MongoDB."
---

## What MongoDB does with geo coordinates

MongoDB ships **native geospatial data types, indexes, and query operators**.
Store latitude and longitude, or whole shapes, and query them fast.

### 1) How you store geo data

- **GeoJSON** (recommended): store `Point`, `LineString`, `Polygon`, etc. in a
  field like `location`.
- MongoDB's geospatial indexes work with **GeoJSON** and with **legacy
  coordinate pairs**, the older style.
- Overview: [Geospatial Indexes (MongoDB Manual)](https://www.mongodb.com/docs/manual/core/indexes/index-types/index-geospatial/)

### 2) How you index geo data

MongoDB offers two geospatial index types:

- **`2dsphere`** (most common): reads geometry on an Earth-like sphere. Best
  for GPS lat/lng and GeoJSON.
  - Docs: [2dsphere Indexes](https://www.mongodb.com/docs/manual/core/indexes/index-types/geospatial/2dsphere/)
- **`2d`** (less common): planar, flat geometry use cases.
  - Docs: [2d Indexes](https://www.mongodb.com/docs/manual/core/indexes/index-types/geospatial/2d/)

### 3) Core geo query patterns (what you can do)

- **Nearest / radius** ("closest X", "within N miles/km")
  - `$near`: [Docs](https://www.mongodb.com/docs/manual/reference/operator/query/near/)
  - `$nearSphere`: [Docs](https://www.mongodb.com/docs/manual/reference/operator/query/nearsphere/)
- **Within geofence / area** ("inside this polygon/zone")
  - `$geoWithin`: [Docs](https://www.mongodb.com/docs/manual/reference/operator/query/geowithin/)
- **Intersects** ("does this path/shape cross this zone?")
  - `$geoIntersects`: [Docs](https://www.mongodb.com/docs/manual/reference/operator/query/geointersects/)
- **GeoJSON geometry helper**
  - `$geometry`: [Docs](https://www.mongodb.com/docs/manual/reference/operator/query/geometry/)
- Helpful overview page: [Geospatial Queries](https://www.mongodb.com/docs/manual/geospatial-queries/)

### 4) Geo + full-text relevance (optional: Atlas Search)

Add **Atlas Search** and you can combine **text relevance with geo
filtering**. Example: "tickets containing 'outage' near this point."

- `geoWithin`: [Docs](https://www.mongodb.com/docs/atlas/atlas-search/operators-collectors/geowithin/)
- `geoShape`: [Docs](https://www.mongodb.com/docs/atlas/atlas-search/operators-collectors/geoshape/)
- Indexing GeoJSON for Search: [How to Index GeoJSON Objects](https://www.mongodb.com/docs/atlas/atlas-search/field-types/geo-type/)

---

## Does Azure Cosmos DB have geo coordinate capability?

**Yes**, but the details depend on the Cosmos API you use.

### Cosmos DB for NoSQL (SQL API / Query language)

- Supports GeoJSON and common spatial queries like:
  - "within area", "distance between two locations", "path intersects"
- Docs:
  - [Index and query GeoJSON location data (Cosmos DB for NoSQL)](https://learn.microsoft.com/en-us/azure/cosmos-db/how-to-geospatial-index-query)
  - [Indexing overview (Spatial index + ST_DISTANCE/ST_WITHIN/ST_INTERSECTS)](https://learn.microsoft.com/en-us/azure/cosmos-db/index-overview)
  - [ST_DISTANCE](https://learn.microsoft.com/en-us/cosmos-db/query/st-distance)

### Cosmos DB for MongoDB (MongoDB API)

- Supports **`2dsphere`** indexes
- Does **not** support **`2d`** indexes in that API (as of the referenced doc)
- Docs: [Manage indexing (Cosmos DB for MongoDB)](https://learn.microsoft.com/en-us/azure/cosmos-db/mongodb/indexing)

**Practical takeaway:** Both platforms can "do geo." Cosmos behavior varies by
API surface. MongoDB's geospatial semantics are native, and they stay
consistent across MongoDB deployments.

---

## IoT use-cases that require geo coordinates

These are "geo-first" patterns. Lat/lng and shapes sit at the center.

- **Asset tracking & logistics:** "nearest asset", route deviation, ETA by
  proximity
- **Geofencing & compliance:** enter/exit polygons (restricted zones, service
  territories)
- **Field service dispatch:** assign the closest tech or vehicle, then re-route
  on the fly
- **Connected vehicles/telematics:** trip reconstruction (paths), zone
  compliance, intersection with restricted zones
- **Smart city / mobility:** "near me" availability, hotspot detection,
  rebalancing
- **Industrial IoT / safety:** worker/robot proximity to hazards,
  restricted-area alerts
- **Retail / venue analytics:** dwell/flow inside polygons, proximity-based
  experiences

---

## Telco IoT use-cases that require geo coordinates

### Network operations (RAN / transport / access)

- **Outage correlation by proximity:** cluster alarms and incidents by distance
  to cell sites, sectors and impacted neighborhoods
- **Fiber cut impact analysis:** model the cut location. Find customers,
  towers and sites inside the affected geofences or along a path
- **Backhaul planning:** endpoints plus corridor and region queries for
  redesign and optimization

### Field service + dispatch

- **Nearest tech / parts truck:** assign work orders by proximity and skill
- **Storm response:** prioritize crews by distance to ticket clusters and
  critical zones

### Customer experience + ticketing

- **Hotspot detection:** tell complaint clusters from single-prem issues
- **SLA/KPI by geography:** compute performance by city, DMA or geofence, then
  route to the right ops teams

### Fixed Wireless Access (FWA) + 5G services

- **Service qualification:** eligibility by lat/lng plus the nearest serving
  cell or sector ("served-by" checks)
- **Zone-based policy:** QoS, slice or policy when devices enter and exit zones
  (stadium, airport, campus)

### Private 5G / enterprise IoT

- **Geofenced safety:** restricted polygons in factories, ports and mines
- **Asset utilization + theft prevention:** boundary exit anomalies and
  movement patterns

### Edge / MEC

- **Workload placement:** route to the nearest MEC site based on device
  location and service boundaries
- **In-venue experiences:** enforce "venue-only" services with geofencing
