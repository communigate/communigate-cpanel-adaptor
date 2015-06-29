var VALID = [];
var CHANGE_VALID = [];
var OPEN_MODULE = null;
var MXRECORDS_TABLE_UPDATING = 0;
var ANIMATING = false;

var checkMX = function () {
var api2_call = {
"cpanel_jsonapi_version": 2,
"cpanel_jsonapi_module": "Email",
"cpanel_jsonapi_func": "listmxs",
"domain": YAHOO.util.Dom.get("domain").value,
"show_a_records": 1
};

$.ajax({
type: "GET",
url: CPANEL.urls.json_api() + '&' + $.param(api2_call),
success: function(o){
	    var records = "";
	    data = YAHOO.lang.JSON.parse(o);
	    if (data.cpanelresult.data[0]) {
	    } else {
		change_mxcheck_default("local");
	    }
	}
	});
}

var change_mxcheck_default = function (state) {
    var api2_call = {
        "cpanel_jsonapi_version": 2,
        "cpanel_jsonapi_module": "Email",
        "cpanel_jsonapi_func": "setmxcheck",
        "domain": YAHOO.util.Dom.get("domain").value,
        "mxcheck": state
    };
    // callback
    var callback = {
        success: function(o) {
        },
        failure: function(o) {
        }
    };
    // send the request
    YAHOO.util.Connect.asyncRequest('GET', CPANEL.urls.json_api(api2_call), callback, '');
};


var toggle_module = function(id) {
    if (ANIMATING == false) {
        ANIMATING = true;
        if (OPEN_MODULE == id) {
            before_hide_module(id);
            CPANEL.animate.slide_up(OPEN_MODULE, function() {
                after_hide_module(id);
                ANIMATING = false;
                OPEN_MODULE = null;
            });
        } else {
            if (YAHOO.util.Dom.getStyle(OPEN_MODULE, "display") == "block") {
                var current_open_module = OPEN_MODULE;
                before_hide_module(current_open_module);
                CPANEL.animate.slide_up(OPEN_MODULE, function() {
                    after_hide_module(current_open_module);
                });
            }

            before_show_module(id);
            CPANEL.animate.slide_down(id, function() {
                after_show_module(id);
                ANIMATING = false;
                OPEN_MODULE = id;
            });
        }
    }
};

var before_hide_module = function(id) {
    var split = id.split("_");
    var type = split[0];
    id = split[1];

    if (type == "edit") {
        // hide validation
        for (var i in CHANGE_VALID) {
            if (!CHANGE_VALID.hasOwnProperty(i)) continue;
            CHANGE_VALID[i].clear_messages();
        }
    }
};

var after_hide_module = function(id) {
    var split = id.split("_");
    var type = split[0];
    id = split[1];

    if (type == "edit") {
        // purge validation event handlers in this module
        YAHOO.util.Event.purgeElement("priority_" + id);
        YAHOO.util.Event.purgeElement("destination_" + id);
        YAHOO.util.Event.purgeElement("confirm_edit_" + id);

        YAHOO.util.Dom.setStyle("edit_input_" + id, "display", "block");
        YAHOO.util.Dom.get("edit_status_" + id).innerHTML = "";
    }
    if (type == "delete") {
        YAHOO.util.Dom.setStyle("delete_input_" + id, "display", "block");
        YAHOO.util.Dom.get("delete_status_" + id).innerHTML = "";
    }
};

var before_show_module = function(id) {

};

