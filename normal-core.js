(function(root){'use strict';
const keys=['normal','shiny','lucky','iv100','xxl','xxs'],labels={normal:'通常色',shiny:'色違い',lucky:'キラ',iv100:'★100',xxl:'XXL',xxs:'XXS'};
const key=(e,t)=>e.id+'|||'+t,available=(e,t)=>t!=='shiny'||e.shiny;
const isOwned=(e,checks)=>keys.some(t=>available(e,t)&&checks[key(e,t)]===true);
function restore(data){const checks={};if(data&&data.collection==='normal'&&data.checks&&typeof data.checks==='object'&&!Array.isArray(data.checks))for(const [k,v] of Object.entries(data.checks))if(/^normal:p\d+(?::dynamax)?\|\|\|(normal|shiny|lucky|iv100|xxl|xxs)$/.test(k)&&typeof v==='boolean')checks[k]=v;return {version:1,collection:'normal',checks};}
function csv(entries,checks){const quote=v=>'"'+String(v).replaceAll('"','""')+'"';return '\ufeff'+[['id','name','background',...keys.map(t=>t+'_owned')],...entries.map(e=>[e.id,e.name,'通常',...keys.map(t=>available(e,t)&&checks[key(e,t)]===true)])].map(r=>r.map(quote).join(',')).join('\r\n');}
const api={keys,labels,key,available,isOwned,restore,csv};if(typeof module==='object'&&module.exports)module.exports=api;else root.NormalCore=api;
})(typeof window==='object'?window:globalThis);
