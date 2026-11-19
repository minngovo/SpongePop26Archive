'use strict';
// 데모용 그림. 실제 기록에서는 image에 'images/photo.jpg' 같은 파일 경로를 넣으세요.
const art=(sky,hill,sun)=>'data:image/svg+xml,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 320"><path fill="${sky}" d="M0 0h480v320H0z"/><circle fill="${sun}" cx="350" cy="90" r="42"/><path fill="${hill}" d="M0 260Q90 110 235 235Q340 140 480 245V320H0Z"/></svg>`);
// 여기를 교체하면 됩니다. 날짜 YYYY-MM-DD, 시간 HH:MM, from: artist 또는 fan.
// text의 {{name}}은 입력한 애칭으로 표시됩니다. 원문을 유지하려면 그대로 작성하세요.

const $=s=>document.querySelector(s), node=(tag,text,cls)=>{const e=document.createElement(tag);if(text!=null)e.textContent=text;if(cls)e.className=cls;return e;};
const dateLabel=d=>new Intl.DateTimeFormat('ko-KR',{dateStyle:'full',timeZone:'UTC'}).format(new Date(d+'T00:00:00Z'));
const groups = new Map();
let month = new Date().toISOString().slice(0, 7);
let nickname = '';

async function loadMessages() {
  const response = await fetch('./messages.txt', { cache: 'no-cache' });
  if (!response.ok) {
    throw new Error(`messages.txt를 불러오지 못했습니다 (${response.status}).`);
  }

  const messages = JSON.parse((await response.text()).replace(/^\uFEFF/, ''));
  if (!Array.isArray(messages)) {
    throw new Error('messages.txt는 JSON 배열이어야 합니다.');
  }

  messages.sort((a, b) =>
    `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`)
  );

  groups.clear();
  for (const message of messages) {
    if (!groups.has(message.date)) groups.set(message.date, []);
    groups.get(message.date).push(message);
  }

  const latest = messages.at(-1);
  if (latest) month = latest.date.slice(0, 7);
}

const entry=$('#entry'), app=$('#app'), nameField=$('#name'), viewer=$('#viewer');
function tab(id){$('#capture').hidden=id!=='chat';if(id!=='chat'&&captureMode)endCapture();if(id==='hearts')renderHearts();$('#latest').hidden = id !== 'chat';for(const key of ['chat','dates','photos','search','hearts'])$('#'+key).hidden=key!==id; for(const b of document.querySelectorAll('[data-tab]'))b.setAttribute('aria-current',String(b.dataset.tab===id)); if(id==='dates')renderCalendar();if(id==='search'){showResults();$('#query').focus();}window.scrollTo(0,0);}

function picture(m){const b=node('button',null,'photo'), im=node('img');im.src=m.image;im.alt=m.alt||'채팅 이미지';b.append(im);b.onclick=()=>{const large=$('#large');large.src=m.image;large.alt=im.alt;$('#caption').textContent=dateLabel(m.date)+' · '+m.time;viewer.showModal();};return b;}

