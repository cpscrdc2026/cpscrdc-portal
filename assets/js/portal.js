"use strict";
/* Default portal data and state initialization */
const defaultState = {
  currentUser: null,
  auditLog: [],
  members: [
    { id: 1, name: "Tariq Ahmed", active: true },
    { id: 2, name: "Sadia Islam", active: true },
    { id: 3, name: "Tanvir Hossain", active: true },
    { id: 4, name: "Nusrat Jahan", active: true },
    { id: 5, name: "Farhan Labib", active: true },
  ],
  motions: [
    {
      id: 1,
      text: "This house would ban single use plastics nationwide.",
      category: "Environment",
      status: "Upcoming",
      info: "Governments face waste management crises alongside industrial cost barriers.",
    },
    {
      id: 2,
      text: "This house believes that AI automation creates more societal harm than benefit.",
      category: "Technology",
      status: "Debated",
      info: "Focuses on job displacement and economic restructuring.",
    },
    {
      id: 3,
      text: "This house would implement universal basic income.",
      category: "Economics",
      status: "Upcoming",
      info: "Examining welfare systems and inflation impacts.",
    },
  ],
  debates: [
    {
      id: 1,
      date: "2026-05-10",
      motionId: 2,
      result: "Gov Win",
      format: "Asian Parliamentary",
      season: "2026",
      govTeam: "Tariq Ahmed",
      oppTeam: "Sadia Islam",
      participants: [
        {
          memberId: 1,
          role: "Prime Minister",
          criteria: {
            definition: 17,
            scope: 17,
            position: 17,
            evidence: 17,
            delivery: 8,
            poi: 9,
          },
          score: 85,
        },
        {
          memberId: 2,
          role: "Leader of Opposition",
          criteria: {
            definition: 17,
            scope: 16,
            position: 16,
            evidence: 16,
            delivery: 8,
            poi: 9,
          },
          score: 82,
        },
      ],
    },
  ],
  adjustments: [], // Legacy backup field; retained but no longer used in scoring.
  sessions: [
    {
      id: 1,
      title: "AP Parliamentary Workshop",
      date: "2026-05-20",
      location: "Auditorium Room 204",
      notes: "Focus on rebuttal structures and point of information (POI) mastery.",
    },
    {
      id: 2,
      title: "Internal Sparring Tournament",
      date: "2026-05-27",
      location: "Main Hall",
      notes: "Preliminary rounds for the upcoming inter school championship.",
    },
  ],
  scripts: [
    {
      id: 1,
      motionId: 2,
      title: "Prime Minister Constructive Masterclass",
      author: "Tariq Ahmed",
      category: "Opening Case",
      role: "Prime Minister",
      body: "The Prime Minister should establish definitions, the debate framework, and substantive arguments clearly.",
    },
    {
      id: 2,
      motionId: 2,
      title: "Opposition Whip Strategy & Rebuttal Guide",
      author: "Sadia Islam",
      category: "Rebuttals",
      role: "Opposition Whip",
      body: "Rebuild the opposition case and weigh the central clashes clearly in the back half.",
    },
  ],
  achievements: [],
  homepageContent: {
    headline: "Cantonment Public School and College Rangpur Debating Club",
    shortDescription:
      "Fostering eloquence, critical thinking, and rigorous parliamentary debate. Explore motions, check member rankings, and access training resources.",
    introHeading: "About CPSCRDC",
    introText:
      "Fostering eloquence, critical thinking, and rigorous parliamentary debate. Explore motions, check member rankings, and access training resources.",
    closingLine: "",
  },
  users: {},
};
function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}
function loadState() {
  return clone(defaultState);
}
let appState = loadState();
let adminDashboardProfile = null;
let toastTimer = null;
function normalizeState() {
  if (!Array.isArray(appState.achievements)) appState.achievements = [];
  appState.debates.forEach((d) => {
    if (!d.format) d.format = "Asian Parliamentary";
    if (!d.season) d.season = String((d.date || new Date().toISOString()).slice(0, 4));
    (d.participants || []).forEach((p) => {
      const mapped = scoringRole(p.role);
      if (mapped && mapped !== p.role) p.role = mapped;
      if (p.criteria && mapped) {
        if (Array.isArray(p.judges) && p.judges.length) {
          p.score = round2(
            p.judges.reduce((a, j) => a + (Number(j.score) || 0), 0) / p.judges.length,
          );
        } else {
          p.score = round2(Object.values(p.criteria).reduce((a, v) => a + (Number(v) || 0), 0));
        }
      } else {
        if (!Number.isFinite(Number(p.score))) {
          p.score = roundScore(
            (Number(p.matter) || 0) + (Number(p.manner) || 0) + (Number(p.method) || 0),
          );
        }
      }
    });
  });
  appState.scripts.forEach((s) => {
    if (!s.role) s.role = "General / All Roles";
  });
}
/* Debate scoring and judging criteria */
function roundScore(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}
function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}
function fmt2(n) {
  return (Math.round((Number(n) || 0) * 100) / 100).toFixed(2);
}
const MAX_JUDGES = 9;
function clampJudges(n) {
  n = Math.floor(Number(n));
  return Number.isFinite(n) ? Math.min(MAX_JUDGES, Math.max(1, n)) : 1;
}
/* ===== CPSCR DC role-based scoring (Asian Parliamentary) ===== */
const SCORING_CONFIG = {
  "Prime Minister": {
    side: "Government",
    bn: "প্রধানমন্ত্রী",
    max: 100,
    criteria: [
      {
        key: "definition",
        label: "Definition & Contextual Analysis",
        bn: "সংজ্ঞা প্রদান ও বিশ্লেষণ",
        max: 20,
      },
      {
        key: "scope",
        label: "Framing Scope & Parameters",
        bn: "বিষয়বস্তু উপস্থাপন / ক্ষেত্র চিহ্নিতকরণ",
        max: 20,
      },
      {
        key: "position",
        label: "Explaining Team Position / Stand",
        bn: "স্বীয় অবস্থান ব্যাখ্যা",
        max: 20,
      },
      {
        key: "evidence",
        label: "Data, Facts & Evidence",
        bn: "তথ্য এবং তত্ত্ব",
        max: 20,
      },
      {
        key: "delivery",
        label: "Pronunciation & Delivery",
        bn: "উচ্চারণ এবং বাকরীতি",
        max: 10,
      },
      { key: "poi", label: "Handling POIs", bn: "আপত্তি মোকাবেলা", max: 10 },
    ],
  },
  "Cabinet Minister": {
    side: "Government",
    bn: "সংগঠন প্রধান / সরকারের দলীয় সদস্য",
    max: 100,
    criteria: [
      {
        key: "role",
        label: "Execution of Assigned Role",
        bn: "সংগঠন কর্তৃক প্রদান দায়িত্ব পালন",
        max: 30,
      },
      {
        key: "evidence",
        label: "Elaboration of Evidence, Data & Statistics",
        bn: "তত্ত্ব এবং তথ্যের সম্প্রসারণ, পরিসংখ্যান প্রদান",
        max: 20,
      },
      {
        key: "rebuttal",
        label: "Rebuttal of Previous Speaker",
        bn: "পূর্ববর্তী বক্তার যুক্তি খণ্ডন",
        max: 20,
      },
      {
        key: "position",
        label: "Maintaining & Advancing Team Position",
        bn: "সাময়িক অবস্থান প্রদান",
        max: 20,
      },
      {
        key: "delivery",
        label: "Pronunciation & Delivery",
        bn: "উচ্চারণ এবং বাকরীতি",
        max: 10,
      },
    ],
  },
  "Government Member": {
    side: "Government",
    bn: "সরকার দলীয় সাংসদ",
    max: 100,
    criteria: [
      {
        key: "role",
        label: "Execution of Assigned Role",
        bn: "দলনেতা কর্তৃক প্রদান দায়িত্ব পালন",
        max: 20,
      },
      {
        key: "evidence",
        label: "Elaboration of Evidence, Data & Statistics",
        bn: "তত্ত্ব এবং তথ্যের সম্প্রসারণ, পরিসংখ্যান প্রদান",
        max: 20,
      },
      {
        key: "rebuttal",
        label: "Rebuttal of Previous Speaker",
        bn: "পূর্ববর্তী বক্তার যুক্তি খণ্ডন",
        max: 20,
      },
      {
        key: "position",
        label: "Maintaining & Advancing Team Position",
        bn: "সাময়িক অবস্থান প্রদান",
        max: 20,
      },
      {
        key: "delivery",
        label: "Pronunciation & Delivery",
        bn: "উচ্চারণ এবং বাকরীতি",
        max: 10,
      },
      { key: "poi", label: "Handling POIs", bn: "আপত্তি মোকাবেলা", max: 10 },
    ],
  },
  "Leader of Opposition": {
    side: "Opposition",
    bn: "বিরোধী দলীয় নেতা",
    max: 100,
    criteria: [
      {
        key: "definition",
        label: "Challenging / Addressing Definition",
        bn: "সংজ্ঞার বিরোধিতা",
        max: 20,
      },
      {
        key: "scope",
        label: "Framing Scope & Parameters",
        bn: "বিষয়বস্তু উপস্থাপন / ক্ষেত্র চিহ্নিতকরণ",
        max: 20,
      },
      {
        key: "position",
        label: "Explaining Team Position / Stand",
        bn: "দলীয় অবস্থান ব্যাখ্যা",
        max: 20,
      },
      {
        key: "evidence",
        label: "Data, Facts & Evidence",
        bn: "তথ্য এবং তত্ত্ব",
        max: 20,
      },
      {
        key: "delivery",
        label: "Pronunciation & Delivery",
        bn: "উচ্চারণ এবং বাকরীতি",
        max: 10,
      },
      { key: "poi", label: "Handling POIs", bn: "আপত্তি মোকাবেলা", max: 10 },
    ],
  },
  "Deputy Leader of Opposition": {
    side: "Opposition",
    bn: "বিরোধী দলীয় উপনেতা",
    max: 100,
    criteria: [
      {
        key: "role",
        label: "Execution of Assigned Role",
        bn: "বিরোধী দলীয় নেতা কর্তৃক প্রদান দায়িত্ব পালন",
        max: 30,
      },
      {
        key: "evidence",
        label: "Elaboration of Evidence, Data & Statistics",
        bn: "তত্ত্ব এবং তথ্যের সম্প্রসারণ, পরিসংখ্যান",
        max: 20,
      },
      {
        key: "rebuttal",
        label: "Rebuttal of Previous Speaker",
        bn: "পূর্ববর্তী বক্তার যুক্তি খণ্ডন",
        max: 20,
      },
      {
        key: "delivery",
        label: "Pronunciation & Delivery",
        bn: "উচ্চারণ এবং বাকরীতি",
        max: 10,
      },
      { key: "poi", label: "Handling POIs", bn: "আপত্তি মোকাবেলা", max: 20 },
    ],
  },
  "Opposition Member": {
    side: "Opposition",
    bn: "বিরোধী দলীয় সাংসদ",
    max: 100,
    criteria: [
      {
        key: "role",
        label: "Execution of Assigned Role",
        bn: "বিরোধী দলীয় নেতা কর্তৃক প্রদান দায়িত্ব পালন",
        max: 20,
      },
      {
        key: "evidence",
        label: "Elaboration of Evidence, Data, Stats & Analysis",
        bn: "তত্ত্ব এবং তথ্যের সম্প্রসারণ, পরিসংখ্যান এবং বিশ্লেষণ",
        max: 20,
      },
      {
        key: "rebuttal",
        label: "Rebuttal of Previous Speaker",
        bn: "পূর্ববর্তী বক্তার যুক্তি খণ্ডন",
        max: 20,
      },
      {
        key: "style",
        label: "Delivery Style & Expression",
        bn: "গায়কী উপস্থাপন",
        max: 20,
      },
      {
        key: "delivery",
        label: "Pronunciation & Delivery",
        bn: "উচ্চারণ এবং বাকরীতি",
        max: 10,
      },
      { key: "poi", label: "Handling POIs", bn: "আপত্তি মোকাবেলা", max: 10 },
    ],
  },
  "Government Reply": {
    side: "Government",
    bn: "সরকারি যুক্তি খণ্ডন",
    max: 50,
    criteria: [
      {
        key: "rebuttal",
        label: "Rebuttal Arguments",
        bn: "যুক্তি খণ্ডন",
        max: 20,
      },
      {
        key: "summary",
        label: "Strategic Summary / Analysis",
        bn: "সাময়িক বিশ্লেষণ উপস্থাপন",
        max: 20,
      },
      {
        key: "cohesion",
        label: "Team Consistency & Cohesion",
        bn: "দলীয় সমঝোতা",
        max: 10,
      },
    ],
  },
  "Opposition Reply": {
    side: "Opposition",
    bn: "বিরোধী যুক্তি খণ্ডন",
    max: 50,
    criteria: [
      {
        key: "rebuttal",
        label: "Rebuttal Arguments",
        bn: "যুক্তি খণ্ডন",
        max: 20,
      },
      {
        key: "summary",
        label: "Strategic Summary / Analysis",
        bn: "সাময়িক বিশ্লেষণ উপস্থাপন",
        max: 20,
      },
      {
        key: "cohesion",
        label: "Team Consistency & Cohesion",
        bn: "দলীয় সমঝোতা",
        max: 10,
      },
    ],
  },
};
const SCORING_ROLES = Object.keys(SCORING_CONFIG);
const LEGACY_ROLE_MAP = {
  "Deputy Prime Minister": "Cabinet Minister",
  "Government Whip": "Government Member",
  "Member of Government": "Government Member",
  "Opposition Deputy Leader": "Deputy Leader of Opposition",
  "Opposition Whip": "Opposition Member",
  "Member of Opposition": "Opposition Member",
};
function scoringRole(role) {
  const r = String(role || "");
  if (SCORING_CONFIG[r]) return r;
  return LEGACY_ROLE_MAP[r] || null;
}
normalizeState();
function roleMax(role) {
  const k = scoringRole(role);
  return k ? SCORING_CONFIG[k].max : 100;
}
function participantMax(p) {
  return p && p.criteria && scoringRole(p.role) ? roleMax(p.role) : 100;
}
function participantPercent(p) {
  const mx = participantMax(p);
  return mx ? ((Number(p.score) || 0) / mx) * 100 : 0;
}
function roleOptionsHtml(selected) {
  return SCORING_ROLES.map(
    (r) =>
      `<option value="${r}" ${r === selected ? "selected" : ""}>${r} (${SCORING_CONFIG[r].bn}) · ${SCORING_CONFIG[r].max}</option>`,
  ).join("");
}
function criteriaInputsHtml(role, values = {}) {
  const cfg = SCORING_CONFIG[scoringRole(role)];
  if (!cfg) return "";
  return cfg.criteria
    .map((c) => {
      const v = values ? values[c.key] : undefined;
      return `<div class="field criterion"><label>${c.label} <small>(${c.bn})</small> · 0 to ${c.max}</label><input class="input crit-input" data-key="${c.key}" data-max="${c.max}" type="number" min="0" max="${c.max}" step="0.1" placeholder="0 to ${c.max}" value="${v === undefined || v === null ? "" : v}" required oninput="updateCriteriaTotal(this)"></div>`;
    })
    .join("");
}
function judgeCardHtml(key, idx, values) {
  const cfg = SCORING_CONFIG[key];
  let t = 0;
  Object.values(values || {}).forEach((v) => (t += Number(v) || 0));
  return `<div class="judge-card" data-judge="${idx}"><div class="judge-head"><b>Judge ${idx + 1}</b><span class="judge-total">Total <span class="crit-total">${fmt2(t)}</span>/${cfg.max}</span></div><div class="criteria-grid">${criteriaInputsHtml(key, values || {})}</div></div>`;
}
function criteriaBoxHtml(role, judgeValues, n) {
  const key = scoringRole(role) || SCORING_ROLES[0],
    cfg = SCORING_CONFIG[key];
  n = clampJudges(n);
  const arr = Array.isArray(judgeValues) ? judgeValues : [];
  let cards = "",
    sum = 0;
  for (let i = 0; i < n; i++) {
    const v = arr[i] || {};
    let t = 0;
    Object.values(v).forEach((x) => (t += Number(x) || 0));
    sum += t;
    cards += judgeCardHtml(key, i, v);
  }
  return `<div class="criteria-box" data-role="${key}" data-judges="${n}"><div class="judge-cards">${cards}</div><div class="score-total avg-total" aria-live="polite">${n > 1 ? "Average of " + n + " judges" : "Score"}: <span class="avg-val">${fmt2(sum / n)}</span>/${cfg.max}</div></div>`;
}
function readCriteria(container, role) {
  const key = scoringRole(role),
    cfg = key ? SCORING_CONFIG[key] : null;
  if (!cfg) return { error: "Choose a valid debate role." };
  const cards = [...container.querySelectorAll(".judge-card")];
  if (!cards.length) return { error: "No judge scorecards found." };
  const judges = [];
  for (let j = 0; j < cards.length; j++) {
    const criteria = {};
    let total = 0;
    for (const c of cfg.criteria) {
      const el = cards[j].querySelector(`.crit-input[data-key="${c.key}"]`);
      const raw = el ? el.value : "";
      const n = Number(raw);
      if (raw === "" || !Number.isFinite(n) || n < 0 || n > c.max)
        return {
          error: `Judge ${j + 1}: ${c.label} must be between 0 and ${c.max} for ${key}.`,
        };
      criteria[c.key] = n;
      total += n;
    }
    judges.push({ criteria, score: round2(total) });
  }
  const N = judges.length,
    avg = {};
  cfg.criteria.forEach((c) => {
    avg[c.key] = round2(judges.reduce((a, x) => a + x.criteria[c.key], 0) / N);
  });
  const score = round2(judges.reduce((a, x) => a + x.score, 0) / N);
  return { criteria: avg, score, max: cfg.max, judges };
}
function updateCriteriaTotal(input) {
  const box = input.closest(".criteria-box");
  if (!box) return;
  const cards = [...box.querySelectorAll(".judge-card")];
  let sum = 0;
  cards.forEach((card) => {
    let t = 0;
    card.querySelectorAll(".crit-input").forEach((i) => (t += Number(i.value) || 0));
    sum += t;
    const out = card.querySelector(".crit-total");
    if (out) out.textContent = fmt2(t);
  });
  const avg = box.querySelector(".avg-val");
  if (avg) avg.textContent = fmt2(cards.length ? sum / cards.length : 0);
}
function collectJudgeValues(box) {
  const arr = [];
  box.querySelectorAll(".judge-card").forEach((card, i) => {
    const v = {};
    card.querySelectorAll(".crit-input").forEach((x) => {
      if (x.value !== "") v[x.dataset.key] = x.value;
    });
    arr[i] = v;
  });
  return arr;
}
function swapCriteria(selectEl, boxHostSelector) {
  const host = selectEl.closest(boxHostSelector);
  const old = host.querySelector(".criteria-box");
  const n = old ? Number(old.dataset.judges) || 1 : 1;
  const cfg = SCORING_CONFIG[selectEl.value];
  const keepArr = [];
  if (old)
    collectJudgeValues(old).forEach((vals, i) => {
      const keep = {};
      if (cfg)
        cfg.criteria.forEach((c) => {
          if (vals[c.key] !== undefined && Number(vals[c.key]) <= c.max) keep[c.key] = vals[c.key];
        });
      keepArr[i] = keep;
    });
  const tmp = document.createElement("div");
  tmp.innerHTML = criteriaBoxHtml(selectEl.value, keepArr, n);
  if (old) old.replaceWith(tmp.firstElementChild);
  else host.appendChild(tmp.firstElementChild);
}
function rebuildJudgeBoxes(listSelector, inputId) {
  const inp = document.getElementById(inputId);
  if (!inp) return;
  const n = clampJudges(inp.value);
  const boxes = [...document.querySelectorAll(listSelector + " .criteria-box")];
  const cur = boxes.length ? Number(boxes[0].dataset.judges) || 1 : n;
  if (n < cur) {
    const lose = boxes.some((box) =>
      collectJudgeValues(box)
        .slice(n)
        .some((v) => Object.keys(v).length),
    );
    if (
      lose &&
      !confirm(
        "Reducing the number of judges will remove the scores already typed for Judge " +
          (n + 1) +
          (cur > n + 1 ? " onward" : "") +
          ". Continue?",
      )
    ) {
      inp.value = cur;
      return;
    }
  }
  inp.value = n;
  boxes.forEach((old) => {
    const tmp = document.createElement("div");
    tmp.innerHTML = criteriaBoxHtml(old.dataset.role, collectJudgeValues(old), n);
    old.replaceWith(tmp.firstElementChild);
  });
}
function legacyPrefill(p) {
  // Convert an old Matter/Manner/Method scorecard into the new criteria proportionally (total preserved)
  if (p && p.criteria) return p.criteria;
  const key = scoringRole(p && p.role);
  if (!key || !p || !Number.isFinite(Number(p.score))) return {};
  const cfg = SCORING_CONFIG[key],
    ratio = (Number(p.score) || 0) / 100,
    out = {};
  cfg.criteria.forEach((c) => (out[c.key] = round2(c.max * ratio)));
  return out;
}
function participantJudges(p) {
  if (p && Array.isArray(p.judges) && p.judges.length)
    return p.judges.map((j) => (j && j.criteria ? j.criteria : {}));
  const c = legacyPrefill(p || {});
  return Object.keys(c).length ? [c] : [];
}
function debateJudgeCount(d) {
  const fromParts = Math.max(
    0,
    ...(Array.isArray(d.participants) ? d.participants : []).map((p) =>
      Array.isArray(p.judges) ? p.judges.length : 0,
    ),
  );
  return clampJudges(d.judgeCount || fromParts || 1);
}
function criteriaSummary(p) {
  const key = scoringRole(p.role);
  if (!p.criteria || !key)
    return `<span class="card-meta">Legacy score (Matter ${Number(p.matter) || 0} · Manner ${Number(p.manner) || 0} · Method ${Number(p.method) || 0})</span>`;
  const multi = Array.isArray(p.judges) && p.judges.length > 1;
  const f = multi ? fmt2 : (v) => String(Number(v) || 0);
  let html = SCORING_CONFIG[key].criteria
    .map((c) => `${c.label}: <b>${f(p.criteria[c.key])}</b>/${c.max}`)
    .join(" · ");
  if (multi)
    html += `<div class="judge-list">Average of ${p.judges.length} judges  ·  ${p.judges.map((j, i) => `J${i + 1}: <b>${fmt2(j.score)}</b>`).join(" · ")}</div>`;
  return html;
}
function scorecardTableHtml(parts, emptyMsg) {
  const rowsHtml = parts.length
    ? parts
        .map((p) => {
          const m = appState.members.find((x) => Number(x.id) === Number(p.memberId));
          return `<tr><td>${esc(m ? m.name : "Removed member")}</td><td>${esc(p.role || "Not recorded")}</td><td class="criteria-cell">${criteriaSummary(p)}</td><td><b>${fmt2(p.score)}/${participantMax(p)}</b></td></tr>`;
        })
        .join("")
    : `<tr><td colspan="4">${emptyMsg}</td></tr>`;
  const side = (s) =>
    parts
      .filter((p) => {
        const k = scoringRole(p.role);
        return k && SCORING_CONFIG[k].side === s;
      })
      .reduce((a, p) => a + (Number(p.score) || 0), 0);
  const hasAny = parts.some((p) => scoringRole(p.role));
  const teams = hasAny
    ? `<tr><td colspan="3"><b>Government team total</b></td><td><b>${fmt2(side("Government"))}/350</b></td></tr><tr><td colspan="3"><b>Opposition team total</b></td><td><b>${fmt2(side("Opposition"))}/350</b></td></tr>`
    : "";
  const jn = Math.max(1, ...parts.map((p) => (Array.isArray(p.judges) ? p.judges.length : 1)));
  const jnote =
    jn > 1 ? `<p class="judge-note">Scores shown are the average of ${jn} judges.</p>` : "";
  return `${jnote}<div class="table-wrap"><table><thead><tr><th>Debater</th><th>Role</th><th>Criteria scores</th><th>Total</th></tr></thead><tbody>${rowsHtml}${teams}</tbody></table></div>`;
}

