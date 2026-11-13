---
title: "Everything I know about on-call, in one talk"
date: 2024-09-12
description: "Notes from a conference talk about paging humans only when it helps."
tags: [operations, systems-thinking]
---

These are the notes from a talk I gave. The argument is one sentence long:
**a page is a claim that a human can do something about this right now**, and
most alerts cannot honestly make that claim.

## The test

Before adding an alert, answer three questions.

1. If this fires at 3am, what is the first thing the responder does?
2. If the answer is "look at a dashboard to decide whether it matters", it is
   not a page. It is a dashboard.
3. If the answer is "restart the thing", why is a human doing that?

Almost everything fails one of these. That is the point - the goal is fewer
alerts that are each worth waking up for, not coverage.

## Symptoms, not causes

Alert on what the user experiences: error rate, latency, work not getting
done. Do not alert on CPU, memory, queue depth or disk unless the number
*itself* is the outage.

Cause-based alerts multiply with your architecture. Symptom-based alerts do
not: there are only so many ways a service can be unwell from outside, however
many ways it has of getting there.

## The numbers that actually helped

- **Pages per on-call shift.** If it is above two, nobody is sleeping, and a
  tired responder is a worse responder.
- **Fraction of pages that led to an action.** Below about 50% and people stop
  reading pages carefully. This is the one that predicts a missed outage.
- **Time to first useful signal.** Not time to acknowledge - time until the
  responder knows where to look. This is a documentation metric wearing an
  operations costume.

## What I got wrong for years

I treated the runbook as a thing you write after the incident. It is the thing
that decides whether the alert should exist. If you cannot write the runbook,
you do not understand the failure well enough to page someone about it, and
the honest move is to leave it as a dashboard until you do.

The related note is [on learning to say no](/posts/learned-to-say-no/) - an
alert you accept is a commitment you have made on behalf of whoever is on call
next.
