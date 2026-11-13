---
title: "Your schema is a sentence about the future"
date: 2023-11-02
description: "Why the shape you pick on day one keeps deciding things years later."
tags: [data, systems-thinking]
---

Every schema is a prediction. When you write this:

```sql
CREATE TABLE account (
  id           BIGSERIAL PRIMARY KEY,
  email        TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL
);
```

you have not described how things are. You have claimed that an account has
exactly one email, forever, and that the email is how you tell accounts apart.

Both of those turn out to be opinions.

## The cost is never where you expect

The expensive part of being wrong is not the migration. Migrations are a
known, bounded, slightly tedious job. The expensive part is everything that
got built on top of the assumption while it was still true.

By the time the second email address is needed, `email` is a join key in four
services, a dedupe key in the data warehouse, the identifier in two external
systems, and the thing support staff type into a search box. The column is
easy to change. The *claim* is not, because the claim escaped the database
years ago.

## A test that has saved me

For each field, ask: **can this change, and if it changes, is it the same
thing afterwards?**

- `display_name` changes constantly, and it is the same account. Fine.
- `email` changes rarely, and it is the same account. So it is an attribute,
  not an identity - give it its own table before you need to.
- `id` never changes. That is what makes it the identity.

Anything where the answer is "it changes, and it is still the same thing"
should not be load-bearing. The failure mode is always the same: something
mutable gets used as a key because, on the day it was chosen, it had never
changed yet.

## Write the sentence down

The habit that actually stuck is smaller than any of this. For each table, I
write one line in a comment saying what it claims:

```sql
-- One row per account. An account is one person's relationship with us;
-- it outlives any email, name or login method attached to it.
```

That sentence is the thing being designed. The columns are a consequence. When
somebody later wants to add a column that contradicts it, the comment is right
there making the contradiction visible, which is cheaper than finding out in
a migration two years later.

The related note is [starting over, on purpose](/posts/starting-over-on-purpose/) -
the one condition under which the migration really is the right answer.
