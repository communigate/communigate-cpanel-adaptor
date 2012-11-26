var VALID = {};
var OPEN_MODULE = null;
var EDIT_VALID = {};
var EMAIL_VALID;

// TODO: put this in CPANEL.validate
var typeof_validator = function(obj) {
	if (typeof(obj.add) != "function") return false;
	if (typeof(obj.attach) != "function") return false;
	if (typeof(obj.title) != "string") return false;
	return true;
};

var load_cron_table = function() {
	var table_div = YAHOO.util.Dom.get("cron_jobs");
	
	var callback = {
		success : function(o) {
			table_div.innerHTML = o.responseText;
		},
		
		error : function(o) {
			table_div.innerHTML = CPANEL.icons.error + " " + CPANEL.lang.ajax_error + ": " + CPANEL.lang.ajax_try_again;
		}
	};
	
	YAHOO.util.Connect.asyncRequest('GET', 'cron_entries.html', callback, '');
	
	var div_region = YAHOO.util.Region.getRegion(table_div);
	if (div_region.height > 0) {
		table_div.innerHTML = '<div style="height: ' + div_region.height + 'px"><div style="padding: 15px">' + CPANEL.icons.ajax + ' ' + CPANEL.lang.ajax_loading + '</div></div>';	
	}
	else {
		table_div.innerHTML = '<div style="padding: 15px">' + CPANEL.icons.ajax + ' ' + CPANEL.lang.ajax_loading + '</div>';	
	}
};

var reset_all_input = function(id) {
	if (! id) id = "";
	
	reset_input_fields(id);
	reset_option_fields(id);
	
	if (id == "") {
		YAHOO.util.Dom.get("common_options").value = "--";
		for (var i in VALID) {
                   if (VALID.hasOwnProperty(i)) {
			if (typeof_validator(VALID[i]) == false) continue;
			VALID[i].clear_messages();
                   }
		}
	}
	else {
		YAHOO.util.Dom.get("common_options_" + id).value = "--";
	}
};

var reset_input_fields = function(id) {
	(! id) ? id = "" : id = "_" + id;
	
	YAHOO.util.Dom.get("minute" + id).value = "";
	YAHOO.util.Dom.get("hour" + id).value = "";
	YAHOO.util.Dom.get("day" + id).value = "";
	YAHOO.util.Dom.get("month" + id).value = "";
	YAHOO.util.Dom.get("weekday" + id).value = "";
	YAHOO.util.Dom.get("command" + id).value = "";
};

var reset_option_fields = function(id) {
	(! id) ? id = "" : id = "_" + id;
	
	YAHOO.util.Dom.get("minute_options" + id).value = "--";
	YAHOO.util.Dom.get("hour_options" + id).value = "--";
	YAHOO.util.Dom.get("day_options" + id).value = "--";
	YAHOO.util.Dom.get("month_options" + id).value = "--";
	YAHOO.util.Dom.get("weekday_options" + id).value = "--";
};

var select_common_option = function(id) {
	var id2;
	(! id) ? id2 = "" : id2 = "_" + id;
	
	var option = YAHOO.util.Dom.get("common_options" + id2).value;
	if (option != "--") {
		// fill in values
		var option_array = option.split(" ");
		YAHOO.util.Dom.get("minute" + id2).value = option_array[0];
		YAHOO.util.Dom.get("hour" + id2).value = option_array[1];
		YAHOO.util.Dom.get("day" + id2).value = option_array[2];
		YAHOO.util.Dom.get("month" + id2).value = option_array[3];
		YAHOO.util.Dom.get("weekday" + id2).value = option_array[4];
		
		check_common_options();
		
		// verify fields
		if (id2 == "") {
			VALID["minute"].verify();
			VALID["hour"].verify();
			VALID["day"].verify();
			VALID["month"].verify();
			VALID["weekday"].verify();
		}
		else {
			EDIT_VALID["minute"].verify();
			EDIT_VALID["hour"].verify();
			EDIT_VALID["day"].verify();
			EDIT_VALID["month"].verify();
			EDIT_VALID["weekday"].verify();
		}
	}
};

