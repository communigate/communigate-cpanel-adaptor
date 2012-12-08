// NOTE: This page is pretty complicated.  There is a lot of DOM being injected and you need to pay attention to the objects that get
// passed around from function to function.  I originally had things separated by building all the DOM all at once and then adding all the event handlers right after.
// I had to scrap that because it was too slow.  If you see something that makes you say "geez, this is so hard to read, why did he do that?" the answer is: it's like that
// to be fast.  If you make an architecture/DOM change be sure to test it against a large number of email addresses in the table.
// C. Oakman - chriso@cpanel.net

// globals
if (!self['DEFAULT_QUOTA_SELECTED']) { var DEFAULT_QUOTA_SELECTED = "userdefined"; }
if (!self['USERDEFINED_QUOTA_DEFAULT_VALUE']) { var USERDEFINED_QUOTA_DEFAULT_VALUE = 250; }
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

var AJAX_TIMEOUT_MS = 60000;  //1 minute

// update the email accounts table with fresh information from the server
var update_email_accounts = function() {
    // case 32016:: prevent the user from submitting many many requests
    if (TABLE_REQUEST_PENDING) return true;
    
    // success function defined here so we can use a setTimeout to call it
    // need to call this function like this to prevent a possible race condition when the ajax request returns faster
    // than it takes the browser to destroy the table elements and all event handlers in it
    var ajax_success = function(o) {
        // if we are still destroying the table poll every 10 milliseconds until that task is finished
        if (TABLE_REQUEST_ACTIVE == true) {
            setTimeout(function() { ajax_success(o); }, 10);
        }
        // once the table is fully destroyed build the new one
        else {
            TABLE_REQUEST_PENDING = false;
            AJAX_FAILURES = 0;

            // parse the JSON response data
            try {
                var data = YAHOO.lang.JSON.parse(o.responseText);
                ACCOUNTS = data.cpanelresult.data;
                PAGE_DATA = data.cpanelresult.paginate;
                
                // convert PAGE_DATA elements to integers
                for (var i = 0; i < PAGE_DATA.length; i++) {
                    PAGE_DATA[z] = parseInt(PAGE_DATA[z]);
                }
                
                if (ACCOUNTS.length > 0) {
                    build_email_table();
                }
                else {
                    show_no_accounts();
                }
            }
            catch (e) {
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
            setTimeout(function() { ajax_failure(o); }, 10);
        }
        // once the table is fully destroyed we can write things to it
        else {
            TABLE_REQUEST_PENDING = false;
            
            var div_region = YAHOO.util.Region.getRegion(YAHOO.util.Dom.get("accounts_table"));
            if (div_region.height > 0) {
                var html_start = '<div style="height: ' + div_region.height + 'px"><div style="padding: 20px">';
                var html_end = '</div></div>';
            }
            else {
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
            }
            else {
                var html = CPANEL.icons.error + ' ' + LANG.ajax_failure + ' ' + CPANEL.lang.ajax_try_again;
                YAHOO.util.Dom.get("accounts_table").innerHTML = html_start + html + html_end;
            }
        }
    };

    // callback functions
    var callback = {
        success : function(o) {
            ajax_success(o);
        },
        failure : function(o) {
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
    }
    else {
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
    var html = '<table id="table_email_accts" class="table_email_accts" border="0" cellspacing="0" cellpadding="0">';
    for (var i = 0; i < ACCOUNTS.length; i++) {
        
        // set the disk quota
        if (ACCOUNTS[i]['_diskquota'] == 0 || ACCOUNTS[i]['diskquota'] == "unlimited") {
            ACCOUNTS[i]['humandiskquota'] = "&infin;";
        }
        else {
            ACCOUNTS[i]['humandiskquota'] = ACCOUNTS[i]['diskquota'];
        }
        
        // convert diskused to an integer
        ACCOUNTS[i]['diskused'] = parseInt(ACCOUNTS[i]['diskused']);
        
        html += '<tr id="account_row_' + i + '" class="dt_info_row ' + row_toggle + '">';
        html += '<td class="col1">' + ACCOUNTS[i]['email'] + '</td>';
        html += '<td class="col2">' + ACCOUNTS[i]['diskused'] + '<input type="hidden" id="diskused_' + i + '" value="' + ACCOUNTS[i]['diskused'] + '" /> / <span id="quota_' + i + '">' + ACCOUNTS[i]['humandiskquota'] + '</span> <span class="megabyte_font">MB</span><br /><div style="height: 3px"></div><div class="table_progress_bar" id="usage_bar_' + i + '"></div></td>';
        html += '<td class="col3">';
        html +=  '<table class="table_email_accts_actions" border="0" cellspacing="0" cellpadding="0"><tr>';
        html +=   '<td><span class="action_link" onclick="toggle_action_div(null, {id:\'change_password_module_' + i + '\', index:' + i + ', action:\'change_password\'})">' + LANG.change_password_br + '</span></td>';
        html +=   '<td><span class="action_link" onclick="toggle_action_div(null, {id:\'change_quota_module_' + i + '\', index:' + i + ', action:\'change_quota\'})">' + LANG.change_quota_br + '</span></td>';
        html +=   '<td><span class="action_link" onclick="toggle_action_div(null, {id:\'delete_module_' + i + '\', index:' + i + ', action:\'delete\'})">' + LANG.delete2 + '</span></td>';
        html +=         '<td><div onclick="toggle_menu(null, {index:' + i + '})" class="email_table_more_button email_table_more_options" id="email_table_menu_button_' + i + '">' + LANG.More + ' ' + MORE_IMG + '</div></td>';    
        html +=     '</tr></table>';
        html += '</td>';
        html += '</tr>';
        
        html += '<tr id="dt_module_row_' + i + '" class="' + row_toggle + '"><td colspan="3">';
        html +=     '<div id="change_password_module_' + i + '" class="dt_module" style="display: none"></div>';
        html +=     '<div id="change_quota_module_' + i + '" class="dt_module" style="display: none"></div>';
        html +=     '<div id="delete_module_' + i + '" class="dt_module" style="display: none"></div>';
        html +=     '<div id="status_bar_' + i + '" class="cjt_status_bar" style="padding: 15px 0px 20px 0px"></div>';
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
            }
            else {
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
            html += ' <span onclick="change_page(' + (parseInt(PAGE_DATA.current_page) + 1) + ')" class="email_table_next_page">' + LANG.next + ' &rarr;</span>';
        }       
        html += '</div>';
    }
    html += '</div>';   // close pagination_pages div

    return html;
};

// add event handlers for the new email table
var build_progress_bars = function() {
    for (var i = 0; i < ACCOUNTS.length; i++) {
        build_progress_bar("usage_bar_" + i, ACCOUNTS[i]['diskused'], ACCOUNTS[i]['diskquota']);
    }
};

var build_progress_bar = function(id, usage, quota) {
    var percent = 100 * (usage / quota);
    if (quota == 0) percent = 0;
    CPANEL.widgets.progress_bar(id, percent, "", { inverse_colors: true });
};

var change_page = function(page) {
    API.api2_paginate_start = ((page - 1) * PAGE_DATA.results_per_page) + 1;
    update_email_accounts();
};

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
        // if webmail is enabled
        if (WEBMAIL_ENABLED == true) {
            menu_items.push({
                text: LANG.access_webmail,
                url: "webmailform.html?user=" + encodeURIComponent(ACCOUNTS[o.index]['user']) + "@" + encodeURIComponent(ACCOUNTS[o.index]['domain']) + "&amp;domain=" + encodeURIComponent(ACCOUNTS[o.index]['domain']),
                target: "_blank"
            });
        }
        // configure email
        menu_items.push({
            text: LANG.configure_email_client,
            url: "clientconf.html?acct=" + encodeURIComponent(ACCOUNTS[o.index]['user']) + "@" + encodeURIComponent(ACCOUNTS[o.index]['domain'])
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
        before_hide_module(currently_open_div);
        CPANEL.animate.slide_up( currently_open_div.id , function() { after_hide_module(currently_open_div) });
    }
    
    // if o is currently displayed, hide it
    if (YAHOO.util.Dom.getStyle(o.id, "display") != 'none') {
        before_hide_module(o);
        CPANEL.animate.slide_up( o.id, function() { after_hide_module(o) });
    }
    // else show o and set it as the OPEN_ACTION_DIV
    else {
        before_show_module(o);
        CPANEL.animate.slide_down( o.id, function() { after_show_module(o) });
        OPEN_ACTION_DIV = o;
    }
};

// build the HTML markup for the input divs
var before_show_module = function(o) {
    
    var el = YAHOO.util.Dom.get(o.id);
    
    if (el.innerHTML == '') {
    
        var html = '';
        
        if (o.action == 'change_password') {
            html += '<table style="width: 500px; text-align: center; padding: 8px 0px; margin: 0px auto">';
            html +=     '<tr>';
            html +=         '<td width="33%" style="text-align: right">' + LANG.password + ':</td>';
            html +=         '<td width="33%"><input type="password" id="change_password_input_1_' + o.index + '" style="width: 150px" /></td>';
            html +=         '<td width="33%" style="text-align: left"><span id="change_password_input_1_' + o.index + '_error" style="width: 16px; height: 16px;"></span></td>';
            html +=     '</tr>';
            html +=     '<tr>';
            html +=         '<td style="text-align: right">' + LANG.password2 + ':</td>';
            html +=         '<td><input type="password" id="change_password_input_2_' + o.index + '" style="width: 150px" /></td>';
            html +=         '<td style="text-align: left"><span id="change_password_input_2_' + o.index + '_error" style="width: 16px; height: 16px;"></span></td>';
            html +=     '</tr>';
            html +=     '<tr>';
            html +=         '<td style="text-align: right">' + LANG.strength + ':</td>';
            html +=         '<td><center><div id="password_strength_bar_' + o.index + '" style="width: 150px; height: 20px; border: 1px solid black"></center></div></td>';
            html +=         '<td style="text-align: left"><input type="button" class="input-button" tabindex="-1" id="create_strong_password_' + o.index + '" value="' + CPANEL.lang.password_generator + '" /></td>';
            html +=     '</tr>';
            html +=     '<tr><td colspan="3">';
            html +=         '<div style="height: 8px">&nbsp;</div>';
            html +=         '<div id="change_password_input_' + o.index + '">';
            html +=             '<span class="action_link" id="email_table_change_password_cancel_' + o.index + '">' + CPANEL.lang.cancel + '</span> or ';
            html +=             '<input type="button" class="input-button" value="' + LANG.change_password + '" id="email_table_change_password_confirm_' + o.index + '" />';
            html +=         '</div>';
            html +=         '<div id="change_password_status_' + o.index + '"></div>';          
            html +=     '</td></tr>';
            html += '</table>';
        }
        
        if (o.action == 'change_quota') {
            html += '<table style="width: 500px; margin: 0px auto">';
            html +=     '<tr>';
            html +=         '<td width="45%" style="text-align: right">' + LANG.mailbox_quota + ': </td>';
            html +=         '<td width="55%" style="text-align: left">';
            html +=             '<input type="hidden" id="current_quota_' + o.index + '" value="' + ACCOUNTS[o.index]["diskquota"] + '" />';
            html +=             '<span id="current_quota_' + o.index + '_error" style="display: none"></span>';
            if (ACCOUNTS[o.index]["diskquota"] == "unlimited") {
                html +=         '<input type="radio" name="quota_' + o.index + '" id="quota_number_' + o.index + '" />&nbsp;<input type="text" id="quota_number_input_' + o.index + '" size="4" maxlength="4" value="' + USERDEFINED_QUOTA_DEFAULT_VALUE + '" style="color: #888888;" /> <span class="megabyte_font">MB</span> <span id="quota_number_input_' + o.index + '_error"></span><br />';
                html +=         '<input type="radio" name="quota_' + o.index + '" id="quota_unlimited_' + o.index + '" checked="checked" />&nbsp;<label style="display: inline" for="quota_unlimited_' + o.index + '">' + LANG.Unlimited + '</label>&nbsp;<span id="quota_unlimited_' + o.index + '_error"></span>';
            }
            else {
                html +=         '<input type="radio" name="quota_' + o.index + '" id="quota_number_' + o.index + '" checked="checked" />&nbsp;<input type="text" id="quota_number_input_' + o.index + '" size="4" maxlength="4" value="' + ACCOUNTS[o.index]["diskquota"] + '"/> <span class="megabyte_font">MB</span> <span id="quota_number_input_' + o.index + '_error" ></span><br />';
                html +=         '<input type="radio" name="quota_' + o.index + '" id="quota_unlimited_' + o.index + '" />&nbsp;<label style="display: inline" for="quota_unlimited_' + o.index + '">' + LANG.Unlimited + '</label>&nbsp;<span id="quota_unlimited_' + o.index + '_error" ></span>';
            }
            html +=         '</td>';
            html +=     '</tr>';
            html +=     '<tr><td colspan="2" style="text-align: center">';
            html +=         '<div style="height: 4px">&nbsp;</div>';
            html +=         '<div id="change_quota_input_' + o.index + '">';
            html +=             '<span class="action_link" id="email_table_change_quota_cancel_' + o.index + '">' + CPANEL.lang.cancel + '</span> or ';
            html +=             '<input type="button" class="input-button" value="' + LANG.change_quota + '" id="change_quota_confirm_' + o.index + '" />';
            html +=         '</div>';
            html +=         '<div id="change_quota_status_' + o.index + '"></div>';
            html +=     '</td></tr>';
            html += '</table>';
        }
        
        if (o.action == 'delete') {
            html += '<div style="width: 500px; margin: 0px auto; padding: 8px 0px; text-align: center">';
            html +=     LANG.delete2 + ' ' + ACCOUNTS[o.index]['email'] + ' ?<br /><br />';
            html +=     '<div id="delete_confirm_input_' + o.index + '">';
            html +=         '<span class="action_link" id="email_table_delete_cancel_' + o.index + '">' + CPANEL.lang.cancel + '</span> or ';
            html +=         '<input type="button" class="input-button" id="email_table_delete_confirm_' + o.index + '" value="' + LANG.delete2 + '" /></span>';
            html +=     '</div>';
            html +=     '<div id="delete_email_status_' + o.index + '"></div>';
            html += '</div>';
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
        YAHOO.util.Event.on("email_table_change_password_confirm_" + o.index, "click", change_password, { "index" : o.index });
        YAHOO.util.Event.on("create_strong_password_" + o.index, "click", create_strong_password, { "index" : o.index });       
        YAHOO.util.Event.on("email_table_change_password_cancel_" + o.index, "click", toggle_action_div, o);
        CPANEL.util.catch_enter([password1, password2], "email_table_change_password_confirm_" + o.index);
        
        // add validation       
        CHANGE_PASSWORD1_VALIDATION = new CPANEL.validate.validator(LANG.change_password);
        CHANGE_PASSWORD1_VALIDATION.add(password1, verify_password_strength, CPANEL.lang.password_validator_strength + " " + REQUIRED_PASSWORD_STRENGTH + ".");
        CHANGE_PASSWORD1_VALIDATION.add(password1, 'no_chars(%input%, " ")', CPANEL.lang.password_validator_no_spaces);
        CHANGE_PASSWORD1_VALIDATION.attach();
        
        CHANGE_PASSWORD2_VALIDATION = new CPANEL.validate.validator(CPANEL.lang.passwords_match);
        CHANGE_PASSWORD2_VALIDATION.add(password2, "equals('" + password1 + "', '" + password2 + "')", CPANEL.lang.password_validator_no_match);
        CHANGE_PASSWORD2_VALIDATION.attach();
        
        // initialize the password bar
        CHANGE_PASSWORD_BAR = new CPANEL.password.strength_bar("password_strength_bar_" + o.index);
        CHANGE_PASSWORD_BAR.attach(password1, function() { CHANGE_PASSWORD1_VALIDATION.verify(); });        
        
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
        CHANGE_QUOTA_VALID.quota_number.add(quota_number_input_el, function() { return quota_over_2gigs(quota_number_input_el) }, LANG.email_quota_2gig, "quota_number_" + o.index);
        CHANGE_QUOTA_VALID.quota_number.attach();
        
        CHANGE_QUOTA_VALID.quota_unlimited = new CPANEL.validate.validator(LANG.change_quota);
        CHANGE_QUOTA_VALID.quota_unlimited.add("quota_unlimited_" + o.index, "anything", "", "quota_unlimited_" + o.index);
        CHANGE_QUOTA_VALID.quota_unlimited.attach();
        
        CHANGE_QUOTA_VALID.content_changed = new CPANEL.validate.validator(LANG.change_quota);
        CHANGE_QUOTA_VALID.content_changed.add("current_quota_" + o.index, function() { return change_quota_content(o.index); }, LANG.must_change_before_edit);
        CHANGE_QUOTA_VALID.content_changed.attach();        

        // add event handlers
        YAHOO.util.Event.on("email_table_change_quota_cancel_" + o.index, "click", toggle_action_div, o);       
        YAHOO.util.Event.on(quota_unlimited_el, "click", function() { click_quota_unlimited(quota_number_input_el, CHANGE_QUOTA_VALID.quota_number, CHANGE_QUOTA_VALID.quota_unlimited) });
        YAHOO.util.Event.on([quota_number_el, quota_number_input_el], "click", function() { click_quota_number(quota_number_el, quota_number_input_el, CHANGE_QUOTA_VALID.quota_number, CHANGE_QUOTA_VALID.quota_unlimited) });
        CPANEL.util.catch_enter("quota_number_input_" + o.index, "change_quota_confirm_" + o.index);
        
        CPANEL.validate.attach_to_form("change_quota_confirm_" + o.index, CHANGE_QUOTA_VALID, function() { change_quota(o.index); });
    }
    
    if (o.action == 'delete') {
        YAHOO.util.Event.on("email_table_delete_confirm_" + o.index, "click", delete_confirm, { "index" : o.index });
        YAHOO.util.Event.on("email_table_delete_cancel_" + o.index, "click", toggle_action_div, o);
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
    
    // purge all event handlers in the div
    YAHOO.util.Event.purgeElement(o.id, true);
};

var verify_password_strength = function() {
    if (CHANGE_PASSWORD_BAR.current_strength < REQUIRED_PASSWORD_STRENGTH) return false;
    else return true;
};

// event handler for the "create strong password" phrase
var create_strong_password = function(e, o) {
    CPANEL.password.generate_password(function(password) { 
        YAHOO.util.Dom.get("change_password_input_1_" + o.index).value = password;
        YAHOO.util.Dom.get("change_password_input_2_" + o.index).value = password;
        CHANGE_PASSWORD_BAR.check_strength("change_password_input_1_" + o.index, function() { CHANGE_PASSWORD1_VALIDATION.verify() });
        CHANGE_PASSWORD2_VALIDATION.verify();
    });
};

// delete an email account
var delete_confirm = function(e, o) {
    var index = o.index;

    // create the API variables
    var api2_call = {
        cpanel_jsonapi_version : 2,
        cpanel_jsonapi_module  : "Email",
        cpanel_jsonapi_func    : "delpop",      
        email  : ACCOUNTS[o.index].user,
        domain : ACCOUNTS[o.index].domain
    };
    
    var reset_module = function() {
        YAHOO.util.Dom.get("delete_email_status_" + index).innerHTML = '';
        YAHOO.util.Dom.setStyle("delete_confirm_input_" + index, "display", "block");
        toggle_action_div(null, { "id" : "delete_module_" + index, "index" : index, "action" : "delete" });
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
        success : function(o) {
            try {
                var data = YAHOO.lang.JSON.parse(o.responseText);

                // update the table and display the status
                if (data['cpanelresult']['data'][0]['result'] == '1') {
                    CPANEL.animate.fade_out('account_row_'+index, function() {
                        YAHOO.util.Dom.setStyle("module_row_" + index, "display", "none");
                        check_no_more_rows();
                    });
                    CPANEL.animate.fade_out('delete_module_'+index);
                }
                else if (data['cpanelresult']['data'][0]['result'] == 0) {
                    reset_module();
                    CPANEL.widgets.status_bar("status_bar_" + index, "error", CPANEL.lang.Error, data['cpanelresult']['data'][0]['reason']);                    
                }
                else {
                    reset_module();
                    CPANEL.widgets.status_bar("status_bar_" + index, "error", CPANEL.lang.Error, "Unknown error.");
                }
            }
            catch (e) {
                reset_module();
                CPANEL.widgets.status_bar("status_bar_" + index, "error", CPANEL.lang.json_error, CPANEL.lang.json_parse_failed);
            }
        },
        
        failure : function(o) {
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
    }
    else {
        YAHOO.util.Dom.get("accounts_table").innerHTML = '<div style="padding: 20px">' + html + '</div>';   
    }
};

var change_quota_content = function(index) {
    var current_quota = YAHOO.util.Dom.get("current_quota_" + index).value;
    if (YAHOO.util.Dom.get("quota_number_" + index).checked == true) {
        return current_quota != YAHOO.util.Dom.get("quota_number_input_" + index).value;
    }
    else {
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

    // create the API variables
    var api2_call = {
        "cpanel_jsonapi_version" : 2,
        "cpanel_jsonapi_module" : "Email",
        "cpanel_jsonapi_func" : "editquota",
        "email" : ACCOUNTS[index]['user'],
        "domain" : ACCOUNTS[index]['domain'],
        "quota" : quota
    };
    
    // callback functions
    var callback = {
        success : function(o) {
            YAHOO.util.Dom.get("change_quota_status_" + index).innerHTML = '';
            YAHOO.util.Dom.setStyle("change_quota_input_" + index, "display", "block");         
            toggle_action_div(null, { id: "change_quota_module_" + index, index: index, action: "change_quota" });
            
            try {
                var data = YAHOO.lang.JSON.parse(o.responseText);
            }
            catch (e) {
                CPANEL.widgets.status_bar("status_bar_" + index, "error", CPANEL.lang.json_error, CPANEL.lang.json_parse_failed);
                return;
            }

            // update the table and display the status
            if (data.cpanelresult.data[0].result == 1) {
                var new_quota = api2_call.quota;
                if (api2_call.quota == 0) new_quota = "&infin;";
                YAHOO.util.Dom.get("quota_" + index).innerHTML = new_quota;
                
                YAHOO.util.Dom.get("current_quota_" + index).value = (api2_call.quota == "unlimited" ? "unlimited" : api2_call.quota);
                
                var status = new_quota + ' <span class="megabyte_font">MB</span>';
                if (api2_call.quota == 0) status = CPANEL.lang.unlimited;
                CPANEL.widgets.status_bar("status_bar_" + index, "success", LANG.Changed_Quota, status);
                
                build_progress_bar("usage_bar_" + index, YAHOO.util.Dom.get("diskused_" + index).value, api2_call.quota);
            }
            else if (data.cpanelresult.data[0].result == 0) {
                CPANEL.widgets.status_bar("status_bar_" + index, "error", CPANEL.lang.Error, data.cpanelresult.data[0].reason);
            }
            else {
                CPANEL.widgets.status_bar("status_bar_" + index, "error", CPANEL.lang.Error, LANG.unknown_error);
            }
        },
        
        failure : function(o) {
            YAHOO.util.Dom.get("change_quota_status_" + index).innerHTML = '';
            YAHOO.util.Dom.setStyle("change_quota_input_" + index, "display", "block");         
            toggle_action_div(null, { "id" : "change_quota_module_" + index, "index" : index, "action" : "change_quota" });
            
            CPANEL.widgets.status_bar("status_bar_" + index, "error", CPANEL.lang.ajax_error, CPANEL.lang.ajax_try_again);
        }
    };
    
    // send the AJAX request
    YAHOO.util.Connect.asyncRequest('GET', CPANEL.urls.json_api(api2_call), callback, '');
    
    // show the ajax loading icon
    YAHOO.util.Dom.setStyle("change_quota_input_" + index, "display", "none");
    YAHOO.util.Dom.get("change_quota_status_" + index).innerHTML = CPANEL.icons.ajax + " " + LANG.changing_quota + "...";
};

var change_password = function(e, o) {
    var index = o.index;
    
    // check the validation
    CHANGE_PASSWORD1_VALIDATION.verify();
    CHANGE_PASSWORD2_VALIDATION.verify();   
    var error_messages = [];
    if (CHANGE_PASSWORD1_VALIDATION.is_valid() == false) error_messages.push(CHANGE_PASSWORD1_VALIDATION.error_messages());
    if (CHANGE_PASSWORD2_VALIDATION.is_valid() == false) error_messages.push(CHANGE_PASSWORD2_VALIDATION.error_messages());
    if (error_messages.length > 0) {
        CPANEL.validate.show_modal_error(error_messages);
    }
    // if the validation is good submit the password to be changed
    else {

        // create the API variables
        var password = YAHOO.util.Dom.get("change_password_input_1_" + o.index).value;
        var api2_call = {
            "cpanel_jsonapi_version" : 2,
            "cpanel_jsonapi_module" : "Email",
            "cpanel_jsonapi_func" : "passwdpop",
            "email" : ACCOUNTS[o.index]['user'],
            "domain" : ACCOUNTS[o.index]['domain'],
            "password" : password
        };
        
        // callback functions
        var callback = {
            success : function(o) {
                YAHOO.util.Dom.setStyle("change_password_input_" + index, "display", "block");
                YAHOO.util.Dom.get("change_password_status_" + index).innerHTML = '';
                toggle_action_div(null, { "id" : "change_password_module_" + index, "index" : index, "action" : "change_password" });

                try {
                    var data = YAHOO.lang.JSON.parse(o.responseText);
                    if (data['cpanelresult']['data'][0]['result'] == "1") {
                        CPANEL.widgets.status_bar("status_bar_" + index, "success", LANG.password_changed);
                    }
                    else {
                        CPANEL.widgets.status_bar("status_bar_" + index, "error", CPANEL.lang.Error, data['cpanelresult']['error']);
                    }
                }
                catch(e) {
                    CPANEL.widgets.status_bar("status_bar_" + index, "error", CPANEL.lang.json_error, CPANEL.lang.json_parse_failed);
                }
            },
            
            failure : function(o) {
                YAHOO.util.Dom.setStyle("change_password_input_" + index, "display", "block");
                YAHOO.util.Dom.get("change_password_status_" + index).innerHTML = '';
                toggle_action_div(null, { "id" : "change_password_module_" + index, "index" : index, "action" : "change_password" });
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
    //  YAHOO.util.Dom.setStyle(search_field, "color", "black");
    }
};

// search field blur
var search_input_blur = function() {
    var search_field = YAHOO.util.Dom.get("email_table_search_input");
    if (search_field.value == '') {
        // YAHOO.util.Dom.setStyle(search_field, "color", "#888888");
        search_field.value = LANG.search_email;
        YAHOO.util.Dom.setStyle("email_table_clear_search", "display", "none");
    }
};

// search email
var search_email = function() {
    // do not sort while a request is active
    if (TABLE_REQUEST_PENDING) return true; 
    
    var search_term = YAHOO.util.Dom.get("email_table_search_input").value;

    // this means that you can't search your email account for the phrase 'Search Email'
    if (search_term == LANG.search_email) search_term = '';

    // case 32016:: Do not do the same search again
    if (search_term == LAST_SEARCH_TXT) return true;
    LAST_SEARCH_TXT = search_term;

    API.api2_filter = 1;
    API.api2_filter_type = "contains";
    API.api2_filter_column = "email";
    API.api2_filter_term = search_term;
    
    // reset to page 1
    reset_pagination(); 

    update_email_accounts();
    
    // show the "clear search" button
    if (search_term != "") YAHOO.util.Dom.setStyle("email_table_clear_search", "display", "");
};

var clear_search = function() {
    YAHOO.util.Dom.get("email_table_search_input").value = "";
    search_input_blur();
    API.api2_filter = 1;
    API.api2_filter_type = "contains";
    API.api2_filter_column = "email";
    API.api2_filter_term = "";
    LAST_SEARCH_TXT = "";
    update_email_accounts();
};

// toggle sorting of table headers
var toggle_sort = function(e, o) {
    // do not sort while a request is active
    if (TABLE_REQUEST_PENDING) return true;

    // clear all sorting icons
    YAHOO.util.Dom.get("email_table_account_sort_img").innerHTML = '';
    YAHOO.util.Dom.get("email_table_domain_sort_img").innerHTML = '';
    YAHOO.util.Dom.get("email_table_usage_sort_img").innerHTML = '';
    YAHOO.util.Dom.get("email_table_quota_sort_img").innerHTML = '';
        YAHOO.util.Dom.get("email_table_percent_sort_img").innerHTML = '';
    
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
    }
    else {
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
    
    ADD_EMAIL_VALID.quota_number = new CPANEL.validate.validator(LANG.Quota);
    ADD_EMAIL_VALID.quota_number.add("quota_number_input", "positive_integer", LANG.email_quota_number, "quota_number");
    ADD_EMAIL_VALID.quota_number.add("quota_number_input", function() { return quota_over_2gigs("quota_number_input") }, LANG.email_quota_2gig, "quota_number");
    ADD_EMAIL_VALID.quota_number.attach();
    
    ADD_EMAIL_VALID.quota_unlimited = new CPANEL.validate.validator(LANG.Quota);
    ADD_EMAIL_VALID.quota_unlimited.add("quota_unlimited", "anything", "", "quota_unlimited");
    ADD_EMAIL_VALID.quota_unlimited.attach();
};

// custom validation function for the mailbox quota
var quota_over_2gigs = function(input_field) {
    var quota = YAHOO.util.Dom.get(input_field).value;
    if (CPANEL.validate.integer(quota) == true && quota > 2048) {
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

    if (! DEFAULT_QUOTA_SELECTED || DEFAULT_QUOTA_SELECTED == "userdefined") {
        YAHOO.util.Dom.get("quota_number").checked = true;
        YAHOO.util.Dom.get("quota_unlimited").checked = false;
    } else {
        YAHOO.util.Dom.get("quota_number").checked = false;
        YAHOO.util.Dom.get("quota_unlimited").checked = true;
    }
    // clear validation
    for (var i in ADD_EMAIL_VALID) {
           if ( ADD_EMAIL_VALID.hasOwnProperty(i) ) {
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
        cpanel_jsonapi_version : 2,
        cpanel_jsonapi_module  : "Email",
        cpanel_jsonapi_func    : "addpop",
        email    : email,
        password : password,
        quota    : quota,
        domain   : domain
    };
    
    // callback functions
    var callback = {
        success : function(o) {
            // reset the input form
            reset_add_account_form();
            
            // parse the JSON
            try {
                var data = YAHOO.lang.JSON.parse(o.responseText);
            }
            catch(e) {
                CPANEL.widgets.status_bar("add_email_status_bar", "error", CPANEL.lang.json_error, CPANEL.lang.json_parse_failed);
                return;
            }
            
            // success
            if (data.cpanelresult.data[0].result == 1) {
                var status = api2_call.email + "@" + api2_call.domain;
                CPANEL.widgets.status_bar("add_email_status_bar", "success", LANG.account_created, status);
                update_email_accounts();
                return;
            }
            
            // failure
            if (data.cpanelresult.data[0].result == 0) {
                CPANEL.widgets.status_bar("add_email_status_bar", "error", CPANEL.lang.Error, data.cpanelresult.data[0].reason);
                return;
            }
            
            // unknown
            CPANEL.widgets.status_bar("add_email_status_bar", "error", CPANEL.lang.Error, LANG.unknown_error);
        },
        
        failure : function(o) {
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
        success : function(o) {
            YAHOO.util.Dom.get("default_account_disk_used").innerHTML = o.responseText;
        },
        failure : function(o) { }
    };
    
    // send the AJAX request
    YAHOO.util.Connect.asyncRequest('GET', "default_account_disk_usage.html", callback, '');    
};

// page initialization
var init_mail = function() {


    // initialize the API variables
    API = {
        "cpanel_jsonapi_version" : 2,
        "cpanel_jsonapi_func" : "listpopswithdisk",
        "cpanel_jsonapi_module" : "Email",
        "api2_paginate" : 1,
        "api2_paginate_size" : 10,
        "api2_paginate_start" : 1,
        "api2_sort" : 1,
        "api2_sort_column" : "user",
        "api2_sort_method" : "alphabet",
        "api2_sort_reverse" : 0
    };

    // initialize the sort state to ascending order
    SORT_STATE = {
                percent : "asc",
        account : "asc",
        domain : "asc",
        usage : "asc",
        quota : "asc"
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
    YAHOO.util.Event.on("quota_unlimited", "click", function() { click_quota_unlimited("quota_number_input", ADD_EMAIL_VALID.quota_number, ADD_EMAIL_VALID.quota_unlimited) });
    YAHOO.util.Event.on(["quota_number", "quota_number_input"], "click", function() { click_quota_number("quota_number", "quota_number_input", ADD_EMAIL_VALID.quota_number, ADD_EMAIL_VALID.quota_unlimited) });
    CPANEL.util.catch_enter(["add_email_account", "add_email_password1", "add_email_password2", "quota_number_input"], "add_email_create");
    
    // search field and number of items in the table
    YAHOO.util.Event.on("email_table_items_per_page", "change", toggle_items_per_page);
    YAHOO.util.Event.on("email_table_search_input", "focus", search_input_focus);
    YAHOO.util.Event.on("email_table_search_input", "blur", search_input_blur);
    CPANEL.util.catch_enter("email_table_search_input", search_email);
    YAHOO.util.Event.on("email_table_search_button", "click", search_email);
    
    // table headers
    YAHOO.util.Event.on("email_table_account_sort", "click", toggle_sort, { header : "account" });
    YAHOO.util.Event.on("email_table_domain_sort", "click", toggle_sort, { header : "domain" });
    YAHOO.util.Event.on("email_table_usage_sort", "click", toggle_sort, { header : "usage" });
    YAHOO.util.Event.on("email_table_quota_sort", "click", toggle_sort, { header : "quota" });
        YAHOO.util.Event.on("email_table_percent_sort", "click", toggle_sort, {header: "percent" });

    // update the accounts object and build the email table
    update_email_accounts();
    
    grab_default_account_disk_used();
};
YAHOO.util.Event.onDOMReady(init_mail);
