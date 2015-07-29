var OPEN_ACTION_DIV = 0;


var Handlebars = window.Handlebars;
var delete_template = Handlebars.compile(DOM.get("delete_template").text.trim());
var rename_template = Handlebars.compile(DOM.get("rename_template").text.trim());
var settings_template = Handlebars.compile(DOM.get("settings_template").text.trim());
var group_members_template = Handlebars.compile(DOM.get("group_members_template").text.trim());

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
			group: o.group
			});
        }
	if (o.action == 'rename') {
            html += rename_template({
		    index: o.index,
			group: o.group 
			});
        }
	if (o.action == 'settings') {
	    $("#settings_status_" + o.index).html(CPANEL.icons.ajax + " Loading...");
	    $("#settings_status_" + o.index).css("padding", "20px");
	    get_group_settings(o);
		}
	if (o.action == 'group_members') {
	    $("#members_status_" + o.index).html(CPANEL.icons.ajax + " Loading...");
	    $("#members_status_" + o.index).css("padding", "20px");
	    get_accounts(o, get_group_members);
        }
        el.innerHTML = html;
    }
};

// add event handlers and validation to an input div
var after_show_module = function(o) {
    if (o.action == 'delete') {
	var selector_delete = "#delete_" + o.index;
	$(selector_delete).click(function() {
		delete_confirm(o);
	    });
    }
    if (o.action == 'rename') {
	var selector_rename = "#rename_" + o.index;
	$(selector_rename).click(function() {
		rename_confirm(o);
	    });
    }
    if (o.action == 'settings') {
	var selector_settings = "#settings_" + o.index;
	$(selector_settings).click(function() {
		set_group_settings(o);
	    });
    }
};

var before_hide_module = function(o) {

};

var after_hide_module = function(o) {
    // purge all event handlers in the div
    YAHOO.util.Event.purgeElement(o.id, true);
    if (o.action == 'delete') {
	var selector_delete = "#delete_" + o.index;
	$(selector_delete).unbind("click");
    }
    if (o.action == 'rename') {
	var selector_rename = "#rename_" + o.index;
	$(selector_rename).unbind("click");
    }
    if (o.action == 'settings') {
	var selector_settings = "#settings_" + o.index;
	$(selector_settings).unbind("click");
	$("#scc_msg_wrap").hide();
	$("#err_msg_wrap").hide();
    }
};

