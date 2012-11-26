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