var select_single_option = function(field, id) {
	(! id) ? id = "" : id = "_" + id;
	
	var option = YAHOO.util.Dom.get(field + "_options" + id).value;
	if (option != "--") {
		YAHOO.util.Dom.get(field + id).value = option;
	}
	
	VALID[field].verify();
	check_common_options();
};

/*
// cron validator
var validate_cron_field = function(id) {
	var value = YAHOO.util.Dom.get(id).value;
	if (value == "*") return true;
	if (CPANEL.validate.positive_integer(value) == true) return true;
	var pattern = new RegExp("^[0-9\*][0-9-,\/\*]+[0-9]$");
	return pattern.test(value);
};
*/

var validate_minute_field = function(id) {
	return validate_cron_field(YAHOO.util.Dom.get(id).value, 0, 59);
};

var validate_hour_field = function(id) {
	return validate_cron_field(YAHOO.util.Dom.get(id).value, 0, 23);
};

var validate_day_field = function(id) {
	return validate_cron_field(YAHOO.util.Dom.get(id).value, 1, 31);
};

var validate_month_field = function(id) {
	var value = YAHOO.util.Dom.get(id).value;
	value = value.toLowerCase();
	value = value.replace("jan", 1);
	value = value.replace("feb", 2);
	value = value.replace("mar", 3);
	value = value.replace("apr", 4);
	value = value.replace("may", 5);
	value = value.replace("jun", 6);
	value = value.replace("jul", 7);
	value = value.replace("aug", 8);
	value = value.replace("sep", 9);
	value = value.replace("oct", 10);
	value = value.replace("nov", 11);
	value = value.replace("dec", 12);
	return validate_cron_field(value, 1, 12);
};

var validate_weekday_field = function(id) {
	var value = YAHOO.util.Dom.get(id).value;
	value = value.toLowerCase();
	value = value.replace("sun", 0);
	value = value.replace("mon", 1);
	value = value.replace("tue", 2);
	value = value.replace("wed", 3);
	value = value.replace("thu", 4);
	value = value.replace("fri", 5);
	value = value.replace("sat", 6);
	return validate_cron_field(value, 0, 7);
};

var validate_cron_field = function(value, start, finish) {
	var chunks = value.split(",");
	for (var i = 0; i < chunks.length; i++) {
           if (chunks.hasOwnProperty(i)) {
		// ranges: 3-7
		if (chunks[i].search("-") != -1) {
			var ranges = chunks[i].split("-");
			if (ranges.length != 2) return false;
			if (validate_cron_unit(ranges[0], start, finish) == false) return false;
			if (validate_cron_unit(ranges[1], start, finish) == false) return false;
			ranges[0] = parseInt(ranges[0]);
			ranges[1] = parseInt(ranges[1]);
			if (ranges[0] >= ranges[1]) return false;	// the first part of a range must be less than the last part of a range, ie: 5-3 should fail
		}
		// moduluar expressions: */2
		else if (chunks[i].search("/") != -1) {
			var modulus = chunks[i].split("/");
			if (modulus.length != 2) return false;
			if (validate_cron_unit(modulus[0], start, finish, true) == false) return false;
			if (validate_cron_unit(modulus[1], start, finish) == false) return false;			
		}
		// single expressions: 7 *
		else {
			if (validate_cron_unit(chunks[i], start, finish, true) == false) return false;
		}
            }
	}
	return true;
};

var validate_cron_unit = function(value, start, finish, asterisk) {
	if (asterisk) {
		if (value == "*") return true;
	}
	if (CPANEL.validate.positive_integer(value) == true) {
		if (value >= start && value <= finish) {
			return true;
		}
	}
	return false;
};

