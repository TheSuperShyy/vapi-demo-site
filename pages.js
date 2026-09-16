// Dashboard pages: Overview, Calls, Voice Agent, Settings.
import { registerPage, render, route, t, I18N, lang, escapeHtml, pageHead, toast, sk, store, applyLang, applyTheme, currentTheme, toggleTheme, authRequired, showLogin, signOut } from './app.js';

const $ = (id) => document.getElementById(id);

// Same assistant as api/config.js. A Vapi PUBLIC key is built to ship to browsers.
const PUBLIC_KEY = '59fd1b6b-f27d-47ce-ab5b-ff7ccd56277e';
const ASSISTANT_ID = '1c759c79-2692-43f0-b049-d1ffa363d386';

// ------------------------------------------------------------------ strings

Object.assign(I18N.en, {
  'stat.total': 'Total calls', 'stat.total.sub': 'all time',
  'stat.completed': 'Completed', 'stat.live': 'in progress', 'stat.avg': 'Avg length',
  'stat.cost': 'Total cost', 'stat.yes': 'Said yes', 'stat.yes.sub': 'of answered',
  'card.week': 'Calls', 'card.intent': 'Intent', 'card.recent': 'Recent calls', 'see.all': 'See all',
  'card.trend': 'Answers over time', 'card.trend.sub': 'running total',
  'intent.yes': 'Will vote', 'intent.no': 'Will not vote', 'intent.unsure': 'Unsure',
  'intent.refused': 'Refused', 'intent.not_reached': 'Not reached', 'intent.unknown': 'No analysis',
  'src.web': 'Browser', 'src.phone': 'Phone',
  'status.live': 'Live', 'status.ended': 'Ended', 'status.failed': 'Failed', 'status.queued': 'Queued',
  'empty.calls': 'No calls yet. Open the Voice Agent page and press the button.',
  'empty.search': 'Nothing matches your search.',
  'unit.calls': 'calls', 'unit.numbers': 'numbers',
  'pager.of': '{a}–{b} of {n}', 'pager.prev': 'Previous', 'pager.next': 'Next', 'pager.size': 'per page',
  'list.total': 'Numbers', 'list.total.sub': 'in the list', 'list.new': 'Not called yet', 'list.called': 'Called', 'list.dnc': 'Do not call',
  'list.all': 'All cities', 'list.any': 'Any status', 'list.card': 'Numbers',
  'col.pos': '#', 'col.name': 'Name', 'col.phone': 'Phone', 'col.city': 'City', 'col.attempts': 'Attempts', 'col.last': 'Last call',
  'status.new': 'Not called', 'status.called': 'Called', 'status.do_not_call': 'Do not call',
  'empty.list': 'The list is empty. Import it with: node db/leads.mjs list.csv', 'list.nodb': 'The calling list needs the database. See db/README.md.',
  'day.0': 'Sun', 'day.1': 'Mon', 'day.2': 'Tue', 'day.3': 'Wed', 'day.4': 'Thu', 'day.5': 'Fri', 'day.6': 'Sat',
  'col.status': 'Status', 'col.source': 'Source', 'col.started': 'Started', 'col.length': 'Length', 'col.intent': 'Intent', 'col.cost': 'Cost',
  'detail.pick': 'Select a call to read the conversation', 'detail.title': 'Conversation', 'detail.back': 'All calls', 'detail.empty': 'No transcript for this call',
  'detail.live': 'Call in progress…', 'detail.recording': 'Recording', 'detail.analysis': 'Analysis', 'detail.summary': 'Summary',
  'detail.reason': 'Reason', 'detail.verbatim': 'In their words', 'detail.flags': 'Flags', 'detail.ended': 'Ended because',
  'flag.optout': 'Asked to be removed', 'flag.bot': 'Asked if bot', 'flag.quality': 'Call quality issue',
  'who.agent': 'Shir', 'who.user': 'Customer', 'who.you': 'You',
  'reason.no_trust_in_politicians': 'No trust in politicians', 'reason.not_interested_in_politics': 'Not interested in politics',
  'reason.no_suitable_option': 'No suitable option', 'reason.deliberate_protest': 'Deliberate protest', 'reason.abroad_or_away': 'Abroad or away',
  'reason.health_or_mobility': 'Health or mobility', 'reason.logistics_polling_station': 'Polling station logistics', 'reason.work_or_schedule': 'Work or schedule',
  'reason.declined_to_say': 'Declined to say', 'reason.other': 'Other', 'reason.not_applicable': '—',
  // analysis page
  'an.range': 'Last {n} days', 'an.export': 'Export to Excel', 'an.exporting': 'Preparing…', 'an.exported': 'Report downloaded', 'an.nodb': 'The analysis needs the database (DATABASE_URL).',
  'an.reached': 'Reached a person', 'an.reached.sub': '{a} of {b} calls', 'an.yes': 'Will vote', 'an.no': 'Will not vote', 'an.ofAnswered': '{a} of {b} answered',
  'an.early': 'Hung up early', 'an.early.sub': 'in the first 12 seconds', 'an.optout': 'Asked to be removed', 'an.optout.sub': 'marked Do not call',
  'an.findings': 'Key findings', 'an.reasons': 'Why they will not vote', 'an.reasons.sub': 'people who said no or unsure', 'an.reasons.empty': 'No "no" or "unsure" answers in this range yet.',
  'an.quotes': 'In their words', 'an.quotes.empty': 'No quotes recorded in this range yet.',
  'an.wrong': 'What went wrong', 'an.wrong.sub': 'calls that ended without an answer', 'an.wrong.empty': 'Every call in this range ended with an answer.',
  'an.flag.early': 'Hung up in 12 s', 'an.flag.bot': 'Asked if a bot', 'an.flag.audio': 'Bad audio',
  'an.approach': 'How the agent handled it', 'an.approach.sub': 'detected from her lines in the transcripts',
  'an.ap.askedReason': 'Asked for the reason', 'an.ap.closingDelivered': 'Delivered the closing appeal', 'an.ap.appealJewishState': 'Closing: "Jewish state"', 'an.ap.appealHighCourt': 'Closing: "High Court"',
  'an.ap.thankedYes': 'Thanked a "yes" with the script line', 'an.ap.politeExit': 'Ended politely on request', 'an.ap.askedQuestion': 'Person asked her a question',
  'an.ap.of.noUnsure': 'of no/unsure', 'an.ap.of.closing': 'of closings', 'an.ap.of.yes': 'of yes', 'an.ap.of.reached': 'of reached', 'an.ap.of.conv': 'of conversations',
  'an.ap.turns': 'On calls with a conversation she spoke {a} times and the person {b} times on average.',
  'ai.title': 'What this means', 'ai.sub': 'written by AI from the numbers on this page', 'ai.findings': 'Findings',
  'ai.why': 'Why they will not vote', 'ai.wrong': 'What went wrong', 'ai.advice': 'What to change',
  'ai.writing': 'Reading the calls…', 'ai.refresh': 'Write again', 'ai.stale': 'New calls since this was written',
  'ai.by': 'Written by {m}, {t}', 'ai.none': 'No AI analysis for this range yet.',
  'ai.nokey': 'Set OPENROUTER_API_KEY to turn this on.', 'ai.failed': 'Could not write the analysis. {e}',
  'an.cities': 'By city', 'an.cities.empty': 'No calls to numbers from the list in this range yet.', 'an.daily': 'Day by day', 'an.daily.sub': 'days with calls, newest first',
  'an.col.city': 'City', 'an.col.calls': 'Calls', 'an.col.reached': 'Reached', 'an.col.yes': 'Will vote', 'an.col.no': 'Will not', 'an.col.unsure': 'Unsure', 'an.col.refused': 'Refused',
  'an.col.nr': 'Not reached', 'an.col.rate': 'Yes rate', 'an.col.day': 'Day', 'an.col.optout': 'Opt-outs', 'an.col.cost': 'Cost',
  'ended.hungUp': 'Person hung up', 'ended.silence': 'Silence, nobody spoke', 'ended.voicemail': 'Voicemail', 'ended.noAnswer': 'No answer', 'ended.busy': 'Busy',
  'ended.agentEnded': 'Agent ended the call', 'ended.tooLong': 'Call too long', 'ended.noMic': 'No microphone', 'ended.technical': 'Technical error', 'ended.other': 'Other',
  'f.none': 'No calls in this range yet.',
  'f.reach': '{a} of {b} calls reached a person ({p}%).',
  'f.yes': '{a} of {b} people who answered will vote ({p}%).',
  'f.topReason': 'The most common reason for not voting is "{r}": {a} of {b} ({p}%).',
  'f.early': '{a} people hung up in the first 12 seconds, so the opening line is where those calls were lost.',
  'f.silence': '{a} calls ended in silence: nobody spoke after the greeting.',
  'f.technical': '{a} calls failed for technical reasons (voice or audio errors).',
  'f.bot': '{a} people asked whether they were talking to a bot.',
  'f.optout': '{a} asked not to be called again and are marked Do not call.',
  'f.askedReason': 'The agent asked for the reason in {a} of {b} "no" or "unsure" calls.',
  'f.appeal': 'Closing appeal used: "Jewish state" {a}, "High Court" {b}.',
  'f.noAnalysis': '{a} calls have no analysis yet (very short or failed).',
  'agent.talk': 'Talk to me', 'agent.end': 'End', 'agent.ready': 'Ready. Microphone permission needed.', 'agent.connecting': 'Connecting…',
  'agent.connected': 'Connected', 'agent.connected.sub': 'speak or type', 'agent.ended': 'Call ended. Start again whenever.',
  'agent.mic.blocked': 'The browser blocked the microphone. Allow access and try again.', 'agent.start.failed': 'Could not start the call. Try refreshing.',
  'agent.error': 'The call hit an error. Try again.', 'agent.type': 'Or just type here. English works too, she answers in Hebrew.',
  'agent.type.short': 'Type a message', 'agent.send': 'Send', 'agent.voice': 'Voice', 'agent.speed': 'Speed', 'agent.note': 'Runs in the browser through your microphone. Nobody is phoned. Works best in Chrome.',
  'agent.lead': 'Calling', 'agent.lead.sub': 'You answer as the person who picked up. The call is recorded against this number.',
  'agent.dial': 'Dial this number', 'agent.dial.note': 'Needs a phone number in Vapi. Until then the same call runs in the browser.',
  'agent.dial.dnc': 'This number asked not to be called.', 'agent.dialed': 'Dialing. The call will appear in Calls.', 'agent.pick': 'Pick a number from the List to call it.',
  'list.call': 'Call', 'list.calls': 'calls',
  'agent.saved': 'Call saved. It will appear in Calls in a moment.',
  'set.appearance': 'Appearance', 'set.theme': 'Light theme', 'set.theme.sub': 'Dark is the default', 'set.lang': 'Language', 'set.lang.sub': 'English or Hebrew, layout flips with it',
  'set.assistant': 'Assistant', 'set.name': 'Name', 'set.transcriber': 'Transcriber', 'set.voice': 'Voice', 'set.model': 'Model', 'set.first': 'First message', 'set.updated': 'Last updated',
  'set.password': 'Dashboard password', 'set.password.sub': 'Signed in on this browser', 'set.signout': 'Sign out',
});
Object.assign(I18N.he, {
  'stat.total': 'סך שיחות', 'stat.total.sub': 'מאז ומתמיד',
  'stat.completed': 'הסתיימו', 'stat.live': 'בשיחה', 'stat.avg': 'אורך ממוצע',
  'stat.cost': 'עלות כוללת', 'stat.yes': 'ענו כן', 'stat.yes.sub': 'מתוך שענו',
  'card.week': 'שיחות', 'card.intent': 'כוונת הצבעה', 'card.recent': 'שיחות אחרונות', 'see.all': 'הצג הכל',
  'card.trend': 'תשובות לאורך זמן', 'card.trend.sub': 'סכום מצטבר',
  'intent.yes': 'יצביעו', 'intent.no': 'לא יצביעו', 'intent.unsure': 'לא בטוחים',
  'intent.refused': 'סירבו', 'intent.not_reached': 'לא הושגו', 'intent.unknown': 'ללא ניתוח',
  'src.web': 'דפדפן', 'src.phone': 'טלפון',
  'status.live': 'פעילה', 'status.ended': 'הסתיימה', 'status.failed': 'נכשלה', 'status.queued': 'בתור',
  'empty.calls': 'עדיין אין שיחות. פתחו את עמוד הסוכן הקולי ולחצו על הכפתור.',
  'empty.search': 'אין תוצאות לחיפוש.',
  'unit.calls': 'שיחות', 'unit.numbers': 'מספרים',
  'pager.of': '{a}–{b} מתוך {n}', 'pager.prev': 'הקודם', 'pager.next': 'הבא', 'pager.size': 'בעמוד',
  'list.total': 'מספרים', 'list.total.sub': 'ברשימה', 'list.new': 'טרם חויגו', 'list.called': 'חויגו', 'list.dnc': 'לא להתקשר',
  'list.all': 'כל הערים', 'list.any': 'כל סטטוס', 'list.card': 'מספרים',
  'col.pos': '#', 'col.name': 'שם', 'col.phone': 'טלפון', 'col.city': 'עיר', 'col.attempts': 'ניסיונות', 'col.last': 'שיחה אחרונה',
  'status.new': 'טרם חויג', 'status.called': 'חויג', 'status.do_not_call': 'לא להתקשר',
  'empty.list': 'הרשימה ריקה. ייבוא: node db/leads.mjs list.csv', 'list.nodb': 'רשימת החיוג צריכה את מסד הנתונים. ראו db/README.md.',
  'day.0': 'א׳', 'day.1': 'ב׳', 'day.2': 'ג׳', 'day.3': 'ד׳', 'day.4': 'ה׳', 'day.5': 'ו׳', 'day.6': 'ש׳',
  'col.status': 'סטטוס', 'col.source': 'מקור', 'col.started': 'התחילה', 'col.length': 'אורך', 'col.intent': 'כוונה', 'col.cost': 'עלות',
  'detail.pick': 'בחרו שיחה כדי לקרוא את השיחה', 'detail.title': 'השיחה', 'detail.back': 'כל השיחות', 'detail.empty': 'אין תמלול לשיחה הזאת',
  'detail.live': 'השיחה בעיצומה…', 'detail.recording': 'הקלטה', 'detail.analysis': 'ניתוח', 'detail.summary': 'סיכום',
  'detail.reason': 'סיבה', 'detail.verbatim': 'במילים שלהם', 'detail.flags': 'דגלים', 'detail.ended': 'הסתיימה כי',
  'flag.optout': 'ביקשו הסרה', 'flag.bot': 'שאלו אם בוט', 'flag.quality': 'בעיית איכות',
  'who.agent': 'שיר', 'who.user': 'לקוח', 'who.you': 'אתה',
  'reason.no_trust_in_politicians': 'אין אמון בפוליטיקאים', 'reason.not_interested_in_politics': 'לא מתעניינים בפוליטיקה',
  'reason.no_suitable_option': 'אין למי להצביע', 'reason.deliberate_protest': 'מחאה מכוונת', 'reason.abroad_or_away': 'בחו״ל או לא בעיר',
  'reason.health_or_mobility': 'בריאות או ניידות', 'reason.logistics_polling_station': 'קלפי רחוקה או לא נגישה', 'reason.work_or_schedule': 'עבודה או לוח זמנים',
  'reason.declined_to_say': 'לא רצו לומר', 'reason.other': 'אחר', 'reason.not_applicable': '—',
  // analysis page
  'an.range': '{n} הימים האחרונים', 'an.export': 'ייצוא לאקסל', 'an.exporting': 'מכין…', 'an.exported': 'הדוח ירד', 'an.nodb': 'הניתוח דורש מסד נתונים (DATABASE_URL).',
  'an.reached': 'הגיעו לאדם', 'an.reached.sub': '{a} מתוך {b} שיחות', 'an.yes': 'יצביעו', 'an.no': 'לא יצביעו', 'an.ofAnswered': '{a} מתוך {b} שענו',
  'an.early': 'ניתקו מהר', 'an.early.sub': 'ב-12 השניות הראשונות', 'an.optout': 'ביקשו הסרה', 'an.optout.sub': 'סומנו לא להתקשר',
  'an.findings': 'ממצאים עיקריים', 'an.reasons': 'למה לא יצביעו', 'an.reasons.sub': 'מי שענו לא או לא בטוחים', 'an.reasons.empty': 'עדיין אין תשובות "לא" או "לא בטוח" בטווח הזה.',
  'an.quotes': 'במילים שלהם', 'an.quotes.empty': 'עדיין אין ציטוטים בטווח הזה.',
  'an.wrong': 'מה השתבש', 'an.wrong.sub': 'שיחות שהסתיימו בלי תשובה', 'an.wrong.empty': 'כל השיחות בטווח הזה הסתיימו בתשובה.',
  'an.flag.early': 'ניתקו תוך 12 שנ׳', 'an.flag.bot': 'שאלו אם בוט', 'an.flag.audio': 'שמע גרוע',
  'an.approach': 'איך הסוכנת התמודדה', 'an.approach.sub': 'לפי המשפטים שלה בתמלולים',
  'an.ap.askedReason': 'שאלה לסיבה', 'an.ap.closingDelivered': 'אמרה את משפט הסיום', 'an.ap.appealJewishState': 'סיום: "המדינה היהודית"', 'an.ap.appealHighCourt': 'סיום: "בג״ץ"',
  'an.ap.thankedYes': 'הודתה על "כן" לפי התסריט', 'an.ap.politeExit': 'סיימה בנימוס לפי בקשה', 'an.ap.askedQuestion': 'האדם שאל אותה שאלה',
  'an.ap.of.noUnsure': 'מתוך לא/לא בטוח', 'an.ap.of.closing': 'מתוך סיומים', 'an.ap.of.yes': 'מתוך כן', 'an.ap.of.reached': 'מתוך מי שהושגו', 'an.ap.of.conv': 'מתוך שיחות',
  'an.ap.turns': 'בשיחות עם דיאלוג היא דיברה בממוצע {a} פעמים והאדם {b} פעמים.',
  'ai.title': 'מה זה אומר', 'ai.sub': 'נכתב על ידי בינה מלאכותית מהנתונים שבעמוד', 'ai.findings': 'ממצאים',
  'ai.why': 'למה לא יצביעו', 'ai.wrong': 'מה השתבש', 'ai.advice': 'מה לשנות',
  'ai.writing': 'קורא את השיחות…', 'ai.refresh': 'כתוב שוב', 'ai.stale': 'היו שיחות חדשות מאז הכתיבה',
  'ai.by': 'נכתב על ידי {m}, {t}', 'ai.none': 'עדיין אין ניתוח בינה מלאכותית לטווח הזה.',
  'ai.nokey': 'הגדירו OPENROUTER_API_KEY כדי להפעיל.', 'ai.failed': 'לא הצלחנו לכתוב את הניתוח. {e}',
  'an.cities': 'לפי עיר', 'an.cities.empty': 'עדיין אין שיחות למספרים מהרשימה בטווח הזה.', 'an.daily': 'יום אחר יום', 'an.daily.sub': 'ימים עם שיחות, מהחדש לישן',
  'an.col.city': 'עיר', 'an.col.calls': 'שיחות', 'an.col.reached': 'הושגו', 'an.col.yes': 'יצביעו', 'an.col.no': 'לא יצביעו', 'an.col.unsure': 'לא בטוחים', 'an.col.refused': 'סירבו',
  'an.col.nr': 'לא הושגו', 'an.col.rate': 'אחוז כן', 'an.col.day': 'יום', 'an.col.optout': 'הסרות', 'an.col.cost': 'עלות',
  'ended.hungUp': 'האדם ניתק', 'ended.silence': 'שקט, אף אחד לא דיבר', 'ended.voicemail': 'תא קולי', 'ended.noAnswer': 'אין מענה', 'ended.busy': 'תפוס',
  'ended.agentEnded': 'הסוכנת סיימה', 'ended.tooLong': 'שיחה ארוכה מדי', 'ended.noMic': 'אין מיקרופון', 'ended.technical': 'תקלה טכנית', 'ended.other': 'אחר',
  'f.none': 'עדיין אין שיחות בטווח הזה.',
  'f.reach': '{a} מתוך {b} שיחות הגיעו לאדם ({p}%).',
  'f.yes': '{a} מתוך {b} שענו יצביעו ({p}%).',
  'f.topReason': 'הסיבה הנפוצה ביותר לא להצביע: "{r}", {a} מתוך {b} ({p}%).',
  'f.early': '{a} אנשים ניתקו ב-12 השניות הראשונות, כלומר השיחות האלה אבדו במשפט הפתיחה.',
  'f.silence': '{a} שיחות הסתיימו בשקט: אף אחד לא דיבר אחרי הברכה.',
  'f.technical': '{a} שיחות נכשלו מסיבות טכניות (שגיאות קול או שמע).',
  'f.bot': '{a} אנשים שאלו אם הם מדברים עם בוט.',
  'f.optout': '{a} ביקשו שלא להתקשר שוב וסומנו לא להתקשר.',
  'f.askedReason': 'הסוכנת שאלה לסיבה ב-{a} מתוך {b} שיחות "לא" או "לא בטוח".',
  'f.appeal': 'משפט הסיום שנאמר: "המדינה היהודית" {a}, "בג״ץ" {b}.',
  'f.noAnalysis': '{a} שיחות עדיין ללא ניתוח (קצרות מאוד או שנכשלו).',
  'agent.talk': 'דבר איתי', 'agent.end': 'סיים', 'agent.ready': 'מוכן. צריך אישור למיקרופון.', 'agent.connecting': 'מתחבר…',
  'agent.connected': 'מחובר', 'agent.connected.sub': 'דבר או כתוב', 'agent.ended': 'השיחה הסתיימה. אפשר להתחיל שוב.',
  'agent.mic.blocked': 'הדפדפן חסם את המיקרופון. אשרו גישה ונסו שוב.', 'agent.start.failed': 'לא הצלחנו להתחיל את השיחה. נסו לרענן.',
  'agent.error': 'נפלה שגיאה בשיחה. נסו שוב.', 'agent.type': 'או פשוט תכתבו פה. גם באנגלית, היא עונה בעברית.',
  'agent.type.short': 'כתבו הודעה', 'agent.send': 'שלח', 'agent.voice': 'קול', 'agent.speed': 'קצב', 'agent.note': 'רץ בדפדפן דרך המיקרופון. לא מתקשרים לאף אחד. עובד הכי טוב בכרום.',
  'agent.lead': 'מתקשרים אל', 'agent.lead.sub': 'אתם עונים כמי שהרים את הטלפון. השיחה נרשמת על המספר הזה.',
  'agent.dial': 'חיוג למספר', 'agent.dial.note': 'דורש מספר טלפון ב-Vapi. עד אז אותה שיחה רצה בדפדפן.',
  'agent.dial.dnc': 'המספר הזה ביקש שלא להתקשר.', 'agent.dialed': 'מחייג. השיחה תופיע בעמוד השיחות.', 'agent.pick': 'בחרו מספר מהרשימה כדי להתקשר אליו.',
  'list.call': 'התקשר', 'list.calls': 'שיחות',
  'agent.saved': 'השיחה נשמרה. היא תופיע בעמוד השיחות בעוד רגע.',
  'set.appearance': 'מראה', 'set.theme': 'ערכת נושא בהירה', 'set.theme.sub': 'כהה היא ברירת המחדל', 'set.lang': 'שפה', 'set.lang.sub': 'אנגלית או עברית, הפריסה מתהפכת בהתאם',
  'set.assistant': 'הסוכנת', 'set.name': 'שם', 'set.transcriber': 'תמלול', 'set.voice': 'קול', 'set.model': 'מודל', 'set.first': 'משפט פתיחה', 'set.updated': 'עודכן לאחרונה',
  'set.password': 'סיסמת דשבורד', 'set.password.sub': 'מחוברים בדפדפן הזה', 'set.signout': 'התנתקות',
});

