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

function tab(id){$('#composer').hidden=id!=='chat';for(const key of ['chat','dates','photos','search'])$('#'+key).hidden=key!==id; for(const b of document.querySelectorAll('[data-tab]'))b.setAttribute('aria-current',String(b.dataset.tab===id)); if(id==='dates')renderCalendar();if(id==='search'){showResults();$('#query').focus();}window.scrollTo(0,0);}

function picture(m){const b=node('button',null,'photo'), im=node('img');im.src=m.image;im.alt=m.alt||'채팅 이미지';b.append(im);b.onclick=()=>{const large=$('#large');large.src=m.image;large.alt=im.alt;$('#caption').textContent=dateLabel(m.date)+' · '+m.time;viewer.showModal();};return b;}

function render(){
  const chat=$('#chat'), photos=$('#photos'), gallery=node('div',null,'gallery-days'), recent=$('#recent-photos');
  chat.replaceChildren();
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
      stack.append(bubble);
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
function showResults(){const q=$('#query').value.trim().toLocaleLowerCase(), out=$('#results');out.replaceChildren();if(!q){out.append(node('p','검색어를 입력해 주세요.'));return;}for(const [date,rows] of groups){for(const m of rows){const text=m.text?.replaceAll('{{name}}',()=>nickname);if(!text?.toLocaleLowerCase().includes(q))continue;const b=node('button',`${dateLabel(date)} · ${m.time} — ${text}`,'result');b.onclick=()=>go(date);out.append(b);}}if(!out.childElementCount)out.append(node('p','일치하는 메시지가 없어요.'));}

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