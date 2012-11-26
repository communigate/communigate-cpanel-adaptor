var NativeJson = Object.prototype.toString.call(this.JSON) === '[object JSON]' && this.JSON;
function fastJsonParse (s, reviver) {
          return NativeJson ?
        NativeJson.parse(s,reviver) : YAHOO.lang.JSON.parse(s,reviver);
}
/* ***** BEGIN LICENSE BLOCK *****

# cpanel12 - interfacereset.js                  Copyright(c) 1997-2008 cPanel, Inc.
#                                                           All Rights Reserved.
# copyright@cpanel.net                                         http://cpanel.net
# This code is subject to the cPanel license. Unauthorized copying is prohibited

 * ***** END LICENSE BLOCK ***** 
  * ***** BEGIN APPLICABLE CODE BLOCK ***** */


var interfaceConfigs = [];
function register_interfacecfg_nvdata(nvname) {
    interfaceConfigs.push(nvname);
}

var reset_all_interface_settings = function() {
    register_interfacecfg_nvdata("x3_litegraphics");
    register_interfacecfg_nvdata("x3_hideicons");
    
    var sFormData = 'names=' + interfaceConfigs.join('|');
    for(var i=0;i<interfaceConfigs.length;i++) {
        sFormData += '&' + interfaceConfigs[i] + '=';
        NVData[interfaceConfigs[i]]='';
    }
    
    // refresh the page once the ajax call completes
    var callback = {
        success : function(o) {
            window.location.reload(true);
        }
    };    
    YAHOO.util.Connect.asyncRequest('POST', 'nvset.xml', callback, sFormData); 
};

register_interfacecfg_nvdata('ignorecharencoding');
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
/* ***** BEGIN LICENSE BLOCK *****

# cpanel12 - boxes_combined.js                Copyright(c) 1997-2008 cPanel, Inc.
#                                                           All Rights Reserved.
# copyright@cpanel.net                                         http://cpanel.net
# This code is subject to the cPanel license. Unauthorized copying is prohibited

 * ***** END LICENSE BLOCK ***** 
  * ***** BEGIN APPLICABLE CODE BLOCK ***** */

register_interfacecfg_nvdata('xmainrollstatus');
register_interfacecfg_nvdata('xmaingroupsorder');

if ( typeof BOX_CONTAINER === 'undefined' ) {
    var BOX_CONTAINER_ID = 'boxes';
}
if ( typeof DEFAULT_BOX_ORDER === 'undefined' ) {
    var DEFAULT_BOX_ORDER = 'pref|mail|logs|files|domains|db|sec|software|advanced'.split('|');
};

var Box_Container;
var Box_Order = get_box_order();
var Boxes;
var Collapsed_Boxes = {};
NVData.xmainrollstatus.split('|').forEach( function(i) {
    var the_match = i.match(/^(.*)=0$/);
    if ( the_match ) Collapsed_Boxes[ the_match[1] ] = true;
} );

var Rolling_Boxes = {};
function rollbox (clicked_el,no_nvdata) {
    var box_el = DOM.getAncestorByClassName(clicked_el,'itembox');
    var box_id = box_el.id;

    if ( box_id in Rolling_Boxes ) return;
    Rolling_Boxes[box_id] = true;

    //DOM traversal is necessary because the proxy elements create multiple
    //elements with the same ID
    var h_el = box_el.getElementsByTagName('h6')[0];
    var exp_el = DOM.getNextSibling(h_el);
    var body_el = DOM.getNextSibling(h_el.parentNode);
    var was_originally_open = DOM.hasClass(exp_el,'box-collapse-control');
    if ( box_id in Collapsed_Boxes ) {
        var fade = CPANEL.animate.fade_in(body_el);
        var slide = CPANEL.animate.slide_down(body_el, function() {
            fade.stop(true);
            delete Rolling_Boxes[box_id];
        });
        DOM.removeClass(h_el, 'no_bottom_border');
        var rotation_attrs = was_originally_open
            ? { from: 180, to: 360 }
            : { from: 0, to: 180 }
        ;
        var rotation = new CPANEL.animate.Rotation( exp_el, rotation_attrs, 0.2 );
        rotation.animate();
        delete Collapsed_Boxes[box_id];
    }
    else {
        var fade = CPANEL.animate.fade_out(body_el);
        var slide = CPANEL.animate.slide_up(body_el, function() {
            fade.stop(true);
            DOM.addClass(h_el, 'no_bottom_border');
            delete Rolling_Boxes[box_id];
        } );
        var rotation_attrs = was_originally_open
            ? { from: 360, to: 180 }
            : { from: 180, to: 0 }
        ;
        var rotation = new CPANEL.animate.Rotation( exp_el, rotation_attrs, 0.2 );
        rotation.animate();
        Collapsed_Boxes[box_id] = true;
    }

    if (!no_nvdata) setboxstatus();
}

