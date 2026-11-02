(function(){'use strict';
window.TradeAccount={attach({container,label,checkbox,entry,getChecks,save}){
 const wrap=document.createElement('div');wrap.className='trade-account-control';
 const input=document.createElement('input');input.type='text';input.inputMode='numeric';input.pattern='[0-9]*';input.maxLength=12;input.autocomplete='off';input.className='trade-account-number';input.placeholder='番号';input.setAttribute('aria-label',entry.name+(entry.background?' '+entry.background:'')+' 交換待ちのアカウント番号');input.title='このポケモンがあるアカウントの番号';input.value=window.CollectionCore.tradeAccount(entry,getChecks());input.hidden=!checkbox.checked;
 input.addEventListener('input',()=>{const start=input.selectionStart;input.value=window.CollectionCore.setTradeAccount(entry,getChecks(),input.value);if(start!==null)input.setSelectionRange(Math.min(start,input.value.length),Math.min(start,input.value.length));save();});
 checkbox.addEventListener('change',()=>{input.hidden=!checkbox.checked;});
 wrap.append(label,input);container.append(wrap);
}};
})();