var delete_confirm = function(o) {
    var index = o.index;
    // create the API variables
    var api2_call = {
        cpanel_jsonapi_version: 2,
        cpanel_jsonapi_module: "CommuniGate",
        cpanel_jsonapi_func: "DelGroup",
        email: o.group
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
	if (data[0] && data[0]['email'] == api2_call.email) {
	    CPANEL.animate.fade_out('group_row_' + index, function() {
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
	    data: api2_call,
	    success: success,
	    dataType: "text"
		});

    // show the ajax loading icon
    var selector_delete_loading = "#delete_status_" + index;
    $(selector_delete_loading).html(CPANEL.icons.ajax + " Deleting...");
};

var rename_confirm = function(o) {
    var index = o.index;
    var selector_rename_input = "#newname_" + index;
    var newname = $(selector_rename_input).val();
    var selector_name = "#group_row_" + index + " td:first";
    // create the API variables
    var api2_call = {
        cpanel_jsonapi_version: 2,
        cpanel_jsonapi_module: "CommuniGate",
        cpanel_jsonapi_func: "RenameGroup",
        email: $(selector_name).html().trim(),
    	newname: newname
    };

    var reset_module = function() {
        YAHOO.util.Dom.get("rename_status_" + index).innerHTML = '';
        toggle_action_div(null, {
            "id": "rename_module_" + index,
            "index": index,
            "action": "rename"
        });
    };

    // callback functions
    var success = function(o) {
    	var data = $.parseJSON(o);
    	data = data.cpanelresult.data;
    	// update the table and display the status
    	if (data[0] && data[0]['email'] == api2_call.email) {
	    reset_module();
	    var domain = api2_call.email.split("@")[1];
	    $(selector_name).html(api2_call.newname + "@" + domain);
    	} else {
    	    $(selector_rename_loading).html("");
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
    var selector_rename_loading = "#rename_status_" + index;
    $(selector_rename_loading).html(CPANEL.icons.ajax + " Renaming...");
};

var get_group_settings = function(obj) {
    // create the API variables
    var api2_call = {
        cpanel_jsonapi_version: 2,
        cpanel_jsonapi_module: "CommuniGate",
        cpanel_jsonapi_func: "GetGroupSettings",
        email: obj.group
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
	    html += settings_template({
		    index: obj.index,
			Expand: (data.Expand == 'YES') ? 'checked' : '', 
			RealName: (data.RealName) ? data.RealName : '',
			RejectAutomatic: (data.RejectAutomatic == 'YES') ? 'checked' : '',
			RemoveAuthor: (data.RemoveAuthor == 'YES') ? 'checked' : '',
			RemoveToAndCc: (data.RemoveToAndCc == 'YES') ? 'checked' : '',
			SetReplyTo: (data.SetReplyTo == 'YES') ? 'checked' : '',
			SignalDisabled: (data.SignalDisabled == 'NO') ? 'checked' : '',
			FinalDelivery: (data.FinalDelivery == 'YES') ? 'checked' : '',
			});
	    el.innerHTML = html;
	    var selector_settings_status = "#settings_status_" + obj.index;
	    $(selector_settings_status).html("");
	    $(selector_settings_status).css("padding", "0px");
	    var selector_settings_btn = "#settings_" + obj.index;
	    $(selector_settings_btn).click(function() {set_group_settings(obj);});
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
};

var set_group_settings = function(obj) {
    var selected = {};
    $('#' + obj.id + ' input:checked').each(function() {
	    selected[$(this).attr('name')] = $(this).attr('value');
	});
    // create the API variables
    var api2_call = {
        cpanel_jsonapi_version: 2,
        cpanel_jsonapi_module: "CommuniGate",
        cpanel_jsonapi_func: "SetGroupSettings",
    	email : obj.group,
    	RemoveToAndCc : (selected.RemoveToAndCc) ? selected.RemoveToAndCc : '',
    	Expand : (selected.Expand) ? selected.Expand : '',
    	FinalDelivery : (selected.FinalDelivery) ? selected.FinalDelivery : '',
    	RealName : $("#RealName").val(),
    	RejectAutomatic : (selected.RejectAutomatic) ? selected.RejectAutomatic : '',
    	RemoveAuthor : (selected.RemoveAuthor) ? selected.RemoveAuthor : '',
    	SetReplyTo : (selected.SetReplyTo) ? selected.SetReplyTo : '',
    	SignalDisabled : (selected.SignalDisabled) ? selected.SignalDisabled : ''
    };

    // callback functions
    var success = function(o) {
    	var data = $.parseJSON(o);
    	data = data.cpanelresult.data;
	$("#settings_status_" + obj.index).html("");
	if (data[0] == "OK") {
	    $("#scc_msg_wrap").show();
	    $("#scc_msg").html("Settings were successfully saved.");
	} else {
	    $("#err_msg_wrap").show();
	    $("#err_msg").html(data[0]);
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
    $("#settings_status_" + obj.index).html(CPANEL.icons.ajax + " Loading...");
};

var get_group_members = function(obj, accounts) {
    // create the API variables
    var api2_call = {
        cpanel_jsonapi_version: 2,
        cpanel_jsonapi_module: "CommuniGate",
        cpanel_jsonapi_func: "ListGroupMembers",
    	listname : obj.group
    };

    // callback functions
    var success = function(o) {
    	var data = $.parseJSON(o);
    	members = data.cpanelresult.data;
    	// update the table and display the status
    	if (members) {
	    var el = YAHOO.util.Dom.get(obj.id);
	    var html = new EJS({url: 'group_members.ejs'}).render({accounts, members, obj});
	    el.innerHTML = html;
	    $("#members_status_" + obj.index).html("").css("padding", "0");
	    $(".remove-btn").each(function() {
		    $(this).click(function() {
		    remove_member(obj, $(this));
		});
		});
	    $(".add_member").each(function() {
		    $(this).click(function() {
		    add_member(obj, $(this));
		});
		});
    	} else {
	    $("#members_status_" + obj.index).html("").css("padding", "0");
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
};


var get_accounts = function(obj, callback) {
    // create the API variables
    var api2_call = {
        cpanel_jsonapi_version: 2,
        cpanel_jsonapi_module: "CommuniGate",
        cpanel_jsonapi_func: "ListAccounts"
    };
    // callback functions
    var success = function(o) {
    	var data = $.parseJSON(o);
    	accounts = data.cpanelresult.data[0]['accounts'];
	callback(obj, accounts);
    };
    // send the AJAX request
    $.ajax({
    	    type: "GET",
		url: CPANEL.urls.json_api() + '&' + $.param(api2_call),
		success: success,
		dataType: "text"
    		});
};

var remove_member = function(obj, caller) {
    $(caller).attr("disabled", true);
    // create the API variables
    var api2_call = {
        cpanel_jsonapi_version: 2,
        cpanel_jsonapi_module: "CommuniGate",
        cpanel_jsonapi_func: "RemoveGroupMember",
    	listname: obj.group,
    	subemail: $(caller).val()
    };
    // callback functions
    var success = function(o) {
	$(caller).attr("disabled", false);
	$("#add_member_btn_" + obj.index).attr("disabled", false);
    	var data = $.parseJSON(o);
	$(caller).parent().parent().hide();
	$("#account_" + obj.index).append($('<option>', {
		    value: api2_call.subemail,
			text: api2_call.subemail
			}));;
    };
    // send the AJAX request
    $.ajax({
    	    type: "GET",
    		url: CPANEL.urls.json_api() + '&' + $.param(api2_call),
    		success: success,
    		dataType: "text"
    		});
    // show the ajax loading icon
    $("#members_status_row_" + $(caller).attr("id")).html(CPANEL.icons.ajax + " Loading...");
};

var add_member = function(obj, caller) {
    $(caller).attr("disabled", true);
    var account = $("#account_" + obj.index).val();
    var account_name = account.split("@")[0];
    // create the API variables
    var api2_call = {
        cpanel_jsonapi_version: 2,
        cpanel_jsonapi_module: "CommuniGate",
        cpanel_jsonapi_func: "AddGroupMember",
    	listname: obj.group,
    	account: account
    };

    // callback functions
    var success = function(o) {
	$("#add_member_status_" + obj.index).html("");
    	var data = $.parseJSON(o);
	var new_tr = $("<tr>");
	var new_td1 = $("<td>");
	var new_td2 = $("<td>");
	var new_btn = $("<button>");
	new_btn.addClass("btn btn-primary")
	new_btn.val(account);
	new_btn.text('Remove');
	new_tr.css("padding","5px");
	new_td1.css("padding","5px");
	new_td2.css("padding","5px");
	new_td1.html(account);
	new_btn.click(function() {
		remove_member(obj, $(this));
	    });
	new_td2.append(new_btn);
	new_tr.append(new_td1);
	new_tr.append(new_td2);
	$("#members_table_" + obj.index).append(new_tr);

	$("#account_" + obj.index + " option[value='" + account +"']").each(function() {
		$(this).remove();
	    });
	$("#no_members").hide();
	var length = $('#account_' + obj.index).children('option').length;
	if(length > 0) {
	    $(caller).attr("disabled", false);
	}
    }
    // send the AJAX request
    $.ajax({
    	    type: "GET",
    		url: CPANEL.urls.json_api() + '&' + $.param(api2_call),
    		success: success,
    		dataType: "text"
    		});
    // show the ajax loading icon
    $("#add_member_status_" + obj.index).html(CPANEL.icons.ajax + " Loading...");
};