var after_show_module = function(id) {
    var split = id.split("_");
    var type = split[0];
    id = split[1];

    if (type == "edit") {
        // set up validation
        CHANGE_VALID["priority"] = new CPANEL.validate.validator(LANG.MX_priority);
        CHANGE_VALID["priority"].add("priority_" + id, "positive_integer", LANG.MX_priority_positive_integer);
        CHANGE_VALID["priority"].attach();

        CHANGE_VALID["destination"] = new CPANEL.validate.validator(LANG.MX_destination);
        CHANGE_VALID["destination"].add("destination_" + id, "fqdn", LANG.MX_destination_fqdn);
        CHANGE_VALID["destination"].attach();

        CHANGE_VALID["content_changed"] = new CPANEL.validate.validator(LANG.content_changed);
        CHANGE_VALID["content_changed"].add("old_destination_" + id, function() {
            return content_changed(id);
        }, LANG.must_change_before_edit);
        CHANGE_VALID["content_changed"].attach();

        CPANEL.validate.attach_to_form("confirm_edit_" + id, CHANGE_VALID, function() {
            edit_mx_record(id)
        });

        CPANEL.util.catch_enter(["priority_" + id, "destination_" + id], "confirm_edit_" + id);
    }
};

var add_mx_record = function() {
    // build the call
    var exchanger = YAHOO.util.Dom.get("destination").value;
    var preference = YAHOO.util.Dom.get("priority").value;
    var api2_call = {
        "cpanel_jsonapi_version": 2,
        "cpanel_jsonapi_module": "Email",
        "cpanel_jsonapi_func": "addmx",
        "domain": YAHOO.util.Dom.get("domain").value,
        "exchanger": exchanger,
        "preference": preference
    };

    // callback
    var callback = {
        success: function(o) {
             change_mxcheck_default("remote");
	     var data;
            try {
                data = YAHOO.lang.JSON.parse(o.responseText);
            } catch (e) {
                CPANEL.widgets.status_bar("add_new_record_status_bar", "error", CPANEL.lang.json_error, CPANEL.lang.json_parse_failed);
                reset_add_mx_record();
                update_mx_records_table();
                return;
            }
            if (data.cpanelresult.error) {
                CPANEL.widgets.status_bar("add_new_record_status_bar", "error", CPANEL.lang.Error, data.cpanelresult.error);
                reset_add_mx_record();
                update_mx_records_table();
            } else if (!data.cpanelresult.data) {
                CPANEL.widgets.status_bar("add_new_record_status_bar", "error", CPANEL.lang.Error, "unknown error");
            } else if (data.cpanelresult.data[0].status == 1) {
                if (data.cpanelresult.data[0].checkmx.warnings && data.cpanelresult.data[0].checkmx.warnings.length) {
                    var warnings_html = build_warnings_html(data.cpanelresult.data[0].checkmx.warnings);
                    CPANEL.widgets.status_bar("add_new_record_status_bar", "warning", LANG.MX_added_record, preference + " &rarr; " + exchanger + '<br />' + warnings_html, {
                        noCountdown: true
                    });
                } else {
                    CPANEL.widgets.status_bar("add_new_record_status_bar", "success", LANG.MX_added_record, preference + " &rarr; " + exchanger);
                }
                reset_add_mx_record();
                update_mx_state_from_checkmx(data.cpanelresult.data[0].checkmx);
                update_mxcheck_auto_warnings(data.cpanelresult.data[0].checkmx.warnings);
                update_mx_records_table();
            } else {
                CPANEL.widgets.status_bar("add_new_record_status_bar", "error", CPANEL.lang.Error, data.cpanelresult.data[0].statusmsg);
                reset_add_mx_record();
                update_mx_records_table();
            }
        },
        failure: function(o) {
            CPANEL.widgets.status_bar("add_new_record_status_bar", "error", CPANEL.lang.ajax_error, CPANEL.lang.ajax_try_again);
            reset_add_mx_record();
            update_mx_records_table();
        }
    };

    // send the request
    YAHOO.util.Connect.asyncRequest('GET', CPANEL.urls.json_api(api2_call), callback, '');

    YAHOO.util.Dom.setStyle("submit_mx_record", "display", "none");
    YAHOO.util.Dom.get("add_new_record_status").innerHTML = CPANEL.icons.ajax + " " + LANG.MX_adding_record;
};

