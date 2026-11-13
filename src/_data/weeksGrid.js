const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

/**
 * Life in weeks, precomputed.
 *
 * One box per week between settings.weeks.born and born + settings.weeks.years,
 * grouped into decades of age. Built here rather than in the template because
 * Nunjucks has no date arithmetic - working out which of ~4,700 weeks a given
 * event falls in, and where each decade starts, is not something to express in
 * template tags.
 *
 * Week 0 starts on the birth date itself and every week after it is seven days
 * later, so the boxes line up with birthdays rather than with Sundays. That is
 * what makes "0 in 1976" sit at the head of its row.
 */

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

const DECADE_LABELS = [
  "My first ten years",
  "My teens",
  "My twenties",
  "My thirties",
  "My forties",
  "My fifties",
  "My sixties",
  "My seventies",
  "My eighties",
  "My nineties"
];

function loadYaml(name) {
  const file = path.join(__dirname, name);
  return yaml.load(fs.readFileSync(file, "utf8"));
}

/** Parse a YYYY-MM-DD date as UTC midnight, however js-yaml handed it over. */
function asUtcDate(value) {
  if (value instanceof Date) {
    return new Date(Date.UTC(
      value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
  }
  const [y, m, d] = String(value).split("-").map(Number);
  return new Date(Date.UTC(y, (m || 1) - 1, d || 1));
}

function isoDate(date) {
  return date.toISOString().substring(0, 10);
}

function prettyDate(date) {
  return date.toLocaleDateString("en-US",
    { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
}

module.exports = function() {
  const settings = loadYaml("settings.yml");
  const events = loadYaml("life-in-weeks.yml") || [];

  const roles = loadYaml("careerRoles.yml") || [];
  const education = loadYaml("education.yml") || [];

  const born = asUtcDate(settings.weeks.born);
  const years = settings.weeks.years || 90;
  const today = new Date();

  const weekOf = date => Math.floor((date - born) / WEEK_MS);

  // Which week each birthday falls in. Not every 52nd box: a year is 52.18
  // weeks, so the birthday drifts forward through the grid and has to be
  // worked out per year rather than counted off.
  const birthdays = new Map();
  for (let year = 0; year <= years; year++) {
    const when = new Date(Date.UTC(
      born.getUTCFullYear() + year, born.getUTCMonth(), born.getUTCDate()));
    birthdays.set(weekOf(when), year);
  }

  const monthStart = value => {
    const [y, m] = String(value).split("-").map(Number);
    return new Date(Date.UTC(y, (m || 1) - 1, 1));
  };

  /**
   * Paint a list of {start, end} spans onto week indices.
   *
   * Returns the weeks each span covers and, separately, the week each one
   * begins in - that second map is what gets a label, so a six-year span is
   * one box of text and 300 of colour rather than 300 boxes of text.
   *
   * `present` runs to today. A missing end does too: the CV band draws an
   * unsettled end up to whatever starts next, but a grid of weeks has no
   * business implying a date the data does not have.
   */
  function spans(list) {
    const covers = new Map();
    const starts = new Map();
    list.forEach(item => {
      if (!item.start) return;
      const from = monthStart(item.start);
      const to = (!item.end || String(item.end).trim().toLowerCase() === "present")
        ? today
        : monthStart(item.end);

      const first = Math.max(0, weekOf(from));
      const last = weekOf(to);
      for (let i = first; i < last; i++) covers.set(i, item);
      if (first <= last) starts.set(first, item);
    });
    return { covers, starts };
  }

  // Employment, from the same careerRoles.yml the CV band reads, so the two
  // can never disagree about when a job ran.
  const work = spans(roles);
  const employed = work.covers;
  const roleStarts = work.starts;

  // Schooling, the same shape.
  const school = spans(education);
  const studying = school.covers;
  const schoolStarts = school.starts;

  // Which week each event lands in. A later event in the same week wins, which
  // only matters if two are entered seven days apart or less.
  const byWeek = new Map();
  events.forEach(event => {
    const when = asUtcDate(event.date);
    const index = Math.floor((when - born) / WEEK_MS);
    if (index < 0) return;
    byWeek.set(index, {
      headline: event.headline,
      description: event.description || "",
      date: isoDate(when),
      dateLabel: prettyDate(when)
    });
  });

  // Decade boundaries by anniversary, not by 3,652 days - otherwise leap years
  // drift the heading a few boxes away from the birthday it belongs to.
  const decadeStart = decade => new Date(Date.UTC(
    born.getUTCFullYear() + decade * 10, born.getUTCMonth(), born.getUTCDate()));

  const totalWeeks = Math.ceil(
    (decadeStart(years / 10) - born) / WEEK_MS);

  const decades = [];
  for (let decade = 0; decade * 10 < years; decade++) {
    const start = Math.floor((decadeStart(decade) - born) / WEEK_MS);
    const end = Math.min(
      Math.floor((decadeStart(decade + 1) - born) / WEEK_MS), totalWeeks);
    const age = decade * 10;

    const weeks = [];
    for (let i = start; i < end; i++) {
      const weekStart = new Date(born.getTime() + i * WEEK_MS);
      const event = byWeek.get(i);
      const job = employed.get(i);
      const starts = roleStarts.get(i);
      const study = studying.get(i);
      const schoolStart = schoolStarts.get(i);
      const birthday = birthdays.get(i);

      // A week can be several things at once. The label goes to whichever is
      // most specific: a life event first, then the start of a job, and
      // nothing for the thousands of weeks that are only employment.
      const headline = event ? event.headline
        : starts ? starts.employer
        : schoolStart ? schoolStart.label
        : "";
      const description = event ? event.description
        : starts ? `${starts.title} at ${starts.employer}`
        : schoolStart ? (schoolStart.detail || schoolStart.label)
        : "";

      // Class list and tooltip are assembled here rather than in the
      // template: a week is up to five things at once, and building that
      // string with {% set %} inside a 4,696-iteration Nunjucks loop is both
      // slower and subject to the loop's frame scoping.
      const classes = ["week"];
      if (event) classes.push("week-event");
      if (!event && starts) classes.push("week-job");
      if (!event && !starts && schoolStart) classes.push("week-school-start");
      if (job) classes.push("week-work");
      if (study) classes.push("week-school");
      if (birthday !== undefined) classes.push("week-birthday");
      if (weekStart > today) classes.push("week-future");

      const birthdayNote = birthday === undefined ? ""
        : birthday === 0 ? "Born" : `Turned ${birthday}`;
      const jobNote = job ? `${job.employer} \u2014 ${job.title}` : "";
      const schoolNote = study ? (study.detail ? `${study.label} \u2014 ${study.detail}` : study.label) : "";

      // The tooltip says everything about the week.
      const notes = [birthdayNote, schoolNote, jobNote].filter(Boolean);

      // The panel says everything the label has not already said. Without
      // this, week zero reads "Born ... Born" and the week a job started
      // reads "Software Developer at Corning - Corning - Software Developer".
      const detail = [description];
      if (birthdayNote && birthdayNote !== headline) detail.push(birthdayNote);
      if (schoolNote && !schoolStart) detail.push(schoolNote);
      if (jobNote && !starts) detail.push(jobNote);

      weeks.push({
        index: i,
        date: isoDate(weekStart),
        dateLabel: prettyDate(weekStart),
        classes: classes.join(" "),
        title: notes.length
          ? `${prettyDate(weekStart)} \u00b7 ${notes.join(" \u00b7 ")}`
          : prettyDate(weekStart),
        headline,
        description: detail.filter(Boolean).join(" \u00b7 "),
        future: weekStart > today
      });
    }

    decades.push({
      label: DECADE_LABELS[decade] || `Age ${age} to ${age + 9}`,
      ageLabel: `${age} in ${decadeStart(decade).getUTCFullYear()}`,
      weeks
    });
  }

  return {
    born: isoDate(born),
    bornLabel: prettyDate(born),
    totalWeeks,
    livedWeeks: Math.max(0, Math.floor((today - born) / WEEK_MS)),
    eventCount: byWeek.size,
    birthdayCount: [...birthdays.keys()].filter(i => i * WEEK_MS + born.getTime() <= today.getTime()).length,
    employedWeeks: employed.size,
    roleCount: roles.length,
    schoolWeeks: studying.size,
    schoolCount: education.length,
    decades
  };
};
