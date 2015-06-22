// NOTE: This page is pretty complicated.  There is a lot of DOM being injected and you need to pay attention to the objects that get
// passed around from function to function.  I originally had things separated by building all the DOM all at once and then adding all the event handlers right after.
// I had to scrap that because it was too slow.  If you see something that makes you say "geez, this is so hard to read, why did he do that?" the answer is: it's like that
// to be fast.  If you make an architecture/DOM change be sure to test it against a large number of email addresses in the table.
// C. Oakman - chriso@cpanel.net

// globals
if (!self['DEFAULT_QUOTA_SELECTED']) {
    var DEFAULT_QUOTA_SELECTED = "userdefined";
}
if (!self['USERDEFINED_QUOTA_DEFAULT_VALUE']) {
    var USERDEFINED_QUOTA_DEFAULT_VALUE = DEFAULT_EMAIL_QUOTA;
}
var ACCOUNTS;
var PAGE_DATA;
var AJAX_FAILURES = 0;
var AJAX_FAILURE_ATTEMPTS = 3;
var TABLE_REQUEST_ACTIVE = false;
var TABLE_REQUEST_PENDING = false;
var LAST_SEARCH_TXT = "";
var API;
var SORT_STATE;
var MENUS = [];
var ADD_EMAIL_VALID = {};
var OPEN_ACTION_DIV = 0;
var CHANGE_PASSWORD_BAR;
var CHANGE_PASSWORD1_VALIDATION;
var CHANGE_PASSWORD2_VALIDATION;
var CHANGE_QUOTA_VALID = {};
var Handlebars = window.Handlebars;

var AJAX_TIMEOUT_MS = 60000; //1 minute

var change_password_template = Handlebars.compile(DOM.get("change_password_template").text.trim());
var change_quota_template = Handlebars.compile(DOM.get("change_quota_template").text.trim());
var delete_template = Handlebars.compile(DOM.get("delete_template").text.trim());
var airsync_template = Handlebars.compile(DOM.get("airsync_template").text.trim());
var image_template = Handlebars.compile(DOM.get("image_template").text.trim());
var show_details_template = Handlebars.compile(DOM.get("show_details_template").text.trim());
var change_type_template = Handlebars.compile(DOM.get("change_type_template").text.trim());
var change_type_template_submit = Handlebars.compile(DOM.get("change_type_template_submit").text.trim());

// update the email accounts table with fresh information from the server
var update_email_accounts = function(new_acc) {
    // case 32016:: prevent the user from submitting many many requests
    if (TABLE_REQUEST_PENDING) return true;

    // success function defined here so we can use a setTimeout to call it
    // need to call this function like this to prevent a possible race condition when the ajax request returns faster
    // than it takes the browser to destroy the table elements and all event handlers in it
    var ajax_success = function(o) {
        // if we are still destroying the table poll every 10 milliseconds until that task is finished
        if (TABLE_REQUEST_ACTIVE == true) {
            setTimeout(function() {
                ajax_success(o);
            }, 10);
        }
        // once the table is fully destroyed build the new one
        else {
            TABLE_REQUEST_PENDING = false;
            AJAX_FAILURES = 0;

            // parse the JSON response data
            try {
                var data = YAHOO.lang.JSON.parse(o.responseText);

		ACCOUNTS = Object.keys(data.cpanelresult.data[0].accounts).map(function(k) { return data.cpanelresult.data[0].accounts[k] });
		CLASSES = data.cpanelresult.data[0].classes;
                PAGE_DATA = data.cpanelresult.paginate;
		
                //Typecast to numbers
                for (var key in PAGE_DATA) {
                    PAGE_DATA[key] = Number(PAGE_DATA[key]);
                }

                if (ACCOUNTS.length > 0) {
                    build_email_table();
                } else {
                    show_no_accounts();
                }

		for (var i = 0; i < ACCOUNTS.length; i++){
		    if (ACCOUNTS[i]['username'] == new_acc){
			var elem = document.getElementById("email_table_search_input");
			elem.value = ACCOUNTS[i]['prefs']['AccountName'];   
			search_email();
			toggle_action_div(null, {
				"id": "change_quota_module_" + i,
				    "index": i,
				    "action": "change_quota"
				    });
		    }; 
		}; 		       
		search_email();
            } catch (e) {
                json_parse_error();
            }
        }
    };

    // failure function defined here so we can use a setTimeout to call it
    // need to call this function like this to prevent a possible race condition when the ajax request returns faster
    // than it takes the browser to destroy the table elements and all event handlers in it
    var ajax_failure = function(o) {
        // if we are still destroying the table poll every 10 milliseconds until that task is finished
        if (TABLE_REQUEST_ACTIVE == true) {
            setTimeout(function() {
                ajax_failure(o);
            }, 10);
        }
        // once the table is fully destroyed we can write things to it
        else {
            TABLE_REQUEST_PENDING = false;

            var div_region = YAHOO.util.Region.getRegion(YAHOO.util.Dom.get("accounts_table"));
            if (div_region.height > 0) {
                var html_start = '<div style="height: ' + div_region.height + 'px"><div style="padding: 20px">';
                var html_end = '</div></div>';
            } else {
                var html_start = '<div style="padding: 20px">';
                var html_end = '</div>';
            }

            // permission error; session has probably timed out and they need to login again
            if (o.status == '401') {
                var html = CPANEL.icons.error + ' ' + LANG.permission_401 + '  ' + CPANEL.lang.ajax_try_again;
                YAHOO.util.Dom.get("accounts_table").innerHTML = html_start + html + html_end;
            }
            // else retry the request up to 10 times
            else if (AJAX_FAILURES < AJAX_FAILURE_ATTEMPTS) {
                AJAX_FAILURES++;
                var html = CPANEL.icons.error + ' ' + LANG.ajax_failure + ' ' + LANG.retrying_3_seconds;
                YAHOO.util.Dom.get("accounts_table").innerHTML = html_start + html + html_end;
                setTimeout(update_email_accounts, 3000);
            } else {
                var html = CPANEL.icons.error + ' ' + LANG.ajax_failure + ' ' + CPANEL.lang.ajax_try_again;
                YAHOO.util.Dom.get("accounts_table").innerHTML = html_start + html + html_end;
            }
        }
    };

    // callback functions
    var callback = {
        success: function(o) {
            ajax_success(o);
        },
        failure: function(o) {
            ajax_failure(o);
        },
        timeout: AJAX_TIMEOUT_MS
    };

    // set this variable to prevent a race condition with the ajax request
    TABLE_REQUEST_ACTIVE = true;
    // unset when the ajax comes back
    TABLE_REQUEST_PENDING = true;

    // send the AJAX request
    YAHOO.util.Connect.asyncRequest('GET', CPANEL.urls.json_api(API), callback, '');

    var div_region = YAHOO.util.Region.getRegion(YAHOO.util.Dom.get("accounts_table"));
    if (div_region.height > 0) {
        YAHOO.util.Dom.get("accounts_table").innerHTML = '<div style="height: ' + div_region.height + 'px"><div style="padding: 20px">' + CPANEL.icons.ajax + ' ' + CPANEL.lang.ajax_loading + '</div></div>';
    } else {
        YAHOO.util.Dom.get("accounts_table").innerHTML = '<div style="padding: 20px">' + CPANEL.icons.ajax + ' ' + CPANEL.lang.ajax_loading + '</div>';
    }

    // while the AJAX request is being sent destroy menu objects
    for (var i = 0; i < MENUS.length; i++) {
        if (MENUS[i]) {
            MENUS[i].destroy();
        }
    }
    MENUS = [];

    // clear any validation that may still be hanging around (ie6 bug with the YUI panels)
    if (YAHOO.util.Dom.inDocument(OPEN_ACTION_DIV.id) == true) {
        if (YAHOO.util.Dom.getStyle(OPEN_ACTION_DIV.id, "display") != "none") {
            before_hide_module(OPEN_ACTION_DIV);
        }
    }

    // toggle the race condition flag
    TABLE_REQUEST_ACTIVE = false;
};

// message shown when no accounts are returned from the API2 call
var show_no_accounts = function() {
    var html = '<div id="loading_div" style="padding: 20px; text-align: center">' + LANG.no_accounts_found + '</div>';
    YAHOO.util.Dom.get("accounts_table").innerHTML = html;
};

// destroy the current email table and build a new one from the ACCOUNTS variable
var build_email_table = function() {
    YAHOO.util.Dom.get("accounts_table").innerHTML = build_email_table_markup();
    build_progress_bars();
};

