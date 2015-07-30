var OPEN_ACTION_DIV = 0;

var Handlebars = window.Handlebars;
var delete_template = Handlebars.compile(DOM.get("delete_template").text.trim());
var edit_template = Handlebars.compile(DOM.get("edit_template").text.trim());

var toggle_action_div = function(e, o) {
    // if a div, that is not o, is already open, close it
    if (OPEN_ACTION_DIV && OPEN_ACTION_DIV.id !== o.id && YAHOO.util.Dom.getStyle(OPEN_ACTION_DIV.id, "display") != "none") {
        var currently_open_div = OPEN_ACTION_DIV;
        before_hide_module(currently_open_div);
        CPANEL.animate.slide_up(currently_open_div.id, function() {
            after_hide_module(currently_open_div)
        });
    }

    // if o is currently displayed, hide it
    if (YAHOO.util.Dom.getStyle(o.id, "display") != 'none') {
        before_hide_module(o);
        CPANEL.animate.slide_up(o.id, function() {
            after_hide_module(o)
        });
    }
    // else show o and set it as the OPEN_ACTION_DIV
    else {
        before_show_module(o);
        CPANEL.animate.slide_down(o.id, function() {
            after_show_module(o)
        });
        OPEN_ACTION_DIV = o;
    }
};

var before_show_module = function(o) {
    var el = YAHOO.util.Dom.get(o.id);
    
    if (YAHOO.lang.trim(el.innerHTML) == '') {
	
        var html = '';
	if (o.action == 'delete') {
            html += delete_template({
		    index: o.index,
			rpop: o.rpop,
			account: o.account
			});
        }
	if (o.action == 'edit') {
	    get_rpop(o);
        }
        el.innerHTML = html;
    }
};

// add event handlers and validation to an input div
var after_show_module = function(o) {
    if (o.action == 'delete') {
	$("#delete_" + o.index).click(function() {
		delete_confirm(o);
	    });
    }
    if (o.action == 'edit') {
	$("#edit_" + o.index).click(function() {
	    });
    }
};

var before_hide_module = function(o) {

};

var after_hide_module = function(o) {
    // purge all event handlers in the div
    YAHOO.util.Event.purgeElement(o.id, true);
    if (o.action == 'delete') {
	$("#delete_" + o.index).unbind("click");
    }
    if (o.action == 'edit') {
	$("#rename_" + o.index).unbind("click");
	$("#scc_msg_wrap_" + o.index).hide();
	$("#err_msg_wrap_" + o.index).hide();
    }
};

var delete_confirm = function(o) {
    var index = o.index;
    // create the API variables
    var api2_call = {
        cpanel_jsonapi_version: 2,
        cpanel_jsonapi_module: "CommuniGate",
        cpanel_jsonapi_func: "DeleteRPOP",
        account: o.account,
	rpop: o.rpop
    };

    var reset_module = function() {
        YAHOO.util.Dom.get("delete_status_" + index).innerHTML = '';
        toggle_action_div(null, {
            "id": "delete_module_" + index,
            "index": index,
            "action": "delete"
        });
    };

    // callback functions
    var success = function(o) {
    	var data = $.parseJSON(o);
    	data = data.cpanelresult.data;
    	// update the table and display the status
    	if (data[0] && data[0]['rpop'] == api2_call.rpop) {
    	    CPANEL.animate.fade_out('rpop_row_' + index, function() {
    		    YAHOO.util.Dom.setStyle("module_row_" + index, "display", "none");
    		});
    	} else {
    	    $(selector_delete_loading).html("");
    	    CPANEL.widgets.status_bar("status_bar_" + index, "error", CPANEL.lang.Error, "Unknown error.");
    	}
    };

    // send the AJAX request
    $.ajax({
    	    type: "GET",
    	    url: CPANEL.urls.json_api() + '&' + $.param(api2_call),
    	    success: success,
    	    dataType: "text"
    		});

    // show the ajax loading icon
    var selector_delete_loading = "#delete_status_" + index;
    $(selector_delete_loading).html(CPANEL.icons.ajax + " Deleting...");
};