function render(){
  const chat=$('#chat'), photos=$('#photos'), gallery=node('div',null,'gallery-days'), recent=$('#recent-photos');
  chat.replaceChildren();
  recent.replaceChildren();
  records.length=0;
const duplicates=new Map();
  const back=node('button','채팅으로 돌아가기','return');
  back.onclick=goLatest;
  photos.replaceChildren(node('h2','이미지 모아보기'),back,gallery);
  if(!groups.size)chat.append(node('p','저장된 채팅이 없어요.'));

  const imageMessages=[];

  for(const [date,rows] of groups){
    const head=node('h2',dateLabel(date),'date');
    head.id='day-'+date;
    head.tabIndex=-1;
    chat.append(head);
    let previous='',stack;

    for(const m of rows){
      const fan=m.from==='fan', author=fan?'나':(m.author||'묵폰지'), key=JSON.stringify([fan,author,m.time]);
      if(key!==previous){
        const line=node('article',null,'line'+(fan?' mine':'')), meta=node('div',null,'meta'), t=node('time',m.time);
        stack=node('div',null,'stack');
        t.dateTime=date+'T'+m.time;
        meta.append(node('span',author));
        if(!fan){
          const badge=node('span','✓','verified');
          badge.setAttribute('aria-hidden','true');
          meta.append(badge);
          const avatar=node('img',null,'avatar');
          avatar.src='./images/artist-profile.jpg';
          avatar.alt='';
          line.append(avatar);
        }
        meta.append(t);
        stack.append(meta);
        line.append(stack);
        chat.append(line);
        previous=key;
      }
     const messageText = m.text?.replaceAll('{{name}}', () => nickname) ?? '';
const bubble = node('div', null, 'bubble');

if (!fan && typeof m.replyTo === 'string' && m.replyTo.trim()) {
  bubble.classList.add('reply-bubble');

  const label = node('div', `${author}님의 답장`, 'reply-label');
  const quote = node('div', m.replyTo, 'reply-quote');
  const body = node('div', null, 'reply-body');
  const arrow = node('span', '↳', 'reply-arrow');

  arrow.setAttribute('aria-hidden', 'true');
  body.append(arrow, node('span', messageText));
  bubble.append(label, quote, body);
} else {
  bubble.textContent = messageText;
}

      if(m.image){
        bubble.append(picture(m));
        imageMessages.push(m);
      }
     stack.append(decorate(bubble,m,author,duplicates));
    }
  }

  for(const [date,rows] of [...groups].reverse()){
    const images=rows.filter(m=>m.image);
    if(!images.length)continue;
    const day=node('section',null,'gallery-day'), grid=node('div',null,'gallery');
    day.append(node('h3',dateLabel(date)+' · '+images.length+'장'),grid);
    grid.append(...images.map(picture));
    gallery.append(day);
  }
  if(!imageMessages.length){
    gallery.append(node('p','저장된 이미지가 없어요.'));
    recent.append(node('p','저장된 이미지가 없어요.','sheet-empty'));
  } else {
    // 바텀 시트 보관함에 최신 이미지 최대 4개 표시
    for(const m of imageMessages.slice(-4).reverse()){
      const thumb=picture(m);
      thumb.className='';
      recent.append(thumb);
    }
  }
}

function renderCalendar(){const area=$('#dates'), [y,m]=month.split('-').map(Number), bar=node('div',null,'month'), grid=node('div',null,'calendar');const shift=n=>{const date=new Date(Date.UTC(y,m-1+n,1));month=date.toISOString().slice(0,7);renderCalendar();$('#dates button[data-shift="'+n+'"]').focus();};const prev=node('button','이전 달'), next=node('button','다음 달');prev.dataset.shift=-1;next.dataset.shift=1;prev.onclick=()=>shift(-1);next.onclick=()=>shift(1);bar.append(prev,node('strong',`${y}년 ${m}월`),next);for(const day of '일월화수목금토')grid.append(node('span',day));for(let i=0;i<new Date(Date.UTC(y,m-1,1)).getUTCDay();i++)grid.append(node('span'));for(let i=1;i<=new Date(Date.UTC(y,m,0)).getUTCDate();i++){const date=month+'-'+String(i).padStart(2,'0'), b=node('button',i);b.disabled=!groups.has(date);if(!b.disabled)b.classList.add('has');b.setAttribute('aria-label',dateLabel(date)+(b.disabled?' 기록 없음':' 기록 보기'));b.onclick=()=>go(date);grid.append(b);}area.replaceChildren(node('h2','캘린더'),node('p','점이 있는 날짜를 누르면 해당 대화로 이동해요.'),bar,grid,returnButton());}
function start(value){nickname=value;$('#status').textContent=`함께한지 185일`;entry.hidden=true;app.hidden=false;render();tab('chat');goLatest();}
$('#join').onsubmit = async (e) => {
  e.preventDefault();
  const value = nameField.value.trim();

  if (!value) {
    nameField.setCustomValidity('애칭을 입력해 주세요.');
    nameField.reportValidity();
    return;
  }

  const button = e.currentTarget.querySelector('button');
  button.disabled = true;

  try {
    await loadMessages();
  } catch (error) {
    console.error(error);
    alert('채팅 기록을 불러오지 못했어요. messages.txt의 위치와 형식을 확인해 주세요.');
    return;
  } finally {
    button.disabled = false;
  }

  start(value);
};
nameField.oninput = () => nameField.setCustomValidity('');