//NOTE: Doesn't impact NVData or Collapsed_Boxes, just sets the visuals
function raw_set_box (box_el,to_expand) {
    var h_el = box_el.getElementsByTagName('h6')[0];
    var exp_el = DOM.getNextSibling(h_el);
    var body_el = DOM.getNextSibling(h_el.parentNode);
    if ( to_expand ) {
        body_el.style.display = "";
        DOM.removeClass(h_el, 'no_bottom_border');
        DOM.replaceClass(exp_el,'box-expand-control','box-collapse-control');
    }
    else {
        body_el.style.display = "none";
        DOM.addClass(h_el, 'no_bottom_border');
        DOM.replaceClass(exp_el,'box-collapse-control','box-expand-control');
    }
}

function x3_DDItem () {
    x3_DDItem.superclass.constructor.apply(this,arguments);
};
YAHOO.extend(x3_DDItem, CPANEL.dragdrop.DDItem, {
    endDrag: function() {
        x3_DDItem.superclass.endDrag.apply(this,arguments);
        var new_order = get_box_order();

        if ( new_order.toString() !== Box_Order.toString() ) {
            Box_Order = new_order;
            CPANEL.nvdata.set('xmaingroupsorder',Box_Order.join('|'));
        }
    }
} );

function init_boxes () {
    for (var id in Collapsed_Boxes) {
        raw_set_box(document.getElementById(id),false);
    }

    Box_Container = document.getElementById(BOX_CONTAINER_ID);

    if ( !Box_Container ) return;

    var dd = CPANEL.dragdrop.containers(Box_Container,undefined,{
        item_constructor: x3_DDItem,
        dragElId: 'menu_drag_el',
        placeholder: 'drag_placeholder',
        animation_proxy_class: 'anim_proxy'
    });
    for ( var i=0; i<dd.items.length; i++ ) {
        var cur_item = dd.items[i];
        var item_body_el = DOM.get( cur_item.getEl().id + '-body' )
        DOM.addClass(item_body_el,'cellbox-body');
        dd.items[i].addInvalidHandleClass('cellbox-body');
    }
}

function get_box_order () {
    return DOM.getElementsByClassName('itembox','div',Box_Container)
        .map( function(el) { return el.id } );
}

//used from jumpbox.js
function restoreboxes () {
    for (var id in Collapsed_Boxes) {
        raw_set_box(document.getElementById(id),false);
    }
}

//used from jumpbox.js
function tempexpandboxes () {
    for (var id in Collapsed_Boxes) {
        raw_set_box(document.getElementById(id),true);
    }
}

function expandallboxes () {
    for (var id in Collapsed_Boxes) {
        //set no_nvdata to true
        rollbox(document.getElementById(id).getElementsByTagName('h6')[0],true);
    }
    setboxstatus();
};

//TODO: Animate this
function defaultorder () {
    Box_Order = DEFAULT_BOX_ORDER;
    for (var b=0; b<Box_Order.length; b++) {
        Box_Container.appendChild( DOM.get(Box_Order[b]) );
    }
    CPANEL.nvdata.set('xmaingroupsorder', Box_Order.join('|'));
};


function setboxstatus () {
    var collapsed_list_txt = CPANEL.util.keys(Collapsed_Boxes)
        .map( function(c) { return c+'=0' } )
        .join('|')
    ;
    CPANEL.nvdata.set('xmainrollstatus',collapsed_list_txt);
}


function showorder () {
    alert("The order now is: " + Box_Order.join(" ") + ".");
}


function reload_this_page () {
    var rrnum=Math.floor(Math.random()*11111111);
    var href = window.location.href.replace(/[&?]keyid=[^=]*/,"");
    href += (href.indexOf('?') !== -1) ? '&' : '?';
    href += 'keyid='+rrnum;
    window.location.href = href;
}
function hideicons() {
     SetNvData("x3_hideicons", 1, reload_this_page);
}
function showicons() {
     SetNvData("x3_hideicons", 0, reload_this_page);
}
function hidegraphics() {
     SetNvData("x3_litegraphics", 1, reload_this_page);
}
function showgraphics() {
     SetNvData("x3_litegraphics", 0, reload_this_page);
}