var add_mx_record_predefined = function() {
    // build the call
    var exchanger = YAHOO.util.Dom.get("destination").value;
    var preference = YAHOO.util.Dom.get("priority").value;
    var api2_call = {
        "cpanel_jsonapi_version": 2,
        "cpanel_jsonapi_module": "Email",
        "cpanel_jsonapi_func": "addmx",
        "domain": YAHOO.util.Dom.get("domain").value,
        "exchanger": exchanger,
        "preference": preference
    };

    // callback
    var callback = {
        success: function(o) {
            var data;
            try {
                data = YAHOO.lang.JSON.parse(o.responseText);
            } catch (e) {
                CPANEL.widgets.status_bar("add_new_record_status_bar", "error", CPANEL.lang.json_error, CPANEL.lang.json_parse_failed);
                reset_add_mx_record();
                update_mx_records_table();
                return;
            }
            if (data.cpanelresult.error) {
                CPANEL.widgets.status_bar("add_new_record_status_bar", "error", CPANEL.lang.Error, data.cpanelresult.error);
                reset_add_mx_record();
                update_mx_records_table();
            } else if (!data.cpanelresult.data) {
                CPANEL.widgets.status_bar("add_new_record_status_bar", "error", CPANEL.lang.Error, "unknown error");
            } else if (data.cpanelresult.data[0].status == 1) {
                if (data.cpanelresult.data[0].checkmx.warnings && data.cpanelresult.data[0].checkmx.warnings.length) {
                    var warnings_html = build_warnings_html(data.cpanelresult.data[0].checkmx.warnings);
                    CPANEL.widgets.status_bar("add_new_record_status_bar", "warning", LANG.MX_added_record, preference + " &rarr; " + exchanger + '<br />' + warnings_html, {
                        noCountdown: true
                    });
                } else {
                    CPANEL.widgets.status_bar("add_new_record_status_bar", "success", LANG.MX_added_record, preference + " &rarr; " + exchanger);
                }
                reset_add_mx_record();
                update_mx_state_from_checkmx(data.cpanelresult.data[0].checkmx);
                update_mxcheck_auto_warnings(data.cpanelresult.data[0].checkmx.warnings);
                update_mx_records_table();
            } else {
                CPANEL.widgets.status_bar("add_new_record_status_bar", "error", CPANEL.lang.Error, data.cpanelresult.data[0].statusmsg);
                reset_add_mx_record();
                update_mx_records_table();
            }
        },
        failure: function(o) {
            CPANEL.widgets.status_bar("add_new_record_status_bar", "error", CPANEL.lang.ajax_error, CPANEL.lang.ajax_try_again);
            reset_add_mx_record();
            update_mx_records_table();
        }
    };

    // send the request
    YAHOO.util.Connect.asyncRequest('GET', CPANEL.urls.json_api(api2_call), callback, '');

    YAHOO.util.Dom.setStyle("submit_mx_record", "display", "none");
    YAHOO.util.Dom.get("add_new_record_status").innerHTML = CPANEL.icons.ajax + " " + LANG.MX_adding_record;
};


// custom validation function for editing mx record
var content_changed = function(id) {
    var old_data = YAHOO.util.Dom.get("old_priority_" + id).value + YAHOO.util.Dom.get("old_destination_" + id).value;
    var new_data = YAHOO.util.Dom.get("priority_" + id).value + YAHOO.util.Dom.get("destination_" + id).value;
    return (old_data != new_data);
};

var reset_add_mx_record = function() {
    YAHOO.util.Dom.setStyle("submit_mx_record", "display", "block");
    YAHOO.util.Dom.get("add_new_record_status").innerHTML = '';

    YAHOO.util.Dom.get("priority").value = "0";
    YAHOO.util.Dom.get("destination").value = "";

    for (var i in VALID) {
        if (!VALID.hasOwnProperty(i)) continue;
        VALID[i].clear_messages();
    }
};

var build_warnings_html = function(warnings) {
    var html = '<ul>';
    for (var i = 0; i < warnings.length; i++) {
        html += '<li>' + warnings[i] + '</li>';
    }
    html += '</ul>';

    return html;
}