function audit(action, details) {
  if (!Array.isArray(appState.auditLog)) appState.auditLog = [];
  appState.auditLog.unshift({
    id: Date.now() + Math.random(),
    action,
    details: String(details || ""),
    user: appState.currentUser ? appState.currentUser.displayName : "System / Public",
    at: new Date().toISOString(),
  });
  appState.auditLog = appState.auditLog.slice(0, 300);
}
appState.scripts.forEach((s) => {
  if (!s.role) s.role = "General / All Roles";
});
/* Supabase configuration, authentication, and synchronization */
const SUPABASE_URL = "https://syxywkaccrpwaprxddha.supabase.co";
const SUPABASE_KEY = "sb_publishable_D0aTK-zXMl-Dr1eVcNMbSQ_A6Zsl706";
let sb = null,
  sbError = "";
try {
  if (typeof supabase === "undefined")
    throw new Error("Supabase library could not load (check internet connection).");
  if (!/^https:\/\/.+\.supabase\.co/.test(SUPABASE_URL) || SUPABASE_KEY.startsWith("YOUR_"))
    throw new Error("Setup incomplete: put your Supabase URL and key in index.html.");
  sb = supabase.createClient(new URL(SUPABASE_URL.trim()).origin, SUPABASE_KEY.trim());
  sb.auth.onAuthStateChange((ev) => {
    if (ev === "PASSWORD_RECOVERY") recoverPassword();
  });
} catch (e) {
  sbError = e.message;
  console.error(e);
}
let saveTimer = null,
  remoteLoaded = false;