YAHOO.util.Event.onDOMReady(init_boxes);
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
// build a progress bar for a div, only builds if the element contains elements with classnames "stats_progress_bar_percent" and "stats_progress_bar_text"
var build_progress_bar = function(el) {
	var percent_el = YAHOO.util.Dom.getElementsByClassName("cpanel_widget_progress_bar_percent", "div", el);
    
    for (var i in percent_el) {
        var percent = percent_el[i].innerHTML;
        if (CPANEL.validate.positive_integer(percent)) {
            CPANEL.widgets.progress_bar(el, percent, '', '{"inverse_colors":"true"}');
        }
    }
};

// build the progress bars on the page
var build_progress_bars = function(root_el) {
    // find all the elements with class "stats_progress_bar" in the root_el element and builds their progress bar(s)
	YAHOO.util.Dom.getElementsByClassName("stats_progress_bar", "div", root_el, build_progress_bar);
};

// destroy progress bars (needed for ie animation bug)
var destroy_progress_bars = function(root_el) {
    YAHOO.util.Dom.getElementsByClassName("cpanel_widget_progress_bar", "div", root_el, function(el) {
        YAHOO.util.Dom.get(el).innerHTML = '';
    });
};

// grab the extended stats with an AJAX call
var fetch_extended_stats = function() {
	// show the loading icon
	YAHOO.util.Dom.setStyle("toggle_extended_stats", "display", "none");
	YAHOO.util.Dom.setStyle("extended_stats_loading_icon", "display", "block");
	YAHOO.util.Dom.get("extended_stats_loading_icon").innerHTML = CPANEL.icons.ajax + ' loading...';
	
	// create the callback functions
	var callback = {
		success : function(o) {
			YAHOO.util.Dom.get("extended_stats").innerHTML = o.responseText;
            
            /*
                disabled per case 32783: now done on the backend
                CPANEL.util.zebra(["stats", "extended_stats"], "info-even", "info-odd");
            */
			build_progress_bars("stats_extended");
			expand_extended_stats();
		},

		failure : function(o) {
			YAHOO.util.Dom.get("extended_stats_loading_icon").innerHTML = '';
			YAHOO.util.Dom.setStyle("toggle_extended_stats", "display", "block");
			YAHOO.util.Dom.get("toggle_extended_stats").innerHTML = "AJAX Failure: click to try again";
		},
        
        timeout: 3000
	};
  
	// send the AJAX request
	YAHOO.util.Connect.asyncRequest('GET', "extended_statsbar.html?secpolicy_ui=no&rowcounter=mainstats&rowcountervalue=" + ROWCOUNTER['mainstats'], callback, null);	
};

// function to run after the expand animation has finished
var finish_expand_extended_stats = function() {
    
    // build the progress bars in IE (trailing animation bug)
    if (YAHOO.env.ua.ie > 5 && YAHOO.env.ua.ie < 8) {
        build_progress_bars("stats_extended");
    }
    
    // update the toggle text
	YAHOO.util.Dom.get("toggle_extended_stats").innerHTML = "collapse stats";
	YAHOO.util.Dom.setStyle("toggle_extended_stats", "display", "");
	YAHOO.util.Dom.setStyle("extended_stats_loading_icon", "display", "none");
	
	// swap the up/down arrow
	YAHOO.util.Dom.replaceClass("toggle_extended_stats_img", "box-expand-control", "box-collapse-control");
	
	// set the environment variable
	SetNvData("xstatscollapsed", "expanded");
    
    // set the state to shown
    YAHOO.util.Dom.get("extended_stats_state").innerHTML = "shown";
};

// function that starts the expand animation
var expand_extended_stats = function() {
    // set the state to animating
    YAHOO.util.Dom.get("extended_stats_state").innerHTML = "animating";
    
	// hide the loading icon
	YAHOO.util.Dom.get("toggle_extended_stats").innerHTML = '';
	
    // start the show animation
	var auto_height = CPANEL.animate.getAutoHeight("extended_stats");
	YAHOO.util.Dom.setStyle("extended_stats", "height", "0px");
	YAHOO.util.Dom.setStyle("extended_stats", "display", "block");
	var attributes = {
		height: { to: auto_height, units: "px" }
	};
	var anim = new YAHOO.util.Anim("extended_stats", attributes, "0.5", YAHOO.util.Easing.easeOutStrong);
	anim.onComplete.subscribe(finish_expand_extended_stats);
	anim.animate();
};

// function to run after the hide animation has finished
var finish_hide_extended_stats = function() {
    // update the toggle text
	YAHOO.util.Dom.get("toggle_extended_stats").innerHTML = "expand stats";
	
	// swap the up/down arrow
	YAHOO.util.Dom.replaceClass("toggle_extended_stats_img", "box-collapse-control", "box-expand-control");
	
	// set the environment variable
	SetNvData("xstatscollapsed", 'collapsed');
    
    // set the state to hidden
    YAHOO.util.Dom.get("extended_stats_state").innerHTML = "hidden";
};