// build the HTML markup for the new email table
var build_email_table_markup = function() {
    // set the initial row stripe
    var row_toggle = 'rowA';

    // loop through the email accounts and build the table
    var html = '<table id="table_email_accts" class="table table-striped" border="0" cellspacing="0" cellpadding="0">';
    html += '<thead>' + '<tr>' + '<th class="col0"> </th>' + '<th class="col1">Account</span></th>' + '<th class="col2"><span>Stats</span></th>' + '<th class="col4"><span>Type</span></th>' + '<th class="col3"><span class="col3span">References</span></th>';
    html += '<colgroup>' + '<col>' + '<col width="30%">' + '<col width="9%">' + '<col width="10%">' + '<col width="53%">' + '</colgroup>';

    for (var i = 0; i < ACCOUNTS.length; i++) {

        // set the disk quota
        if (ACCOUNTS[i]['_diskquota'] == 0 || ACCOUNTS[i]['quota'] == "unlimited") {
            ACCOUNTS[i]['humandiskquota'] = "&infin;";
        } else {
            ACCOUNTS[i]['humandiskquota'] = ACCOUNTS[i]['quota'];
        }

        // convert diskused to an integer
        ACCOUNTS[i]['used'] = parseInt(ACCOUNTS[i]['used']);

        html += '<tr id="account_row_' + i + '" class="dt_info_row ' + row_toggle + '">';
	html += '<td class="col0 dt-module" title="Change Avatar" onclick="toggle_action_div(null, {id:\'image_module_' + i + '\', index:' + i + ', action:\'image_crop\'})">';

	if (ACCOUNTS[i]['vcard']
	    && ACCOUNTS[i]['vcard']['fileData']
	    && ACCOUNTS[i]['vcard']['fileData'][0]
	    && ACCOUNTS[i]['vcard']['fileData'][0]['vCard']
	    && ACCOUNTS[i]['vcard']['fileData'][0]['vCard'][0]
	    && ACCOUNTS[i]['vcard']['fileData'][0]['vCard'][0]['PHOTO']
	    && ACCOUNTS[i]['vcard']['fileData'][0]['vCard'][0]['PHOTO'][0]
	    && ACCOUNTS[i]['vcard']['fileData'][0]['vCard'][0]['PHOTO'][0]['BINVAL']
	    && ACCOUNTS[i]['vcard']['fileData'][0]['vCard'][0]['PHOTO'][0]['BINVAL'][0]) {
	    var acc_photo = ACCOUNTS[i]['vcard']['fileData'][0]['vCard'][0]['PHOTO'][0]['BINVAL'][0];
	    html += '<img class="avatar" id="avatar_' + i + '" src="data:image/png;base64,' + acc_photo + '" alt="avatar" style="max-width: 48px; cursor: pointer;">' + '</img>';
	} else {
	    html += '<img class="avatar" id="avatar_' + i + '">' + '<span class="glyphicon glyphicon-user avatar_span avatar" id="span_avatar_' + i + '"></span>' + '<span class="glyphicon glyphicon-user glyph-edit"></span>' + '</img>';
	}
	
	html += '</td>';
        html += '<td class="col1">';
	if (ACCOUNTS[i]['prefs']['RealName']){
	html += '<span class="realname_acc" id="realname_' + i + '">' + ACCOUNTS[i]['prefs']['RealName'] + '</span>' + '<br>';
	}
	html += ACCOUNTS[i]['prefs']['AccountName'] + '</td>';
	if (ACCOUNTS[i]['humandiskquota'] == 0){
	    var diskquota_acc = " ∞ ";
	}
	else{
	    var diskquota_acc = ACCOUNTS[i]['humandiskquota'];
	}
        html += '<td class="col2">' + ACCOUNTS[i]['used'] + '<input type="hidden" id="diskused_' + i + '" value="' + ACCOUNTS[i]['used'] + '" /> / <span id="quota_' + i + '">' + diskquota_acc + '</span> <span class="megabyte_font">MB</span><br />';
        html += '<div class="table_progress_bar" id="usage_bar_' + i + '">';
        html += '<div class="progress">';
        html += '<div class="progress-bar" role="progressbar" style="width: 0%;">';
        html += '<span class="sr-only">0%</span>';
        html += '</div>';
        html += '</div>';
        html += '</div>';
	html += '<span class="glyphicon glyphicon-envelope" style="margin-top: 10px;" title="Sent"></span>' + ' ';
	if (ACCOUNTS[i]['stats']['MessagesSent']){
	    var sent = ACCOUNTS[i]['stats']['MessagesSent'].substring(1);
	    html += sent + ' / ';

	}
	else {
	    html += 0 + ' / ';

	}
	html += '<span class="glyphicon glyphicon-inbox" style="margin-top: 10px;" title="Received"></span>' + ' ';
	if (ACCOUNTS[i]['stats']['MessagesReceived']){
	    var received = ACCOUNTS[i]['stats']['MessagesReceived'].substring(1);
	    html += received;
	}
	else {
	    html += 0;
	}
	html += '</span>' + '</td>';
      	html += '<td class="col4" style="white-space: nowrap; text-align: center;">';
	var acc_class = ACCOUNTS[i]['class'];
	
	var acc_modes = CLASSES[acc_class]['AccessModes'];
	var acc_modes_mail = "";
	var acc_modes_xmpp = "";
	var acc_modes_sip = "";
	var acc_modes_webcal = "";
	if (acc_modes.indexOf('Mail') > -1 || acc_modes == "All"){
	    acc_modes_mail = "color: #000000;";
	}
	else {
	    acc_modes_mail = "color: #aaaaaa;";
	}
	if (acc_modes.indexOf('XMPP') > -1 || acc_modes == "All"){
	    acc_modes_xmpp = "color: #000000;";
	}
	else {
	    acc_modes_xmpp = "color: #aaaaaa;";
	}
	if (acc_modes.indexOf('SIP') > -1 || acc_modes == "All"){
	    acc_modes_sip = "color: #000000;";
	}
	else {
	    acc_modes_sip = "color: #aaaaaa;";
	}
	if (acc_modes.indexOf('WebCAL') > -1 || acc_modes == "All"){
	    acc_modes_webcal = "color: #000000;";
	}
	else {
	    acc_modes_webcal = "color: #aaaaaa;";
	}
	html += '<span id="acc_type_' + i + '" onclick="toggle_action_div(null, {id:\'change_type_module_' + i + '\', index:' + i + ', action:\'change_type\'})">' + ACCOUNTS[i]['class'] + '</span>' + '<br>';
	html += '<span id="icon_envelope_' + i + '" class="glyphmargin glyphicon glyphicon-envelope" onclick="toggle_action_div(null, {id:\'change_type_module_' + i + '\', index:' + i + ', action:\'change_type\'})" title="Mail" style="' + acc_modes_mail + '"></span>';
	html += '<span id="icon_comment_' + i + '" class="glyphmargin glyphicon glyphicon-comment" onclick="toggle_action_div(null, {id:\'change_type_module_' + i + '\', index:' + i + ', action:\'change_type\'})" title="Chat/Jabber/XMPP" style="' + acc_modes_xmpp + '"></span>';
	html += '<span id="icon_phone_' + i + '" class="glyphmargin glyphicon glyphicon-phone" onclick="toggle_action_div(null, {id:\'change_type_module_' + i + '\', index:' + i + ', action:\'change_type\'})" title="SIP (Internet calls)" style="' + acc_modes_sip + '"></span>';
	html += '<span id="icon_calendar_' + i + '" class="glyphicon glyphicon-calendar" onclick="toggle_action_div(null, {id:\'change_type_module_' + i + '\', index:' + i + ', action:\'change_type\'})" title="Calendar" style="' + acc_modes_webcal + '"></span>';
	html += '</td>';
        html += '<td class="col3">';
        html += '<table class="table_email_accts_actions" bnorder="0" cellspacing="0" cellpadding="0"><tr>';
        // html += '<td><span class="btn btn-link" onclick="toggle_action_div(null, {id:\'show_details_module_' + i + '\', index:' + i + ', action:\'show_details\'})">' + '<span class="glyphicon glyphicon-tasks"></span>' + ' Details' + '</span></td>';
        html += '<td><span class="btn btn-link" onclick="toggle_action_div(null, {id:\'change_password_module_' + i + '\', index:' + i + ', action:\'change_password\'})">' + '<span class="fa fa-key fa-lg"></span>' + " Password" + '</span></td>';
        html += '<td><span class="btn btn-link" onclick="toggle_action_div(null, {id:\'change_quota_module_' + i + '\', index:' + i + ', action:\'change_quota\'})">' + '<span class="glyphicon glyphicon-cog"></span>' + ' Details' + '</span></td>';
        html += '<td><span class="btn btn-link" onclick="toggle_action_div(null, {id:\'change_type_module_' + i + '\', index:' + i + ', action:\'change_type\'})">' + '<span class="glyphicon glyphicon-list"></span>' + ' Plan' + '</span></td>';
        html += '<td><span class="btn btn-link" onclick="toggle_action_div(null, {id:\'delete_module_' + i + '\', index:' + i + ', action:\'delete\'})">' + '<span class="glyphicon glyphicon-trash"></span>' + " " + LANG.delete2 + '</span></td>';
        html += '<td><div class="btn-group">';
        html += '<button id="email_table_menu_button_' + i + '" class="btn btn-default dropdown-toggle" data-toggle="dropdown" type="button">More<span class="caret"><span></button>';
        html += '<ul class="dropdown-menu" role="menu">';
	if (acc_modes.indexOf('SIP') > -1 || acc_modes == "All"){
	    html += '<li id="li_extensions_' + i + '"><a class="btn btn-link" href="../extensions.html" target="_blank">' + '<span class="btn btn-link">' + '<span class="glyphicon glyphicon-earphone"></span>' + " Extensions" + '</span>' + '</a></li>';
	} else {
	    	    html += '<li style="display: none;" id="li_extensions_' + i + '"><a class="btn btn-link" href="../extensions.html" target="_blank">' + '<span class="btn btn-link">' + '<span class="glyphicon glyphicon-earphone"></span>' + " Extensions" + '</span>' + '</a></li>';
	}

	html += '<li><a class="btn btn-link"><span class="btn btn-link" onclick="toggle_action_div(null, {id:\'airsync_module_' + i + '\', index:' + i + ', action:\'airsync\'})">' + '<span class="glyphicon glyphicon-transfer"></span>' + '<span class="glyphicon glyphicon-phone"></span>' + ' ActiveSync&trade;' + '</span></a></li>';
	
        html += '</ul>';
        html += '</div></td>';
        html += '</tr></table>';
        html += '</td>';
        html += '</tr>';

        html += '<tr id="dt_module_row_' + i + '" class="' + row_toggle + ' action-row" style="border: none;"><td colspan="5">';
        html += '<div id="show_details_module_' + i + '" class="dt_module" style="display: none; margin-left: 0;"></div>';
        html += '<div id="change_password_module_' + i + '" class="dt_module" style="display: none"></div>';
        html += '<div id="change_quota_module_' + i + '" class="dt_module" style="display: none"></div>';
        html += '<div id="airsync_module_' + i + '" class="dt_module" style="display: none"></div>';
        html += '<div id="change_type_module_' + i + '" class="dt_module" style="display: none"></div>';
        html += '<div id="delete_module_' + i + '" class="dt_module" style="display: none"></div>';
        html += '<div id="image_module_' + i + '" class="dt_module" style="display: none"></div>';
        html += '<div id="status_bar_' + i + '" class="cjt_status_bar"></div>';
        html += '</td></tr>';

        // alternate row stripes
        if (row_toggle === 'rowA') row_toggle = 'rowB';
        else row_toggle = 'rowA';
    }
    html += '</table>';

    // pagination
    html += '<div id="pagination">';
    if (PAGE_DATA.total_pages > 1) {
        // page numbers
        var ellipsis1 = 0;
        var ellipsis2 = 0;
        html += '<div id="pagination_pages">';
        for (var i = 1; i <= PAGE_DATA.total_pages; i++) {
            // bold the current page
            if (i == PAGE_DATA.current_page) {
                html += ' <span id="email_table_page_' + i + '" class="email_table_current_page">' + i + '</span> ';
            }
            // always show page 1 and the last page
            else if (i == 1 || i == PAGE_DATA.total_pages) {
                html += ' <span class="email_table_page" onclick="change_page(' + i + ')">' + i + '</span> ';
            }
            // show ellipsis for any pages less than 3 away
            else if (i < PAGE_DATA.current_page - 2) {
                if (ellipsis1 == 0) {
                    html += '...';
                    ellipsis1 = 1;
                }
            }
            // show ellipsis for any pages more than 3 away
            else if (i > PAGE_DATA.current_page + 2) {
                if (ellipsis2 == 0) {
                    html += '...';
                    ellipsis2 = 1;
                }
            } else {
                html += ' <span onclick="change_page(' + i + ')" class="email_table_page">' + i + '</span> ';
            }
        }
        html += '</div>';

        // prev / next buttons
        html += '<div id="pagination_links">';
        if (PAGE_DATA.current_page != 1) {
            html += '<span onclick="change_page(' + (PAGE_DATA.current_page - 1) + ')" class="email_table_prev_page">&larr; ' + LANG.prev + '</span> ';
        }
        if (PAGE_DATA.current_page != PAGE_DATA.total_pages) {
            html += ' <span onclick="change_page(' + (PAGE_DATA.current_page + 1) + ')" class="email_table_next_page">' + LANG.next + ' &rarr;</span>';
        }
        html += '</div>';
    }
    html += '</div>'; // close pagination_pages div

    return html;
};

