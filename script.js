/* ---------- UTIL ---------- */
const esc = s => s.replace(/[\\^$.*+?()[\]{}|]/g,'\\$&');
const $   = id => document.getElementById(id);

/* ---------- ELEMENT REFS ---------- */
const themeBtn  = $('themeToggle');
const excludeBtn= $('exclude');
const add2Btn   = $('add2');
const convertBtn= $('convert');
const clearBtn  = $('clear');
const copyBtn   = $('copy');
const infoBtn   = $('info');

const splitNew  = $('splitNewline');
const caseSens  = $('caseSensitive');
const formatSel = $('format');

const input1    = $('input1');
const output1   = $('output1');
const secondWrap= $('secondWrap');
let   input2, output2;

const infoModal = $('infoModal');
const infoBody  = $('infoBody');
['closeInfo','infoBackdrop'].forEach(id=>$(id).onclick=()=>infoModal.style.display='none');

const excludeModal=$('excludeModal');
['closeExclude','excludeBackdrop'].forEach(id=>$(id).onclick=()=>excludeModal.style.display='none');
const charGrid=$('charGrid');
const customCharsInp=$('customChars');
const applyExcBtn=$('applyExclude');
const copy2Btn = $('copy2');

/* ---------- BUILD CHAR GRID ---------- */
',.;:-_()[]{}<>/\\\'"'.split('').forEach(ch=>{
  const label=document.createElement('label');
  label.innerHTML=`<input type="checkbox" value="${ch}"><span>${ch}</span>`;
  charGrid.appendChild(label);
});

/* ---------- EXCLUSION SET ---------- */
let excludeSet=new Set();
function refreshExcludeSet(){
  excludeSet=new Set();
  charGrid.querySelectorAll('input:checked').forEach(cb=>excludeSet.add(cb.value));
  customCharsInp.value.split('').forEach(c=>c && excludeSet.add(c));
}

/* ---------- THEME TOGGLE ---------- */
themeBtn.onclick=()=>{
  const dark=document.documentElement.dataset.theme==='dark';
  document.documentElement.dataset.theme=dark?'':'dark';
  localStorage.setItem('theme', dark?'light':'dark');
  themeBtn.classList.add('wiggle');
  setTimeout(()=>themeBtn.classList.remove('wiggle'),400);
};

/* ---------- ADD 2ND LIST ---------- */
add2Btn.onclick=()=>{
  secondWrap.style.display='block';
  add2Btn.style.display='none';
  input2 = $('input2');
  output2= $('output2');
};

/* ---------- STATS BUILDERS ---------- */
function buildStats(counts){
  const uniq=Object.keys(counts).sort((a,b)=>a.localeCompare(b));
  const dupList=uniq.filter(k=>counts[k]>1).map(k=>`${k} (${counts[k]})`);
  const dupes = dupList.reduce((n,s)=>n+ +s.match(/\((\d+)\)/)[1],0)-dupList.length;
  const lenMax=Math.max(...uniq.map(s=>s.length),0);
  return{uniq,counts,total:Object.values(counts).reduce((a,b)=>a+b,0),
         unique:uniq.length,dupList,dupes,lenMax};
}

function process(text){
  if(excludeSet.size){
    text=text.replace(new RegExp('['+Array.from(excludeSet).map(esc).join('')+']','g'),'');
  }
  let parts=splitNew.checked?text.split(/\r?\n/):text.trim().split(/\s+/);
  parts=parts.map(s=>s.trim()).filter(Boolean);
  const counts={};
  parts.forEach(t=>{
    const key=caseSens.checked?t:t.toUpperCase();
    counts[key]=(counts[key]||0)+1;
  });
  return buildStats(counts);
}

/* ---------- EASTER EGG ---------- */
function shouldRain(txt){
  return txt.trim().toLowerCase()==='make it rain';
}
function makeItRain(){
  const pets=['🐱','🐶'];
  for(let i=0;i<35;i++){
    const span=document.createElement('span');
    span.className='rain-emoji';
    span.textContent=pets[Math.random()<.5?0:1];
    span.style.left=Math.random()*100+'vw';
    span.style.fontSize=(1+Math.random()*1.4)+'rem';
    span.style.animationDuration=(3+Math.random()*2)+'s';
    document.body.appendChild(span);
    span.addEventListener('animationend',()=>span.remove());
  }
}

/* ---------- GLOBAL STATE ---------- */
let stats1=null, stats2=null;

