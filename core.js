(function(root){'use strict';
const norm=s=>String(s||'').normalize('NFKC').trim();
const legacyKey=e=>`${String(e.name||'').trim()}|||${String(e.background||'').trim()}`;
const recordKey=e=>e.id||legacyKey(e);
const checkKey=(e,t)=>recordKey(e)+'|||'+t;
function flatten(catalog){return catalog.backgrounds.flatMap(b=>b.pokemon.map(p=>({id:b.id+':'+p.id,name:p.name,background:b.name,category:b.type==='location'?'ロケーション背景':'スペシャル背景',image:b.image,date:b.date,backgroundId:b.id,shiny:p.shiny,evolved:p.evolved,dex:p.dex})));}
function migrate(raw,records){
 const byId=new Map(records.map(e=>[e.id,e])),byLegacy=new Map(records.map(e=>[norm(e.name)+'|||'+norm(e.background),e]));
 const saved=raw&&typeof raw==='object'?raw:{};const checks={};const custom=[];
 const inputs=Array.isArray(saved.custom)?saved.custom:Array.isArray(saved.entries)?saved.entries:[];
 const sourceChecks=saved.checks&&typeof saved.checks==='object'?saved.checks:{};
 const resolve=e=>byId.get(e.id)||byLegacy.get(norm(e.name)+'|||'+norm(e.background));
 for(const e of inputs){
  if(!e||typeof e.name!=='string'||typeof e.background!=='string'||!e.name.trim()||!e.background.trim())continue;
  let target=resolve(e);
  if(!target){target={...e,id:e.id||'custom:'+legacyKey(e),custom:true};if(!custom.some(x=>x.id===target.id))custom.push(target);}
  for(const t of ['normal','shiny']){const old=sourceChecks[checkKey(e,t)]??sourceChecks[legacyKey(e)+'|||'+t];if(typeof old==='boolean')checks[checkKey(target,t)]=old;}
 }
 // Preserve recognized stable ids and orphaned checks so an updated catalog cannot lose data.
 for(const [k,v] of Object.entries(sourceChecks)){if(typeof v!=='boolean')continue;if(!(k in checks))checks[k]=v;}
 return {version:3,checks,custom};
}
function parseCSV(s){const rows=[];let row=[],cell='',quoted=false;for(let i=0;i<s.length;i++){const c=s[i];if(c==='"'){if(quoted&&s[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}else if(c===','&&!quoted){row.push(cell);cell='';}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&s[i+1]==='\n')i++;row.push(cell);if(row.some(v=>v!==''))rows.push(row);row=[];cell='';}else cell+=c;}if(quoted)throw Error('CSVの引用符が閉じていません');row.push(cell);if(row.some(v=>v!==''))rows.push(row);if(!rows.length)return [];const head=rows.shift().map(x=>x.trim().replace(/^\ufeff/,''));if(!head.includes('name')||!head.includes('background'))throw Error('CSVにnameとbackground列が必要です');return rows.map(r=>Object.fromEntries(head.map((h,i)=>[h,r[i]||''])));}
function types(e,filter){return ['normal','shiny'].filter(t=>(!filter||filter===t)&&(t==='normal'||e.shiny!==false));}
function sortGroups(a,b){const ak=a.datePrecision==='day'?a.date:'9999',bk=b.datePrecision==='day'?b.date:'9999';return ak.localeCompare(bk)||a.id.localeCompare(b.id);}
const api={norm,legacyKey,recordKey,checkKey,flatten,migrate,parseCSV,types,sortGroups};root.CollectionCore=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