// add event handlers for the new email table
var build_progress_bars = function() {
    for (var i = 0; i < ACCOUNTS.length; i++) {
        build_progress_bar("usage_bar_" + i, ACCOUNTS[i]['used'], ACCOUNTS[i]['quota']);
    }
};

var build_progress_bar = function(id, usage, quota) {
    var percent = 100 * (usage / quota);
    if (quota == 0) {
        percent = 0;
    }

    var displayPercentage = percent;
    if (percent > 100) {
        displayPercentage = 100;
    }

    var progressClass = '';
    if (displayPercentage >= 80) {
        progressClass = 'progress-bar-danger';
    } else if (displayPercentage >= 60) {
        progressClass = 'progress-bar-warning';
    } else if (displayPercentage >= 40) {
        progressClass = 'progress-bar-info';
    } else {
        progressClass = 'progress-bar-success';
    }

    var progressBar = YAHOO.util.Selector.query(".progress .progress-bar", id, true);
    progressBar.style.width = displayPercentage + "%";
    YAHOO.util.Dom.removeClass(progressBar, "progress-bar-danger");
    YAHOO.util.Dom.removeClass(progressBar, "progress-bar-warning");
    YAHOO.util.Dom.removeClass(progressBar, "progress-bar-info");
    YAHOO.util.Dom.removeClass(progressBar, "progress-bar-success");
    YAHOO.util.Dom.addClass(progressBar, progressClass);
    YAHOO.util.Selector.query(".progress .sr-only", id, true).textContent = percent + "%";
};

var change_page = function(page) {
    API.api2_paginate_start = ((page - 1) * PAGE_DATA.results_per_page) + 1;
    update_email_accounts();
};

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
	// remove croper element
	$("#fileInput").remove();
	$("#myCanvas").remove();
	$("#modal").remove();
	$("#preview").remove();
	// Go on!
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

// build the HTML markup for the input divs
var before_show_module = function(o) {

    var el = YAHOO.util.Dom.get(o.id);

    if (YAHOO.lang.trim(el.innerHTML) == '') {

        var html = '';

        if (o.action == 'change_password') {
            html += change_password_template({
                index: o.index
            });
        }

        if (o.action == 'show_details') {
            html += show_details_template({
                index: o.index,
			real_name: ACCOUNTS[o.index]['username'],
			organisation_unit: ACCOUNTS[o.index]['data']['ou'],
			mobile_phone: ACCOUNTS[o.index]['data']['MobilePhone'],
			work_phone: ACCOUNTS[o.index]['data']['WorkPhone'],
			quota: ACCOUNTS[o.index]['quota'],
			sent_messages: ACCOUNTS[o.index]['stats']['MessagesSent'],
			received_messages: ACCOUNTS[o.index]['stats']['MessagesSent']
            });
        }

        if (o.action == 'airsync') {
            html += airsync_template({
                index: o.index
            });
        }

        if (o.action == 'change_quota') {
	    var wd = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(function (item) {return (ACCOUNTS[o.index]['prefs']['WorkDays'].indexOf(item) > -1)?"checked":""});
	    var strong_password = "";
	    if (ACCOUNTS[o.index]['data']['PasswordComplexity'] == "MixedCaseDigit"){
		var strong_password = "checked"
	    }

		html += change_quota_template({
		    index: o.index,
			isUnlimited: ACCOUNTS[o.index]["quota"] == "unlimited",
			quotaDefaultValue: USERDEFINED_QUOTA_DEFAULT_VALUE,
			real_name: ACCOUNTS[o.index]['prefs']['RealName'],
			organisation_unit: ACCOUNTS[o.index]['data']['ou'],
			mobile_phone: ACCOUNTS[o.index]['data']['MobilePhone'],
			work_phone: ACCOUNTS[o.index]['data']['WorkPhone'],
			quota: ACCOUNTS[o.index]['quota'],
			    strong_password: strong_password,
		    work_days_1: wd[0], 
		    work_days_2: wd[1], 
		    work_days_3: wd[2], 
		    work_days_4: wd[3], 
		    work_days_5: wd[4], 
		    work_days_6: wd[5], 
		    work_days_7: wd[6] 
          });
        }

        if (o.action == 'change_type') {
	    var all_classes = Object.keys(CLASSES).map(function(k) { return ACCOUNTS[o.index]['data']['ServiceClasses'][k] });
	    
	    var all_classes_keys = [];
	    for(var k in CLASSES) all_classes_keys.push(k);

	    var template_data = {
		index: o.index
	    };

	    for (var i = 0; i < all_classes_keys.length; i++) {
		var class_template_data = {
		    index: o.index,
		    keys: all_classes_keys
		};
		class_template_data['type'] = all_classes_keys[i];
		class_template_data['access_modes'] = all_classes[i]['AccessModes'];
		class_template_data['access_modes_mail'] = "";
		class_template_data['access_modes_xmpp'] = "";
		class_template_data['access_modes_sip'] = "";
		class_template_data['access_modes_webcal'] = "";
		if (ACCOUNTS[o.index]['class'] == all_classes_keys[i]){
		    class_template_data['checked'] = "checked";
		}

		for (var j = 0; j < class_template_data['access_modes'].length; j++){
		    if (class_template_data['access_modes'][j] == "Mail" || class_template_data['access_modes'] == "All"){
			class_template_data['access_modes_mail'] = true;
		    }
		    if (class_template_data['access_modes'][j] == "XMPP" || class_template_data['access_modes'] == "All"){
		    	class_template_data['access_modes_xmpp'] = true;
		    }
		    if (class_template_data['access_modes'][j] == "SIP" || class_template_data['access_modes'] == "All"){
		    	class_template_data['access_modes_sip'] = true;
		    }
		    if (class_template_data['access_modes'][j] == "WebCAL" || class_template_data['access_modes'] == "All"){
		    	class_template_data['access_modes_webcal'] = true;
		    }
		}
		html += change_type_template(class_template_data);
	    }
	    html += change_type_template_submit(template_data);
        }

       if (o.action == 'delete') {
            html += delete_template({
                index: o.index,
                email: ACCOUNTS[o.index]['prefs']['AccountName']
            });
        }
       if (o.action == 'image_crop') {
	   if (ACCOUNTS[o.index]['vcard']
	       && ACCOUNTS[o.index]['vcard']['fileData']
	       && ACCOUNTS[o.index]['vcard']['fileData'][0]
	       && ACCOUNTS[o.index]['vcard']['fileData'][0]['vCard']
	       && ACCOUNTS[o.index]['vcard']['fileData'][0]['vCard'][0]
	       && ACCOUNTS[o.index]['vcard']['fileData'][0]['vCard'][0]['PHOTO']
	       && ACCOUNTS[o.index]['vcard']['fileData'][0]['vCard'][0]['PHOTO'][0]
	       && ACCOUNTS[o.index]['vcard']['fileData'][0]['vCard'][0]['PHOTO'][0]['BINVAL']
	       && ACCOUNTS[o.index]['vcard']['fileData'][0]['vCard'][0]['PHOTO'][0]['BINVAL'][0]) {
	       var acc_photo = ACCOUNTS[o.index]['vcard']['fileData'][0]['vCard'][0]['PHOTO'][0]['BINVAL'][0];		
	   } 

            html += image_template({
                index: o.index,
	 "acc_photo" : acc_photo
            });
        }
        el.innerHTML = html;
    }
};

// add event handlers and validation to an input div
var after_show_module = function(o) {
    if (o.action == 'change_password') {
        var password1 = "change_password_input_1_" + o.index;
        var password2 = "change_password_input_2_" + o.index;

        // add event handlers
        YAHOO.util.Event.on("email_table_change_password_confirm_" + o.index, "click", change_password, {
            "index": o.index
        });
        YAHOO.util.Event.on("create_strong_password_" + o.index, "click", create_strong_password, {
            "index": o.index
        });
        YAHOO.util.Event.on("email_table_change_password_cancel_" + o.index, "click", toggle_action_div, o);
        CPANEL.util.catch_enter([password1, password2], "email_table_change_password_confirm_" + o.index);

        // add validation
        CHANGE_PASSWORD1_VALIDATION = new CPANEL.validate.validator(LANG.change_password);
        CHANGE_PASSWORD1_VALIDATION.add(password1, verify_password_strength, LOCALE.maketext('Password strength must be at least [numf,_1].', REQUIRED_PASSWORD_STRENGTH));
        CHANGE_PASSWORD1_VALIDATION.add(password1, 'no_chars(%input%, " ")', CPANEL.lang.password_validator_no_spaces);
        CHANGE_PASSWORD1_VALIDATION.add(password1, verify_password_uppercase, "Password should contain a <strong>uppercase</strong> letter, <strong>lowercase</strong> letter and a <strong>digit</strong>." );
        CHANGE_PASSWORD1_VALIDATION.attach();

        CHANGE_PASSWORD2_VALIDATION = new CPANEL.validate.validator(CPANEL.lang.passwords_match);
        CHANGE_PASSWORD2_VALIDATION.add(password2, "equals('" + password1 + "', '" + password2 + "')", CPANEL.lang.password_validator_no_match);
        CHANGE_PASSWORD2_VALIDATION.attach();

        // initialize the password bar
        CHANGE_PASSWORD_BAR = new CPANEL.password.strength_bar("password_strength_bar_" + o.index);
        CHANGE_PASSWORD_BAR.attach(password1, function() {
            CHANGE_PASSWORD1_VALIDATION.verify();
        });

        // put focus on the password field
        YAHOO.util.Dom.get(password1).focus();
    }

    if (o.action == 'change_quota') {

        var quota_number_el = YAHOO.util.Dom.get("quota_number_" + o.index);
        var quota_number_input_el = YAHOO.util.Dom.get("quota_number_input_" + o.index);
        var quota_unlimited_el = YAHOO.util.Dom.get("quota_unlimited_" + o.index);

        // add validation
        CHANGE_QUOTA_VALID.quota_number = new CPANEL.validate.validator(LANG.change_quota);
        CHANGE_QUOTA_VALID.quota_number.add(quota_number_input_el, "positive_integer", LANG.email_quota_number, "quota_number_" + o.index);
        CHANGE_QUOTA_VALID.quota_number.add(quota_number_input_el, function() {
            return quota_over_2gigs(quota_number_input_el)
        }, LANG.email_quota_2gig, "quota_number_" + o.index);
        CHANGE_QUOTA_VALID.quota_number.attach();

        CHANGE_QUOTA_VALID.quota_unlimited = new CPANEL.validate.validator(LANG.change_quota);
        CHANGE_QUOTA_VALID.quota_unlimited.add("quota_unlimited_" + o.index, "anything", "", "quota_unlimited_" + o.index);
        CHANGE_QUOTA_VALID.quota_unlimited.attach();

        CHANGE_QUOTA_VALID.content_changed = new CPANEL.validate.validator(LANG.change_quota);

        // CHANGE_QUOTA_VALID.content_changed.add("current_quota_" + o.index, function() {
        //     return change_quota_content(o.index);
        // }, LANG.must_change_before_edit);

        CHANGE_QUOTA_VALID.content_changed.attach();

        // add event handlers
        YAHOO.util.Event.on("email_table_change_quota_cancel_" + o.index, "click", toggle_action_div, o);

        YAHOO.util.Event.on(quota_unlimited_el, "click", function() {
            click_quota_unlimited(quota_number_input_el, CHANGE_QUOTA_VALID.quota_number, CHANGE_QUOTA_VALID.quota_unlimited)
        });
        YAHOO.util.Event.on([quota_number_el, quota_number_input_el], "click", function() {
            click_quota_number(quota_number_el, quota_number_input_el, CHANGE_QUOTA_VALID.quota_number, CHANGE_QUOTA_VALID.quota_unlimited)
        });
        CPANEL.util.catch_enter("quota_number_input_" + o.index, "change_quota_confirm_" + o.index);

        CPANEL.validate.attach_to_form("change_quota_confirm_" + o.index, CHANGE_QUOTA_VALID, function() {
            change_quota(o.index);
        });
    }

    if (o.action == 'delete') {
        YAHOO.util.Event.on("email_table_delete_confirm_" + o.index, "click", delete_confirm, {
            "index": o.index
        });
        YAHOO.util.Event.on("email_table_delete_cancel_" + o.index, "click", toggle_action_div, o);
    }

    if (o.action == 'airsync') {
        airsync_load(o);
        YAHOO.util.Event.on("loadairsync_" + o.index, "click", airsync_save, {
            "o": o
        });
    }

    if (o.action == 'change_type') {
        YAHOO.util.Event.on("change_type_confirm_" + o.index, "click", change_type, {
            "index": o.index
        });
        YAHOO.util.Event.on("change_type_cancel_" + o.index, "click", toggle_action_div, o);
    }
    if (o.action == "image_crop") {
	$("#crop_" + o.index).simpleCropper();
        YAHOO.util.Event.on("change_avatar_confirm_" + o.index, "click", change_avatar, {
            "index": o.index
        });
        YAHOO.util.Event.on("change_avatar_cancel_" + o.index, "click", toggle_action_div, o);
    }

};

