(function(root){'use strict';
const keys=['shiny','shiny_lucky','shiny_bg_lucky','trade_pending'];
const labels={shiny:'色違い',shiny_lucky:'色キラ',shiny_bg_lucky:'色背景キラ',trade_pending:'交換待ち'};
const key=(e,t)=>e.id+'|||'+t;
function visibleEntries(entries){return entries.filter(e=>e.category==='costume'&&!e.hiddenMiddle);}
function available(e,t){if(t==='trade_pending')return true;if(!e.shiny)return false;return t!=='shiny_bg_lucky'||e.backgroundStatus==='yes';}
function isOwned(e,checks){return keys.slice(0,3).some(t=>available(e,t)&&!!checks[key(e,t)]);}
function progress(entries,checks){return {owned:entries.filter(e=>isOwned(e,checks)).length,total:entries.length,waiting:entries.filter(e=>checks[key(e,'trade_pending')]).length};}
function restore(raw){const checks={};if(raw&&raw.checks&&typeof raw.checks==='object'&&!Array.isArray(raw.checks))for(const [k,v] of Object.entries(raw.checks))if(typeof v==='boolean'&&k.startsWith('limited:')&&keys.some(t=>k.endsWith('|||'+t)))checks[k]=v;return {version:1,collection:'limited',checks};}
function csv(entries,checks){const cell=x=>'"'+String(x??'').replaceAll('"','""')+'"';return '\ufeffid,name,background,category,shiny_owned,shiny_lucky_owned,shiny_bg_lucky_owned,trade_pending_owned\n'+entries.map(e=>[e.id,e.name,'限定',e.category,...keys.map(t=>!!checks[key(e,t)])].map(cell).join(',')).join('\n');}
const api={keys,labels,key,visibleEntries,available,isOwned,progress,restore,csv};root.LimitedCore=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