var get_rpop = function(obj) {
    // create the API variables
    var api2_call = {
        cpanel_jsonapi_version: 2,
        cpanel_jsonapi_module: "CommuniGate",
        cpanel_jsonapi_func: "EditRPOP",
        account: obj.account,
	rpop: obj.rpop
    };
    var el = YAHOO.util.Dom.get(obj.id);
    var html = '';
    // callback functions
    var success = function(o) {
    	var data = $.parseJSON(o);
    	data = data.cpanelresult.data;
    	// update the table and display the status
    	if (data[0]) {
    	    data = data[0];
    	    html += edit_template({
    		    index: obj.index,
			displayName: obj.rpop,
			authName: data.rpop.authName,
			domain: data.rpop.domain,
			password: data.rpop.password,
			period: data.rpop.period,
			APOP: (data.rpop.APOP == 'YES') ? 'checked' : '',
			TLS: (data.rpop.TLS == 'YES') ? 'checked' : '',
			leave: (data.rpop.leave == 'YES') ? 'checked' : '',
			mailbox: data.rpop.mailbox
    			});
    	    el.innerHTML = html;
	    $('[name=period]').val( data.rpop.period );
    	    $("#edit_status_" + obj.index).html("");
    	    $("#edit_status_" + obj.index).css("padding", "0px");
    	    $("#submit_" + obj.index).click(function() {set_rpop(obj);});
    	} else {
    	    // $(selector_rename_loading).html("");
    	    CPANEL.widgets.status_bar("status_bar_" + index, "error", CPANEL.lang.Error, "Unknown error.");
    	}
    };

    // send the AJAX request
    $.ajax({
    	    type: "GET",
    	    url: CPANEL.urls.json_api() + '&' + $.param(api2_call),
    	    success: success,
    	    dataType: "text"
    		});
    $("#edit_status_" + obj.index).html(CPANEL.icons.ajax + " Loading...").css("padding", "20px");
};

var set_rpop = function(obj) {
    var selected = {};
    $('#' + obj.id + ' input:checked').each(function() {
	    selected[$(this).attr('name')] = $(this).attr('value');
	});
    // create the API variables
    var api2_call = {
        cpanel_jsonapi_version: 2,
        cpanel_jsonapi_module: "CommuniGate",
        cpanel_jsonapi_func: "DoEditRPOP",
        account: obj.account,
	name: obj.rpop,
	period: $("#period_" + obj.index).val(),
	authName: $("#authName_" + obj.index).val(),
	domain: $("#domain_" + obj.index).val(),
	password: $("#password_" + obj.index).val(),
	mailbox: $("#mailbox_" + obj.index).val(),
	leave: (selected.leave) ? selected.leave : '',
	APOP: (selected.APOP) ? selected.APOP : '',
	TLS: (selected.TLS) ? selected.TLS : ''
    };
    // callback functions
    var success = function(o) {
    	var data = $.parseJSON(o);
    	data = data.cpanelresult.data;
	$("#edit_status_" + obj.index).html("");
	if (data[0]['account']) {
	    $("#scc_msg_wrap_" + obj.index).show();
	    $("#scc_msg_" + obj.index).html("Settings were successfully saved.");
	} else {
	    $("#err_msg_wrap_" + obj.index).show();
	    $("#err_msg_" + obj.index).html("Error!");
	}
    };

    // send the AJAX request
    $.ajax({
    	    type: "GET",
    	    url: CPANEL.urls.json_api() + '&' + $.param(api2_call),
    	    success: success,
    	    dataType: "text"
    		});

    // show the ajax loading icon
    $("#edit_status_" + obj.index).html(CPANEL.icons.ajax + " Loading...");
};