function saveState() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(pushState, 400);
  return true;
}
async function pushState() {
  if (!isEditor() || !remoteLoaded || !sb) {
    notify("Save unavailable: editor session or server connection is not ready.");
    return false;
  }
  const s = appState;
  const { error } = await sb.from("portal_state").upsert([
    {
      key: "public",
      data: {
        members: s.members,
        motions: s.motions,
        debates: s.debates,
        adjustments: s.adjustments,
        sessions: s.sessions,
        achievements: s.achievements,
        homepageContent: s.homepageContent,
      },
    },
    { key: "scripts", data: s.scripts },
    { key: "audit", data: s.auditLog },
  ]);
  if (error) {
    notify("Save failed: " + error.message);
    console.error("Portal state save failed", error);
    return false;
  }
  return true;
}
async function loadRemote() {
  const { data, error } = await sb.from("portal_state").select("key,data");
  if (error) {
    notify("Could not load data. Please refresh.");
    return;
  }
  remoteLoaded = true;
  for (const r of data || []) {
    if (r.key === "public" && r.data && typeof r.data === "object") Object.assign(appState, r.data);
    if (r.key === "scripts" && Array.isArray(r.data)) appState.scripts = r.data;
    if (r.key === "audit" && Array.isArray(r.data)) appState.auditLog = r.data;
  }
  [
    "members",
    "motions",
    "debates",
    "adjustments",
    "sessions",
    "scripts",
    "auditLog",
    "achievements",
  ].forEach((k) => {
    if (!Array.isArray(appState[k])) appState[k] = [];
  });
  normalizeState();
}
async function loadSession() {
  const {
    data: { session },
  } = await sb.auth.getSession();
  if (!session) {
    appState.currentUser = null;
    return;
  }
  const { data: p } = await sb.from("profiles").select("*").eq("id", session.user.id).single();
  appState.currentUser = p
    ? {
        id: p.id,
        email: p.email || session.user.email,
        username: p.username || p.email || session.user.email,
        role: p.role,
        displayName: p.display_name,
        memberId: p.member_id,
      }
    : null;
}
function esc(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch],
  );
}
function fmtDate(date) {
  if (!date) return "Date not set";
  const d = new Date(date + "T00:00:00");
  return Number.isNaN(d.getTime())
    ? esc(date)
    : d.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
}
function notify(message) {
  const el = document.getElementById("toast");
  el.textContent = message;
  el.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add("hidden"), 3200);
}
function toggleNav() {
  document.getElementById("nav-main").classList.toggle("open");
}
function isEditor() {
  return !!appState.currentUser && appState.currentUser.role === "editor";
}
function hasMemberAccess() {
  return (
    !!appState.currentUser &&
    (appState.currentUser.role === "member" || appState.currentUser.role === "editor")
  );
}
function showPage(pageId, updateUrl = true) {
  const allowed = [
    "home",
    "leaderboard",
    "motions",
    "results",
    "calendar",
    "achievements",
    "scripts",
    "admin",
    "member",
  ];
  if (!allowed.includes(pageId)) pageId = "home";
  if (pageId !== "member") adminDashboardProfile = null;
  if ((pageId === "scripts" || pageId === "member") && !hasMemberAccess()) {
    if (appState.currentUser) {
      notify("Your membership request is awaiting admin approval.");
    } else {
      notify("This section is for members. Public pages remain open to everyone.");
    }
    pageId = "home";
  }
  if (pageId === "admin" && !isEditor()) {
    if (appState.currentUser) {
      notify("Admin access is required.");
    }
    pageId = "home";
  }
  document
    .querySelectorAll(".page")
    .forEach((el) => el.classList.toggle("active", el.id === "page-" + pageId));
  document
    .querySelectorAll(".nav-btn")
    .forEach((el) => el.classList.toggle("active", el.dataset.page === pageId));
  const nav = document.getElementById("nav-main");
  if (nav) nav.classList.remove("open");
  updateNavbarAuth();
  renderCurrentPage(pageId);
  if (updateUrl && location.hash !== "#" + pageId) {
    history.pushState({ page: pageId }, "", "#" + pageId);
  }
  window.scrollTo({ top: 0, behavior: "auto" });
}
function switchPage(pageId) {
  showPage(pageId, true);
}
function renderCurrentPage(page) {
  const map = {
    home: renderHome,
    leaderboard: renderLeaderboard,
    motions: renderMotions,
    results: renderResults,
    calendar: renderCalendar,
    achievements: renderAchievements,
    scripts: renderScripts,
    admin: renderAdmin,
    member: renderMemberDashboard,
  };
  if (map[page]) map[page]();
}
window.addEventListener("hashchange", () => showPage(location.hash.slice(1) || "home", false));
window.addEventListener("popstate", () => showPage(location.hash.slice(1) || "home", false));
function showAuthTab(tab) {
  document.getElementById("auth-login").classList.toggle("hidden", tab !== "login");
  document.getElementById("auth-signup").classList.toggle("hidden", tab !== "signup");
  setTimeout(
    () => document.getElementById(tab === "login" ? "login-email" : "signup-name").focus(),
    50,
  );
}
function openLoginModal(tab) {
  document.getElementById("login-modal").classList.add("open");
  showAuthTab(tab === "signup" ? "signup" : "login");
}
function closeLoginModal() {
  document.getElementById("login-modal").classList.remove("open");
}
async function afterSignIn(isNew) {
  await loadSession();
  if (!appState.currentUser) {
    await sb.auth.signOut();
    notify("Your account has no profile yet. Please contact a club admin.");
    return false;
  }
  await loadRemote();
  audit(
    isNew ? "New account created" : "Signed in",
    `${appState.currentUser.email} (${appState.currentUser.role})`,
  );
  closeLoginModal();
  updateNavbarAuth();
  switchPage("home");
  if (isEditor()) refreshPeople();
  return true;
}
async function handleLogin(event) {
  event.preventDefault();
  if (!sb) {
    notify(sbError || "Not connected to the server.");
    return;
  }
  const email = document.getElementById("login-email").value.trim().toLowerCase();
  const password = document.getElementById("login-password").value;
  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) {
    notify(
      /confirm/i.test(error.message)
        ? "Please confirm your email first, then sign in."
        : "Invalid email or password.",
    );
    return;
  }
  document.getElementById("login-password").value = "";
  if (await afterSignIn(false)) notify("Welcome back, " + appState.currentUser.displayName + "!");
}
async function handleSignup(event) {
  event.preventDefault();
  if (!sb) {
    notify(sbError || "Not connected to the server.");
    return;
  }
  const name = document.getElementById("signup-name").value.trim();
  const email = document.getElementById("signup-email").value.trim().toLowerCase();
  const password = document.getElementById("signup-password").value;
  if (!name || password.length < 6) {
    notify("Enter your name and a password of at least 6 characters.");
    return;
  }
  const { data, error } = await sb.auth.signUp({
    email,
    password,
    options: { data: { display_name: name } },
  });
  if (error) {
    notify(error.message);
    return;
  }
  if (!data.session) {
    closeLoginModal();
    notify("Check your email to confirm your account, then sign in.");
    return;
  }
  document.getElementById("signup-password").value = "";
  if (await afterSignIn(true))
    notify("Request sent. A club admin will review it before you can access member features.");
}
async function forgotPassword() {
  if (!sb) {
    notify(sbError || "Not connected to the server.");
    return;
  }
  const email = document.getElementById("login-email").value.trim().toLowerCase();
  if (!email) {
    notify("Type your email above first, then click Forgot password.");
    return;
  }
  const { error } = await sb.auth.resetPasswordForEmail(email, {
    redirectTo: location.origin + location.pathname,
  });
  notify(error ? error.message : "If that email has an account, a reset link has been sent.");
}
function recoverPassword() {
  setTimeout(async () => {
    const pw = prompt("Enter your new password (at least 6 characters):");
    if (!pw || pw.length < 6) {
      notify("Password not changed.");
      return;
    }
    const { error } = await sb.auth.updateUser({ password: pw });
    if (error) {
      notify(error.message);
      return;
    }
    await loadSession();
    await loadRemote();
    updateNavbarAuth();
    switchPage("home");
    notify("Password updated. You are signed in.");
  }, 300);
}
async function logout() {
  audit("Signed out", appState.currentUser?.username || "user");
  if (isEditor()) {
    clearTimeout(saveTimer);
    await pushState();
  }
  await sb.auth.signOut();
  appState.currentUser = null;
  appState.scripts = [];
  appState.auditLog = [];
  people = [];
  await loadRemote();
  updateNavbarAuth();
  switchPage("home");
  notify("Logged out successfully.");
}
function updateNavbarAuth() {
  const area = document.getElementById("auth-area");
  const scripts = document.getElementById("nav-scripts");
  const member = document.getElementById("nav-member");
  const admin = document.getElementById("nav-admin");
  scripts.classList.toggle("hidden", !hasMemberAccess());
  member.classList.toggle("hidden", !hasMemberAccess());
  admin.classList.toggle("hidden", !isEditor());
  const u = appState.currentUser,
    banner = document.getElementById("auth-banner");
  const tog = `<button class="btn secondary theme-toggle" onclick="toggleDarkMode()" title="Toggle dark mode" aria-label="Toggle dark mode">${document.body.classList.contains("dark") ? "☀" : "☾"}</button>`;
  if (u) {
    const label =
      u.role === "editor"
        ? "admin"
        : u.role === "pending"
          ? "pending approval"
          : u.role === "rejected"
            ? "no access"
            : u.role;
    area.innerHTML =
      tog +
      `<div class="user-chip"><strong>${esc(u.displayName)}</strong><span>${esc(label)}</span></div><button class="btn secondary" onclick="logout()" title="Log out">↪ Logout</button>`;
  } else
    area.innerHTML =
      tog + '<button class="btn" onclick="openLoginModal()">↪ Sign In / Join</button>';
  if (banner) {
    if (u && u.role === "pending") {
      banner.innerHTML =
        "<b>Request received.</b> A club admin needs to approve your account before you can see member features. Check back later.";
      banner.classList.remove("hidden");
    } else if (u && u.role === "rejected") {
      banner.innerHTML =
        "<b>No member access.</b> Your request was declined or your access was removed. Please contact a club admin.";
      banner.classList.remove("hidden");
    } else banner.classList.add("hidden");
  }
}
/* Public page rendering */
function calculateLeaderboardStats(season = "all") {
  return appState.members.map((m) => {
    const relevantDebates = appState.debates.filter(
      (d) =>
        season === "all" || String(d.season || String(d.date || "").slice(0, 4)) === String(season),
    );
    const scores = [],
      pcts = [];
    relevantDebates.forEach((d) =>
      (Array.isArray(d.participants) ? d.participants : []).forEach((p) => {
        if (Number(p.memberId) === Number(m.id) && Number.isFinite(Number(p.score))) {
          scores.push(Number(p.score));
          pcts.push(participantPercent(p));
        }
      }),
    );
    const totalScore = scores.reduce((sum, n) => sum + n, 0);
    const pctTotal = pcts.reduce((sum, n) => sum + n, 0);
    const adjustments = appState.adjustments
      .filter((a) => Number(a.memberId) === Number(m.id))
      .reduce((sum, a) => sum + (Number(a.points) || 0), 0);
    return {
      id: m.id,
      name: m.name,
      active: m.active !== false,
      excludedFromLeaderboard: m.excludedFromLeaderboard === true,
      debatesPlayed: scores.length,
      average: pcts.length ? Math.round((pctTotal / pcts.length) * 100) / 100 : null,
      scorePoints: Math.round(totalScore * 100) / 100,
      totalPoints: Math.round((totalScore + adjustments) * 100) / 100,
    };
  });
}
function emptyRow(cols, message) {
  return `<tr><td colspan="${cols}" class="muted" style="text-align:center;padding:22px">${esc(message)}</td></tr>`;
}
function localISODate(date) {
  const y = date.getFullYear(),
    m = String(date.getMonth() + 1).padStart(2, "0"),
    d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
function localDateFromISO(value) {
  const parts = String(value || "")
    .split("-")
    .map(Number);
  return parts.length === 3 && parts.every(Number.isFinite)
    ? new Date(parts[0], parts[1] - 1, parts[2], 12)
    : new Date(NaN);
}
function currentWeekBounds() {
  const now = new Date();
  now.setHours(12, 0, 0, 0);
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    start: localISODate(monday),
    end: localISODate(sunday),
    today: localISODate(now),
  };
}
function sessionType(session) {
  const raw = String(session?.type || "")
    .trim()
    .toLowerCase();
  if (raw === "debate" || raw === "debates") return "Debate";
  if (raw === "event" || raw === "club event" || raw === "events") return "Event";
  if (raw === "tournament" || raw === "competition") return "Tournament";
  if (raw === "workshop") return "Workshop";
  if (raw === "training session" || raw === "training") return "Training Session";
  const title = String(session?.title || "");
  if (/\bdebate\b|sparring/i.test(title)) return "Debate";
  if (/tournament|championship|competition/i.test(title)) return "Tournament";
  if (/workshop/i.test(title)) return "Workshop";
  return "Training Session";
}
function validISODate(value) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(String(value || "")) &&
    !Number.isNaN(localDateFromISO(value).getTime()) &&
    localISODate(localDateFromISO(value)) === value
  );
}
function scheduleDateBadge(date) {
  const d = localDateFromISO(date);
  if (Number.isNaN(d.getTime()))
    return `<div class="schedule-date"><span>Date</span><strong> · </strong></div>`;
  return `<div class="schedule-date"><span>${esc(d.toLocaleDateString(undefined, { month: "short" }))}</span><strong>${d.getDate()}</strong><span>${esc(d.toLocaleDateString(undefined, { weekday: "short" }))}</span></div>`;
}
function scheduleItemHTML(item) {
  return `<div class="schedule-item">${scheduleDateBadge(item.date)}<div class="schedule-detail"><h3>${esc(item.title)}</h3><p>${esc(sessionType(item))} · ${fmtDate(item.date)} · ${esc(item.location || "Location to be announced")}</p>${item.notes ? `<p>${esc(item.notes)}</p>` : ""}</div><button class="btn secondary small" onclick="openCalendarSchedule('${sessionType(item) === "Debate" ? "debate" : "events"}')">Calendar</button></div>`;
}
function renderHomeSchedule() {
  const debateEl = document.getElementById("home-upcoming-debates");
  const eventsEl = document.getElementById("home-upcoming-events");
  if (!debateEl || !eventsEl) return;
  const today = localISODate(new Date());
  // Every upcoming calendar item appears automatically. Editor-featured items are prioritized.
  const upcoming = (Array.isArray(appState.sessions) ? appState.sessions : [])
    .filter((s) => validISODate(s.date) && s.date >= today)
    .sort(
      (a, b) =>
        Number(b.featured === true) - Number(a.featured === true) ||
        String(a.date).localeCompare(String(b.date)) ||
        String(a.title).localeCompare(String(b.title)),
    );
  const debates = upcoming.filter((s) => sessionType(s) === "Debate").slice(0, 5);
  const events = upcoming.filter((s) => sessionType(s) !== "Debate").slice(0, 5);
  debateEl.innerHTML = debates.length
    ? debates.map((s) => scheduleItemHTML(s)).join("")
    : `<div class="empty">No upcoming debates are scheduled. Add a debate in Calendar to show it here automatically.</div>`;
  eventsEl.innerHTML = events.length
    ? events
        .map(
          (s) =>
            `<article class="card"><div class="card-top"><span class="pill ${sessionType(s) === "Tournament" ? "gold" : "blue"}">${esc(sessionType(s))}${s.featured === true ? " · ★ Featured" : ""}</span><span class="card-meta">${fmtDate(s.date)}</span></div><h3>${esc(s.title)}</h3><p class="card-meta">📍 ${esc(s.location || "Location to be announced")}</p>${s.notes ? `<p class="subtle">${esc(s.notes)}</p>` : ""}<div class="actions"><button class="btn secondary small" onclick="openCalendarSchedule('events')">Open Calendar →</button></div></article>`,
        )
        .join("")
    : `<div class="empty" style="grid-column:1/-1">No upcoming events are scheduled. Add an event in Calendar to show it here automatically.</div>`;
}
function openCalendarSchedule(filter = "all") {
  switchPage("calendar");
  const select = document.getElementById("calendar-type-filter");
  if (select) {
    select.value = filter;
    renderCalendar();
  }
  document.getElementById("page-calendar")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderHomepageIntroduction() {
  const content = { ...defaultState.homepageContent, ...(appState.homepageContent || {}) };
  const headline = document.querySelector("#page-home .hero-content h2");
  const shortDescription = document.getElementById("home-hero-description");
  const introHeading = document.getElementById("home-introduction-heading");
  const introText = document.getElementById("home-introduction-text");
  const closing = document.getElementById("home-introduction-closing");
  if (headline) headline.textContent = content.headline;
  if (shortDescription) shortDescription.textContent = content.shortDescription;
  if (introHeading) introHeading.textContent = content.introHeading;
  if (introText) introText.textContent = content.introText;
  if (closing) {
    closing.textContent = content.closingLine || "";
    closing.classList.toggle("hidden", !content.closingLine);
  }
}
function renderHome() {
  renderHomepageIntroduction();
  document.getElementById("stat-debaters").textContent = appState.members.filter(
    (m) => m.active !== false,
  ).length;
  document.getElementById("stat-debates").textContent = appState.debates.length;
  document.getElementById("stat-motions").textContent = appState.motions.length;
  document.getElementById("stat-scripts").textContent = appState.scripts.length;
  const homeSeason = document.getElementById("leaderboard-season-select")?.value || "all";
  const homeTitle = document.getElementById("home-leaderboard-title");
  if (homeTitle)
    homeTitle.textContent =
      "🏆 Top Debaters (" + (homeSeason === "all" ? "All Seasons" : homeSeason) + ")";
  const homeLimit = hasMemberAccess() ? 5 : 7;
  const rows = calculateLeaderboardStats(homeSeason)
    .filter((x) => x.active && !x.excludedFromLeaderboard && x.debatesPlayed >= 3)
    .sort((a, b) => (b.average ?? -1) - (a.average ?? -1) || b.totalPoints - a.totalPoints)
    .slice(0, homeLimit);
  document.getElementById("home-leaderboard-body").innerHTML = rows.length
    ? rows
        .map(
          (x, i) =>
            `<tr><td class="rank">#${i + 1}</td><td>${esc(x.name)}</td><td>${x.debatesPlayed}</td><td class="green">${x.average === null ? "Not available" : fmt2(x.average) + "%"}</td><td>${fmt2(x.totalPoints)} pts</td></tr>`,
        )
        .join("")
    : emptyRow(homeLimit, "No debater records yet.");
  renderHomeSchedule();
  renderHomeAchievements();
}
function leaderboardManagementButtons(x) {
  if (!isEditor()) return "";
  return `<td><div class="actions"><button class="btn secondary small" onclick="editMember(${Number(x.id)})">Edit</button><button class="btn ${x.active ? "gold" : ""} small" onclick="toggleMember(${Number(x.id)})">${x.active ? "Deactivate" : "Activate"}</button><button class="btn ${x.excludedFromLeaderboard ? "" : "danger"} small" onclick="toggleLeaderboardExclusion(${Number(x.id)})">${x.excludedFromLeaderboard ? "Restore ranking" : "Remove from leaderboard"}</button><button class="btn danger small" onclick="deleteMember(${Number(x.id)})">Delete</button></div></td>`;
}
function toggleLeaderboardExclusion(id) {
  if (!isEditor()) {
    notify("Editor access is required.");
    return;
  }
  const m = appState.members.find((x) => Number(x.id) === Number(id));
  if (!m) return;
  m.excludedFromLeaderboard = m.excludedFromLeaderboard !== true;
  audit(
    m.excludedFromLeaderboard
      ? "Removed debater from leaderboard"
      : "Restored debater to leaderboard",
    m.name,
  );
  saveState();
  renderLeaderboard();
  renderHome();
  renderAdminMemberList();
  notify(
    m.name +
      (m.excludedFromLeaderboard
        ? " removed from rankings. Historical scores were preserved."
        : " restored to rankings."),
  );
}
function renderLeaderboard() {
  const editor = isEditor();
  const sortEl = document.getElementById("leaderboard-sort-select"),
    sort = sortEl ? sortEl.value : "average";
  const query = editor
    ? (document.getElementById("leaderboard-search")?.value || "").trim().toLowerCase()
    : "";
  const seasonEl = document.getElementById("leaderboard-season-select"),
    season = seasonEl ? seasonEl.value : "all";
  const status = editor
    ? document.getElementById("leaderboard-status-filter")?.value || "all"
    : "all";
  const managementNote = document.getElementById("leaderboard-management-note");
  if (managementNote) managementNote.classList.toggle("hidden", !editor);
  document
    .querySelectorAll(".leaderboard-admin-col,.leaderboard-admin-filter")
    .forEach((el) => el.classList.toggle("hidden", !editor));
  const visibilityNote = document.getElementById("leaderboard-visibility-note");
  if (visibilityNote) visibilityNote.classList.toggle("hidden", editor || !hasMemberAccess());
  const provisionalPanel = document.getElementById("leaderboard-provisional-panel");
  if (provisionalPanel) provisionalPanel.classList.toggle("hidden", !editor);
  const seasons = [
    ...new Set(
      appState.debates
        .map((d) => String(d.season || String(d.date || "").slice(0, 4)))
        .filter(Boolean),
    ),
  ]
    .sort()
    .reverse();
  if (seasonEl) {
    const prior = seasonEl.value || "all";
    seasonEl.innerHTML =
      '<option value="all">All seasons</option>' +
      seasons.map((y) => `<option value="${esc(y)}">${esc(y)}</option>`).join("");
    seasonEl.value = seasons.includes(prior) || prior === "all" ? prior : "all";
  }
  const stats = calculateLeaderboardStats(season).filter((x) =>
    x.name.toLowerCase().includes(query),
  );
  const filtered = stats.filter(
    (x) =>
      status === "all" ||
      (status === "active" && x.active && !x.excludedFromLeaderboard) ||
      (status === "inactive" && !x.active) ||
      (status === "excluded" && x.excludedFromLeaderboard),
  );
  const cmp = (a, b) =>
    !editor
      ? (b.average ?? -1) - (a.average ?? -1) || b.totalPoints - a.totalPoints
      : sort === "average"
        ? (b.average ?? -1) - (a.average ?? -1) || b.totalPoints - a.totalPoints
        : sort === "debates"
          ? b.debatesPlayed - a.debatesPlayed || (b.average ?? -1) - (a.average ?? -1)
          : b.totalPoints - a.totalPoints || (b.average ?? -1) - (a.average ?? -1);
  const list = filtered.sort(cmp),
    official = list.filter((x) => x.active && !x.excludedFromLeaderboard && x.debatesPlayed >= 3),
    provisional = list.filter((x) => x.excludedFromLeaderboard || !x.active || x.debatesPlayed < 3);
  const memberView = hasMemberAccess();
  const publicLimit = memberView ? 5 : 7;
  const visibleOfficial = editor ? official : official.slice(0, publicLimit);
  document.getElementById("leaderboard-ranked-body").innerHTML = visibleOfficial.length
    ? visibleOfficial
        .map(
          (x, i) =>
            `<tr><td class="rank">${i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "#" + (i + 1)}</td><td>${esc(x.name)}</td><td>${x.debatesPlayed}</td><td class="green">${fmt2(x.average)}%</td><td>${fmt2(x.totalPoints)} pts</td>${leaderboardManagementButtons(x)}</tr>`,
        )
        .join("")
    : emptyRow(
        editor ? 6 : memberView ? 5 : 7,
        "No official rankings match. Active, included debaters need at least 3 debates in the selected season.",
      );
  document.getElementById("leaderboard-provisional-body").innerHTML = provisional.length
    ? provisional
        .map((x) => {
          const label = x.excludedFromLeaderboard
            ? "Excluded from leaderboard"
            : !x.active
              ? "Inactive"
              : "Provisional";
          return `<tr><td><span class="pill ${x.excludedFromLeaderboard || !x.active ? "red" : "gold"}">${label}</span></td><td>${esc(x.name)}</td><td>${x.debatesPlayed}</td><td>${x.average === null ? " · " : fmt2(x.average) + "%"}</td><td>${fmt2(x.totalPoints)} pts</td>${leaderboardManagementButtons(x)}</tr>`;
        })
        .join("")
    : emptyRow(
        isEditor() ? 6 : 5,
        "No provisional, inactive, or excluded debaters match your search.",
      );
}
function renderMotions() {
  const q = (document.getElementById("motion-search")?.value || "").trim().toLowerCase(),
    catEl = document.getElementById("motion-category-filter"),
    statusEl = document.getElementById("motion-format-filter");
  const cats = [...new Set(appState.motions.map((m) => m.category).filter(Boolean))].sort();
  if (catEl) {
    const old = catEl.value || "all";
    catEl.innerHTML =
      '<option value="all">All categories</option>' +
      cats.map((c) => `<option value="${esc(c)}">${esc(c)}</option>`).join("");
    catEl.value = cats.includes(old) || old === "all" ? old : "all";
  }
  const cat = catEl?.value || "all",
    status = statusEl?.value || "all";
  const list = appState.motions.filter(
    (m) =>
      [m.text, m.category, m.info, m.status].some((v) =>
        String(v || "")
          .toLowerCase()
          .includes(q),
      ) &&
      (cat === "all" || m.category === cat) &&
      (status === "all" || m.status === status),
  );
  document.getElementById("motions-grid").innerHTML = list.length
    ? list
        .map(
          (m) =>
            `<article class="card"><div class="card-top"><span class="pill blue">${esc(m.category)}</span><span class="pill ${m.status === "Debated" ? "gold" : ""}">${esc(m.status)}</span></div><h3>“${esc(m.text)}”</h3><p class="info-box">Info Slide: ${esc(m.info || "No info slide supplied.")}</p><div class="card-meta">${esc(m.format || "Asian Parliamentary")} · ${esc(m.difficulty || "Open difficulty")}</div><div class="actions"><button class="btn secondary small" onclick="viewMotionDetail(${Number(m.id)})">View Details</button>${isEditor() ? `<button class="btn secondary small" onclick="editMotion(${Number(m.id)})">Edit Motion</button><button class="btn small" onclick="markMotionDebated(${Number(m.id)})" ${m.status === "Debated" ? "disabled" : ""}>${m.status === "Debated" ? "Marked Debated" : "Mark as Debated"}</button><button class="btn gold small" onclick="startResultForMotion(${Number(m.id)})">Add Debate Result</button><button class="btn danger small" onclick="deleteMotion(${Number(m.id)})">Delete Motion</button>` : ""}</div></article>`,
        )
        .join("")
    : '<div class="empty" style="grid-column:1/-1">No motions match your filters.</div>';
  if (isEditor()) renderAdminMotionList();
  const addMotionButton = document.getElementById("motion-bank-actions");
  if (addMotionButton) addMotionButton.classList.toggle("hidden", !isEditor());
}
function viewMotionDetail(id) {
  const m = appState.motions.find((x) => Number(x.id) === Number(id));
  if (!m) return;
  const results = appState.debates.filter((d) => Number(d.motionId) === Number(m.id));
  openDetailModal(
    m.text,
    `<p><span class="pill blue">${esc(m.category)}</span> <span class="pill">${esc(m.status)}</span></p><h3>Info slide</h3><p>${esc(m.info || "No additional information supplied.")}</p><p><b>Format:</b> ${esc(m.format || "Asian Parliamentary")}<br><b>Difficulty:</b> ${esc(m.difficulty || "Not specified")}</p><h3>Debate history</h3><p>${results.length ? results.map((d) => `${esc(fmtDate(d.date))}  ·  ${esc(d.result)} (${esc(d.format || "Asian Parliamentary")})`).join("<br>") : "No result recorded for this motion yet."}</p>${isEditor() ? `<div class="actions"><button class="btn secondary" onclick="editMotion(${Number(m.id)})">Edit Motion</button><button class="btn" onclick="markMotionDebated(${Number(m.id)})">Mark as Debated</button><button class="btn gold" onclick="startResultForMotion(${Number(m.id)})">Add Debate Result</button></div>` : ""}`,
  );
}

function renderResults() {
  const q = (document.getElementById("results-search")?.value || "").trim().toLowerCase(),
    seasonEl = document.getElementById("results-season-filter"),
    formatEl = document.getElementById("results-format-filter");
  const seasons = [
    ...new Set(
      appState.debates
        .map((d) => String(d.season || String(d.date || "").slice(0, 4)))
        .filter(Boolean),
    ),
  ]
    .sort()
    .reverse();
  if (seasonEl) {
    const old = seasonEl.value || "all";
    seasonEl.innerHTML =
      '<option value="all">All seasons</option>' +
      seasons.map((y) => `<option value="${esc(y)}">${esc(y)}</option>`).join("");
    seasonEl.value = seasons.includes(old) || old === "all" ? old : "all";
  }
  const season = seasonEl?.value || "all",
    format = formatEl?.value || "all";
  const list = [...appState.debates]
    .filter((d) => {
      const motion = appState.motions.find((m) => Number(m.id) === Number(d.motionId));
      const searchable = [d.date, d.result, d.season, d.format, motion?.text, d.govTeam, d.oppTeam]
        .join(" ")
        .toLowerCase();
      return (
        searchable.includes(q) &&
        (season === "all" || String(d.season || String(d.date || "").slice(0, 4)) === season) &&
        (format === "all" || String(d.format || "Asian Parliamentary") === format)
      );
    })
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));
  const privacy = document.getElementById("results-privacy-badge");
  if (privacy)
    privacy.textContent = hasMemberAccess()
      ? "✓ Member access · Scorecards visible"
      : "🔒 Score details protected";
  document.getElementById("results-list").innerHTML = list.length
    ? list
        .map((d) => {
          const motion = appState.motions.find((m) => Number(m.id) === Number(d.motionId)),
            participants = Array.isArray(d.participants) ? d.participants : [];
          const namedParticipants = participants.map((p) => ({
            p,
            member: appState.members.find((m) => Number(m.id) === Number(p.memberId)),
          }));
          const bestScore = participants.length
            ? Math.max(...participants.map((p) => Number(p.score) || 0))
            : -1;
          const bestDebaters =
            bestScore >= 0
              ? namedParticipants
                  .filter((x) => (Number(x.p.score) || 0) === bestScore)
                  .map((x) => x.member?.name || "Removed member")
              : [];
          const publicDebaters = `<div class="info-box"><div class="panel-head"><b>Debaters in this Session</b><span class="card-meta">${participants.length} participant${participants.length === 1 ? "" : "s"}</span></div>${namedParticipants.length ? `<div class="cards" style="grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:8px">${namedParticipants.map(({ p, member }) => `<div class="card" style="padding:10px"><b>${esc(member ? member.name : "Removed member")}</b><div class="card-meta">${esc(p.role || "Role not recorded")}</div></div>`).join("")}</div>` : "<p>No debater names were recorded for this session.</p>"}</div>`;
          const bestDebater = `<div class="info-box result-best"><b>🏅 Best Debater</b><span class="result-best-name">${bestDebaters.length ? bestDebaters.map(esc).join(", ") : participants.length ? "Not determined" : "Not recorded"}</span>${bestDebaters.length > 1 ? '<div class="card-meta">Joint recognition for the highest recorded individual score.</div>' : ""}</div>`;
          const detailOpen = window.matchMedia("(min-width: 641px)").matches ? " open" : "";
          const scores = hasMemberAccess()
            ? `<div class="info-box"><div class="panel-head"><b>Speaker Scorecards</b><span class="card-meta">${participants.length} participant${participants.length === 1 ? "" : "s"}</span></div>${scorecardTableHtml(participants, "No individual scores recorded.")}</div>`
            : '<div class="info-box">🔒 Individual score breakdowns are available to signed-in members.</div>';
          return `<article class="card result-card"><div class="card-top"><span class="card-meta">${fmtDate(d.date)} · ${esc(d.format || "Asian Parliamentary")} · Season ${esc(d.season || String(d.date || "").slice(0, 4))}</span><span class="pill ${d.result === "Gov Win" ? "" : "blue"}">${esc(d.result)}</span></div><h3>“${esc(motion ? motion.text : "Motion no longer available")}”</h3><div class="cards result-teams" style="grid-template-columns:repeat(2,minmax(0,1fr))"><div class="info-box"><b>Proposition / Government</b><p>${esc(d.govTeam || "Team not recorded")}</p></div><div class="info-box"><b>Opposition</b><p>${esc(d.oppTeam || "Team not recorded")}</p></div></div>${bestDebater}<details class="result-details"${detailOpen}><summary>Participants & score details · ${participants.length} participant${participants.length === 1 ? "" : "s"}</summary>${publicDebaters}${scores}${isEditor() ? `<div class="actions"><button class="btn secondary small" onclick="editDebate(${Number(d.id)})">Edit Result & Scorecards</button><button class="btn danger small" onclick="deleteDebate(${Number(d.id)})">Delete Result</button></div>` : ""}</details></article>`;
        })
        .join("")
    : '<div class="empty">No debate results match these filters.</div>';
}