// function to start the hide animation
var hide_extended_stats = function() {
    
    // destroy the progress bars in IE (trailing animation bug)
    if (YAHOO.env.ua.ie > 5 && YAHOO.env.ua.ie < 8) {
        destroy_progress_bars("extended_stats");
    }
    
    // set the state to animating
    YAHOO.util.Dom.get("extended_stats_state").innerHTML = "animating";    
    
    // hide toggle text
	YAHOO.util.Dom.get("toggle_extended_stats").innerHTML = "";
    
    // begin the hide animation
	var attributes = {
		height: { to: "0", units: "px" }
	};
	var anim = new YAHOO.util.Anim("extended_stats", attributes, "0.5", YAHOO.util.Easing.easeOutStrong);
	anim.onComplete.subscribe(finish_hide_extended_stats);
	anim.animate();
};

// toggle extended stats expansion/hide
var toggle_extended_stats = function() {
	YAHOO.util.Dom.get("toggle_extended_stats").blur();
    var state = YAHOO.util.Dom.get("extended_stats_state").innerHTML;
	if (state == "hidden") {
		if (YAHOO.util.Dom.get("extended_stats").innerHTML == "") {
			fetch_extended_stats();
		}
		else {
			expand_extended_stats();
		}
	}
	else if (state == "shown") {
		hide_extended_stats();
	}
};

// omDOMReady function
var init_extended_stats = function() {
	// disable the expand/collapse links if JS is enabled
	YAHOO.util.Event.on("toggle_extended_stats", "click", function(e) { YAHOO.util.Event.preventDefault(e); });
	
	// add event handlers to toggle extended stats
    YAHOO.util.Event.on(["toggle_extended_stats","stats-header"], "click", toggle_extended_stats);
	
    // build all progress bars in the main stats
    build_progress_bars("content-stats");
	
	// set the initial state of extended stats
	register_interfacecfg_nvdata("xstatscollapsed");
	if (NVData['xstatscollapsed'] == "expanded" && YAHOO.util.Dom.get("extended_stats").innerHTML == "") {
		fetch_extended_stats();
	}
     
    /*
       disabled per case 32783: now done on the backend
       zebra-stripe the rows
       CPANEL.util.zebra(["stats", "extended_stats"], "info-even", "info-odd");
     */
};
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

# cpanel12 - truncate.js                     Copyright(c) 1997-2008 cPanel, Inc.
#                                                           All Rights Reserved.
# copyright@cpanel.net                                         http://cpanel.net
# This code is subject to the cPanel license. Unauthorized copying is prohibited

 * ***** END LICENSE BLOCK ***** 
  * ***** BEGIN APPLICABLE CODE BLOCK ***** */


var maxwidth = 710;
var truncate_fontsize = 11;
var quirksmode = 'Mozilla';
if (navigator.appVersion.indexOf("Safari")!=-1){
    quirksmode = 'Safari';
}
if (navigator.appVersion.indexOf("MSIE")!=-1){
    quirksmode = 'MSIE';
}
if (navigator.appVersion.indexOf("Opera")!=-1 || navigator.userAgent.indexOf("Opera")!=-1){
    quirksmode = 'Opera';
}


function getRegion(el) {
    if (quirksmode == 'Safari' && el.cells && el.cells[0]) {
        var p = YAHOO.util.Dom.getXY(el.cells[0]);
        var t = p[1];
        var r = p[0];
        for(var i = 0; i < el.cells.length ; i++) {
            r += el.cells[i].offsetWidth;
        }
        var b = p[1] + el.cells[0].offsetHeight;
        var l = p[0];

        return new YAHOO.util.Region(t, r, b, l);
    }
    return YAHOO.util.Region.getRegion(el);
}

var truncate_on = 0;
var truncate_tooltips = 0;
var truncate_wrap = 1;
var truncate_start_row = 1;
var truncatetables = [];
var truncatetableids = [];

function post_register_truncate_tables() {
    for(var i=0;i<truncatetableids.length;i++) {
        var thistbl = document.getElementById(truncatetableids[i]);
        if (!thistbl) {
            alert("truncate.js: Table not found " + truncatetableids[i]);
        } else {
            truncate_on=1;
            var hastbl = 0;
            for(var i=0;i<truncatetables.length;i++) {
                if (truncatetables[i].id==thistbl.id) {
                    hastbl=1;
                }
            }
            if (!hastbl) {
                truncatetables.push(thistbl);
            }
        }
    }
}

function register_truncate_table(tid) {
    truncatetableids.push(tid);
}

