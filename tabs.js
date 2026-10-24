(function(){'use strict';
 const pages=['normal','limited','background'];
 const tabs=pages.map(p=>document.getElementById('tab-'+p));
 function show(page,focus=false){if(!pages.includes(page))page='background';for(const p of pages){const active=p===page,button=document.getElementById('tab-'+p);button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1;document.getElementById('panel-'+p).hidden=!active;}if(focus)document.getElementById('tab-'+page).focus();document.title=({normal:'通常',limited:'限定',background:'背景'})[page]+'｜ポケモンコレクション';}
 function fromHash(){show(location.hash.slice(1));}
 for(const [i,tab] of tabs.entries()){
  tab.addEventListener('click',()=>{const page=pages[i];show(page);if(location.hash!=='#'+page)history.pushState(null,'','#'+page);});
  tab.addEventListener('keydown',e=>{let next;if(e.key==='ArrowRight')next=(i+1)%pages.length;else if(e.key==='ArrowLeft')next=(i+pages.length-1)%pages.length;else if(e.key==='Home')next=0;else if(e.key==='End')next=pages.length-1;else return;e.preventDefault();show(pages[next],true);history.pushState(null,'','#'+pages[next]);});
 }
 window.addEventListener('hashchange',fromHash);window.addEventListener('popstate',fromHash);fromHash();
})();