function calendarNoteMarkup(value) {
  const notes = String(value || "No additional notes.").trim();
  const previewLimit = 190;
  if (notes.length <= previewLimit) return `<p class="info-box">${esc(notes)}</p>`;
  const preview = notes
    .slice(0, previewLimit)
    .replace(/\\s+\\S*$/, "")
    .trimEnd();
  return `<details class="calendar-notes"><summary>${esc(preview)}…</summary><p class="info-box">${esc(notes)}</p></details>`;
}

function renderCalendar() {
  const filter = document.getElementById("calendar-type-filter")?.value || "all",
    dateFilter = document.getElementById("calendar-date-filter")?.value || "all",
    featureFilter = document.getElementById("calendar-feature-filter")?.value || "all",
    query = (document.getElementById("calendar-search")?.value || "").trim().toLocaleLowerCase(),
    today = localISODate(new Date());
  const list = [...(Array.isArray(appState.sessions) ? appState.sessions : [])]
    .filter((s) => validISODate(s.date))
    .filter(
      (s) =>
        filter === "all" ||
        (filter === "debate" ? sessionType(s) === "Debate" : sessionType(s) !== "Debate"),
    )
    .filter(
      (s) => dateFilter === "all" || (dateFilter === "past" ? s.date < today : s.date >= today),
    )
    .filter(
      (s) =>
        featureFilter === "all" ||
        (featureFilter === "featured" ? s.featured === true : s.featured !== true),
    )
    .filter(
      (s) =>
        !query ||
        [s.title, s.location, s.notes, sessionType(s)].some((v) =>
          String(v || "")
            .toLocaleLowerCase()
            .includes(query),
        ),
    )
    .sort(
      (a, b) =>
        String(a.date).localeCompare(String(b.date)) ||
        String(a.title).localeCompare(String(b.title)),
    );
  const add = document.getElementById("calendar-add-control");
  if (add)
    add.innerHTML = isEditor()
      ? '<button class="btn" type="button" onclick="openSessionEditor()">+ Add Calendar Item</button>'
      : "";
  const grid = document.getElementById("calendar-grid");
  if (!grid) return;
  grid.innerHTML = list.length
    ? list
        .map(
          (s) =>
            `<article class="card"><div class="card-top"><span class="green">▦ ${fmtDate(s.date)}</span><span class="pill ${sessionType(s) === "Debate" ? "gold" : sessionType(s) === "Tournament" ? "blue" : ""}">${esc(sessionType(s))}</span></div><h3>${esc(s.title)}</h3><p class="card-meta">📍 ${esc(s.location || "Location to be announced")}</p>${calendarNoteMarkup(s.notes)}${s.featured === true ? '<p class="pill gold">★ Featured on Home</p>' : ""}${isEditor() ? `<div class="actions"><button class="btn secondary small" onclick="openSessionEditor(${Number(s.id)})">Edit Item</button><button class="btn ${s.featured === true ? "secondary" : "gold"} small" onclick="toggleSessionFeatured(${Number(s.id)})">${s.featured === true ? "Remove Home Feature" : "★ Feature on Home"}</button><button class="btn danger small" onclick="deleteSession(${Number(s.id)})">Delete</button></div>` : ""}</article>`,
        )
        .join("")
    : `<div class="empty" style="grid-column:1/-1">No ${filter === "debate" ? "debates" : filter === "events" ? "events or training sessions" : "calendar items"} match these filters. Try changing the date filter or add a calendar item.</div>`;
  if (isEditor()) renderAdminSessionList();
}

function debatedMotions() {
  const debatedIds = new Set(appState.debates.map((d) => Number(d.motionId)));
  return appState.motions
    .filter((m) => m.status === "Debated" || debatedIds.has(Number(m.id)))
    .sort((a, b) => String(a.text).localeCompare(String(b.text)));
}
function populateScriptTopicControls() {
  const topics = debatedMotions();
  const filter = document.getElementById("scripts-topic-filter");
  if (filter) {
    const prior = filter.value || "all";
    filter.innerHTML =
      '<option value="all">All debated topics</option>' +
      topics.map((m) => `<option value="${Number(m.id)}">${esc(m.text)}</option>`).join("");
    if (prior === "all" || topics.some((m) => String(m.id) === prior)) filter.value = prior;
  }
  const select = document.getElementById("script-motion");
  if (select) {
    const prior = select.value;
    select.innerHTML = topics.length
      ? topics.map((m) => `<option value="${Number(m.id)}">${esc(m.text)}</option>`).join("")
      : '<option value="">No debated topics yet  ·  record a debate first</option>';
    if (topics.some((m) => String(m.id) === prior)) select.value = prior;
    select.disabled = !topics.length;
  }
}
function normalizeDebateRole(role) {
  const aliases = {
    "Deputy PM": "Deputy Prime Minister",
    "Deputy LO": "Deputy Leader of Opposition",
  };
  return aliases[String(role || "")] || String(role || "General / All Roles");
}
function renderScripts() {
  if (!hasMemberAccess()) {
    switchPage("home");
    return;
  }
  populateScriptTopicControls();
  const topicFilter = document.getElementById("scripts-topic-filter")?.value || "all";
  const roleFilter = document.getElementById("scripts-role-filter")?.value || "all";
  const motionQuery = (document.getElementById("scripts-motion-search")?.value || "")
    .trim()
    .toLocaleLowerCase();
  const debated = debatedMotions();
  const topics = debated.filter((m) => {
    const matchesSelectedTopic = topicFilter === "all" || String(m.id) === topicFilter;
    const matchesMotionSearch =
      !motionQuery ||
      String(m.text || "")
        .toLocaleLowerCase()
        .includes(motionQuery);
    return matchesSelectedTopic && matchesMotionSearch;
  });
  const roleList = [
    "Prime Minister",
    "Leader of Opposition",
    "Deputy Prime Minister",
    "Deputy Leader of Opposition",
    "Government Whip",
    "Opposition Whip",
    "Member of Government",
    "Member of Opposition",
    "Reply Speaker",
    "Adjudicator",
    "General / All Roles",
  ];
  const el = document.getElementById("scripts-grid");
  const sections = topics
    .map((m) => {
      const motionScripts = appState.scripts.filter((s) => Number(s.motionId) === Number(m.id));
      const availableRoles = roleList.filter((role) =>
        motionScripts.some((s) => normalizeDebateRole(s.role) === role),
      );
      const visibleRoles = availableRoles.filter(
        (role) => roleFilter === "all" || role === roleFilter,
      );
      const roleSections = visibleRoles
        .map((role) => {
          const scripts = motionScripts
            .filter((s) => normalizeDebateRole(s.role) === role)
            .sort((a, b) => String(a.title).localeCompare(String(b.title)));
          return `<section class="panel script-role-section"><div class="panel-head"><div><h4>${esc(role)}</h4><p class="subtle">${scripts.length} script${scripts.length === 1 ? "" : "s"}</p></div>${isEditor() ? `<button class="btn secondary small" onclick="openAdminScriptForTopic(${Number(m.id)}, roleList[${roleList.indexOf(role)}])">+ Add for this role</button>` : ""}</div><div class="cards">${scripts.map((s) => `<article class="card"><div class="card-top"><span class="pill gold">${esc(s.category || "Script")}</span><span class="card-meta">Author: ${esc(s.author || "Not specified")}</span></div><h3>${esc(s.title)}</h3><p class="info-box">${esc(String(s.body || "").slice(0, 220))}${String(s.body || "").length > 220 ? "…" : ""}</p><div class="actions"><button class="btn secondary small" onclick="viewScriptDetail(${Number(s.id)})">Read Full Script</button>${isEditor() ? `<button class="btn secondary small" onclick="editScript(${Number(s.id)})">Edit</button><button class="btn danger small" onclick="deleteScript(${Number(s.id)})">Delete</button>` : ""}</div></article>`).join("")}</div></section>`;
        })
        .join("");
      const visibleScriptCount = visibleRoles.reduce(
        (count, role) =>
          count + motionScripts.filter((s) => normalizeDebateRole(s.role) === role).length,
        0,
      );
      const roleChips = availableRoles.length
        ? availableRoles.map((role) => `<span class="role-chip">${esc(role)}</span>`).join("")
        : `<span class="card-meta">No speaker roles yet</span>`;
      const emptyRoleMessage =
        roleFilter === "all"
          ? "No scripts are available for this motion yet."
          : `No scripts are available for ${esc(roleFilter)} on this motion yet.`;
      const roleContent = roleSections || `<p class="subtle">${emptyRoleMessage}</p>`;
      return `<details class="panel script-motion"><summary class="script-motion-summary"><div class="script-motion-heading"><span class="pill gold">${esc(m.category || "Debated motion")}</span><h3>${esc(m.text)}</h3><span class="script-motion-count">${visibleScriptCount} script${visibleScriptCount === 1 ? "" : "s"} · ${availableRoles.length} speaker role${availableRoles.length === 1 ? "" : "s"}</span></div><div class="script-motion-roles">${roleChips}</div></summary><div class="script-motion-content">${isEditor() ? `<div class="script-motion-actions"><button class="btn secondary small" onclick="openAdminScriptForTopic(${Number(m.id)})">+ Add script</button></div>` : ""}${roleContent}</div></details>`;
    })
    .join("");
  const unassigned = appState.scripts.filter(
    (s) =>
      !debated.some((m) => Number(m.id) === Number(s.motionId)) &&
      (roleFilter === "all" || normalizeDebateRole(s.role) === roleFilter),
  );
  const emptyMessage =
    debated.length === 0
      ? "No debated topics yet. Once an editor records a debate, its motion will appear here."
      : motionQuery || topicFilter !== "all"
        ? "No debated motions match your search and filters. Try a different keyword or clear the topic filter."
        : "No debated topics to display.";
  const legacy =
    topicFilter === "all" && !motionQuery && unassigned.length
      ? `<details class="panel script-motion legacy-script-group"><summary class="script-motion-summary"><div class="script-motion-heading"><h3>Unassigned legacy resources</h3><span class="script-motion-count">${unassigned.length} resource${unassigned.length === 1 ? "" : "s"}</span></div></summary><div class="script-motion-content"><p class="subtle">These older resources are not linked to a debated topic yet.</p><div class="cards">${unassigned.map((s) => `<article class="card"><h3>${esc(s.title)}</h3><p>${esc(s.body || "")}</p>${isEditor() ? `<button class="btn secondary small" onclick="editScript(${Number(s.id)})">Assign topic / Edit</button>` : ""}</article>`).join("")}</div></div></details>`
      : "";
  el.innerHTML = (sections || `<div class="empty">${esc(emptyMessage)}</div>`) + legacy;
}

