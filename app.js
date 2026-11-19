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
  let raw;
  const selected = archiveFile.files[0];
  if (selected) {
    raw = await selected.text();
  } else {
    if (location.protocol === 'file:') throw new Error('messages.txt를 선택한 뒤 다시 입장해 주세요.');
    const response = await fetch('./messages.txt', { cache: 'no-cache' });
    if (!response.ok) throw new Error(`messages.txt 요청 실패 (HTTP ${response.status}). index.html과 같은 배포 폴더에 있는지 확인해 주세요.`);
    raw = await response.text();
  }

  let messages;
  try {
    messages = JSON.parse(raw.replace(/^\uFEFF/, ''));
  } catch {
    throw new Error('파일 내용이 올바른 JSON이 아니에요. messages.txt가 맞는지 확인해 주세요.');
  }
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

function tab(id){$('#capture').hidden=id!=='chat';if(id!=='chat'&&captureMode)endCapture();if(id==='hearts')renderHearts();$('#composer').hidden=id!=='chat';for(const key of ['chat','dates','photos','search','hearts'])$('#'+key).hidden=key!==id; for(const b of document.querySelectorAll('[data-tab]'))b.setAttribute('aria-current',String(b.dataset.tab===id)); if(id==='dates')renderCalendar();if(id==='search'){showResults();$('#query').focus();}window.scrollTo(0,0);}

function picture(m){const b=node('button',null,'photo'), im=node('img');im.src=m.image;im.alt=m.alt||'채팅 이미지';b.append(im);b.onclick=()=>{const large=$('#large');large.src=m.image;large.alt=im.alt;$('#caption').textContent=dateLabel(m.date)+' · '+m.time;viewer.showModal();};return b;}

function render(){
  const chat=$('#chat'), photos=$('#photos'), gallery=node('div',null,'gallery-days'), recent=$('#recent-photos');
  chat.replaceChildren();
  records.length=0;
  const duplicates=new Map();
  recent.replaceChildren();
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
          line.append(node('span',author.slice(0,1),'avatar'));
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
const fileLabel = node('label', '채팅 기록 파일 선택 (messages.txt)');
const archiveFile = node('input');
archiveFile.type = 'file';
archiveFile.accept = '.txt,.json';
fileLabel.append(archiveFile);
fileLabel.hidden = location.protocol !== 'file:';
nameField.after(fileLabel);

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
    fileLabel.hidden = false;
    alert(error.message || '채팅 기록을 불러오지 못했어요.');
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
 const b=node('button',`${r.m.date} ${r.m.time} — ${text||r.m.replyTo}`,'result');b.onclick=()=>jump(r);out.append(b);}
 if(!out.childElementCount)out.append(node('p','일치하는 메시지가 없어요.'));
}

$('#query').oninput=showResults;
$('#latest').onclick=goLatest;
$('#profile').onclick=()=>menu.showModal();

