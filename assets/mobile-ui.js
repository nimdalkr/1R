/* 1R v1.3 — mobile canvas-first sheets and bottom tool dock. */
'use strict';
(()=>{
 const dock=document.querySelector('.mobile-dock'),side=document.querySelector('.side'),props=document.querySelector('.props');if(!dock||!side||!props)return;
 const mq=matchMedia('(max-width: 650px)');let openSheet=null;
 [side,props].forEach(sheet=>{const close=document.createElement('button');close.className='mobile-sheet-close';close.type='button';close.setAttribute('aria-label','패널 닫기');close.textContent='×';sheet.querySelector('.pad')?.prepend(close);close.onclick=()=>closeSheets();});
 function buttons(){return [...dock.querySelectorAll('[data-mobile]')];}
 function closeSheets(){side.classList.remove('mobile-open');props.classList.remove('mobile-open');buttons().forEach(b=>b.classList.remove('active'));openSheet=null;}
 function open(sheet,button,focusSelector){const same=openSheet===sheet;if(same){closeSheets();return;}closeSheets();sheet.classList.add('mobile-open');button.classList.add('active');openSheet=sheet;requestAnimationFrame(()=>{const el=sheet.querySelector(focusSelector);if(el)el.scrollIntoView({block:'start',behavior:'smooth'});});}
 dock.addEventListener('click',e=>{const b=e.target.closest('[data-mobile]');if(!b)return;const action=b.dataset.mobile;
  if(action==='structure'){open(side,b,'.title');return;}
  if(action==='furniture'){open(props,b,'.catalog');return;}
  if(action==='props'){open(props,b,'#propTitle');return;}
  if(action==='view'){closeSheets();const in3d=document.querySelector('#v3')?.classList.contains('active');document.querySelector(in3d?'#v2':'#v3')?.click();b.querySelector('b').textContent=in3d?'3D':'평면';return;}
 });
 document.addEventListener('keydown',e=>{if(e.key==='Escape')closeSheets();});
 document.querySelector('.workspace')?.addEventListener('pointerdown',()=>{if(mq.matches&&openSheet)closeSheets();},{capture:true});
 mq.addEventListener?.('change',()=>{if(!mq.matches)closeSheets();});
})();
