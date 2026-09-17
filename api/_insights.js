// The AI write-up behind the Analysis page: Gemini through OpenRouter, reading the
// same numbers the page shows (api/_analysis.js) plus the recorded quotes.
//
// Rules of the house: the model may only interpret the numbers it is given, never
// invent any. Every run is stored in `insights`, so a page view costs nothing and
// the page can say how old the write-up is.

import { LABELS } from './_analysis.js';

const OPENROUTER = 'https://openrouter.ai/api/v1/chat/completions';
export const MODEL = () => process.env.OPENROUTER_MODEL || 'google/gemini-3.8-flash';
export const hasKey = () => !!process.env.OPENROUTER_API_KEY;

// What the model is allowed to see: the counts from /api/analysis, with keys
// spelled out in words, and the quotes as they were said.
export function brief(a, days) {
  const f = a.funnel;
  const label = (map, k) => (map?.[k] ?? k);   // always English keys for the model; it answers in the page language
  return {
    range_days: days,
    calls: {
      total: f.total, reached_a_person: f.reached, answered_the_question: f.answered,
      will_vote: f.yes, will_not_vote: f.no, unsure: f.unsure, refused: f.refused,
      not_reached: f.notReached, no_analysis_yet: f.noAnalysis,
      hung_up_in_first_12s: f.hungUpEarly, asked_to_be_removed: f.optOut,
      asked_if_bot: f.askedIfBot, bad_audio: f.qualityBad,
      avg_seconds_when_answered: f.avgSecondsAnswered, avg_seconds_when_not_reached: f.avgSecondsNotReached,
      cost_usd: Number(f.cost || 0).toFixed(2),
    },
    reasons_for_no_or_unsure: a.reasons.map((r) => ({ reason: label(LABELS.en.reason, r.key), people: r.n })),
    how_calls_ended_without_an_answer: a.endedReasons.map((e) => ({ ended: label(LABELS.en.ended, e.key), calls: e.n })),
    what_yoav_did: {
      asked_why_when_someone_said_no: a.approach.askedReason, said_the_closing_line: a.approach.closingDelivered,
      thanked_a_yes: a.approach.thankedYes, person_asked_her_a_question: a.approach.askedQuestion,
      real_conversations: a.approach.conversations,
    },
    by_city: a.cities.map((c) => ({ city: c.city, calls: c.total, will_vote: c.yes, will_not_vote: c.no, not_reached: c.notReached })),
    by_day: a.daily.filter((d) => d.total).map((d) => ({ day: d.day, calls: d.total, reached: d.reached, will_vote: d.yes, will_not_vote: d.no })),
    quotes: a.quotes.map((q) => ({ said: q.text, answer: q.intent, reason: label(LABELS.en.reason, q.category), city: q.city ?? null })),
  };
}

const SHAPE = `{
  "summary": "two or three short sentences: what happened on these calls and what it means",
  "advice": ["one thing to do, in plain words, with the number behind it"]
}`;

function prompt(data, lang) {
  const language = lang === 'he' ? 'Hebrew' : 'English';
  return `You are a political campaign analyst reading the results of an automated pre-election phone survey in Israel. A voice agent named Yoav asks people whether they intend to vote, and asks those who say no or unsure for the reason.

You are writing for the person running the campaign. They are not technical and
they are not an analyst. Write the way you would explain it to them out loud.

Hard rules:
- Use ONLY the numbers in the data. Never invent a number, a reason, a city or a quote.
- Everyday words and short sentences. Never use: engagement, disengage, metrics, sample,
  dataset, data set, statistically, infrastructure, optimise, optimize, leverage, funnel,
  conversion rate, respondents, attrition, KPI.
- Never write a percentage. Write "7 of 25 calls", never "28%".
- Say "people", not "contacts", "leads", "records" or "users". Yoav is the person calling.
- The reader can see every count beside your text. Do NOT list them back. Say what they add
  up to and what it means for the campaign. Two numbers in the summary at most.
- A note under your text already warns when too few people have answered, so do not repeat
  that warning. But never write as if a handful of answers were a verdict: say "the 2 people
  who said no", never "people", "voters", "the public" or "the room".
- The page has already worked out these actions from the numbers, and shows any that apply:
  call many more people; check the phone system; change Yoav's opening line; look at the calls
  that broke; try the numbers that did not pick up again; say up front that Yoav is a computer;
  check the sound quality; ask more people why they said no. Your "advice" must NOT repeat any
  of them, however differently worded. Only add something they miss, for example about what
  people actually said, the wording of a specific answer, who to call next, or when to call.
  If you have nothing to add, return an empty list.
- The page groups every call that got no answer by how it ended (how_calls_ended_without_an_answer,
  which covers all of them). Use that grouping; not_reached and no_analysis_yet overlap with it
  and mixing them contradicts what the reader sees.
- "advice": 0 to 3 things the page has not already said, most important first, each one or two
  sentences. Start each with a verb. An empty list is a fine answer.
- "summary": two or three sentences. No bullet points, no headings.
- Write in ${language}. Plain spoken ${language}, no marketing tone, no markdown, no emojis.

Answer with JSON only, in this shape:
${SHAPE}

Data:
${JSON.stringify(data)}`;
}