// update the UI if they have selected a common option
var check_common_options = function(id) {
	(! id) ? id = "" : id = "_" + id;

	var minute = YAHOO.util.Dom.get("minute" + id).value;
	select_if_equal(minute, "minute_options" + id);
	
	var hour = YAHOO.util.Dom.get("hour" + id).value;
	select_if_equal(hour, "hour_options" + id);
	
	var day = YAHOO.util.Dom.get("day" + id).value;
	select_if_equal(day, "day_options" + id);
	
	var month = YAHOO.util.Dom.get("month" + id).value;
	select_if_equal(month, "month_options" + id);
	
	var weekday = YAHOO.util.Dom.get("weekday" + id).value;
	select_if_equal(weekday, "weekday_options" + id);
	
	var cron = minute + " " + hour + " " + day + " " + month + " " + weekday;
	select_if_equal(cron, "common_options" + id);
};

// select an option dropdown from a <select> group if it matches a value
var select_if_equal = function(value, select_id) {
	var options = document.getElementById(select_id).options;
	var option_found = false;

	// loop through the options and auto-select the one that matches our value	
	for (var i = 0; i < options.length; i++) {
		if (options[i].value == value) {
			options[i].selected = true;
			option_found = true;
		}
	}

	// if none were found select the first element
	if (option_found == false) {
		options[0].selected = true;
	}
};

var add_new_cron_job = function() {	
    if (window.demo_mode) return;

    // build the call
	var api2_call = {
		cpanel_jsonapi_version : 2,
		cpanel_jsonapi_module  : "Cron",
		cpanel_jsonapi_func    : "add_line",
		minute 	: YAHOO.util.Dom.get("minute").value,
		hour 	: YAHOO.util.Dom.get("hour").value,
		day 	: YAHOO.util.Dom.get("day").value,
		month 	: YAHOO.util.Dom.get("month").value,
		weekday : YAHOO.util.Dom.get("weekday").value,
		command : YAHOO.util.Dom.get("command").value
	};

	var reset = function() {
		YAHOO.util.Dom.get("add_new_cron").disabled = false;
		YAHOO.util.Dom.get("add_new_cron_status").innerHTML = "";		
	};
    
    // callback
    var callback = {
        success : function(o) {
			try {
				var data = YAHOO.lang.JSON.parse(o.responseText);
				if (data.cpanelresult.data[0].status == "1") {
					CPANEL.widgets.status_bar("add_cron_status_bar", "success", LANG.added_cron_job);
					reset_all_input();
					load_cron_table();
				}
				else {
					CPANEL.widgets.status_bar("add_cron_status_bar", "error", CPANEL.lang.Error, data.cpanelresult.data[0].statusmsg);
				}
			}
			catch (e) {
				CPANEL.widgets.status_bar("add_cron_status_bar", "error", CPANEL.lang.json_error, CPANEL.lang.json_parse_failed);
			}
			reset();
        },
        failure : function(o) {
			reset();
            CPANEL.widgets.status_bar("add_cron_status_bar", "error", CPANEL.lang.ajax_error, CPANEL.lang.ajax_try_again);
        }
    };
    
    // send the request
	YAHOO.util.Connect.asyncRequest('GET', CPANEL.urls.json_api(api2_call), callback, '');
    
	YAHOO.util.Dom.get("add_new_cron").disabled = true;
    YAHOO.util.Dom.get("add_new_cron_status").innerHTML = CPANEL.icons.ajax + " " + LANG.adding_cron_job;
};

var toggle_module = function(id) {
	// close OPEN_MODULE if it's open
	if (OPEN_MODULE !== id && YAHOO.util.Dom.getStyle(OPEN_MODULE, "display") == "block") {
		var currently_open_div = OPEN_MODULE;
		before_hide_module(currently_open_div);
        CPANEL.animate.slide_up( currently_open_div, function() { after_hide_module(currently_open_div) });
	}
	
	// if id is currently displayed, hide it
	if (YAHOO.util.Dom.getStyle(id, "display") != 'none') {
		before_hide_module(id);
        CPANEL.animate.slide_up( id, function() { after_hide_module(id) });
	}
	// else show id and set it as the OPEN_MODULE
	else {
		before_show_module(id);
        CPANEL.animate.slide_down( id, function() { after_show_module(id) } );
		OPEN_MODULE = id;
	}
};

