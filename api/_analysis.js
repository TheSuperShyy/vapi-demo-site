// The analysis numbers, shared by /api/analysis (the page) and /api/export (the workbook).
// Everything is a count over stored calls; the "approach" block is detected from the
// agent's own lines in the transcripts, so a script change is a one-line edit below.

import { TZ } from './_list.js';

// Phrases from scripts/vapi/system_prompt.he.md that mark what the agent did on a call.
// The agent's lines are Vapi's transcription of his audio, split into short fragments
// (joined with spaces below), so each marker is a short, distinctive stretch that
// survives transcription: no niqqud, no rare words, nothing that crosses punctuation.
export const SCRIPT_MARKERS = {
  askedReason: 'מה הסיבה',            // "may I ask what the reason is?"
  closingDelivered: 'מקווים שתשק',    // "we hope you'll consider..." (שתשקול / שתשקלי)
  appealJewishState: 'המדינה היהודית',
  appealHighCourt: 'דיקטטורה',
  thankedYes: 'ייקחו חלק',            // the "if yes" closing: "...take part and exercise their right"
  politeExit: 'תודה על הזמן',         // "thank you for your time" when they do not want to continue
};

export const ANSWERED = ['yes', 'no', 'unsure'];
export const REACHED = ['yes', 'no', 'unsure', 'refused'];

// Vapi's endedReason values folded into what a campaign manager needs to know.
export function endedGroup(key) {
  const k = String(key ?? '');
  if (k === 'customer-ended-call') return 'hungUp';
  if (k === 'silence-timed-out') return 'silence';
  if (k === 'voicemail') return 'voicemail';
  if (k === 'customer-did-not-answer') return 'noAnswer';
  if (k === 'customer-busy') return 'busy';
  if (k.startsWith('assistant-')) return 'agentEnded';
  if (k === 'exceeded-max-duration') return 'tooLong';
  if (k.includes('microphone')) return 'noMic';
  if (/error|fail|pipeline/.test(k)) return 'technical';
  return 'other';
}

