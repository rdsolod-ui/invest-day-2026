const root=document.documentElement;
const theme=document.querySelector<HTMLSelectElement>('#theme')!;
const systemTheme=matchMedia('(prefers-color-scheme:dark)');
const reduced=matchMedia('(prefers-reduced-motion:reduce)');
let preference=root.dataset.preference||'system';
let motionOff=false;
const applyTheme=()=>{root.dataset.theme=preference==='system'?(systemTheme.matches?'dark':'light'):preference;theme.value=preference;};
applyTheme();theme.addEventListener('change',()=>{preference=theme.value;applyTheme();try{localStorage.setItem('invest-theme',preference)}catch{}});systemTheme.addEventListener('change',()=>{if(preference==='system')applyTheme()});
const canMove=()=>!reduced.matches&&!motionOff&&!document.hidden;
const scenes=Array.from(document.querySelectorAll<HTMLElement>('.scene'));
const shells=scenes.map(s=>s.parentElement!);
const controls=document.querySelector<HTMLElement>('.show-controls')!;
const start=document.querySelector<HTMLButtonElement>('#start-show')!;
const prev=document.querySelector<HTMLButtonElement>('#prev-scene')!;
const next=document.querySelector<HTMLButtonElement>('#next-scene')!;
const full=document.querySelector<HTMLButtonElement>('#full-screen')!;
const motion=document.querySelector<HTMLButtonElement>('#motion-toggle')!;
const count=document.querySelector<HTMLElement>('#scene-count')!;
const progress=document.querySelector<HTMLElement>('.reading-progress span')!;
let presenting=false,current=0;
start.hidden=false;
function resizeStage(){const scale=Math.min(innerWidth/1920,Math.max(1,innerHeight-(presenting?0:72))/1080);root.style.setProperty('--stage-scale',String(scale));root.style.setProperty('--stage-height',`${1080*scale}px`);}
resizeStage();addEventListener('resize',resizeStage);
const visible=new Set<HTMLElement>();
const sceneAnimations=new Map<HTMLElement,Animation[]>();
function animateScene(scene:HTMLElement){
 sceneAnimations.get(scene)?.forEach(a=>a.cancel());const list:Animation[]=[];sceneAnimations.set(scene,list);if(!canMove())return;
 const elements=scene.querySelectorAll<HTMLElement>('[data-reveal]');elements.forEach((el,i)=>{list.push(el.animate([{opacity:.15,transform:'translateY(38px)'},{opacity:1,transform:'translateY(0)'}],{duration:780,delay:Math.min(i*95,475),easing:'cubic-bezier(.16,1,.3,1)'}));});
 scene.querySelectorAll<SVGRectElement>('.bar').forEach((bar,i)=>{list.push(bar.animate([{transform:'scaleX(.04)'},{transform:'scaleX(1)'}],{duration:1100,delay:200+i*110,easing:'cubic-bezier(.16,1,.3,1)'}));bar.style.transformOrigin='94px center';});
 scene.querySelectorAll<HTMLElement>('[data-grow]').forEach((el,i)=>list.push(el.animate([{transform:'scaleY(0)'},{transform:'scaleY(1)'}],{duration:1100,delay:150+i*110,fill:'backwards',easing:'cubic-bezier(.16,1,.3,1)'})));
 const flows=Array.from(scene.querySelectorAll<HTMLElement>('[data-flow]'));flows.forEach((el,i)=>{list.push(el.animate([{opacity:0},{opacity:1}],{duration:700,delay:i*650,fill:'backwards',easing:'ease-out'}));list.push(el.animate([{filter:'brightness(1)'},{filter:'brightness(1.12)'},{filter:'brightness(1)'}],{duration:7000,delay:1400+i*850,iterations:Infinity,easing:'ease-in-out'}));});
 scene.querySelectorAll<SVGPathElement>('[data-area]').forEach((el,i)=>list.push(el.animate([{opacity:0},{opacity:1}],{duration:1100,delay:300+i*180,fill:'backwards',easing:'ease-out'})));
 scene.querySelectorAll<SVGPathElement>('[data-draw]').forEach(path=>{const length=path.getTotalLength();list.push(path.animate([{strokeDasharray:`${length}`,strokeDashoffset:length},{strokeDasharray:`${length}`,strokeDashoffset:0}],{duration:1800,easing:'ease-out'}));});
 const photo=scene.querySelector<HTMLElement>('.hero-background,.story-photo img,.lead-photo img,.execution-photo img,.closing-background,.speaker-photo img,.night-case-photo img');if(photo)list.push(photo.animate([{transform:'scale(1.06)'},{transform:'scale(1)'}],{duration:9500,easing:'cubic-bezier(.2,0,.4,1)'}));
}
function toggleChrome(force?:boolean){const hidden=force??!controls.classList.contains('controls-hidden');controls.classList.toggle('controls-hidden',hidden);controls.inert=hidden;if(hidden&&(document.activeElement instanceof HTMLElement))document.activeElement.blur();}
document.querySelector('#hide-controls')!.addEventListener('click',()=>toggleChrome(true));
function renderScene(index:number,changeHash=true){
 current=Math.min(scenes.length-1,Math.max(0,index));
 scenes.forEach((s,i)=>s.classList.toggle('active-scene',i===current));shells.forEach((s,i)=>s.classList.toggle('active-shell',i===current));
 count.textContent=`${current+1} / ${scenes.length}`;count.setAttribute('aria-label',`Сцена ${current+1} из ${scenes.length}: ${scenes[current].dataset.title}`);
 prev.disabled=current===0;next.disabled=current===scenes.length-1;
 if(changeHash)history.replaceState(null,'',`#${scenes[current].id}`);
 window.scrollTo({top:0,behavior:'instant'});resizeStage();
 visible.clear();visible.add(scenes[current]);for(const [s,list] of sceneAnimations)if(s!==scenes[current])list.forEach(a=>a.cancel());animateScene(scenes[current]);syncLoops(true);
}
async function begin(){start.disabled=true;start.textContent='Готовлю показ…';const photos=Array.from(document.querySelectorAll<HTMLImageElement>('.scene img'));photos.forEach(img=>img.loading='eager');await Promise.all(photos.map(img=>img.decode().catch(()=>{})));start.disabled=false;start.textContent='Начать показ ↗';const s=document.getElementById(location.hash.slice(1))?.closest<HTMLElement>('.scene');if(s)current=scenes.indexOf(s);else{const offsets=shells.map(s=>Math.abs(s.getBoundingClientRect().top-72));current=offsets.indexOf(Math.min(...offsets));}presenting=true;document.body.classList.add('presenting');controls.hidden=false;toggleChrome(false);start.setAttribute('aria-pressed','true');renderScene(current);next.focus({preventScroll:true});}
async function finish(){if(!presenting)return;presenting=false;document.body.classList.remove('presenting');controls.hidden=true;toggleChrome(false);shells.forEach(s=>s.classList.remove('active-shell'));scenes.forEach(s=>s.classList.remove('active-scene'));resizeStage();start.setAttribute('aria-pressed','false');if(document.fullscreenElement)try{await document.exitFullscreen()}catch{}shells[current].scrollIntoView({behavior:'instant',block:'start'});start.focus({preventScroll:true});}
start.addEventListener('click',begin);document.querySelector('#end-show')!.addEventListener('click',()=>void finish());prev.addEventListener('click',()=>renderScene(current-1));next.addEventListener('click',()=>renderScene(current+1));
full.addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await root.requestFullscreen()}catch{full.hidden=true;}});if(!document.fullscreenEnabled)full.hidden=true;document.addEventListener('fullscreenchange',()=>{full.setAttribute('aria-pressed',String(!!document.fullscreenElement));resizeStage();});
document.addEventListener('keydown',e=>{if(!presenting||e.altKey||e.ctrlKey||e.metaKey)return;if(e.key==='Escape'){e.preventDefault();void finish();return;}if((e.target as HTMLElement).closest('select,input,textarea,[contenteditable=true]'))return;if(e.key.toLowerCase()==='h'||e.key.toLowerCase()==='р'){e.preventDefault();toggleChrome();return;}if(['ArrowRight','ArrowDown','PageDown',' '].includes(e.key)&&!(e.key===' '&&(e.target as HTMLElement).closest('button'))){e.preventDefault();renderScene(current+1)}if(['ArrowLeft','ArrowUp','PageUp'].includes(e.key)){e.preventDefault();renderScene(current-1)}if(e.key==='Home'){e.preventDefault();renderScene(0)}if(e.key==='End'){e.preventDefault();renderScene(scenes.length-1)}});
document.addEventListener('click',e=>{const link=(e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');if(!link)return;const scene=document.getElementById(link.hash.slice(1))?.closest<HTMLElement>('.scene');if(presenting&&scene){e.preventDefault();renderScene(scenes.indexOf(scene));}});
// Each looping story has explicit pause/resume and freezes on manual milestone selection.
type Loop={name:string;scene:HTMLElement;size:number;index:number;paused:boolean;timer:ReturnType<typeof setTimeout>|null;animations:Animation[];step:(i:number,animate:boolean)=>void;duration:number};
const clip=document.querySelector<SVGRectElement>('#history-reveal')!;
const historyLoop:Loop={name:'history',scene:document.querySelector('#baseline')!,size:6,index:0,paused:false,timer:null,animations:[],duration:3200,step(i,animate){
 document.querySelectorAll<HTMLElement>('[data-history-hint]').forEach((el,j)=>el.classList.toggle('selected',i===j));document.querySelectorAll('[data-point]').forEach((el,j)=>el.classList.toggle('selected',i===j));document.querySelectorAll('[data-history-year]').forEach((el,j)=>el.setAttribute('aria-pressed',String(i===j)));
 const target=animate?Math.min(1200,110+i*204):1200;const from=parseFloat(clip.style.width)||1200;clip.style.width=`${target}px`;if(animate){this.animations.push(clip.animate([{width:`${i===0?110:from}px`},{width:`${target}px`}],{duration:850,easing:'cubic-bezier(.16,1,.3,1)'}));const hint=document.querySelector<HTMLElement>('.history-hint.selected')!;this.animations.push(hint.animate([{opacity:.2,transform:'translateY(15px)'},{opacity:1,transform:'translateY(0)'}],{duration:400,easing:'cubic-bezier(.16,1,.3,1)'}));const track=document.querySelector('.cycle-track span')!;this.animations.push(track.animate([{transform:'scaleX(0)'},{transform:'scaleX(1)'}],{duration:this.duration,easing:'linear'}));}
}};
const calendarLoop:Loop={name:'calendar',scene:document.querySelector('#targets')!,size:4,index:0,paused:false,timer:null,animations:[],duration:4800,step(i,animate){document.querySelectorAll<HTMLElement>('[data-event]').forEach((el,j)=>{el.classList.toggle('selected',i===j);el.setAttribute('aria-pressed',String(i===j));});document.querySelectorAll<HTMLElement>('[data-event-hint]').forEach((el,j)=>el.hidden=i!==j);if(animate){const line=document.querySelector('.event-card.selected .event-progress')!;this.animations.push(line.animate([{transform:'scaleX(0)'},{transform:'scaleX(1)'}],{duration:this.duration,easing:'linear'}));const hint=document.querySelector('.calendar-hint')!;this.animations.push(hint.animate([{transform:'translateY(10px)',opacity:.5},{transform:'translateY(0)',opacity:1}],{duration:350,easing:'cubic-bezier(.16,1,.3,1)'}));}}};
const loops=[historyLoop,calendarLoop];
function stopLoop(loop:Loop){if(loop.timer)clearTimeout(loop.timer);loop.timer=null;loop.animations.forEach(a=>a.cancel());loop.animations=[];}
function runLoop(loop:Loop){stopLoop(loop);if(!canMove()||loop.paused||!visible.has(loop.scene))return;loop.step(loop.index,true);loop.timer=setTimeout(()=>{loop.index=(loop.index+1)%loop.size;runLoop(loop)},loop.duration);}
function syncLoops(restart=false){loops.forEach(loop=>{stopLoop(loop);if(!canMove()){loop.step(loop.index,false);return;}if(visible.has(loop.scene)&&!loop.paused){if(restart)loop.index=0;runLoop(loop);}});}
function syncPauseButton(loop:Loop){const button=document.querySelector<HTMLButtonElement>(`[data-loop="${loop.name}"]`)!;button.setAttribute('aria-pressed',String(loop.paused));button.setAttribute('aria-label',`${loop.paused?'Продолжить':'Приостановить'} анимацию ${loop.name==='history'?'графика':'календаря'}`);button.textContent=loop.paused?'▶':'Ⅱ';}
loops.forEach(loop=>document.querySelector(`[data-loop="${loop.name}"]`)!.addEventListener('click',()=>{loop.paused=!loop.paused;syncPauseButton(loop);if(loop.paused)stopLoop(loop);else runLoop(loop);}));
function selectMilestone(loop:Loop,i:number){loop.paused=true;loop.index=i;stopLoop(loop);loop.step(i,false);syncPauseButton(loop);}
document.querySelectorAll<HTMLElement>('[data-history-year]').forEach((el,i)=>{el.addEventListener('click',()=>selectMilestone(historyLoop,i));el.addEventListener('focus',()=>selectMilestone(historyLoop,i));el.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse')selectMilestone(historyLoop,i);});});
document.querySelectorAll<HTMLElement>('[data-event]').forEach((el,i)=>{el.addEventListener('click',()=>selectMilestone(calendarLoop,i));el.addEventListener('focus',()=>selectMilestone(calendarLoop,i));el.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse')selectMilestone(calendarLoop,i);});});
function updateMotion(){root.dataset.motion=canMove()?'on':'off';motion.setAttribute('aria-pressed',String(motionOff));motion.textContent=motionOff?'Без движения':'Движение';if(!canMove())for(const list of sceneAnimations.values())list.forEach(a=>a.cancel());syncLoops();}
reduced.addEventListener('change',updateMotion);document.addEventListener('visibilitychange',updateMotion);motion.addEventListener('click',()=>{motionOff=!motionOff;updateMotion()});updateMotion();
const observer=new IntersectionObserver(entries=>{if(presenting)return;for(const entry of entries){const scene=(entry.target as HTMLElement).querySelector<HTMLElement>('.scene')!;if(entry.isIntersecting){if(!visible.has(scene)){visible.add(scene);animateScene(scene);loops.filter(l=>l.scene===scene).forEach(l=>{l.index=0;runLoop(l);});}}else{visible.delete(scene);sceneAnimations.get(scene)?.forEach(a=>a.cancel());loops.filter(l=>l.scene===scene).forEach(stopLoop);}}},{threshold:.35});shells.forEach(s=>observer.observe(s));
let frame=false;function updateScroll(){frame=false;if(presenting)return;const max=root.scrollHeight-innerHeight;progress.style.transform=`scaleX(${max>0?Math.min(1,scrollY/max):0})`;let active='';for(const id of ['story','product','investment','targets'])if(document.getElementById(id)!.getBoundingClientRect().top<innerHeight*.45)active=id;document.querySelectorAll<HTMLAnchorElement>('.main-nav a').forEach(a=>{if(a.hash==='#'+active)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current')});}addEventListener('scroll',()=>{if(!frame){frame=true;requestAnimationFrame(updateScroll)}},{passive:true});updateScroll();
const initial=document.getElementById(location.hash.slice(1));if(initial)requestAnimationFrame(()=>initial.parentElement?.scrollIntoView({behavior:'instant'}));
