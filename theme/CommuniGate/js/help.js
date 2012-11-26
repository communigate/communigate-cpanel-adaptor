/* ***** BEGIN LICENSE BLOCK *****

# cpanel12 - help.js                         Copyright(c) 1997-2008 cPanel, Inc.
#                                                           All Rights Reserved.
# copyright@cpanel.net                                         http://cpanel.net
# This code is subject to the cPanel license. Unauthorized copying is prohibited

 * ***** END LICENSE BLOCK ***** 
  * ***** BEGIN APPLICABLE CODE BLOCK ***** */


var helppanel;
var inited_help = 0;
var help_off=1;

function help_init() {
    helppanel = new YAHOO.widget.Panel("win", {
        effect: { effect: YAHOO.widget.ContainerEffect.FADE, duration:0.25 },
        constraintoviewport: true,
        underlay:            "none",
        close:               true,
        visible:             false,
        draggable:           true,
        dragOnly:            true,
        modal:               false,
        noscroll:            true  //cPanel-specific
    } );
    helppanel.render();
    helppanel.center();
    helppanel.beforeHideEvent.subscribe(handle_hide_help, helppanel, true);
    inited_help=1;
}
function handle_hide_help(el) {
    var helpc = document.getElementById('help-content');
    if (!helpc) { alert("The 'help-content' id is missing"); }
    var winc = document.getElementById('win');
    helpc.style.display='none';
    winc.style.display='none';
}
function show_help() {
    var helpc = document.getElementById('help-content');
    if (!helpc) { alert("The 'help-content' id is missing"); }
    
    var winc = document.getElementById('win');
    winc.style.display='block';
    helpc.style.display='block';

    if (inited_help != 1) {
        help_init();
    }

    helppanel.unsubscribe("show",helppanel.focusFirst);
    helppanel.show();
    winc.style.width = helpc.offsetWidth+6;
    winc.style.height = helpc.offsetHeight+8;
}
function enable_help() {
    help_on = 1;
}

YAHOO.util.Event.onDOMReady(enable_help);

