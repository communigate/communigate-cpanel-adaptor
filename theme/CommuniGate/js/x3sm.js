var NativeJson = Object.prototype.toString.call(this.JSON) === '[object JSON]' && this.JSON;
function fastJsonParse (s, reviver) {
          return NativeJson ?
        NativeJson.parse(s,reviver) : YAHOO.lang.JSON.parse(s,reviver);
}
/* ***** BEGIN LICENSE BLOCK *****

# cpanel12 - CookieHelper.js                 Copyright(c) 1997-2008 cPanel, Inc.
#                                                           All Rights Reserved.
# copyright@cpanel.net                                         http://cpanel.net
# This code is subject to the cPanel license. Unauthorized copying is prohibited

 * ***** END LICENSE BLOCK ***** 
  * ***** BEGIN APPLICABLE CODE BLOCK ***** */

/* Double Include Protection 

if (CookieHelper) {
    alert("Cookie Helper Included multiple times in " + window.location.href);
}

var CookieHelper = 1;
 */

var isWebMail = 0;
var NVData_pending = 0;

function DidSetNvData(jsonRef, myCallback) {
    NVData_pending = 0;
    if (! jsonRef ){
        alert("Invalid json response from json-api: " + o.responseText);
        return;
    }

    for(var i=0;i<jsonRef.length;i++) {
        if (jsonRef[i].set == null) {
            alert("Invalid Data in response from json-api: " + o.responseText);
            continue;
        }
        if (myCallback != null) {
            myCallback(jsonRef[i].set);
        }
    }
}

function FailSetNvData(o) {
//DEBUG    alert("Unable to setNvData in: " + window.location.href);
}

function SetNvData(name, Cvalue, myCallback, nocache)
{
    var mycallback = function (xmlRef) {
            DidSetNvData(xmlRef,myCallback);
    };

    if (typeof(window['cpanel_jsonapi2']) == 'undefined') { alert("You must load jsonapi.js before using SetNvData into this page: " + window.location.href ); }
    cpanel_jsonapi2(mycallback,'NVData','set','names',name,name,Cvalue,'__nvdata::nocache',(nocache ? 1 : 0));
    NVData_pending = 1;
    NVData[name] = Cvalue;
}

function GotNvData(jsonRef, myCallback) {

    if (!jsonRef) {
        alert("Invalid json response from json-api NVData get");
        return;
    }
    if (! myCallback) {
        alert("GetNvData call is missing a callback function on: " + window.location.href);
        return;
    }

    for(var i=0;i<jsonRef.length;i++) {
        if (!jsonRef[i].name) {
            alert("Invalid Data in response from NVData get");
            continue;
        }
        var thisVal = '';
        if (jsonRef[i].value) {
            thisVal = jsonRef[i].value;
        }
        myCallback(jsonRef[i].name,unescape(thisVal));
    }
}

function FailGetNvData(o) {
//DEBUG    alert("Unable to getNvData in: " + window.location.href);
}

function GetNvData(name, myCallback)
{
    var mycallback = function (xmlRef) {
          GotNvData(xmlRef,myCallback);
    };

    if (typeof(window['cpanel_jsonapi2']) == 'undefined') { alert("You must load jsonapi.js before using SetNvData into this page: " + window.location.href ); }
    cpanel_jsonapi2(mycallback,'NVData','get','names',name);
}

function SetCookie(name, value, expires, path) 
{
	document.cookie = name + "=" + escape (value) + 
		((expires) ?	("; expires=" + expires.toGMTString()) : "") + 
		((path) ?		("; path=" + path) : "");
}
function GetCookie(name)
{
	var dcookie = document.cookie; 
	var cname = name + "=";
	var clen = dcookie.length;
	var cbegin = 0;
    while (cbegin < clen) 
    {
		var vbegin = cbegin + cname.length;
		if (dcookie.substring(cbegin, vbegin) == cname) 
		{ 
			var vend = dcookie.indexOf (";", vbegin);
			if (vend == -1) vend = clen;
			return unescape(dcookie.substring(vbegin, vend));
		}
		cbegin = dcookie.indexOf(" ", cbegin) + 1;
		if (cbegin == 0) break;
	}
	//alert("Cookie (Get):" + document.cookie);
	return null;
}

function include_dom(script_filename) {
    var html_doc = document.getElementsByTagName('head').item(0);
    var js = document.createElement('script');
    js.setAttribute('language', 'javascript');
    js.setAttribute('type', 'text/javascript');
    js.setAttribute('src', script_filename);
    html_doc.appendChild(js);
    return false;
}