// hide validation messages and any password bars before we roll up the input div
var before_hide_module = function(o) {
    if (o.action == 'change_password' && CHANGE_PASSWORD1_VALIDATION.clear_messages && CHANGE_PASSWORD2_VALIDATION.clear_messages && CHANGE_PASSWORD_BAR.destroy) {
        CHANGE_PASSWORD1_VALIDATION.clear_messages();
        CHANGE_PASSWORD2_VALIDATION.clear_messages();
        CHANGE_PASSWORD_BAR.destroy();
    }
    if (o.action == 'change_quota') {
        for (var i in CHANGE_QUOTA_VALID) {
            if (CHANGE_QUOTA_VALID.hasOwnProperty(i)) {
                CHANGE_QUOTA_VALID[i].clear_messages();
            }
        }
    }
};

var after_hide_module = function(o) {
    // change password input div
    if (o.action === 'change_password') {
        // clear password fields
        YAHOO.util.Dom.get("change_password_input_1_" + o.index).value = '';
        YAHOO.util.Dom.get("change_password_input_2_" + o.index).value = '';
    }
    if (o.action == 'airsync') {
	var selector_airsync_wrap = "#airsync_wrap_" + o.index;
	$(selector_airsync_wrap).css("display", "none");
    }

    // purge all event handlers in the div
    YAHOO.util.Event.purgeElement(o.id, true);
};

var verify_password_strength = function(o) {
    if (CHANGE_PASSWORD_BAR.current_strength < REQUIRED_PASSWORD_STRENGTH) return false;
    else return true;
};
var verify_password_uppercase = function(o) {
    var index = $(o).attr("id");
    index = index.substr(-1);
    if (ACCOUNTS[index]['data']['PasswordComplexity'] == "MixedCaseDigit") {
	var pass1 = $(o).val();    
	var pattern_lowercase = /[a-z]/;
	var pattern_uppercase = /[A-Z]/;
	var pattern_digit = /[0-9]/;
	var result_lowercase = pattern_lowercase.test(pass1);
	var result_uppercase = pattern_uppercase.test(pass1);
	var result_digit = pattern_digit.test(pass1);
	return result_lowercase && result_uppercase && result_digit;
    }
    else {
    	return true;
    }
};

// event handler for the "create strong password" phrase
var create_strong_password = function(e, o) {
    CPANEL.password.generate_password(function(password) {
        YAHOO.util.Dom.get("change_password_input_1_" + o.index).value = password;
        YAHOO.util.Dom.get("change_password_input_2_" + o.index).value = password;
        CHANGE_PASSWORD_BAR.check_strength("change_password_input_1_" + o.index, function() {
            CHANGE_PASSWORD1_VALIDATION.verify()
        });
        CHANGE_PASSWORD2_VALIDATION.verify();
    });
};

// delete an email account
var delete_confirm = function(e, o) {
    var index = o.index;

    // create the API variables
    var api2_call = {
        cpanel_jsonapi_version: 2,
        cpanel_jsonapi_module: "Email",
        cpanel_jsonapi_func: "delpop",
        email: ACCOUNTS[o.index]['username'],
        domain: ACCOUNTS[o.index]['domain']
    };

    var reset_module = function() {
        YAHOO.util.Dom.get("delete_email_status_" + index).innerHTML = '';
        YAHOO.util.Dom.setStyle("delete_confirm_input_" + index, "display", "block");
        toggle_action_div(null, {
            "id": "delete_module_" + index,
            "index": index,
            "action": "delete"
        });
    };

    var check_no_more_rows = function() {
        var rows = YAHOO.util.Dom.getElementsByClassName("dt_info_row", "tr", "table_email_accts");
        var reload_table = true;
        for (var i = 0; i < rows.length; i++) {
            if (YAHOO.util.Dom.getStyle(rows[i], "display") != "none") {
                reload_table = false;
            }
        }
        if (reload_table == true) {
            show_no_accounts();
        }
    };

    // callback functions
    var callback = {
        success: function(o) {
            try {
                var data = YAHOO.lang.JSON.parse(o.responseText);

                // update the table and display the status
                if (data['cpanelresult']['data'][0]['result'] == '1') {
                    CPANEL.animate.fade_out('account_row_' + index, function() {
                        YAHOO.util.Dom.setStyle("module_row_" + index, "display", "none");
                        check_no_more_rows();
                    });
                    CPANEL.animate.fade_out('delete_module_' + index);
                } else if (data['cpanelresult']['data'][0]['result'] == 0) {
                    reset_module();
                    CPANEL.widgets.status_bar("status_bar_" + index, "error", CPANEL.lang.Error, data['cpanelresult']['data'][0]['reason']);
                } else {
                    reset_module();
                    CPANEL.widgets.status_bar("status_bar_" + index, "error", CPANEL.lang.Error, "Unknown error.");
                }
            } catch (e) {
                reset_module();
                CPANEL.widgets.status_bar("status_bar_" + index, "error", CPANEL.lang.json_error, CPANEL.lang.json_parse_failed);
            }
        },

        failure: function(o) {
            reset_module();
            CPANEL.widgets.status_bar("status_bar_" + index, "error", CPANEL.lang.ajax_error, CPANEL.lang.ajax_try_again);
        }
    };

    // send the AJAX request
    YAHOO.util.Connect.asyncRequest('GET', CPANEL.urls.json_api(api2_call), callback, '');

    // show the ajax loading icon
    YAHOO.util.Dom.setStyle("delete_confirm_input_" + index, "display", "none");
    YAHOO.util.Dom.get("delete_email_status_" + index).innerHTML = CPANEL.icons.ajax + " " + LANG.deleting + "...";
};

var json_parse_error = function() {
    var html = CPANEL.icons.error + ' ' + CPANEL.lang.json_parse_failed + '  ' + CPANEL.lang.ajax_try_again;

    var div_region = YAHOO.util.Region.getRegion(YAHOO.util.Dom.get("accounts_table"));
    if (div_region.height > 0) {
        YAHOO.util.Dom.get("accounts_table").innerHTML = '<div style="height: ' + div_region.height + 'px"><div style="padding: 20px">' + html + '</div></div>';
    } else {
        YAHOO.util.Dom.get("accounts_table").innerHTML = '<div style="padding: 20px">' + html + '</div>';
    }
};

var change_quota_content = function(index) {
    var current_quota = YAHOO.util.Dom.get("current_quota_" + index).value;
    if (YAHOO.util.Dom.get("quota_number_" + index).checked == true) {
        return current_quota != YAHOO.util.Dom.get("quota_number_input_" + index).value;
    } else {
        if (current_quota == "0") return false;
        if (current_quota == CPANEL.lang.unlimited) return false;
        return true;
    }
};