// ------------------------------------------------------------------ data

export async function api(path, init = {}) {
  const headers = { ...(init.headers ?? {}) };
  const pw = store.get('dash_pw', '');
  if (pw) headers.Authorization = `Bearer ${pw}`;
  const res = await fetch(path, { ...init, headers });
  if (res.status === 401) {
    // Discard only the password this request was sent with, so a stale 401 cannot
    // wipe one the user has just typed on the login screen.
    if (store.get('dash_pw', '') === pw) store.del('dash_pw');
    showLogin();
    throw new Error('unauthorized');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

// Lists and stats come one page / one summary at a time from the server, so the
// browser never holds the whole history. Short cache keyed by the exact query.
const cache = { lists: new Map(), config: null, detail: new Map() };
const qs = (o) => Object.entries(o).filter(([, v]) => v !== '' && v != null && !(Array.isArray(v) && !v.length)).map(([k, v]) => `${k}=${encodeURIComponent(Array.isArray(v) ? v.join(',') : v)}`).join('&');
async function cached(path) {
  const hit = cache.lists.get(path);
  if (hit && Date.now() - hit.at < 4000) return hit.data;
  const data = await api(path);
  cache.lists.set(path, { data, at: Date.now() });
  return data;
}
// { items, total, page, size, pages }
const loadCalls = (params = {}) => cached('/api/calls?' + qs(params));
// { total, ended, live, avgSeconds, cost, intents, perDay, inRange, recent }
const loadStats = (days) => cached('/api/stats?' + qs({ days }));
async function loadConfig() {
  if (cache.config) return cache.config;
  cache.config = await api('/api/config');
  const name = cache.config.assistantName || '—';
  $('agentname').textContent = name;
  $('avatar').textContent = name.split(/[\s-]+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  return cache.config;
}
async function loadDetail(id, force = false) {
  const hit = cache.detail.get(id);
  if (!force && hit && (hit.endedAt || Date.now() - hit._at < 4000)) return hit;
  const d = await api(`/api/calls/${encodeURIComponent(id)}`);
  d._at = Date.now();
  cache.detail.set(id, d);
  return d;
}
const invalidate = () => { cache.lists.clear(); cache.detail.clear(); };

// ------------------------------------------------------------------ formatting

const fmtDur = (a, b) => {
  if (!a || !b) return '—';
  const s = Math.max(0, Math.round((new Date(b) - new Date(a)) / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};
const fmtTime = (iso) => iso
  ? new Date(iso).toLocaleString(lang === 'he' ? 'he-IL' : 'en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  : '—';
const money = (n) => '$' + (n || 0).toFixed(2);
const fmtSecs = (secs) => { const s = Math.max(0, Math.round(secs || 0)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
const statusOf = (c) => {
  if (!c.endedAt && ['in-progress', 'ringing', 'queued'].includes(c.status)) return 'live';
  if (/error|did-not-answer|busy|failed/.test(c.endedReason || '')) return 'failed';
  return c.endedAt ? 'ended' : 'queued';
};
const dotClass = (c) => ({ live: 'live', failed: 'fail', ended: 'ended', queued: '' })[statusOf(c)];
const srcOf = (c) => (c.number ? fmtPhone(c.number) : c.type === 'webCall' ? t('src.web') : t('src.phone'));
// Escaped HTML for the same, keeping a phone number a left-to-right run inside Hebrew text.
const srcHtml = (c) => (c.number ? `<span dir="ltr">${escapeHtml(fmtPhone(c.number))}</span>` : escapeHtml(srcOf(c)));
const INTENT_ORDER = ['yes', 'no', 'unsure', 'refused', 'not_reached', 'unknown'];
const INTENT_TONE = { yes: 'positive', no: 'negative', unsure: 'accent', refused: '', not_reached: '', unknown: '' };
const INTENT_COLOR = { yes: 'var(--positive)', no: 'var(--negative)', unsure: 'var(--accent)', refused: 'var(--text-2)', not_reached: 'var(--text-3)', unknown: 'var(--border-2)' };
const intentKey = (c) => (INTENT_ORDER.includes(c.intent) ? c.intent : 'unknown');
const intentBadge = (c) => `<span class="badge ${INTENT_TONE[intentKey(c)]}">${t('intent.' + intentKey(c))}</span>`;
const reasonLabel = (k) => (k ? t('reason.' + k) : '—');
// Vapi's endedReason in words; the same folding as endedGroup() in api/_analysis.js. Unknown keys stay raw.
const endedKey = (k = '') => (k === 'customer-ended-call' ? 'hungUp' : k === 'silence-timed-out' ? 'silence' : k === 'voicemail' ? 'voicemail'
  : k === 'customer-did-not-answer' ? 'noAnswer' : k === 'customer-busy' ? 'busy' : k.startsWith('assistant-') ? 'agentEnded'
  : k === 'exceeded-max-duration' ? 'tooLong' : k.includes('microphone') ? 'noMic' : /error|fail|pipeline/.test(k) ? 'technical' : 'other');
// Phones and small tablets (the tab-bar layout).
const isPhoneLayout = () => matchMedia('(max-width: 900px)').matches;
// After a page turn from the pager at the bottom, bring the list card's top back into view (phones; the app bar is subtracted by scroll-padding).
// The chat placeholder is text, not layout: swap it when the window crosses the phone breakpoint.
matchMedia('(max-width: 900px)').addEventListener('change', () => { const input = $('chatinput'); if (input) input.placeholder = isPhoneLayout() ? t('agent.type.short') : t('agent.type'); });
const scrollToCard = (box) => { if (isPhoneLayout() && box.getBoundingClientRect().top < document.querySelector('.topbar').offsetHeight) box.scrollIntoView({ block: 'start', behavior: 'smooth' }); };

// ------------------------------------------------------------------ topbar search

let query = '';
let searchTimer = 0;
$('search').oninput = () => {
  query = $('search').value.trim().toLowerCase();
  pager.page = 1;
  clearTimeout(searchTimer);
  listPager.page = 1;
  searchTimer = setTimeout(() => {
    // On a phone an open call hides the list, so a search there goes back to the list.
    if (location.hash.startsWith('#/calls/') && matchMedia('(max-width: 900px)').matches) location.hash = '#/calls';
    else if (location.hash.startsWith('#/list') || location.hash.startsWith('#/calls')) render();
    else location.hash = '#/calls';
  }, 250);
};
// The server searches raw fields; typed labels ("Will vote", "Browser", "בחר") are
// mapped to the intent keys / call types whose label contains the text, in either language.
function searchParams() {
  if (!query) return {};
  const hasLabel = (key) => [I18N.en[key], I18N.he[key]].some((l) => l && l.toLowerCase().includes(query));
  return {
    q: query,
    intents: INTENT_ORDER.filter((k) => hasLabel('intent.' + k)),
    types: hasLabel('src.web') ? ['webCall'] : [],
  };
}

// ------------------------------------------------------------------ overview

let range = Number(store.get('range', '7'));
$('rangetabs').querySelectorAll('button').forEach((b) => {
  b.classList.toggle('on', Number(b.dataset.range) === range);
  b.onclick = () => { range = Number(b.dataset.range); store.set('range', String(range)); $('rangetabs').querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b)); render(); };
});

// The hero tile's backdrop: the people the agent is calling. A gathering, nearer
// rows larger and stronger, kept to the end half so it never crowds the label or
// the number. The SVG is cropped to cover the tile (slice), and a phone sees the
// middle band of it, so the rows are spread to read at any height. [dir="rtl"]
// mirrors the whole thing (.stat-rings in app.css).
const person = (x, y, size, o) => `<g fill="var(--text-1)" fill-opacity="${o}" transform="translate(${x.toFixed(1)} ${y}) scale(${size})">
  <circle cx="0" cy="-7" r="4.6"/><path d="M-7.4 8v-2.6a7.4 7.4 0 0 1 14.8 0V8z"/></g>`;

const CROWD = [
  { y: 164, size: 1.3, n: 6, o: 0.075 },
  { y: 128, size: 1.1, n: 7, o: 0.055 },
  { y: 96, size: 0.92, n: 8, o: 0.04 },
  { y: 66, size: 0.78, n: 9, o: 0.028 },
  { y: 38, size: 0.66, n: 10, o: 0.02 },
];
const rings = () => `<svg class="stat-rings" aria-hidden="true" viewBox="0 0 320 190" preserveAspectRatio="xMidYMid slice">${
  CROWD.map((row) => {
    const gap = 172 / row.n;                        // the crowd lives in x 148..320
    return Array.from({ length: row.n }, (_, i) => person(150 + gap * (i + 0.5), row.y, row.size, row.o)).join('');
  }).join('')}</svg>`;

const statTile = ({ label, value, sub, hero }) => `<div class="stat${hero ? ' hero' : ''}">${hero ? rings() : ''}
  <div class="stat-label">${label}</div><div class="stat-value">${value}</div>
  <div class="stat-foot">${sub ? `<span class="stat-sub">${sub}</span>` : ''}</div></div>`;

// perDay arrives as [{ day: 'YYYY-MM-DD', n }] in Israel time; parse as local midnight for labels.
const toBuckets = (perDay) => perDay.map((b) => ({ date: new Date(b.day + 'T00:00:00'), n: Number(b.n), yes: Number(b.yes || 0), no: Number(b.no || 0), unsure: Number(b.unsure || 0), not_reached: Number(b.not_reached || 0) }));

// Day labels under a chart: weekday names for a week, day-of-month every 5th/10th day beyond that.
function axisLabels(buckets) {
  const n = buckets.length, k = n > 45 ? 10 : n > 14 ? 5 : 1;
  return buckets.map((b, i) => `<span style="flex:1;text-align:center">${n <= 7 ? t('day.' + b.date.getDay()) : (i % k === 0 ? b.date.getDate() : '')}</span>`).join('');
}

function barChart(buckets) {
  const w = 900, h = 190, pad = 22;
  const max = Math.max(1, ...buckets.map((b) => b.n));
  const n = buckets.length, slot = w / n, bw = Math.min(46, slot * 0.58);
  // Values sit in an HTML layer over the SVG: text inside the stretched SVG would warp with the width.
  const labels = [], peakAt = buckets.findIndex((b) => b.n === max);
  const bars = buckets.map((b, i) => {
    const bh = b.n ? Math.max(4, (b.n / max) * (h - pad - 6)) : 3;
    const x = i * slot + (slot - bw) / 2, y = h - bh;
    if (b.n) labels.push(`<span${i === peakAt ? ' class="peak"' : ''} style="left:${((x + bw / 2) / w * 100).toFixed(2)}%;top:${(y - 4).toFixed(0)}px">${b.n}</span>`);
    return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${bh.toFixed(1)}" rx="6" fill="${b.n ? 'var(--chart-line)' : 'var(--chart-grid)'}"/>`;
  }).join('');
  const grid = [0.33, 0.66].map((f) => `<line x1="0" x2="${w}" y1="${(h * f).toFixed(1)}" y2="${(h * f).toFixed(1)}" stroke="var(--chart-grid)"/>`).join('');
  return `<div class="chart-box${n > 31 ? ' very-dense' : n > 7 ? ' dense' : ''}"><svg class="chart" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">${grid}${bars}</svg><div class="chart-values">${labels.join('')}</div></div><div class="chart-axis">${axisLabels(buckets)}</div>`;
}

// One line per answer, the running total over the range, on the same day grid as
// the bars: the gap between "will vote" and "will not vote" is the story, and totals
// only ever climb, so the picture stays readable on quiet days. The SVG is stretched
// to the card width, so every stroke is non-scaling and nothing is drawn as fill geometry.
const TREND = ['yes', 'no', 'not_reached'];

// Adds b.sum = { yes, no, not_reached } running totals, in place.
function runningTotals(buckets) {
  const acc = Object.fromEntries(TREND.map((k) => [k, 0]));
  for (const b of buckets) { b.sum = {}; for (const k of TREND) b.sum[k] = (acc[k] += b[k]); }
  return buckets;
}

// Monotone cubic (Fritsch-Carlson) through the points: smooth, never overshoots, so a
// running total never appears to dip. pts are [x, y] numbers in viewBox units.
function smoothPath(pts) {
  const n = pts.length;
  if (n < 2) return n ? `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}` : '';
  const dx = [], m = [];
  for (let i = 0; i < n - 1; i++) { dx[i] = pts[i + 1][0] - pts[i][0]; m[i] = (pts[i + 1][1] - pts[i][1]) / dx[i]; }
  const tg = [m[0]];
  for (let i = 1; i < n - 1; i++) tg[i] = m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2;
  tg[n - 1] = m[n - 2];
  for (let i = 0; i < n - 1; i++) {
    if (m[i] === 0) { tg[i] = 0; tg[i + 1] = 0; continue; }
    const a = tg[i] / m[i], b = tg[i + 1] / m[i], s = a * a + b * b;
    if (s > 9) { const k = 3 / Math.sqrt(s); tg[i] = k * a * m[i]; tg[i + 1] = k * b * m[i]; }
  }
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i] / 3;
    d += ` C${(pts[i][0] + h).toFixed(1)} ${(pts[i][1] + tg[i] * h).toFixed(1)} ${(pts[i + 1][0] - h).toFixed(1)} ${(pts[i + 1][1] - tg[i + 1] * h).toFixed(1)} ${pts[i + 1][0].toFixed(1)} ${pts[i + 1][1].toFixed(1)}`;
  }
  return d;
}

function lineChart(buckets) {
  const w = 900, h = 190, top = 12, bottom = 6, n = buckets.length, slot = w / n, rows = 4;
  if (!n) return '';
  const rawMax = Math.max(1, ...TREND.map((k) => buckets[n - 1].sum[k]));
  const step = Math.ceil(rawMax / rows), max = step * rows;                // integer labels on every grid line
  const px = (i) => i * slot + slot / 2, py = (v) => top + (1 - v / max) * (h - top - bottom);
  const dash = 'stroke="var(--chart-grid)" stroke-dasharray="3 5" vector-effect="non-scaling-stroke"';
  const grid = Array.from({ length: rows + 1 }, (_, r) => `<line x1="0" x2="${w}" y1="${py(r * step).toFixed(1)}" y2="${py(r * step).toFixed(1)}" ${dash}/>`).join('');
  const k = n > 45 ? 10 : n > 14 ? 5 : 1;
  const vgrid = buckets.map((_, i) => (i % k === 0 ? `<line x1="${px(i).toFixed(1)}" x2="${px(i).toFixed(1)}" y1="${top}" y2="${(h - bottom).toFixed(1)}" ${dash}/>` : '')).join('');
  const series = TREND.map((key) => {
    const pts = buckets.map((b, i) => [px(i), py(b.sum[key])]);
    const line = smoothPath(pts);
    const area = `${line} L${pts[n - 1][0].toFixed(1)} ${py(0).toFixed(1)} L${pts[0][0].toFixed(1)} ${py(0).toFixed(1)} Z`;
    // Dots are zero-length round-capped strokes: a <circle> would be squashed by the horizontal stretch, a stroke width is not.
    const dots = n > 31 ? '' : buckets.map((b, i) => (b[key] ? `<path d="M${pts[i][0].toFixed(1)} ${pts[i][1].toFixed(1)}h0.01" stroke="var(--surface-1)" stroke-width="11" stroke-linecap="round" vector-effect="non-scaling-stroke"/><path d="M${pts[i][0].toFixed(1)} ${pts[i][1].toFixed(1)}h0.01" stroke="${INTENT_COLOR[key]}" stroke-width="7" stroke-linecap="round" vector-effect="non-scaling-stroke"/>` : '')).join('');
    return `<path d="${area}" fill="url(#trend-${key})"/><path d="${line}" fill="none" stroke="${INTENT_COLOR[key]}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>${dots}`;
  }).join('');
  const defs = `<defs>${TREND.map((key) => `<linearGradient id="trend-${key}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:${INTENT_COLOR[key]};stop-opacity:.22"/><stop offset="1" style="stop-color:${INTENT_COLOR[key]};stop-opacity:0"/></linearGradient>`).join('')}</defs>`;
  const yLabels = Array.from({ length: rows + 1 }, (_, r) => `<span>${max - r * step}</span>`).join('');
  return `<div class="linechart">
    <div class="linechart-y">${yLabels}</div>
    <div class="linechart-plot"><svg class="chart" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">${defs}${grid}${vgrid}${series}</svg><div class="chart-axis">${axisLabels(buckets)}</div>
      <div class="linechart-guide" hidden></div><div class="linechart-tip" hidden></div></div></div>`;
}

const trendLegend = (buckets) => `<div class="legend">${TREND.map((key) => `<span class="legend-item"><span class="dot" style="background:${INTENT_COLOR[key]}"></span>${t('intent.' + key)} <b>${buckets.length ? buckets[buckets.length - 1].sum[key] : 0}</b></span>`).join('')}</div>`;

// Hover: a dashed guide on the nearest day and a tooltip with that day's three counts.
function bindLineChart(root, buckets) {
  const plot = root.querySelector('.linechart-plot'); if (!plot) return;
  const svg = plot.querySelector('svg'), guide = plot.querySelector('.linechart-guide'), tip = plot.querySelector('.linechart-tip');
  const n = buckets.length, locale = lang === 'he' ? 'he-IL' : 'en-GB';
  tip.dir = document.documentElement.dir;           // the plot is LTR; the tooltip text follows the UI
  const show = (clientX) => {
    const r = svg.getBoundingClientRect();
    const i = Math.max(0, Math.min(n - 1, Math.floor((clientX - r.left) / r.width * n)));
    const b = buckets[i], x = (i + 0.5) / n * r.width;
    guide.style.left = `${x}px`; guide.hidden = false;
    tip.innerHTML = `<b>${b.date.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' })}</b>` +
      TREND.map((key) => `<span class="tip-row"><span class="dot" style="background:${INTENT_COLOR[key]}"></span><span>${t('intent.' + key)}</span><b>${b.sum[key]}</b></span>`).join('');
    tip.hidden = false;
    const flip = x + 14 + tip.offsetWidth > r.width;
    tip.style.left = `${Math.max(0, Math.min(r.width - tip.offsetWidth, flip ? x - 14 - tip.offsetWidth : x + 14))}px`;
  };
  const hide = () => { guide.hidden = true; tip.hidden = true; };
  plot.onpointermove = (e) => show(e.clientX);
  plot.onpointerdown = (e) => { if (e.pointerType !== 'mouse') show(e.clientX); };   // a tap shows that day
  plot.onpointerleave = (e) => { if (e.pointerType !== 'touch') hide(); };          // a lifted finger keeps it
  // A tap anywhere else closes it; the listener removes itself once the chart is gone.
  const ac = new AbortController();
  document.addEventListener('pointerdown', (e) => { if (!plot.isConnected) ac.abort(); else if (!plot.contains(e.target)) hide(); }, { signal: ac.signal });
}

function donut(counts, total) {
  const r = 54, c = 2 * Math.PI * r;
  let offset = 0;
  const arcs = INTENT_ORDER.filter((k) => counts[k]).map((k) => {
    const len = counts[k] / total * c;
    const el = `<circle r="${r}" cx="70" cy="70" fill="none" stroke="${INTENT_COLOR[k]}" stroke-width="16" stroke-dasharray="${len.toFixed(2)} ${(c - len).toFixed(2)}" stroke-dashoffset="${(-offset).toFixed(2)}" transform="rotate(-90 70 70)"/>`;
    offset += len; return el;
  }).join('');
  const legend = INTENT_ORDER.filter((k) => counts[k]).map((k) => `
    <div class="donut-row">
      <span class="dot" style="background:${INTENT_COLOR[k]}"></span>
      <span class="donut-label">${t('intent.' + k)}</span>
      <b>${counts[k]}</b>
      <span class="faint donut-pct">${Math.round(counts[k] / total * 100)}%</span></div>`).join('');
  return `<div class="donut">
    <svg class="donut-svg" width="140" height="140" viewBox="0 0 140 140">
      <circle r="${r}" cx="70" cy="70" fill="none" stroke="var(--chart-grid)" stroke-width="16"/>${arcs}
      <text x="70" y="66" text-anchor="middle" font-size="22" font-weight="600" fill="var(--text-1)" font-family="var(--font-ui)">${total}</text>
      <text x="70" y="84" text-anchor="middle" font-size="10" fill="var(--text-3)" font-family="var(--font-ui)">${t('unit.calls')}</text></svg>
    <div class="donut-legend">${legend}</div></div>`;
}

const recentRows = (calls) => !calls.length ? `<div class="page-empty">${t('empty.calls')}</div>` : `<div class="rows">${calls.map((c) => `
  <div class="row" data-id="${c.id}">
    <span class="dot ${dotClass(c)}"></span>
    <div class="row-main">
      <div class="row-title">${srcHtml(c)} <span class="faint" style="font-weight:400">· ${t('status.' + statusOf(c))}</span></div>
      <div class="row-sub">${fmtTime(c.createdAt)}</div></div>
    ${intentBadge(c)}
    <div class="row-end"><div class="row-val mono">${fmtDur(c.startedAt, c.endedAt)}</div><div class="row-sub">${money(c.cost)}</div></div>
  </div>`).join('')}</div>`;


registerPage('overview', {
  skeleton: () => `
    <div class="stat-row">${sk.stat(true)}${sk.stat()}${sk.stat()}${sk.stat()}${sk.stat()}</div>
    <div class="grid overview-pair">
      ${sk.card(`${sk.line('w30')}<div class="skeleton skel-block" style="margin-top:16px"></div>`)}
      ${sk.card(`${sk.line('w30')}<div style="display:flex;gap:20px;align-items:center;margin-top:16px"><div class="skeleton skel-circle"></div><div style="flex:1">${sk.line()}${sk.line('w70')}${sk.line('w50')}</div></div>`)}
    </div>
    ${sk.card(`${sk.line('w30')}<div class="skeleton skel-block" style="margin-top:16px"></div>`)}
    ${sk.card(`${sk.line('w30')}${sk.rows(4)}`)}`,
  async load() {
    const [s] = await Promise.all([loadStats(range), loadConfig().catch(() => null)]);
    const counts = s.intents;
    const answered = (counts.yes || 0) + (counts.no || 0) + (counts.unsure || 0);
    const yesPct = answered ? Math.round((counts.yes || 0) / answered * 100) : 0;
    const avg = s.avgSeconds;
    const buckets = runningTotals(toBuckets(s.perDay));
    const fmtN = (n) => n.toLocaleString(lang === 'he' ? 'he-IL' : 'en-US');
    const html = pageHead('page.overview', 'page.overview.sub') + `
      <div class="stat-row">
        ${statTile({ hero: true, label: t('stat.total'), value: fmtN(s.total), sub: t('stat.total.sub') })}
        ${statTile({ label: t('stat.completed'), value: fmtN(s.ended), sub: s.live ? `${s.live} ${t('stat.live')}` : '' })}
        ${statTile({ label: t('stat.avg'), value: fmtSecs(avg) })}
        ${statTile({ label: t('stat.cost'), value: money(s.cost) })}
        ${statTile({ label: t('stat.yes'), value: `${yesPct}%`, sub: `${fmtN(counts.yes || 0)}/${fmtN(answered)} ${t('stat.yes.sub')}` })}
      </div>
      <div class="grid overview-pair">
        <div class="card"><div class="card-head"><span class="card-title">${t('card.week')} <span class="count">· ${fmtN(s.inRange)} ${t('unit.calls')}</span></span><span class="badge">${range}d</span></div>${barChart(buckets)}</div>
        <div class="card"><div class="card-head"><span class="card-title">${t('card.intent')}</span></div>${s.total ? donut(counts, s.total) : `<div class="page-empty">${t('empty.calls')}</div>`}</div>
      </div>
      <div class="card"><div class="card-head wrap"><span class="card-title">${t('card.trend')} <span class="count">· ${t('card.trend.sub')}</span></span>${trendLegend(buckets)}</div>${lineChart(buckets)}</div>
      <div class="card"><div class="card-head"><span class="card-title">${t('card.recent')}</span><a class="btn secondary sm" href="#/calls">${t('see.all')}</a></div>${recentRows(s.recent)}</div>`;
    return { html, mount(main) {
      main.querySelectorAll('.row[data-id]').forEach((el) => { el.onclick = () => { location.hash = `#/calls/${el.dataset.id}`; }; });
      bindLineChart(main, buckets);
    } };
  },
});

// ------------------------------------------------------------------ analysis

// Numbers from /api/analysis (all computed by the database from stored calls). The
// findings are plain rules over those numbers, not a model: every sentence can be
// traced back to a count on this page or in the export.
const tf = (key, vars) => t(key).replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? ''));
const pctOf = (a, b) => (b ? Math.round((a / b) * 100) : 0);
const DOWNLOAD_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></svg>';
const ENDED_TONE = { technical: 'neg', noMic: 'neg', hungUp: 'warn', silence: '', voicemail: '', noAnswer: '', busy: '', agentEnded: '', tooLong: 'warn', other: '' };

function findings(a) {
  const f = a.funnel, ap = a.approach, out = [];
  const add = (tone, key, vars = {}) => out.push({ tone, text: tf(key, vars) });
  if (!f.total) { add('', 'f.none'); return out; }
  add(pctOf(f.reached, f.total) < 40 ? 'warn' : 'good', 'f.reach', { a: f.reached, b: f.total, p: pctOf(f.reached, f.total) });
  if (f.answered) add(pctOf(f.yes, f.answered) >= 50 ? 'good' : 'warn', 'f.yes', { a: f.yes, b: f.answered, p: pctOf(f.yes, f.answered) });
  const noUnsure = f.no + f.unsure;
  if (a.reasons.length && noUnsure) add('', 'f.topReason', { r: t('reason.' + a.reasons[0].key), a: a.reasons[0].n, b: noUnsure, p: pctOf(a.reasons[0].n, noUnsure) });
  if (f.hungUpEarly) add('warn', 'f.early', { a: f.hungUpEarly });
  const g = Object.fromEntries(a.endedReasons.map((e) => [e.key, e.n]));
  if (g.silence) add('', 'f.silence', { a: g.silence });
  if (g.technical || g.noMic) add('bad', 'f.technical', { a: (g.technical || 0) + (g.noMic || 0) });
  if (f.askedIfBot) add('', 'f.bot', { a: f.askedIfBot });
  if (f.optOut) add('bad', 'f.optout', { a: f.optOut });
  if (noUnsure && ap.askedReason < noUnsure) add('warn', 'f.askedReason', { a: ap.askedReason, b: noUnsure });
  if (ap.appealJewishState || ap.appealHighCourt) add('', 'f.appeal', { a: ap.appealJewishState, b: ap.appealHighCourt });
  if (f.noAnalysis) add('', 'f.noAnalysis', { a: f.noAnalysis });
  return out;
}

// label / value on one line, a bar under it; share is of `base`
const barList = (items, base) => `<div class="bars">${items.map((it) => `
  <div class="bar-row"><span class="bar-label">${it.label}</span><span class="bar-val"><b>${it.n}</b> · ${pctOf(it.n, it.base ?? base)}%${it.of ? ` <span class="bar-of">${it.of}</span>` : ''}</span>
    <div class="bar-track"><div class="bar-fill ${it.tone ?? ''}" style="width:${it.n ? Math.max(1, Math.min(100, pctOf(it.n, it.base ?? base))) : 0}%"></div></div></div>`).join('')}</div>`;

async function exportReport(btn) {
  if (btn.disabled) return;
  const label = btn.innerHTML;
  btn.disabled = true; btn.textContent = t('an.exporting');
  try {
    const pw = store.get('dash_pw', '');
    const res = await fetch(`/api/export?days=${range}&lang=${lang}`, { headers: pw ? { Authorization: `Bearer ${pw}` } : {} });
    if (res.status === 401) { showLogin(); throw new Error('unauthorized'); }
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || res.statusText);
    const blob = await res.blob();
    const name = (res.headers.get('Content-Disposition') || '').match(/filename="([^"]+)"/)?.[1] || `voice-report-${range}d.xlsx`;
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), { href: url, download: name });
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    toast(t('an.exported'));
  } catch (e) { toast(e.message, true); } finally { btn.disabled = false; btn.innerHTML = label; }
}