const menu=$('#menu');
function go(date){tab('chat');const target=date&&document.getElementById('day-'+date);if(target){document.documentElement.style.setProperty('--offset',($('header').offsetHeight+12)+'px');target.focus({preventScroll:true});target.scrollIntoView({block:'start'});}}
function goLatest(){tab('chat');window.scrollTo(0,document.documentElement.scrollHeight);}
function returnButton(){const b=node('button','마지막 팝으로','return');b.onclick=goLatest;return b;}
function terms(text){return (text??'').normalize('NFKC').toLocaleLowerCase().match(/[\p{L}\p{N}]+/gu)||[];}
function display(m){return m.text?.replaceAll('{{name}}',()=>nickname)??'';}
function showResults(){
 const query=terms($('#query').value),out=$('#results');out.replaceChildren();
 if(!query.length){out.append(node('p','검색어를 입력해 주세요.'));return;}
 for(const r of records){const text=display(r.m), words=terms(text+' '+(r.m.replyTo??''));
 if(!query.every(q=>words.some(w=>w.includes(q))))continue;
 const b=node('button',null,'result');
 b.append(node('span',`${r.m.date} ${r.m.time}`,'result-time'));
 if(r.m.replyTo) b.append(node('span','팬 메시지 · '+r.m.replyTo,'result-quote'));
 b.append(node('span',text||(r.m.image?'사진':''),'result-text'));
 b.onclick=()=>jump(r);out.append(b);}
 if(!out.childElementCount)out.append(node('p','일치하는 메시지가 없어요.'));
}

$('#query').oninput=showResults;
$('#latest').onclick=goLatest;
$('#profile').onclick=()=>menu.showModal();

// 시트 바깥의 어두운 배경 클릭 시 닫기
menu.onclick=e=>{if(e.target===menu)menu.close();};
const dragZone = menu.querySelector('.sheet-drag-zone');
let sheetDrag = null;
let sheetClosing = false;

dragZone.addEventListener('pointerdown', (e) => {
  if (!e.isPrimary || e.button !== 0 || sheetClosing) return;

  sheetDrag = { id: e.pointerId, startY: e.clientY, distance: 0 };
  dragZone.setPointerCapture(e.pointerId);
  menu.classList.add('is-dragging');
});

dragZone.addEventListener('pointermove', (e) => {
  if (sheetDrag?.id !== e.pointerId) return;

  sheetDrag.distance = Math.max(0, e.clientY - sheetDrag.startY);
  menu.style.setProperty('--sheet-y', `${sheetDrag.distance}px`);
});

function finishSheetDrag(e, cancelled = false) {
  if (sheetDrag?.id !== e.pointerId) return;

  const shouldClose = !cancelled && sheetDrag.distance >= 80;
  sheetDrag = null;
  menu.classList.remove('is-dragging');

  if (!shouldClose) {
    menu.style.removeProperty('--sheet-y');
    return;
  }

  sheetClosing = true;
  menu.style.setProperty('--sheet-y', '100%');
  setTimeout(() => {
    if (sheetClosing && menu.open) menu.close();
  }, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 200);
}

dragZone.addEventListener('pointerup', finishSheetDrag);
dragZone.addEventListener('pointercancel', (e) => finishSheetDrag(e, true));
dragZone.addEventListener('lostpointercapture', (e) => finishSheetDrag(e, true));

menu.addEventListener('close', () => {
  sheetDrag = null;
  sheetClosing = false;
  menu.classList.remove('is-dragging');
  menu.style.removeProperty('--sheet-y');
});


$('#rename').onclick=()=>{menu.close();app.hidden=true;entry.hidden=false;nameField.value=nickname;nameField.focus();};

// 배경 색상 순환 변경 (기본 블루그레이 / 라벤더 / 화이트)
const themes=['#cbd1e7','#e5def4','#f5f6f8'];
let themeIdx=0;
$('#bg-setting').onclick=()=>{
  themeIdx=(themeIdx+1)%themes.length;
  const color=themes[themeIdx];
  document.body.style.background=color;
  $('main').style.background=color;
  $('header').style.background=color;
};