/* ===== Achievements ===== */
const ACH_TYPES = ["Inter Cant", "Fest", "Others"];
function achTypeClass(t) {
  return t === "Inter Cant" ? "inter" : t === "Fest" ? "fest" : "others";
}
function achSorted(list) {
  return [...list].sort(
    (a, b) =>
      String(b.year || "").localeCompare(String(a.year || "")) || Number(b.id) - Number(a.id),
  );
}
function achievementCardHtml(a, admin) {
  const controls = admin
    ? `<div class="ach-actions">${a.featured === true ? '<span class="ach-featured">★ On Home</span>' : ""}<button class="btn secondary small" type="button" onclick="toggleAchievementFeatured(${Number(a.id)})">${a.featured === true ? "★ Remove from Home" : "☆ Feature on Home"}</button><button class="btn secondary small" type="button" onclick="openAchievementEditor(${Number(a.id)})">Edit</button><button class="btn danger small" type="button" onclick="deleteAchievement(${Number(a.id)})">Delete</button></div>`
    : "";
  return `<article class="ach-card ${achTypeClass(a.type)}"><div class="ach-top"><span class="ach-type">${esc(a.type)}</span>${a.year ? `<span class="ach-year">${esc(a.year)}</span>` : ""}</div><p class="ach-text glow-text">${esc(a.text)}</p>${controls}</article>`;
}
function renderAchievements() {
  const grid = document.getElementById("achievements-grid");
  if (!grid) return;
  const editor = isEditor();
  document.getElementById("ach-admin-bar")?.classList.toggle("hidden", !editor);
  document.getElementById("ach-admin-note")?.classList.toggle("hidden", !editor);
  const type = document.getElementById("ach-type-filter")?.value || "all";
  const list = achSorted(appState.achievements || []).filter(
    (a) => type === "all" || a.type === type,
  );
  grid.innerHTML = list.length
    ? list.map((a) => achievementCardHtml(a, editor)).join("")
    : `<div class="empty" style="grid-column:1/-1">${(appState.achievements || []).length ? "No achievements in this category yet." : "No achievements have been added yet."}${editor ? " Use “+ Add Achievement” to add the first one." : ""}</div>`;
}
function renderHomeAchievements() {
  const el = document.getElementById("home-achievements");
  if (!el) return;
  const list = achSorted((appState.achievements || []).filter((a) => a.featured === true)).slice(
    0,
    6,
  );
  el.innerHTML = list.length
    ? list.map((a) => achievementCardHtml(a, false)).join("")
    : `<div class="empty" style="grid-column:1/-1">No achievements have been selected for the Home page yet.${isEditor() ? " Open Achievements and choose “Feature on Home.”" : ""}</div>`;
}
function openAchievementEditor(id = null) {
  if (!isEditor()) {
    notify("Admin access is required.");
    return;
  }
  const a =
    id === null ? null : (appState.achievements || []).find((x) => Number(x.id) === Number(id));
  if (id !== null && !a) return;
  openDetailModal(
    a ? "Edit Achievement" : "Add Achievement",
    `<form onsubmit="saveAchievementEditor(event,${a ? Number(a.id) : "null"})"><div class="form-grid"><div class="field"><label for="ach-editor-type">Achievement Type</label><select class="input" id="ach-editor-type" required>${ACH_TYPES.map((t) => `<option ${a && a.type === t ? "selected" : ""}>${t}</option>`).join("")}</select></div><div class="field"><label for="ach-editor-year">Year / Date (optional)</label><input class="input" id="ach-editor-year" maxlength="24" placeholder="e.g. 2026" value="${esc(a?.year || "")}"></div><div class="field full"><label for="ach-editor-text">Achievement</label><textarea class="input" id="ach-editor-text" rows="4" required maxlength="600" placeholder="e.g. Champion  ·  Inter Cant Debate Championship 2026">${esc(a?.text || "")}</textarea></div><div class="field full"><label><input type="checkbox" id="ach-editor-featured" ${a && a.featured === true ? "checked" : ""}> Feature this achievement in “Latest Achievements” on the Home page</label></div></div><div class="form-actions"><button type="button" class="btn secondary" onclick="closeDetailModal()">Cancel</button><button class="btn" type="submit">${a ? "Save Achievement" : "Add Achievement"}</button></div></form>`,
  );
}
function saveAchievementEditor(event, id) {
  event.preventDefault();
  if (!isEditor()) return;
  const type = document.getElementById("ach-editor-type").value,
    year = document.getElementById("ach-editor-year").value.trim(),
    text = document.getElementById("ach-editor-text").value.trim(),
    featured = document.getElementById("ach-editor-featured").checked;
  if (!ACH_TYPES.includes(type) || !text) {
    notify("Choose a type and write the achievement.");
    return;
  }
  if (!Array.isArray(appState.achievements)) appState.achievements = [];
  const a = id === null ? null : appState.achievements.find((x) => Number(x.id) === Number(id));
  if (a) {
    Object.assign(a, { type, year, text, featured });
    audit("Updated achievement", type + " · " + text.slice(0, 80));
  } else {
    appState.achievements.push({ id: Date.now(), type, year, text, featured });
    audit("Added achievement", type + " · " + text.slice(0, 80));
  }
  saveState();
  closeDetailModal();
  renderAchievements();
  renderHomeAchievements();
  notify("Achievement saved.");
}
function toggleAchievementFeatured(id) {
  if (!isEditor()) return;
  const a = (appState.achievements || []).find((x) => Number(x.id) === Number(id));
  if (!a) return;
  a.featured = a.featured !== true;
  audit(a.featured ? "Featured achievement" : "Unfeatured achievement", a.text.slice(0, 80));
  saveState();
  renderAchievements();
  renderHomeAchievements();
  notify(a.featured ? "Now shown on the Home page." : "Removed from the Home page.");
}
function deleteAchievement(id) {
  if (!isEditor()) return;
  const a = (appState.achievements || []).find((x) => Number(x.id) === Number(id));
  if (!a || !confirm("Delete this achievement?")) return;
  appState.achievements = appState.achievements.filter((x) => Number(x.id) !== Number(id));
  audit("Deleted achievement", a.text.slice(0, 80));
  saveState();
  renderAchievements();
  renderHomeAchievements();
  notify("Achievement deleted.");
}

/* Editor tools and content management */
function readHomepageContentForm() {
  return {
    headline: document.getElementById("homepage-headline").value.trim(),
    shortDescription: document.getElementById("homepage-short-description").value.trim(),
    introHeading: document.getElementById("homepage-intro-heading").value.trim(),
    introText: document.getElementById("homepage-intro-text").value.trim(),
    closingLine: document.getElementById("homepage-closing-line").value.trim(),
  };
}
function renderAdminHomepageContent() {
  if (!isEditor()) return;
  const content = { ...defaultState.homepageContent, ...(appState.homepageContent || {}) };
  const fields = {
    "homepage-headline": content.headline,
    "homepage-short-description": content.shortDescription,
    "homepage-intro-heading": content.introHeading,
    "homepage-intro-text": content.introText,
    "homepage-closing-line": content.closingLine,
  };
  Object.entries(fields).forEach(([id, value]) => {
    const el = document.getElementById(id);
    if (el && document.activeElement !== el) el.value = value || "";
  });
  previewHomepageContent();
}
function previewHomepageContent() {
  const content = readHomepageContentForm();
  document.getElementById("homepage-content-preview-heading").textContent = content.headline;
  document.getElementById("homepage-content-preview-short").textContent = content.shortDescription;
  document.getElementById("homepage-content-preview-intro-heading").textContent =
    content.introHeading;
  document.getElementById("homepage-content-preview-intro").textContent = content.introText;
  const closing = document.getElementById("homepage-content-preview-closing");
  closing.textContent = content.closingLine;
  closing.classList.toggle("hidden", !content.closingLine);
}
function saveHomepageContent(event) {
  event.preventDefault();
  if (!isEditor()) {
    notify("Editor access is required.");
    return;
  }
  const content = readHomepageContentForm();
  if (
    !content.headline ||
    !content.shortDescription ||
    !content.introHeading ||
    !content.introText
  ) {
    notify("Complete the headline and introduction fields before saving.");
    return;
  }
  appState.homepageContent = content;
  audit("Updated homepage introduction", content.introHeading);
  renderHomepageIntroduction();
  previewHomepageContent();
  saveState();
  notify("Homepage introduction saved.");
}
function switchAdminTab(tab) {
  if (!isEditor()) {
    notify("Editor access is required.");
    switchPage("home");
    return;
  }
  document
    .querySelectorAll(".admin-tab")
    .forEach((el) => el.classList.toggle("active", el.id === "admin-sub-" + tab));
  document
    .querySelectorAll(".tab-btn")
    .forEach((el) => el.classList.toggle("active", el.dataset.tab === tab));
  if (tab === "homepage") renderAdminHomepageContent();
  if (tab === "debates") {
    renderAdmin();
    renderAdminDebateScores();
  }
  if (tab === "scoring") renderScoringRulesReference(true);
  if (tab === "users") refreshPeople();
  if (tab === "audit") renderAuditLog();
}
function renderAdmin() {
  if (!isEditor()) {
    switchPage("home");
    return;
  }
  const motionSelect = document.getElementById("new-deb-motion");
  motionSelect.innerHTML = appState.motions
    .map((m) => `<option value="${m.id}">${esc(m.text)}</option>`)
    .join("");
  if (!appState.motions.length)
    motionSelect.innerHTML = '<option value="">Create a motion first</option>';
  const container = document.getElementById("debater-score-inputs");
  if (!container.children.length && appState.members.length) addDebaterScoreRow();
  renderAdminHomepageContent();
  renderAdminMotionList();
  renderAdminSessionList();
  renderAdminMemberList();
  renderAdminScriptList();
  renderAdminUsers();
  renderAuditLog();
}
function renderAdminDebateScores() {
  const el = document.getElementById("admin-debate-scores-list");
  if (!el) return;
  const debates = [...appState.debates].sort((a, b) =>
    String(b.date).localeCompare(String(a.date)),
  );
  el.innerHTML = debates.length
    ? debates
        .map((d) => {
          const motion = appState.motions.find((m) => Number(m.id) === Number(d.motionId));
          const parts = Array.isArray(d.participants) ? d.participants : [];
          return `<article class="card"><div class="card-top"><span class="card-meta">${fmtDate(d.date)}</span><span class="pill blue">${esc(d.result)}</span></div><h3>${esc(motion ? motion.text : "Motion unavailable")}</h3>${scorecardTableHtml(parts, "No individual debater scores recorded for this debate.")}<div class="actions" style="margin-top:0"><button class="btn small" type="button" onclick="addScoreToDebate(${Number(d.id)})">+ Add Debater Score</button><button class="btn secondary small" type="button" onclick="editDebate(${Number(d.id)})">Edit Debate & Scores</button></div></article>`;
        })
        .join("")
    : '<div class="empty">No debates recorded yet. First record a debate, then add or manage individual debater scores here.</div>';
  renderScoringRulesReference();
}
function renderScoringRulesReference(force) {
  const host = document.getElementById("scoring-rules-body");
  if (!host) return;
  if (host.dataset.ready && !force) return;
  host.dataset.ready = "1";
  const sum = (r) => SCORING_CONFIG[r].criteria.reduce((a, c) => a + c.max, 0);
  const cards = SCORING_ROLES.map((r) => {
    const c = SCORING_CONFIG[r],
      t = sum(r),
      ok = t === c.max;
    return `<article class="card"><span class="pill blue">${c.side} · ${c.max} points</span><h3>${r} <small>(${c.bn})</small></h3><ul style="margin:8px 0 0;padding-left:18px">${c.criteria.map((x) => `<li>${x.label} <small>(${x.bn})</small>  ·  max <b>${x.max}</b></li>`).join("")}</ul><div class="rules-check ${ok ? "ok" : "bad"}">${ok ? "✓" : "✗"} Criteria add up to ${t} / ${c.max}</div></article>`;
  }).join("");
  const teamRow = (side) => {
    const roles = SCORING_ROLES.filter((r) => SCORING_CONFIG[r].side === side),
      tot = roles.reduce((a, r) => a + SCORING_CONFIG[r].max, 0);
    return `<tr><td><b>${side}</b></td><td>${roles.map((r) => `${r} (${SCORING_CONFIG[r].max})`).join(" + ")}</td><td><b>${tot}</b> ${tot === 350 ? '<span class="rules-check ok">✓</span>' : '<span class="rules-check bad">✗ expected 350</span>'}</td></tr>`;
  };
  const poiRows = SCORING_ROLES.filter((r) => SCORING_CONFIG[r].max === 100)
    .map((r) => {
      const c = SCORING_CONFIG[r],
        p = c.criteria.find((x) => x.key === "poi"),
        role = c.criteria.find((x) => x.key === "role");
      return `<tr><td>${r}</td><td>${c.bn}</td><td>${p ? p.max + " Points" : "0 Points" + (role ? " (Allocated to Role Execution: " + role.max + ")" : "")}</td></tr>`;
    })
    .join("");
  const judgeBox = `<div class="info-box" style="margin-bottom:16px"><b>Multi-judge scoring (N judges)</b><p style="margin:6px 0 0">Category average = (Judge 1 + … + Judge N) ÷ N. Speaker final score = average of the N judges' totals (out of 100, or 50 for reply). Team total = Speaker 1 + Speaker 2 + Speaker 3 + Reply (max 350). Minimum per category is 0 and the maximum is that category's ceiling. All averages display to 2 decimals (e.g. 84.33 / 100).</p></div>`;
  const poiTable = `<div class="table-wrap" style="margin:16px 0"><table style="min-width:480px"><thead><tr><th>Speaker role</th><th>Bengali title</th><th>POI allocation</th></tr></thead><tbody>${poiRows}</tbody></table></div>`;
  host.innerHTML =
    judgeBox +
    `<div class="table-wrap" style="margin-bottom:16px"><table style="min-width:480px"><thead><tr><th>Side</th><th>Speakers</th><th>Team maximum</th></tr></thead><tbody>${teamRow("Government")}${teamRow("Opposition")}</tbody></table></div><div class="cards">${cards}</div><h3 style="margin-top:22px">Points of Information (আপত্তি মোকাবেলা)  ·  quick reference</h3>` +
    poiTable;
}
/* ===== Searchable debater picker (search box + drop-down) ===== */
function debaterOptionsHtml(selectedId, query) {
  const q = String(query || "")
    .trim()
    .toLowerCase();
  const list = appState.members.filter((m) => !q || String(m.name).toLowerCase().includes(q));
  if (!list.length) return '<option value="" disabled selected>No debater found</option>';
  const hasSelection = selectedId !== undefined && selectedId !== null && String(selectedId) !== "";
  const found = hasSelection && list.some((m) => Number(m.id) === Number(selectedId));
  const sel = found ? Number(selectedId) : hasSelection && q ? Number(list[0].id) : null;
  const placeholder =
    !hasSelection && !q ? '<option value="" selected disabled>Choose a debater…</option>' : "";
  return (
    placeholder +
    list
      .map(
        (m) =>
          `<option value="${m.id}" ${Number(m.id) === sel ? "selected" : ""}>${esc(m.name)}${m.active === false ? " (inactive)" : ""}</option>`,
      )
      .join("")
  );
}
function debaterPickerHtml(cls, selectedId) {
  return `<div class="debater-picker"><input type="search" class="input picker-search" placeholder="🔍 Search debater by name…" aria-label="Search debater" oninput="filterDebaterPicker(this)" onkeydown="if(event.key==='Enter')event.preventDefault()"><select class="${cls}" aria-label="Debater" required>${debaterOptionsHtml(selectedId, "")}</select><span class="picker-count"></span></div>`;
}
function filterDebaterPicker(input) {
  const wrap = input.closest(".debater-picker"),
    sel = wrap && wrap.querySelector("select");
  if (!sel) return;
  sel.innerHTML = debaterOptionsHtml(sel.value, input.value);
  const n = [...sel.options].filter((o) => o.value).length,
    c = wrap.querySelector(".picker-count");
  if (c)
    c.textContent = input.value.trim()
      ? n
        ? n + " match" + (n === 1 ? "" : "es")
        : "No match"
      : "";
}
function addScoreToDebate(id) {
  if (!isEditor()) return;
  editDebate(id);
  addEditDebaterRow();
  const rows = document.querySelectorAll("#edit-debate-participants .score-row"),
    last = rows[rows.length - 1];
  if (last) {
    last.scrollIntoView({ behavior: "smooth", block: "center" });
    const i = last.querySelector(".picker-search");
    if (i) i.focus();
  }
}

function addDebaterScoreRow(participant = {}) {
  const container = document.getElementById("debater-score-inputs");
  if (!appState.members.length) {
    notify("Add a member before recording scores.");
    return;
  }
  const div = document.createElement("div");
  div.className = "score-row score-component-row score-row-stack";
  const memberOptions = appState.members
    .map(
      (m) =>
        `<option value="${m.id}" ${Number(m.id) === Number(participant.memberId) ? "selected" : ""}>${esc(m.name)}${m.active === false ? " (inactive)" : ""}</option>`,
    )
    .join("");
  const role = scoringRole(participant.role) || SCORING_ROLES[0];
  div.innerHTML = `<div class="score-person"><label>Debater</label>${debaterPickerHtml("deb-member", participant.memberId)}<label style="margin-top:7px">Role</label><select class="deb-role" aria-label="Debate role" onchange="swapCriteria(this,'.score-row')">${roleOptionsHtml(role)}</select></div>${criteriaBoxHtml(role, participantJudges(participant), clampJudges(document.getElementById("new-deb-judges").value))}<button type="button" class="btn danger small remove-score" aria-label="Remove score row" onclick="this.closest('.score-row').remove()">Remove</button>`;
  container.appendChild(div);
}
function updateScoreTotal(input) {
  updateCriteriaTotal(input);
}
function validateComponentScores(row) {
  const role = row.querySelector(".deb-role")?.value;
  const r = readCriteria(row.querySelector(".criteria-box"), role);
  if (r.error) {
    notify(r.error);
    return null;
  }
  return { criteria: r.criteria, score: r.score, judges: r.judges };
}

