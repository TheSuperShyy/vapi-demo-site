// Dashboard pages: Overview, Calls, Voice Agent, Settings.
import { registerPage, render, route, t, I18N, lang, escapeHtml, pageHead, toast, sk, store, applyLang, applyTheme, currentTheme, toggleTheme, authRequired, showLogin, signOut } from './app.js';

const $ = (id) => document.getElementById(id);

// Same assistant as api/config.js. A Vapi PUBLIC key is built to ship to browsers.
const PUBLIC_KEY = '4df49a36-752b-4b2e-aca6-ced85264660d';
const ASSISTANT_ID = '47e67fec-8dc1-45e5-a1ef-3f91e8a0e7c6';

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
  'who.agent': 'Noa', 'who.user': 'Customer', 'who.you': 'You',
  'reason.no_trust_in_politicians': 'No trust in politicians', 'reason.not_interested_in_politics': 'Not interested in politics',
  'reason.no_suitable_option': 'No suitable option', 'reason.deliberate_protest': 'Deliberate protest', 'reason.abroad_or_away': 'Abroad or away',
  'reason.health_or_mobility': 'Health or mobility', 'reason.logistics_polling_station': 'Polling station logistics', 'reason.work_or_schedule': 'Work or schedule',
  'reason.declined_to_say': 'Declined to say', 'reason.other': 'Other', 'reason.not_applicable': '—',
  // analysis page - plain words, whole numbers, no percentages
  'an.range': 'Last {n} days', 'an.export': 'Export to Excel', 'an.exporting': 'Preparing…', 'an.exported': 'Report downloaded',
  'an.nodb': 'The analysis needs the database (DATABASE_URL).', 'an.nocalls': 'No calls have been made in this period yet.',
  'an.called': 'We called {n} people in the last {d} days.', 'an.called.one': 'We called one person in the last {d} days.',
  'an.step.called': 'we called', 'an.step.answered': 'answered the question', 'an.step.yes': 'said they will vote',
  'an.small': 'Only {n} people answered. That is far too few to tell you what the public thinks. Calling many more people is the one thing that changes it.',
  'an.small.one': 'Only one person answered. That is far too few to tell you what the public thinks. Calling many more people is the one thing that changes it.',
  'an.why': 'Why the other {n} calls did not work', 'an.why.one': 'Why the other call did not work',
  'an.why.early': '{a} of them hung up in the first 12 seconds, before Noa could ask anything.',
  'an.why.early.one': 'One of them hung up in the first 12 seconds, before Noa could ask anything.',
  'end.hungUp': 'picked up, then hung up', 'end.silence': 'nobody said a word', 'end.voicemail': 'went to voicemail',
  'end.noAnswer': 'nobody picked up', 'end.busy': 'the line was busy', 'end.technical': 'the call broke',
  'end.noMic': 'no microphone', 'end.agentEnded': 'Noa ended the call', 'end.tooLong': 'the call ran too long', 'end.other': 'something else',
  'an.said': 'What the {n} people said', 'an.said.one': 'What the one person said', 'an.said.title.none': 'What people said',
  'an.said.yes': 'will vote', 'an.said.no': 'will not vote', 'an.said.unsure': 'not sure',
  'an.said.none': 'Nobody has answered the question in this period yet.',
  'an.said.same': 'The {n} people who said no or were not sure all gave the same reason: {r}.',
  'an.said.same.one': 'The one person who said no gave this reason: {r}.',
  'an.said.mixed': 'The reasons they gave: {list}.', 'an.said.noreason': 'Nobody has given a reason yet.',
  'an.said.refused': '{n} picked up but would not answer.',
  'an.said.optout': '{n} people asked us not to call again. They will not be called.',
  'an.said.optout.one': 'One person asked us not to call again. They will not be called.',
  'an.todo': 'What to do next', 'an.todo.none': 'Nothing in these calls needs fixing.',
  'do.more': 'Call many more people', 'do.more.note': '{n} answers cannot tell you what a city thinks. Until that number is in the hundreds, everything else here is a hint, not a result.',
  'do.silence': 'Check the phone system', 'do.silence.note': 'On {n} calls nobody said a word. That usually means the call connected but no sound came through.',
  'do.early': 'Change the first thing Noa says', 'do.early.note': '{n} people hung up in the first 12 seconds, before she could ask anything.',
  'do.technical': 'Look at the calls that broke', 'do.technical.note': '{n} calls stopped because something went wrong, not because the person left. That is money spent for nothing.',
  'do.retry': 'Try the numbers that did not pick up again', 'do.retry.note': '{n} calls rang out, went to voicemail or found the line busy. A second try at a different hour often works.',
  'do.bot': 'Say up front that Noa is a computer', 'do.bot.note': '{n} people asked if they were talking to a machine. Saying it first usually costs less than being caught out.',
  'do.audio': 'Check the sound quality', 'do.audio.note': 'The sound was poor on {n} calls, so the person may not have heard the question properly.',
  'do.reason': 'Ask more people why', 'do.reason.note': 'In {n} of the calls where someone said no or was not sure, Noa never asked why. That answer is the most useful thing the survey can get.',
  'an.more': 'All the numbers',
  'ah.title': 'How Noa handled the calls',
  'ah.askedWhy': 'She asked why in {a} of the {b} calls where someone said no or was not sure.',
  'ah.noClosing': 'No call has got as far as the closing line yet.',
  'ah.closing': 'She said the closing line {a} times.', 'ah.closing.one': 'She said the closing line once.',
  'ah.thanked': 'She said the thank-you line to {a} of the {b} people who said they will vote.',
  'ah.askedBack': '{a} people asked her a question back.', 'ah.askedBack.one': 'One person asked her a question back.',
  'ah.turns': 'In a real conversation she speaks about {a} times and the person about {b} times.',
  'an.cities': 'By city', 'an.daily': 'Day by day',
  'an.col.city': 'City', 'an.col.calls': 'Calls', 'an.col.answered': 'Answered', 'an.col.yes': 'Will vote', 'an.col.no': 'Will not',
  'an.col.nr': 'No answer', 'an.col.day': 'Day', 'an.col.cost': 'Cost',
  'an.quotes': 'In their own words',
  'ai.tag': 'Written by AI', 'ai.also': 'The AI also suggests',
  'ai.by': 'From the numbers above, {t}.',
  'ai.writing': 'Reading the calls…', 'ai.refresh': 'Write again', 'ai.stale': 'New calls since this was written',
  'ai.none': 'No AI summary for this period yet.',
  'ai.nokey': 'Set OPENROUTER_API_KEY to turn the AI summary on.', 'ai.failed': 'Could not write the summary. {e}',
  'agent.talk': 'Talk to me', 'agent.end': 'End', 'agent.ready': 'Ready. Microphone permission needed.', 'agent.connecting': 'Connecting…',
  'agent.connected': 'Connected', 'agent.connected.sub': 'speak or type', 'agent.ended': 'Call ended. Start again whenever.',
  'agent.mic.blocked': 'The browser blocked the microphone. Allow access and try again.', 'agent.start.failed': 'Could not start the call. Try refreshing.',
  'agent.error': 'The call hit an error. Try again.', 'agent.type': 'Or just type here. English works too, she answers in Hebrew.',
  'agent.type.short': 'Type a message', 'agent.send': 'Send', 'agent.voice': 'Voice', 'agent.speed': 'Speed', 'agent.mute': 'Mute mic', 'agent.unmute': 'Unmute', 'agent.muted': 'Your mic is muted; she cannot hear you.', 'agent.note': 'Runs in the browser through your microphone. Nobody is phoned. Works best in Chrome.',
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
  'who.agent': 'נועה', 'who.user': 'לקוח', 'who.you': 'אתה',
  'reason.no_trust_in_politicians': 'אין אמון בפוליטיקאים', 'reason.not_interested_in_politics': 'לא מתעניינים בפוליטיקה',
  'reason.no_suitable_option': 'אין למי להצביע', 'reason.deliberate_protest': 'מחאה מכוונת', 'reason.abroad_or_away': 'בחו״ל או לא בעיר',
  'reason.health_or_mobility': 'בריאות או ניידות', 'reason.logistics_polling_station': 'קלפי רחוקה או לא נגישה', 'reason.work_or_schedule': 'עבודה או לוח זמנים',
  'reason.declined_to_say': 'לא רצו לומר', 'reason.other': 'אחר', 'reason.not_applicable': '—',
  // analysis page - plain words, whole numbers, no percentages
  'an.range': '{n} הימים האחרונים', 'an.export': 'ייצוא לאקסל', 'an.exporting': 'מכין…', 'an.exported': 'הדוח ירד',
  'an.nodb': 'הניתוח דורש מסד נתונים (DATABASE_URL).', 'an.nocalls': 'עדיין לא בוצעו שיחות בתקופה הזו.',
  'an.called': 'התקשרנו ל-{n} אנשים ב-{d} הימים האחרונים.', 'an.called.one': 'התקשרנו לאדם אחד ב-{d} הימים האחרונים.',
  'an.step.called': 'התקשרנו', 'an.step.answered': 'ענו על השאלה', 'an.step.yes': 'אמרו שיצביעו',
  'an.small': 'רק {n} אנשים ענו. זה מעט מדי מכדי לדעת מה הציבור חושב. הדבר היחיד שישנה את זה הוא להתקשר להרבה יותר אנשים.',
  'an.small.one': 'רק אדם אחד ענה. זה מעט מדי מכדי לדעת מה הציבור חושב. הדבר היחיד שישנה את זה הוא להתקשר להרבה יותר אנשים.',
  'an.why': 'למה {n} השיחות האחרות לא עבדו', 'an.why.one': 'למה השיחה האחרת לא עבדה',
  'an.why.early': '{a} מהם ניתקו ב-12 השניות הראשונות, עוד לפני שנועה הספיקה לשאול.',
  'an.why.early.one': 'אחד מהם ניתק ב-12 השניות הראשונות, עוד לפני שנועה הספיקה לשאול.',
  'end.hungUp': 'ענו ואז ניתקו', 'end.silence': 'אף אחד לא אמר מילה', 'end.voicemail': 'הגיעו לתא קולי',
  'end.noAnswer': 'אף אחד לא ענה', 'end.busy': 'הקו היה תפוס', 'end.technical': 'השיחה נקטעה',
  'end.noMic': 'אין מיקרופון', 'end.agentEnded': 'נועה סיימה את השיחה', 'end.tooLong': 'השיחה נמשכה יותר מדי', 'end.other': 'משהו אחר',
  'an.said': 'מה אמרו {n} האנשים', 'an.said.one': 'מה אמר האדם האחד', 'an.said.title.none': 'מה אנשים אמרו',
  'an.said.yes': 'יצביעו', 'an.said.no': 'לא יצביעו', 'an.said.unsure': 'לא בטוחים',
  'an.said.none': 'עדיין אף אחד לא ענה על השאלה בתקופה הזו.',
  'an.said.same': '{n} האנשים שאמרו לא או לא בטוחים נתנו כולם את אותה סיבה: {r}.',
  'an.said.same.one': 'האדם היחיד שאמר לא נתן את הסיבה הזו: {r}.',
  'an.said.mixed': 'הסיבות שהם נתנו: {list}.', 'an.said.noreason': 'עדיין אף אחד לא נתן סיבה.',
  'an.said.refused': '{n} ענו לטלפון אך לא רצו להשיב.',
  'an.said.optout': '{n} אנשים ביקשו שלא נתקשר שוב. לא נתקשר אליהם.',
  'an.said.optout.one': 'אדם אחד ביקש שלא נתקשר שוב. לא נתקשר אליו.',
  'an.todo': 'מה לעשות עכשיו', 'an.todo.none': 'אין מה לתקן בשיחות האלה.',
  'do.more': 'להתקשר להרבה יותר אנשים', 'do.more.note': '{n} תשובות לא יכולות לומר לכם מה עיר שלמה חושבת. עד שהמספר הזה יהיה במאות, כל השאר כאן הוא רמז ולא תוצאה.',
  'do.silence': 'לבדוק את מערכת הטלפון', 'do.silence.note': 'ב-{n} שיחות אף אחד לא אמר מילה. בדרך כלל זה אומר שהשיחה התחברה אבל לא עבר קול.',
  'do.early': 'לשנות את המשפט הראשון של נועה', 'do.early.note': '{n} אנשים ניתקו ב-12 השניות הראשונות, עוד לפני שהספיקה לשאול.',
  'do.technical': 'לבדוק את השיחות שנקטעו', 'do.technical.note': '{n} שיחות נעצרו כי משהו השתבש, לא כי האדם עזב. זה כסף שיוצא בלי שום תמורה.',
  'do.retry': 'לנסות שוב את המספרים שלא ענו', 'do.retry.note': '{n} שיחות צלצלו בלי מענה, הגיעו לתא קולי או מצאו קו תפוס. ניסיון שני בשעה אחרת לרוב עובד.',
  'do.bot': 'לומר מראש שנועה היא מחשב', 'do.bot.note': '{n} אנשים שאלו אם הם מדברים עם מכונה. לומר את זה קודם בדרך כלל עולה פחות מלהיתפס.',
  'do.audio': 'לבדוק את איכות הקול', 'do.audio.note': 'הקול היה גרוע ב-{n} שיחות, ויכול להיות שהאדם לא שמע את השאלה כמו שצריך.',
  'do.reason': 'לשאול יותר אנשים למה', 'do.reason.note': 'ב-{n} מהשיחות שבהן מישהו אמר לא או לא בטוח, נועה לא שאלה למה. התשובה הזו היא הדבר הכי שימושי שהסקר יכול להשיג.',
  'an.more': 'כל המספרים',
  'ah.title': 'איך נועה ניהלה את השיחות',
  'ah.askedWhy': 'היא שאלה למה ב-{a} מתוך {b} השיחות שבהן מישהו אמר לא או לא בטוח.',
  'ah.noClosing': 'עדיין אף שיחה לא הגיעה עד משפט הסיום.',
  'ah.closing': 'היא אמרה את משפט הסיום {a} פעמים.', 'ah.closing.one': 'היא אמרה את משפט הסיום פעם אחת.',
  'ah.thanked': 'היא אמרה את משפט התודה ל-{a} מתוך {b} האנשים שאמרו שיצביעו.',
  'ah.askedBack': '{a} אנשים שאלו אותה שאלה בחזרה.', 'ah.askedBack.one': 'אדם אחד שאל אותה שאלה בחזרה.',
  'ah.turns': 'בשיחה אמיתית היא מדברת בערך {a} פעמים והאדם בערך {b} פעמים.',
  'an.cities': 'לפי עיר', 'an.daily': 'יום אחר יום',
  'an.col.city': 'עיר', 'an.col.calls': 'שיחות', 'an.col.answered': 'ענו', 'an.col.yes': 'יצביעו', 'an.col.no': 'לא יצביעו',
  'an.col.nr': 'אין מענה', 'an.col.day': 'יום', 'an.col.cost': 'עלות',
  'an.quotes': 'במילים שלהם',
  'ai.tag': 'נכתב על ידי בינה מלאכותית', 'ai.also': 'הבינה המלאכותית גם מציעה',
  'ai.by': 'מהמספרים שלמעלה, {t}.',
  'ai.writing': 'קורא את השיחות…', 'ai.refresh': 'כתוב שוב', 'ai.stale': 'היו שיחות חדשות מאז הכתיבה',
  'ai.none': 'עדיין אין סיכום בינה מלאכותית לתקופה הזו.',
  'ai.nokey': 'הגדירו OPENROUTER_API_KEY כדי להפעיל את הסיכום.', 'ai.failed': 'לא הצלחנו לכתוב את הסיכום. {e}',
  'agent.talk': 'דבר איתי', 'agent.end': 'סיים', 'agent.ready': 'מוכן. צריך אישור למיקרופון.', 'agent.connecting': 'מתחבר…',
  'agent.connected': 'מחובר', 'agent.connected.sub': 'דבר או כתוב', 'agent.ended': 'השיחה הסתיימה. אפשר להתחיל שוב.',
  'agent.mic.blocked': 'הדפדפן חסם את המיקרופון. אשרו גישה ונסו שוב.', 'agent.start.failed': 'לא הצלחנו להתחיל את השיחה. נסו לרענן.',
  'agent.error': 'נפלה שגיאה בשיחה. נסו שוב.', 'agent.type': 'או פשוט תכתבו פה. גם באנגלית, היא עונה בעברית.',
  'agent.type.short': 'כתבו הודעה', 'agent.send': 'שלח', 'agent.voice': 'קול', 'agent.speed': 'קצב', 'agent.mute': 'השתקת מיקרופון', 'agent.unmute': 'ביטול השתקה', 'agent.muted': 'המיקרופון מושתק; היא לא שומעת אותך.', 'agent.note': 'רץ בדפדפן דרך המיקרופון. לא מתקשרים לאף אחד. עובד הכי טוב בכרום.',
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