// 나가기 클릭 시 초기 화면으로 이동
$('#exit-chat').onclick=()=>{menu.close();app.hidden=true;entry.hidden=false;};

for(const b of document.querySelectorAll('[data-tab]'))b.onclick=()=>{if(menu.open)menu.close();const next=b.dataset.tab;if(next==='chat')goLatest();else if($('#'+next).hidden)tab(next);else goLatest();};
const records=[];
const storeKey='sponge-pop-hearts:'+location.pathname;
let hearts=new Set();
try {const saved=JSON.parse(localStorage.getItem(storeKey)||'[]');if(Array.isArray(saved))hearts=new Set(saved);}catch{}
let captureMode=false, first=null, last=null;
const bar=$('#capture-bar');
function decorate(bubble, m, author, duplicates) {
  const key = JSON.stringify([m.date, m.time, m.from, m.author, m.text, m.replyTo, m.image]);
  const n = duplicates.get(key) || 0;
  duplicates.set(key, n + 1);

  const wrap = node('div', null, 'message-item');
  const heart = node('span', '♥', 'heart-badge');
  const r = { m, author, key: key + '#' + n, wrap, heart };
  records.push(r);

  heart.setAttribute('aria-label', '하트한 메시지');
  bubble.append(heart);

  let lastTap = null;
  let touchStart = null;
  let lastTouchAt = -Infinity;

  bubble.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'touch' || !e.isPrimary) return;
    touchStart = null;
    if (captureMode || e.target.closest('button')) {
      lastTap = null;
      return;
    }
    touchStart = { id: e.pointerId, x: e.clientX, y: e.clientY };
  });

  bubble.addEventListener('pointercancel', () => {
    touchStart = lastTap = null;
  });

  bubble.addEventListener('pointerup', (e) => {
    if (e.pointerType !== 'touch' || touchStart?.id !== e.pointerId) return;
    const moved = Math.hypot(e.clientX - touchStart.x, e.clientY - touchStart.y);
    touchStart = null;
    if (moved > 12 || captureMode) {
      lastTap = null;
      return;
    }

    const now = performance.now();
    lastTouchAt = now;
    if (lastTap && now - lastTap.time <= 320 &&
        Math.hypot(e.clientX - lastTap.x, e.clientY - lastTap.y) <= 24) {
      toggleHeart(r);
      lastTap = null;
    } else {
      lastTap = { time: now, x: e.clientX, y: e.clientY };
    }
  });

  bubble.addEventListener('dblclick', (e) => {
    if (captureMode || e.target.closest('button') ||
        performance.now() - lastTouchAt < 500) return;
    e.preventDefault();
    toggleHeart(r);
  });

  wrap.addEventListener('click', (e) => {
    if (!captureMode) return;
    e.preventDefault();
    e.stopPropagation();
    pick(r);
  }, true);

  wrap.append(bubble);
  paintHeart(r);
  return wrap;
}