var update_mxcheck_auto_warnings = function(warnings) {
    /*
	if (warnings.length > 0) {
		YAHOO.util.Dom.setStyle("mxcheck_auto_warnings", "display", "block");
        var html = "Auto-detect warnings:<br />" + build_warnings_html(warnings);
		YAHOO.util.Dom.get("mxcheck_auto_warnings").innerHTML = html;
	}
	else {
		YAHOO.util.Dom.setStyle("mxcheck_auto_warnings", "display", "none");
		YAHOO.util.Dom.get("mxcheck_auto_warnings").innerHTML = "";
	}
	*/
};

var delete_mx_record = function(id, priority, destination) {
    // build the call
    var priority = document.getElementById('priority_' + id).value;
    var destination = document.getElementById('destination_' + id).value;
    var api2_call = {
        "cpanel_jsonapi_version": 2,
        "cpanel_jsonapi_module": "Email",
        "cpanel_jsonapi_func": "delmx",
        "domain": YAHOO.util.Dom.get("domain").value,
        "exchange": destination,
        "preference": priority
    };

    // callback
    var callback = {
        success: function(o) {
	    checkMX();
	    try {
                var data = YAHOO.lang.JSON.parse(o.responseText);
                if (data.cpanelresult.error) {
                    toggle_module("delete_" + id);
                    CPANEL.widgets.status_bar("status_bar_" + id, "error", CPANEL.lang.Error, data.cpanelresult.error);
                } else if (data.cpanelresult.data[0].status == 1) {
                    CPANEL.animate.fade_out('info_row_' + id, function() {
                        // if all rows are now empty reload the table
                        var all_rows_empty = true;
                        var table_rows = YAHOO.util.Dom.getElementsByClassName("dt_info_row", "tr", "mx_records_table");
                        for (var i = 0; i < table_rows.length; i++) {
                            if (YAHOO.util.Dom.getStyle(table_rows[i], "display") != "none") all_rows_empty = false;
                        }
                        if (all_rows_empty) update_mx_records_table();
                        update_mxcheck_auto_warnings(data.cpanelresult.data[0].checkmx.warnings);
                    });
                    CPANEL.animate.fade_out('module_row_' + id);
                    update_mx_state_from_checkmx(data.cpanelresult.data[0].checkmx);
                } else {
                    toggle_module("delete_" + id);
                    CPANEL.widgets.status_bar("status_bar_" + id, "error", CPANEL.lang.Error, data.cpanelresult.data[0].statusmsg);
                }
            } catch (e) {
                toggle_module("delete_" + id);
                CPANEL.widgets.status_bar("status_bar_" + id, "error", CPANEL.lang.json_error, CPANEL.lang.json_parse_failed);
            }
        },
        failure: function(o) {
            toggle_module("delete_" + id);
            CPANEL.widgets.status_bar("status_bar_" + id, "error", CPANEL.lang.ajax_error, CPANEL.lang.ajax_try_again);
        }
    };

    // send the request
    YAHOO.util.Connect.asyncRequest('GET', CPANEL.urls.json_api(api2_call), callback, '');

    YAHOO.util.Dom.setStyle("delete_input_" + id, "display", "none");
    YAHOO.util.Dom.get("delete_status_" + id).innerHTML = CPANEL.icons.ajax + " " + LANG.MX_deleting_record;
};

var update_mx_state_from_checkmx = function(checkmx) {
    YAHOO.util.Dom.get("mxcheck_state").value = checkmx.mxcheck;
    YAHOO.util.Dom.get("detected_state").value = checkmx.detected;
    YAHOO.util.Dom.get("mxcheck_status").innerHTML = "";
    update_mxcheck_state_ui();
}

