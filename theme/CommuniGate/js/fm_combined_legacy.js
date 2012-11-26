var NativeJson = Object.prototype.toString.call(this.JSON) === '[object JSON]' && this.JSON;
function fastJsonParse (s, reviver) {
          return NativeJson ?
        NativeJson.parse(s,reviver) : YAHOO.lang.JSON.parse(s,reviver);
}
/* ***** BEGIN LICENSE BLOCK *****

# cpanel12 - jsonapi.js                       Copyright(c) 1997-2009 cPanel, Inc.
#                                                           All Rights Reserved.
# copyright@cpanel.net                                         http://cpanel.net
# This code is subject to the cPanel license. Unauthorized copying is prohibited

 * ***** END LICENSE BLOCK ***** 
  * ***** BEGIN APPLICABLE CODE BLOCK ***** */

function cpanel_jsonapi1() {
    var argv = cpanel_jsonapi1.arguments;
    var mycallback = argv[0];
    var module = argv[1];
    var func = argv[2];
    var argc = argv.length;
    
    var callback = {
        success: cpanel_jsonapi1_parser,
        failure: mycallback,
        argument: mycallback
    };
    
    var sFormData = 'cpanel_jsonapi_module=' + encodeURIComponent(module) + '&cpanel_jsonapi_func=' + encodeURIComponent(func) + '&cpanel_jsonapi_apiversion=1';
    var argnum=0;
    for(var i=3;i<argc;i++) {
        sFormData += '&arg-' + argnum + '=' + encodeURIComponent(argv[i]);
        argnum++;
    }
    if (sFormData.length < 2000) {
        YAHOO.util.Connect.asyncRequest('GET', CPANEL.security_token + '/json-api/cpanel?' + sFormData , callback);
    } else {
        YAHOO.util.Connect.asyncRequest('POST', CPANEL.security_token + '/json-api/cpanel' , callback,sFormData);
    }
}

function cpanel_jsonapi1_parser(o) {
    var mycallback = o.argument;
    var jsonCode = fastJsonParse(o.responseText);
    if (mycallback) {
        mycallback(jsonCode.cpanelresult.data.result);
    }
}

function cpanel_jsonapi2() {
    var argv = cpanel_jsonapi2.arguments;
    var mycallback = argv[0];
    var module = argv[1];
    var func = argv[2];
    var argc = argv.length;
    
    var callback = {
        success: cpanel_jsonapi2_parser,
        failure: mycallback,
        argument: mycallback
    };

    var sFormData = 'cpanel_jsonapi_module=' + encodeURIComponent(module) + '&cpanel_jsonapi_func=' + encodeURIComponent(func) + '&cpanel_jsonapi_apiversion=2';
    for(var i=3;i<argc;i+=2) {
        sFormData += '&' + encodeURIComponent(argv[i]) + '=' + encodeURIComponent(argv[i+1]);
    }
    if (sFormData.length < 2000) {
        YAHOO.util.Connect.asyncRequest('GET', CPANEL.security_token + '/json-api/cpanel?' + sFormData , callback);
    } else {
        YAHOO.util.Connect.asyncRequest('POST', CPANEL.security_token + '/json-api/cpanel' , callback,sFormData);
    }
}

function cpanel_jsonapi2_parser(o) {
    var mycallback = o.argument;
    var jsonCode = fastJsonParse(o.responseText);
    if (mycallback) {
        mycallback(jsonCode.cpanelresult.data);
    }
}
/* ***** BEGIN LICENSE BLOCK *****

# cpanel12 - xmlapi.js                       Copyright(c) 1997-2008 cPanel, Inc.
#                                                           All Rights Reserved.
# copyright@cpanel.net                                         http://cpanel.net
# This code is subject to the cPanel license. Unauthorized copying is prohibited

 * ***** END LICENSE BLOCK ***** 
  * ***** BEGIN APPLICABLE CODE BLOCK ***** */
var use_fast_proto=1;

function cpanel_api1() {
    var argv = cpanel_api1.arguments;
    var mycallback = argv[0];
    var module = argv[1];
    var func = argv[2];
    var argc = argv.length;
    
    var callback = {
        success: cpanel_api1_parser,
        argument: mycallback
    };
    
    var sFormData;
    if (use_fast_proto) {
        sFormData = 'cpanel_xmlapi_module=' + encodeURIComponent(module) + '&cpanel_xmlapi_func=' + encodeURIComponent(func) + '&cpanel_xmlapi_apiversion=1';
        var argnum=0;
        for(var i=3;i<argc;i++) {
            sFormData += '&arg-' + argnum + '=' + encodeURIComponent(argv[i]);
            argnum++;
        }
    } else {
        sFormData = 'xmlin=<cpanelaction><apiversion>1</apiversion><module>' + module + '</module><func>' + func + '</func>';
        for(var i=3;i<argc;i++) {
            sFormData += '<args>' + argv[i] + '</args>';
        }
        sFormData += '</cpanelaction>';
    }
    if (sFormData.length < 2000) {
        YAHOO.util.Connect.asyncRequest('GET', CPANEL.security_token + '/xml-api/cpanel?' + sFormData , callback);
    } else {
        YAHOO.util.Connect.asyncRequest('POST', CPANEL.security_token + '/xml-api/cpanel' , callback,sFormData);
    }
}

function cpanel_api1_parser(o) {
    var mycallback = o.argument;
    var rootNode = o.responseXML;
    var cpanelresultEl = rootNode.getElementsByTagName('cpanelresult')[0];
    var cpaneldataEl = cpanelresultEl.getElementsByTagName('data')[0];
    var dataresultEl = cpaneldataEl.getElementsByTagName('result')[0];

    var parsed_data;
    if( dataresultEl.firstChild ) { 
        parsed_data = dataresultEl.firstChild.nodeValue;
    }
    if (mycallback) {
        mycallback(parsed_data);
    }
}

function cpanel_api2() {
    var argv = cpanel_api2.arguments;
    var mycallback = argv[0];
    var module = argv[1];
    var func = argv[2];
    var argc = argv.length;
    
    var callback = {
        success: cpanel_api2_parser,
        argument: mycallback
    };

    var sFormData;
    if (use_fast_proto) {
        sFormData = 'cpanel_xmlapi_module=' + encodeURIComponent(module) + '&cpanel_xmlapi_func=' + encodeURIComponent(func) + '&cpanel_xmlapi_apiversion=2';
         for(var i=3;i<argc;i+=2) {
            sFormData += '&' + encodeURIComponent(argv[i]) + '=' + encodeURIComponent(argv[i+1]);
        }
    } else {
        sFormData = 'xmlin=<cpanelaction><apiversion>2</apiversion><module>' + module + '</module><func>' + func + '</func><args>';
        for(var i=3;i<argc;i+=2) {
            sFormData += '<' + argv[i] + '>' + argv[i+1] + '</' + argv[i] + '>';
        }
        sFormData += '</args></cpanelaction>';
    }
    if (sFormData.length < 2000) {
        YAHOO.util.Connect.asyncRequest('GET', CPANEL.security_token + '/xml-api/cpanel?' + sFormData , callback);
    } else {
        YAHOO.util.Connect.asyncRequest('POST', CPANEL.security_token + '/xml-api/cpanel' , callback,sFormData);
    }
}

function cpanel_api2_parser(o) {
    var mycallback = o.argument;
    var rootNode = o.responseXML;
    var cpanelresultEl = rootNode.getElementsByTagName('cpanelresult')[0];
    var cpaneldataEl = cpanelresultEl.getElementsByTagName('data');

    if (mycallback) {
        mycallback(cpaneldataEl);
    }
}