function paintHeart(r) {
  r.heart.hidden = !hearts.has(r.key);
}
function toggleHeart(r){if(hearts.has(r.key))hearts.delete(r.key);else hearts.add(r.key);paintHeart(r);try{localStorage.setItem(storeKey,JSON.stringify([...hearts]));}catch{}}
function jump(r){tab('chat');r.wrap.scrollIntoView({block:'center'});r.wrap.animate([{outline:'3px solid #6555a7'},{outline:'0 solid transparent'}],1200);}
function renderHearts(){const box=$('#hearts'), list=records.filter(r=>hearts.has(r.key)).reverse();box.replaceChildren(node('h2','하트 모아보기'),returnButton());if(!list.length)box.append(node('p','즐겨찾기 채팅을 모아보세요.'));for(const r of list){const row=node('div',null,'heart-row'), b=node('button',`${r.m.date} ${r.m.time} — ${display(r.m)||'사진'}`,'result'), del=node('button','♥');b.onclick=()=>jump(r);del.setAttribute('aria-label','하트 취소');del.onclick=()=>{toggleHeart(r);renderHearts();};row.append(b,del);box.append(row);}}
function endCapture(){captureMode=false;first=last=null;bar.hidden=true;for(const r of records)r.wrap.classList.remove('capture-selected');}
$('#capture').onclick=()=>{if(captureMode)return endCapture();if(!records.length)return;bar.style.top=$('header').offsetHeight+'px';captureMode=true;updateCapture();};
function pick(r){if(first===null||last!==null){first=records.indexOf(r);last=null;}else last=records.indexOf(r);updateCapture();}
function updateCapture(){const low=Math.min(first,last??first),high=Math.max(first,last??first);records.forEach((r,i)=>r.wrap.classList.toggle('capture-selected',first!==null&&i>=low&&i<=high));const save=node('button','PNG 저장'),stop=node('button','취소');save.disabled=last===null;stop.onclick=endCapture;save.onclick=async()=>{save.disabled=true;try{await exportCapture(records.slice(low,high+1));}catch(e){alert(e.message);}finally{save.disabled=false;}};bar.replaceChildren(node('span',first===null?'시작 메시지를 선택하세요.':last===null?'끝 메시지를 선택하세요.':'선택한 메시지 '+(high-low+1)+'개'),save,stop);bar.hidden=false;}
const sizeInput=$('#chat-size'), sizeKey='sponge-pop-text-size:'+location.pathname;
function updateTextSize(value){
 const size=Math.min(24,Math.max(13,Number(value)||15));
 sizeInput.value=size;
 $('#size-value').value=size+'px';
 $('#app').style.setProperty('--chat-text-size',size+'px');
}
try{updateTextSize(localStorage.getItem(sizeKey)||sizeInput.value);}catch{updateTextSize(sizeInput.value);}
sizeInput.oninput=()=>{
 updateTextSize(sizeInput.value);
 try{localStorage.setItem(sizeKey,sizeInput.value);}catch{}
};

async function exportCapture(rows){
 if(typeof window.html2canvas!=='function') throw Error('캡처 모듈을 불러오지 못했어요. 인터넷 연결을 확인해 주세요.');
 const chat=$('#chat'), start=rows[0].wrap, end=rows.at(-1).wrap;
 const selected=new Set(rows.map(r=>r.wrap));
 const images=[...new Set(rows.flatMap(r=>[...r.wrap.querySelectorAll('img'),r.wrap.closest('.line')?.querySelector('img.avatar')].filter(Boolean)))];
 for(const img of images){
  try{await img.decode();}catch{throw Error('캡처에 필요한 사진을 불러오지 못했어요. 이미지 경로를 확인해 주세요.');}
 }
 await document.fonts.ready;
 const bounds=chat.getBoundingClientRect(), firstBounds=start.getBoundingClientRect();
 const preceding=start.previousElementSibling;
 const top=preceding?.classList.contains('meta')?Math.min(firstBounds.top,start.closest('.line').getBoundingClientRect().top):firstBounds.top;
 const y=Math.max(0,Math.floor(top-bounds.top)-2);
 const height=Math.ceil(end.getBoundingClientRect().bottom-bounds.top)-y+2;
 const width=Math.ceil(bounds.width);
 if(height>8000)throw Error('선택한 범위가 너무 길어요. 나눠서 캡처해 주세요.');
 const keep=Array.from(chat.querySelectorAll('.message-item'),el=>selected.has(el));
 const canvas=await window.html2canvas(chat,{
  y,width,height,scale:Math.min(window.devicePixelRatio||1,2),
  backgroundColor:getComputedStyle($('main')).backgroundColor,
  useCORS:true,logging:false,
  onclone(doc){
   doc.querySelectorAll('#chat .message-item').forEach((el,i)=>{
    el.classList.remove('capture-selected');
    if(!keep[i])el.style.visibility='hidden';
   });
  }
 });
 const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
 if(!blob)throw Error('이미지를 저장하지 못했어요.');
 const url=URL.createObjectURL(blob), a=node('a');
 a.href=url;a.download=`sponge-pop-${rows[0].m.date}-${rows[0].m.time.replace(':','')}.png`;
 document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
}
