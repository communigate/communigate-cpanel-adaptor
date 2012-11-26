
var popupwindows = {};


function popupwindow_init(Elid,pixels) {
    var Elid;
    if (popupwindows[Elid]) { return; }
    if (!pixels) { pixels='500px'; }
    document.getElementById(Elid).style.display='';
    popupwindows[Elid] = new YAHOO.widget.Dialog(Elid, { effect:{effect:YAHOO.widget.ContainerEffect.FADE,duration:0.25}, width: pixels, buttons : [ { text:"Close", handler:function() { popupwindows[Elid].hide(); }, isDefault:true } ], fixedcenter: true, constraintoviewport: true, underlay:"none", close:true, visible:false, draggable:true, modal:false} );
    popupwindows[Elid].render();
    popupwindows[Elid].beforeHideEvent.subscribe(handle_hide_popupwindow, Elid, true);
}
function handle_hide_popupwindow(ev,inc,Elid) {
    set_popup_display(Elid,'none');
}
function set_popup_display(Elid,dstyle) {
    var Elc = document.getElementById(Elid + '-content');
    if (!Elc) { alert("The " + Elid + "'-content' id is missing"); }
    Elc.style.display=dstyle;
    
    var winc = document.getElementById(Elid + '_win');
    if (!winc) { return; }
    winc.style.display=dstyle;
}
function popupwindow_hide(Elid) {
    popupwindows[Elid].hide();
}
function popupwindow_show(Elid) {
    set_popup_display(Elid,'');
    popupwindows[Elid].render();
    popupwindows[Elid].show();
}