// The AI write-up (Gemini through OpenRouter). The numbers come from /api/analysis,
// the model only reads them; /api/insights keeps the last one, so a page view is free.
const SPARK_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M12 3v4"/><path d="M12 17v4"/><path d="M3 12h4"/><path d="M17 12h4"/><path d="m5.6 5.6 2.8 2.8"/><path d="m15.6 15.6 2.8 2.8"/><path d="m18.4 5.6-2.8 2.8"/><path d="m8.4 15.6-2.8 2.8"/></svg>';
const aiList = (title, items) => (items?.length ? `<div class="ai-block"><div class="ai-block-title">${title}</div><ul class="ai-points">${items.map((x) => `<li>${escapeHtml(x)}</li>`).join('')}</ul></div>` : '');

function insightBody(ins) {
  if (!ins) return `<div class="page-empty">${t('ai.none')}</div>`;
  const d = ins.data ?? {};
  return `${d.headline ? `<p class="ai-headline">${escapeHtml(d.headline)}</p>` : ''}
    ${d.findings?.length ? `<ul class="findings ai-findings">${d.findings.map((x) => `<li class="${x.tone ?? ''}"><span class="dot"></span><span>${escapeHtml(x.text)}</span></li>`).join('')}</ul>` : ''}
    <div class="ai-blocks">${aiList(t('ai.why'), d.why_not_voting)}${aiList(t('ai.wrong'), d.what_went_wrong)}${aiList(t('ai.advice'), d.advice)}</div>
    <div class="ai-foot"><span class="faint">${tf('ai.by', { m: escapeHtml((ins.model || '').split('/').pop()), t: fmtTime(ins.generatedAt) })}</span>${ins.stale ? `<span class="badge accent">${t('ai.stale')}</span>` : ''}</div>`;
}

