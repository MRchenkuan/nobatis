"use strict";function _toConsumableArray(e){return _arrayWithoutHoles(e)||_iterableToArray(e)||_nonIterableSpread()}function _nonIterableSpread(){throw new TypeError("Invalid attempt to spread non-iterable instance")}function _iterableToArray(e){if(Symbol.iterator in Object(e)||"[object Arguments]"===Object.prototype.toString.call(e))return Array.from(e)}function _arrayWithoutHoles(e){if(Array.isArray(e)){for(var r=0,n=new Array(e.length);r<e.length;r++)n[r]=e[r];return n}}var path=require("path"),rf=require("fs"),orm=require("orm"),connections;function connectToDB(e){return new Promise(function(n,t){connections?n(connections):orm.connect("mysql://"+e.username+":"+e.password+"@"+e.host+":"+e.port+"/",function(e,r){e&&(console.log(e),t(e)),n(connections=r)})})}var DAO=function DAO(modelPath,dbConfig){return new Proxy({},{get:function get(target,funcName,receiver){var _receiver=Reflect.get(target,funcName,receiver);if(!_receiver)return console.warn(funcName,"is not defined in model");var sql=getSQL(modelPath,funcName),args=getFuncArgs(_receiver);return function(){for(var resultMap=_receiver.apply(void 0,_toConsumableArray(args)),paramsMap={},i=0;i<args.length;i++)paramsMap[args[i]]=arguments[i];for(var k in paramsMap){var v=paramsMap[k];v=replaceSpecials(v),sql=sql.replace(eval("/#{".concat(k,"}/g")),v)}return new Promise(function(n,t){connectToDB(dbConfig).then(function(e){e.driver.execQuery(sql,function(e,r){e&&t(e),resultMap&&replaceColumnAlias(r,resultMap),n(r)})})})}}})},sqlCache={};function getSQL(e,r){var n=path.resolve(e,r);return n.indexOf(".sql")!=n.length-4&&(n+=".sql"),sqlCache[n]||(sqlCache[n]=rf.readFileSync(n,"utf-8")),sqlCache[n]}function replaceSpecials(e){return e=(e=(e=e.toString().replace("'","")).toString().replace('"',"")).toString().replace("\\","")}function getFuncArgs(e){return e.toString().match(/function\s.*?\(([^)]*)\)/)[1].split(",").map(function(e){return e.replace(/\/\*.*\*\//,"").trim()}).filter(function(e){return e})}function replaceColumnAlias(a,o){(a||[]).some(function(e,r){var n={};for(var t in e){if(o.hasOwnProperty(t))n[o[t]]=e[t];else n[t]=e[t]}a[r]=n})}module.exports=DAO;