var change_quota = function(index) {
    var quota = 0;  
    if (YAHOO.util.Dom.get("quota_number_" + index).checked) {
        quota = YAHOO.util.Dom.get("quota_number_input_" + index).value;
    }
    var realname = YAHOO.util.Dom.get("realname_input_" + index).value;
    var unit = YAHOO.util.Dom.get("ou_input_" + index).value;
    var mobile = YAHOO.util.Dom.get("mobile_phone_input_" + index).value;
    var workphone = YAHOO.util.Dom.get("work_phone_input_" + index).value;

    // create the API variables
    var api2_call = {
        "cpanel_jsonapi_version": 2,
        "cpanel_jsonapi_module": "Email",
        "cpanel_jsonapi_func": "editquota",
        "email": ACCOUNTS[index]['username'],
        "domain": ACCOUNTS[index]['domain'],
	"realaname": realname,
        "quota": quota,
	"unit": unit,
	"mobile": mobile,
	"workphone": workphone
    };

    if (YAHOO.util.Dom.get("WorkDays-Sun_" + index).checked){
    var WorkDays_Sun = YAHOO.util.Dom.get("WorkDays-Sun_" + index).value;
    api2_call['WorkDays'] = WorkDays_Sun;
    }
    if (YAHOO.util.Dom.get("WorkDays-Mon_" + index).checked){
    var WorkDays_Mon = YAHOO.util.Dom.get("WorkDays-Mon_" + index).value;
    api2_call['WorkDays-0'] = WorkDays_Mon;
    } 
    if (YAHOO.util.Dom.get("WorkDays-Tue_" + index).checked){
    var WorkDays_Tue = YAHOO.util.Dom.get("WorkDays-Tue_" + index).value;
    api2_call['WorkDays-1'] = WorkDays_Tue;
    }
    if (YAHOO.util.Dom.get("WorkDays-Wed_" + index).checked){
    var WorkDays_Wed = YAHOO.util.Dom.get("WorkDays-Wed_" + index).value;
    api2_call['WorkDays-2'] = WorkDays_Wed;
    }
    if (YAHOO.util.Dom.get("WorkDays-Thu_" + index).checked){
    var WorkDays_Thu = YAHOO.util.Dom.get("WorkDays-Thu_" + index).value;
    api2_call['WorkDays-3'] = WorkDays_Thu;
    }
    if (YAHOO.util.Dom.get("WorkDays-Fri_" + index).checked){
    var WorkDays_Fri = YAHOO.util.Dom.get("WorkDays-Fri_" + index).value;
    api2_call['WorkDays-4'] = WorkDays_Fri;
    }
    if (YAHOO.util.Dom.get("WorkDays-Sat_" + index).checked){
    var WorkDays_Sat = YAHOO.util.Dom.get("WorkDays-Sat_" + index).value;
    api2_call['WorkDays-5'] = WorkDays_Sat;
    }
    var PasswordComplexity = YAHOO.util.Dom.get("complex_pass_input_" + index).value;
    if (YAHOO.util.Dom.get("complex_pass_input_" + index).checked){
    api2_call['PasswordComplexity'] = PasswordComplexity;
    }    


    // callback functions
    var callback = {
        success: function(o) {
	    YAHOO.util.Dom.get("change_quota_status_" + index).innerHTML = '';
            YAHOO.util.Dom.setStyle("change_quota_input_" + index, "display", "block");
            toggle_action_div(null, {
                id: "change_quota_module_" + index,
                index: index,
                action: "change_quota"
            });

            try {
                var data = YAHOO.lang.JSON.parse(o.responseText);
            } catch (e) {
                CPANEL.widgets.status_bar("status_bar_" + index, "error", CPANEL.lang.json_error, CPANEL.lang.json_parse_failed);
                return;
            }

            // update the table and display the status
            if (data.cpanelresult.data && (data.cpanelresult.data[0].result == 1)) {
                var status = "";
                CPANEL.widgets.status_bar("status_bar_" + index, "success", "Details Changed", status);
		build_progress_bar("usage_bar_" + index, YAHOO.util.Dom.get("diskused_" + index).value, api2_call.quota);
		
		if (api2_call['PasswordComplexity']) {
		    ACCOUNTS[index]['data']['PasswordComplexity'] = "MixedCaseDigit";
		}		
		else {
		    ACCOUNTS[index]['data']['PasswordComplexity'] = "";
		}
		var selector_acc_realname = "#realname_" + index;
		var selector_acc_quota = "#quota_" + index;
		$(selector_acc_realname).text(api2_call.realaname);
		if (api2_call.quota == 0){
		    var diskquota_acc_show = " ∞ ";
		}
		else{
		    var diskquota_acc_show = api2_call.quota;
		}
		
		$(selector_acc_quota).text(diskquota_acc_show);

            } else if (data.cpanelresult.data && (data.cpanelresult.data[0].result == 0)) {
                CPANEL.widgets.status_bar("status_bar_" + index, "error", CPANEL.lang.Error, data.cpanelresult.data[0].reason);
            } else {
                CPANEL.widgets.status_bar("status_bar_" + index, "error", CPANEL.lang.Error, data.cpanelresult.error || LANG.unknown_error);
            }
        },

        failure: function(o) {
            YAHOO.util.Dom.get("change_quota_status_" + index).innerHTML = '';
            YAHOO.util.Dom.setStyle("change_quota_input_" + index, "display", "block");
            toggle_action_div(null, {
                "id": "change_quota_module_" + index,
                "index": index,
                "action": "change_quota"
            });

            CPANEL.widgets.status_bar("status_bar_" + index, "error", CPANEL.lang.ajax_error, CPANEL.lang.ajax_try_again);
        }
    };

    // send the AJAX request
    YAHOO.util.Connect.asyncRequest('GET', CPANEL.urls.json_api(api2_call), callback, '');

    // show the ajax loading icon
    YAHOO.util.Dom.get("change_quota_status_" + index).innerHTML = CPANEL.icons.ajax + " " + "Changing Details" + "...";
};

var airsync_save = function(e, o){
    var o_obj = o;
    var index = o.index;
    var selector_airsync_allowed = "#airsync_allowed_" + o.o.index;		
    var airsync_allowed_val = $(selector_airsync_allowed).val();
    console.log(airsync_allowed_val);
    var api2_call = {
        "cpanel_jsonapi_version": 2,
        "cpanel_jsonapi_module": "CommuniGate",
        "cpanel_jsonapi_func": "ListAirSyncs",
        "account": ACCOUNTS[o.o.index]['prefs']['AccountName'],
        "AirSyncAllowed": airsync_allowed_val,
        "save": "save"
    };
    var selector_allowed_save_status = "#allowed_save_status_" + o_obj.o.index;
    var selector_allowed_save_loading = "#allowed_save_loading_" + o_obj.o.index;
    YAHOO.util.Dom.get("allowed_save_loading_" + o_obj.o.index).innerHTML = CPANEL.icons.ajax + " " + "Saving" + "...";    
    // callback functions
    var callback = {
        success: function(o) {
            try {
                var data = YAHOO.lang.JSON.parse(o.responseText);
            } catch (e) {
                CPANEL.widgets.status_bar("status_bar_" + o.index, "error", CPANEL.lang.json_error, CPANEL.lang.json_parse_failed);
                return;
            }
            // update the table and display the status
            if (data.cpanelresult.event && (data.cpanelresult.event['result'] == 1)) {
		var airsync_allowed_str = data.cpanelresult.data[0].AirSyncAllowed.join(", ");
		$(selector_airsync_allowed).val(airsync_allowed_str);  	
		$(selector_allowed_save_status).css("padding", "20px");
                CPANEL.widgets.status_bar("allowed_save_status_" + o_obj.o.index, "success", "Saved! ", "");
		YAHOO.util.Dom.get("allowed_save_loading_" + o_obj.o.index).innerHTML = "";    
	    } else if (data.cpanelresult.event && (data.cpanelresult.event['result'] == 0)) {
		CPANEL.widgets.status_bar("allowed_save_status_" + o_obj.o.index, "error", CPANEL.lang.Error, data.cpanelresult.data[0].reason);
	    } else {
		CPANEL.widgets.status_bar("allowed_save_status_" + o_obj.o.index, "error", CPANEL.lang.Error, data.cpanelresult.error || LANG.unknown_error);
            }
	},
	failure: function(o) {
	}
    };
    YAHOO.util.Connect.asyncRequest('GET', CPANEL.urls.json_api(api2_call), callback, '');
};

var airsync_load = function(o){
    var o_obj = o;
    var index = o.index;
    var selector_airsync_allowed = "#airsync_allowed_" + index;		
    var api2_call = {
        "cpanel_jsonapi_version": 2,
        "cpanel_jsonapi_module": "CommuniGate",
        "cpanel_jsonapi_func": "ListAirSyncs",
        "account": ACCOUNTS[o.index]['prefs']['AccountName']
    };
    var acc_username = ACCOUNTS[o.index]['username'];
    var acc_domain = ACCOUNTS[o.index]['domain'];
    
    var selector_airsync_status = "#airsync_status_" + index;
    YAHOO.util.Dom.get("airsync_status_" + index).innerHTML = CPANEL.icons.ajax + " " + "Loading" + "...";    
    
    // callback functions
    var callback = {
        success: function(o) {
            try {
                var data = YAHOO.lang.JSON.parse(o.responseText);
            } catch (e) {
                CPANEL.widgets.status_bar("status_bar_" + o.index, "error", CPANEL.lang.json_error, CPANEL.lang.json_parse_failed);
                return;
            }
            // update the table and display the status
            if (data.cpanelresult.event && (data.cpanelresult.event['result'] == 1)) {

		$(selector_airsync_status).text("");
		var selector_airsync_wrap = "#airsync_wrap_" + index;
		$(selector_airsync_wrap).css("display", "block");

		var airsync_allowed_str = data.cpanelresult.data[0].AirSyncAllowed.join(", ");
		$(selector_airsync_allowed).val(airsync_allowed_str);
		var selector_table = "#mailtbl_" + index;
		var selector_table_tbody = "#mailtbl_" + index + " tbody";
		$(selector_table_tbody).remove();
		var all_devices = data.cpanelresult.data[0].airSyncs;
		var selector_username_ssl = "#airsync_username_" + index;
		var selector_domain_ssl = "#airsync_domain_" + index;
		var selector_server_ssl = "#airsync_server_" + index;
		var selector_username_non_ssl = "#airsync_username_non_ssl_" + index;
		var selector_domain_non_ssl = "#airsync_domain_non_ssl_" + index;
		var selector_server_non_ssl = "#airsync_server_non_ssl_" + index;
		$(selector_username_ssl).text(acc_username);
		$(selector_domain_ssl).text(acc_domain);
		$(selector_server_ssl).text(acc_domain);
		$(selector_username_non_ssl).text(acc_username);
		$(selector_domain_non_ssl).text(acc_domain);
		$(selector_server_non_ssl).text(acc_domain);
		
		if (data.cpanelresult.data[0].airSyncs == "") {
		    var tbody =  $('<tbody></tbody>');
		    $(selector_table).append(tbody);
		    var new_tr = $('<tr></tr>');
		    $(selector_table_tbody).append(new_tr);
		    $(new_tr).append('<td colspan="5">No AirSync Devices listed!</td>');
		}
		var tbody =  $('<tbody></tbody>');
		$(selector_table).append(tbody);
		$.each(all_devices, function (key, value){
			var new_tr = $('<tr></tr>');
			$(tbody).append(new_tr);
			
			$(new_tr).append("<td>" + key + '</td>');
			if (value['User-Agent']){
			    $(new_tr).append('<td>' + value['User-Agent'] + '</td>');
			} else {
			    $(new_tr).append('<td></td>');
			}
			if (value['Date']) {
			    value['Date'] = value['Date'].replace("#T","");
			    value['Date'] = value['Date'].replace("_","/");
			    $(new_tr).append('<td>' + value['Date'] + '</td>');
			} else {
			    $(new_tr).append('<td></td>');
			}
			if (value['doWipe'] == "YES"){
			    $(new_tr).append('<td><span id="pending_' + key + '">Pending</span></td>');
			} else {
			    $(new_tr).append('<td><span style="display: none;" id="pending_' + key + '">Pending</span></td>');
			}
			if (value['wiped']){
			    $(new_tr).append('<span>' + value['wiped'] + '</span>');
			}
			if (value['doWipe'] == "YES"){
			    $(new_tr).append('<td><span id="wipe_loading_' + key + '"></span><a id="wipeout_cancel_' + key + '">Cancel Wipe Out</a><a style="display: none;" id="wipeout_wipe_' + key + '">Wipe Out</a></td>');
			}
			else {
			    $(new_tr).append('<td><span id="wipe_loading_' + key + '"></span><a style="display: none;" id="wipeout_cancel_' + key + '">Cancel Wipe Out</a><a id="wipeout_wipe_' + key + '">Wipe Out</a></td>');
			}
			YAHOO.util.Event.on("wipeout_wipe_" + key, "click", airsync_change, { "device": key, "o": o_obj, "type": "wipe" });
			YAHOO.util.Event.on("wipeout_cancel_" + key, "click", airsync_change, { "device": key, "o": o_obj, "type": "cancel" });
		    });
		YAHOO.util.Event.on("airsync_cancel_" + index, "click", toggle_action_div, o);

	    } else if (data.cpanelresult.event && (data.cpanelresult.event['result'] == 0)) {
		CPANEL.widgets.status_bar("allowed_save_status_" + o_obj.o.index, "error", CPANEL.lang.Error, data.cpanelresult.data[0].reason);
	    } else {
		CPANEL.widgets.status_bar("allowed_save_status_" + o_obj.o.index, "error", CPANEL.lang.Error, data.cpanelresult.error || LANG.unknown_error);
            }
        },
        failure: function(o) {
        }
    };
    YAHOO.util.Connect.asyncRequest('GET', CPANEL.urls.json_api(api2_call), callback, '');

};