var before_show_module = function(id) {
	var temp = id.split("_");
	var action = temp[0];
	var index = temp[2];
	
	if (action == "edit") {
		// fill in the values
		YAHOO.util.Dom.get("minute_" + index).value = YAHOO.util.Dom.get("minute_info_" + index).innerHTML;
		YAHOO.util.Dom.get("hour_" + index).value = YAHOO.util.Dom.get("hour_info_" + index).innerHTML;
		YAHOO.util.Dom.get("day_" + index).value = YAHOO.util.Dom.get("day_info_" + index).innerHTML;
		YAHOO.util.Dom.get("month_" + index).value = YAHOO.util.Dom.get("month_info_" + index).innerHTML;
		YAHOO.util.Dom.get("weekday_" + index).value = YAHOO.util.Dom.get("weekday_info_" + index).innerHTML;
		YAHOO.util.Dom.get("command_" + index).value = YAHOO.util.Dom.get("command_info_" + index).value;
		
		// create validation
		EDIT_VALID["minute"] = new CPANEL.validate.validator(LANG.Minute);
		EDIT_VALID["minute"].add("minute_" + index, function() { return validate_minute_field("minute_" + index); }, LANG.cron_field_not_valid);
		EDIT_VALID["minute"].attach();
		
		EDIT_VALID["hour"] = new CPANEL.validate.validator(LANG.Hour);
		EDIT_VALID["hour"].add("hour_" + index, function() { return validate_hour_field("hour_" + index); }, LANG.cron_field_not_valid);
		EDIT_VALID["hour"].attach();
		
		EDIT_VALID["day"] = new CPANEL.validate.validator(LANG.Day);
		EDIT_VALID["day"].add("day_" + index, function() { return validate_day_field("day_" + index); }, LANG.cron_field_not_valid);
		EDIT_VALID["day"].attach();
		
		EDIT_VALID["month"] = new CPANEL.validate.validator(LANG.Month);
		EDIT_VALID["month"].add("month_" + index, function() { return validate_month_field("month_" + index); }, LANG.cron_field_not_valid);
		EDIT_VALID["month"].attach();
		
		EDIT_VALID["weekday"] = new CPANEL.validate.validator(LANG.Weekday);
		EDIT_VALID["weekday"].add("weekday_" + index, function() { return validate_weekday_field("weekday_" + index); }, LANG.cron_field_not_valid);
		EDIT_VALID["weekday"].attach();
		
		EDIT_VALID["command"] = new CPANEL.validate.validator(LANG.Command);
		EDIT_VALID["command"].add("command_" + index, "min_length(%input%, 1)", LANG.command_not_empty);
		EDIT_VALID["command"].attach();
		
		// add event handlers
		CPANEL.validate.attach_to_form("edit_line_" + index, EDIT_VALID, function() { edit_line(index); });
		
		CPANEL.util.catch_enter(["minute_" + index, "hour_" + index, "day_" + index, "month_" + index, "weekday_" + index, "command_" + index], "edit_line_" + index);
	}
};

var before_hide_module = function(id) {
	var temp = id.split("_");
	var action = temp[0];
	var index = temp[2];
	
	if (action == "edit") {
		for (var i in EDIT_VALID) {
                   if (EDIT_VALID.hasOwnProperty(i)) {
			if (typeof_validator(EDIT_VALID[i]) == false) continue;
			EDIT_VALID[i].clear_messages();
                   }
		}
		YAHOO.util.Event.purgeElement(id, true);
	}
};