// Labels for the workbook (the page has its own i18n table).
export const LABELS = {
  en: {
    intent: { yes: 'Will vote', no: 'Will not vote', unsure: 'Unsure', refused: 'Refused', not_reached: 'Not reached', '': 'No analysis' },
    reason: {
      no_trust_in_politicians: 'No trust in politicians', not_interested_in_politics: 'Not interested in politics', no_suitable_option: 'No suitable option',
      deliberate_protest: 'Deliberate protest', abroad_or_away: 'Abroad or away', health_or_mobility: 'Health or mobility', logistics_polling_station: 'Polling station logistics',
      work_or_schedule: 'Work or schedule', declined_to_say: 'Declined to say', other: 'Other', not_applicable: 'Not applicable',
    },
    ended: { hungUp: 'Person hung up', silence: 'Silence', voicemail: 'Voicemail', noAnswer: 'No answer', busy: 'Busy', agentEnded: 'Agent ended the call', tooLong: 'Too long', noMic: 'No microphone', technical: 'Technical error', other: 'Other' },
    source: { webCall: 'Browser', outboundPhoneCall: 'Phone', inboundPhoneCall: 'Incoming' },
    sheets: { summary: 'Summary', daily: 'Daily', calls: 'Calls', reasons: 'Reasons', cities: 'Cities', quotes: 'Quotes' },
    cols: {
      metric: 'Metric', value: 'Value', day: 'Day', calls: 'Calls', reached: 'Reached', yes: 'Will vote', no: 'Will not vote', unsure: 'Unsure', refused: 'Refused',
      notReached: 'Not reached', optOut: 'Opt-outs', cost: 'Cost USD', date: 'Date', time: 'Time', phone: 'Phone', name: 'Name', city: 'City', source: 'Source',
      status: 'Status', answer: 'Answer', reason: 'Reason', quote: 'Quote', length: 'Length (s)', endedBecause: 'Ended because', askedIfBot: 'Asked if bot',
      summary: 'Summary', count: 'Count', share: 'Share', yesRate: 'Yes rate', agentTurns: 'Agent turns', userTurns: 'Person turns',
    },
    metrics: {
      total: 'Calls', reached: 'Reached a person', answered: 'Gave an answer', yes: 'Will vote', no: 'Will not vote', unsure: 'Unsure', refused: 'Refused to answer',
      notReached: 'Not reached', noAnalysis: 'No analysis yet', optOut: 'Asked not to be called again', askedIfBot: 'Asked if it is a bot', qualityBad: 'Bad audio',
      hungUpEarly: 'Hung up in the first 12 seconds', avgSecondsAnswered: 'Average length, answered (s)', avgSecondsNotReached: 'Average length, not reached (s)', cost: 'Cost USD',
      conversations: 'Calls with a conversation', askedReason: 'Agent asked for the reason', closingDelivered: 'Agent delivered the closing', appealJewishState: 'Closing used "Jewish state"',
      appealHighCourt: 'Closing used "High Court"', thankedYes: 'Agent thanked a yes', politeExit: 'Agent ended politely on request', askedQuestion: 'Person asked a question',
      avgAgentTurns: 'Average agent turns', avgUserTurns: 'Average person turns',
    },
  },
  he: {
    intent: { yes: 'יצביעו', no: 'לא יצביעו', unsure: 'לא בטוחים', refused: 'סירבו', not_reached: 'לא הושגו', '': 'ללא ניתוח' },
    reason: {
      no_trust_in_politicians: 'אין אמון בפוליטיקאים', not_interested_in_politics: 'לא מתעניינים בפוליטיקה', no_suitable_option: 'אין למי להצביע',
      deliberate_protest: 'מחאה מכוונת', abroad_or_away: 'בחו״ל או לא בעיר', health_or_mobility: 'בריאות או ניידות', logistics_polling_station: 'קלפי רחוקה או לא נגישה',
      work_or_schedule: 'עבודה או לוח זמנים', declined_to_say: 'לא רצו לומר', other: 'אחר', not_applicable: 'לא רלוונטי',
    },
    ended: { hungUp: 'האדם ניתק', silence: 'שקט', voicemail: 'תא קולי', noAnswer: 'אין מענה', busy: 'תפוס', agentEnded: 'הסוכנת סיימה', tooLong: 'ארוך מדי', noMic: 'אין מיקרופון', technical: 'תקלה טכנית', other: 'אחר' },
    source: { webCall: 'דפדפן', outboundPhoneCall: 'טלפון', inboundPhoneCall: 'נכנסת' },
    sheets: { summary: 'סיכום', daily: 'יומי', calls: 'שיחות', reasons: 'סיבות', cities: 'ערים', quotes: 'ציטוטים' },
    cols: {
      metric: 'מדד', value: 'ערך', day: 'יום', calls: 'שיחות', reached: 'הושגו', yes: 'יצביעו', no: 'לא יצביעו', unsure: 'לא בטוחים', refused: 'סירבו',
      notReached: 'לא הושגו', optOut: 'ביקשו הסרה', cost: 'עלות בדולר', date: 'תאריך', time: 'שעה', phone: 'טלפון', name: 'שם', city: 'עיר', source: 'מקור',
      status: 'סטטוס', answer: 'תשובה', reason: 'סיבה', quote: 'ציטוט', length: 'אורך (שניות)', endedBecause: 'הסתיימה בגלל', askedIfBot: 'שאלו אם בוט',
      summary: 'תקציר', count: 'כמות', share: 'אחוז', yesRate: 'אחוז יצביעו', agentTurns: 'תורות סוכנת', userTurns: 'תורות אדם',
    },
    metrics: {
      total: 'שיחות', reached: 'הגיעו לאדם', answered: 'ענו', yes: 'יצביעו', no: 'לא יצביעו', unsure: 'לא בטוחים', refused: 'סירבו לענות',
      notReached: 'לא הושגו', noAnalysis: 'עדיין ללא ניתוח', optOut: 'ביקשו שלא להתקשר שוב', askedIfBot: 'שאלו אם זה בוט', qualityBad: 'שמע גרוע',
      hungUpEarly: 'ניתקו ב-12 השניות הראשונות', avgSecondsAnswered: 'אורך ממוצע, ענו (שניות)', avgSecondsNotReached: 'אורך ממוצע, לא הושגו (שניות)', cost: 'עלות בדולר',
      conversations: 'שיחות עם דיאלוג', askedReason: 'הסוכנת שאלה לסיבה', closingDelivered: 'הסוכנת אמרה את משפט הסיום', appealJewishState: 'סיום עם "המדינה היהודית"',
      appealHighCourt: 'סיום עם "בג"ץ"', thankedYes: 'הסוכנת הודתה על כן', politeExit: 'הסוכנת סיימה בנימוס לפי בקשה', askedQuestion: 'האדם שאל שאלה',
      avgAgentTurns: 'ממוצע תורות סוכנת', avgUserTurns: 'ממוצע תורות אדם',
    },
  },
};