// Written for someone running a campaign, not for an analyst. Four plain cards:
// what happened, why most calls did not work, what the people who answered said,
// and what to do next. Whole numbers and sentences, no bars and no percentages -
// "4 of 25" is understood by everyone, "16%" has to be turned back into people.
// Everything an analyst would still want is counted the same way and kept under
// "All the numbers" at the bottom.
const tf = (key, vars) => t(key).replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? ''));
const tn = (key, n, vars) => tf(n === 1 && (I18N[lang][key + '.one'] ?? I18N.en[key + '.one']) ? key + '.one' : key, vars);
const pctOf = (a, b) => (b ? Math.round((a / b) * 100) : 0);
const SMALL_SAMPLE = 30;   // below this many answers nothing on the page is worth trusting, and it says so
const DOWNLOAD_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></svg>';

// What to do next, worst first, each one an instruction rather than a statistic.
// Counted by plain rules, so the list is the same with or without the AI.
function todos(a) {
  const f = a.funnel, ap = a.approach;
  const g = Object.fromEntries(a.endedReasons.map((e) => [e.key, e.n]));
  const out = [];
  const add = (n, key, vars) => { if (n > 0) out.push({ n, title: t('do.' + key), note: tf(`do.${key}.note`, vars ?? { n }) }); };
  add(g.silence, 'silence');
  add(f.hungUpEarly, 'early');
  add((g.technical || 0) + (g.noMic || 0), 'technical');
  add((g.voicemail || 0) + (g.noAnswer || 0) + (g.busy || 0), 'retry');
  add(f.askedIfBot, 'bot');
  add(f.qualityBad, 'audio');
  add(f.no + f.unsure - ap.askedReason, 'reason');
  out.sort((x, y) => y.n - x.n);
  // while barely anyone has answered, everything else is noise: that goes first,
  // whatever the other counts say.
  if (f.answered < SMALL_SAMPLE) out.unshift({ n: Infinity, title: t('do.more'), note: tf('do.more.note', { n: f.answered }) });
  return out.slice(0, 5);
}