var after_show_module = function(id) {
	
};

var after_hide_module = function(id) {

};

var edit_line = function(index) {
    if (window.demo_mode) return;

	var minute = YAHOO.util.Dom.get("minute_" + index).value;
	var hour = YAHOO.util.Dom.get("hour_" + index).value;
	var day = YAHOO.util.Dom.get("day_" + index).value;
	var month = YAHOO.util.Dom.get("month_" + index).value;
	var weekday = YAHOO.util.Dom.get("weekday_" + index).value;
	var command = YAHOO.util.Dom.get("command_" + index).value;
	var linekey = YAHOO.util.Dom.get("linekey_" + index).value;
	
    // build the call
	var api2_call = {
		cpanel_jsonapi_version : 2,
		cpanel_jsonapi_module  : "Cron",
		cpanel_jsonapi_func    : "edit_line",
		minute  : minute,
		hour    : hour,
		day     : day,
		month   : month,
		weekday : weekday,
		command : command,
		linekey : linekey
	};
    
	var reset = function() {
		YAHOO.util.Dom.setStyle("edit_input_" + index, "display", "block");
		YAHOO.util.Dom.get("edit_status_" + index).innerHTML = "";		
	};
	
    // callback
    var callback = {
        success : function(o) {
			try {
				var data = YAHOO.lang.JSON.parse(o.responseText);
				if (data.cpanelresult.data[0].status == "1") {				
					// update the UI to reflect the new values
					YAHOO.util.Dom.get("minute_info_" + index).innerHTML = minute;
					YAHOO.util.Dom.get("hour_info_" + index).innerHTML = hour;
					YAHOO.util.Dom.get("day_info_" + index).innerHTML = day;
					YAHOO.util.Dom.get("month_info_" + index).innerHTML = month;
					YAHOO.util.Dom.get("weekday_info_" + index).innerHTML = weekday;
					YAHOO.util.Dom.get("command_htmlsafe_" + index).innerHTML = command.html_encode();
					YAHOO.util.Dom.get("command_info_" + index).value = command;
					YAHOO.util.Dom.get("linekey_" + index).value = data.cpanelresult.data[0].linekey;

					CPANEL.widgets.status_bar("status_bar_" + index, "success", LANG.edit_successful);
					toggle_module("edit_module_" + index);
				}
				else {
					CPANEL.widgets.status_bar("status_bar_" + index, "error", CPANEL.lang.Error, data.cpanelresult.data[0].statusmsg);
				}
			}
			catch (e) {
				CPANEL.widgets.status_bar("status_bar_" + index, "error", CPANEL.lang.json_error, CPANEL.lang.json_parse_failed);
			}
			reset();
        },
        failure : function(o) {
			reset();
			CPANEL.widgets.status_bar("status_bar_" + index, "error", CPANEL.lang.ajax_error, CPANEL.lang.ajax_try_again);
        }
    };
    
    // send the request
    YAHOO.util.Connect.asyncRequest('GET', CPANEL.urls.json_api(api2_call), callback, '');
    
	YAHOO.util.Dom.setStyle("edit_input_" + index, "display", "none");
    YAHOO.util.Dom.get("edit_status_" + index).innerHTML = CPANEL.icons.ajax + " " + LANG.editing_cron_job;
};

