REQUIRED_PASSWORD_STRENGTH = 5;
var OPEN_ACTION_DIV = 0;
var MENUS = [];
var toggle_menu = function(e, o) {
    // build the menu if it doesn't exist
    if (typeof(MENUS[o.index]) !== 'object') {
        // create the menu
        var options = {
            position : "dynamic",
            clicktohide : "true",
            context : ["email_table_menu_button_" + o.index, "tl", "bl", ["beforeShow", "windowResize", CPANEL.align_panels_event]],
            shadow : "true",
            effect: {effect: YAHOO.widget.ContainerEffect.FADE, duration: 0.25}
        };
        MENUS[o.index] = new YAHOO.widget.Menu("email_table_menu_" + o.index, options);

        var menu_items = [];
        // configure email
        menu_items.push({
		text: 'Configure Email Client',
		    url: "../../mail/clientconf.html?acct=" + encodeURIComponent(ACCOUNTS[o.index]['user']) + "@" + encodeURIComponent(ACCOUNTS[o.index]['domain'])
        });
        
        MENUS[o.index].addItems(menu_items);
        MENUS[o.index].render("menus_div");
    }

    MENUS[o.index].show();
};

var toggle_action_div = function(e, o) {
    // if a div, that is not o, is already open, close it
    if ( OPEN_ACTION_DIV && OPEN_ACTION_DIV.id !== o.id && YAHOO.util.Dom.getStyle(OPEN_ACTION_DIV.id, "display") != "none") {
        var currently_open_div = OPEN_ACTION_DIV;
        CPANEL.animate.slide_up( currently_open_div.id , function() { });
    }
    
    // if o is currently displayed, hide it
    if (YAHOO.util.Dom.getStyle(o.id, "display") != 'none') {
        CPANEL.animate.slide_up( o.id, function() { });
    }
    // else show o and set it as the OPEN_ACTION_DIV
    else {
        CPANEL.animate.slide_down( o.id, function() { });
        OPEN_ACTION_DIV = o;
    }
};

var verify_local = function (i) {
    var PWD_BAR = new CPANEL.password.strength_bar("password_strength_bar_" + i);
    var VAL_PWD = new CPANEL.validate.validator(LANG.password_input);
    var VAL_PWD2 = new CPANEL.validate.validator(LANG.password_input);
    // var VAL_QUOTA = new CPANEL.validate.validator(LANG.quota_input);
    PWD_BAR.attach("change_password_input_1_" + i, function() { VAL_PWD.verify(); });
    var verify_password_strength_local = function () {
	if (PWD_BAR.current_strength >= REQUIRED_PASSWORD_STRENGTH) return true;
	return false;
    };
    VAL_PWD.add("change_password_input_1_" + i, verify_password_strength_local, YAHOO.lang.substitute(LANG.password_strength_must_be,{min_passwd_strength: REQUIRED_PASSWORD_STRENGTH}));
    VAL_PWD.add("change_password_input_1_" + i, 'no_chars(%input%, " ")', LANG.password_spaces);
    VAL_PWD.attach();
    VAL_PWD2.add("change_password_input_2_" + i, "equals('change_password_input_1_" + i + "', 'change_password_input_2_" + i + "')", LANG.passwords_not_match);
    VAL_PWD2.attach();
    EVENT.on("create_strong_password_" + i, "click", function () {
	    CPANEL.password.generate_password(function (password) {
		    DOM.get("change_password_input_1_" + i).value = password;
		    DOM.get("change_password_input_2_" + i).value = password;
		    PWD_BAR.check_strength("change_password_input_1_" + i, function() { VAL_PWD.verify() });
		    VAL_PWD2.verify();
		});
	});
    CPANEL.validate.attach_to_form("email_table_change_password_confirm_" + i, [VAL_PWD, VAL_PWD2]);
};
for (var i=0; i < ACCOUNTS.length; i++) {
    verify_local(i);
};
