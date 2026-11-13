const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

/**
 * The career band at the top of /cv/.
 *
 * Turns the roles in careerRoles.yml into blocks positioned along one shared
 * time axis, plus the year ticks under them. The arithmetic lives here rather
 * than in the template for the same reason the week grid's does: Nunjucks has
 * no date maths, and "how far along the axis does April 2022 sit" is not
 * something to express in template tags.
 *
 * Every block is placed as a percentage of the whole span, so the band is
 * resolution-independent - it fills whatever width the content column has.
 */

const MONTHS = 12;

function loadRoles() {
  const file = path.join(__dirname, "careerRoles.yml");
  return yaml.load(fs.readFileSync(file, "utf8")) || [];
}

/** The current month, in the same units as everything else. */
function nowMonths() {
  const now = new Date();
  return now.getFullYear() * MONTHS + now.getMonth();
}

/**
 * "YYYY-MM" to a count of months, so spans are integers and sort cleanly.
 *
 * Returns null for a missing value and PRESENT for the job you are in now.
 * The two are not the same thing: a missing end date is unknown, a present
 * one is ongoing, and the band draws and labels them differently.
 */
const PRESENT = Symbol("present");

function toMonths(value) {
  if (!value) return null;
  if (String(value).trim().toLowerCase() === "present") return PRESENT;
  const [y, m] = String(value).split("-").map(Number);
  return y * MONTHS + ((m || 1) - 1);
}

function label(months) {
  const y = Math.floor(months / MONTHS);
  const m = months % MONTHS;
  const names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                 "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${names[m]} ${y}`;
}

module.exports = function() {
  const roles = loadRoles()
    .map(role => ({ ...role, startM: toMonths(role.start), endM: toMonths(role.end) }))
    .filter(role => role.startM !== null)
    .sort((a, b) => a.startM - b.startM);

  if (!roles.length) return { roles: [], ticks: [], years: 0 };

  // An ongoing role runs to the current month, so the band grows by itself
  // and never needs editing just because time passed.
  roles.forEach(role => {
    if (role.endM === PRESENT) {
      role.endM = Math.max(nowMonths(), role.startM + 1);
      role.ongoing = true;
    }
  });

  // A role with no end date runs up to whatever started next. That is a
  // drawing decision, not a claim about the date - `uncertainEnd` carries the
  // caveat through to the markup so the block can say so.
  roles.forEach((role, i) => {
    if (role.endM === null) {
      const next = roles[i + 1];
      role.endM = next ? next.startM : role.startM + MONTHS;
      role.uncertainEnd = true;
    }
  });

  const first = roles[0].startM;
  const last = Math.max(...roles.map(r => r.endM));
  const span = last - first || 1;

  const placed = roles.map(role => {
    const months = role.endM - role.startM;
    const years = months / MONTHS;
    return {
      employer: role.employer,
      title: role.title,
      id: role.id,
      from: label(role.startM),
      to: role.ongoing ? "present"
        : role.uncertainEnd ? "date to confirm"
        : label(role.endM),
      uncertainEnd: !!role.uncertainEnd,
      ongoing: !!role.ongoing,
      months,
      // One decimal reads as a measurement; "3.1 years" is honest about a
      // 37-month stint in a way "3 years" is not.
      duration: role.ongoing && months < MONTHS ? "current role"
        : years >= 1 ? `${years.toFixed(1)} yrs`
        : `${months} mo`,
      left: ((role.startM - first) / span) * 100,
      width: (months / span) * 100,
      // Below about 8% of the span there is no room for a word, and a label
      // that renders as "C.." or "M." is worse than none - the caption and
      // the title attribute carry the name instead.
      showLabel: (months / span) * 100 >= 8
    };
  });

  // Year ticks every five years, inside the span only.
  const ticks = [];
  const firstYear = Math.ceil(first / MONTHS / 5) * 5;
  for (let year = firstYear; year * MONTHS <= last; year += 5) {
    ticks.push({ year, left: ((year * MONTHS - first) / span) * 100 });
  }

  return {
    roles: placed,
    ticks,
    startYear: Math.floor(first / MONTHS),
    endYear: Math.floor(last / MONTHS),
    years: Math.round(span / MONTHS)
  };
};