function handleRecordDebate(event) {
  event.preventDefault();
  if (!isEditor()) return;
  const date = document.getElementById("new-deb-date").value,
    motionId = Number(document.getElementById("new-deb-motion").value),
    result = document.getElementById("new-deb-result").value;
  const rows = [...document.querySelectorAll("#debater-score-inputs .score-row")];
  if (!date || !motionId || !appState.motions.some((m) => Number(m.id) === motionId)) {
    notify("Choose a date and a valid motion.");
    return;
  }
  if (!rows.length) {
    notify("Add at least one debater score.");
    return;
  }
  const participants = [],
    seen = new Set();
  for (const row of rows) {
    const memberId = Number(row.querySelector(".deb-member").value),
      role = row.querySelector(".deb-role").value;
    if (!memberId) {
      notify("Choose a debater for every score row.");
      return;
    }
    const parts = validateComponentScores(row);
    if (!parts) return;
    if (seen.has(memberId)) {
      notify("Each debater can appear only once in a scorecard.");
      return;
    }
    seen.add(memberId);
    participants.push({ memberId, role, ...parts });
  }
  const format = document.getElementById("new-deb-format").value,
    season = document.getElementById("new-deb-season").value.trim() || date.slice(0, 4),
    govTeam = document.getElementById("new-deb-gov").value.trim(),
    oppTeam = document.getElementById("new-deb-opp").value.trim();
  appState.debates.push({
    id: Date.now(),
    date,
    motionId,
    result,
    format,
    season,
    govTeam,
    oppTeam,
    judgeCount: clampJudges(document.getElementById("new-deb-judges").value),
    participants,
  });
  const motion = appState.motions.find((m) => Number(m.id) === motionId);
  if (motion) motion.status = "Debated";
  audit("Recorded debate", `${date} · ${motion.text} · ${participants.length} speaker scorecards`);
  saveState();
  document.getElementById("debate-entry-form").reset();
  document.getElementById("debater-score-inputs").innerHTML = "";
  renderAdmin();
  renderAdminDebateScores();
  renderLeaderboard();
  renderHome();
  renderMemberDashboardIfVisible();
  switchPage("results");
  notify("Debate saved. Leaderboard and member dashboards updated.");
}

function handleCreateMotion(event) {
  event.preventDefault();
  if (!isEditor()) return;
  const text = document.getElementById("adm-motion-text").value.trim(),
    category = document.getElementById("adm-motion-cat").value.trim();
  if (!text || !category) {
    notify("Motion text and category are required.");
    return;
  }
  appState.motions.push({
    id: Date.now(),
    text,
    category,
    status: document.getElementById("adm-motion-status").value,
    format: document.getElementById("adm-motion-format").value,
    difficulty: document.getElementById("adm-motion-difficulty").value,
    info: document.getElementById("adm-motion-info").value.trim(),
  });
  audit("Created motion", text);
  saveState();
  event.target.reset();
  renderAdmin();
  switchPage("motions");
  notify("Motion published.");
}
function revealCalendarItem(id) {
  // Clear view filters after a write so the newly saved item cannot be hidden by a stale search/filter.
  const typeFilter = document.getElementById("calendar-type-filter");
  const dateFilter = document.getElementById("calendar-date-filter");
  const featureFilter = document.getElementById("calendar-feature-filter");
  const search = document.getElementById("calendar-search");
  if (typeFilter) typeFilter.value = "all";
  if (dateFilter) dateFilter.value = "all";
  if (featureFilter) featureFilter.value = "all";
  if (search) search.value = "";
  renderCalendar();
  renderHome();
  switchPage("calendar");
  const card = [...document.querySelectorAll("#calendar-grid .card")].find(
    (el) =>
      el.querySelector("button[onclick*='openSessionEditor(" + Number(id) + ")']") ||
      el.querySelector("h3")?.textContent ===
        String(appState.sessions.find((s) => Number(s.id) === Number(id))?.title || ""),
  );
  if (card) card.scrollIntoView({ behavior: "smooth", block: "center" });
}
function handleCreateSession(event) {
  event.preventDefault();
  if (!isEditor()) return;
  const title = document.getElementById("ses-title").value.trim(),
    date = document.getElementById("ses-date").value,
    location = document.getElementById("ses-location").value.trim(),
    type = document.getElementById("ses-type").value;
  const notes = document.getElementById("ses-notes").value.trim(),
    featured = document.getElementById("ses-featured")?.checked === true;
  if (!title || !location) {
    notify("Title and location are required.");
    return;
  }
  if (!validISODate(date)) {
    notify("Please choose a valid calendar date.");
    return;
  }
  const id = Date.now();
  appState.sessions.push({ id, title, date, location, type, notes, featured });
  audit(
    "Scheduled calendar item",
    `${type}: ${title} · ${date}${featured ? " · Featured on Home" : ""}`,
  );
  if (!saveState()) {
    appState.sessions = appState.sessions.filter((s) => Number(s.id) !== Number(id));
    return;
  }
  event.target.reset();
  renderAdmin();
  revealCalendarItem(id);
  notify(`${title} added to Calendar.`);
}
function handleCreateMember(event) {
  event.preventDefault();
  if (!isEditor()) return;
  const name = document.getElementById("member-name").value.trim(),
    active = document.getElementById("member-active").value === "true";
  if (!name) {
    notify("Enter a member name.");
    return;
  }
  if (appState.members.some((m) => m.name.toLowerCase() === name.toLowerCase())) {
    notify("A member with that name already exists.");
    return;
  }
  appState.members.push({ id: Date.now(), name, active });
  audit("Created member", name);
  saveState();
  event.target.reset();
  renderAdmin();
  notify("Member added.");
}
function renderAdminMotionList() {
  const el = document.getElementById("admin-motion-list");
  if (!el) return;
  el.innerHTML = appState.motions.length
    ? appState.motions
        .map(
          (m) =>
            `<div class="card" style="padding:13px;display:flex;align-items:center;justify-content:space-between;gap:12px"><div><b>${esc(m.text)}</b><div class="card-meta">${esc(m.category)} · ${esc(m.status)}</div></div><div class="actions"><button class="btn secondary small" onclick="editMotion(${Number(m.id)})">Edit</button><button class="btn small" onclick="markMotionDebated(${Number(m.id)})" ${m.status === "Debated" ? "disabled" : ""}>Mark Debated</button><button class="btn gold small" onclick="startResultForMotion(${Number(m.id)})">Add Result</button><button class="btn danger small" onclick="deleteMotion(${Number(m.id)})">Delete</button></div></div>`,
        )
        .join("")
    : '<div class="empty">No motions yet.</div>';
}
function deleteMotion(id) {
  if (!isEditor()) return;
  const m = appState.motions.find((x) => Number(x.id) === Number(id));
  if (!m) return;
  const linked = appState.debates.filter((d) => Number(d.motionId) === Number(id));
  const msg = linked.length
    ? `Delete this motion AND its ${linked.length} recorded debate result(s) with scorecards? This will change member rankings and cannot be undone.`
    : "Delete this motion?";
  if (!confirm(msg)) return;
  audit(
    "Deleted motion",
    m.text + (linked.length ? ` (and ${linked.length} debate result(s))` : ""),
  );
  appState.debates = appState.debates.filter((d) => Number(d.motionId) !== Number(id));
  appState.motions = appState.motions.filter((x) => Number(x.id) !== Number(id));
  saveState();
  closeDetailModal();
  renderAllPortalViews();
  notify("Motion deleted.");
}
async function deleteMember(id) {
  if (!isEditor()) return;
  const m = appState.members.find((x) => Number(x.id) === Number(id));
  if (!m) return;
  const played = appState.debates.filter((d) =>
    (d.participants || []).some((p) => Number(p.memberId) === Number(id)),
  ).length;
  const msg = played
    ? `Permanently delete ${m.name}? They appear in ${played} recorded debate(s). Their name will show as "Removed member" in those results and they will leave the leaderboard. This cannot be undone. (To keep their history, use "Remove from leaderboard" instead.)`
    : `Permanently delete ${m.name}?`;
  if (!confirm(msg)) return;
  appState.members = appState.members.filter((x) => Number(x.id) !== Number(id));
  audit("Deleted member", m.name);
  saveState();
  if (sb) {
    try {
      await sb.rpc("unlink_member", { mid: Number(id) });
    } catch (e) {}
  }
  people.forEach((v) => {
    if (Number(v.member_id) === Number(id)) v.member_id = null;
  });
  renderAllPortalViews();
  notify(m.name + " deleted.");
}
function renderAdminSessionList() {
  const el = document.getElementById("admin-session-list");
  if (!el) return;
  el.innerHTML = appState.sessions.length
    ? '<div class="stack">' +
      [...appState.sessions]
        .sort((a, b) => String(a.date).localeCompare(String(b.date)))
        .map(
          (s) =>
            `<div class="card" style="padding:13px;display:flex;align-items:center;justify-content:space-between;gap:12px"><div><b>${esc(s.title)}</b><div class="card-meta">${esc(sessionType(s))} · ${fmtDate(s.date)} · ${esc(s.location)}</div></div><div class="actions"><button class="btn secondary small" onclick="editSession(${Number(s.id)})">Edit</button><button class="btn danger small" onclick="deleteSession(${Number(s.id)})">Delete</button></div></div>`,
        )
        .join("") +
      "</div>"
    : '<div class="empty">No sessions yet.</div>';
}
function deleteSession(id) {
  if (!isEditor()) return;
  const x = appState.sessions.find((s) => Number(s.id) === Number(id));
  if (!x) return;
  if (!confirm("Delete this session?")) return;
  audit("Deleted session", x.title);
  appState.sessions = appState.sessions.filter((s) => Number(s.id) !== Number(id));
  saveState();
  renderAdminSessionList();
  renderCalendar();
  renderHome();
  notify("Calendar item deleted.");
}
function renderAdminMemberList() {
  const el = document.getElementById("admin-member-list");
  if (!el) return;
  const query = (document.getElementById("admin-member-search")?.value || "")
    .trim()
    .toLocaleLowerCase();
  const stats = calculateLeaderboardStats();
  const members = appState.members
    .map((member) => {
      const profiles = people.filter((profile) => {
        if (!["member", "editor"].includes(profile.role)) return false;
        if (
          profile.member_id !== null &&
          profile.member_id !== undefined &&
          profile.member_id !== ""
        )
          return Number(profile.member_id) === Number(member.id);
        return (
          String(profile.display_name || "")
            .trim()
            .toLocaleLowerCase() ===
          String(member.name || "")
            .trim()
            .toLocaleLowerCase()
        );
      });
      const searchable = [
        member.name,
        ...profiles.flatMap((profile) => [profile.display_name, profile.email]),
      ]
        .join(" ")
        .toLocaleLowerCase();
      return {
        member,
        profiles,
        matched: !query || searchable.includes(query),
      };
    })
    .filter((row) => row.matched);
  el.innerHTML = members.length
    ? '<div class="stack">' +
      members
        .map(({ member: m, profiles }) => {
          const dashboardButtons = profiles
            .map((profile) => {
              const label =
                profiles.length === 1
                  ? "View Dashboard"
                  : `View ${esc(profile.display_name || profile.email || "Member")}`;
              return `<button class="btn gold small" onclick="viewAdminMemberDashboard(\'${esc(profile.id)}\')">${label}</button>`;
            })
            .join("");
          return `<div class="card" style="padding:13px;display:flex;align-items:center;justify-content:space-between;gap:12px"><div><b>${esc(m.name)}</b><div class="card-meta">${m.active === false ? "Inactive" : "Active"} · ${m.excludedFromLeaderboard ? "Excluded from leaderboard" : "Included in leaderboard"} · ${stats.find((x) => Number(x.id) === Number(m.id))?.debatesPlayed || 0} debates</div></div><div class="actions">${dashboardButtons}<button class="btn secondary small" onclick="editMember(${Number(m.id)})">Edit</button><button class="btn secondary small" onclick="toggleMember(${Number(m.id)})">${m.active === false ? "Activate" : "Deactivate"}</button><button class="btn ${m.excludedFromLeaderboard ? "" : "danger"} small" onclick="toggleLeaderboardExclusion(${Number(m.id)})">${m.excludedFromLeaderboard ? "Restore ranking" : "Remove from leaderboard"}</button><button class="btn danger small" onclick="deleteMember(${Number(m.id)})">Delete</button></div></div>`;
        })
        .join("") +
      "</div>"
    : appState.members.length
      ? '<div class="empty">No debaters match this search.</div>'
      : '<div class="empty">No members yet.</div>';
}
function toggleMember(id) {
  if (!isEditor()) return;
  const m = appState.members.find((x) => Number(x.id) === Number(id));
  if (!m) return;
  m.active = m.active === false;
  audit(m.active ? "Activated member" : "Deactivated member", m.name);
  saveState();
  renderAdmin();
  renderHome();
  renderLeaderboard();
  notify(m.name + " is now " + (m.active ? "active" : "inactive") + ".");
}
function openMotionEditor(id = null) {
  if (!isEditor()) {
    notify("Editor access is required.");
    return;
  }
  const m = id === null ? null : appState.motions.find((x) => Number(x.id) === Number(id));
  if (id !== null && !m) return;
  openDetailModal(
    m ? "Edit Motion" : "Add Motion",
    `<form onsubmit="saveMotionEditor(event,${m ? Number(m.id) : "null"})"><div class="form-grid"><div class="field full"><label for="motion-editor-text">Motion Text</label><textarea class="input" id="motion-editor-text" rows="3" required maxlength="400">${esc(m?.text || "")}</textarea></div><div class="field"><label for="motion-editor-category">Category / Tag</label><input class="input" id="motion-editor-category" required maxlength="80" value="${esc(m?.category || "")}"></div><div class="field"><label for="motion-editor-status">Status</label><select class="input" id="motion-editor-status"><option ${!m || m.status !== "Debated" ? "selected" : ""}>Upcoming</option><option ${m?.status === "Debated" ? "selected" : ""}>Debated</option></select></div><div class="field"><label for="motion-editor-format">Debate Format</label><select class="input" id="motion-editor-format">${["Asian Parliamentary", "British Parliamentary", "Public Forum", "Other"].map((x) => `<option ${m?.format === x ? "selected" : ""}>${x}</option>`).join("")}</select></div><div class="field"><label for="motion-editor-difficulty">Difficulty</label><select class="input" id="motion-editor-difficulty">${["Beginner", "Intermediate", "Advanced"].map((x) => `<option ${m?.difficulty === x ? "selected" : ""}>${x}</option>`).join("")}</select></div><div class="field full"><label for="motion-editor-info">Info Slide</label><textarea class="input" id="motion-editor-info" rows="3" maxlength="1200">${esc(m?.info || "")}</textarea></div></div><div class="form-actions"><button type="button" class="btn secondary" onclick="closeDetailModal()">Cancel</button><button class="btn" type="submit">${m ? "Save Motion" : "Create Motion"}</button></div></form>`,
  );
}
function saveMotionEditor(event, id) {
  event.preventDefault();
  if (!isEditor()) return;
  const text = document.getElementById("motion-editor-text").value.trim(),
    category = document.getElementById("motion-editor-category").value.trim(),
    status = document.getElementById("motion-editor-status").value,
    format = document.getElementById("motion-editor-format").value,
    difficulty = document.getElementById("motion-editor-difficulty").value,
    info = document.getElementById("motion-editor-info").value.trim();
  if (!text || !category) {
    notify("Motion text and category are required.");
    return;
  }
  let m = id === null ? null : appState.motions.find((x) => Number(x.id) === Number(id));
  if (m) {
    Object.assign(m, {
      text,
      category,
      status,
      format,
      difficulty,
      info,
      manuallyMarkedDebated: status === "Debated",
      autoDebated: false,
    });
    audit("Updated motion", text);
  } else {
    m = {
      id: Date.now(),
      text,
      category,
      status,
      format,
      difficulty,
      info,
      manuallyMarkedDebated: status === "Debated",
      autoDebated: false,
    };
    appState.motions.push(m);
    audit("Created motion", text);
  }
  saveState();
  closeDetailModal();
  renderAdmin();
  renderMotions();
  renderHome();
  notify(m.status + " motion saved.");
}
function editMotion(id) {
  openMotionEditor(id);
}
function markMotionDebated(id) {
  if (!isEditor()) return;
  const m = appState.motions.find((x) => Number(x.id) === Number(id));
  if (!m) return;
  m.status = "Debated";
  m.manuallyMarkedDebated = true;
  m.autoDebated = false;
  audit("Marked motion debated", m.text);
  saveState();
  renderMotions();
  renderAdminMotionList();
  renderHome();
  notify("Motion marked as debated. Add its result when ready.");
}
function startResultForMotion(id) {
  if (!isEditor()) return;
  const m = appState.motions.find((x) => Number(x.id) === Number(id));
  if (!m) return;
  switchPage("admin");
  switchAdminTab("debates");
  renderAdmin();
  const select = document.getElementById("new-deb-motion");
  if (select) select.value = String(m.id);
  const date = document.getElementById("new-deb-date");
  if (date && !date.value) {
    date.value = localISODate(new Date());
    const season = document.getElementById("new-deb-season");
    if (season) season.value = date.value.slice(0, 4);
  }
  notify("Motion selected. Its status will update when the debate result is saved.");
}
function openSessionEditor(id = null) {
  if (!isEditor()) {
    notify("Editor access is required.");
    return;
  }
  const x = id === null ? null : appState.sessions.find((v) => Number(v.id) === Number(id));
  if (id !== null && !x) return;
  const types = ["Debate", "Event", "Tournament", "Workshop", "Training Session"];
  openDetailModal(
    x ? "Edit Calendar Item" : "Add Calendar Item",
    `<form onsubmit="saveSessionEditor(event,${x ? Number(x.id) : "null"})"><div class="form-grid"><div class="field full"><label for="calendar-editor-title">Title</label><input class="input" id="calendar-editor-title" required maxlength="180" value="${esc(x?.title || "")}" placeholder="Weekly AP Debate / Workshop"></div><div class="field"><label for="calendar-editor-date">Date</label><input class="input" type="date" id="calendar-editor-date" required value="${esc(x?.date || localISODate(new Date()))}"></div><div class="field"><label for="calendar-editor-type">Item Type</label><select class="input" id="calendar-editor-type">${types.map((t) => `<option value="${t}" ${(x ? sessionType(x) : "Debate") === t ? "selected" : ""}>${t === "Event" ? "Club Event" : t}</option>`).join("")}</select></div><div class="field full"><label for="calendar-editor-location">Location</label><input class="input" id="calendar-editor-location" required maxlength="180" value="${esc(x?.location || "")}" placeholder="Auditorium / Room / Online"></div><div class="field full"><label for="calendar-editor-notes">Description / Notes</label><textarea class="input" id="calendar-editor-notes" rows="3" maxlength="1200">${esc(x?.notes || "")}</textarea></div><div class="field full"><label><input type="checkbox" id="calendar-editor-featured" ${x?.featured === true ? "checked" : ""}> Feature this item on the Home page</label><small class="subtle">Only future items marked “Feature this item on the Home page” appear in the Home page sections.</small></div></div><div class="form-actions"><button type="button" class="btn secondary" onclick="closeDetailModal()">Cancel</button><button class="btn" type="submit">${x ? "Save Changes" : "Add to Calendar"}</button></div></form>`,
  );
}
function saveSessionEditor(event, id) {
  event.preventDefault();
  if (!isEditor()) return;
  const title = document.getElementById("calendar-editor-title").value.trim(),
    date = document.getElementById("calendar-editor-date").value,
    type = document.getElementById("calendar-editor-type").value,
    location = document.getElementById("calendar-editor-location").value.trim(),
    notes = document.getElementById("calendar-editor-notes").value.trim(),
    featured = document.getElementById("calendar-editor-featured").checked;
  if (!title || !validISODate(date) || !location) {
    notify("Enter a title, valid date, and location.");
    return;
  }
  let x = id === null ? null : appState.sessions.find((v) => Number(v.id) === Number(id));
  if (id !== null && !x) {
    notify("Calendar item not found.");
    return;
  }
  const isNew = !x,
    old = isNew ? null : { ...x };
  if (x) {
    Object.assign(x, { title, date, type, location, notes, featured });
    audit("Updated calendar item", `${type}: ${title} · ${date}`);
  } else {
    x = { id: Date.now(), title, date, type, location, notes, featured };
    appState.sessions.push(x);
    audit("Scheduled calendar item", `${type}: ${title} · ${date}`);
  }
  if (!saveState()) {
    if (isNew) appState.sessions = appState.sessions.filter((s) => Number(s.id) !== Number(x.id));
    else Object.assign(x, old);
    return;
  }
  closeDetailModal();
  renderAdmin();
  revealCalendarItem(x.id);
  notify(isNew ? `${x.title} added to Calendar.` : `${x.title} updated in Calendar.`);
}
function editSession(id) {
  openSessionEditor(id);
}
function toggleSessionFeatured(id) {
  if (!isEditor()) return;
  const x = appState.sessions.find((v) => Number(v.id) === Number(id));
  if (!x) return;
  x.featured = x.featured !== true;
  audit(
    x.featured ? "Featured calendar item on Home" : "Removed calendar item from Home features",
    x.title,
  );
  saveState();
  renderCalendar();
  renderHome();
  notify(
    x.title + (x.featured ? " will be featured on Home." : " is no longer specially featured."),
  );
}
function editMember(id) {
  if (!isEditor()) return;
  const m = appState.members.find((x) => Number(x.id) === Number(id));
  if (!m) return;
  const name = prompt("Member full name:", m.name);
  if (name === null) return;
  if (!name.trim()) {
    notify("Member name cannot be empty.");
    return;
  }
  if (
    appState.members.some(
      (x) => x.id !== m.id && x.name.toLowerCase() === name.trim().toLowerCase(),
    )
  ) {
    notify("That member name already exists.");
    return;
  }
  m.name = name.trim();
  audit("Renamed member", m.name);
  saveState();
  renderAdmin();
  renderLeaderboard();
  renderHome();
  renderResults();
  notify("Member updated.");
}
function editDebate(id) {
  if (!isEditor()) return;
  const d = appState.debates.find((x) => Number(x.id) === Number(id));
  if (!d) return;
  document.getElementById("edit-debate-id").value = String(d.id);
  document.getElementById("edit-debate-date").value = d.date || "";
  document.getElementById("edit-debate-result").value = d.result || "Draw";
  document.getElementById("edit-debate-format").value = d.format || "Asian Parliamentary";
  document.getElementById("edit-debate-season").value =
    d.season || String(d.date || "").slice(0, 4);
  document.getElementById("edit-debate-gov").value = d.govTeam || "";
  document.getElementById("edit-debate-opp").value = d.oppTeam || "";
  document.getElementById("edit-debate-motion").innerHTML = appState.motions
    .map((m) => `<option value="${m.id}">${esc(m.text)}</option>`)
    .join("");
  document.getElementById("edit-debate-motion").value = String(d.motionId);
  document.getElementById("edit-debate-judges").value = debateJudgeCount(d);
  const wrap = document.getElementById("edit-debate-participants");
  wrap.innerHTML = "";
  const savedParticipants = Array.isArray(d.participants) ? d.participants : [];
  if (savedParticipants.length) savedParticipants.forEach((p) => addEditDebaterRow(p));
  else addEditDebaterRow();
  document.getElementById("debate-edit-modal").classList.add("open");
}
function closeDebateEditor() {
  document.getElementById("debate-edit-modal").classList.remove("open");
}
function addEditDebaterRow(participant = {}) {
  const wrap = document.getElementById("edit-debate-participants");
  if (!wrap) {
    notify("Debater scorecard editor is not available.");
    return;
  }
  if (!appState.members.length) {
    notify("Add a member before adding a debater.");
    return;
  }
  const row = document.createElement("div");
  row.className = "score-row score-component-row score-row-stack";
  const memberOptions = appState.members
    .map(
      (m) =>
        `<option value="${m.id}" ${Number(m.id) === Number(participant.memberId) ? "selected" : ""}>${esc(m.name)}${m.active === false ? " (inactive)" : ""}</option>`,
    )
    .join("");
  const role = scoringRole(participant.role) || SCORING_ROLES[0];
  const legacyNote =
    participant.memberId !== undefined && !participant.criteria
      ? `<div class="notice" style="grid-column:1/-1">This is an older Matter/Manner/Method score. The total was spread across the new criteria  ·  please review and adjust each one.</div>`
      : "";
  row.innerHTML = `<div class="score-person"><label>Debater</label>${debaterPickerHtml("edit-participant-member", participant.memberId)}<label style="margin-top:7px">Role</label><select class="edit-participant-role" aria-label="Debate role" onchange="swapCriteria(this,'.score-row')">${roleOptionsHtml(role)}</select></div>${legacyNote}${criteriaBoxHtml(role, participantJudges(participant), clampJudges(document.getElementById("edit-debate-judges").value))}<button type="button" class="btn danger small" onclick="this.closest('.score-row').remove()">Remove</button>`;
  wrap.appendChild(row);
}
function updateEditScoreTotal(input) {
  updateCriteriaTotal(input);
}
async function saveDebateEditor(event) {
  event.preventDefault();
  if (!isEditor()) return;
  const id = Number(document.getElementById("edit-debate-id").value),
    d = appState.debates.find((x) => Number(x.id) === id);
  if (!d) return;
  const date = document.getElementById("edit-debate-date").value,
    motionId = Number(document.getElementById("edit-debate-motion").value),
    result = document.getElementById("edit-debate-result").value;
  if (!date || !appState.motions.some((m) => Number(m.id) === motionId)) {
    notify("Choose a valid date and motion.");
    return;
  }
  const participantWrap = document.getElementById("edit-debate-participants");
  const rows = [...participantWrap.children].filter((el) => el.classList.contains("score-row"));
  if (!rows.length) {
    notify("A debate must have at least one debater score.");
    return;
  }
  const participants = [],
    seen = new Set();
  for (const row of rows) {
    const memberId = Number(row.querySelector(".edit-participant-member").value),
      role = row.querySelector(".edit-participant-role").value;
    if (!memberId) {
      notify(
        "Choose a debater for every score row. New rows start blank so each debater can be selected individually.",
      );
      return;
    }
    const res = readCriteria(row.querySelector(".criteria-box"), role);
    if (res.error) {
      notify(res.error);
      return;
    }
    if (seen.has(memberId)) {
      notify(
        "The same debater is selected more than once. Choose a different debater in each row.",
      );
      return;
    }
    seen.add(memberId);
    participants.push({
      memberId,
      role,
      criteria: res.criteria,
      score: res.score,
      max: roleMax(role),
      judges: res.judges,
    });
  }
  const previousMotion = appState.motions.find((m) => Number(m.id) === Number(d.motionId));
  if (
    previousMotion &&
    Number(previousMotion.id) !== motionId &&
    previousMotion.autoDebated === true &&
    !appState.debates.some(
      (x) => Number(x.id) !== id && Number(x.motionId) === Number(previousMotion.id),
    )
  ) {
    previousMotion.status = "Upcoming";
    previousMotion.autoDebated = false;
  }
  Object.assign(d, {
    date,
    motionId,
    result,
    format: document.getElementById("edit-debate-format").value,
    season: document.getElementById("edit-debate-season").value.trim() || date.slice(0, 4),
    govTeam: document.getElementById("edit-debate-gov").value.trim(),
    oppTeam: document.getElementById("edit-debate-opp").value.trim(),
    judgeCount: clampJudges(document.getElementById("edit-debate-judges").value),
    participants,
  });
  const motion = appState.motions.find((m) => Number(m.id) === motionId);
  if (motion) motion.status = "Debated";
  audit(
    "Edited debate",
    `${date} · ${motion?.text || "Motion"} · ${participants.length} speaker scorecards`,
  );
  clearTimeout(saveTimer);
  const saved = await pushState();
  if (!saved) {
    notify(
      "The changes are still in this editor session but were not confirmed saved to the server. Check your connection and try Save again.",
    );
    return;
  }
  closeDebateEditor();
  renderResults();
  renderAdmin();
  renderAdminDebateScores();
  renderLeaderboard();
  renderHome();
  renderMemberDashboardIfVisible();
  notify(`Debate and all ${participants.length} debater scorecards saved successfully.`);
}