var delete_line = function(index) {
    if (window.demo_mode) return;

    // build the call
	var api2_call = {
		cpanel_jsonapi_version : 2,
		cpanel_jsonapi_module : "Cron",
		cpanel_jsonapi_func : "remove_line",
		linekey : YAHOO.util.Dom.get("linekey_" + index).value
	};
    
	var reset = function() {
		YAHOO.util.Dom.setStyle("delete_input_" + index, "display", "block");
		YAHOO.util.Dom.get("delete_status_" + index).innerHTML = "";		
	};
	
	var check_no_more_rows = function() {
		var rows = YAHOO.util.Dom.getElementsByClassName("dt_info_row", "tr", "cron_jobs_table");
		var reload_table = true;
		for (var i = 0; i < rows.length; i++) {
			if (YAHOO.util.Dom.getStyle(rows[i], "display") != "none") {
				reload_table = false;
			}
		}
		if (reload_table == true) {
			load_cron_table();
		}
	};
	
    // callback
    var callback = {
        success : function(o) {
			try {
				var data = YAHOO.lang.JSON.parse(o.responseText);
				if (data.cpanelresult.data[0].status == "1") {
                    CPANEL.animate.fade_out( 'info_row_'+index );
                    CPANEL.animate.fade_out( 'delete_module_'+index, check_no_more_rows );
				}
				else {
					reset();
					CPANEL.widgets.status_bar("status_bar_" + index, "error", CPANEL.lang.Error, data.cpanelresult.data[0].statusmsg);
				}
			}
			catch (e) {
				reset();
				CPANEL.widgets.status_bar("status_bar_" + index, "error", CPANEL.lang.json_error, CPANEL.lang.json_parse_failed);
			}
        },
        failure : function(o) {
			reset();
			CPANEL.widgets.status_bar("status_bar_" + index, "error", CPANEL.lang.ajax_error, CPANEL.lang.ajax_try_again);
        }
    };
    
    // send the request
    YAHOO.util.Connect.asyncRequest('GET', CPANEL.urls.json_api(api2_call), callback, '');
    
	YAHOO.util.Dom.setStyle("delete_input_" + index, "display", "none");
    YAHOO.util.Dom.get("delete_status_" + index).innerHTML = CPANEL.icons.ajax + " " + LANG.deleting_cron_job;
};

var validate_cron_email = function() {
	var email = YAHOO.util.Dom.get("email").value;
	if (email == "") return true;
	if (email == SYSTEM_ACCOUNT) return true;
	return CPANEL.validate.email(email);
};

var setup_email = function() {
	EMAIL_VALID = new CPANEL.validate.validator(LANG.email_address);
	EMAIL_VALID.add("email", validate_cron_email, LANG.cron_valid_email);
	EMAIL_VALID.attach();
	
	CPANEL.validate.attach_to_form("update_email", EMAIL_VALID, change_email);
	
	CPANEL.util.catch_enter("email", "update_email");
};

var change_email = function() {
    if (window.demo_mode) return;

	var email = YAHOO.util.Dom.get("email").value;
	
	// add a confirm for empty emails
	if (email == "") {
		var answer = confirm(LANG.confirm_empty_email);
		if (answer == false) {
			EMAIL_VALID.clear_messages();
			return;
		}
	}
	
    // build the call
	var api2_call = {
		"cpanel_jsonapi_version" : 2,
		"cpanel_jsonapi_module" : "Cron",
		"cpanel_jsonapi_func" : "set_email",
		"email" : email
	};
    
    // callback
    var callback = {
        success : function(o) {
			EMAIL_VALID.clear_messages();
			try {
				var data = YAHOO.lang.JSON.parse(o.responseText);
				if (data.cpanelresult.data[0].status == "1") {
					YAHOO.util.Dom.get("update_email").disabled = false;
					YAHOO.util.Dom.get("email_status").innerHTML = "";
					CPANEL.widgets.status_bar("email_status_bar", "success", LANG.email_updated);
					YAHOO.util.Dom.get("current_email").innerHTML = email;
					YAHOO.util.Dom.get("email").value = "";
				}
				else {
					YAHOO.util.Dom.get("update_email").disabled = false;
					YAHOO.util.Dom.get("email_status").innerHTML = "";
					CPANEL.widgets.status_bar("email_status_bar", "error", CPANEL.lang.Error, data.cpanelresult.data[0].statusmsg);
				}
			}
			catch (e) {
				YAHOO.util.Dom.get("update_email").disabled = false;
				YAHOO.util.Dom.get("email_status").innerHTML = "";
				CPANEL.widgets.status_bar("email_status_bar", "error", CPANEL.lang.json_error, CPANEL.lang.json_parse_failed);
			}
			check_empty_email();
        },
        failure : function(o) {
			EMAIL_VALID.clear_messages();
			YAHOO.util.Dom.get("update_email").disabled = false;
			YAHOO.util.Dom.get("email_status").innerHTML = "";
			CPANEL.widgets.status_bar("email_status_bar", "error", CPANEL.lang.ajax_error, CPANEL.lang.ajax_try_again);
			check_empty_email();
        }
    };
    
    // send the request
    YAHOO.util.Connect.asyncRequest('GET', CPANEL.urls.json_api(api2_call), callback, '');
	
	YAHOO.util.Dom.get("update_email").disabled = true;
	YAHOO.util.Dom.get("email_status").innerHTML = CPANEL.icons.ajax + " " + LANG.changing_email;
};