var edit_mx_record = function(id) {
    // build the call
    var new_priority = YAHOO.util.Dom.get("priority_" + id).value;
    var new_destination = YAHOO.util.Dom.get("destination_" + id).value;
    var api2_call = {
        "cpanel_jsonapi_version": 2,
        "cpanel_jsonapi_module": "Email",
        "cpanel_jsonapi_func": "changemx",
        "domain": YAHOO.util.Dom.get("domain").value,
        "exchanger": new_destination,
        "preference": new_priority,
        "oldexchanger": YAHOO.util.Dom.get("old_destination_" + id).value,
        "oldpreference": YAHOO.util.Dom.get("old_priority_" + id).value
    };

    // callback
    var callback = {
        success: function(o) {
            try {
                var data = YAHOO.lang.JSON.parse(o.responseText);
                if (data.cpanelresult.error) {
                    toggle_module("edit_" + id);
                    CPANEL.widgets.status_bar("status_bar_" + id, "error", CPANEL.lang.Error, data.cpanelresult.error);
                } else if (data.cpanelresult.data[0].status == 1) {
                    YAHOO.util.Dom.get("old_priority_" + id).value = new_priority;
                    YAHOO.util.Dom.get("old_destination_" + id).value = new_destination;
                    YAHOO.util.Dom.get("display_priority_" + id).innerHTML = new_priority;
                    YAHOO.util.Dom.get("display_destination_" + id).innerHTML = new_destination;

                    toggle_module("edit_" + id);
                    if (data.cpanelresult.data[0].checkmx.warnings && data.cpanelresult.data[0].checkmx.warnings.length) {
                        var warnings_html = build_warnings_html(data.cpanelresult.data[0].checkmx.warnings);
                        CPANEL.widgets.status_bar("status_bar_" + id, "warning", LANG.MX_changed_record, warnings_html, {
                            noCountdown: true
                        });
                    } else {
                        CPANEL.widgets.status_bar("status_bar_" + id, "success", LANG.MX_changed_record);
                    }
                    update_mx_state_from_checkmx(data.cpanelresult.data[0].checkmx);
                    update_mxcheck_auto_warnings(data.cpanelresult.data[0].checkmx.warnings);
                } else {
                    toggle_module("edit_" + id);
                    CPANEL.widgets.status_bar("status_bar_" + id, "error", CPANEL.lang.Error, data.cpanelresult.data[0].statusmg);
                }
            } catch (e) {
                toggle_module("edit_" + id);
                CPANEL.widgets.status_bar("status_bar_" + id, "error", CPANEL.lang.json_error, CPANEL.lang.json_parse_failed);
            }
        },
        failure: function(o) {
            toggle_module("edit_" + id);
            CPANEL.widgets.status_bar("status_bar_" + id, "error", CPANEL.lang.ajax_error, CPANEL.lang.ajax_try_again);
        }
    };

    // send the request
    YAHOO.util.Connect.asyncRequest('GET', CPANEL.urls.json_api(api2_call), callback, '');

    YAHOO.util.Dom.setStyle("edit_input_" + id, "display", "none");
    YAHOO.util.Dom.get("edit_status_" + id).innerHTML = CPANEL.icons.ajax + " " + LANG.MX_editing_record;
};

var check_default_A_record = function(html) {
    // check to see if there is just one entry and it's the A record
    if (html.search('<td id="display_destination_1">A Record</td>') != -1 && html.search('<tr id="info_row_2"') == -1) {
        // remove newlines
        html = html.replace(/\n/g, '');

        // replacement line
        var new_row = '<td colspan="3">' + LANG.MX_no_records_set + '</td></tr>';

        // find the A Record line
        var A_record_row = new RegExp(/<td id="display_priority_1">.*?<\/tr>/i);
        // replace
        html = html.replace(A_record_row, new_row);
    }
    return html;
};


