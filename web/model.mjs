export const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const starter = {size:'entry', qty:2, sauce:'smallest', cups:1, tax:false};
export const money = cents => new Intl.NumberFormat('en-CA', {style:'currency',currency:'CAD'}).format(cents / 100);

export function localNow(now = new Date()) {
  const options = {timeZone:'America/Halifax', year:'numeric', month:'2-digit', day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'};
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA',options).formatToParts(now).map(p=>[p.type,p.value]));
  return {date:parts.year+'-'+parts.month+'-'+parts.day,time:parts.hour+':'+parts.minute};
}
export function validDay(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const instant = new Date(date+'T12:00:00Z');
  return !Number.isNaN(+instant) && instant.toISOString().slice(0,10)===date;
}
export function nextSaturday(now = new Date()) {
  const local = localNow(now);
  const day = new Date(local.date+'T12:00:00Z');
  let ahead = (6-day.getUTCDay()+7)%7;
  if (ahead===0 && local.time>'00:45') ahead=7;
  day.setUTCDate(day.getUTCDate()+ahead);
  return day.toISOString().slice(0,10);
}
export function clock(minutes) {
  const hour = Math.floor(minutes/60)%24;
  const min = minutes%60;
  if (hour===0 && !min) return 'midnight';
  if (hour===12 && !min) return 'noon';
  return (hour%12||12)+(min?':'+String(min).padStart(2,'0'):'')+' '+(hour<12?'a.m.':'p.m.');
}
export function windowText(window) {
  const [start,end] = window;
  return end===null ? clock(start)+' · closing time unlisted' : clock(start)+' – '+clock(end);
}
export function schedule(shop,date,time) {
  if (!validDay(date) || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time)) return {state:'invalid',detail:'Choose a valid pickup date and time.'};
  if (!shop.week) return {state:'unknown',detail:'Counter hours unlisted. Call the branch.'};
  const weekday = new Date(date+'T12:00:00Z').getUTCDay();
  const [hour,minute] = time.split(':').map(Number);
  const at = hour*60+minute;
  const prev = (weekday+6)%7;
  const today = shop.week[weekday];
  const yesterday = shop.week[prev];
  if (at >= today[0] && today[1]===null) return {state:'unknown',detail:days[weekday]+' closing time unlisted.'};
  if (at >= today[0] && at < today[1]) return {state:'open',detail:days[weekday]+' hours · until '+clock(today[1])+'.'};
  if (yesterday[1]!==null && at+1440<yesterday[1]) return {state:'open',detail:days[prev]+' hours · until '+clock(yesterday[1])+'.'};
  if (yesterday[1]===null && at<today[0]) return {state:'unknown',detail:days[prev]+' closing time unlisted.'};
  const upcoming = at < today[0] ? weekday : (weekday+1)%7;
  return {state:'closed',detail:'Opens '+days[upcoming]+' at '+clock(shop.week[upcoming][0])+'.'};
}
export function validBasket(b) {
  return !!b && ['entry','medium','large'].includes(b.size) && ['smallest','4oz','next'].includes(b.sauce) &&
    Number.isInteger(b.qty) && b.qty>=1 && b.qty<=12 && Number.isInteger(b.cups) && b.cups>=0 && b.cups<=12 && typeof b.tax==='boolean';
}
export function quote(shop,basket) {
  if (!validBasket(basket)) throw new Error('Invalid basket');
  const sauce = basket.sauce==='4oz' ? shop.sauces.find(s=>s.oz===4) :
    basket.sauce==='next' ? shop.sauces[1] : shop.sauces[0];
  const wraps = shop.prices[basket.size]*basket.qty;
  if (basket.cups && !sauce) return {wraps,sauce:null,subtotal:null,hst:null,total:null};
  const subtotal = wraps+(basket.cups ? sauce.cents*basket.cups : 0);
  const hst = Math.round(subtotal*14/100);
  return {sauce,wraps,subtotal,hst,total:subtotal+(basket.tax ? hst:0)};
}