const insightCard = (ins, busy) => `<div class="card ai-card" id="ai-card">
  <div class="card-head wrap"><span class="card-title">${SPARK_ICON} ${t('ai.title')} <span class="count">· ${t('ai.sub')}</span></span>
    <button class="btn secondary sm" id="ai-again" type="button"${busy ? ' disabled' : ''}>${busy ? t('ai.writing') : t('ai.refresh')}</button></div>
  <div id="ai-body">${busy ? `${sk.line('w70')}${sk.line()}${sk.line('w50')}` : insightBody(ins)}</div></div>`;

// One write at a time per range+language, so a re-render cannot start a second one.
const aiBusy = new Set();
async function loadInsight(main, { write } = {}) {
  const card = main.querySelector('#ai-card'); if (!card) return;
  const key = `${range}/${lang}`;
  const paint = (html) => { const box = main.querySelector('#ai-body'); if (box) box.innerHTML = html; };
  const button = () => main.querySelector('#ai-again');
  const idle = () => { const b = button(); if (b) { b.disabled = false; b.textContent = t('ai.refresh'); } };
  try {
    let { insight, hasKey } = await api(`/api/insights?days=${range}&lang=${lang}`);
    const needsWrite = write || !insight || insight.stale;
    if (needsWrite && hasKey && !aiBusy.has(key)) {
      aiBusy.add(key);
      const b = button(); if (b) { b.disabled = true; b.textContent = t('ai.writing'); }
      if (!insight) paint(`${sk.line('w70')}${sk.line()}${sk.line('w50')}`);
      try { ({ insight } = await api(`/api/insights?days=${range}&lang=${lang}${write ? '&force=1' : ''}`, { method: 'POST' })); }
      finally { aiBusy.delete(key); idle(); }
    }
    if (!main.isConnected) return;
    idle();
    paint(insight ? insightBody(insight) : `<div class="page-empty">${hasKey ? t('ai.none') : t('ai.nokey')}</div>`);
  } catch (e) {
    if (!main.isConnected) return;
    idle();
    paint(`<div class="page-empty">${escapeHtml(tf('ai.failed', { e: e.message }))}</div>`);
  }
}

