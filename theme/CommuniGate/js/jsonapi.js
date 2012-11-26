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
