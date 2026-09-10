const root=document.documentElement;
const theme=document.querySelector<HTMLSelectElement>('#theme')!;
const systemTheme=matchMedia('(prefers-color-scheme:dark)');
const reduced=matchMedia('(prefers-reduced-motion:reduce)');
let preference=root.dataset.preference||'system';
let motionOff=false;
const applyTheme=()=>{root.dataset.theme=preference==='system'?(systemTheme.matches?'dark':'light'):preference;theme.value=preference;};
applyTheme();
theme.addEventListener('change',()=>{preference=theme.value;applyTheme();try{localStorage.setItem('invest-theme',preference)}catch{}});
systemTheme.addEventListener('change',()=>{if(preference==='system')applyTheme()});
const canMove=()=>!reduced.matches&&!motionOff;
const scenes=Array.from(document.querySelectorAll<HTMLElement>('.scene'));
const controls=document.querySelector<HTMLElement>('.show-controls')!;
const start=document.querySelector<HTMLButtonElement>('#start-show')!;
const end=document.querySelector<HTMLButtonElement>('#end-show')!;
const prev=document.querySelector<HTMLButtonElement>('#prev-scene')!;
const next=document.querySelector<HTMLButtonElement>('#next-scene')!;
const full=document.querySelector<HTMLButtonElement>('#full-screen')!;
const motion=document.querySelector<HTMLButtonElement>('#motion-toggle')!;
const count=document.querySelector<HTMLElement>('#scene-count')!;
const progress=document.querySelector<HTMLElement>('.reading-progress span')!;
let presenting=false;
let current=0;
start.hidden=false;
function stopAnimations(){document.getAnimations().forEach(a=>a.cancel());}
function updateMotion(){root.dataset.motion=motionOff?'off':'on';motion.setAttribute('aria-pressed',String(motionOff));motion.textContent=motionOff?'Без движения':'Движение';if(!canMove())stopAnimations();}
reduced.addEventListener('change',updateMotion);
motion.addEventListener('click',()=>{motionOff=!motionOff;updateMotion()});
function renderScene(index:number,changeHash=true){
 current=Math.min(scenes.length-1,Math.max(0,index));
 scenes.forEach((s,i)=>s.classList.toggle('active-scene',i===current));
 count.textContent=`${current+1} / ${scenes.length}`;
 count.setAttribute('aria-label',`Сцена ${current+1} из ${scenes.length}: ${scenes[current].dataset.title}`);
 prev.disabled=current===0;next.disabled=current===scenes.length-1;
 if(changeHash)history.replaceState(null,'',`#${scenes[current].id}`);
 window.scrollTo({top:0,behavior:'instant'});
 if(canMove())scenes[current].animate([{transform:'translateY(12px)'},{transform:'translateY(0)'}],{duration:320,easing:'cubic-bezier(.2,0,0,1)'});
}
function begin(){
 const hash=document.getElementById(location.hash.slice(1));
 const s=hash?.closest<HTMLElement>('.scene');
 if(s)current=scenes.indexOf(s);
 else {const offsets=scenes.map(s=>Math.abs(s.getBoundingClientRect().top-84));current=offsets.indexOf(Math.min(...offsets));}
 presenting=true;document.body.classList.add('presenting');controls.hidden=false;start.setAttribute('aria-pressed','true');start.textContent='Режим показа';renderScene(current);next.focus({preventScroll:true});
}
async function finish(focus=true){
 if(!presenting)return;
 const active=scenes[current];presenting=false;document.body.classList.remove('presenting');controls.hidden=true;scenes.forEach(s=>s.classList.remove('active-scene'));start.setAttribute('aria-pressed','false');start.textContent='Начать показ ↗';
 if(document.fullscreenElement)try{await document.exitFullscreen()}catch{}
 active.scrollIntoView({behavior:'instant',block:'start'});if(focus)start.focus({preventScroll:true});
}
start.addEventListener('click',()=>presenting?finish():begin());end.addEventListener('click',()=>finish());prev.addEventListener('click',()=>renderScene(current-1));next.addEventListener('click',()=>renderScene(current+1));
full.addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await root.requestFullscreen()}catch{full.hidden=true;}});
if(!document.fullscreenEnabled)full.hidden=true;
document.addEventListener('fullscreenchange',()=>full.setAttribute('aria-pressed',String(!!document.fullscreenElement)));
document.addEventListener('keydown',e=>{
 if(!presenting||e.altKey||e.ctrlKey||e.metaKey)return;
 if(e.key==='Escape'){e.preventDefault();void finish();return;}
 if((e.target as HTMLElement).closest('select,input,textarea,[contenteditable=true]'))return;
 if(['ArrowRight','ArrowDown','PageDown'].includes(e.key)){e.preventDefault();renderScene(current+1)}
 if(['ArrowLeft','ArrowUp','PageUp'].includes(e.key)){e.preventDefault();renderScene(current-1)}
 if(e.key==='Home'){e.preventDefault();renderScene(0)}
 if(e.key==='End'){e.preventDefault();renderScene(scenes.length-1)}
});
function openDetailsFor(target:HTMLElement){let parent=target.parentElement;while(parent){if(parent instanceof HTMLDetailsElement)parent.open=true;parent=parent.parentElement;}}
document.addEventListener('click',async e=>{
 const link=(e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');if(!link)return;
 const target=document.getElementById(link.hash.slice(1));if(!target)return;
 const scene=target.closest<HTMLElement>('.scene');
 if(presenting&&scene){e.preventDefault();renderScene(scenes.indexOf(scene));return;}
 if(target.closest('.sources')){e.preventDefault();if(presenting)await finish(false);openDetailsFor(target);history.replaceState(null,'',link.hash);target.scrollIntoView({behavior:canMove()?'smooth':'instant'});target.setAttribute('tabindex','-1');target.focus({preventScroll:true});}
});
const initial=document.getElementById(location.hash.slice(1));if(initial){openDetailsFor(initial);requestAnimationFrame(()=>initial.scrollIntoView({behavior:'instant'}));}
const seen=new WeakSet<Element>();
if('IntersectionObserver' in window){
 const observer=new IntersectionObserver(entries=>{for(const entry of entries){if(!entry.isIntersecting||seen.has(entry.target))continue;seen.add(entry.target);observer.unobserve(entry.target);if(!canMove()||presenting)continue;
 const el=entry.target as HTMLElement;
 el.animate([{opacity:.55,transform:'translateY(16px)'},{opacity:1,transform:'translateY(0)'}],{duration:420,easing:'cubic-bezier(.2,0,0,1)'});
 if(el.classList.contains('target-row')){const path=el.querySelector<SVGPathElement>('path');if(path){const length=path.getTotalLength();path.animate([{strokeDasharray:`${length}`,strokeDashoffset:length},{strokeDasharray:`${length}`,strokeDashoffset:0}],{duration:650,easing:'cubic-bezier(.2,0,0,1)'});}}
 }},{threshold:.12});document.querySelectorAll('[data-reveal]').forEach(el=>observer.observe(el));
}
let frame=false;
function updateScroll(){frame=false;if(presenting)return;const max=root.scrollHeight-innerHeight;progress.style.transform=`scaleX(${max>0?Math.min(1,scrollY/max):0})`;const chapters=['story','product','investment','targets'];let active='';for(const id of chapters){const el=document.getElementById(id);if(el&&el.getBoundingClientRect().top<innerHeight*.45)active=id;}
 document.querySelectorAll<HTMLAnchorElement>('.main-nav a').forEach(a=>{if(a.hash==='#'+active)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current')});}
addEventListener('scroll',()=>{if(!frame){frame=true;requestAnimationFrame(updateScroll)}},{passive:true});updateScroll();