// 시트 바깥의 어두운 배경 클릭 시 닫기
menu.onclick=e=>{if(e.target===menu)menu.close();};

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
function decorate(bubble,m,author,duplicates){
 const key=JSON.stringify([m.date,m.time,m.from,m.author,m.text,m.replyTo,m.image]);
 const n=duplicates.get(key)||0;duplicates.set(key,n+1);
 const wrap=node('div',null,'message-item'), heart=node('button',null,'heart-toggle');
 const r={m,author,key:key+'#'+n,wrap,heart};records.push(r);
 heart.type='button';heart.onclick=()=>captureMode?pick(r):toggleHeart(r);
 bubble.ondblclick=e=>{if(!captureMode&&!e.target.closest('button')){e.preventDefault();toggleHeart(r);}};
 wrap.addEventListener('click',e=>{if(captureMode&&!e.target.closest('.heart-toggle')){e.preventDefault();e.stopPropagation();pick(r);}},true);
 wrap.append(bubble,heart);paintHeart(r);return wrap;
}
function paintHeart(r){const on=hearts.has(r.key);r.heart.textContent=on?'♥':'♡';r.heart.setAttribute('aria-pressed',String(on));r.heart.setAttribute('aria-label',on?'하트 취소':'하트 추가');}
function toggleHeart(r){if(hearts.has(r.key))hearts.delete(r.key);else hearts.add(r.key);paintHeart(r);try{localStorage.setItem(storeKey,JSON.stringify([...hearts]));}catch{}}
function jump(r){tab('chat');r.wrap.scrollIntoView({block:'center'});r.wrap.animate([{outline:'3px solid #6555a7'},{outline:'0 solid transparent'}],1200);}
function renderHearts(){const box=$('#hearts'), list=records.filter(r=>hearts.has(r.key)).reverse();box.replaceChildren(node('h2','하트 모아보기'),returnButton());if(!list.length)box.append(node('p','말풍선을 더블클릭하거나 ♡를 눌러 채팅을 모아보세요.'));for(const r of list){const row=node('div',null,'heart-row'), b=node('button',`${r.m.date} ${r.m.time} — ${display(r.m)||'사진'}`,'result'), del=node('button','♥');b.onclick=()=>jump(r);del.setAttribute('aria-label','하트 취소');del.onclick=()=>{toggleHeart(r);renderHearts();};row.append(b,del);box.append(row);}}
function endCapture(){captureMode=false;first=last=null;bar.hidden=true;for(const r of records)r.wrap.classList.remove('capture-selected');}
$('#capture').onclick=()=>{if(captureMode)return endCapture();if(!records.length)return;captureMode=true;updateCapture();};
function pick(r){if(first===null||last!==null){first=records.indexOf(r);last=null;}else last=records.indexOf(r);updateCapture();}
function updateCapture(){const low=Math.min(first,last??first),high=Math.max(first,last??first);records.forEach((r,i)=>r.wrap.classList.toggle('capture-selected',first!==null&&i>=low&&i<=high));const save=node('button','PNG 저장'),stop=node('button','취소');save.disabled=last===null;stop.onclick=endCapture;save.onclick=async()=>{save.disabled=true;try{await exportCapture(records.slice(low,high+1));}catch(e){alert(e.message);}finally{save.disabled=false;}};bar.replaceChildren(node('span',first===null?'시작 메시지를 선택하세요.':last===null?'끝 메시지를 선택하세요.':'선택한 메시지 '+(high-low+1)+'개'),save,stop);bar.hidden=false;}
async function exportCapture(rows){
 const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d'),width=660;
 function lines(text,font,max){ctx.font=font;return text.split('\n').flatMap(p=>{let line='',out=[];for(const char of p){if(line&&ctx.measureText(line+char).width>max){out.push(line);line='';}line+=char;}return [...out,line];});}
 let y=24;const cleanups=[],paint=[];let day='';
 try{for(const {m,author} of rows){
  if(day!==m.date){day=m.date;const at=y;paint.push(()=>{ctx.fillStyle='#434663';ctx.font='14px sans-serif';ctx.textAlign='center';ctx.fillText(dateLabel(m.date),width/2,at+16);ctx.textAlign='left';});y+=34;}
  const fan=m.from==='fan',x=fan?190:24,at=y,text=lines(display(m),'18px sans-serif',414), quote=m.replyTo?lines(m.replyTo,'14px sans-serif',414):[];
  let photo=null,w=0,h=0;
  if(m.image){try{const res=await fetch(m.image);if(!res.ok)throw Error();photo=await createImageBitmap(await res.blob());cleanups.push(photo);w=Math.min(414,photo.width,320*photo.width/photo.height);h=w*photo.height/photo.width;}catch{if(location.protocol==='file:'&&!m.image.startsWith('data:')){photo=new Image();photo.src=m.image;try{await photo.decode();w=Math.min(414,photo.naturalWidth,320*photo.naturalWidth/photo.naturalHeight);h=w*photo.naturalHeight/photo.naturalWidth;}catch{throw Error('사진을 불러오지 못했어요: '+m.image);}}else throw Error('사진을 불러오지 못했어요: '+m.image);}}
  const body=(quote.length?26+quote.length*19:0)+(m.text?text.length*25:0)+h+24;
  paint.push(()=>{ctx.fillStyle='#30354d';ctx.font='14px sans-serif';ctx.fillText(author+' · '+m.time,x,at+16);ctx.fillStyle=fan?'#6467bf':'#fff';ctx.beginPath();ctx.roundRect(x,at+24,446,body,15);ctx.fill();let t=at+45;if(quote.length){ctx.fillStyle='#555';ctx.font='14px sans-serif';ctx.fillText(author+'님의 답장',x+16,t);t+=20;for(const q of quote){ctx.fillText(q,x+16,t);t+=19;}t+=6;}ctx.fillStyle=fan?'#fff':'#171a2a';ctx.font='18px sans-serif';if(m.text)for(const l of text){ctx.fillText(l,x+16,t);t+=25;}if(photo)ctx.drawImage(photo,x+16,t-10,w,h);});
  y+=body+36;if(y>8000)throw Error('선택한 범위가 너무 길어요. 나눠서 캡처해 주세요.');
 }
 canvas.width=width;canvas.height=Math.ceil(y+12);ctx.fillStyle=getComputedStyle($('main')).backgroundColor;ctx.fillRect(0,0,width,canvas.height);paint.forEach(f=>f());
 const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw Error('이미지를 저장하지 못했어요.');
 const url=URL.createObjectURL(blob),a=node('a');a.href=url;a.download=`sponge-pop-${rows[0].m.date}-${rows[0].m.time.replace(':','')}.png`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
 }catch(e){if(e.name==='SecurityError')throw Error('로컬 사진의 캡처가 브라우저에서 제한됐어요. 배포된 페이지에서 다시 시도해 주세요.');throw e;}finally{for(const bitmap of cleanups)bitmap.close();}
}
