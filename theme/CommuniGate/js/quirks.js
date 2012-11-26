var quirksmode;
if (navigator.appVersion.indexOf("Safari")!=-1){
    quirksmode = 'Safari';
}
if (navigator.appVersion.indexOf("MSIE")!=-1){
    quirksmode = 'MSIE';
}
if (navigator.appVersion.indexOf("Opera")!=-1 || navigator.userAgent.indexOf("Opera")!=-1){
    quirksmode = 'Opera';
}

function fix_safari_images() {
    var logoimg = document.getElementById('logo-top-logo');
}
if (quirksmode == 'Safari') {
    YAHOO.util.Event.onDOMReady(fix_safari_images);
}