// One sentence about why people said no, instead of a chart of one bar.
function reasonSentence(a) {
  const noUnsure = a.funnel.no + a.funnel.unsure;
  if (!noUnsure || !a.reasons.length) return t('an.said.noreason');
  if (a.reasons.length === 1) return tn('an.said.same', a.reasons[0].n, { n: a.reasons[0].n, r: t('reason.' + a.reasons[0].key) });
  return tf('an.said.mixed', { list: a.reasons.map((r) => `${t('reason.' + r.key)} (${r.n})`).join(', ') });
}

// What Noa herself did, as sentences. Kept under "All the numbers" because it is
// about the script rather than about the people.
function agentLines(a) {
  const ap = a.approach, f = a.funnel, out = [];
  const noUnsure = f.no + f.unsure;
  if (noUnsure) out.push(tf('ah.askedWhy', { a: ap.askedReason, b: noUnsure }));
  if (ap.closingDelivered) out.push(tn('ah.closing', ap.closingDelivered, { a: ap.closingDelivered }));
  else if (f.reached) out.push(t('ah.noClosing'));
  if (f.yes) out.push(tf('ah.thanked', { a: ap.thankedYes, b: f.yes }));
  if (ap.askedQuestion) out.push(tn('ah.askedBack', ap.askedQuestion, { a: ap.askedQuestion }));
  if (ap.conversations) out.push(tf('ah.turns', { a: Math.round(ap.avgAgentTurns), b: Math.round(ap.avgUserTurns) }));
  return out;
}

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