var update_mx_records_table = function() {
    if (MXRECORDS_TABLE_UPDATING) {
        return;
    }

    MXRECORDS_TABLE_UPDATING = 1;
    var callback = {
        success: function(o) {
            MXRECORDS_TABLE_UPDATING = 0;
            var table = check_default_A_record(o.responseText);
            YAHOO.util.Dom.get("mx_entries").innerHTML = table;
            YAHOO.util.Dom.get("mxcheck_status").innerHTML = "";
            update_mxcheck_state_ui();
        },
        failure: function(o) {
            MXRECORDS_TABLE_UPDATING = 0;
            YAHOO.util.Dom.get("mx_entries").innerHTML = '<div style="padding: 20px">' + CPANEL.icons.error + " " + CPANEL.lang.ajax_error + ": " + CPANEL.lang.ajax_try_again + "</div>";
        }
    };

    // send the AJAX request
    var domain = YAHOO.util.Dom.get("domain").value;
    YAHOO.util.Connect.asyncRequest('GET', "mx_records.html?domain=" + domain + "&cache_fix=" + new Date().getTime(), callback, '');

    var table_region = YAHOO.util.Region.getRegion(YAHOO.util.Dom.get("mx_entries"));
    var height = parseInt(table_region.height) - 20;
    YAHOO.util.Dom.get("mx_entries").innerHTML = '<div style="height: ' + table_region.height + 'px; padding: 20px 0px 0px 20px">' + CPANEL.icons.ajax + " " + CPANEL.lang.ajax_loading + "</div>";
    YAHOO.util.Dom.get("change_mxcheck_button").disabled = true;
    YAHOO.util.Dom.get("mxcheck_status").innerHTML = CPANEL.lang.ajax_loading;

    deselect_mxcheck_ui();
};

var change_mxcheck = function(state) {
    // don't submit the request if the state hasn't changed
    var mxcheck_state_el = YAHOO.util.Dom.get("mxcheck_state");
    var mxcheck = CPANEL.util.get_radio_value("mxcheck", "mxcheck_options_div");
    if (mxcheck_state_el.value == mxcheck) return true;

    var api2_call = {
        "cpanel_jsonapi_version": 2,
        "cpanel_jsonapi_module": "Email",
        "cpanel_jsonapi_func": "setmxcheck",
        "domain": YAHOO.util.Dom.get("domain").value,
        "mxcheck": mxcheck
    };

    // callback
    var callback = {
        success: function(o) {
            try {
                var data = YAHOO.lang.JSON.parse(o.responseText);
                if (data.cpanelresult.error) {
                    YAHOO.util.Dom.get("mxcheck_status").innerHTML = CPANEL.icons.error + " " + data.cpanelresult.error;
                } else if (data.cpanelresult.data[0].status == 1) {
                    mxcheck_state_el.value = data.cpanelresult.data[0].mxcheck;
                    YAHOO.util.Dom.get("detected_state").value = data.cpanelresult.data[0].detected;
                    YAHOO.util.Dom.get("mxcheck_status").innerHTML = "";
                    update_mxcheck_auto_warnings(data.cpanelresult.data[0].checkmx.warnings);
                } else {
                    YAHOO.util.Dom.get("mxcheck_status").innerHTML = CPANEL.icons.error + " " + data.cpanelresult.data[0].statusmsg;
                }
            } catch (e) {
                YAHOO.util.Dom.get("mxcheck_status").innerHTML = CPANEL.icons.error + " " + CPANEL.lang.json_parse_failed;
            }
            update_mxcheck_state_ui();
        },
        failure: function(o) {
            YAHOO.util.Dom.get("mxcheck_status").innerHTML = CPANEL.icons.error + " " + CPANEL.lang.ajax_error + ": " + CPANEL.lang.ajax_try_again;
            update_mxcheck_state_ui();
        }
    };

    // send the request
    YAHOO.util.Connect.asyncRequest('GET', CPANEL.urls.json_api(api2_call), callback, '');

    YAHOO.util.Dom.get("change_mxcheck_button").disabled = true;
    YAHOO.util.Dom.get("mxcheck_status").innerHTML = CPANEL.icons.ajax + " " + LANG.MX_changing;
};