// One OpenRouter call. Returns { data, model, cost }.
export async function askModel(brief, lang, { signal } = {}) {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw Object.assign(new Error('OPENROUTER_API_KEY is not set'), { status: 409, code: 'needs_key' });
  const model = MODEL();
  const r = await fetch(OPENROUTER, {
    method: 'POST',
    signal,
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://vapi-demo-site.vercel.app',
      'X-Title': 'Voice of the People Headquarters',
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      // Gemini flash thinks before it answers, and that thinking is billed as output.
      // Light effort with room to spare: too small a budget returns an empty message.
      max_tokens: 4000,
      reasoning: { effort: 'low' },
      response_format: { type: 'json_object' },
      usage: { include: true },
      messages: [{ role: 'user', content: prompt(brief, lang) }],
    }),
  });
  const text = await r.text();
  let body; try { body = JSON.parse(text); } catch { body = null; }
  if (!r.ok) throw Object.assign(new Error(body?.error?.message || `OpenRouter ${r.status}`), { status: r.status === 401 ? 502 : r.status });
  const choice = body?.choices?.[0];
  const content = choice?.message?.content ?? '';
  if (!content.trim()) throw Object.assign(new Error(`the model returned nothing (${choice?.finish_reason ?? 'no reason'})`), { status: 502 });
  let data;
  try { data = JSON.parse(content); } catch {
    const cut = content.slice(content.indexOf('{'), content.lastIndexOf('}') + 1);
    try { data = JSON.parse(cut); } catch { throw Object.assign(new Error('the model did not answer with JSON'), { status: 502 }); }
  }
  return { data: clean(data), model: body?.model || model, cost: Number(body?.usage?.cost ?? 0) || 0 };
}

// Keep only the shape the page renders, and cap the sizes so one odd answer
// cannot stretch the layout.
const line = (s) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, 500);
function clean(d) {
  const list = (v) => (Array.isArray(v) ? v : []).map(line).filter(Boolean).slice(0, 4);
  return {
    summary: line(d?.summary || d?.headline),   // older prompts answered with a headline
    advice: list(d?.advice),
  };
}

// ---------------------------------------------------------------- storage

export async function latestInsight(s, days, lang) {
  const [row] = await s`select * from insights where days = ${days} and lang = ${lang} order by created_at desc limit 1`;
  return row ?? null;
}

export async function saveInsight(s, { days, lang, model, data, callsInRange, latestCallAt, cost }) {
  const [row] = await s`
    insert into insights ${s({ days, lang, model, data: s.json(data), calls_in_range: callsInRange, latest_call_at: latestCallAt ?? null, cost_usd: cost })}
    returning *`;
  return row;
}

// The page shows a saved write-up; it is out of date once new calls have landed.
export const isStale = (row, a) => !row || row.calls_in_range !== a.funnel.total;

export function shape(row, a) {
  if (!row) return null;
  return {
    data: row.data,
    model: row.model,
    generatedAt: row.created_at,
    callsInRange: row.calls_in_range,
    stale: isStale(row, a),
  };
}