// The AI (Gemini through OpenRouter) writes two things and no more: the paragraph
// under the three numbers at the top, and extra suggestions at the end of the
// to-do list. Both are stored, so opening the page costs nothing, and both are
// labelled, so nobody has to wonder which parts were counted and which written.
const SPARK_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" width="12" height="12"><path d="M12 3v4"/><path d="M12 17v4"/><path d="M3 12h4"/><path d="M17 12h4"/><path d="m5.6 5.6 2.8 2.8"/><path d="m15.6 15.6 2.8 2.8"/><path d="m18.4 5.6-2.8 2.8"/><path d="m8.4 15.6-2.8 2.8"/></svg>';

const aiSummaryBlock = () => `<div class="ai-say" id="ai-say">
  <div class="ai-say-head"><span class="ai-tag">${SPARK_ICON}${t('ai.tag')}</span>
    <button class="btn secondary sm" id="ai-again" type="button" disabled>${t('ai.writing')}</button></div>
  <div id="ai-body">${sk.line('w70')}${sk.line('w50')}</div></div>`;

function paintInsight(main, ins, note) {
  const d = ins?.data ?? {};
  const body = main.querySelector('#ai-body');
  const said = d.summary || d.headline;                        // older saved rows kept a headline
  if (body) {
    body.innerHTML = said
      ? `<p class="ai-text">${escapeHtml(said)}</p><p class="ai-by">${tf('ai.by', { t: fmtTime(ins.generatedAt) })}${ins.stale ? ` <span class="badge accent">${t('ai.stale')}</span>` : ''}</p>`
      : `<p class="ai-by">${escapeHtml(note || t('ai.none'))}</p>`;
  }
  const more = main.querySelector('#ai-todo');
  if (more) {
    more.innerHTML = d.advice?.length
      ? `<div class="ai-more"><span class="ai-tag">${SPARK_ICON}${t('ai.also')}</span>
         <ul class="ai-points">${d.advice.map((x) => `<li>${escapeHtml(x)}</li>`).join('')}</ul></div>`
      : '';
  }
}