var airsync_change = function (e, data_wipe){
    var api2_call = {
        "cpanel_jsonapi_version": 2,
        "cpanel_jsonapi_module": "CommuniGate",
        "cpanel_jsonapi_func": "UpdateAirSync",
	"account": ACCOUNTS[data_wipe.o.index]['prefs']['AccountName'],
	"device": data_wipe.device,
	"type": data_wipe.type
    };
    var selector_wipe_loading = "#wipe_loading_" + api2_call.device;
    YAHOO.util.Dom.get("wipe_loading_" + api2_call.device).innerHTML = CPANEL.icons.ajax + " ";    

    var callback = {
        success: function(o) {
            try {
                var data = YAHOO.lang.JSON.parse(o.responseText);
            } catch (e) {
                CPANEL.widgets.status_bar("status_bar_" + o.index, "error", CPANEL.lang.json_error, CPANEL.lang.json_parse_failed);
                return;
            }
            // update the table and display the status
            if (data.cpanelresult.event && (data.cpanelresult.event['result'] == 1)) {
		$(selector_wipe_loading).text("");
		var selector_wipe_wipe = "#wipeout_wipe_" + api2_call.device;
		var selector_wipe_cancel = "#wipeout_cancel_" + api2_call.device;
		var selector_pending = "#pending_" + api2_call.device;
		if (api2_call.type == "wipe") {
		    $(selector_wipe_wipe).css("display", "none");
		    $(selector_wipe_cancel).css("display", "inline");
		    $(selector_pending).css("display", "inline");
		    console.log("wipe");
		}
		if (api2_call.type == "cancel") {
		    $(selector_wipe_wipe).css("display", "inline");
		    $(selector_wipe_cancel).css("display", "none");		    
		    $(selector_pending).css("display", "none");
		    console.log("cancel");
		}	
	    } else if (data.cpanelresult.event && (data.cpanelresult.event['result'] == 0)) {
		CPANEL.widgets.status_bar("status_bar_" + index, "error", CPANEL.lang.Error, data.cpanelresult.data[0].reason);
	    } else {
		CPANEL.widgets.status_bar("status_bar_" + index, "error", CPANEL.lang.Error, data.cpanelresult.error || LANG.unknown_error);
            }
	},
	
	failure: function(o) {
	    YAHOO.util.Dom.get("airsync_status_" + index).innerHTML = '';
            toggle_action_div(null, {
		    "id": "airsync_module_" + index,
			"index": index,
			"action": "airsync"
			});	    
	    CPANEL.widgets.status_bar("status_bar_" + index, "error", CPANEL.lang.ajax_error, CPANEL.lang.ajax_try_again);
	}
    }  
    YAHOO.util.Connect.asyncRequest('GET', CPANEL.urls.json_api(api2_call), callback, '');
};

var change_type = function(e, o) {
    var index = o.index;
    // create the API variables
    var api2_call = {
	"cpanel_jsonapi_version": 2,
	"cpanel_jsonapi_module": "CommuniGate",
        "cpanel_jsonapi_func": "UpdateAccountClass",
        "account": ACCOUNTS[o.index]['prefs']['AccountName'],
    };
    
    var all_classes = Object.keys(ACCOUNTS[o.index]['data']['ServiceClasses']).map(function(k) { return ACCOUNTS[o.index]['data']['ServiceClasses'][k] });
    
    var all_classes_keys = [];
    for(var k in ACCOUNTS[o.index]['data']['ServiceClasses']) all_classes_keys.push(k);
    
    for (var i = 0; i < all_classes_keys.length; i++) {
	if (YAHOO.util.Dom.get("class_" + all_classes_keys[i]+ "_" + o.index).checked){
	    api2_call['class'] = YAHOO.util.Dom.get("class_" + all_classes_keys[i]+ "_" + o.index).value;
	}
    }

    // if (YAHOO.util.Dom.get("restrictAccess_" + o.index).checked){
    // var restrict_access = YAHOO.util.Dom.get("restrictAccess_" + o.index).value;
    // api2_call['restrictAccess'] = restrict_access;
    // } 

    // callback functions
    var callback = {
        success: function(o) {
	    var selector_li_ext = "#li_extensions_" + index;
	    if (api2_call['class'] != "NotJabberOnly") {
		$(selector_li_ext).hide();
	    }
	    else {
		$(selector_li_ext).show();
	    }
	    
            YAHOO.util.Dom.get("change_type_status_" + index).innerHTML = '';
            YAHOO.util.Dom.setStyle("change_type_input_" + index, "display", "block");
            toggle_action_div(null, {
                id: "change_type_module_" + index,
                index: index,
                action: "change_type"
            });

            try {
                var data = YAHOO.lang.JSON.parse(o.responseText);
            } catch (e) {
                CPANEL.widgets.status_bar("status_bar_" + index, "error", CPANEL.lang.json_error, CPANEL.lang.json_parse_failed);
                return;
            }

            // update the table and display the status
            if (data.cpanelresult.event && (data.cpanelresult.event['result'] == 1)) {
                var new_type = api2_call.class;
                var status = new_type;
                CPANEL.widgets.status_bar("status_bar_" + index, "success", "Changed type: ", status);
		var selector_acc_type = "#acc_type_" + index;
		var selector_icon_envelope = "#icon_envelope_" + index;
		var selector_icon_comment = "#icon_comment_" + index;
		var selector_icon_phone = "#icon_phone_" + index;
		var selector_icon_calendar = "#icon_calendar_" + index;
		$(selector_acc_type).text(api2_call.class);
       		var acc_class = api2_call.class;
		var acc_modes = CLASSES[acc_class]['AccessModes'];
		if (acc_modes.indexOf('Mail') > -1 || acc_modes == "All"){
		    $(selector_icon_envelope).css("color", "#000000");
		}
		else {
		    $(selector_icon_envelope).css("color", "#aaaaaa");		    
		}
		if (acc_modes.indexOf('XMPP') > -1 || acc_modes == "All"){
		    $(selector_icon_comment).css("color", "#000000");
		}
		else {
		    $(selector_icon_comment).css("color", "#aaaaaa");		    
		}
		if (acc_modes.indexOf('SIP') > -1 || acc_modes == "All"){
		    $(selector_icon_phone).css("color", "#000000");
		}
		else {
		    $(selector_icon_phone).css("color", "#aaaaaa");		    
		}
		if (acc_modes.indexOf('WebCAL') > -1 || acc_modes == "All"){
		    $(selector_icon_calendar).css("color", "#000000");
		}
		else {
		    $(selector_icon_calendar).css("color", "#aaaaaa");		    
		}

            } else if (data.cpanelresult.event && (data.cpanelresult.event['result'] == 0)) {
                CPANEL.widgets.status_bar("status_bar_" + index, "error", CPANEL.lang.Error, data.cpanelresult.data[0].reason);
            } else {
                CPANEL.widgets.status_bar("status_bar_" + index, "error", CPANEL.lang.Error, data.cpanelresult.error || LANG.unknown_error);
            }
        },

        failure: function(o) {
            YAHOO.util.Dom.get("change_type_status_" + index).innerHTML = '';
            YAHOO.util.Dom.setStyle("change_type_input_" + index, "display", "block");
            toggle_action_div(null, {
                "id": "change_type_module_" + index,
                "index": index,
                "action": "change_type"
            });

            CPANEL.widgets.status_bar("status_bar_" + index, "error", CPANEL.lang.ajax_error, CPANEL.lang.ajax_try_again);
        }
    };

        // send the AJAX request
        YAHOO.util.Connect.asyncRequest('GET', CPANEL.urls.json_api(api2_call), callback, '');

        // show the ajax loading icon
        YAHOO.util.Dom.setStyle("change_type_input_" + index, "display", "none");
        YAHOO.util.Dom.get("change_type_status_" + index).innerHTML = CPANEL.icons.ajax + " " + "Changing type" + "...";
};