function truncater(){
    post_register_truncate_tables();
    if (! truncate_on) { return; }

    var ttid = 0;
    var fontwidth = 1.50;
    if (!truncatetables) { return; }        
    for(var t=0;t<truncatetables.length;t++) {
        if (truncatetables[t].rows.length > 1000) { continue; }
        var fixedtruncate = 0;
        if (truncatetables[t].getAttribute('fixedtruncate')) {
            fixedtruncate = 1;
        }
        var truncaterows = truncatetables[t].rows;
        var rowRegion = getRegion(truncaterows[0]); 
        var rowWidth = (rowRegion.right - rowRegion.left);
        for (var i = truncate_start_row; i < truncaterows.length; i++){
            if (!fixedtruncate && rowWidth < maxwidth) { continue; } 

            var cellsWidth = 0;
            var truncateRows = [];
            var truncatePercent = [];
            for(var j=0;j<truncaterows[i].cells.length;j++) {
                if (! YAHOO.util.Dom.hasClass(truncaterows[i].cells[j],"truncate")) {
                    /* usually I want to mash IE but this is a safari bug */
                    var cw = truncaterows[i].cells[j].offsetWidth;
                    if (cw && !isNaN(cw)) {
                        cellsWidth+=cw;
                    }                
                } else {
                    truncateRows.push({row:truncaterows[i].cells[j],fixed:truncaterows[i].cells[j].getAttribute('truncatefixed'),percent:truncaterows[i].cells[j].getAttribute('truncate')});
                }
            }
            var newcellWidth = (maxwidth - cellsWidth);
            var fontsize = parseInt(truncaterows[i].style.fontSize) || truncate_fontsize;
                
            for(var j=0;j<truncateRows.length;j++) {
                var cellContents;
                var newLength;
                if (truncateRows[j].fixed) {
                    newLength = parseInt(truncateRows[j].fixed);
                } else {
                    var cellPercentage = truncateRows[j].percent;
                    if (!cellPercentage) { cellPercentage = 100 / truncateRows.length; }
                    var thisCellWidth = newcellWidth * (cellPercentage / 100); 
                    newLength = parseInt(thisCellWidth / (fontsize / fontwidth));
                }
                cellContents = getFirstTextNode(truncateRows[j].row);
                if (!cellContents) { continue; /* empty cell */ }
                cellText = cellContents.nodeValue;
                if (!cellText) { continue; }

                if (newLength + 2 >= cellText.length) { continue; }
                if (newLength < 17) { newLength = 17; }
                truncateRows[j].row.removeAttribute('nowrap');

                var tspan = document.createElement('span');
                tspan.innerHTML=break_text(cellText,newLength,truncate_wrap);

                var myParent = cellContents.parentNode;
                myParent.removeChild(cellContents);
                myParent.appendChild(tspan);

                while(tspan.offsetWidth > newcellWidth && newLength > 17) {
                    newLength--;
                    if (newLength < 4) { break; }
                    tspan.innerHTML=break_text(cellText,newLength,truncate_wrap);
                }
                if (truncate_tooltips) {
                    var overimg = document.createElement('img');
                    overimg.src="/frontend/" + thisTheme + "/images/arrow-right.gif";
                    overimg.style.display='inline';
                    overimg.setAttribute('title',cellText);

                    truncateRows[j].row.appendChild(overimg);
                    ttid++;
                    var tooltip = new YAHOO.widget.Tooltip("truncate_tt" + ttid,  
                            { context:overimg,  
text:cellText }); 
                }
            }
        }
    }
}


function getFirstTextNode(el) {
    var l = el.childNodes.length;
    for (var i = 0; i < l; i++) {
        switch (el.childNodes[i].nodeType) {
            case 1: //ELEMENT_NODE
                var thisnode = getFirstTextNode(el.childNodes[i]);
                if (thisnode) { return thisnode; }
                break;
            case 3: //TEXT_NODE
                return el.childNodes[i];
                break;
        }
    }
}


function break_text(cellText,newLength,truncate_wrap) {        
	var startpt = 0;
	var newText = '';
    if (newLength < 4) { return cellText; }
    while(1) {
		newText += cellText.substr(startpt,newLength);
		if (truncate_wrap) {
			startpt += newLength;
			if (startpt >= cellText.length || startpt > 4096) {
				break;
			}
			newText += "<br />";
		} else {
			break;
		}
	}
	if (truncate_wrap) { newText+=" "; }
	return newText;
}

YAHOO.util.Event.onDOMReady(truncater);
var optionselectpanel;
var inited_optionselect = 0;
var optionselect_off=1;
var currentoption;
var submitwait = 0;
var optionsubmit_ok = 0;

