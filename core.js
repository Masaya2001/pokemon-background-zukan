(function(root){'use strict';
const norm=s=>String(s||'').normalize('NFKC').trim();
const legacyKey=e=>`${String(e.name||'').trim()}|||${String(e.background||'').trim()}`;
const recordKey=e=>e.id||legacyKey(e);
const checkKey=(e,t)=>recordKey(e)+'|||'+t;
const statusKeys=['normal','shiny','shiny_lucky','trade_pending'];
const statusLabels={normal:'通常色',shiny:'色違い',shiny_lucky:'色キラ',trade_pending:'交換待ち'};
function backgroundName(s){return String(s||'').replace(/GO[ 　]*(?:フェス|Fest)/g,'GO Fest').replace(/GO[ 　]*(?:ツアー|Tour)/g,'GO Tour').replace(/(GO (?:Fest|Tour))(?=\d)/g,'$1 ').replace(/GO Fest 2025（(ザシアン|ザマゼンタ)）/g,'GO Fest 2025（グローバル・$1）').replace('GO Fest 2026（グローバル）','GO Fest 2026（グローバル／伝説への道共通）');}
const royalForms={zacian:{id:'zacian-crowned-sword',name:'ザシアン(けんのおう)'},zamazenta:{id:'zamazenta-crowned-shield',name:'ザマゼンタ(たてのおう)'}};
function flatten(catalog){const hidden=new Set(catalog.hiddenMiddlePokemonIds||[]);return catalog.backgrounds.flatMap(b=>{const rows=new Map();for(const p of b.pokemon){const base=Object.keys(royalForms).find(id=>p.id===id||p.id===royalForms[id].id),royal=base&&royalForms[base],id=royal?royal.id:p.id,key=b.id+':'+id;const e={id:key,name:royal?royal.name:p.name,background:backgroundName(b.name),category:b.type==='location'?'ロケーション背景':'スペシャル背景',image:b.image,date:p.availableFrom||b.date,availableFrom:p.availableFrom,backgroundId:b.id,shiny:p.shiny,evolved:royal?true:p.evolved,dex:p.dex,hiddenMiddle:hidden.has(p.id)};if(royal)e.formAliases=[{id:b.id+':'+base,name:base==='zacian'?'ザシアン':'ザマゼンタ',background:e.background}];const prior=rows.get(key);if(prior){e.shiny=prior.shiny===true||e.shiny===true?true:prior.shiny===false&&e.shiny===false?false:null;e.availableFrom=[prior.availableFrom,e.availableFrom].filter(Boolean).sort()[0];e.date=e.availableFrom||b.date;}rows.set(key,e);}return [...rows.values()];});}
function resolveRecord(records,item){return records.find(e=>e.id===item.id||(e.formAliases||[]).some(a=>a.id===item.id)||[e,...e.formAliases||[]].some(a=>norm(a.name)===norm(item.name)&&norm(backgroundName(a.background))===norm(backgroundName(item.background))));}

function visibleEntries(entries){return entries.filter(e=>!e.hiddenMiddle);}

function migrate(raw,records){
 const byId=new Map(),byLegacy=new Map();for(const e of records)for(const a of [e,...e.formAliases||[]]){byId.set(a.id,e);byLegacy.set(norm(a.name)+'|||'+norm(backgroundName(a.background)),e);}
 const saved=raw&&typeof raw==='object'?raw:{};const checks={};const custom=[];
 const inputs=Array.isArray(saved.custom)?saved.custom:Array.isArray(saved.entries)?saved.entries:[];
 const sourceChecks=saved.checks&&typeof saved.checks==='object'?saved.checks:{};
 const resolve=e=>byId.get(e.id)||byLegacy.get(norm(e.name)+'|||'+norm(backgroundName(e.background)));
 for(const e of inputs){
  if(!e||typeof e.name!=='string'||typeof e.background!=='string'||!e.name.trim()||!e.background.trim())continue;
  let target=resolve(e);
  if(!target){target={...e,id:e.id||'custom:'+legacyKey(e),custom:true};if(!custom.some(x=>x.id===target.id))custom.push(target);}
  for(const t of statusKeys){const old=sourceChecks[checkKey(e,t)]??sourceChecks[legacyKey(e)+'|||'+t];if(typeof old==='boolean'){const k=checkKey(target,t);checks[k]=target.formAliases&&saved.formMergeVersion!==1?checks[k]===true||old:old;}}
 }
 // Preserve recognized stable ids and orphaned checks so an updated catalog cannot lose data.
 for(const [k,v] of Object.entries(sourceChecks)){if(typeof v!=='boolean')continue;if(!(k in checks))checks[k]=v;}
 // Old normal-form flags merge once; later explicit unchecks on the royal row stay authoritative.
 for(const e of records)if(e.formAliases)for(const t of statusKeys){const k=checkKey(e,t);if(saved.formMergeVersion===1&&typeof sourceChecks[k]==='boolean'){checks[k]=sourceChecks[k];continue;}const values=[sourceChecks[k],checks[k],...e.formAliases.flatMap(a=>[sourceChecks[checkKey(a,t)],sourceChecks[legacyKey(a)+'|||'+t]])].filter(v=>typeof v==='boolean');if(values.length)checks[k]=values.some(Boolean);}
 return {version:3,formMergeVersion:1,checks,custom};
}
function parseCSV(s){const rows=[];let row=[],cell='',quoted=false;for(let i=0;i<s.length;i++){const c=s[i];if(c==='"'){if(quoted&&s[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}else if(c===','&&!quoted){row.push(cell);cell='';}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&s[i+1]==='\n')i++;row.push(cell);if(row.some(v=>v!==''))rows.push(row);row=[];cell='';}else cell+=c;}if(quoted)throw Error('CSVの引用符が閉じていません');row.push(cell);if(row.some(v=>v!==''))rows.push(row);if(!rows.length)return [];const head=rows.shift().map(x=>x.trim().replace(/^\ufeff/,''));if(!head.includes('name')||!head.includes('background'))throw Error('CSVにnameとbackground列が必要です');return rows.map(r=>Object.fromEntries(head.map((h,i)=>[h,r[i]||''])));}
function types(e,filter){return statusKeys.filter(t=>(!filter||filter===t)&&(!['shiny','shiny_lucky'].includes(t)||e.shiny!==false));}
function ownedTypes(e){return types(e,'').filter(t=>t!=='trade_pending');}
function isOwned(e,checks){return ownedTypes(e).some(t=>!!checks[checkKey(e,t)]);}
function collectionProgress(entries,checks){return {n:entries.filter(e=>isOwned(e,checks)).length,total:entries.length};}
function previewShiny(e,filter){return filter!=='normal'&&e.shiny===true;}
function sortGroups(a,b){const ak=a.datePrecision==='day'?a.date:'9999',bk=b.datePrecision==='day'?b.date:'9999';return ak.localeCompare(bk)||a.id.localeCompare(b.id);}
const api={statusKeys,statusLabels,ownedTypes,isOwned,collectionProgress,norm,legacyKey,recordKey,checkKey,flatten,resolveRecord,backgroundName,visibleEntries,migrate,parseCSV,types,previewShiny,sortGroups};root.CollectionCore=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
