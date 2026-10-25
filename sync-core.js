/* Shared merge logic for the forthcoming Firebase adapter. No credentials. */
(function(root){'use strict';
const isChecks=x=>x&&typeof x==='object'&&!Array.isArray(x);
function cleanChecks(input){const out=Object.create(null);if(isChecks(input))for(const [key,value] of Object.entries(input))if(key.length<=1500&&typeof value==='boolean')out[key]=value;return out;}
// A cloud false is an intentional uncheck, never an absent value.
// Unsynced local edits take precedence until the server acknowledges them.
function mergeChecks(local,cloud,pending){return Object.assign(Object.create(null),cleanChecks(local),cleanChecks(cloud),cleanChecks(pending));}
function changes(before,after){const a=cleanChecks(before),b=cleanChecks(after),patch=Object.create(null);for(const key of new Set([...Object.keys(a),...Object.keys(b)]))if((a[key]===true)!==(b[key]===true))patch[key]=b[key]===true;return patch;}
function acknowledge(pending,sent){const out=cleanChecks(pending);for(const [key,value] of Object.entries(cleanChecks(sent)))if(out[key]===value)delete out[key];return out;}
// Seed only keys missing from the server. A second device must not undo unchecks.
function seedMissing(local,cloud){const a=cleanChecks(local),b=cleanChecks(cloud),patch=Object.create(null);for(const [key,value] of Object.entries(a))if(!Object.hasOwn(b,key)&&value)patch[key]=true;return patch;}
const api={cleanChecks,mergeChecks,changes,acknowledge,seedMissing};if(typeof module==='object'&&module.exports)module.exports=api;else root.CollectionSyncCore=api;
})(typeof window==='object'?window:globalThis);