for(var opname in optionselect_list) {
    register_interfacecfg_nvdata('optionselect_' + opname);
}

function optionselect_init() {
    optionselectpanel = new YAHOO.widget.Panel("optionselect_win", { effect:{effect:YAHOO.widget.ContainerEffect.FADE,duration:0.25}, fixedcenter: true, constraintoviewport: true, underlay:"none", close:true, visible:false, draggable:true, modal:false} );
    optionselectpanel.render();
    optionselectpanel.beforeHideEvent.subscribe(handle_hide_optionselect, optionselectpanel, true);
    inited_optionselect=1;
    for(var imgid in optionselect_images) {
        document.getElementById('postloadimg_' + imgid).src=optionselect_images[imgid];
    }
}
function handle_hide_optionselect(el) {
    var optionselectc = document.getElementById('optionselect-content');
    if (!optionselectc) { alert("The 'optionselect-content' id is missing"); }
    var winc = document.getElementById('optionselect_win');
    optionselectc.style.display='none';
    winc.style.display='none';
}
function build_optionform(optionname,optionval,domain) {
    var oplist = optionselect_list[optionname];
    if (optionval == 'homedir') {
           document.getElementById('optionselect_dir').value=homedir;
    } else if (optionval == 'webroot') {
           document.getElementById('optionselect_dir').value=homedir + '/public_html';
    } else if (optionval == 'ftproot') {
           document.getElementById('optionselect_dir').value=homedir + '/public_ftp';
    }
    var formEl = document.getElementById('optionselect_form');
    formEl.action=oplist.url;
    formEl.target=oplist.target;
}

function getoptionselectval() {
    var dirselectEl = document.getElementById('optionselect_form').dirselect;
    if (dirselectEl[0].checked) {
        return 'homedir';
    } else if (dirselectEl[1].checked) {
        return 'webroot';
    } else if (dirselectEl[2].checked) {
        return 'ftproot';
    } else if (dirselectEl[3].checked) {
        return 'domainrootselect';
    }
    return 'webroot';
}
function getoptionselectdomain() {
    var dsEl = document.getElementById('optionselect_domainselect');
    return dsEl.options[dsEl.selectedIndex].value;
}

function getoptionname() {
        return currentoption;
}

function submit_option_form_handler(optionname) {
    var oplist = optionselect_list[optionname];
    if (oplist.target == '') {
        window.location.href = oplist.url + '?dir=' + document.getElementById('optionselect_dir').value;
    } else {
        var formEl = document.getElementById('optionselect_form');
        formEl.submit();
    }
}
function updatedir_fromdomain() {
    var domain = getoptionselectdomain();
    document.getElementById('optionselect_go').disabled=true;
    document.getElementById('optionselect_go').className='input-button-disabled';
    cpanel_api2(docrootcallback,'DomainLookup','getdocroot','domain',domain);
}


function save_optionselect_form(skipnvset) {
    var optionval = getoptionselectval();    
    var optionname = getoptionname(); 
    var domain = getoptionselectdomain();
    if (!skipnvset) {
        SetNvData('optionselect_' + optionname, optionval + ':' + domain + ':' + (document.getElementById('optionselect_saved').checked ? 1 : 0) + ':' + (document.getElementById('optionselect_showhidden').checked ? 1 : 0));
    }
}

function submitoptionform(dosubmit) {
    var optionval = getoptionselectval();    
    var optionname = getoptionname(); 
    var domain = getoptionselectdomain();
    build_optionform(optionname,optionval,domain);
    var oplist = optionselect_list[optionname];
    if (oplist.target == '') {
        SetCookie('showdotfiles',(document.getElementById('optionselect_showhidden').checked ? 1 : 0));
        optionselectpanel.hide();
        window.location.href = oplist.url + '?dir=' + document.getElementById('optionselect_dir').value;
        return false;
    } else {
        SetCookie('showdotfiles',(document.getElementById('optionselect_showhidden').checked ? 1 : 0));
        if (dosubmit) {
            document.getElementById('optionselect_form').submit();
        }
        optionselectpanel.hide();
        return true;
    }
}

function docrootcallback(result) {
    var dir = homedir;
    var dirEl = result[0].getElementsByTagName('docroot')[0];
    if (dirEl.firstChild) {
        dir = dirEl.firstChild.nodeValue;
    }
    if (!dir) { dir=homedir; }

    document.getElementById('optionselect_dir').value=dir;
    document.getElementById('optionselect_go').disabled=false;
    document.getElementById('optionselect_go').className='input-button';
    save_optionselect_form();
}