var change_avatar = function(e, o) {
    var index = o.index;
    // create the API variables
    var selector_img = "#crop_" + index + " img";

    if ( $(selector_img)['0'] ) {
    var new_avatar = $(selector_img).attr('src');	
    }
    else {
	if ( ACCOUNTS[o.index]['vcard']
	    && ACCOUNTS[o.index]['vcard']['fileData']
	    && ACCOUNTS[o.index]['vcard']['fileData'][0]
	    && ACCOUNTS[o.index]['vcard']['fileData'][0]['vCard']
	    && ACCOUNTS[o.index]['vcard']['fileData'][0]['vCard'][0]
	    && ACCOUNTS[o.index]['vcard']['fileData'][0]['vCard'][0]['PHOTO']
	    && ACCOUNTS[o.index]['vcard']['fileData'][0]['vCard'][0]['PHOTO'][0]
	    && ACCOUNTS[o.index]['vcard']['fileData'][0]['vCard'][0]['PHOTO'][0]['BINVAL']
	    && ACCOUNTS[o.index]['vcard']['fileData'][0]['vCard'][0]['PHOTO'][0]['BINVAL'][0] ) {
	    var new_avatar = ACCOUNTS[o.index]['vcard']['fileData'][0]['vCard'][0]['PHOTO'][0]['BINVAL'][0];		
	} 
	else {
	    alert("Please add image!");
	    return;
	}
    } 

    new_avatar = encodeURIComponent(new_avatar.substring(22));
    
    	if (ACCOUNTS[o.index]['vcard']
	    && ACCOUNTS[o.index]['vcard']['fileData']
	    && ACCOUNTS[o.index]['vcard']['fileData'][0]
	    && ACCOUNTS[o.index]['vcard']['fileData'][0]['vCard']
	    && ACCOUNTS[o.index]['vcard']['fileData'][0]['vCard'][0]
	    && ACCOUNTS[o.index]['vcard']['fileData'][0]['vCard'][0]['PHOTO']
	    && ACCOUNTS[o.index]['vcard']['fileData'][0]['vCard'][0]['PHOTO'][0]
	    && ACCOUNTS[o.index]['vcard']['fileData'][0]['vCard'][0]['PHOTO'][0]['BINVAL']
	    && ACCOUNTS[o.index]['vcard']['fileData'][0]['vCard'][0]['PHOTO'][0]['BINVAL'][0]) {
	    var vCard_obj = ACCOUNTS[o.index]['vcard']['fileData'][0]['vCard'][0];
	    vCard_obj['PHOTO'][0]['BINVAL'][0] = new_avatar;
	} else {
	    var vCard_obj = {
		PHOTO: [
	    {
		BINVAL: [new_avatar]
	    }
			]
	    };
	}
    
    var api2_call = {
        "cpanel_jsonapi_version": 2,
        "cpanel_jsonapi_module": "CommuniGate",
        "cpanel_jsonapi_func": "UpdateVCard",
	"account": ACCOUNTS[o.index]['prefs']['AccountName']
    };

    // callback functions
        var success = function(o) {
            YAHOO.util.Dom.get("change_avatar_status_" + index).innerHTML = '';
            toggle_action_div(null, {
                id: "change_avatar_module_" + index,
                index: index,
                action: "change_avatar"
            });

            try {
                var data = YAHOO.lang.JSON.parse(o);
            } catch (e) {
                CPANEL.widgets.status_bar("status_bar_" + index, "error", CPANEL.lang.json_error, CPANEL.lang.json_parse_failed);
                return;
            }

            // update the table and display the status
            if (data.cpanelresult.event && (data.cpanelresult.event['result'] == 1)) {
                var status = "";
                CPANEL.widgets.status_bar("status_bar_" + index, "success", "Changed avatar", status);
		var selector_span_avatar = "#span_avatar_" + index;
		$(selector_span_avatar).css("display", "none");
		var selector_avatar = "#avatar_" + index;
		$(selector_avatar).attr("src", 'data:image/png;base64,' + new_avatar);
            } else if (data.cpanelresult.event && (data.cpanelresult.event['result'] == 0)) {
                CPANEL.widgets.status_bar("status_bar_" + index, "error", CPANEL.lang.Error, data.cpanelresult.data[0].reason);
            } else {
                CPANEL.widgets.status_bar("status_bar_" + index, "error", CPANEL.lang.Error, data.cpanelresult.error || LANG.unknown_error);
            }
        }


        // send the AJAX request
    $.ajax({
	    type: "POST",
	    url: CPANEL.urls.json_api() + '&' + $.param(api2_call),
	    data: "vcard=" + JSON.stringify(vCard_obj),
	    success: success,
	    dataType: "text"
		});

        // show the ajax loading icon
        YAHOO.util.Dom.get("change_avatar_status_" + index).innerHTML = CPANEL.icons.ajax + " " + "Changing avatar" + "...";
};

var change_password = function(e, o) {
    var index = o.index;

    // check the validation
    CHANGE_PASSWORD1_VALIDATION.verify();
    CHANGE_PASSWORD2_VALIDATION.verify();
    var error_messages = [];
    if (CHANGE_PASSWORD1_VALIDATION.is_valid() == false) error_messages.push(CHANGE_PASSWORD1_VALIDATION.error_messages());
    if (CHANGE_PASSWORD2_VALIDATION.is_valid() == false) error_messages.push(CHANGE_PASSWORD2_VALIDATION.error_messages());

    // if the validation is good submit the password to be changed
    if (error_messages.length === 0) {

        // create the API variables
        var password = YAHOO.util.Dom.get("change_password_input_1_" + o.index).value;
        var api2_call = {
            "cpanel_jsonapi_version": 2,
            "cpanel_jsonapi_module": "Email",
            "cpanel_jsonapi_func": "passwdpop",
            "email": ACCOUNTS[o.index]['username'],
            "domain": ACCOUNTS[o.index]['domain'],
            "password": password
        };

        // callback functions
        var callback = {
            success: function(o) {
                YAHOO.util.Dom.setStyle("change_password_input_" + index, "display", "block");
                YAHOO.util.Dom.get("change_password_status_" + index).innerHTML = '';
                toggle_action_div(null, {
                    "id": "change_password_module_" + index,
                    "index": index,
                    "action": "change_password"
                });

                try {
                    var data = YAHOO.lang.JSON.parse(o.responseText);
                    if (data['cpanelresult']['data'][0]['result'] == "1") {
                        CPANEL.widgets.status_bar("status_bar_" + index, "success", LANG.password_changed);
                    } else {
                        CPANEL.widgets.status_bar("status_bar_" + index, "error", CPANEL.lang.Error, data['cpanelresult']['error']);
                    }
                } catch (e) {
                    CPANEL.widgets.status_bar("status_bar_" + index, "error", CPANEL.lang.json_error, CPANEL.lang.json_parse_failed);
                }
            },

            failure: function(o) {
                YAHOO.util.Dom.setStyle("change_password_input_" + index, "display", "block");
                YAHOO.util.Dom.get("change_password_status_" + index).innerHTML = '';
                toggle_action_div(null, {
                    "id": "change_password_module_" + index,
                    "index": index,
                    "action": "change_password"
                });
                CPANEL.widgets.status_bar("status_bar_" + index, "error", CPANEL.lang.ajax_error, CPANEL.lang.ajax_try_again);
            }
        };

        // send the AJAX request
        YAHOO.util.Connect.asyncRequest('GET', CPANEL.urls.json_api(api2_call), callback, '');

        // show the ajax loading icon
        YAHOO.util.Dom.setStyle("change_password_input_" + index, "display", "none");
        YAHOO.util.Dom.get("change_password_status_" + index).innerHTML = CPANEL.icons.ajax + " " + LANG.changing_password + "...";
    }
};

// reset to page 1
var reset_pagination = function() {
    API.api2_paginate_start = 1;
};

// switch the number of items per page
var toggle_items_per_page = function() {
    // do not switch items per page while a request is active
    if (TABLE_REQUEST_PENDING) return true;

    var select = YAHOO.util.Dom.get("email_table_items_per_page");
    API.api2_paginate_size = select.options[select.selectedIndex].text;

    // reset to page 1
    reset_pagination();

    update_email_accounts();
};

// search field focus
var search_input_focus = function() {
    var search_field = YAHOO.util.Dom.get("email_table_search_input");
    if (search_field.value == LANG.search_email) {
        search_field.value = '';
         YAHOO.util.Dom.setStyle(search_field, "color", "black");
    }
};

// search field blur
var search_input_blur = function() {
    // var search_field = YAHOO.util.Dom.get("email_table_search_input");
    // if (YAHOO.lang.trim(search_field.value) == '') {
    //     YAHOO.util.Dom.setStyle(search_field, "color", "#888888");
    //     // search_field.value = LANG.search_email;
    //     YAHOO.util.Dom.setStyle("email_table_clear_search", "display", "none");
    // }
};

// search email
var search_email = function() {
    var search_term = YAHOO.util.Dom.get("email_table_search_input").value;
    search_term = search_term.toLowerCase();
    
    for (var i = 0; i < ACCOUNTS.length; i++){
	var current_account = YAHOO.util.Dom.get('account_row_' + i);
	var current_account_module = YAHOO.util.Dom.get('dt_module_row_' + i);
	YAHOO.util.Dom.removeClass(current_account, "hidden");
	YAHOO.util.Dom.removeClass(current_account_module, "hidden");
	if (ACCOUNTS[i]['prefs']['RealName']){
	    var realname = ACCOUNTS[i]['prefs']['RealName'].toLowerCase();
	}
	else {
	    var realname = "";
	}
	var acc_username = ACCOUNTS[i]['username'].toLowerCase();
	var acc_domain = ACCOUNTS[i]['domain'].toLowerCase();
	var acc_email = ACCOUNTS[i]['prefs']['AccountName'].toLowerCase();
	if (acc_username.indexOf(search_term) == -1 && acc_domain.indexOf(search_term) == -1 && realname.indexOf(search_term) == -1 && acc_email.indexOf(search_term)){
	    
	    YAHOO.util.Dom.addClass(current_account, "hidden");
	    YAHOO.util.Dom.addClass(current_account_module, "hidden");

	    // CPANEL.animate.fade_out('account_row_' + i);
	    // CPANEL.animate.fade_out('dt_module_row_' + i);
	}
    }

    // do not sort while a request is active
    if (TABLE_REQUEST_PENDING) return true;

    // this means that you can't search your email account for the phrase 'Search Email'
    if (search_term == LANG.search_email) search_term = '';

    // case 32016:: Do not do the same search again
    if (search_term == LAST_SEARCH_TXT) return true;
    LAST_SEARCH_TXT = search_term;

    // API.api2_filter = 1;
    // API.api2_filter_type = "contains";
    // API.api2_filter_column = "email";
    // API.api2_filter_term = search_term;

    // // reset to page 1
    // reset_pagination();

    // update_email_accounts();

    // show the "clear search" button
    if (search_term != "") YAHOO.util.Dom.setStyle("email_table_clear_search", "display", "");
};

var clear_search = function() {
    YAHOO.util.Dom.get("email_table_search_input").value = "";
    search_email();
    // search_input_blur();
    // API.api2_filter = 1;
    // API.api2_filter_type = "contains";
    // API.api2_filter_column = "email";
    // API.api2_filter_term = "";
    // LAST_SEARCH_TXT = "";
    // update_email_accounts();
};

// toggle sorting of table headers
var toggle_sort = function(e, o) {
    // do not sort while a request is active
    if (TABLE_REQUEST_PENDING) return true;

    // clear all sorting icons
    YAHOO.util.Dom.get("email_table_account_sort_img").innerHTML = '';
    // YAHOO.util.Dom.get("email_table_domain_sort_img").innerHTML = '';
    YAHOO.util.Dom.get("email_table_usage_sort_img").innerHTML = '';
    // YAHOO.util.Dom.get("email_table_quota_sort_img").innerHTML = '';
    // YAHOO.util.Dom.get("email_table_percent_sort_img").innerHTML = '';

    // determine field and method to sort by
    if (o.header == 'percent') {
        API.api2_sort_column = 'diskusedpercent';
        API.api2_sort_method = "numeric";
    }
    if (o.header == 'account') {
        API.api2_sort_column = "user";
        API.api2_sort_method = "alphabet";
    }
    if (o.header == 'domain') {
        API.api2_sort_column = "domain";
        API.api2_sort_method = "alphabet";
    }
    if (o.header == 'usage') {
        API.api2_sort_column = "_diskused"; /* _ is the unprocessed version */
        API.api2_sort_method = "numeric";
    }
    if (o.header == 'quota') {
        API.api2_sort_column = "_diskquota"; /* _ is the unprocessed version */
        API.api2_sort_method = "numeric_zero_as_max";
    }

    // determine ascending or descending
    if (SORT_STATE[o.header] == 'asc') {
        YAHOO.util.Dom.get("email_table_" + o.header + "_sort_img").innerHTML = '&darr;';
        SORT_STATE[o.header] = 'desc';
        API.api2_sort_reverse = '1';
    } else {
        YAHOO.util.Dom.get("email_table_" + o.header + "_sort_img").innerHTML = '&uarr;';
        SORT_STATE[o.header] = 'asc';
        API.api2_sort_reverse = '0';
    }

    // reset to page 1
    reset_pagination();

    update_email_accounts();
};