function deleteDebate(id) {
  if (!isEditor()) return;
  const d = appState.debates.find((x) => Number(x.id) === Number(id));
  if (
    !d ||
    !confirm("Delete this debate result and its scorecard? This will update member rankings.")
  )
    return;
  audit("Deleted debate", `${d.date} · debate #${d.id}`);
  appState.debates = appState.debates.filter((x) => Number(x.id) !== Number(id));
  const motion = appState.motions.find((m) => Number(m.id) === Number(d.motionId));
  if (
    motion &&
    motion.autoDebated === true &&
    motion.manuallyMarkedDebated !== true &&
    !appState.debates.some((x) => Number(x.motionId) === Number(motion.id))
  ) {
    motion.status = "Upcoming";
    motion.autoDebated = false;
  }
  saveState();
  renderResults();
  renderLeaderboard();
  renderHome();
  renderAdmin();
  renderAdminDebateScores();
  renderMemberDashboardIfVisible();
  notify("Debate result deleted.");
}
function handleCreateScript(event) {
  event.preventDefault();
  if (!isEditor()) return;
  const title = document.getElementById("script-title").value.trim(),
    author = document.getElementById("script-author").value.trim(),
    category = document.getElementById("script-category").value.trim(),
    role = document.getElementById("script-role").value,
    body = document.getElementById("script-body").value.trim(),
    motionId = Number(document.getElementById("script-motion").value),
    motion = debatedMotions().find((m) => Number(m.id) === motionId);
  if (!title || !author || !category || !role || !body || !motion) {
    notify("Choose a debated topic and complete every script field.");
    return;
  }
  appState.scripts.push({
    id: Date.now(),
    motionId,
    topic: motion.text,
    title,
    author,
    category,
    role,
    body,
  });
  audit("Published topic script", `${motion.text} · ${role} · ${title}`);
  saveState();
  event.target.reset();
  populateScriptTopicControls();
  renderAdminScriptList();
  renderScripts();
  renderHome();
  notify("Script published under the selected debated topic and role.");
}
function renderAdminScriptList() {
  const el = document.getElementById("admin-script-list");
  if (!el) return;
  populateScriptTopicControls();
  el.innerHTML = appState.scripts.length
    ? [...appState.scripts]
        .sort(
          (a, b) =>
            String(a.topic || "").localeCompare(String(b.topic || "")) ||
            String(a.role || "").localeCompare(String(b.role || "")),
        )
        .map((s) => {
          const m = appState.motions.find((x) => Number(x.id) === Number(s.motionId));
          return `<article class="card"><div class="card-top"><b>${esc(s.title)}</b><span class="pill gold">${esc(s.category)}</span><span class="pill blue">${esc(normalizeDebateRole(s.role))}</span></div><p><b>Topic:</b> ${esc(m?.text || s.topic || "Unassigned legacy resource")}</p><p class="card-meta">${esc(s.author)}</p><p>${esc(s.body)}</p><div class="actions"><button class="btn secondary small" onclick="editScript(${Number(s.id)})">Edit</button><button class="btn danger small" onclick="deleteScript(${Number(s.id)})">Delete</button></div></article>`;
        })
        .join("")
    : '<div class="empty">No scripts yet. Record a debate, then add scripts to that motion for each role.</div>';
}
function openAdminScriptForTopic(motionId, role) {
  if (!isEditor()) return;
  switchPage("admin");
  switchAdminTab("scripts");
  populateScriptTopicControls();
  const select = document.getElementById("script-motion");
  if (select) select.value = String(motionId);
  const roleSelect = document.getElementById("script-role");
  if (roleSelect && role) roleSelect.value = role;
  document.getElementById("script-title")?.focus();
  notify("Choose the role and enter a script for this debated topic.");
}
function editScript(id) {
  if (!isEditor()) return;
  const s = appState.scripts.find((x) => Number(x.id) === Number(id));
  if (!s) return;
  const title = prompt("Script title:", s.title);
  if (title === null) return;
  const author = prompt("Author:", s.author);
  if (author === null) return;
  const category = prompt("Script type / focus:", s.category);
  if (category === null) return;
  const topicList = debatedMotions();
  if (!topicList.length) {
    notify("Record a debate before assigning scripts to topics.");
    return;
  }
  const topicChoices = topicList.map((m, i) => `${i + 1}. ${m.text}`).join("\n");
  const currentIndex = Math.max(
    0,
    topicList.findIndex((m) => Number(m.id) === Number(s.motionId)),
  );
  const topicAnswer = prompt(
    "Choose the debated topic number:\n" + topicChoices,
    String(currentIndex + 1),
  );
  if (topicAnswer === null) return;
  const motion = topicList[Number(topicAnswer) - 1];
  if (!motion) {
    notify("Invalid debated topic selection.");
    return;
  }
  const roles = [
    "Prime Minister",
    "Leader of Opposition",
    "Deputy Prime Minister",
    "Deputy Leader of Opposition",
    "Government Whip",
    "Opposition Whip",
    "Member of Government",
    "Member of Opposition",
    "Reply Speaker",
    "Adjudicator",
    "General / All Roles",
  ];
  const roleAnswer = prompt(
    "Choose role:\n" + roles.map((r, i) => `${i + 1}. ${r}`).join("\n"),
    String(Math.max(1, roles.indexOf(normalizeDebateRole(s.role)) + 1)),
  );
  if (roleAnswer === null) return;
  const role = normalizeDebateRole(roles[Number(roleAnswer) - 1]);
  if (!role) {
    notify("Invalid role selection.");
    return;
  }
  const body = prompt("Full script content:", s.body);
  if (body === null) return;
  if (!title.trim() || !author.trim() || !category.trim() || !body.trim()) {
    notify("All script fields are required.");
    return;
  }
  Object.assign(s, {
    title: title.trim(),
    author: author.trim(),
    category: category.trim(),
    motionId: Number(motion.id),
    topic: motion.text,
    role,
    body: body.trim(),
  });
  audit("Edited topic script", `${motion.text} · ${role} · ${s.title}`);
  saveState();
  renderAdminScriptList();
  renderScripts();
  renderHome();
  notify("Script and topic/role assignment updated.");
}

