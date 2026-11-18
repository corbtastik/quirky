---
title: "Relational MongoDB"
date: 2026-01-18
tags: ["mongodb", "relational", "rdbms", "sql", "postgres"]
description: "A walk down the relational lane with MongoDB"
subtitle: "MongoDB for people coming from relational databases."
---

I used to think of MongoDB as "that place you put JSON when you don't want to
design a schema." Then I watched enough production systems. Relationships
don't disappear just because your database isn't an RDBMS.

This post is a guided reality check. We'll use a telco-style dataset
("CarrierOps") and model it in Postgres and MongoDB. We'll cover the
relationship patterns you already know. 1:1. 1:N, in small, medium and large.
M:N. Hierarchies. Code tables. A few of the weird ones. MongoDB is
relational. It just lets you pick the shape that fits the workload, instead
of defaulting to "normalize everything and join forever."

Helpful background links:

- [Relational model](https://en.wikipedia.org/wiki/Relational_model)
- [MongoDB data modeling overview](https://www.mongodb.com/docs/manual/data-modeling/)
- Embedding vs referencing:
  - [1 to 1](https://www.mongodb.com/docs/manual/tutorial/model-embedded-one-to-one-relationships-between-documents/)
  - [1 to Many](https://www.mongodb.com/docs/manual/tutorial/model-referenced-one-to-many-relationships-between-documents/)
- [$lookup (joins in aggregation)](https://www.mongodb.com/docs/manual/reference/operator/aggregation/lookup/)
- [Aggregation framework](https://www.mongodb.com/docs/manual/aggregation/)
- [Transactions](https://www.mongodb.com/docs/manual/core/transactions/)

---

## CarrierOps domain (shared vocabulary)

We'll use these "real telco-ish" entities across every pattern:

- **accounts** (billing account / household)
- **subscribers** (a line)
- **devices**
- **orders**
- **tickets**
- **features** (entitlements / add-ons)
- **usage_records** (CDRs / high-volume events)
- **org_units** (ops ownership tree)
- **rates** (pricing matrix)

---

## 1) One-to-One (1:1) — Subscriber ↔ SubscriberProfile

- [One-to-One](https://en.wikipedia.org/wiki/One-to-one_%28data_model%29)

### Why it exists (in the real world)

Teams implement 1:1 splits to:

- isolate **sensitive fields** (PII) or "need-to-know" columns
- move **rarely used** / "wide" columns out of the hot path (keep core row small)
- make an "optional extension" without bloating every row

### Postgres (DDL)

{% code "Postgres DDL" %}
```sql
CREATE TABLE subscribers (
  subscriber_id BIGSERIAL PRIMARY KEY,
  account_id BIGINT NOT NULL,
  msisdn TEXT NOT NULL UNIQUE,           -- phone number
  status TEXT NOT NULL,                  -- active/suspended/etc
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE subscriber_profiles (
  subscriber_id BIGINT PRIMARY KEY REFERENCES subscribers(subscriber_id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  dob DATE,
  pii_last4_ssn TEXT,
  preferences JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Postgres query (fetch subscriber + profile)

{% code "Postgres query" %}
```sql
SELECT s.subscriber_id, s.msisdn, s.status,
       p.email, p.preferences
FROM subscribers s
LEFT JOIN subscriber_profiles p
  ON p.subscriber_id = s.subscriber_id
WHERE s.msisdn = '+12145551212';
```

### MongoDB equivalent (two common options)

#### Option A — **Embed** the profile (best when you almost always read it with subscriber)

**Collection:** `subscribers`

{% code "subscribers (profile embedded)" %}
```js
{
  _id: ObjectId("65a000000000000000000001"),
  accountId: 9001,
  msisdn: "+12145551212",
  status: "active",
  createdAt: ISODate("2026-01-10T18:00:00Z"),
  profile: {
    email: "alex@example.com",
    preferences: { marketingOptIn: false },
    pii: { last4Ssn: "1234" },
    updatedAt: ISODate("2026-01-12T18:00:00Z")
  }
}
```

**Query:**

{% code "Query" %}
```js
db.subscribers.findOne({ msisdn: "+12145551212" })
```

**Why this works:** 1 read, no join, fewer moving parts.

**When not to embed:** if you need **separate security controls** (PII
access), separate lifecycle, or large blobs.

#### Option B — **Reference** into a separate `subscriber_profiles` collection (more "RDBMS-like")

{% code "subscriber_profiles" %}
```js
// subscribers
{ _id: ObjectId("65a...001"), msisdn: "+12145551212", status: "active" }

// subscriber_profiles
{
  _id: ObjectId("65b...001"),
  subscriberId: ObjectId("65a...001"),
  email: "alex@example.com",
  preferences: { marketingOptIn: false }
}
```

**Query with $lookup:**

{% code "Query with $lookup" %}
```js
db.subscribers.aggregate([
  { $match: { msisdn: "+12145551212" } },
  {
    $lookup: {
      from: "subscriber_profiles",
      localField: "_id",
      foreignField: subscriberId,
      as: "profile"
    }
  },
  { $set: { profile: { $first: "$profile" } } }
])
```

**Key "show" point:** MongoDB can do **joins** (via `$lookup`). You choose
when you want them.

---

## 2) One-to-Many (1:N) — and why "small/medium/large N" changes everything

- [One-to-Many](https://en.wikipedia.org/wiki/One-to-many_%28data_model%29)

### Why it exists

Because the world is full of "parent + children":

- account → addresses
- order → order_items
- subscriber → usage_records

The *shape* of the relationship decides the model. Small N or huge N. It
drives whether you **embed** or **reference**. It drives how you **index**
and **partition**.

---

### 2a) 1:N (small N) — Order → OrderItems

#### Why implement it

A handful of child records. You almost always read them with the parent.

#### Postgres (DDL)

{% code "Postgres DDL" %}
```sql
CREATE TABLE orders (
  order_id BIGSERIAL PRIMARY KEY,
  account_id BIGINT NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE order_items (
  order_item_id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
  sku TEXT NOT NULL,
  qty INT NOT NULL,
  price_cents INT NOT NULL
);

CREATE INDEX order_items_order_id_idx ON order_items(order_id);
```

#### Postgres query (order with items)

{% code "Postgres query" %}
```sql
SELECT o.order_id, o.status, i.sku, i.qty, i.price_cents
FROM orders o
JOIN order_items i ON i.order_id = o.order_id
WHERE o.order_id = 771;
```

#### MongoDB equivalent (best practice: **embed items**)

{% code "orders (items embedded)" %}
```js
// orders
{
  _id: 771,
  accountId: 9001,
  status: "submitted",
  createdAt: ISODate("2026-01-10T18:00:00Z"),
  items: [
    { sku: "SIM-ESIM", qty: 1, priceCents: 0 },
    { sku: "PLAN-UNL-5G", qty: 1, priceCents: 6500 }
  ]
}
```

**Query:**

{% code "Query" %}
```js
db.orders.findOne({ _id: 771 })
```

**Why this is a win:** an order behaves like a natural **aggregate**, the DDD
"aggregate root" vibe. You want the whole thing together.

**When MongoDB doesn't fit here:** different services update items on their
own, *at massive scale*. You also need strict cross-row constraints all the
time. Then keep items separate. Use `$lookup`, or a relational DB.

---

### 2b) 1:N (medium N) — Device → DeviceEvents (hundreds/thousands)

#### Why implement it

Operational visibility and troubleshooting: "show me last 24h of events for
this device".

#### Postgres (DDL)

{% code "Postgres DDL" %}
```sql
CREATE TABLE devices (
  device_id BIGSERIAL PRIMARY KEY,
  subscriber_id BIGINT NOT NULL,
  imei TEXT UNIQUE NOT NULL,
  model TEXT NOT NULL
);

CREATE TABLE device_events (
  device_event_id BIGSERIAL PRIMARY KEY,
  device_id BIGINT NOT NULL REFERENCES devices(device_id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  ts TIMESTAMPTZ NOT NULL,
  payload JSONB
);

CREATE INDEX device_events_device_ts_idx ON device_events(device_id, ts DESC);
```

#### Postgres query (last 100 events)

{% code "Postgres query" %}
```sql
SELECT event_type, ts, payload
FROM device_events
WHERE device_id = 110
ORDER BY ts DESC
LIMIT 100;
```

#### MongoDB equivalent (usually **separate collection** + time-index)

{% code "device_events" %}
```js
// devices
{ _id: 110, subscriberId: 501, imei: "356789012345678", model: "Galaxy S24" }

// device_events
{
  _id: ObjectId("65c...001"),
  deviceId: 110,
  eventType: "radio_attach",
  ts: ISODate("2026-01-18T12:02:11Z"),
  payload: { cellId: "DFW-221", rssi: -87 }
}
```

**Index:**

{% code "Index" %}
```js
db.device_events.createIndex({ deviceId: 1, ts: -1 })
```

**Query:**

{% code "Query" %}
```js
db.device_events
  .find({ deviceId: 110 })
  .sort({ ts: -1 })
  .limit(100)
```

**Why not embed:** a device doc would grow unbounded and become a write
hotspot.

---

### 2c) 1:N (large N) — Subscriber → UsageRecords (CDRs / millions)

#### Why implement it

This is the "heavy consumer legacy app" reality. Huge append-only datasets.
You query them by **time windows** and secondary filters.

#### Postgres (DDL)

{% code "Postgres DDL" %}
```sql
CREATE TABLE usage_records (
  usage_id BIGSERIAL PRIMARY KEY,
  subscriber_id BIGINT NOT NULL,
  ts TIMESTAMPTZ NOT NULL,
  usage_type TEXT NOT NULL,     -- voice/sms/data
  units INT NOT NULL,           -- seconds/messages/KB
  rated_cents INT NOT NULL
);

CREATE INDEX usage_subscriber_ts_idx ON usage_records(subscriber_id, ts DESC);
```

#### Postgres query (windowed)

{% code "Postgres query" %}
```sql
SELECT ts, usage_type, units, rated_cents
FROM usage_records
WHERE subscriber_id = 501
  AND ts >= now() - interval '7 days'
ORDER BY ts DESC;
```

#### MongoDB equivalent (separate collection; **windowed queries**; consider partitioning/sharding if needed)

{% code "usage_records" %}
```js
// usage_records
{
  _id: ObjectId("65d...001"),
  subscriberId: 501,
  ts: ISODate("2026-01-18T11:58:00Z"),
  usageType: "data",
  unitsKb: 5120,
  ratedCents: 12
}
```

**Index:**

{% code "Index" %}
```js
db.usage_records.createIndex({ subscriberId: 1, ts: -1 })
```

**Query:**

{% code "Query" %}
```js
db.usage_records.find({
  subscriberId: 501,
  ts: { $gte: ISODate("2026-01-11T00:00:00Z") }
}).sort({ ts: -1 })
```

**Where MongoDB "doesn't fit":**

- Your main workload is **huge multi-table joins over massive fact tables**,
  *every time*. That's classic star-schema analytics. MongoDB can do it. A
  columnar warehouse, or an RDBMS tuned for it, may do it better.
- MongoDB wins when the operational read/write path is **entity-centric**
  (subscriber/order/ticket/device) and analytics lives somewhere else.

---

## 3) Many-to-Many (M:N) — Subscribers ↔ Features

- [Many-to-Many](https://en.wikipedia.org/wiki/Many-to-many_%28data_model%29)

### Why it exists

Entitlements: a subscriber can have many add-ons; an add-on belongs to many
subscribers.

### Postgres (DDL)

{% code "Postgres DDL" %}
```sql
CREATE TABLE features (
  feature_id BIGSERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL
);

CREATE TABLE subscriber_features (
  subscriber_id BIGINT NOT NULL REFERENCES subscribers(subscriber_id) ON DELETE CASCADE,
  feature_id BIGINT NOT NULL REFERENCES features(feature_id) ON DELETE CASCADE,
  PRIMARY KEY (subscriber_id, feature_id)
);
```

### Postgres query (features for a subscriber)

{% code "Postgres query" %}
```sql
SELECT f.code, f.name
FROM subscriber_features sf
JOIN features f ON f.feature_id = sf.feature_id
WHERE sf.subscriber_id = 501;
```

### MongoDB equivalents (two standard approaches)

#### Option A — embed "feature codes" in the subscriber (fastest reads)

{% code "subscribers (codes embedded)" %}
```js
// subscribers
{ _id: 501, msisdn: "+12145551212", featureCodes: ["HOTSPOT", "INTL_ROAM"] }
```

Query:

{% code "Query" %}
```js
db.subscribers.findOne({ _id: 501 }, { featureCodes: 1 })
```

#### Option B — separate join collection + $lookup (more relational)

{% code "subscriber_features" %}
```js
// subscriber_features
{ _id: ObjectId("65e...001"), subscriberId: 501, featureCode: "HOTSPOT" }
```

Query:

{% code "Query with $lookup" %}
```js
db.subscriber_features.find({ subscriberId: 501 })
```

**If you need feature metadata too:**

{% code "With feature metadata" %}
```js
db.subscriber_features.aggregate([
  { $match: { subscriberId: 501 } },
  {
    $lookup: {
      from: "features",
      localField: "featureCode",
      foreignField: "code",
      as: "feature"
    }
  },
  { $set: { feature: { $first: "$feature" } } }
])
```

---

## 4) Self-Referencing (Adjacency List) — OrgUnit hierarchy

- [Adjacency List](https://en.wikipedia.org/wiki/Adjacency_list)

### Why it exists

Hierarchies: escalation routing, ownership, product categories, org charts.

### Postgres (DDL)

{% code "Postgres DDL" %}
```sql
CREATE TABLE org_units (
  org_unit_id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  parent_org_unit_id BIGINT REFERENCES org_units(org_unit_id)
);

CREATE INDEX org_units_parent_idx ON org_units(parent_org_unit_id);
```

### Postgres query (get children of a node)

{% code "Postgres query" %}
```sql
SELECT org_unit_id, name
FROM org_units
WHERE parent_org_unit_id = 42;
```

### MongoDB equivalent (same adjacency model)

{% code "org_units" %}
```js
// org_units
{ _id: 42, name: "Network Ops", parentId: null }
{ _id: 43, name: "Field Ops", parentId: 42 }
```

Query children:

{% code "Query children" %}
```js
db.org_units.find({ parentId: 42 })
```

**Note:** Want the entire subtree? Store a materialized path or an ancestors
array. That's classic MongoDB tree modeling. MongoDB docs:
[https://www.mongodb.com/docs/manual/applications/data-models-tree-structures/](https://www.mongodb.com/docs/manual/applications/data-models-tree-structures/)

---

## 5) Lookup / Reference Tables — TicketStatus codes

- [Reference Tables](https://en.wikipedia.org/wiki/Lookup_table)

### Why it exists

Controlled vocabularies: enforce valid values; consistent reporting.

### Postgres (DDL)

{% code "Postgres DDL" %}
```sql
CREATE TABLE ticket_status_codes (
  code TEXT PRIMARY KEY,
  description TEXT NOT NULL
);

CREATE TABLE tickets (
  ticket_id BIGSERIAL PRIMARY KEY,
  subscriber_id BIGINT NOT NULL,
  status_code TEXT NOT NULL REFERENCES ticket_status_codes(code),
  opened_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Postgres query (tickets + status description)

{% code "Postgres query" %}
```sql
SELECT t.ticket_id, t.opened_at, s.description
FROM tickets t
JOIN ticket_status_codes s ON s.code = t.status_code
WHERE t.subscriber_id = 501;
```

### MongoDB equivalent

Store the **code** in the main doc. Keep the codes in a small collection, or
in app config.

{% code "tickets" %}
```js
// tickets
{ _id: 90001, subscriberId: 501, statusCode: "OPEN", openedAt: ISODate("2026-01-18T10:00:00Z") }

// ticket_status_codes
{ _id: "OPEN", description: "Open / Investigating" }
```

If you need to join, and often you don't:

{% code "Query with $lookup" %}
```js
db.tickets.aggregate([
  { $match: { subscriberId: 501 } },
  { $lookup: { from: "ticket_status_codes", localField: "statusCode", foreignField: "_id", as: "status" } },
  { $set: { status: { $first: "$status" } } }
])
```

---

## 6) Associative Entity (M:N with attributes) — SubscriberFeature lifecycle

- [Associative Entity](https://en.wikipedia.org/wiki/Associative_entity)

### Why it exists

Because the relationship itself has **meaningful data**: dates, state,
source, provisioning workflow, etc.

### Postgres (DDL)

{% code "Postgres DDL" %}
```sql
CREATE TABLE subscriber_feature_state (
  subscriber_id BIGINT NOT NULL REFERENCES subscribers(subscriber_id),
  feature_id BIGINT NOT NULL REFERENCES features(feature_id),
  effective_from TIMESTAMPTZ NOT NULL,
  effective_to TIMESTAMPTZ,
  provisioning_state TEXT NOT NULL,       -- pending/active/failed
  source TEXT NOT NULL,                   -- self-serve/call-center/system
  PRIMARY KEY (subscriber_id, feature_id, effective_from)
);
```

### Postgres query (active features now)

{% code "Postgres query" %}
```sql
SELECT f.code, sfs.provisioning_state, sfs.source
FROM subscriber_feature_state sfs
JOIN features f ON f.feature_id = sfs.feature_id
WHERE sfs.subscriber_id = 501
  AND sfs.effective_from <= now()
  AND (sfs.effective_to IS NULL OR sfs.effective_to > now());
```

### MongoDB equivalent (join collection is natural here)

{% code "subscriber_features" %}
```js
// subscriber_feature_state
{
  _id: ObjectId("65f...001"),
  subscriberId: 501,
  featureCode: "INTL_ROAM",
  effectiveFrom: ISODate("2026-01-01T00:00:00Z"),
  effectiveTo: null,
  provisioningState: "active",
  source: "call-center"
}
```

Query active:

{% code "Query active" %}
```js
db.subscriber_feature_state.find({
  subscriberId: 501,
  effectiveFrom: { $lte: new Date() },
  $or: [{ effectiveTo: null }, { effectiveTo: { $gt: new Date() } }]
})
```

---

## 7) Inheritance / Subtypes (table-per-subclass) — Service → WirelessService / BroadbandService

- [Class Table Inheritance](https://en.wikipedia.org/wiki/Class_table_inheritance)

### Why it exists

A shared "base type" plus subtype-specific fields.

### Postgres (DDL)

{% code "Postgres DDL" %}
```sql
CREATE TABLE services (
  service_id BIGSERIAL PRIMARY KEY,
  subscriber_id BIGINT NOT NULL,
  service_type TEXT NOT NULL,         -- wireless/broadband
  status TEXT NOT NULL
);

CREATE TABLE wireless_services (
  service_id BIGINT PRIMARY KEY REFERENCES services(service_id) ON DELETE CASCADE,
  sim_iccid TEXT NOT NULL,
  apn TEXT
);

CREATE TABLE broadband_services (
  service_id BIGINT PRIMARY KEY REFERENCES services(service_id) ON DELETE CASCADE,
  circuit_id TEXT NOT NULL,
  access_tech TEXT
);
```

### Postgres query (fetch a service with subtype fields)

{% code "Postgres query" %}
```sql
SELECT s.service_id, s.service_type, s.status,
       ws.sim_iccid, ws.apn,
       bs.circuit_id, bs.access_tech
FROM services s
LEFT JOIN wireless_services ws ON ws.service_id = s.service_id
LEFT JOIN broadband_services bs ON bs.service_id = s.service_id
WHERE s.subscriber_id = 501;
```

### MongoDB equivalent (most common: **single collection with discriminator**)

{% code "services (wireless)" %}
```js
// services
{
  _id: ObjectId("660...001"),
  subscriberId: 501,
  serviceType: "wireless",
  status: "active",
  sim: { iccid: "89014103211118510720" },
  apn: "carrierops"
}
```

Or broadband:

{% code "services (broadband)" %}
```js
{
  _id: ObjectId("660...002"),
  subscriberId: 501,
  serviceType: "broadband",
  status: "active",
  circuitId: "CIR-DFW-99881",
  accessTech: "fiber"
}
```

Query:

{% code "Query" %}
```js
db.services.find({ subscriberId: 501 })
```

**Why MongoDB often wins here:** schema evolution is easier when subtype
fields change over time.

---

## 8) Polymorphic Association — Notes attach to Order OR Ticket OR Subscriber

- [Polymorphism](https://en.wikipedia.org/wiki/Polymorphism_%28computer_science%29)

### Why it exists

"Comments, notes, audit entries" end up attached to many entity types.

### Postgres (how it's usually done, awkwardly)

One common pattern is: `(entity_type, entity_id)` + application-enforced
constraints.

{% code "Postgres DDL" %}
```sql
CREATE TABLE notes (
  note_id BIGSERIAL PRIMARY KEY,
  entity_type TEXT NOT NULL,        -- 'subscriber' | 'order' | 'ticket'
  entity_id BIGINT NOT NULL,
  author TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX notes_entity_idx ON notes(entity_type, entity_id, created_at DESC);
```

Query:

{% code "Postgres query" %}
```sql
SELECT author, body, created_at
FROM notes
WHERE entity_type = 'ticket' AND entity_id = 90001
ORDER BY created_at DESC;
```

### MongoDB equivalent (natural fit)

{% code "notes" %}
```js
// notes
{
  _id: ObjectId("661...001"),
  ref: { type: "ticket", id: 90001 },
  author: "opsAgent7",
  body: "Customer called; outage confirmed in region.",
  createdAt: ISODate("2026-01-18T12:00:00Z")
}
```

Index:

{% code "Index" %}
```js
db.notes.createIndex({ "ref.type": 1, "ref.id": 1, createdAt: -1 })
```

Query:

{% code "Query" %}
```js
db.notes.find({ ref: { type: "ticket", id: 90001 } }).sort({ createdAt: -1 })
```

---

## 9) Ternary relationship (3-way join) — Rate depends on Plan + Region + DeviceClass

- [Ternary Relationship](https://en.wikipedia.org/wiki/Ternary_relationship)

### Why it exists

Some relationships are 3D, or more. Pricing and eligibility matrices are the
classic case.

### Postgres (DDL)

{% code "Postgres DDL" %}
```sql
CREATE TABLE plans (
  plan_id BIGSERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL
);

CREATE TABLE regions (
  region_id BIGSERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL
);

CREATE TABLE device_classes (
  device_class_id BIGSERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL
);

CREATE TABLE rates (
  plan_id BIGINT NOT NULL REFERENCES plans(plan_id),
  region_id BIGINT NOT NULL REFERENCES regions(region_id),
  device_class_id BIGINT NOT NULL REFERENCES device_classes(device_class_id),
  rate_cents INT NOT NULL,
  PRIMARY KEY (plan_id, region_id, device_class_id)
);
```

Query:

{% code "Postgres query" %}
```sql
SELECT rate_cents
FROM rates
WHERE plan_id = 10 AND region_id = 3 AND device_class_id = 2;
```

### MongoDB equivalent (document-as-matrix row)

{% code "rates" %}
```js
// rates
{
  _id: ObjectId("662...001"),
  planCode: "UNL-5G",
  regionCode: "TX-NORTH",
  deviceClass: "PHONE",
  rateCents: 6500
}
```

Index:

{% code "Index" %}
```js
db.rates.createIndex({ planCode: 1, regionCode: 1, deviceClass: 1 }, { unique: true })
```

Query:

{% code "Query" %}
```js
db.rates.findOne({ planCode: "UNL-5G", regionCode: "TX-NORTH", deviceClass: "PHONE" })
```

---

## The Relational Punchline

Take one thing from this post: **MongoDB is relational.** It supports the
same relationship patterns you've used forever. And yes, it can *join*
(`$lookup`) when you need it. The real difference: you're **not forced into
"normalize everything and join everything"** as the default.

### MongoDB is a strong fit when...

- Your reads and writes **center on an entity**: subscriber, order, ticket,
  device. You want to fetch "the thing" in one trip.
- You'd rather keep the **hot path simple**: fewer joins, fewer round trips,
  fewer moving parts. Embed where it makes sense, reference where it doesn't.
- You're modernizing a legacy app and the schema will **evolve**, because it
  always does. You don't want every change to be a mini migration project.
- You still need real relational patterns: **M:N, lookups, hierarchies**. But
  you want to model them as documents, references, *or* `$lookup`. The query
  decides which.

### MongoDB is not the default choice when...

- The core workload is **"join five big tables all day long."** That's the
  primary operational query shape, especially over giant fact tables.
- Your system requires **hard relational constraints everywhere**. The
  database enforces them across lots of entities, not just the app.
- The real requirement is: **"we want a classic normalized OLTP RDBMS and
  we're not changing the query shapes."** That's fine. Just call it what it
  is.

Bottom line: MongoDB doesn't remove relationships. It gives you more ways to
express them. The win is choosing the model that matches how the app reads
and writes. Don't let the modeling rules choose for you.
