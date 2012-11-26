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