function show_optionselect(optionname) {
    var currentsetting = NVData['optionselect_' + optionname];
    var optionval = (currentsetting.split(':'))[0];
    var domain = (currentsetting.split(':'))[1];
    var optionsaved = (currentsetting.split(':'))[2];
    var optionshowhidden = (currentsetting.split(':'))[3];
    currentoption=optionname;
   
    if (self['checkFAA']) { checkFAA(); } 
    
    var optionselectc = document.getElementById('optionselect-content');
    if (!optionselectc) { alert("The 'optionselect-content' id is missing"); }

    if (!YAHOO.util.Dom.hasClass(optionselectc,'mainpopbg')) {
        optionselectc.className='mainpopbg content';
    }


    var winc = document.getElementById('optionselect_win');
    winc.style.display='block';
    optionselectc.style.display='block';

    if (inited_optionselect != 1) {
        optionselect_init();
    }

    optionselectpanel.show();
    winc.style.width = optionselectc.offsetWidth+6;
    winc.style.height = optionselectc.offsetHeight+8;

    var oplist = optionselect_list[optionname];
    var showlist = oplist.show;
    for(var i=0;i<showlist.length;i++) {
        document.getElementById('optionselect_' + showlist[i]).style.display='';
    }
    document.getElementById('optionselect_namehdr').innerHTML=oplist.name;
    document.getElementById('optionselect_namecheck').innerHTML=oplist.name;

    restore_optionform(optionname,optionval,optionsaved,optionshowhidden,domain);

    if (optionsaved == '1' || optionselect_autogo) {
        submitoptionform(1);
        return;
    }

}

function restore_optionform(optionname,savedoptionval,optionsaved,optionshowhidden,domain) {
    var dirselectEl = document.getElementById('optionselect_form').dirselect;
    if (savedoptionval == 'homedir') {
        dirselectEl[0].checked=true;
    } else if (savedoptionval == 'webroot') {
        dirselectEl[1].checked=true;
    } else if (savedoptionval == 'ftproot') {
        dirselectEl[2].checked=true;
    } else if (savedoptionval == 'domainrootselect') {
        dirselectEl[3].checked=true;
    } else {
        dirselectEl[1].checked=true;
    }
    var dsEl = document.getElementById('optionselect_domainselect');
    for(var i=0;i<dsEl.options.length;i++) {
        if (dsEl.options[i].value == domain) {
            dsEl.selectedIndex = i;
        }
    }
    if (optionsaved == '1') {
        document.getElementById('optionselect_saved').checked = true;
    } else {
        document.getElementById('optionselect_saved').checked = false;
    }
    if (optionshowhidden == '1') {
        document.getElementById('optionselect_showhidden').checked = true;
    } else {
        document.getElementById('optionselect_showhidden').checked = false;
    }
    if (savedoptionval == 'domainrootselect') { updatedir_fromdomain(); }
}

function enable_optionselect() {
    optionselect_on = 1;
}

YAHOO.util.Event.onDOMReady(enable_optionselect);/* ***** BEGIN LICENSE BLOCK *****

# cpanel12 - jumpbox.js                      Copyright(c) 1997-2008 cPanel, Inc.
#                                                           All Rights Reserved.
# copyright@cpanel.net                                         http://cpanel.net
# This code is subject to the cPanel license. Unauthorized copying is prohibited

 * ***** END LICENSE BLOCK ***** 
  * ***** BEGIN APPLICABLE CODE BLOCK ***** */

register_interfacecfg_nvdata('x3finder');

function collapse() {
    /* Needs to be implmented in 11.6 */
    /* Should use /xml-api/cpanel to set nvdata */
    /* import xml-api.js */
}
/*perhaps some yui auto complete here as well */
var idgen = 0;

var ElementTextCache = {};
var tblParentCache = {};
var JumpEl;
var jumpcount = 0;

var insearch = 0;

