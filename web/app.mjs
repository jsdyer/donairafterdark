import {days,starter,money,localNow,nextSaturday,schedule,quote,validBasket,windowText,validDay} from './model.mjs';
const el = id => document.getElementById(id);
const create = (tag,text,cls) => {
  const node = document.createElement(tag);
  if (text!==undefined) node.textContent=text;
  if (cls) node.className=cls;
  return node;
};
function link(label,url) {
  const a=create('a',label); a.href=url; return a;
}
function addOptions(id,first,last) {
  for (let i=first;i<=last;i++) el(id).add(new Option(i,i));
}
addOptions('qty',1,12);
addOptions('cups',0,12);
const key='coolcode:donairafterdark:usual';
let usual=null;
try {
  const stored=JSON.parse(localStorage.getItem(key));
  if (validBasket(stored)) usual=stored;
} catch { /* Browsers can disable storage. */ }
function setBasket(b) {
  for (const field of ['size','qty','sauce','cups']) el(field).value=b[field];
  el('tax').checked=b.tax;
}
function basket() {
  return {size:el('size').value,qty:Number(el('qty').value),sauce:el('sauce').value,cups:Number(el('cups').value),tax:el('tax').checked};
}
function setTime(when) {el('date').value=when.date;el('time').value=when.time;}
setTime(localNow());
setBasket(usual||starter);
if (usual) el('saved').textContent='Your saved order is loaded.';
let shops=[];
const dateLabel = (s,opts={year:'numeric',month:'short',day:'numeric'}) => new Intl.DateTimeFormat('en-CA',{...opts,timeZone:'UTC'}).format(new Date(s+'T12:00:00Z'));
function realHalifaxTime(date,time) {
  if (!validDay(date) || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time)) return false;
  // Halifax alternates between Atlantic standard and daylight offsets.
  return [3,4].some(hours=>{
    const instant = new Date(Date.parse(date+'T'+time+':00Z')+hours*3600000);
    const actual=localNow(instant);
    return actual.date===date && actual.time===time;
  });
}
function evidence(shop,price,b) {
  const details=create('details');
  details.dataset.id=shop.id;
  details.append(create('summary','Order details, hours & sources'));
  const info=create('div',undefined,'evidence');
  const size=b.size==='entry' ? shop.entryLabel : b.size==='medium' ? 'Medium':'Large';
  info.append(create('p',b.qty+' × '+size.toLowerCase()+' donair at '+money(shop.prices[b.size])+' = '+money(price.wraps)+'.'));
  if (b.cups && price.sauce) {
    let descriptor=price.sauce.label;
    if (price.sauce.oz===null) descriptor+=' (volume unspecified)';
    info.append(create('p',b.cups+' × '+descriptor+' extra sauce at '+money(price.sauce.cents)+' = '+money(b.cups*price.sauce.cents)+'.'));
  } else if (!b.cups) info.append(create('p','No extra sauce in this basket.'));
  else info.append(create('p','An exact 4 oz portion has no listed price for this branch.'));
  if (price.total!==null) {
    info.append(create('p','Subtotal '+money(price.subtotal)+' · Estimated HST '+money(price.hst)+' · With HST '+money(price.subtotal+price.hst)+'.'));
  }
  if (shop.week) {
    const dl=create('dl');
    [1,2,3,4,5,6,0].forEach(d=>dl.append(create('dt',days[d]),create('dd',windowText(shop.week[d]))));
    info.append(dl);
  }
  info.append(create('p',shop.sourceNote));
  info.append(create('p','Original menu date: '+(shop.menuDate ? dateLabel(shop.menuDate)+' (PDF metadata)' : 'unlisted')+'. Last verified against sources: '+dateLabel(shop.checked)+'.'));
  const sources=create('p',undefined,'sources');
  sources.append(link('Shop menu',shop.menu));
  if (shop.contact!==shop.menu) sources.append(link(shop.week?'Shop hours':'Branch listing',shop.contact));
  sources.append(link('Call '+shop.phone,'tel:+1'+shop.phone.replaceAll('-','')));
  const mapUrl='https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(shop.name+' '+shop.address+', Halifax, NS');
  sources.append(link('Map',mapUrl));info.append(sources);details.append(info);return details;
}
function card(row,b) {
  const {shop,hours,price}=row;
  const article=create('article',undefined,'card');
  const top=create('div',undefined,'card-top'),identity=create('div'),cost=create('div');
  identity.append(create('h3',shop.name),create('p',shop.area+' · '+shop.address,'address'));
  const labels={open:'Open',closed:'Closed',unknown:'Hours unknown'};
  identity.append(create('span',labels[hours.state], 'status '+hours.state));
  const small=create('p',hours.detail,'detail');
  const full=price.total!==null;
  cost.append(create('div',full?money(price.total):'Unpriced',full?'price':'price quote-missing'),create('p',full?(b.tax?'with HST':'before tax'):'4 oz unlisted','basis'));
  top.append(identity,cost);
  const size=b.size==='entry'?shop.entryLabel.toLowerCase():b.size;
  let items=b.qty+' × '+size+' donair';
  if (b.cups) items+=' + '+b.cups+' × '+(price.sauce ? price.sauce.label.toLowerCase()+(price.sauce.oz===null?' (volume unspecified)':'') : '4 oz unlisted')+' sauce';
  const actions=create('div',undefined,'actions');
  actions.append(link('Call '+shop.phone, 'tel:+1'+shop.phone.replaceAll('-','')),evidence(shop,price,b));
  article.append(top,small,create('p',items,'line'),actions);
  return article;
}
function render() {
  const time=el('time').value,date=el('date').value,b=basket(),filter=el('filter').value;
  const expanded=new Set([...document.querySelectorAll('details[open]')].map(n=>n.dataset.id));
  const list=el('rows');list.replaceChildren();
  el('restore').hidden=!usual || JSON.stringify(usual)===JSON.stringify(b);
  el('sauce').disabled=b.cups===0;
  if (!el('date').validity.valid || !realHalifaxTime(date,time)) {
    el('summary').textContent='Choose a valid Halifax date and time from April 1, 2025 onward. The spring clock change skips 2 a.m. to 2:59 a.m.';return;
  }
  if (!shops.length) return;
  const rows=shops.map(shop=>({shop,hours:schedule(shop,date,time),price:quote(shop,b)}));
  const open=rows.filter(r=>r.hours.state==='open').length;
  const [hour,minute]=time.split(':').map(Number);
  const when=(hour%12 || 12)+':'+String(minute).padStart(2,'0')+(hour<12?' a.m.':' p.m.');
  el('summary').textContent=open+' of '+rows.length+' branches list open hours for '+dateLabel(date,{weekday:'short',month:'short',day:'numeric'})+' at '+when+' Halifax time.';
  const groups=[['open','Open at pickup'],['unknown','Call to check hours'],['closed','Closed at pickup']];
  for (const [state,title] of groups) {
    if (filter!=='all' && filter!==state) continue;
    const matches=rows.filter(r=>r.hours.state===state).sort((a,b)=>(a.price.total??Infinity)-(b.price.total??Infinity)||a.shop.address.localeCompare(b.shop.address));
    if (!matches.length) continue;
    list.append(create('h3',title+' · '+matches.length,'group-title'));
    for (const row of matches) list.append(card(row,b));
  }
  if (!list.childElementCount) list.append(create('p','No branches match this filter at the selected time.','empty'));
  for (const d of list.querySelectorAll('details')) if (expanded.has(d.dataset.id)) d.open=true;
}
el('controls').addEventListener('submit',e=>e.preventDefault());
for (const event of ['input','change']) el('controls').addEventListener(event,render);
el('filter').addEventListener('change',render);
el('now').addEventListener('click',()=>{setTime(localNow());render();});
el('late').addEventListener('click',()=>{setTime({date:nextSaturday(),time:'00:45'});render();});
el('save').addEventListener('click',()=>{
  try {const b=basket();localStorage.setItem(key,JSON.stringify(b));usual=b;el('saved').textContent='Usual order saved on this device.';render();}
  catch {el('saved').textContent='This browser could not save your order.';}
});
el('restore').addEventListener('click',()=>{if (usual) {setBasket(usual);el('saved').textContent='Your saved order is loaded.';render();}});
try {
  const response=await fetch('./data/shops.json');
  if (!response.ok) throw new Error('Menu fetch failed');
  shops=await response.json();render();
} catch {el('summary').textContent='The menus could not load. Reload the page or open a shop menu in Sources.';}
