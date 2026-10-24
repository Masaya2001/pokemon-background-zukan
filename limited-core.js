(function(root){'use strict';
const keys=['shiny','shiny_lucky','shiny_bg_lucky','trade_pending'];
const labels={shiny:'色違い',shiny_lucky:'色キラ',shiny_bg_lucky:'色背景キラ',trade_pending:'交換待ち'};
const key=(e,t)=>e.id+'|||'+t;
function visibleEntries(entries){return entries.filter(e=>e.category==='costume'&&!e.hiddenMiddle);}
function available(e,t){if(t==='trade_pending')return true;if(!e.shiny)return false;return t!=='shiny_bg_lucky'||e.backgroundStatus==='yes';}
function isOwned(e,checks){return keys.slice(0,3).some(t=>available(e,t)&&!!checks[key(e,t)]);}
function progress(entries,checks){return {owned:entries.filter(e=>isOwned(e,checks)).length,total:entries.length,waiting:entries.filter(e=>checks[key(e,'trade_pending')]).length};}
function backgroundKey(e,b){return e.id+'|||background:'+b.id;}
function backgroundList(e,aliases={}){const merged=new Map();for(const b of e.backgrounds||[]){const id=aliases[b.id]||String(b.id),prior=merged.get(id);if(!prior){merged.set(id,{...b,id,aliasIds:[String(b.id)]});continue;}const aliasIds=[...new Set([...prior.aliasIds,String(b.id)])];merged.set(id,{...(String(b.id)===id?b:prior),id,aliasIds,planned:prior.planned&&b.planned});}return [...merged.values()];}
function backgroundOwned(e,b,checks){const k=backgroundKey(e,b);return typeof checks[k]==='boolean'?checks[k]:(b.aliasIds||[]).some(id=>!!checks[backgroundKey(e,{id})]);}
function backgroundProgress(e,checks,aliases={}){const list=backgroundList(e,aliases);return {owned:list.filter(b=>backgroundOwned(e,b,checks)).length,total:list.length};}
function backgroundIds(text){if(!text)return [];const ids=JSON.parse(text);if(!Array.isArray(ids)||ids.length>1000||ids.some(id=>typeof id!=='string'))throw Error('背景所持の列が正しくありません');return ids;}
function restore(raw){const checks={};if(raw&&raw.checks&&typeof raw.checks==='object'&&!Array.isArray(raw.checks))for(const [k,v] of Object.entries(raw.checks))if(typeof v==='boolean'&&k.startsWith('limited:')&&(keys.some(t=>k.endsWith('|||'+t))||/\|\|\|background:[a-zA-Z0-9_-]+$/.test(k)))checks[k]=v;return {version:1,collection:'limited',checks};}
function csv(entries,checks,aliases={}){const cell=x=>'"'+String(x??'').replaceAll('"','""')+'"';return '\ufeffid,name,background,category,shiny_owned,shiny_lucky_owned,shiny_bg_lucky_owned,trade_pending_owned,background_owned\n'+entries.map(e=>[e.id,e.name,'限定',e.category,...keys.map(t=>!!checks[key(e,t)]),JSON.stringify(backgroundList(e,aliases).filter(b=>backgroundOwned(e,b,checks)).map(b=>b.id))].map(cell).join(',')).join('\n');}
const api={backgroundKey,backgroundList,backgroundOwned,backgroundProgress,backgroundIds,keys,labels,key,visibleEntries,available,isOwned,progress,restore,csv};root.LimitedCore=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