var init_email_div = function() {
	var current_email = YAHOO.util.Dom.get("current_email").innerHTML;
	if (current_email != "") {
		YAHOO.util.Dom.setStyle("edit_cron_email", "display", "block");
		YAHOO.util.Dom.get("email_toggle_more_less").innerHTML = CPANEL.lang.toggle_less;
	}
};

var check_empty_email = function() {
	var email_span = YAHOO.util.Dom.get("current_email");
	if (email_span.innerHTML == "") {
		email_span.innerHTML = "(" + LANG.none + ")";
	}
};

var init = function() {

	if (CRONTAB_PERMISSIONS_ERROR == true) {
		YAHOO.util.Dom.setStyle("crontab_interface", "display", "none");
		YAHOO.util.Dom.addClass("crontab_permissions_error", "highlight2");
		YAHOO.util.Dom.addClass("crontab_permissions_error", "cjt_status_bar_error");
		YAHOO.util.Dom.setStyle("crontab_permissions_error", "display", "block");
		return;	
	}

	VALID["minute"] = new CPANEL.validate.validator(LANG.Minute);
	VALID["minute"].add("minute", function() { return validate_minute_field("minute"); }, LANG.cron_field_not_valid);
	VALID["minute"].attach();
	
	VALID["hour"] = new CPANEL.validate.validator(LANG.Hour);
	VALID["hour"].add("hour", function() { return validate_hour_field("hour"); }, LANG.cron_field_not_valid);
	VALID["hour"].attach();
	
	VALID["day"] = new CPANEL.validate.validator(LANG.Day);
	VALID["day"].add("day", function() { return validate_day_field("day"); }, LANG.cron_field_not_valid);
	VALID["day"].attach();
	
	VALID["month"] = new CPANEL.validate.validator(LANG.Month);
	VALID["month"].add("month", function() { return validate_month_field("month"); }, LANG.cron_field_not_valid);
	VALID["month"].attach();
	
	VALID["weekday"] = new CPANEL.validate.validator(LANG.Weekday);
	VALID["weekday"].add("weekday", function() { return validate_weekday_field("weekday"); }, LANG.cron_field_not_valid);
	VALID["weekday"].attach();
	
	VALID["command"] = new CPANEL.validate.validator(LANG.Command);
	VALID["command"].add("command", "min_length(%input%, 1)", LANG.command_not_empty);
	VALID["command"].attach();
	
	// check for Common Settings if someone enters a value
	YAHOO.util.Event.on(["minute", "hour", "day", "month", "weekday"], "change", function() { check_common_options(); });
	
	CPANEL.validate.attach_to_form("add_new_cron", VALID, add_new_cron_job);
	
	CPANEL.util.catch_enter(["minute", "hour", "day", "month", "weekday", "command"], "add_new_cron");

	setup_email();
	init_email_div();	
	check_empty_email();
	load_cron_table();
};
YAHOO.util.Event.onDOMReady(init);