// initialize the validator objects for a new email account
var initialize_new_email_validators = function() {
    ADD_EMAIL_VALID.account = new CPANEL.validate.validator(LANG.account_name);
    ADD_EMAIL_VALID.account.add("add_email_account", "local_part_email(%input%, 'cpanel')", LANG.not_valid_email);
    ADD_EMAIL_VALID.account.add("add_email_account", "max_length(%input%, 128)", LANG.email_max_128_char);
    ADD_EMAIL_VALID.account.attach();

    var password_validators = CPANEL.password.setup("add_email_password1", "add_email_password2", "password_strength", REQUIRED_PASSWORD_STRENGTH, "create_strong_password", "why_strong_passwords_link", "why_strong_passwords_text");
    ADD_EMAIL_VALID.password1 = password_validators[0];
    ADD_EMAIL_VALID.password2 = password_validators[1];

    // ADD_EMAIL_VALID.quota_number = new CPANEL.validate.validator(LANG.Quota);
    // ADD_EMAIL_VALID.quota_number.add("quota_number_input", "positive_integer", LANG.email_quota_number, "quota_number");
    // ADD_EMAIL_VALID.quota_number.add("quota_number_input", function() {
    //     return quota_over_2gigs("quota_number_input")
    // }, LANG.email_quota_2gig, "quota_number");
    // ADD_EMAIL_VALID.quota_number.attach();

    // ADD_EMAIL_VALID.quota_unlimited = new CPANEL.validate.validator(LANG.Quota);
    // ADD_EMAIL_VALID.quota_unlimited.add("quota_unlimited", "anything", "", "quota_unlimited");
    // ADD_EMAIL_VALID.quota_unlimited.attach();
};

// custom validation function for the mailbox quota
var quota_over_2gigs = function(input_field) {
    var quota = YAHOO.util.Dom.get(input_field).value;
    if (CPANEL.validate.integer(quota) == true && quota > MAX_EMAIL_QUOTA) {
        return false;
    }
    return true;
};

// reset the add new account form after an AJAX request
var reset_add_account_form = function() {
    YAHOO.util.Dom.get("add_email_account").value = '';
    YAHOO.util.Dom.get("add_email_password1").value = '';
    YAHOO.util.Dom.get("add_email_password2").value = '';
    YAHOO.util.Dom.get("quota_number_input").value = '' + USERDEFINED_QUOTA_DEFAULT_VALUE + '';
    YAHOO.util.Dom.get("quota_number_input").disabled = false;

    if (!DEFAULT_QUOTA_SELECTED || DEFAULT_QUOTA_SELECTED == "userdefined") {
        YAHOO.util.Dom.get("quota_number").checked = true;
        YAHOO.util.Dom.get("quota_unlimited").checked = false;
    } else {
        YAHOO.util.Dom.get("quota_number").checked = false;
        YAHOO.util.Dom.get("quota_unlimited").checked = true;
    }
    // clear validation
    for (var i in ADD_EMAIL_VALID) {
        if (ADD_EMAIL_VALID.hasOwnProperty(i)) {
            ADD_EMAIL_VALID[i].clear_messages();
        }
    }

    // set the password bar to 0
    CPANEL.password.show_strength_bar("password_strength", 0);

    YAHOO.util.Dom.get("add_email_create_status").innerHTML = '';
    YAHOO.util.Dom.setStyle("add_email_create", "display", "block");
    YAHOO.util.Dom.get("add_email_account").focus();
};

// function to add a new email account, only runs if all the input data is valid
var add_new_email = function() {
    var email = YAHOO.util.Dom.get("add_email_account").value;
    var domain = YAHOO.util.Dom.get("add_email_domain").value;
    var password = YAHOO.util.Dom.get("add_email_password1").value;
    var quota = 0;
    if (YAHOO.util.Dom.get("quota_number").checked) {
        quota = YAHOO.util.Dom.get("quota_number_input").value;
    }

    // create the API call
    var api2_call = {
        cpanel_jsonapi_version: 2,
        cpanel_jsonapi_module: "Email",
        cpanel_jsonapi_func: "addpop",
        email: email,
        password: password,
        quota: quota,
        domain: domain
    };

    // callback functions
    var callback = {
        success: function(o) {
            // reset the input form
            reset_add_account_form();

            // parse the JSON
            try {
                var data = YAHOO.lang.JSON.parse(o.responseText);
            } catch (e) {
                CPANEL.widgets.status_bar("add_email_status_bar", "error", CPANEL.lang.json_error, CPANEL.lang.json_parse_failed);
                return;
            }

            // success
            if (data.cpanelresult.data && (data.cpanelresult.data[0].result == 1)) {
                var status = api2_call.email + "@" + api2_call.domain;
                CPANEL.widgets.status_bar("add_email_status_bar", "success", LANG.account_created, status);
                update_email_accounts(api2_call.email);
                return;
            }

            // failure
            if (data.cpanelresult.data && (data.cpanelresult.data[0].result == 0)) {
                CPANEL.widgets.status_bar("add_email_status_bar", "error", CPANEL.lang.Error, data.cpanelresult.data[0].reason);
                return;
            }

            // unknown?
            var error = data.cpanelresult.error || LANG.unknown_error;
            CPANEL.widgets.status_bar("add_email_status_bar", "error", CPANEL.lang.Error, error);
        },

        failure: function(o) {
            reset_add_account_form();
            CPANEL.widgets.status_bar("add_email_status_bar", "error", CPANEL.lang.ajax_error, CPANEL.lang.ajax_try_again);
        }
    };

    // send the AJAX request
    YAHOO.util.Connect.asyncRequest('GET', CPANEL.urls.json_api(api2_call), callback, '');

    // show the ajax loading icon
    YAHOO.util.Dom.setStyle("add_email_create", "display", "none");
    YAHOO.util.Dom.get("add_email_create_status").innerHTML = CPANEL.icons.ajax + " " + LANG.creating_account + "...";
};

var click_quota_unlimited = function(number_input_el, number_validation, unlimited_validation) {
    YAHOO.util.Dom.setStyle(number_input_el, "color", "#888888");
    number_validation.clear_messages();
    unlimited_validation.verify();
};

var click_quota_number = function(number_radio_el, number_input_el, number_validation, unlimited_validation) {
    YAHOO.util.Dom.setStyle(number_input_el, "color", "black");
    YAHOO.util.Dom.get(number_radio_el).checked = true;
    unlimited_validation.clear_messages();
    number_validation.verify();
};

var grab_default_account_disk_used = function() {
    var callback = {
        success: function(o) {
            // YAHOO.util.Dom.get("default_account_disk_used").innerHTML = o.responseText;
        },
        failure: function(o) {}
    };

    // send the AJAX request
    YAHOO.util.Connect.asyncRequest('GET', "default_account_disk_usage.html", callback, '');
};

// page initialization
var init_mail = function() {

    // initialize the API variables
    API = {
        "cpanel_jsonapi_version": 2,
        "cpanel_jsonapi_func": "AccountsOverview",
        "cpanel_jsonapi_module": "CommuniGate",
        "api2_paginate": 0,
        "api2_paginate_size": 0,
        "api2_paginate_start": 0,
        "api2_sort": 1,
        "api2_sort_column": "user",
        "api2_sort_method": "alphabet",
        "api2_sort_reverse": 0
    };

    // initialize the sort state to ascending order
    SORT_STATE = {
        percent: "asc",
        account: "asc",
        domain: "asc",
        usage: "asc",
        quota: "asc"
    };

    // initialize the validators for adding a new email account
    initialize_new_email_validators();

    // initialize number of items per page
    var select = YAHOO.util.Dom.get("email_table_items_per_page");
    API.api2_paginate_size = select.options[select.selectedIndex].text;

    // initialize the search bar
    YAHOO.util.Dom.get("email_table_search_input").value = '';
    search_input_blur();

    // add new account event handlers
    CPANEL.validate.attach_to_form("add_email_create", ADD_EMAIL_VALID, add_new_email); // attach validation to the form
    YAHOO.util.Event.on("quota_unlimited", "click", function() {
        click_quota_unlimited("quota_number_input", ADD_EMAIL_VALID.quota_number, ADD_EMAIL_VALID.quota_unlimited)
    });
    YAHOO.util.Event.on(["quota_number", "quota_number_input"], "click", function() {
        click_quota_number("quota_number", "quota_number_input", ADD_EMAIL_VALID.quota_number, ADD_EMAIL_VALID.quota_unlimited)
    });
    CPANEL.util.catch_enter(["add_email_account", "add_email_password1", "add_email_password2", "quota_number_input"], "add_email_create");

    // search field and number of items in the table
    YAHOO.util.Event.on("email_table_items_per_page", "change", toggle_items_per_page);
    YAHOO.util.Event.on("email_table_search_input", "focus", search_input_focus);
    YAHOO.util.Event.on("email_table_search_input", "blur", search_input_blur);
    CPANEL.util.catch_enter("email_table_search_input", search_email);
    YAHOO.util.Event.on("email_table_search_button", "click", search_email);
    YAHOO.util.Event.on("email_table_search_input", "change", search_email);
    YAHOO.util.Event.on("email_table_search_input", "keyup", search_email);

    // table headers
    YAHOO.util.Event.on("email_table_account_sort", "click", toggle_sort, {
        header: "account"
    });
    YAHOO.util.Event.on("email_table_domain_sort", "click", toggle_sort, {
        header: "domain"
    });
    YAHOO.util.Event.on("email_table_usage_sort", "click", toggle_sort, {
        header: "usage"
    });
    YAHOO.util.Event.on("email_table_quota_sort", "click", toggle_sort, {
        header: "quota"
    });
    YAHOO.util.Event.on("email_table_percent_sort", "click", toggle_sort, {
        header: "percent"
    });

    // update the accounts object and build the email table
    update_email_accounts();

    grab_default_account_disk_used();
};
YAHOO.util.Event.onDOMReady(init_mail);