registerPage('analysis', {
  skeleton: () => `
    <div class="stat-row">${sk.stat(true)}${sk.stat()}${sk.stat()}${sk.stat()}${sk.stat()}</div>
    ${sk.card(`${sk.line('w30')}${sk.line('w70')}${sk.line('w50')}${sk.line('w70')}`)}
    <div class="grid halves">${sk.card(`${sk.line('w30')}${sk.rows(4)}`)}${sk.card(`${sk.line('w30')}${sk.rows(4)}`)}</div>`,
  async load() {
    let a;
    try { a = await cached('/api/analysis?days=' + range); } catch (e) {
      const nodb = /needs_database/.test(e.message);
      return { html: pageHead('page.analysis', 'page.analysis.sub') + `<div class="card"><div class="page-empty">${escapeHtml(nodb ? t('an.nodb') : e.message)}</div></div>` };
    }
    const f = a.funnel, ap = a.approach, fmtN = (n) => Number(n).toLocaleString(lang === 'he' ? 'he-IL' : 'en-US');
    const noUnsure = f.no + f.unsure;
    const head = pageHead('page.analysis', 'page.analysis.sub', `<span style="display:inline-flex;gap:10px;align-items:center;flex-wrap:wrap">
      <span class="badge">${tf('an.range', { n: a.days })}</span>
      <button class="btn secondary sm" id="an-export" type="button">${DOWNLOAD_ICON} ${t('an.export')}</button></span>`);

    const tiles = `<div class="stat-row">
      ${statTile({ hero: true, label: t('an.reached'), value: `${pctOf(f.reached, f.total)}%`, sub: tf('an.reached.sub', { a: fmtN(f.reached), b: fmtN(f.total) }) })}
      ${statTile({ label: t('an.yes'), value: `${pctOf(f.yes, f.answered)}%`, sub: tf('an.ofAnswered', { a: f.yes, b: f.answered }) })}
      ${statTile({ label: t('an.no'), value: `${pctOf(f.no, f.answered)}%`, sub: tf('an.ofAnswered', { a: f.no, b: f.answered }) })}
      ${statTile({ label: t('an.early'), value: fmtN(f.hungUpEarly), sub: t('an.early.sub') })}
      ${statTile({ label: t('an.optout'), value: fmtN(f.optOut), sub: t('an.optout.sub') })}
    </div>`;

    const findingsCard = `<div class="card"><div class="card-head"><span class="card-title">${t('an.findings')}</span></div>
      <ul class="findings">${findings(a).map((x) => `<li class="${x.tone}"><span class="dot"></span><span>${escapeHtml(x.text)}</span></li>`).join('')}</ul></div>`;

    const reasonsCard = `<div class="card"><div class="card-head wrap"><span class="card-title">${t('an.reasons')} <span class="count">· ${t('an.reasons.sub')}</span></span></div>
      ${a.reasons.length ? barList(a.reasons.map((r) => ({ label: escapeHtml(t('reason.' + r.key)), n: r.n, tone: 'neg' })), a.reasons.reduce((s, r) => s + r.n, 0)) : `<div class="page-empty">${t('an.reasons.empty')}</div>`}</div>`;

    const quotesCard = `<div class="card"><div class="card-head"><span class="card-title">${t('an.quotes')}</span></div>
      ${a.quotes.length ? `<div class="quotes">${a.quotes.map((q) => `<div class="quote" data-id="${escapeHtml(q.callId)}">
        <div class="verbatim" dir="auto">${escapeHtml(q.text)}</div>
        <div class="quote-meta">${intentBadge({ intent: q.intent })}${q.category && q.category !== 'not_applicable' ? `<span class="badge">${escapeHtml(t('reason.' + q.category))}</span>` : ''}${q.city ? `<span dir="auto">${escapeHtml(q.city)}</span>` : ''}<span>${fmtTime(q.createdAt)}</span></div></div>`).join('')}</div>` : `<div class="page-empty">${t('an.quotes.empty')}</div>`}</div>`;

    const wrongTotal = a.endedReasons.reduce((s, e) => s + e.n, 0);
    const wrongCard = `<div class="card"><div class="card-head wrap"><span class="card-title">${t('an.wrong')} <span class="count">· ${t('an.wrong.sub')}</span></span></div>
      ${wrongTotal ? barList(a.endedReasons.map((e) => ({ label: t('ended.' + e.key), n: e.n, tone: ENDED_TONE[e.key] ?? '' })), wrongTotal) : `<div class="page-empty">${t('an.wrong.empty')}</div>`}
      <div class="mini-stats">
        <div class="stat"><div class="stat-label">${t('an.flag.early')}</div><div class="stat-value">${fmtN(f.hungUpEarly)}</div></div>
        <div class="stat"><div class="stat-label">${t('an.flag.bot')}</div><div class="stat-value">${fmtN(f.askedIfBot)}</div></div>
        <div class="stat"><div class="stat-label">${t('an.flag.audio')}</div><div class="stat-value">${fmtN(f.qualityBad)}</div></div>
      </div></div>`;

    const closings = ap.closingDelivered || (ap.appealJewishState + ap.appealHighCourt);
    const approachItems = [
      { label: t('an.ap.askedReason'), n: ap.askedReason, base: noUnsure, of: t('an.ap.of.noUnsure') },
      { label: t('an.ap.closingDelivered'), n: ap.closingDelivered, base: noUnsure, of: t('an.ap.of.noUnsure') },
      { label: t('an.ap.appealJewishState'), n: ap.appealJewishState, base: closings, of: t('an.ap.of.closing') },
      { label: t('an.ap.appealHighCourt'), n: ap.appealHighCourt, base: closings, of: t('an.ap.of.closing') },
      { label: t('an.ap.thankedYes'), n: ap.thankedYes, base: f.yes, of: t('an.ap.of.yes'), tone: 'good' },
      { label: t('an.ap.politeExit'), n: ap.politeExit, base: f.reached, of: t('an.ap.of.reached') },
      { label: t('an.ap.askedQuestion'), n: ap.askedQuestion, base: ap.conversations, of: t('an.ap.of.conv') },
    ];
    const approachCard = `<div class="card"><div class="card-head wrap"><span class="card-title">${t('an.approach')} <span class="count">· ${t('an.approach.sub')}</span></span></div>
      ${barList(approachItems, 1)}
      ${ap.conversations ? `<p class="page-sub" style="margin-top:14px">${tf('an.ap.turns', { a: ap.avgAgentTurns.toFixed(1), b: ap.avgUserTurns.toFixed(1) })}</p>` : ''}</div>`;

    const citiesCard = `<div class="card"><div class="card-head"><span class="card-title">${t('an.cities')}</span></div>
      ${a.cities.length ? `<div style="overflow-x:auto"><table class="table nowrap">
        <thead><tr><th>${t('an.col.city')}</th><th class="end">${t('an.col.calls')}</th><th class="end">${t('an.col.yes')}</th><th class="end">${t('an.col.no')}</th><th class="end">${t('an.col.nr')}</th><th class="end">${t('an.col.rate')}</th></tr></thead>
        <tbody>${a.cities.map((c) => `<tr><td><bdi>${escapeHtml(c.city)}</bdi></td><td class="end mono">${c.total}</td><td class="end mono">${c.yes}</td><td class="end mono">${c.no}</td><td class="end mono">${c.notReached}</td><td class="end mono">${pctOf(c.yes, c.yes + c.no + c.unsure)}%</td></tr>`).join('')}</tbody></table></div>` : `<div class="page-empty">${t('an.cities.empty')}</div>`}</div>`;

    const days = a.daily.filter((d) => d.total).reverse();
    const dailyCard = `<div class="card"><div class="card-head wrap"><span class="card-title">${t('an.daily')} <span class="count">· ${t('an.daily.sub')}</span></span></div>
      ${days.length ? `<div style="overflow-x:auto"><table class="table nowrap">
        <thead><tr><th>${t('an.col.day')}</th><th class="end">${t('an.col.calls')}</th><th class="end">${t('an.col.reached')}</th><th class="end">${t('an.col.yes')}</th><th class="end">${t('an.col.no')}</th><th class="end">${t('an.col.unsure')}</th><th class="end">${t('an.col.refused')}</th><th class="end">${t('an.col.nr')}</th><th class="end">${t('an.col.optout')}</th><th class="end">${t('an.col.cost')}</th></tr></thead>
        <tbody>${days.map((d) => `<tr><td class="mono">${d.day}</td><td class="end mono">${d.total}</td><td class="end mono">${d.reached}</td><td class="end mono">${d.yes}</td><td class="end mono">${d.no}</td><td class="end mono">${d.unsure}</td><td class="end mono">${d.refused}</td><td class="end mono">${d.notReached}</td><td class="end mono">${d.optOut}</td><td class="end mono">${money(d.cost)}</td></tr>`).join('')}</tbody></table></div>` : `<div class="page-empty">${t('f.none')}</div>`}</div>`;

    const html = head + tiles + insightCard(null, true) + findingsCard
      + `<div class="grid halves">${reasonsCard}${quotesCard}</div>`
      + `<div class="grid halves">${wrongCard}${approachCard}</div>`
      + `<div class="grid halves wide-end">${citiesCard}${dailyCard}</div>`;
    return { html, mount(main) {
      main.querySelector('#an-export').onclick = (e) => exportReport(e.currentTarget);
      main.querySelector('#ai-again').onclick = () => loadInsight(main, { write: true });
      loadInsight(main);
      main.querySelectorAll('.quote[data-id]').forEach((el) => { el.onclick = () => { location.hash = `#/calls/${el.dataset.id}`; }; });
    } };
  },
});

