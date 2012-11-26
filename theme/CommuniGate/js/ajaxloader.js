/* ***** BEGIN LICENSE BLOCK *****

# cpanel12 - ajaxloader.js                   Copyright(c) 1997-2008 cPanel, Inc.
#                                                           All Rights Reserved.
# copyright@cpanel.net                                         http://cpanel.net
# This code is subject to the cPanel license. Unauthorized copying is prohibited

 * ***** END LICENSE BLOCK ***** 
  * ***** BEGIN APPLICABLE CODE BLOCK ***** */

var ajaxloader_on = 0;

function initAjaxLoader() {
    if (! ajaxloader_on) { return; }

    var elements = YAHOO.util.Dom.getElementsByClassName('ajaxlink', 'a');
    var elementsmail = YAHOO.util.Dom.getElementsByClassName('ajax-mail', 'a');
    var elementsfiles = YAHOO.util.Dom.getElementsByClassName('ajaxfiles', 'a');
    var elementshide = YAHOO.util.Dom.getElementsByClassName('noscript', 'div');

    for(var i=0;i<elementshide.length;i++) {
        elementshide[i].style.display='none';
    }

    for(var i=0;i<elementsfiles.length;i++) {
        var url =  elementsfiles[i].getAttribute('href');
        var cgiurl = url.split('?');
        cgiurl[0] = cgiurl[0].replace(/\/files\//,'/filemanager/');
        var newurl = cgiurl.join('?');
        elementsfiles[i].setAttribute('href',newurl);
    }

    for(var i=0;i<elementsmail.length;i++) {
        var url =  elementsmail[i].getAttribute('href');
        var cgiurl = url.split('?');
        cgiurl[0] = cgiurl[0].replace(/\.html$/,'-ajax.html');
        var newurl = cgiurl.join('?');
        elementsmail[i].setAttribute('href',newurl);
    }

    for(var i=0;i<elements.length;i++) {
        var url =  elements[i].getAttribute('href');
        var cgiurl = url.split('?');
        cgiurl[0] = cgiurl[0].replace(/\.html$/,'-ajax.html');
        var newurl = cgiurl.join('?');
        elements[i].setAttribute('href',newurl);
    }
};
YAHOO.util.Event.onDOMReady(initAjaxLoader);
