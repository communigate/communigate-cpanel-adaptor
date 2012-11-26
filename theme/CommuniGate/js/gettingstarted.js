/* ***** BEGIN LICENSE BLOCK *****

# cpanel12 - gettingstarted.js               Copyright(c) 1997-2008 cPanel, Inc.
#                                                           All Rights Reserved.
# copyright@cpanel.net                                         http://cpanel.net
# This code is subject to the cPanel license. Unauthorized copying is prohibited

* ***** END LICENSE BLOCK *****
* ***** BEGIN APPLICABLE CODE BLOCK ***** */

var GETTING_STARTED_PANEL;
var inited_gettingstarted = 0;
var gettingstarted_off = 1;

register_interfacecfg_nvdata('x3_gettingstarted');

var disable_gettingstarted = function() {
   SetNvData("x3_gettingstarted", 'disable');
};

var gettingstarted_init = function() {
   GETTING_STARTED_PANEL = new YAHOO.widget.Panel("gettingstarted_win", { effect:{effect:YAHOO.widget.ContainerEffect.FADE,duration:0.25}, fixedcenter: true, constraintoviewport: true, underlay:"none", close:true, visible:false, draggable:true, modal:false} );
   GETTING_STARTED_PANEL.hideEvent.subscribe(function () {  YAHOO.util.Dom.get('quickjump').focus(); });
   GETTING_STARTED_PANEL.render();
   inited_gettingstarted = 1;
};

var handle_hide_gettingstarted = function() {
   GETTING_STARTED_PANEL.hide();
   YAHOO.util.Dom.get('quickjump').focus();
};

var show_gettingstarted = function() {
   var gettingstartedc = YAHOO.util.Dom.get("gettingstarted-content");
   if (!gettingstartedc) { alert("The 'gettingstarted-content' id is missing"); }
   
   if (!YAHOO.util.Dom.hasClass(gettingstartedc,'mainpopbg')) {
      gettingstartedc.className='mainpopbg content';
   }
   
   var oimgEl = YAHOO.util.Dom.get('ui-getstart-icon_preload');
   if (oimgEl) { oimgEl.id='ui-getstart-icon'; }

   var gettingstarted_winc = YAHOO.util.Dom.get('gettingstarted_win');
   gettingstarted_winc.style.display='block';
   gettingstartedc.style.display='block';
   
   if (inited_gettingstarted != 1) {
      gettingstarted_init();
   }
   
   GETTING_STARTED_PANEL.show();
   gettingstarted_winc.style.width = gettingstartedc.offsetWidth+6;
   gettingstarted_winc.style.height = gettingstartedc.offsetHeight+8;
   
   SetCookie('didgettingstarted',1);
};

var enable_gettingstarted = function() {
   gettingstarted_on = 1;
};

var check_gettingstarted = function() {
   if (NVData['x3_gettingstarted'] != 'disable' && GetCookie('didgettingstarted') != '1') {
      show_gettingstarted();
   }
};

YAHOO.util.Event.onDOMReady(function() {
   enable_gettingstarted();
   check_gettingstarted();
});