/* ---------- CONVERT ---------- */
convertBtn.onclick=()=>{
  refreshExcludeSet();

  if(shouldRain(input1.value)) makeItRain();

  stats1=process(input1.value);
  output1.value={
    comma    : stats1.uniq.join(', '),
    defq     : "('"+stats1.uniq.join("', '")+"')",
    defqNoQ  : '('+stats1.uniq.join(', ')+')',
    qb       : stats1.uniq.join(' | ')
  }[formatSel.value];

  if(secondWrap.style.display==='block'){
    stats2=process(input2.value);
    output2.value={
      comma    : stats2.uniq.join(', '),
      defq     : "('"+stats2.uniq.join("', '")+"')",
      defqNoQ  : '('+stats2.uniq.join(', ')+')',
      qb       : stats2.uniq.join(' | ')
    }[formatSel.value];
  }else{
    stats2=null;
    if(output2) output2.value='';
  }
};

/* ---------- CLEAR ---------- */
clearBtn.onclick=()=>{
  input1.value='';output1.value='';stats1=null;
  if(stats2){input2.value='';output2.value='';stats2=null;}
  input1.focus();
};

/* ---------- COPY ---------- */
copyBtn.onclick=async()=>{
  if(!output1.value) return;
  try{await navigator.clipboard.writeText(output1.value);}
  catch{output1.select();document.execCommand('copy');}
  confetti({spread:70,origin:{y:.65}});
  copyBtn.classList.add('copied');copyBtn.textContent='✅ Copied!';
  setTimeout(()=>{copyBtn.classList.remove('copied');copyBtn.textContent='📋 Copy Result';},1500);
};

copy2Btn.onclick = async() => {
  if(!output2.value) return;
  try {
    await navigator.clipboard.writeText(output2.value);
  } catch {
    output2.select();
    document.execCommand('copy');
  }
  confetti({spread:70, origin:{y:.8}}); // Different y position for second button
  copy2Btn.classList.add('copied');
  copy2Btn.textContent='✅ Copied!';
  setTimeout(()=>{
    copy2Btn.classList.remove('copied');
    copy2Btn.textContent='📋 Copy Result 2';
  }, 1500);
};

/* ---------- INFO MODAL ---------- */
infoBtn.onclick=()=>{
  if(!stats1){
    infoBody.textContent='No data yet. Convert first!';
  }else if(!stats2){
    infoBody.textContent=
`Total values entered : ${stats1.total}
Unique values kept    : ${stats1.unique}
Duplicates removed    : ${stats1.dupes}${stats1.dupes?'\n  → '+stats1.dupList.join(', '):''}

Longest token length  : ${stats1.lenMax}`;
  }else{
    const set1=new Set(stats1.uniq), set2=new Set(stats2.uniq);
    const matches=[...set1].filter(x=>set2.has(x));
    const only1=[...set1].filter(x=>!set2.has(x));
    const only2=[...set2].filter(x=>!set1.has(x));
    infoBody.textContent=
`— List 1 —
Total entries         : ${stats1.total}
Unique values kept    : ${stats1.unique}

— List 2 —
Total entries         : ${stats2.total}
Unique values kept    : ${stats2.unique}

=========== Comparison ===========
Matching values (${matches.length}) :
${matches.join(', ') || '(none)'}

Only in List 1 (${only1.length}) :
${only1.join(', ') || '(none)'}

Only in List 2 (${only2.length}) :
${only2.join(', ') || '(none)'}`;
  }
  infoModal.style.display='flex';
};

/* ---------- EXCLUDE MODAL ---------- */
excludeBtn.onclick=()=>excludeModal.style.display='flex';
applyExcBtn.onclick=()=>{refreshExcludeSet();excludeModal.style.display='none';};

/* ---------- VIDEO BUTTON ---------- */
const videoBtn = $('videoButton');
videoBtn.onclick = () => {
  window.open('https://bcgov.sharepoint.com/:v:/r/sites/FOR-BCTSGIS/SIGG%20Document%20Library/Videos/LRM%20Tips%20and%20Tricks/List%20Genie%20v2.mp4?csf=1&web=1&nav=eyJyZWZlcnJhbEluZm8iOnsicmVmZXJyYWxBcHAiOiJTdHJlYW1XZWJBcHAiLCJyZWZlcnJhbFZpZXciOiJTaGFyZURpYWxvZy1MaW5rIiwicmVmZXJyYWxBcHBQbGF0Zm9ybSI6IldlYiIsInJlZmVycmFsTW9kZSI6InZpZXcifX0%3D&e=rHyFa8', '_blank');
};

/* ---------- HELP MODAL ---------- */
const helpBtn   = $('helpButton');
const helpModal = $('helpModal');
['closeHelp','helpBackdrop'].forEach(id=>$(id).onclick=()=>helpModal.style.display='none');
helpBtn.onclick=()=>helpModal.style.display='flex';