// ------------------------------------------------------------------ calls

// Paging state outlives renders. `keep` is the selected call at the time of the
// last explicit page change, so paging away from the selected row is honoured
// while a *new* selection (or a deep link) still jumps to the page that holds it.
const PAGE_SIZES = [10, 25, 50];
let livePoll = 0;   // re-render timer while a call is still live
const pager = { page: 1, size: PAGE_SIZES.includes(Number(store.get('page_size'))) ? Number(store.get('page_size')) : 10, keep: null };

// 1 … 4 5 6 … 12  (never more than seven slots)
function pageNumbers(page, pages) {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
  let keep;
  if (page <= 4) keep = [1, 2, 3, 4, 5, pages];
  else if (page >= pages - 3) keep = [1, pages - 4, pages - 3, pages - 2, pages - 1, pages];
  else keep = [1, page - 1, page, page + 1, pages];
  const out = []; let prev = 0;
  for (const p of keep) { if (p - prev > 1) out.push('…'); out.push(p); prev = p; }
  return out;
}

function pagerBar(total, page, pages, size = pager.size) {
  const from = total ? (page - 1) * size + 1 : 0, to = Math.min(total, page * size);
  const chev = (d) => `<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="${d === 'prev' ? 'm15 18-6-6 6-6' : 'm9 18 6-6-6-6'}"/></svg>`;
  return `<div class="pager">
    <span class="pager-info faint">${t('pager.of').replace('{a}–{b}', `<bdi dir="ltr">${fmtN(from)}–${fmtN(to)}</bdi>`).replace('{n}', fmtN(total))}</span>
    <div class="pager-nav">
      <label class="select sm"><select id="page-size" aria-label="${t('pager.size')}">${PAGE_SIZES.map((n) => `<option value="${n}"${n === size ? ' selected' : ''}>${n} ${t('pager.size')}</option>`).join('')}</select>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg></label>
      ${pages > 1 ? `
      <button class="icon-btn" id="page-prev" type="button"${page <= 1 ? ' disabled' : ''} title="${t('pager.prev')}" aria-label="${t('pager.prev')}">${chev('prev')}</button>
      <span class="pager-page"><bdi dir="ltr">${fmtN(page)} / ${fmtN(pages)}</bdi></span>
      <div class="tabs" id="page-nums">${pageNumbers(page, pages).map((p) => p === '…' ? `<span class="pager-gap">…</span>` : `<button type="button" data-page="${p}"${p === page ? ' class="on" aria-current="page"' : ''}>${p}</button>`).join('')}</div>
      <button class="icon-btn" id="page-next" type="button"${page >= pages ? ' disabled' : ''} title="${t('pager.next')}" aria-label="${t('pager.next')}">${chev('next')}</button>` : ''}
    </div>
  </div>`;
}

// Fills the list card for the current page and wires its controls. Paging
// re-runs only this, so the detail panel beside it never blinks.
// Asks the server for the current page. `locate` is sent only when the selection
// changed since the last explicit page turn, so the row is brought into view on
// deep links but paging away from it is honoured.
let callsFetchGen = 0;
async function fetchCallsPage(selectedId) {
  const my = ++callsFetchGen;
  const locate = selectedId && selectedId !== pager.keep ? selectedId : '';
  const res = await loadCalls({ page: pager.page, size: pager.size, locate, ...searchParams() });
  if (my === callsFetchGen) {                 // a newer fetch owns the state now
    pager.page = res.page;
    if (selectedId) pager.keep = selectedId;
  }
  return res;
}
let lastPageName = null;

// Paints one page into the list card and wires its controls. Only this card is
// redrawn on a page turn, so the conversation panel beside it never blinks.
function renderCallsList(main, res, selectedId) {
  const box = main.querySelector('#calls-list'); if (!box) return;
  box.innerHTML = callsTable(res.items, selectedId) + (res.total ? pagerBar(res.total, res.page, res.pages) : '');
  const head = main.querySelector('#calls-count'); if (head) head.textContent = `${fmtN(res.total)} ${t('unit.calls')}`;
  let busy = false;
  // relocate: after a size change the selected call should be brought back into view.
  const go = async (p, { relocate = false } = {}) => {
    if (busy) return; busy = true;
    pager.page = p; pager.keep = relocate ? null : selectedId;
    box.innerHTML = sk.rows(Math.min(pager.size, 7));
    scrollToCard(box);
    try {
      const next = await fetchCallsPage(selectedId);
      if (!box.isConnected) return;             // the page was re-rendered meanwhile; leave the new card alone
      renderCallsList(main, next, selectedId);
    } catch (e) {
      if (!box.isConnected) return;
      box.innerHTML = `<div class="page-empty">${escapeHtml(e.message)}<br><br><button class="btn secondary sm" type="button" id="calls-retry">${t('retry')}</button></div>`;
      box.querySelector('#calls-retry').onclick = () => { busy = false; go(p, { relocate }); };
    }
    busy = false;
  };
  box.querySelectorAll('tr[data-id]').forEach((tr) => { tr.onclick = () => { location.hash = '#/calls/' + tr.dataset.id; }; });
  box.querySelectorAll('#page-nums button[data-page]').forEach((b) => { b.onclick = () => go(Number(b.dataset.page)); });
  const prev = box.querySelector('#page-prev'); if (prev) prev.onclick = () => go(pager.page - 1);
  const next = box.querySelector('#page-next'); if (next) next.onclick = () => go(pager.page + 1);
  const size = box.querySelector('#page-size');
  if (size) size.onchange = () => { pager.size = listPager.size = Number(size.value); store.set('page_size', size.value); go(1, { relocate: true }); };
}

function callsTable(calls, selectedId) {
  if (!calls.length) return `<div class="page-empty">${query ? t('empty.search') : t('empty.calls')}</div>`;
  return `<div style="overflow-x:auto"><table class="table cards calls-table">
    <thead><tr><th>${t('col.status')}</th><th>${t('col.source')}</th><th>${t('col.started')}</th><th>${t('col.length')}</th><th>${t('col.intent')}</th><th class="end">${t('col.cost')}</th></tr></thead>
    <tbody>${calls.map((c) => `<tr class="clickable${c.id === selectedId ? ' on' : ''}" data-id="${c.id}">
      <td><span style="display:inline-flex;align-items:center;gap:8px"><span class="dot ${dotClass(c)}"></span>${t('status.' + statusOf(c))}</span></td>
      <td>${srcHtml(c)}</td><td class="faint">${fmtTime(c.createdAt)}</td>
      <td class="mono">${fmtDur(c.startedAt, c.endedAt)}</td><td>${intentBadge(c)}</td><td class="end mono">${money(c.cost)}</td></tr>`).join('')}</tbody></table></div>`;
}

const bubble = (role, text, partial = false) => `<div class="turn ${role === 'user' ? 'user' : ''}"><div class="bubble${partial ? ' partial' : ''}">
  <div class="who">${role === 'user' ? t('who.user') : t('who.agent')}</div><div class="say" dir="auto">${escapeHtml(text)}</div></div></div>`;

// Phones hide the list behind an open call; this is the way back (desktop hides it).
const backLink = () => `<a class="btn secondary sm only-mobile detail-back" href="#/calls"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="m15 18-6-6 6-6"/></svg> ${t('detail.back')}</a>`;

function detailPanel(d) {
  if (!d) return `<div class="card"><div class="page-empty">${t('detail.pick')}</div></div>`;
  const sd = d.analysis?.structuredData;
  const flags = sd ? [
    sd.opt_out_requested && `<span class="badge negative">${t('flag.optout')}</span>`,
    sd.asked_if_bot && `<span class="badge accent">${t('flag.bot')}</span>`,
    sd.call_quality_ok === false && `<span class="badge">${t('flag.quality')}</span>`,
  ].filter(Boolean).join('') : '';
  // Vapi stores the agent's speech as one message per TTS chunk ("היי", "מדברת שיר", …).
  // Merge consecutive same-speaker fragments so it reads like a conversation.
  const turns = [];
  for (const m of d.messages) {
    const last = turns[turns.length - 1];
    if (last && last.role === m.role) last.text += (/^[.,!?]/.test(m.text) ? '' : ' ') + m.text;
    else turns.push({ role: m.role, text: m.text });
  }
  const convo = turns.length
    ? `<div class="convo">${turns.map((m) => bubble(m.role, m.text.trim())).join('')}</div>`
    : `<div class="page-empty">${d.endedAt ? t('detail.empty') : t('detail.live')}</div>`;
  return `<div class="card">
    ${backLink()}
    <div class="detail-head">
      <span class="card-title">${t('detail.title')} <span class="count">· ${srcHtml(d)} · ${fmtTime(d.createdAt)}</span></span>
      <span style="display:inline-flex;gap:8px;align-items:center">${intentBadge(d)}<span class="mono faint">${fmtDur(d.startedAt, d.endedAt)} · ${money(d.cost)}</span></span>
    </div>
    ${d.recordingUrl ? `<audio controls preload="none" src="${escapeHtml(d.recordingUrl)}"></audio>` : ''}
    ${convo}
    ${sd || d.analysis?.summary ? `<div class="card nested" style="margin-top:16px">
      <div class="card-head" style="margin-bottom:12px"><span class="card-title" style="font-size:13px">${t('detail.analysis')}</span>${flags ? `<span class="flags">${flags}</span>` : ''}</div>
      <div class="analysis-grid">
        ${sd ? `<div><div class="k">${t('col.intent')}</div>${intentBadge(d)}</div>
        ${sd.reason_category && sd.reason_category !== 'not_applicable' ? `<div><div class="k">${t('detail.reason')}</div>${escapeHtml(reasonLabel(sd.reason_category))}</div>` : ''}` : ''}
        ${sd?.reason_verbatim ? `<div style="grid-column:1/-1"><div class="k">${t('detail.verbatim')}</div><div class="verbatim" dir="auto">${escapeHtml(sd.reason_verbatim)}</div></div>` : ''}
        ${d.analysis?.summary ? `<div style="grid-column:1/-1"><div class="k">${t('detail.summary')}</div><div class="summary" dir="auto">${escapeHtml(d.analysis.summary)}</div></div>` : ''}
        ${d.endedReason ? `<div><div class="k">${t('detail.ended')}</div>${endedKey(d.endedReason) === 'other' ? `<span class="mono faint">${escapeHtml(d.endedReason)}</span>` : `<span title="${escapeHtml(d.endedReason)}">${t('ended.' + endedKey(d.endedReason))}</span>`}</div>` : ''}
      </div></div>` : ''}
  </div>`;
}

registerPage('calls', {
  skeleton: (params) => `<div class="split${params[0] ? ' has-detail' : ''}">${sk.card(sk.rows(7))}${sk.card(params[0] ? `${sk.line('w50')}${sk.rows(4)}` : `<div class="page-empty">${t('detail.pick')}</div>`)}</div>`,
  async load(params) {
    const id = params[0] || null;
    clearTimeout(livePoll);
    if (lastPageName !== 'calls') pager.keep = null;   // arriving from elsewhere: a selected call is a fresh selection
    lastPageName = 'calls';
    const [res, detail] = await Promise.all([fetchCallsPage(id), id ? loadDetail(id).catch((e) => ({ error: e.message })) : null]);
    const html = pageHead('page.calls', 'page.calls.sub', `<span class="badge" id="calls-count">${res.total.toLocaleString(lang === 'he' ? 'he-IL' : 'en-US')} ${t('unit.calls')}</span>`) + `
      <div class="split${id ? ' has-detail' : ''}">
        <div class="card" id="calls-list" style="padding:12px 8px 8px"></div>
        ${detail?.error ? `<div class="card">${backLink()}<div class="page-empty">${escapeHtml(detail.error)}</div></div>` : detailPanel(detail)}
      </div>`;
    return { html, mount(main) {
      renderCallsList(main, res, id);
      if (detail && !detail.error && !detail.endedAt) livePoll = setTimeout(() => { if (location.hash === `#/calls/${id}`) render(); }, 5000);
    } };
  },
});