// Calls whose Israel-time day falls inside the last `days` days, with the transcript
// folded into one agent string and one customer string, and the lead's city attached.
const inRange = (s, days) => s`
  with c as (
    select c.*, coalesce(m.bot_text, '') as bot_text, coalesce(m.user_text, '') as user_text,
           coalesce(m.bot_turns, 0) as bot_turns, coalesce(m.user_turns, 0) as user_turns,
           l.city, l.name as lead_name
    from calls c
    left join lateral (
      select string_agg(x->>'text', ' ') filter (where x->>'role' = 'bot')  as bot_text,
             string_agg(x->>'text', ' ') filter (where x->>'role' = 'user') as user_text,
             count(*) filter (where x->>'role' = 'bot')::int  as bot_turns,
             count(*) filter (where x->>'role' = 'user')::int as user_turns
      from jsonb_array_elements(case when jsonb_typeof(c.messages) = 'array' then c.messages else '[]'::jsonb end) x
    ) m on true
    left join leads l on l.phone = c.customer_number
    where c.created_at >= now() - (${days}::int + 1) * interval '1 day'
      and (c.created_at at time zone ${TZ})::date >= (now() at time zone ${TZ})::date - (${days}::int - 1)
  )`;

const like = (m) => '%' + m + '%';

export async function analysis(s, days) {
  const M = SCRIPT_MARKERS;
  const [r] = await s`
    ${inRange(s, days)}
    select
      (select json_build_object(
          'total', count(*),
          'reached', count(*) filter (where intent = any(${REACHED}::text[])),
          'answered', count(*) filter (where intent = any(${ANSWERED}::text[])),
          'yes', count(*) filter (where intent = 'yes'),
          'no', count(*) filter (where intent = 'no'),
          'unsure', count(*) filter (where intent = 'unsure'),
          'refused', count(*) filter (where intent = 'refused'),
          'notReached', count(*) filter (where intent = 'not_reached'),
          'noAnalysis', count(*) filter (where intent is null),
          'optOut', count(*) filter (where opt_out),
          'askedIfBot', count(*) filter (where asked_if_bot),
          'qualityBad', count(*) filter (where call_quality_ok = false),
          'hungUpEarly', count(*) filter (where ended_reason = 'customer-ended-call' and duration_seconds < 12),
          'avgSecondsAnswered', coalesce(avg(duration_seconds) filter (where intent = any(${ANSWERED}::text[]) and duration_seconds > 0), 0),
          'avgSecondsNotReached', coalesce(avg(duration_seconds) filter (where intent = 'not_reached' and duration_seconds > 0), 0),
          'cost', coalesce(sum(cost_usd), 0))
        from c) as funnel,
      (select coalesce(json_agg(json_build_object('key', k, 'n', n) order by n desc, k), '[]'::json)
        from (select coalesce(reason_category, 'other') as k, count(*)::int as n from c where intent in ('no', 'unsure') group by 1) r) as reasons,
      (select coalesce(json_agg(json_build_object('key', k, 'n', n) order by n desc, k), '[]'::json)
        from (select coalesce(ended_reason, 'unknown') as k, count(*)::int as n
              from c where ended_at is not null and (intent is null or intent not in ('yes', 'no', 'unsure')) group by 1) r) as ended_reasons,
      (select json_build_object(
          'reached', count(*) filter (where intent = any(${REACHED}::text[])),
          'conversations', count(*) filter (where user_turns > 0),
          'askedReason', count(*) filter (where bot_text like ${like(M.askedReason)}),
          'closingDelivered', count(*) filter (where bot_text like ${like(M.closingDelivered)}),
          'appealJewishState', count(*) filter (where bot_text like ${like(M.appealJewishState)}),
          'appealHighCourt', count(*) filter (where bot_text like ${like(M.appealHighCourt)}),
          'thankedYes', count(*) filter (where bot_text like ${like(M.thankedYes)}),
          'politeExit', count(*) filter (where bot_text like ${like(M.politeExit)}),
          'askedQuestion', count(*) filter (where user_text like '%?%'),
          'avgAgentTurns', coalesce(avg(bot_turns) filter (where user_turns > 0), 0),
          'avgUserTurns', coalesce(avg(user_turns) filter (where user_turns > 0), 0))
        from c) as approach,
      (select coalesce(json_agg(row_to_json(r)), '[]'::json)
        from (select city, count(*)::int as total,
                     count(*) filter (where intent = 'yes')::int as yes,
                     count(*) filter (where intent = 'no')::int as no,
                     count(*) filter (where intent = 'unsure')::int as unsure,
                     count(*) filter (where intent = 'refused')::int as refused,
                     count(*) filter (where intent = 'not_reached')::int as "notReached"
              from c where city is not null group by city order by total desc, city limit 12) r) as cities,
      (select json_agg(json_build_object('day', to_char(d.day, 'YYYY-MM-DD'),
          'total', coalesce(x.total, 0), 'reached', coalesce(x.reached, 0), 'yes', coalesce(x.yes, 0), 'no', coalesce(x.no, 0),
          'unsure', coalesce(x.unsure, 0), 'refused', coalesce(x.refused, 0), 'notReached', coalesce(x.not_reached, 0),
          'optOut', coalesce(x.opt_out, 0), 'cost', coalesce(x.cost, 0)) order by d.day)
        from generate_series((now() at time zone ${TZ})::date - (${days}::int - 1), (now() at time zone ${TZ})::date, interval '1 day') as d(day)
        left join (
          select (created_at at time zone ${TZ})::date as day, count(*)::int as total,
                 count(*) filter (where intent = any(${REACHED}::text[]))::int as reached,
                 count(*) filter (where intent = 'yes')::int as yes, count(*) filter (where intent = 'no')::int as no,
                 count(*) filter (where intent = 'unsure')::int as unsure, count(*) filter (where intent = 'refused')::int as refused,
                 count(*) filter (where intent = 'not_reached')::int as not_reached, count(*) filter (where opt_out)::int as opt_out,
                 coalesce(sum(cost_usd), 0) as cost
          from c group by 1) x on x.day = d.day::date) as daily,
      (select coalesce(json_agg(row_to_json(r)), '[]'::json)
        from (select id as "callId", created_at as "createdAt", reason_category as category, reason_verbatim as text, intent, city
              from c where reason_verbatim is not null and reason_verbatim <> '' order by created_at desc limit 20) r) as quotes`;
  const num = (o) => Object.fromEntries(Object.entries(o ?? {}).map(([k, v]) => [k, Number(v)]));
  // fold Vapi's many ended reasons into the groups above, keeping the raw keys for reference
  const grouped = new Map();
  for (const { key, n } of r.ended_reasons ?? []) {
    const g = endedGroup(key); const e = grouped.get(g) ?? { key: g, n: 0, raw: [] };
    e.n += Number(n); e.raw.push(key); grouped.set(g, e);
  }
  return {
    days,
    funnel: num(r.funnel),
    reasons: r.reasons ?? [],
    endedReasons: [...grouped.values()].sort((a, b) => b.n - a.n),
    approach: num(r.approach),
    cities: r.cities ?? [],
    daily: (r.daily ?? []).map((d) => ({ ...d, cost: Number(d.cost) })),
    quotes: r.quotes ?? [],
  };
}

// Every call in the range, newest first, for the workbook's Calls sheet.
export async function callsInRange(s, days, limit = 10000) {
  return s`
    ${inRange(s, days)}
    select id, type, status, ended_reason, customer_number, lead_name, city, created_at, duration_seconds, cost_usd,
           intent, reason_category, reason_verbatim, opt_out, asked_if_bot, call_quality_ok, summary, bot_turns, user_turns
    from c order by created_at desc limit ${limit}`;
}