// One write at a time per range+language, so a re-render cannot start a second one.
const aiBusy = new Set();
async function loadInsight(main, { write } = {}) {
  if (!main.querySelector('#ai-body')) return;
  const key = `${range}/${lang}`;
  const button = () => main.querySelector('#ai-again');
  const idle = (hasKey = true) => { const b = button(); if (b) { b.disabled = false; b.hidden = !hasKey; b.textContent = t('ai.refresh'); } };
  try {
    let { insight, hasKey } = await api(`/api/analysis?insight=1&days=${range}&lang=${lang}`);
    const needsWrite = write || !insight || insight.stale;
    if (needsWrite && hasKey && !aiBusy.has(key)) {
      aiBusy.add(key);
      const b = button(); if (b) { b.disabled = true; b.textContent = t('ai.writing'); }
      try { ({ insight } = await api(`/api/analysis?insight=1&days=${range}&lang=${lang}${write ? '&force=1' : ''}`, { method: 'POST' })); }
      finally { aiBusy.delete(key); }
    }
    if (!main.isConnected) return;
    idle(hasKey);
    paintInsight(main, insight, hasKey ? t('ai.none') : t('ai.nokey'));
  } catch (e) {
    if (!main.isConnected) return;
    idle();
    paintInsight(main, null, tf('ai.failed', { e: e.message }));
  }
}