// ------------------------------------------------------------------ calling list

const listPager = { page: 1, size: PAGE_SIZES.includes(Number(store.get('page_size'))) ? Number(store.get('page_size')) : 10, city: '', status: '' };

// +972501234567 -> 050-123-4567 ; +97236123456 -> 03-612-3456
function fmtPhone(e164) {
  if (!e164) return '—';
  const m = /^\+972(\d)(\d{7,8})$/.exec(e164);
  if (!m) return e164;
  const [, first, rest] = m;
  const local = '0' + first + rest;
  return local.length === 10 ? `${local.slice(0, 3)}-${local.slice(3, 6)}-${local.slice(6)}` : `${local.slice(0, 2)}-${local.slice(2, 5)}-${local.slice(5)}`;
}
const STATUS_TONE = { new: '', called: 'accent', do_not_call: 'negative' };
const PHONE_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg>';
const fmtN = (n) => Number(n || 0).toLocaleString(lang === 'he' ? 'he-IL' : 'en-US');

function leadsTable(items) {
  if (!items.length) return `<div class="page-empty">${query || listPager.city || listPager.status ? t('empty.search') : t('empty.list')}</div>`;
  return `<div style="overflow-x:auto"><table class="table cards leads-table">
    <thead><tr><th class="faint">${t('col.pos')}</th><th>${t('col.name')}</th><th>${t('col.phone')}</th><th>${t('col.city')}</th><th>${t('col.status')}</th><th class="end">${t('col.attempts')}</th><th>${t('col.last')}</th><th></th></tr></thead>
    <tbody>${items.map((l) => `<tr${l.lastCallId ? ` class="clickable" data-call="${escapeHtml(l.lastCallId)}"` : ''}>
      <td class="faint mono">${fmtN(l.position)}</td>
      <td><span dir="auto">${escapeHtml(l.name || '—')}</span></td>
      <td class="mono"><span dir="ltr">${escapeHtml(fmtPhone(l.phone))}</span></td>
      <td><span dir="auto">${escapeHtml(l.city || '—')}</span></td>
      <td><span class="badge ${STATUS_TONE[l.status] ?? ''}">${t('status.' + l.status)}</span></td>
      <td class="end mono">${l.attempts || 0}</td>
      <td>${l.lastCallId ? `${intentBadge({ intent: l.lastOutcome })} <span class="faint when" style="font-size:12px">${fmtTime(l.lastCalledAt)}</span>` : '<span class="faint">—</span>'}</td>
      <td class="end"><button class="btn secondary sm lead-call" type="button" data-lead="${l.id}"${l.status === 'do_not_call' ? ` disabled title="${t('agent.dial.dnc')}"` : ''}>${PHONE_ICON} ${t('list.call')}</button></td></tr>`).join('')}</tbody></table></div>`;
}

function chips(id, current, options) {
  return `<div class="tabs" id="${id}">${options.map(([value, label]) => `<button type="button" data-value="${escapeHtml(value)}"${value === current ? ' class="on"' : ''}>${label}</button>`).join('')}</div>`;
}

const fetchLeadsPage = () => cached('/api/leads?' + qs({ page: listPager.page, size: listPager.size, q: query, city: listPager.city, status: listPager.status }));

// chipScroll: the filter rows' scroll positions, kept across a re-render (they scroll sideways on a phone).
function renderLeadsList(main, res, chipScroll = []) {
  const box = main.querySelector('#leads-list'); if (!box) return;
  listPager.page = res.page;
  const cityOpts = [['', t('list.all')], ...res.cities.filter((c) => c.city).map((c) => [c.city, `<bdi>${escapeHtml(c.city)}</bdi> <span class="faint">${fmtN(c.n)}</span>`])];
  const statusOpts = [['', t('list.any')], ['new', t('status.new')], ['called', t('status.called')], ['do_not_call', t('status.do_not_call')]];
  box.innerHTML = `
    <div class="card-head" style="flex-wrap:wrap;gap:10px"><span class="card-title">${t('list.card')} <span class="count">· ${fmtN(res.total)}</span></span>
      <span class="filters">${chips('lead-city', listPager.city, cityOpts)}${chips('lead-status', listPager.status, statusOpts)}</span></div>
    ${leadsTable(res.items)}${res.total ? pagerBar(res.total, res.page, res.pages, listPager.size) : ''}`;
  box.querySelectorAll('.filters .tabs').forEach((row, i) => { row.scrollLeft = chipScroll[i] || 0; });
  const head = main.querySelector('#leads-count'); if (head) head.textContent = `${fmtN(res.total)} ${t('unit.numbers')}`;
  let busy = false;
  const go = async (patch) => {
    if (busy) return; busy = true;
    const before = { ...listPager };
    const chipScroll = [...box.querySelectorAll('.filters .tabs')].map((row) => row.scrollLeft);
    Object.assign(listPager, patch);
    box.querySelector('table')?.replaceWith(Object.assign(document.createElement('div'), { innerHTML: sk.rows(Math.min(listPager.size, 7)) }));
    scrollToCard(box);
    try {
      const next = await fetchLeadsPage();
      if (!box.isConnected) return;
      renderLeadsList(main, next, chipScroll);
    } catch (e) {
      if (!box.isConnected) return;
      Object.assign(listPager, before);          // keep the filters the user had
      renderLeadsList(main, res, chipScroll);    // put the previous page back
      toast(e.message, true);
    }
    busy = false;
  };
  box.querySelectorAll('#lead-city button').forEach((b) => { b.onclick = () => go({ city: b.dataset.value, page: 1 }); });
  box.querySelectorAll('#lead-status button').forEach((b) => { b.onclick = () => go({ status: b.dataset.value, page: 1 }); });
  box.querySelectorAll('tr[data-call]').forEach((tr) => { tr.onclick = () => { location.hash = '#/calls/' + tr.dataset.call; }; });
  box.querySelectorAll('button.lead-call').forEach((b) => { b.onclick = (e) => { e.stopPropagation(); location.hash = '#/agent/' + b.dataset.lead; }; });
  box.querySelectorAll('#page-nums button[data-page]').forEach((b) => { b.onclick = () => go({ page: Number(b.dataset.page) }); });
  const prev = box.querySelector('#page-prev'); if (prev) prev.onclick = () => go({ page: listPager.page - 1 });
  const next = box.querySelector('#page-next'); if (next) next.onclick = () => go({ page: listPager.page + 1 });
  const size = box.querySelector('#page-size');
  if (size) size.onchange = () => { store.set('page_size', size.value); pager.size = Number(size.value); go({ size: Number(size.value), page: 1 }); };
}

registerPage('list', {
  skeleton: () => `<div class="stat-row four">${sk.stat(true)}${sk.stat()}${sk.stat()}${sk.stat()}</div>${sk.card(`${sk.line('w30')}${sk.rows(7)}`)}`,
  async load() {
    let res;
    try { res = await fetchLeadsPage(); }
    catch (e) {
      const nodb = /database|DATABASE_URL/i.test(e.message);
      return { html: pageHead('page.list', 'page.list.sub') + `<div class="card"><div class="page-empty">${escapeHtml(nodb ? t('list.nodb') : e.message)}</div></div>` };
    }
    const st = res.statuses;
    const html = pageHead('page.list', 'page.list.sub', `<span class="badge" id="leads-count">${fmtN(res.total)} ${t('unit.numbers')}</span>`) + `
      <div class="stat-row four">
        ${statTile({ hero: true, label: t('list.total'), value: fmtN(st.all), sub: t('list.total.sub') })}
        ${statTile({ label: t('list.new'), value: fmtN(st.new) })}
        ${statTile({ label: t('list.called'), value: fmtN(st.called) })}
        ${statTile({ label: t('list.dnc'), value: fmtN(st.do_not_call) })}
      </div>
      <div class="card" id="leads-list" style="padding:16px 8px 8px"></div>`;
    return { html, mount(main) { renderLeadsList(main, res); } };
  },
});

// ------------------------------------------------------------------ voice agent

const VOICES = [
  { id: 'azure:he-IL-HilaNeural', label: 'Hila · Azure (native)', provider: 'azure', voiceId: 'he-IL-HilaNeural' },
  { id: 'azure:he-IL-AvriNeural', label: 'Avri · Azure (native, male)', provider: 'azure', voiceId: 'he-IL-AvriNeural' },
  // Vapi's own multilingual voice (generation 2), pinned to Hebrew: the same "Primary language" setting as in the Vapi dashboard. Generation 1 rejects Hebrew.
  { id: 'vapi:Naina', label: 'Naina · Vapi', provider: 'vapi', voiceId: 'Naina', extra: { version: '2', language: 'he' } },
  { id: 'openai:shimmer', label: 'Shimmer · OpenAI', provider: 'openai', voiceId: 'shimmer' },
  { id: 'openai:nova', label: 'Nova · OpenAI', provider: 'openai', voiceId: 'nova' },
  { id: 'openai:alloy', label: 'Alloy · OpenAI', provider: 'openai', voiceId: 'alloy' },
];

// The SDK instance and call state outlive the page so navigating away mid-call
// does not drop the call; coming back re-binds the UI to the live state.
const agent = { vapi: null, live: false, partial: null, feedHtml: '', log: [], lead: null, callId: null };
const dlog = (m) => { agent.log.push(m); console.log('[agent]', m); const d = $('diag'); if (d) d.textContent = agent.log.join('\n'); };

async function getVapi() {
  if (agent.vapi) return agent.vapi;
  dlog('importing SDK...');
  const mod = await import('./vendor/vapi.js');
  const Vapi = mod.default?.default ?? mod.default ?? mod.Vapi ?? mod;
  if (typeof Vapi !== 'function') throw new Error('SDK export is ' + typeof Vapi + ', not a constructor');
  dlog('SDK loaded');
  const v = new Vapi(PUBLIC_KEY);
  v.on('call-start', () => { dlog('event: call-start'); agent.live = true; agent.feedHtml = ''; syncAgentUi(); });
  v.on('call-end', () => { dlog('event: call-end'); agent.live = false; agent.partial = null; syncAgentUi(); toast(t('agent.saved')); pullFinishedCall(); });
  v.on('speech-start', () => $('orb')?.classList.add('speaking'));
  v.on('speech-end', () => $('orb')?.classList.remove('speaking'));
  v.on('volume-level', (lvl) => { const r = $('ring'); if (r) r.style.transform = `scale(${1 + Math.min(lvl, 1) * 0.22})`; });
  v.on('message', (m) => {
    if (m.type !== 'transcript' || !m.transcript) return;
    const feed = $('feed');
    if (m.transcriptType === 'partial') {
      if (agent.partial && agent.partial.role === m.role) agent.partial.text = m.transcript;
      else agent.partial = { role: m.role, text: m.transcript };
    } else {
      agent.partial = null;
      agent.feedHtml += bubble(m.role, m.transcript);
    }
    if (feed) { feed.innerHTML = agent.feedHtml + (agent.partial ? bubble(agent.partial.role, agent.partial.text, true) : ''); feed.scrollTop = feed.scrollHeight; }
  });
  v.on('error', (e) => { dlog('event: error -> ' + (e?.message ?? e?.error?.message ?? JSON.stringify(e)?.slice(0, 200))); agent.live = false; syncAgentUi(); const er = $('err'); if (er) er.textContent = t('agent.error'); });
  agent.vapi = v;
  dlog('Vapi instance created');
  return v;
}

function syncAgentUi() {
  const orb = $('orb'), mic = $('mic'), state = $('state'), chat = $('chatinput'), send = $('chatsend'), voice = $('voice'), speed = $('speed');
  if (!orb) return;
  orb.classList.toggle('live', agent.live);
  if (!agent.live) { orb.classList.remove('speaking'); const r = $('ring'); if (r) r.style.transform = ''; }
  mic.disabled = false;
  mic.textContent = agent.live ? t('agent.end') : t('agent.talk');
  state.innerHTML = agent.live ? `<b>${t('agent.connected')}</b> — ${t('agent.connected.sub')}` : (agent.feedHtml ? t('agent.ended') : t('agent.ready'));
  chat.disabled = send.disabled = !agent.live;
  voice.disabled = speed.disabled = agent.live;
  const feed = $('feed'); if (feed) feed.innerHTML = agent.feedHtml;
}

// Recent-calls card on the Voice Agent page.
function refreshAgentRecent() {
  loadCalls({ size: 6 }).then(({ items }) => {
    const el = $('agent-recent'); if (!el) return;
    el.innerHTML = recentRows(items);
    el.querySelectorAll('.row[data-id]').forEach((r) => { r.onclick = () => { location.hash = `#/calls/${r.dataset.id}`; }; });
  }).catch(() => {});
}

