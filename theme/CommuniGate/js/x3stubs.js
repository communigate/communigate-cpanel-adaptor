

if (!self['YAHOO']) {
    YAHOO = function () {};
    YAHOO.util = function () {};
    YAHOO.widget = function () {};
    YAHOO.widget.Panel = YAHOO.widget.Dialog = function () {
        var x = {};
        x.render = function() {};
        x.show = function() {};
        x.hide = function() {};
        return x;
    };
    YAHOO.util.Event = function () {};
    YAHOO.util.Event.addListener = function () {};
    YAHOO.util.Region = function () {};
    YAHOO.util.Dom = function () {};
    YAHOO.util.Motion = function () { 
        var x = {};
        x.animate = function() {};
        x.onComplete = function() {};
        x.onComplete.subscribe = function() {};
        return x; 
    };
    YAHOO.util.Dom.getXY = function () { return []; };
}
function open_passgen_dialog () { alert('Password Generation is not available for mobile devices.'); }
function register_validator () {}
function do_validate () { return true; }
function show_optionselect () { return; }
function register_truncate_table () {}