var deselect_mxcheck_ui = function() {
    YAHOO.util.Dom.get("mxcheck_auto").checked = false;
    YAHOO.util.Dom.get("mxcheck_local").checked = false;
    YAHOO.util.Dom.get("mxcheck_secondary").checked = false;
    YAHOO.util.Dom.get("mxcheck_remote").checked = false;

    YAHOO.util.Dom.setStyle("mxcheck_auto_label", "font-weight", "normal");
    YAHOO.util.Dom.setStyle("mxcheck_local_label", "font-weight", "normal");
    YAHOO.util.Dom.setStyle("mxcheck_secondary_label", "font-weight", "normal");
    YAHOO.util.Dom.setStyle("mxcheck_remote_label", "font-weight", "normal");

    YAHOO.util.Dom.get("mxcheck_auto_current_setting").innerHTML = "";
    YAHOO.util.Dom.get("mxcheck_detected_state_local").innerHTML = "";
    YAHOO.util.Dom.get("mxcheck_detected_state_secondary").innerHTML = "";
    YAHOO.util.Dom.get("mxcheck_detected_state_remote").innerHTML = "";
};

var update_mxcheck_state_ui = function() {
    var mxcheck_state = YAHOO.util.Dom.get("mxcheck_state").value;
    var detected_state = YAHOO.util.Dom.get("detected_state").value;

    YAHOO.util.Dom.get("change_mxcheck_button").disabled = false;
    deselect_mxcheck_ui();
    if (mxcheck_state == "auto" || mxcheck_state == "local" || mxcheck_state == "secondary" || mxcheck_state == "remote") {
        YAHOO.util.Dom.get("mxcheck_" + mxcheck_state).checked = true;
        YAHOO.util.Dom.setStyle("mxcheck_" + mxcheck_state + "_label", "font-weight", "bold");

        if (mxcheck_state == "auto" && (detected_state == "local" || detected_state == "secondary" || detected_state == "remote")) {
            if (detected_state == "local") YAHOO.util.Dom.get("mxcheck_auto_current_setting").innerHTML = ": " + LANG.MX_Local;
            else if (detected_state == "secondary") YAHOO.util.Dom.get("mxcheck_auto_current_setting").innerHTML = ": " + LANG.MX_Backup;
            else if (detected_state == "remote") YAHOO.util.Dom.get("mxcheck_auto_current_setting").innerHTML = ": " + LANG.MX_Remote;
            YAHOO.util.Dom.get("mxcheck_detected_state_" + detected_state).innerHTML = "(" + LANG.MX_current_detected_setting + ")";
        }
    }
};

var add_validation = function() {

    var disallow_ip = function() {
        var value = document.getElementById('destination').value;
        if (CPANEL.validate.ip(value)) {
            return false;
        }
        return CPANEL.validate.fqdn(value);
    }

    VALID["priority"] = new CPANEL.validate.validator(LANG.MX_priority);
    VALID["priority"].add("priority", "positive_integer", LANG.MX_priority_positive_integer);
    VALID["priority"].attach();

    VALID["destination"] = new CPANEL.validate.validator(LANG.MX_destination);
    VALID["destination"].add("destination", disallow_ip, LANG.MX_destination_fqdn);
    VALID["destination"].attach();

    CPANEL.validate.attach_to_form("submit_mx_record", VALID, add_mx_record);
};

var toggle_domain = function() {
    var domain = YAHOO.util.Dom.get("domain").value;
    if (domain != "_select_") {
        CPANEL.animate.slide_down('mx_input_and_table');
        update_mx_records_table();
    } else {
        CPANEL.animate.slide_up('mx_input_and_table');
    }
};

var init_page = function() {
    add_validation();

    CPANEL.util.catch_enter(["priority", "destination"], "submit_mx_record");

    // load the table
    if (YAHOO.util.Dom.get("domain").value != "_select_") {
        update_mx_records_table();
    }
};

YAHOO.util.Event.onDOMReady(init_page);

//this style rule must be independent of external style sheets
(function() {
    var _stylesheet = [
        //other rules can be added to this array
        ['div.dt_module', 'display:none']
    ];
    var inserter;
    var first_stylesheet = document.styleSheets[0];
    if ('insertRule' in first_stylesheet) { //W3C DOM
        _stylesheet.forEach(function(rule) {
            first_stylesheet.insertRule(rule[0] + ' {' + rule[1] + '}', 0);
        });
    } else { //IE
        _stylesheet.forEach(function(rule) {
            first_stylesheet.addRule(rule[0], rule[1], 0);
        });
    }
})();