// After a browser call ends, copy the newest calls from Vapi into our database
// right away, so the call shows up without waiting for the webhook (which can
// take half a minute, and cannot reach a laptop at all). The webhook still
// arrives later and fills in the analysis. A short delay lets Vapi mark the
// call as ended first. With no database, /api/sync answers 409 and we just
// refresh; the list then comes straight from Vapi anyway.
// Vapi's call list can lag a few seconds after hangup, but the call is readable
// by id at once, and /api/calls/:id stores it the moment it has ended. So we
// poll that id (2s, 6s, 15s, 30s); without an id we fall back to a list sync.
function pullFinishedCall(callId = agent.callId) {
  const delays = [2000, 6000, 15000, 30000];
  const done = () => { invalidate(); if (route().name === 'agent') { refreshAgentRecent(); refreshLeadCard(); } else render(); };
  const attempt = async (i) => {
    try {
      if (callId) {
        const d = await api('/api/calls/' + encodeURIComponent(callId));
        dlog(`pull ${i + 1}: ${callId.slice(0, 8)} ended=${!!d.endedAt} source=${d.source}`);
        if (d.endedAt) return done();
      } else {
        await api('/api/sync?limit=5', { method: 'POST' });
        return done();
      }
    } catch (e) { dlog(`pull ${i + 1} failed: ${e.message}`); }
    if (i + 1 < delays.length) setTimeout(() => attempt(i + 1), delays[i + 1]);
    else done();
  };
  setTimeout(() => attempt(0), delays[0]);
}

// Re-reads the lead behind the "Calling" card so its status flips to called / do not call.
async function refreshLeadCard() {
  if (!agent.lead || !$('lead-card')) return;
  try {
    const { lead } = await api('/api/leads/' + agent.lead.id);
    agent.lead = lead;
    const badge = $('lead-card').querySelector('.badge');
    if (badge) { badge.className = `badge ${STATUS_TONE[lead.status] ?? ''}`; badge.textContent = t('status.' + lead.status); }
    const meta = $('lead-card').querySelector('.lead-meta .faint:last-child');
    if (meta) meta.textContent = `${fmtN(lead.attempts)} ${t('list.calls')}`;
  } catch {}
}

registerPage('agent', {
  skeleton: () => sk.card(`<div style="display:flex;flex-direction:column;align-items:center;gap:16px;padding:20px 0"><div class="skeleton" style="width:132px;height:132px;border-radius:50%"></div>${sk.line('w30')}</div>`),
  async load(params) {
    const voiceSel = store.get('voice', VOICES[0].id), speedVal = store.get('speed', '1');
    // Lead mode: #/agent/<leadId> - the call is made for one number from the List.
    const leadId = /^\d+$/.test(params[0] ?? '') ? Number(params[0]) : null;
    let lead = null, leadErr = null, cfg = null;
    if (leadId) {
      [lead, cfg] = await Promise.all([
        api('/api/leads/' + leadId).then((r) => r.lead).catch((e) => { leadErr = e.message; return null; }),
        loadConfig().catch(() => null),
      ]);
    }
    agent.lead = lead;
    const dialReady = !!cfg?.dialReady, dnc = lead?.status === 'do_not_call';
    const leadCard = leadId ? `<div class="card nested lead-card" id="lead-card">${lead ? `
          <div class="lead-head"><span class="lead-k">${t('agent.lead')}</span><span class="badge ${STATUS_TONE[lead.status] ?? ''}">${t('status.' + lead.status)}</span></div>
          <div class="lead-name" dir="auto">${escapeHtml(lead.name || '—')}</div>
          <div class="lead-meta"><span class="mono" dir="ltr">${escapeHtml(fmtPhone(lead.phone))}</span><span dir="auto">${escapeHtml(lead.city || '')}</span><span class="faint">#${fmtN(lead.position)}</span><span class="faint">${fmtN(lead.attempts)} ${t('list.calls')}</span></div>
          <div class="lead-actions">
            <button class="btn secondary sm" id="dial" type="button"${dialReady && !dnc ? '' : ' disabled'}>${PHONE_ICON} ${t('agent.dial')}</button>
            <span class="faint" style="font-size:12px">${dnc ? t('agent.dial.dnc') : dialReady ? '' : t('agent.dial.note')}</span>
          </div>
          <div class="faint" style="font-size:12px;margin-top:8px">${t('agent.lead.sub')}</div>` : `<div class="page-empty">${escapeHtml(leadErr || t('err.generic'))}</div>`}</div>` : '';
    const html = pageHead('page.agent', 'page.agent.sub') + `
      <div class="grid agent-grid">
        <div class="card agent-stage">
          ${leadCard}
          <div class="orb" id="orb"><div class="ring" id="ring"></div><button class="mic" id="mic" type="button">${t('agent.talk')}</button></div>
          <div class="state" id="state">${t('agent.ready')}</div>
          <div class="err" id="err"></div>
          <div class="diag" id="diag"></div>
          <div class="controls">
            <label for="voice">${t('agent.voice')}</label>
            <span class="select sm"><select id="voice">${VOICES.map((v) => `<option value="${v.id}"${v.id === voiceSel ? ' selected' : ''}>${v.label}</option>`).join('')}</select>
              <svg viewBox="0 0 12 12"><path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
            <label for="speed">${t('agent.speed')}</label>
            <input type="range" id="speed" min="0.75" max="1.25" step="0.05" value="${speedVal}"><span class="mono" id="speedval">${Number(speedVal).toFixed(2)}</span>
          </div>
          <div class="feed notranslate convo" id="feed" translate="no"></div>
          <form class="chatbar" id="chatbar" autocomplete="off">
            <label class="input"><input id="chatinput" dir="auto" placeholder="${isPhoneLayout() ? t('agent.type.short') : t('agent.type')}" disabled></label>
            <button class="btn" id="chatsend" type="submit" disabled>${t('agent.send')}</button>
          </form>
          <p class="chat-hint">${t('agent.type')}</p>
        </div>
        <div class="card"><div class="card-head"><span class="card-title">${t('card.recent')}</span><a class="btn secondary sm" href="#/calls">${t('see.all')}</a></div><div id="agent-recent">${sk.rows(4)}</div></div>
      </div>
      <p class="page-sub" style="text-align:center">${t('agent.note')} ${leadId ? '' : `<a href="#/list">${t('agent.pick')}</a>`}</p>`;
    return { html, async mount(main) {
      if (location.search.includes('debug')) { $('diag').style.display = 'block'; $('diag').textContent = agent.log.join('\n'); }
      syncAgentUi();
      refreshAgentRecent();
      const dial = $('dial');
      if (dial) dial.onclick = async () => {
        dial.disabled = true;
        try { const r = await api('/api/dial', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ leadId: agent.lead.id }) }); toast(t('agent.dialed')); pullFinishedCall(r.id); }
        catch (e) { toast(e.message, true); dial.disabled = false; }
      };
      $('voice').onchange = () => store.set('voice', $('voice').value);
      $('speed').oninput = () => { $('speedval').textContent = Number($('speed').value).toFixed(2); store.set('speed', $('speed').value); };
      $('mic').onclick = async () => {
        $('err').textContent = '';
        try {
          const v = await getVapi();
          if (agent.live) { v.stop(); return; }
          if (!$('mic')) return;                       // navigated away while the SDK loaded
          $('mic').disabled = true; $('state').textContent = t('agent.connecting');
          const pick = VOICES.find((x) => x.id === $('voice').value) ?? VOICES[0];
          const overrides = { voice: { provider: pick.provider, voiceId: pick.voiceId, ...pick.extra, speed: Number($('speed').value), chunkPlan: { formatPlan: { enabled: false } } } };
          // Tag the call with the number it stands in for; the server reads it back
          // from call.assistantOverrides.variableValues and updates the lead.
          if (agent.lead && agent.lead.status !== 'do_not_call') overrides.variableValues = { leadId: String(agent.lead.id), leadPhone: agent.lead.phone, leadName: agent.lead.name ?? '', leadCity: agent.lead.city ?? '' };
          dlog(`starting call voice=${pick.provider}/${pick.voiceId}`);
          const r = await v.start(ASSISTANT_ID, overrides);
          agent.callId = r?.id ?? null;
          dlog('start() resolved: ' + (agent.callId ?? '?'));
        } catch (e) {
          dlog('START FAILED: ' + (e?.message ?? JSON.stringify(e)));
          syncAgentUi();
          const err = $('err'); if (err) err.textContent = (e?.message?.includes('Permission') || e?.name === 'NotAllowedError') ? t('agent.mic.blocked') : t('agent.start.failed');
        }
      };
      $('chatbar').onsubmit = (e) => {
        e.preventDefault();
        const text = $('chatinput').value.trim();
        if (!text || !agent.live || !agent.vapi) return;
        agent.partial = null;
        agent.feedHtml += `<div class="turn user"><div class="bubble"><div class="who">${t('who.you')}</div><div class="say" dir="auto">${escapeHtml(text)}</div></div></div>`;
        $('feed').innerHTML = agent.feedHtml; $('feed').scrollTop = $('feed').scrollHeight;
        agent.vapi.send({ type: 'add-message', message: { role: 'user', content: text } });
        $('chatinput').value = '';
      };
    } };
  },
});

// ------------------------------------------------------------------ settings

registerPage('settings', {
  skeleton: () => `<div class="grid settings-grid">${sk.card(`${sk.line('w30')}${sk.rows(3)}`)}${sk.card(`${sk.line('w30')}${sk.rows(5)}`)}</div>`,
  async load() {
    const cfg = await loadConfig().catch((e) => ({ error: e.message }));
    const row = (k, v, sub) => `<div class="setting"><div><div class="setting-k">${k}</div>${sub ? `<div class="setting-sub">${sub}</div>` : ''}</div><div>${v}</div></div>`;
    const html = pageHead('page.settings', 'page.settings.sub') + `
      <div class="grid settings-grid">
        <div class="card"><div class="card-head"><span class="card-title">${t('set.appearance')}</span></div>
          ${row(t('set.theme'), `<span class="switch${currentTheme() === 'light' ? ' on' : ''}" id="set-theme" data-theme-switch role="switch" tabindex="0" aria-checked="${currentTheme() === 'light'}" aria-label="${t('set.theme')}"><span></span></span>`, t('set.theme.sub'))}
          ${row(t('set.lang'), `<div class="tabs"><button id="set-en"${lang === 'en' ? ' class="on"' : ''}>English</button><button id="set-he"${lang === 'he' ? ' class="on"' : ''}>עברית</button></div>`, t('set.lang.sub'))}
          ${authRequired ? row(t('set.password'), `<button class="btn secondary sm" id="set-signout">${t('set.signout')}</button>`, t('set.password.sub')) : ''}
        </div>
        <div class="card"><div class="card-head"><span class="card-title">${t('set.assistant')}</span></div>
          ${cfg.error ? `<div class="page-empty">${escapeHtml(cfg.error)}</div>` : `
          ${row(t('set.name'), `<b style="font-weight:500">${escapeHtml(cfg.assistantName)}</b>`)}
          ${row(t('set.transcriber'), `<span class="mono">${escapeHtml(cfg.transcriber)}</span>`)}
          ${row(t('set.voice'), `<span class="mono">${escapeHtml(cfg.voice)}</span>`)}
          ${row(t('set.model'), `<span class="mono">${escapeHtml(cfg.model)}</span>`)}
          ${row(t('set.first'), `<span dir="auto" style="font-size:12.5px;color:var(--text-2)">${escapeHtml(cfg.firstMessage)}</span>`)}
          ${row(t('set.updated'), `<span class="faint">${fmtTime(cfg.updatedAt)}</span>`)}`}
        </div>
      </div>`;
    return { html, mount() {
      const sw = $('set-theme');
      sw.closest('.setting').onclick = toggleTheme;   // the whole row is the target; a tap on the switch bubbles here once
      sw.onkeydown = (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggleTheme(); } };
      $('set-en').onclick = () => applyLang('en');
      $('set-he').onclick = () => applyLang('he');
      const f = $('set-signout'); if (f) f.onclick = signOut;
    } };
  },
});

// Refresh drops the short cache and first pulls anything Vapi has that we do not
// (calls made on /demo, before the webhook existed, or a missed delivery). Without
// a database /api/sync answers 409 and we simply re-render.
$('refreshbtn').onclick = async () => {
  const btn = $('refreshbtn');
  if (btn.classList.contains('spin')) return;
  btn.classList.add('spin');
  try { await api('/api/sync?limit=20', { method: 'POST' }); } catch {}
  btn.classList.remove('spin');
  invalidate(); render();
};

// Topbar profile (agent name + initials) is shell chrome, so fill it on every page, not just Overview.
loadConfig().catch(() => {});