registerPage('analysis', {
  skeleton: () => `
    ${sk.card(`${sk.line('w30')}<div class="skeleton skel-block" style="margin-top:16px"></div>`)}
    ${sk.card(`${sk.line('w30')}${sk.rows(3)}`)}
    ${sk.card(`${sk.line('w30')}${sk.rows(3)}`)}`,
  async load() {
    let a;
    try { a = await cached('/api/analysis?days=' + range); } catch (e) {
      const nodb = /needs_database/.test(e.message);
      return { html: pageHead('page.analysis', 'page.analysis.sub') + `<div class="card"><div class="page-empty">${escapeHtml(nodb ? t('an.nodb') : e.message)}</div></div>` };
    }
    const f = a.funnel, fmtN = (n) => Number(n).toLocaleString(lang === 'he' ? 'he-IL' : 'en-US');
    const head = pageHead('page.analysis', 'page.analysis.sub', `<span style="display:inline-flex;gap:10px;align-items:center;flex-wrap:wrap">
      <span class="badge">${tf('an.range', { n: a.days })}</span>
      <button class="btn secondary sm" id="an-export" type="button">${DOWNLOAD_ICON} ${t('an.export')}</button></span>`);
    if (!f.total) return { html: head + `<div class="card"><div class="page-empty">${t('an.nocalls')}</div></div>` };

    // What happened: the whole campaign in three numbers and one sentence.
    const step = (n, label) => `<div class="step"><b>${fmtN(n)}</b><span>${label}</span></div>`;
    const arrow = '<span class="step-arrow" aria-hidden="true">&rarr;</span>';
    const topCard = `<div class="card top-card">${rings()}
      <p class="top-line">${tn('an.called', f.total, { n: fmtN(f.total), d: a.days })}</p>
      <div class="steps">${step(f.total, t('an.step.called'))}${arrow}${step(f.answered, t('an.step.answered'))}${arrow}${step(f.yes, t('an.step.yes'))}</div>
      ${f.answered < SMALL_SAMPLE ? `<p class="warn-note">${tn('an.small', f.answered, { n: fmtN(f.answered) })}</p>` : ''}
      ${aiSummaryBlock()}</div>`;

    // Why the rest did not work: a count and a plain phrase, nothing to decode.
    const failed = a.endedReasons.reduce((s, e) => s + e.n, 0);
    const whyCard = !failed ? '' : `<div class="card">
      <div class="card-head"><span class="card-title">${tn('an.why', failed, { n: fmtN(failed) })}</span></div>
      <ul class="tally">${a.endedReasons.map((e) => `<li><b>${fmtN(e.n)}</b><span>${t('end.' + e.key)}</span></li>`).join('')}</ul>
      ${f.hungUpEarly ? `<p class="after-note">${tn('an.why.early', f.hungUpEarly, { a: fmtN(f.hungUpEarly) })}</p>` : ''}</div>`;

    // What they said: three numbers, one sentence about the reason, their words.
    const saidCard = `<div class="card">
      <div class="card-head"><span class="card-title">${f.answered ? tn('an.said', f.answered, { n: fmtN(f.answered) }) : t('an.said.title.none')}</span></div>
      ${f.answered ? `
      <div class="answer-row">
        <div class="answer"><b class="answer-n good">${fmtN(f.yes)}</b><span>${t('an.said.yes')}</span></div>
        <div class="answer"><b class="answer-n bad">${fmtN(f.no)}</b><span>${t('an.said.no')}</span></div>
        <div class="answer"><b class="answer-n">${fmtN(f.unsure)}</b><span>${t('an.said.unsure')}</span></div></div>
      <p class="after-note strong">${escapeHtml(reasonSentence(a))}</p>
      ${a.quotes.length ? `<p class="quotes-label">${t('an.quotes')}</p><div class="quotes">${a.quotes.map((q) => `<div class="quote" data-id="${escapeHtml(q.callId)}">
        <div class="verbatim" dir="auto" lang="he">${escapeHtml(q.text)}</div>
        <div class="quote-meta">${intentBadge({ intent: q.intent })}${q.city ? `<span dir="auto">${escapeHtml(q.city)}</span>` : ''}<span>${fmtTime(q.createdAt)}</span></div></div>`).join('')}</div>` : ''}
      ${f.refused || f.optOut ? `<p class="after-note">${[f.refused ? tf('an.said.refused', { n: fmtN(f.refused) }) : '', f.optOut ? tn('an.said.optout', f.optOut, { n: fmtN(f.optOut) }) : ''].filter(Boolean).join(' ')}</p>` : ''}`
      : `<div class="page-empty">${t('an.said.none')}</div>`}</div>`;

    // What to do next: instructions, numbered, worst first.
    const list = todos(a);
    const todoCard = `<div class="card">
      <div class="card-head"><span class="card-title">${t('an.todo')}</span></div>
      ${list.length ? `<ol class="todos">${list.map((x, i) => `<li><span class="todo-n">${i + 1}</span>
        <div class="todo-body"><b>${escapeHtml(x.title)}</b><p>${escapeHtml(x.note)}</p></div></li>`).join('')}</ol>` : `<div class="page-empty">${t('an.todo.none')}</div>`}
      <div id="ai-todo"></div></div>`;

    // Everything an analyst would still want, folded away.
    const agent = agentLines(a);
    const detail = `<details class="more"><summary>${t('an.more')}</summary><div class="more-body">
      ${agent.length ? `<div class="card"><div class="card-head"><span class="card-title">${t('ah.title')}</span></div>
        <ul class="findings">${agent.map((s) => `<li><span class="dot"></span><span>${escapeHtml(s)}</span></li>`).join('')}</ul></div>` : ''}
      ${a.cities.length ? `<div class="card"><div class="card-head"><span class="card-title">${t('an.cities')}</span></div>
        <div style="overflow-x:auto"><table class="table nowrap">
        <thead><tr><th>${t('an.col.city')}</th><th class="end">${t('an.col.calls')}</th><th class="end">${t('an.col.yes')}</th><th class="end">${t('an.col.no')}</th><th class="end">${t('an.col.nr')}</th></tr></thead>
        <tbody>${a.cities.map((c) => `<tr><td><bdi>${escapeHtml(c.city)}</bdi></td><td class="end mono">${c.total}</td><td class="end mono">${c.yes}</td><td class="end mono">${c.no}</td><td class="end mono">${c.notReached}</td></tr>`).join('')}</tbody></table></div></div>` : ''}
      ${(() => { const days = a.daily.filter((d) => d.total).reverse(); return days.length ? `<div class="card"><div class="card-head"><span class="card-title">${t('an.daily')}</span></div>
        <div style="overflow-x:auto"><table class="table nowrap">
        <thead><tr><th>${t('an.col.day')}</th><th class="end">${t('an.col.calls')}</th><th class="end">${t('an.col.answered')}</th><th class="end">${t('an.col.yes')}</th><th class="end">${t('an.col.no')}</th><th class="end">${t('an.col.cost')}</th></tr></thead>
        <tbody>${days.map((d) => `<tr><td class="mono">${d.day}</td><td class="end mono">${d.total}</td><td class="end mono">${d.yes + d.no + d.unsure}</td><td class="end mono">${d.yes}</td><td class="end mono">${d.no}</td><td class="end mono">${money(d.cost)}</td></tr>`).join('')}</tbody></table></div></div>` : ''; })()}
    </div></details>`;

    const html = head + topCard + whyCard + saidCard + todoCard + detail;
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

const bubble = (role, text, partial = false, who) => `<div class="turn ${role === 'user' ? 'user' : ''}"><div class="bubble${partial ? ' partial' : ''}">
  <div class="who" translate="no">${who ?? (role === 'user' ? t('who.user') : t('who.agent'))}</div><div class="say" dir="auto">${escapeHtml(text)}</div></div></div>`;

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
  // Vapi stores the agent's speech as one message per TTS chunk ("היי", "מדברת נועה", …).
  // Merge consecutive same-speaker fragments so it reads like a conversation.
  const turns = [];
  for (const m of d.messages) {
    const last = turns[turns.length - 1];
    if (last && last.role === m.role) last.text += (/^[.,!?]/.test(m.text) ? '' : ' ') + m.text;
    else turns.push({ role: m.role, text: m.text });
  }
  const convo = turns.length
    ? `<div class="convo" lang="he">${turns.map((m) => bubble(m.role, m.text.trim())).join('')}</div>`
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
        ${sd?.reason_verbatim ? `<div style="grid-column:1/-1"><div class="k">${t('detail.verbatim')}</div><div class="verbatim" dir="auto" lang="he">${escapeHtml(sd.reason_verbatim)}</div></div>` : ''}
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
const MIC_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0M12 17v5M8 22h8"/></svg>';
const MIC_OFF_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M15 9.3V5a3 3 0 0 0-6 0v1M9 9v2a3 3 0 0 0 5.1 2.1M5 10a7 7 0 0 0 11.4 5.4M19 10a7 7 0 0 1-.6 2.8M12 17v5M8 22h8M3 3l18 18"/></svg>';
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

// One voice: the clone Cartesia lists as "Michal" (made for the Homies inbound agent); the agent is Noa. sonic-3.5,
// the newest model Vapi accepts for Hebrew. The Cartesia key sits on the Vapi account as
// a provider credential; without it Vapi falls back to the Azure voice below.
const VOICES = [
  { id: 'cartesia:noa', label: 'Noa · voice clone', provider: 'cartesia', voiceId: '97af151c-45bb-4c64-af13-2a43925dacba',
    extra: { model: 'sonic-3.5', language: 'he', generationConfig: { volume: 1.4 }, fallbackPlan: { voices: [{ provider: 'azure', voiceId: 'he-IL-HilaNeural' }] } } },
];

// The SDK instance and call state outlive the page so navigating away mid-call
// does not drop the call; coming back re-binds the UI to the live state.
const agent = { vapi: null, live: false, muted: false, partial: null, turns: [], seeded: false, log: [], lead: null, callId: null };

// The opening line is a small Liquid template Vapi fills in at call time (a greeting by
// the hour, Israel time) and never reports as text, only as a transcription of the
// audio. Rendered here for the feed; api/_vapi.js has the same function for storage.
function renderFirst(tpl, when = new Date()) {
  if (!tpl || !tpl.includes('{%')) return tpl ?? '';
  const h = Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Jerusalem', hour: 'numeric', hour12: false }).format(when)) % 24;
  return tpl
    .replace(/\{%\s*assign[\s\S]*?%\}/g, '')
    .replace(/\{%\s*if\s+h\s*<\s*(\d+)\s*%\}([^{]*)\{%\s*elsif\s+h\s*<\s*(\d+)\s*%\}([^{]*)\{%\s*else\s*%\}([^{]*)\{%\s*endif\s*%\}/g,
      (_, a, A, b, B, C) => (h < Number(a) ? A : h < Number(b) ? B : C))
    .trim();
}

// The feed is a list of turns. The agent's side is the text Vapi hands the voice
// (voice-input), word for word; the transcriber's rendering of his audio is dropped,
// because in Hebrew it mishears the organisation's name on most calls. The person's
// side is the transcriber's, partials included. Consecutive agent chunks join up.
function addTurn(role, text, who) {
  const last = agent.turns[agent.turns.length - 1];
  if (role === 'bot' && last?.role === 'bot' && last.open) last.text += ' ' + text;
  else { if (last) last.open = false; agent.turns.push({ role, text, who, open: role === 'bot' }); }
}
const feedHtml = () => agent.turns.map((x) => bubble(x.role, x.text, false, x.who)).join('') + (agent.partial ? bubble(agent.partial.role, agent.partial.text, true) : '');
function paintFeed() { const feed = $('feed'); if (!feed) return; feed.innerHTML = feedHtml(); feed.scrollTop = feed.scrollHeight; }
const dlog = (m) => { agent.log.push(m); console.log('[agent]', m); const d = $('diag'); if (d) d.textContent = agent.log.join('\n'); };

async function getVapi() {
  if (agent.vapi) return agent.vapi;
  dlog('importing SDK...');
  const mod = await import('./vendor/vapi.js');
  const Vapi = mod.default?.default ?? mod.default ?? mod.Vapi ?? mod;
  if (typeof Vapi !== 'function') throw new Error('SDK export is ' + typeof Vapi + ', not a constructor');
  dlog('SDK loaded');
  const v = new Vapi(PUBLIC_KEY);
  v.on('call-start', () => { dlog('event: call-start'); agent.live = true; agent.ending = false; agent.muted = false; agent.turns = []; agent.partial = null; agent.seeded = false; syncAgentUi(); });
  v.on('call-end', () => { dlog('event: call-end'); agent.ending = true; agent.live = false; agent.partial = null; syncAgentUi(); toast(t('agent.saved')); pullFinishedCall(); });
  v.on('speech-start', () => $('orb')?.classList.add('speaking'));
  v.on('speech-end', () => $('orb')?.classList.remove('speaking'));
  v.on('volume-level', (lvl) => { const r = $('ring'); if (r) r.style.transform = `scale(${1 + Math.min(lvl, 1) * 0.22})`; });
  v.on('message', (m) => {
    if (m.type === 'status-update' && m.status === 'ended') agent.ending = true;
    if (m.type === 'voice-input') { const text = String(m.input ?? '').trim(); if (text) { addTurn('bot', text); paintFeed(); } return; }
    if (m.type !== 'transcript' || !m.transcript) return;
    if (m.role !== 'user') {
      // His first sound: put the opening line in, as written, and ignore the rest of
      // what the transcriber makes of his audio (every later turn arrives as voice-input).
      if (!agent.seeded) { agent.seeded = true; const first = renderFirst(cache.config?.firstTemplate); if (first) { addTurn('bot', first); agent.turns[agent.turns.length - 1].open = false; paintFeed(); } }
      return;
    }
    if (m.transcriptType === 'partial') agent.partial = { role: 'user', text: m.transcript };
    else { agent.partial = null; addTurn('user', m.transcript); }
    paintFeed();
  });
  v.on('error', (e) => {
    const msg = e?.message ?? e?.error?.message ?? e?.error?.errorMsg ?? e?.errorMsg ?? JSON.stringify(e)?.slice(0, 200) ?? '';
    dlog('event: error -> ' + msg);
    // When the assistant hangs up (endCall, an end-call phrase) the server closes the room
    // and the browser is ejected; Daily reports that as an error. It is a normal ending.
    // Look through the whole object: the SDK nests the reason differently per event.
    if (agent.ending || /meeting has ended|meeting-ended|ejected|call has ended|ended the call/i.test(JSON.stringify(e ?? ''))) return;
    agent.live = false; syncAgentUi(); const er = $('err'); if (er) er.textContent = t('agent.error');
  });
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
  state.innerHTML = agent.live ? `<b>${t('agent.connected')}</b> — ${t('agent.connected.sub')}` : (agent.turns.length ? t('agent.ended') : t('agent.ready'));
  chat.disabled = send.disabled = !agent.live;
  voice.disabled = speed.disabled = agent.live;
  const actions = $('call-actions'), mute = $('mute');
  if (actions) actions.hidden = !agent.live;
  if (mute) { mute.innerHTML = (agent.muted ? MIC_OFF_ICON : MIC_ICON) + ' ' + t(agent.muted ? 'agent.unmute' : 'agent.mute'); mute.classList.toggle('on', agent.muted); mute.setAttribute('aria-pressed', String(agent.muted)); }
  if (agent.live && agent.muted) state.innerHTML = '<b>' + t('agent.muted') + '</b>';
  const feed = $('feed'); if (feed) feed.innerHTML = feedHtml();
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
          <div class="call-actions" id="call-actions" hidden><button class="btn secondary sm" id="mute" type="button" aria-pressed="false">${MIC_ICON} ${t('agent.mute')}</button></div>
          <div class="diag" id="diag"></div>
          <div class="controls">
            <label for="voice">${t('agent.voice')}</label>
            <span class="select sm"><select id="voice">${VOICES.map((v) => `<option value="${v.id}"${v.id === voiceSel ? ' selected' : ''}>${v.label}</option>`).join('')}</select>
              <svg viewBox="0 0 12 12"><path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
            <label for="speed">${t('agent.speed')}</label>
            <input type="range" id="speed" min="0.75" max="1.25" step="0.05" value="${speedVal}"><span class="mono" id="speedval">${Number(speedVal).toFixed(2)}</span>
          </div>
          <div class="feed convo" id="feed" lang="he"></div>
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
      // Mutes the browser mic only; her side keeps playing. The SDK starts every call unmuted.
      $('mute').onclick = () => { if (!agent.live || !agent.vapi) return; agent.muted = !agent.muted; agent.vapi.setMuted(agent.muted); syncAgentUi(); };
      $('speed').oninput = () => { $('speedval').textContent = Number($('speed').value).toFixed(2); store.set('speed', $('speed').value); };
      // Phones: the SDK is fetched now, not at the tap, so the tap and the permission
      // prompt stay close together (iOS ties both to the gesture).
      getVapi().catch(() => {});
      $('mic').onclick = async () => {
        $('err').textContent = '';
        try {
          if (agent.live) { agent.vapi?.stop(); return; }
          // Ask for the microphone right here in the tap, before any other async work:
          // on mobile browsers that is what makes the prompt show, and a refusal is
          // reported at once instead of as a failed call. The SDK opens its own stream.
          if (!navigator.mediaDevices?.getUserMedia) { $('err').textContent = t('agent.mic.blocked'); return; }   // http or an old browser
          try { (await navigator.mediaDevices.getUserMedia({ audio: true })).getTracks().forEach((tr) => tr.stop()); }
          catch (e) { $('err').textContent = t('agent.mic.blocked'); dlog('mic refused: ' + (e?.name ?? e)); return; }
          const v = await getVapi();
          if (!$('mic')) return;                       // navigated away while the SDK loaded
          $('mic').disabled = true; $('state').textContent = t('agent.connecting');
          const pick = VOICES.find((x) => x.id === $('voice').value) ?? VOICES[0];
          const speed = Number($('speed').value);
          // Cartesia keeps speed under generationConfig; a top-level speed is refused.
          const pace = pick.provider === 'cartesia' ? { generationConfig: { ...pick.extra?.generationConfig, speed } } : { speed };
          const overrides = { voice: { provider: pick.provider, voiceId: pick.voiceId, ...pick.extra, ...pace, chunkPlan: { formatPlan: { enabled: false } } } };
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
        addTurn('user', text, t('who.you')); paintFeed();
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
