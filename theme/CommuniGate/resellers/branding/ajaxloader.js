
var osmode = 'unix';
var quirksmode = 'Mozilla';
var osCheck = navigator.userAgent.toLowerCase();

if (osCheck.indexOf("win")!=-1 || osCheck.indexOf("Windows")!=-1) {
    osmode = 'win32';
}
if (osCheck.indexOf("mac")!=-1) {    osmode = 'mac';
}
if (navigator.appVersion.indexOf("MSIE")!=-1){
    quirksmode = 'MSIE';    listviewasdiv = 1;
}
if (navigator.appVersion.indexOf("Safari")!=-1){
    quirksmode = 'Safari';
    listviewasdiv = 1;
    osmode = 'mac';
}
if (navigator.appVersion.indexOf("Opera")!=-1 || navigator.userAgent.indexOf("Opera")!=-1){
    quirksmode = 'Opera';
    listviewasdiv = 1;
}

function initAjaxLoader() {
//    if (quirksmode == 'Safari') {
  //      return;
    //}
    var elements = YAHOO.util.Dom.getElementsByClassName('codelink', 'a');


   for(var i=0;i<elements.length;i++) {
        var url =  elements[i].getAttribute('href');
        var cgiurl = url.split('?');
        cgiurl[0] = cgiurl[0].replace(/\.html$/,'-code.html');
        var newurl = cgiurl.join('?'); 
        elements[i].setAttribute('href',newurl);
    } 

}

YAHOO.util.Event.addListener(window, "load", initAjaxLoader );
