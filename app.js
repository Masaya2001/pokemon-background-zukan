(async function(){'use strict';
const C=window.CollectionCore,$=id=>document.getElementById(id),STORE='pogo-bg-collection-v1';
let catalog,records,state,groups,noticeTimer,sprites={p:[],s:[],g:{}};const spriteCache=new Map();const opened=new Set();
let viewMode='list';try{const saved=localStorage.getItem('pogo-bg-view-mode');if(saved==='grouped'||saved==='list')viewMode=saved;}catch{}
const pageSize=()=>viewMode==='list'?60:24;let shown=pageSize();
const filters=['search','bgFilter','pokeFilter','yearFilter','categoryFilter','ownedFilter','typeFilter','statusFilter'];
function notice(t,error=false){clearTimeout(noticeTimer);$('notice').textContent=t;$('notice').style.color=error?'#ffb6b6':'#a3e9b9';if(!error)noticeTimer=setTimeout(()=>$('notice').textContent='',7000);}
function el(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e;}
function safeImage(url){return typeof url==='string'&&(/^https:\/\//i.test(url)||/^images\/[a-z0-9_-]+\.webp$/.test(url));}
function today(){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());}
const TODAY=today();
const planned=b=>b.datePrecision==='day'&&b.date>TODAY;
const entryPlanned=(e,b)=>e.availableFrom?e.availableFrom>TODAY:planned(b);
const owned=(e,t)=>!!state.checks[C.checkKey(e,t)];
function save(){try{localStorage.setItem(STORE,JSON.stringify(state));return true;}catch{notice('保存に失敗しました。バックアップを保存し、端末の空き容量を確認してください。',true);return false;}}
function rebuild(){
 groups=catalog.backgrounds.map(b=>({...b,name:C.backgroundName(b.name),entries:C.visibleEntries(records).filter(e=>e.backgroundId===b.id)}));
 const extras=new Map();for(const e of state.custom){const id='custom-bg:'+e.background;let g=extras.get(id);if(!g){g={id,name:e.background,date:e.date||null,datePrecision:e.date?'day':'unknown',type:'custom',image:e.image||'',sources:[],entries:[]};extras.set(id,g);}g.entries.push(e);}
 groups.push(...extras.values());groups.sort(C.sortGroups);
}
function option(value,label){const o=el('option','',label);o.value=value;return o;}
function refreshOptions(){
 const bg=$('bgFilter').value,poke=$('pokeFilter').value,year=$('yearFilter').value;
 $('bgFilter').replaceChildren(option('','すべての背景'),...groups.map(b=>option(b.id,b.name)));
 $('pokeFilter').replaceChildren(option('','すべてのポケモン'),...[...new Set([...C.visibleEntries(records),...state.custom].map(e=>e.name))].sort((a,b)=>a.localeCompare(b,'ja')).map(n=>option(n,n)));
 $('yearFilter').replaceChildren(option('','すべての年'),...[...new Set(groups.filter(b=>b.date).map(b=>b.date.slice(0,4)))].sort().map(y=>option(y,y+'年')));
 $('bgFilter').value=bg;$('pokeFilter').value=poke;$('yearFilter').value=year;
}
function allEntries(){return [...C.visibleEntries(records),...state.custom];}
function stats(){const all=allEntries();let total=0,count=0;for(const e of all)for(const t of C.types(e,'')){total++;if(owned(e,t))count++;}$('ownedCount').textContent=count.toLocaleString();$('totalCount').textContent=total.toLocaleString();$('rate').textContent=total?Math.round(count/total*100)+'%':'0%';}
function visibleTypes(e){return C.types(e,$('typeFilter').value).filter(t=>!$('ownedFilter').value||($('ownedFilter').value==='owned'?owned(e,t):!owned(e,t)));}
function visibleGroups(){
 const q=C.norm($('search').value).toLocaleLowerCase();
 return groups.flatMap(b=>{
  if($('bgFilter').value&&$('bgFilter').value!==b.id)return [];
  if($('yearFilter').value&&(!b.date||!b.date.startsWith($('yearFilter').value)))return [];
  if($('categoryFilter').value&&$('categoryFilter').value!==b.type)return [];
  const entries=b.entries.filter(e=>(!$('statusFilter').value||($('statusFilter').value==='planned'?entryPlanned(e,b):!entryPlanned(e,b)))&&(!$('pokeFilter').value||e.name===$('pokeFilter').value)&&(!q||C.norm(e.name+' '+b.name+' '+(e.category||'')).toLocaleLowerCase().includes(q))&&visibleTypes(e).length);
  if(!entries.length&&!b.pendingDetails)return [];
  if(!entries.length&&$('statusFilter').value&&($('statusFilter').value==='planned'?!planned(b):planned(b)))return [];
  if(!entries.length&&b.pendingDetails&&(q&&!C.norm(b.name).toLowerCase().includes(q)||$('pokeFilter').value||$('ownedFilter').value||$('typeFilter').value))return [];
  return [{...b,visible:entries}];
 });
}
function dateLabel(b){if(!b.date)return '初登場日：確認中';if(b.datePrecision==='year')return b.date+'年（日付未確認）';return b.date.replaceAll('-','/')+(planned(b)?' 初登場予定':' 初登場');}
function spriteInfo(e){
 if(!e||e.custom||!e.backgroundId)return null;
 const id=e.id.slice(e.backgroundId.length+1),shiny=C.previewShiny(e,$('typeFilter').value);
 const override=sprites.o&&sprites.o[e.id];if(override){const f=override[shiny?1:0];return f?{url:'https://raw.githubusercontent.com/PokeMiners/pogo_assets/master/Images/Pokemon%20-%20256x256/Addressable%20Assets/'+encodeURIComponent(f),raw:true}:null;}
 if(sprites.p.includes(id)&&(!shiny||sprites.s.includes(id))){
  return {url:'https://raw.githubusercontent.com/psoren/pogo-bg/main/docs/img/pm/'+(shiny?'s/':'')+encodeURIComponent(id)+'.png',raw:false};
 }
 const game=sprites.g[id],file=game&&game[shiny?1:0];
 return file?{url:'https://raw.githubusercontent.com/PokeMiners/pogo_assets/master/Images/Pokemon%20-%20256x256/Addressable%20Assets/'+encodeURIComponent(file),raw:true}:null;
}
function readySprite(info){
 if(spriteCache.has(info.url))return spriteCache.get(info.url);
 const ready=new Promise((resolve,reject)=>{
  const img=new Image();if(info.raw)img.crossOrigin='anonymous';
  img.onload=()=>{
   if(!info.raw){resolve(info.url);return;}
   try{
    // Trim the transparent margins of the game icon for consistent presentation.
    const c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;const ctx=c.getContext('2d');ctx.drawImage(img,0,0);
    const pixels=ctx.getImageData(0,0,c.width,c.height).data;let x0=c.width,y0=c.height,x1=-1,y1=-1;
    for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++)if(pixels[(y*c.width+x)*4+3]>12){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}
    if(x1<x0){reject(Error('empty icon'));return;}
    const crop=document.createElement('canvas');crop.width=x1-x0+1+12;crop.height=y1-y0+1+12;crop.getContext('2d').drawImage(img,x0,y0,x1-x0+1,y1-y0+1,6,6,x1-x0+1,y1-y0+1);resolve(crop.toDataURL('image/png'));
   }catch{resolve(info.url);}
  };img.onerror=()=>reject(Error('image unavailable'));img.src=info.url;
 });spriteCache.set(info.url,ready);return ready;
}
function mountSprite(parent,e){
 const info=spriteInfo(e),img=document.createElement('img');img.className='pokemon-sprite';img.alt=e.name+(C.previewShiny(e,$('typeFilter').value)?' 色違い':' 通常色');img.hidden=true;parent.append(img);
 const missing=()=>{img.remove();parent.append(el('span','sprite-unavailable','画像未確認'));};
 if(!info){missing();return;}
 readySprite(info).then(url=>{img.onload=()=>{img.hidden=false;};img.onerror=missing;img.src=url;}).catch(missing);
}
function showImage(b,e=null){
 if(!safeImage(b.image))return;
 $('imageTitle').textContent=e?e.name+'｜'+b.name:b.name;$('largeImage').src=b.image;$('largeImage').alt=b.name+'の背景画像';
 const stage=$('imageStage');stage.querySelectorAll('.pokemon-sprite,.sprite-unavailable').forEach(x=>x.remove());stage.classList.toggle('with-pokemon',!!e);if(e)mountSprite(stage,e);
 $('imageCaption').textContent=dateLabel(e&&e.availableFrom?{date:e.availableFrom,datePrecision:'day'}:b)+' ・ '+(b.type==='location'?'ロケーション背景':'スペシャル背景')+(e?' ・ 背景とポケモンのプレビュー':'');$('imageDialog').showModal();
}
function makeRow(e){const row=el('div','entry'),info=el('div','details');info.append(el('b','',e.name));if(e.availableFrom&&e.availableFrom>TODAY)info.append(el('span','badge planned',e.availableFrom.replaceAll('-','/')+' 開催予定'));if(e.evolved)info.append(el('small','','進化・姿の変更で引き継ぎ'));row.append(info);const checks=el('div','checks');for(const t of visibleTypes(e)){const l=el('label');const cb=document.createElement('input');cb.type='checkbox';cb.checked=owned(e,t);cb.setAttribute('aria-label',`${e.name} ${e.background} ${t==='shiny'?'色違い':'通常色'} 所持`);cb.addEventListener('change',()=>{state.checks[C.checkKey(e,t)]=cb.checked;save();stats();if($('ownedFilter').value)render();else updateProgress();});l.append(cb,document.createTextNode(t==='shiny'?'✨色違い':'通常色'));checks.append(l);}if(e.shiny===false&&!$('typeFilter').value)checks.append(el('span','unavailable','色違いなし'));if(e.shiny==null&&!$('typeFilter').value)info.append(el('small','','色違いの入手可否は確認中'));row.append(checks);return row;}
function progressInfo(b){let n=0,total=0;for(const e of b.entries)for(const t of C.types(e,'')){total++;if(owned(e,t))n++;}return {n,total};}
function fillProgress(node,b){const {n,total}=progressInfo(b);node.replaceChildren();const bar=document.createElement('progress');bar.max=total||1;bar.value=n;bar.setAttribute('aria-label',b.name+'の所持状況');node.append(bar,document.createTextNode(`${n} / ${total} チェック`));}
function updateProgress(){document.querySelectorAll('.progress').forEach(node=>{const b=groups.find(b=>b.id===node.dataset.id);if(b)fillProgress(node,b);});}
function makePhoto(b,e=null){let photo;
 if(safeImage(b.image)){photo=el('button','bg-photo');photo.setAttribute('aria-label',(e?e.name+'と':'')+b.name+'の背景画像を拡大');const img=document.createElement('img');img.src=b.image;img.alt=b.name;img.loading='lazy';img.decoding='async';img.addEventListener('error',()=>{photo.className='bg-photo placeholder';photo.textContent='画像を確認中';photo.disabled=true;});photo.append(img);if(e)mountSprite(photo,e);photo.addEventListener('click',()=>showImage(b,e));}
 else photo=el('div','bg-photo placeholder','画像は続報待ち');
return photo;}
function makeCard(b,forceOpen=false){
 const card=el('article','bg-card'),top=el('div','bg-top'),photo=makePhoto(b);
 const info=el('div','bg-info'),badges=el('div','badges');badges.append(el('span','badge '+(b.type==='special'?'special':''),b.type==='location'?'ロケーション':b.type==='special'?'スペシャル':'自分で追加'));
 if(planned(b))badges.append(el('span','badge planned','開催予定'));if(b.datePrecision!=='day')badges.append(el('span','badge unknown','日付未確認'));
 info.append(badges,el('h2','',b.name),el('small','bg-date',dateLabel(e.availableFrom?{date:e.availableFrom,datePrecision:'day'}:b)));const p=el('div','progress');p.dataset.id=b.id;fillProgress(p,b);info.append(p);top.append(photo,info);card.append(top);
 if(b.visible.length){const details=document.createElement('details'),summary=el('summary','',`対象ポケモン ${b.visible.length}件`);details.open=forceOpen||opened.has(b.id);details.append(summary);let populated=false;const populate=()=>{if(populated||!details.open)return;populated=true;details.append(...b.visible.map(makeRow));};populate();details.addEventListener('toggle',()=>{if(details.open){opened.add(b.id);populate();}else opened.delete(b.id);});card.append(details);}
 if(b.sources.length||b.notes||b.pendingDetails){const foot=el('div','bg-foot');if(b.notes)foot.append(el('div','',b.notes));if(b.pendingDetails)foot.append(el('div','','対象ポケモンは続報待ち'));b.sources.slice(0,3).forEach((url,i)=>{if(!/^https:\/\//.test(url))return;const a=el('a','',i?'出典'+(i+1):'出典');a.href=url;a.target='_blank';a.rel='noopener noreferrer';foot.append(a);});card.append(foot);}return card;
}
function makeListRow(e,b){
 const row=makeRow(e);row.classList.add('pokemon-row');row.prepend(makePhoto(b,e));const info=row.querySelector('.details');
 const background=el('small','row-background',b.name);info.insertBefore(background,info.children[1]||null);
 info.append(el('small','row-date',dateLabel(e.availableFrom?{date:e.availableFrom,datePrecision:'day'}:b)));
 if(!e.availableFrom&&planned(b))info.append(el('span','badge planned','開催予定'));
 return row;
}
function render(){
 stats();const list=visibleGroups(),totalEntries=list.reduce((n,b)=>n+b.visible.length,0);
 $('resultCount').textContent=`${list.length}背景 / ${totalEntries.toLocaleString()}組み合わせ`;
 $('listViewBtn').setAttribute('aria-pressed',String(viewMode==='list'));$('groupedViewBtn').setAttribute('aria-pressed',String(viewMode==='grouped'));
 const root=$('results');root.classList.toggle('list-view',viewMode==='list');root.replaceChildren();
 const force=!!($('search').value||$('pokeFilter').value||$('bgFilter').value||$('ownedFilter').value);
 let total,unit;
 if(viewMode==='list'){
  const rows=list.flatMap(b=>b.visible.length?b.visible.map(e=>({b,e})):[{b,e:null}]);total=rows.length;unit='件';
  root.append(...rows.slice(0,shown).map(({b,e})=>e?makeListRow(e,b):makeCard(b)));
 }else{total=list.length;unit='背景';root.append(...list.slice(0,shown).map(b=>makeCard(b,force)));}
 if(!list.length)root.append(el('p','empty','条件に合う項目がありません'));
 $('moreBtn').hidden=shown>=total;$('moreBtn').textContent=`もっと表示（残り${Math.max(0,total-shown).toLocaleString()}${unit}）`;
}
function download(name,text,mime){const blob=new Blob([text],{type:mime}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}
function addRecords(items){if(!Array.isArray(items))throw Error('一覧の形式が正しくありません');let n=0;const all=[...records,...state.custom];for(const item of items){if(!item||typeof item.name!=='string'||typeof item.background!=='string')continue;const name=item.name.trim(),background=C.backgroundName(item.background.trim());if(!name||!background)continue;const existing=all.find(e=>e.id===item.id||C.norm(e.name)+'|||'+C.norm(e.background)===C.norm(name)+'|||'+C.norm(background));let e=existing;if(!e){e={id:'custom:'+C.legacyKey({name,background}),name,background,category:String(item.category||''),date:/^\d{4}-\d{2}-\d{2}$/.test(item.date)?item.date:null,image:safeImage(item.image)?item.image:'',shiny:item.shiny!==false,custom:true};state.custom.push(e);all.push(e);n++;}for(const t of ['normal','shiny'])if(item[t+'_owned']==='true'||item[t+'_owned']===true)state.checks[C.checkKey(e,t)]=true;}return n;}
$('closeImage').onclick=()=>$('imageDialog').close();$('imageDialog').addEventListener('click',e=>{if(e.target===$('imageDialog'))$('imageDialog').close();});
try{
 const response=await fetch('catalog.json?v=20261024-10-simple');if(!response.ok)throw Error('背景データを取得できません');catalog=await response.json();try{const sr=await fetch('sprites.json?v=9-audit');if(sr.ok)sprites=await sr.json();}catch{}if(catalog.parts){const parts=await Promise.all(catalog.parts.map(async path=>{const r=await fetch(path+'?v=20261024-10-simple');if(!r.ok)throw Error('背景一覧を取得できません');return r.json();}));catalog.backgrounds=parts.flat();}records=C.flatten(catalog);
 let raw=null,bad=false;try{const s=localStorage.getItem(STORE);if(s)raw=JSON.parse(s);}catch{bad=true;notice('保存済みデータを読み込めませんでした。元のデータはそのまま残しています。',true);}
 state=C.migrate(raw,records);rebuild();refreshOptions();if(!bad)save();
 const future=groups.filter(planned).length;$('intro').textContent=`国内・海外の${groups.length}背景・${C.visibleEntries(records).length.toLocaleString()}組み合わせを収録（開催予定${future}背景を含む）。実装順に表示し、3段階進化の中間は省略しています。「一覧」は1行ずつ、「背景別」は背景ごとに表示。一覧の画像は色違いを標準表示（未実装は通常色）。画像をタップで拡大できます。`;
 $('coverage').textContent=`データ確認日：${catalog.asOf.replaceAll('-','/')}。確認できたロケーション背景・スペシャル背景と告知済み予定を掲載しています。資料間の差異や今後の追加により、未確認の項目が残る場合があります。`;
 for(const source of catalog.sources){const a=el('a','',source.name);a.href=source.url;a.target='_blank';a.rel='noopener noreferrer';$('sources').append(a);}
 for(const [id,mode] of [['listViewBtn','list'],['groupedViewBtn','grouped']]){$(id).disabled=false;$(id).onclick=()=>{viewMode=mode;shown=pageSize();try{localStorage.setItem('pogo-bg-view-mode',mode);}catch{}render();};}
 for(const id of filters)$(id).addEventListener(id==='search'?'input':'change',()=>{shown=pageSize();render();});
 $('resetFilters').onclick=()=>{for(const id of filters)$(id).value='';shown=pageSize();render();};$('moreBtn').onclick=()=>{shown+=pageSize();render();};
 $('exportBtn').onclick=()=>download('pokemon-go-background-backup.json',JSON.stringify({...state,exportedAt:new Date().toISOString(),entries:allEntries()},null,2),'application/json');
 const csvCell=x=>'"'+String(x??'').replaceAll('"','""')+'"';$('exportCsv').onclick=()=>download('pokemon-go-background-list.csv','\ufeffname,background,category,image,normal_owned,shiny_owned,id,date\n'+allEntries().map(e=>[e.name,e.background,e.category,e.image,owned(e,'normal'),owned(e,'shiny'),e.id,e.date].map(csvCell).join(',')).join('\n'),'text/csv;charset=utf-8');
 $('addBtn').onclick=()=>{const n=addRecords([{name:$('addName').value,background:$('addBg').value,category:$('addCategory').value,image:$('addImage').value,date:$('addDate').value}]);if(n){save();rebuild();refreshOptions();render();for(const id of ['addName','addBg','addCategory','addImage','addDate'])$(id).value='';notice('項目を追加しました');}else notice('ポケモン名と背景名を入力してください。同じ項目は重複登録できません。',true);};
 $('importBtn').onclick=()=>$('file').click();$('file').onchange=async ev=>{const f=ev.target.files[0];if(!f)return;try{if(f.size>10000000)throw Error('10MB以下のファイルを選んでください');const text=await f.text();if(f.name.toLowerCase().endsWith('.csv'))notice(`${addRecords(C.parseCSV(text))}件追加しました`);else{const data=JSON.parse(text);if(Array.isArray(data))notice(`${addRecords(data)}件追加しました`);else if(data&&Array.isArray(data.entries)&&data.checks&&typeof data.checks==='object'){if(!confirm('バックアップのチェック状態と追加項目で現在の記録を置き換えます。復元しますか？'))return;state=C.migrate(data,records);notice('バックアップを復元しました');}else throw Error('バックアップの形式が正しくありません');}save();rebuild();refreshOptions();render();}catch(e){notice('読込に失敗しました：'+e.message,true);}finally{ev.target.value='';}};
 render();
}catch(e){notice('読み込みに失敗しました：'+e.message+'。画面を再読み込みしてください。',true);$('intro').textContent='背景データを読み込めませんでした。';}
})();