if (!self['YAHOO']) {
    YAHOO = function () {};
    YAHOO.util = function () {};
    YAHOO.widget = function () {};
    YAHOO.widget.Panel = YAHOO.widget.Dialog = function () {
        var x = {};
        x.render = function() {};
        x.show = function() {};
        x.hide = function() {};
        return x;
    };
    YAHOO.util.Event = function () {};
    YAHOO.util.Event.addListener = function () {};
    YAHOO.util.Region = function () {};
    YAHOO.util.Dom = function () {};
    YAHOO.util.Motion = function () { 
        var x = {};
        x.animate = function() {};
        x.onComplete = function() {};
        x.onComplete.subscribe = function() {};
        return x; 
    };
    YAHOO.util.Dom.getXY = function () { return []; };
}
function open_passgen_dialog () { alert('Password Generation is not available for mobile devices.'); }
function register_validator () {}
function do_validate () { return true; }
function show_optionselect () { return; }
function register_truncate_table () {}
//hide the Notices box if there is no "interesting" HTML in it
function hide_notices_ifempty() {
    var noticeboard = document.getElementById('noticeboard');
    if (!noticeboard) return;

    if ( !/[^\s\n\r]/.test(noticeboard.innerHTML) ) {
        /* the box is empty, so hide it */
        document.getElementById('notices').style.display='none';
    }
}
/* frequently activated actions */
if (!NVData) var NVData = {};
if (self['register_interfacecfg_nvdata']) { register_interfacecfg_nvdata('icFAA'); }

function icFAA(item) {
    setQuickCookie('icFAA',item);
}

function checkFAA() {
    var icFAA_cookie = GetCookie('icFAA');
    if (icFAA_cookie && icFAA_cookie != '0') {
        if (!NVData['icFAA']) {
            fetch_icFAA_NVData();
        } else {
            parse_icFAA_cookie(icFAA_cookie);
        }
    }
}

function fetch_icFAA_NVData() {
    GetNvData('icFAA',handle_icFAA_NVData_ret);
}


function handle_icFAA_NVData_ret(nvname,nvval) {
    if (nvname) {
        var icFAA_cookie = GetCookie('icFAA');
        NVData['icFAA'] = nvval;
        parse_icFAA_cookie(icFAA_cookie);
    }
}

function parse_icFAA_cookie(icFAA_cookie) {
    setQuickCookie('icFAA','0');
    try { 
        var appCntList = fastJsonParse(NVData['icFAA']);
    } 
    catch (e) { 
        appCntList = {};
    } 

    if (!appCntList[icFAA_cookie]) {
        appCntList[icFAA_cookie]=1;
    } else {
        appCntList[icFAA_cookie]++;
    }
    var delayed_nv_set = function() {
        SetNvData('icFAA',YAHOO.lang.JSON.stringify(appCntList),null,1);
    };
    setTimeout(delayed_nv_set,100); // Make sure we set this after any pending ajax requests
}

function setQuickCookie(cookiename,cookievalue) {
    var today = new Date();
    today.setTime( today.getTime() );
    var expires_date = new Date( today.getTime() + 4000 );
	
    SetCookie(cookiename,cookievalue,expires_date);
}

function renderFAA() {
    var faaEl = document.getElementById('faa');
    if (!faaEl) { return; }    

    
    try {
        var appCntList = fastJsonParse(NVData['icFAA']);
    }
    catch (e) {
        appCntList = {};
    }

    if (!appCntList) { return; }
    var appArr = [];    
    for(var app in appCntList) {
     if (appCntList.hasOwnProperty(app)) {
        appArr.push(app);
     }
    }

    if (appArr.length < 1) {
        return;
    }

    var mysort = function(a,b) {
       return appCntList[b]-appCntList[a];
    };

    appArr.sort(mysort);
    var ulEl = document.createElement('ul');
    for(var i = 0;i <= 4;i++) {
        var targetEl = document.getElementById('item_' + appArr[i]);
        if (!targetEl) { continue; }

        var liEl = document.createElement('li');
        var aEl = document.createElement('a');
        aEl.innerHTML = targetEl.innerHTML; /* + ' (' + appCntList[appArr[i]] + ')'; */
        aEl.id = 'faa_' + targetEl.id;

        if (targetEl.onclick) {
            var clickTrap = (function() {
                var realEl = targetEl;
                return function(e,b,c) {
                    var clickok =
                          realEl.onclick ? realEl.onclick()
                        : realEl.click   ? realEl.click()
                        : true;

                    if (clickok === false) {
                        EVENT.preventDefault(e);
                        return false;
                    }
                };
            })();
            EVENT.addListener(aEl, 'click', clickTrap, aEl, true);
        }

        aEl.setAttribute('href',targetEl.getAttribute('href'));

        liEl.appendChild(aEl);
        ulEl.appendChild(liEl);
    }
    faaEl.style.display='';
    var faaBoard = document.getElementById('faaboard');
    faaBoard.innerHTML='';
    faaBoard.appendChild(ulEl);
}

function SortObject(arrayName,length) {
    for (var i=0; i<(length-1); i++)
        for (var j=i+1; j<length; j++)
            if (arrayName[j].value < arrayName[i].value) {
                var dummy = arrayName[i];
                arrayName[i] = arrayName[j];
                arrayName[j] = dummy;
            }
}

YAHOO.util.Event.onDOMReady(function() {
	checkFAA();
	renderFAA();
});