function searchpage(searchBoxEl) {
    var searchText = searchBoxEl.value.toLowerCase();
    var rootSearchElement = document.getElementById('boxes');
    if (!rootSearchElement) {
        rootSearchElement = document.getElementById('x');
    }
    
    var liEls = rootSearchElement.getElementsByTagName('div');
    var matchCount = 0;
    var allParentUls = {};
    var matchedParentUls = {};
    var matchEl;

    if (! insearch) { 
		/* call to boxes_combined.js */
        tempexpandboxes();
        insearch = 1;
        if (NVData['x3finder'] != 'off') {
			SetNvData('x3finder', 'off');
		}
    }

    if (! searchText) {
        /* call to boxes_combined.js */
        restoreboxes();
        insearch = 0;
        document.getElementById('clearlnk').style.display = 'none';
    }
	
    for (var i = 0; i < liEls.length; i++) {
	    if (YAHOO.util.Dom.hasClass(liEls[i],'item') == false) continue;
		
        var innerText;
        if (! ElementTextCache[liEls[i].id] || ElementTextCache[liEls[i].id] == "") {
			// add the innerHTML text to the search cache
            innerText = liEls[i].innerHTML.replace(/\<[^\>]+\>/g,'').toLowerCase();
			
			// add the additional search text if it exists
			var additional_search_text = '';
			var additional_search_text_el = YAHOO.util.Dom.getFirstChildBy(liEls[i], function(e) { return YAHOO.util.Dom.hasClass(e, "additional_search_text"); });
			if (additional_search_text_el == true) {
				additional_search_text = additional_search_text_el.innerHTML;
			}
			innerText += " " + additional_search_text;
			
            ElementTextCache[liEls[i].id] = innerText;
        }
		else {
            innerText = ElementTextCache[liEls[i].id];
        }

        var tblParent = getTblParent(liEls[i]);
        if (innerText.match(searchText)) {
            matchEl = liEls[i];
            matchCount++;

            YAHOO.util.Dom.removeClass(liEls[i], 'searchhide');
            matchedParentUls[tblParent.id] = 1;
            allParentUls[tblParent.id] = tblParent;
        }
		else {
            allParentUls[tblParent.id] = tblParent;
            YAHOO.util.Dom.addClass(liEls[i], 'searchhide');
        }
    }
    if (matchCount == 0) {
        document.getElementById('gosearch').style.display = '';
    }
	else {
        document.getElementById('gosearch').style.display = 'none';
    }
    if (searchText) {
        document.getElementById('clearlnk').style.display = '';
    }
	
	//for (var i = 0; i < allParentUls.length; i++) {
	for (var i in allParentUls) {
        if (matchedParentUls[i]) {
            YAHOO.util.Dom.removeClass(allParentUls[i], 'searchhide');
        }
		else {
			YAHOO.util.Dom.addClass(allParentUls[i], 'searchhide');
        }
    }
}

function getTblParent(tagEl) {
    if (!tagEl.id) { 
        tagEl.id = 'idgen' + idgen++;
    }
    if (tblParentCache[tagEl.id]) { return tblParentCache[tagEl.id]; } 
    
    var thisEl = tagEl;
    while((thisEl.tagName != "DIV" || !YAHOO.util.Dom.hasClass(thisEl,'itembox')) && thisEl.parentNode) {
        thisEl = thisEl.parentNode;
    }
    tblParentCache[tagEl.id] = thisEl;
    return thisEl;
}

function clearsearch() {
    var quickJumpEl = document.getElementById('quickjump');
    quickJumpEl.value='';
    searchpage(quickJumpEl);
/* call to boxes_combined.js */
    restoreboxes();
    insearch = 0;
}

function gosearch() {
    var lnkEls = jumpEl.getElementsByTagName('a');
    if (! lnkEls[0].name) {
        lnkEls[0].name = 'jump' + jumpcount++;
    }
    window.location.href='#' + lnkEls[0].name;
}

function focus_quickjump() {
    var quickJumpEl = document.getElementById('quickjump');
    if (!quickJumpEl) return;

    quickJumpEl.focus();
}
YAHOO.util.Event.onDOMReady(focus_quickjump);
//hide the Notices box if there is no "interesting" HTML in it
function hide_notices_ifempty() {
    var noticeboard = document.getElementById('noticeboard');
    if (!noticeboard) return;

    if ( !/[^\s\n\r]/.test(noticeboard.innerHTML) ) {
        /* the box is empty, so hide it */
        document.getElementById('notices').style.display='none';
    }
}

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
function load_main_page_warnings_success(o) {
    var main_page_warnings_El = document.getElementById('main_page_warnings');
    main_page_warnings_El.innerHTML=o.responseText;
    hide_notices_ifempty();
}
function load_main_page_warnings_failure(o) {
    var main_page_warnings_El = document.getElementById('main_page_warnings');
    main_page_warnings_El.innerHTML='&nbsp;';
    hide_notices_ifempty();
}
function load_main_page_warnings() {
    var main_page_warnings_El = document.getElementById('main_page_warnings');
    main_page_warnings_El.innerHTML = CPANEL.icons.ajax;
    var callback = {
        success: load_main_page_warnings_success,
        failure: load_main_page_warnings_failure
    };

    YAHOO.util.Connect.asyncRequest('GET', CPANEL.security_token + '/frontend/' + thisTheme + '/main_page_warnings.html' , callback);
}

YAHOO.util.Event.onDOMReady( load_main_page_warnings );