function deleteScript(id) {
  if (!isEditor()) return;
  const s = appState.scripts.find((x) => Number(x.id) === Number(id));
  if (!s || !confirm("Delete this training resource?")) return;
  audit("Deleted script", s.title);
  appState.scripts = appState.scripts.filter((x) => Number(x.id) !== Number(id));
  saveState();
  renderAdminScriptList();
  renderScripts();
  renderHome();
  notify("Training resource deleted.");
}
function openDetailModal(title, html) {
  document.getElementById("detail-modal-title").textContent = title;
  document.getElementById("detail-modal-body").innerHTML = html;
  document.getElementById("detail-modal").classList.add("open");
}
function closeDetailModal() {
  document.getElementById("detail-modal").classList.remove("open");
}
function viewScriptDetail(id) {
  const x = appState.scripts.find((s) => Number(s.id) === Number(id));
  if (!x) return;
  const motion = appState.motions.find((m) => Number(m.id) === Number(x.motionId));
  openDetailModal(
    x.title,
    `<p><span class="pill gold">${esc(x.category)}</span> <span class="role-chip">${esc(x.role || "General / All Roles")}</span></p><p><b>Debated topic:</b> ${esc(motion?.text || x.topic || "Unassigned legacy resource")}</p><p><b>Author:</b> ${esc(x.author || "Not specified")}</p><div>${esc(x.body || "")}</div><div class="form-actions"><button class="btn" onclick="copyScript(${Number(x.id)})">Copy Script</button></div>`,
  );
}
function copyScript(id) {
  const x = appState.scripts.find((s) => Number(s.id) === Number(id));
  if (x) copyText(String(x.body || ""));
}
function copyText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard
      .writeText(text)
      .then(() => notify("Copied to clipboard."))
      .catch(() => fallbackCopy(text));
  } else fallbackCopy(text);
}
function fallbackCopy(text) {
  const t = document.createElement("textarea");
  t.value = text;
  document.body.appendChild(t);
  t.select();
  try {
    document.execCommand("copy");
    notify("Copied to clipboard.");
  } catch (e) {
    notify("Copy is unavailable in this browser.");
  }
  t.remove();
}
function toggleDarkMode() {
  document.body.classList.toggle("dark");
  const on = document.body.classList.contains("dark");
  try {
    localStorage.setItem("cpscrdc_theme", on ? "dark" : "light");
  } catch (e) {}
  document.querySelectorAll(".theme-toggle").forEach((b) => (b.textContent = on ? "☀" : "☾"));
}
/* Member and account administration */
let people = [];
async function refreshPeople() {
  if (!sb || !isEditor()) return;
  const { data, error } = await sb
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) {
    notify("Could not load people: " + error.message);
    return;
  }
  people = data || [];
  renderAdminUsers();
}
function personRoleLabel(r) {
  return r === "editor"
    ? "admin"
    : r === "member"
      ? "member"
      : r === "pending"
        ? "pending"
        : "removed";
}
function renderAdminUsers() {
  const pendEl = document.getElementById("admin-pending-list"),
    listEl = document.getElementById("admin-people-list");
  if (!pendEl || !listEl) return;
  const query = (document.getElementById("admin-people-search")?.value || "")
    .trim()
    .toLocaleLowerCase();
  const matches = (x) =>
    !query ||
    [
      x.display_name,
      x.email,
      personRoleLabel(x.role),
      appState.members.find((m) => Number(m.id) === Number(x.member_id))?.name,
    ].some((v) =>
      String(v || "")
        .toLocaleLowerCase()
        .includes(query),
    );
  const allPending = people.filter((x) => x.role === "pending"),
    pending = allPending.filter(matches);
  const badge = document.getElementById("pending-badge");
  if (badge) {
    badge.textContent = allPending.length;
    badge.classList.toggle("hidden", !allPending.length);
  }
  const me = appState.currentUser ? appState.currentUser.id : null;
  pendEl.innerHTML = pending.length
    ? pending
        .map(
          (x) =>
            `<article class="card"><div class="card-top"><div><b>${esc(x.display_name)}</b><div class="card-meta">${esc(x.email || "")} · requested ${fmtDate((x.created_at || "").slice(0, 10))}</div></div><span class="pill gold">pending</span></div><div class="actions"><button class="btn small" onclick="setPersonRole(\'${esc(x.id)}\',\'member\')">Approve as Member</button><button class="btn danger small" onclick="setPersonRole(\'${esc(x.id)}\',\'rejected\')">Decline</button></div></article>`,
        )
        .join("")
    : query
      ? '<div class="empty">No pending requests match this search.</div>'
      : '<div class="empty">No pending requests.</div>';
  const others = people.filter((x) => x.role !== "pending" && matches(x));
  const opts = (sel) =>
    '<option value="">No linked debater</option>' +
    appState.members
      .map(
        (m) =>
          `<option value="${Number(m.id)}" ${Number(sel) === Number(m.id) ? "selected" : ""}>${esc(m.name)}</option>`,
      )
      .join("");
  listEl.innerHTML = others.length
    ? others
        .map((x) => {
          const id = esc(x.id);
          let btns;
          if (x.id === me) btns = `<span class="card-meta">This is you</span>`;
          else if (x.role === "editor")
            btns = `<button class="btn secondary small" onclick="setPersonRole(\'${id}\',\'member\')">Remove Admin Rights</button><button class="btn danger small" onclick="setPersonRole(\'${id}\',\'rejected\')">Remove Access</button>`;
          else if (x.role === "member")
            btns = `<button class="btn small" onclick="setPersonRole(\'${id}\',\'editor\')">Make Admin</button><button class="btn danger small" onclick="setPersonRole(\'${id}\',\'rejected\')">Remove Access</button>`;
          else
            btns = `<button class="btn secondary small" onclick="setPersonRole(\'${id}\',\'member\')">Restore as Member</button>`;
          if ((x.role === "member" || x.role === "editor") && !x.member_id)
            btns =
              `<button class="btn gold small" onclick="addPersonAsDebater(\'${id}\')">Add to Debater List</button>` +
              btns;
          const link =
            x.role === "rejected"
              ? ""
              : `<div class="field" style="margin-top:10px"><label>Linked debater record</label><select class="input" onchange="linkPerson(\'${id}\',this.value)">${opts(x.member_id)}</select></div>`;
          return `<article class="card"><div class="card-top"><div><b>${esc(x.display_name)}</b><div class="card-meta">${esc(x.email || "")}</div></div><span class="pill ${x.role === "editor" ? "gold" : "blue"}">${esc(personRoleLabel(x.role))}</span></div>${link}<div class="actions" style="margin-top:10px">${btns}</div></article>`;
        })
        .join("")
    : query
      ? '<div class="empty">No signed-in members match this search.</div>'
      : '<div class="empty">No members yet.</div>';
}
function viewAdminMemberDashboard(profileId) {
  if (!isEditor()) {
    notify("Admin access is required.");
    return;
  }
  const profile = people.find((x) => String(x.id) === String(profileId));
  if (!profile || !["member", "editor"].includes(profile.role)) {
    notify("This account does not have a member dashboard.");
    return;
  }
  adminDashboardProfile = {
    id: profile.id,
    email: profile.email || "",
    username: profile.email || profile.display_name || "",
    displayName: profile.display_name || profile.email || "Member",
    role: profile.role,
    memberId: profile.member_id,
  };
  switchPage("member");
}
function openOwnMemberDashboard() {
  adminDashboardProfile = null;
  switchPage("member");
}
function returnToAdminMembers() {
  if (!isEditor()) {
    switchPage("home");
    return;
  }
  adminDashboardProfile = null;
  switchPage("admin");
  switchAdminTab("members");
}

async function setPersonRole(id, role) {
  if (!isEditor() || id === appState.currentUser.id) return;
  const x = people.find((v) => v.id === id);
  if (!x) return;
  const msg = {
    editor: `Make ${x.display_name} an admin? Admins can edit all portal data and manage members.`,
    rejected: `Remove portal access for ${x.display_name}?`,
  }[role];
  if (msg && !confirm(msg)) return;
  const { data, error } = await sb.from("profiles").update({ role }).eq("id", id).select();
  if (error || !data || !data.length) {
    notify("Could not update: " + (error ? error.message : "not allowed"));
    return;
  }
  let extra = "";
  if ((role === "member" || role === "editor") && !x.member_id) {
    const mid = await ensureDebater(x);
    extra = mid
      ? " Added to the debater list."
      : " Could not add to the debater list - use the Add to Debater List button.";
  }
  audit("Changed access", `${x.email} → ${personRoleLabel(role)}`);
  saveState();
  await refreshPeople();
  renderAllPortalViews();
  notify(`${x.display_name} is now: ${personRoleLabel(role)}.${extra}`);
}
async function ensureDebater(x) {
  if (!sb || !isEditor()) return null;
  if (x.member_id && appState.members.some((m) => Number(m.id) === Number(x.member_id)))
    return x.member_id;
  const taken = new Set(
    people.filter((v) => v.member_id && v.id !== x.id).map((v) => Number(v.member_id)),
  );
  let m = appState.members.find(
    (v) =>
      v.name.trim().toLowerCase() === x.display_name.trim().toLowerCase() &&
      !taken.has(Number(v.id)),
  );
  const isNew = !m;
  if (isNew) m = { id: Date.now(), name: x.display_name.trim(), active: true };
  const { data, error } = await sb.rpc("link_member", {
    target: x.id,
    mid: m.id,
  });
  if (error || data !== true) {
    console.error(error);
    return null;
  }
  if (isNew) {
    appState.members.push(m);
    audit("Created member", m.name);
  }
  x.member_id = m.id;
  saveState();
  return m.id;
}
async function addPersonAsDebater(id) {
  const x = people.find((v) => v.id === id);
  if (!x || !isEditor()) return;
  const mid = await ensureDebater(x);
  if (!mid) {
    notify("Could not add to the debater list. Make sure the latest SQL fix was run in Supabase.");
    return;
  }
  renderAllPortalViews();
  await refreshPeople();
  notify(x.display_name + " added to the debater list.");
}
async function linkPerson(id, val) {
  if (!isEditor()) return;
  const { data, error } = await sb.rpc("link_member", {
    target: id,
    mid: val ? Number(val) : null,
  });
  if (error || data !== true) {
    notify("Could not save link: " + (error ? error.message : "not allowed"));
    return;
  }
  const x = people.find((v) => v.id === id);
  if (x) x.member_id = val ? Number(val) : null;
  notify("Debater link saved.");
}
function renderAuditLog() {
  const el = document.getElementById("admin-audit-log-body");
  if (!el) return;
  el.innerHTML = appState.auditLog?.length
    ? appState.auditLog
        .slice(0, 150)
        .map(
          (a) =>
            `<div class="audit-entry"><div class="card-top"><b>${esc(a.action)}</b><span class="card-meta">${new Date(a.at).toLocaleString()}</span></div><div>${esc(a.details)}</div><div class="card-meta">By ${esc(a.user || "System")}</div></div>`,
        )
        .join("")
    : '<div class="empty">No logged actions yet. New administrative changes will appear here.</div>';
}
function exportPortalData() {
  if (!isEditor()) return;
  const payload = {
    ...appState,
    currentUser: null,
    exportedAt: new Date().toISOString(),
    schemaVersion: 3,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    }),
    url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = `cpscrdc-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  audit("Exported backup", a.download || "JSON backup");
  saveState();
  notify("Backup export started.");
}
async function restorePortalData(event) {
  if (!isEditor()) return;
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const data = JSON.parse(String(reader.result));
      if (!data || typeof data !== "object" || Array.isArray(data))
        throw new Error("Backup must contain a JSON object.");
      const arrayKeys = [
        "members",
        "motions",
        "debates",
        "adjustments",
        "sessions",
        "scripts",
        "achievements",
      ];
      for (const k of arrayKeys)
        if (
          data[k] !== undefined &&
          (!Array.isArray(data[k]) ||
            data[k].some((item) => !item || typeof item !== "object" || Array.isArray(item)))
        )
          throw new Error("Invalid field: " + k + " must be an array of objects.");
      if (!Array.isArray(data.auditLog) && data.auditLog !== undefined)
        throw new Error("Invalid audit log.");
      if (!confirm("Restore this backup? Current portal data will be replaced.")) return;
      // Validate everything before changing live state, then commit the snapshot as one unit.
      const previous = clone(appState);
      const next = { ...appState };
      for (const k of arrayKeys) if (Array.isArray(data[k])) next[k] = data[k];
      next.auditLog = Array.isArray(data.auditLog) ? data.auditLog : [];
      appState = next;
      audit("Restored backup", file.name);
      clearTimeout(saveTimer);
      if (!(await pushState())) {
        appState = previous;
        renderAllPortalViews();
        throw new Error(
          "The backup could not be saved to the server; previous data was restored in memory.",
        );
      }
      renderAllPortalViews();
      notify("Backup restored successfully.");
    } catch (e) {
      notify("Could not restore backup: " + e.message);
    } finally {
      event.target.value = "";
    }
  };
  reader.readAsText(file);
}
function resetPortalData() {
  if (
    !isEditor() ||
    !confirm(
      "Reset ALL portal data (for everyone) to the built-in sample dataset? This cannot be undone unless you exported a backup.",
    )
  )
    return;
  const cu = appState.currentUser;
  appState = clone(defaultState);
  appState.currentUser = cu;
  audit("Reset demo data", "Restored built-in sample dataset");
  saveState();
  renderAllPortalViews();
  switchPage("admin");
  notify("Demo data restored.");
}
/* Full portal rendering and startup */
function renderAllPortalViews() {
  renderHome();
  renderLeaderboard();
  renderMotions();
  renderResults();
  renderCalendar();
  renderAchievements();
  if (hasMemberAccess()) renderScripts();
  if (isEditor()) {
    renderAdmin();
    renderAdminDebateScores();
    renderAdminUsers();
    renderAuditLog();
  }
  renderMemberDashboardIfVisible();
}
function renderMemberDashboard() {
  const adminViewing = !!adminDashboardProfile && isEditor();
  if (!hasMemberAccess()) {
    switchPage("home");
    return;
  }
  const user = adminViewing ? adminDashboardProfile : appState.currentUser;
  const linked =
    appState.members.find(
      (m) =>
        user.memberId !== undefined &&
        user.memberId !== null &&
        Number(m.id) === Number(user.memberId),
    ) ||
    appState.members.find(
      (m) =>
        String(m.name).toLowerCase() === String(user.displayName || "").toLowerCase() ||
        String(m.name).toLowerCase() === String(user.username || user.email || "").toLowerCase(),
    );
  const activeSeason = document.getElementById("leaderboard-season-select")?.value || "all";
  const myDebates = linked
    ? appState.debates
        .filter(
          (d) =>
            (activeSeason === "all" ||
              String(d.season || String(d.date || "").slice(0, 4)) === String(activeSeason)) &&
            (d.participants || []).some((p) => Number(p.memberId) === Number(linked.id)),
        )
        .sort((a, b) => String(b.date).localeCompare(String(a.date)))
    : [];
  const stats = linked
    ? calculateLeaderboardStats(activeSeason).find((x) => Number(x.id) === Number(linked.id))
    : null;
  const el = document.getElementById("member-dashboard-content");
  const displayName = linked
    ? linked.name
    : user.displayName || user.username || user.email || "Member";
  const historyTitle = adminViewing
    ? `Debate History · ${esc(displayName)}`
    : "My Recent Debate Scorecards";
  const historyAction = adminViewing
    ? '<button class="btn secondary small" onclick="returnToAdminMembers()">Back to Members</button>'
    : '<button class="btn secondary small" onclick="switchPage(\'results\')">All Results</button>';
  const breakdownOpen = window.matchMedia("(min-width: 641px)").matches ? " open" : "";
  el.innerHTML = `<div class="stats"><div class="stat"><div><strong>${esc(displayName)}</strong><span>${adminViewing ? "Admin view · " : "Signed in as "}${esc(user.role)}</span></div></div><div class="stat"><div><strong>${stats ? stats.debatesPlayed : 0}</strong><span>Debates recorded</span></div></div><div class="stat"><div><strong>${stats && stats.average !== null ? fmt2(stats.average) + "%" : "Not available"}</strong><span>Average score</span></div></div><div class="stat"><div><strong>${stats ? fmt2(stats.totalPoints) : "0.00"}</strong><span>Total points</span></div></div></div><div class="panel"><div class="panel-head member-dashboard-head"><h3>${historyTitle}</h3><div class="actions">${historyAction}</div></div>${
    linked && myDebates.length
      ? myDebates
          .map((d) => {
            const m = appState.motions.find((x) => Number(x.id) === Number(d.motionId));
            const part = (d.participants || []).find(
              (p) => Number(p.memberId) === Number(linked.id),
            );
            return `<article class="card member-history-card"><div class="card-top"><span class="card-meta">${fmtDate(d.date)} · ${esc(d.format || "Asian Parliamentary")} · Season ${esc(d.season || String(d.date || "").slice(0, 4))}</span><span class="pill ${d.result === "Gov Win" ? "" : "blue"}">${esc(d.result)}</span></div><h4 class="member-history-motion">${esc(m ? m.text : "Motion unavailable")}</h4><p class="member-history-score">Role: ${esc(part.role || "Not recorded")} · Score: <b>${fmt2(part.score)}/${participantMax(part)}</b> (${fmt2(participantPercent(part))}%)</p><details class="member-score-details"${breakdownOpen}><summary>Score breakdown</summary><div class="card-meta">${criteriaSummary(part)}</div></details></article>`;
          })
          .join("")
      : '<div class="empty">No linked member record or scorecards found for this account yet. An editor can update the member name to match your account display name.</div>'
  }</div><div class="panel"><div class="panel-head"><h3>Training Resources</h3><button class="btn secondary small" onclick="switchPage(\'scripts\')">Open Scripts Library</button></div><p class="subtle">Access scripts, speaking frameworks, and adjudication notes from the Scripts Library.</p></div>`;
}

function renderMemberDashboardIfVisible() {
  if (document.getElementById("page-member")?.classList.contains("active") && hasMemberAccess())
    renderMemberDashboard();
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeLoginModal();
    closeDebateEditor();
    closeDetailModal();
  }
});
document.getElementById("year").textContent = new Date().getFullYear();
try {
  if (localStorage.getItem("cpscrdc_theme") === "dark") {
    document.body.classList.add("dark");
    document.querySelectorAll(".theme-toggle").forEach((b) => (b.textContent = "☀"));
  }
} catch (e) {}
(async () => {
  if (!sb) {
    updateNavbarAuth();
    showPage(location.hash.slice(1) || "home", false);
    notify(sbError || "Not connected to the server.");
    return;
  }
  await loadSession();
  await loadRemote();
  updateNavbarAuth();
  showPage(location.hash.slice(1) || "home", false);
  if (isEditor()) refreshPeople();
})();
