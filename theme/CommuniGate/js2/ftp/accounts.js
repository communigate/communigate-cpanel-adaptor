var OPEN_MODULE;
var ACCOUNTS = [];
var PATH_POPUPS = [];
var FTP_PORT = 21;
var ADD_VALID = [];
var CHANGE_PASS_VALID = [];
var CHANGE_QUOTA_VALID = [];
var FTP_API2_CALL = {};
var TABLE_REQUEST_ACTIVE = false;
var LAST_SEARCH_TXT = "";

var init_add_validation = function() {
        var login_validate = function() {
           var value = document.getElementById('login').value;
           return /^[a-zA-Z_\-0-9]+$/.test(value);
        }
	ADD_VALID["login"] = new CPANEL.validate.validator(LANG.ftp_login);
	ADD_VALID["login"].add("login", login_validate, LANG.FTPUserAlpha);
	ADD_VALID["login"].add("login", "max_length(%input%, 25)", LANG.FTPMsgUser25Char);
	ADD_VALID["login"].attach();
	
	var password_validators = CPANEL.password.setup("password", "password2", "password_strength", REQUIRED_PASSWORD_STRENGTH, "create_strong_password", "why_strong_passwords_link", "why_strong_passwords_text");
	ADD_VALID["pass1"] = password_validators[0];
	ADD_VALID["pass2"] = password_validators[1];
	
	ADD_VALID["dir"] = new CPANEL.validate.validator(LANG.directory_path);
	ADD_VALID["dir"].add("homedir", "dir_path", LANG.validation_directory_paths);
	ADD_VALID["dir"].attach();
	
	if (SERVER_TYPE != "PRO") {
		ADD_VALID["quota_number"] = new CPANEL.validate.validator(LANG.quota);
		ADD_VALID["quota_number"].add("quota_value", "positive_integer", LANG.email_quota_number, "quota_number");
		ADD_VALID["quota_number"].attach();
		
		ADD_VALID["quota_unlimited"] = new CPANEL.validate.validator(LANG.quota);
		ADD_VALID["quota_unlimited"].add("quota_unlimited", "anything", "", "quota_unlimited");
		ADD_VALID["quota_unlimited"].attach();
	}

	CPANEL.validate.attach_to_form("ftp_create_submit", ADD_VALID, add_ftp_account);
	CPANEL.util.catch_enter(["login", "password", "password2", "homedir", "quota_value"], "ftp_create_submit");

    //Internet Explorer 8 complains if you try to focus an invisible element.
    try {
        YAHOO.util.Dom.get("login").focus();
    }
    catch(e) {
    }
};

var suggest_homedir = function() {
	YAHOO.util.Dom.get("homedir").value = "public_html/" + YAHOO.util.Dom.get("login").value;
	ADD_VALID["dir"].verify();	
};

var toggle_add_account_quota = function(select_number) {
	if (select_number == true) {
		YAHOO.util.Dom.get("quota_number").checked = true;
	}
	
	if (YAHOO.util.Dom.get("quota_number").checked == true) {
        YAHOO.util.Dom.setStyle("quota_value", "color", "black");
		ADD_VALID["quota_number"].verify();
		ADD_VALID["quota_unlimited"].clear_messages();		
	}
	else {
        YAHOO.util.Dom.setStyle("quota_value", "color", "#888888");
		ADD_VALID["quota_number"].clear_messages();
		ADD_VALID["quota_unlimited"].verify();
	}
};

var load_accounts_table = function() {
	// callback functions
	var callback = {
		success : function(o) {
			try {
				var data = YAHOO.lang.JSON.parse(o.responseText);

				if (data.cpanelresult.data) {
					build_accounts_table(data.cpanelresult.data, data.cpanelresult.paginate);
				}
				else {
					YAHOO.util.Dom.get("accounts_div").innerHTML = '<div style="padding: 20px">' + CPANEL.icons.error + ' ' + LANG.unknown_error + '</div>';
				}
			}
			catch(e) {
				YAHOO.util.Dom.get("accounts_div").innerHTML = '<div style="padding: 20px">' + CPANEL.icons.error + ' ' + CPANEL.lang.json_parse_failed + '</div>';
			}
			TABLE_REQUEST_ACTIVE = false;
		},
		
		failure : function(o) {
			YAHOO.util.Dom.get("accounts_div").innerHTML = '<div style="padding: 20px">' + CPANEL.icons.error + ' ' + CPANEL.lang.ajax_error + ': ' + CPANEL.lang.ajax_try_again + '</div>';
			TABLE_REQUEST_ACTIVE = false;
		}
	};
	
	// send the AJAX request
	TABLE_REQUEST_ACTIVE = true;
	YAHOO.util.Connect.asyncRequest('GET', CPANEL.urls.json_api(FTP_API2_CALL), callback, '');

	close_all_path_popups();
	var div_region = YAHOO.util.Region.getRegion(YAHOO.util.Dom.get("accounts_div"));
	if (div_region.height > 0) {
		YAHOO.util.Dom.get("accounts_div").innerHTML = '<div style="height: ' + div_region.height + 'px"><div style="padding: 20px">' + CPANEL.icons.ajax + ' ' + CPANEL.lang.ajax_loading + '</div></div>';	
	}
	else {
		YAHOO.util.Dom.get("accounts_div").innerHTML = '<div style="padding: 20px">' + CPANEL.icons.ajax + ' ' + CPANEL.lang.ajax_loading + '</div>';	
	}
};

var load_special_accounts_table = function() {
	// build the call
	var api2_call = {
		"cpanel_jsonapi_version" : 2,
		"cpanel_jsonapi_module" : "Ftp",
		"cpanel_jsonapi_func" : "listftpwithdisk",
		"include_acct_types" : "anonymous|logaccess|main",
		"api2_sort" : 1,
		"api2_sort_column" : "serverlogin",
		"api2_sort_method" : "alphabet",
		"api2_sort_reverse" : 0
	};
	
	var callback = {
		success : function(o) {
			try {
				var data = YAHOO.lang.JSON.parse(o.responseText);
				if (data.cpanelresult.data) {
					build_special_accounts_table(data.cpanelresult.data);
				}
				else {
					YAHOO.util.Dom.get("special_accounts_div").innerHTML = '<div style="padding: 20px">' + CPANEL.icons.error + ' ' + LANG.unknown_error + '</div>';
				}
			}
			catch(e) {
				YAHOO.util.Dom.get("special_accounts_div").innerHTML = '<div style="padding: 20px">' + CPANEL.icons.error + ' ' + CPANEL.lang.json_parse_failed + '</div>';
			}
		},
		
		failure : function(o) {
			YAHOO.util.Dom.get("special_accounts_div").innerHTML = '<div style="padding: 20px">' + CPANEL.icons.error + ' ' + CPANEL.lang.ajax_error + ': ' + CPANEL.lang.ajax_try_again + '</div>';
		}
	};
	
	// send the AJAX request
	YAHOO.util.Connect.asyncRequest('GET', CPANEL.urls.json_api(api2_call), callback, '');

	YAHOO.util.Dom.get("special_accounts_div").innerHTML = '<div style="padding: 20px">' + CPANEL.icons.ajax + ' ' + CPANEL.lang.ajax_loading + '</div>';
};

var build_accounts_table = function(accounts, paginate) {
	var html = '<table id="accounts_table" class="dynamic_table" cellspacing="0" cellpadding="0">';
	var row = '';
	var zebra = "A";
	
	var accounts_length = accounts.length;
	if (accounts_length == 0) {
		html += '<tr><td style="text-align: center; width: 100%; padding: 20px;">';
		html += LANG.no_accounts_found;
		html += '</td></tr></table>';
		YAHOO.util.Dom.get("accounts_div").innerHTML = html;
		return;
	}
	
	for (var i=0; i < accounts_length; i++) {
		// convert humandiskquota to MB or infinity symbol
		if (accounts[i].diskquota == 0 || accounts[i].diskquota == LANG.unlimited) {
			accounts[i].diskquota = 0;
			accounts[i].humandiskquota = "&infin;";
		}
		else {
			accounts[i].humandiskquota = accounts[i].diskquota;
		}
		
		// convert usage to integer
		accounts[i].diskused = parseInt(accounts[i].diskused);
		
		if (SERVER_TYPE == "PURE") {
			row  = '<tr id="account_row_[% i %]" class="dt_info_row row[% zebra %]">';
                row += '<td class="col1" style="padding-left: 5px">[% serverlogin %]<input type="hidden" id="login_[% i %]" value="[% login %]" /></td>';
				row += '<td class="col2" style="text-align: left">[% path %]</td>';
				row += '<td class="col3">[% diskused %] / <span id="humandiskquota_[% i %]">[% humandiskquota %]</span> <span class="megabyte_font">MB</span><input type="hidden" id="diskused_[% i %]" value="[% diskused %]" /><input type="hidden" id="diskquota_[% i %]" value="[% diskquota %]" /><br /><div style="height: 3px"></div><div id="usage_bar_[% i %]" class="table_progress_bar"></div></td>';
				row += '<td class="col4">';
					row += '<table cellspacing="0" cellpadding="0" width="100%"><tr>';
						row += '<td width="25%"><span class="action_link" onclick="toggle_module(\'changepassword_module_[% i %]\')">' + LANG.change_br_password + '</span></td>';
						row += '<td width="25%"><span class="action_link" onclick="toggle_module(\'changequota_module_[% i %]\')">' + LANG.change_br_quota + '</span></td>';
						row += '<td width="25%"><span class="action_link" onclick="toggle_module(\'delete_module_[% i %]\')">' + LANG.Delete + '</span></td>';
						row += '<td width="25%"><span class="action_link" onclick="toggle_module(\'config_module_[% i %]\')">' + LANG.configure_ftp_client + '</span></td>';
					row += '</tr></table>';
				row += '</td>';
			row += '</tr>';
			
			row += '<tr><td colspan="4">';
			row += build_changepassword_module();
			row += build_changequota_module();
			row += build_delete_module();
			row += build_config_module();
			row += '<div id="status_bar_[% i %]" class="cjt_status_bar"></div>';
			row += '</td></tr>';
		}
		else {
			row  = '<tr id="account_row_[% i %]" class="dt_info_row row[% zebra %]">';
				row += '<td class="pro_col1" style="text-align: center">[% serverlogin %]<input type="hidden" id="login_[% i %]" value="[% login %]" /></td>';
				row += '<td class="pro_col2" style="text-align: center">[% path %]</td>';
				row += '<td class="pro_col3">';
					row += '<table cellspacing="0" cellpadding="0" width="100%"><tr>';
						row += '<td width="33%"><span class="action_link" onclick="toggle_module(\'changepassword_module_[% i %]\')">' + LANG.change_br_password + '</span></td>';
						row += '<td width="33%"><span class="action_link" onclick="toggle_module(\'delete_module_[% i %]\')">' + LANG.Delete + '</span></td>';
						row += '<td width="33%"><span class="action_link" onclick="toggle_module(\'config_module_[% i %]\')">' + LANG.configure_ftp_client + '</span></td>';
					row += '</tr></table>';
				row += '</td>';
			row += '</tr>';
			
			row += '<tr><td colspan="3">';
			row += build_changepassword_module();
			row += build_delete_module();
			row += build_config_module();
			row += '<div id="status_bar_[% i %]" class="cjt_status_bar"></div>';
			row += '</td></tr>';		
		}
		
		// TODO: replace this using YAHOO.lang.substitute
		row = row.replace(/\[% i %\]/g, i);
		row = row.replace(/\[% zebra %\]/g, zebra);
		row = row.replace(/\[% login %\]/g, accounts[i].login);
		row = row.replace(/\[% serverlogin %\]/g, accounts[i].serverlogin);
		row = row.replace(/\[% path %\]/g, format_path(accounts[i].dir));
		row = row.replace(/\[% special_path %\]/g, format_path(accounts[i].dir, "delete_account2_" + i, i));
		row = row.replace(/\[% diskused %\]/g, accounts[i].diskused);
		row = row.replace(/\[% humandiskquota %\]/g, accounts[i].humandiskquota);
		row = row.replace(/\[% diskquota %\]/g, accounts[i].diskquota);
		row = row.replace(/\[% url.acct %\]/g, encodeURIComponent(accounts[i].login));
		row = row.replace(/\[% url.accttype %\]/g, encodeURIComponent(accounts[i].accttype));
		row = row.replace(/\[% ftp_port %\]/g, FTP_PORT);
		row = row.replace(/\[% sftp_port %\]/g, SFTP_PORT);
		row = row.replace(/\[% ftp_server %\]/g, FTP_SERVER);
		row = row.replace(/\[% url.dns %\]/g, encodeURIComponent(DNS));
		html += row;
		
		// toggle row colors
		(zebra == "A") ? zebra = "B" : zebra = "A";
	}
	html += '</table>';
	
	html += add_pagination(paginate);
	
	YAHOO.util.Dom.get("accounts_div").innerHTML = html;
	
	if (SERVER_TYPE == "PURE") {
		for (var i = 0; i < accounts_length; i++) {
			show_usage_bar("usage_bar_" + i, accounts[i].diskused, accounts[i].diskquota);
		}
	}
};

var add_pagination = function(paginate) {
	// turn pagination data into integers just in case
	for (var i in paginate) 
           {if (paginate.hasOwnProperty(i)) {paginate[i] = parseInt(paginate[i]);} }
	
	// do not paginate if there is only one page
	if (paginate.total_pages == 1) return '';
	
	var ellipsis1 = 0;
	var ellipsis2 = 0;
	
	var html = '<div id="pagination_pages">';
	for (var i = 1; i <= paginate.total_pages; i++) {
		// bold the current page
		if (i == paginate.current_page) {
			html += ' <span class="paginate_current_page">' + i + '</span> ';
		}
		// always show page 1 and the last page
		else if (i == 1 || i == paginate.total_pages) {
			html += ' <span onclick="change_page(' + i + ')" class="paginate_page">' + i + '</span> ';
		}
		// show ellipsis for any pages less than 3 away
		else if (i < paginate.current_page - 2) {
			if (ellipsis1 == 0) {
				html += '...';
				ellipsis1 = 1;
			}
		}
		// show ellipsis for any pages more than 3 away
		else if (i > paginate.current_page + 2) {
			if (ellipsis2 == 0) {
				html += '...';
				ellipsis2 = 1;
			}
		}
		else {
			html += ' <span onclick="change_page(' + i + ')" class="paginate_page">' + i + '</span> ';
		}
	}	
	html += '</div>';
	
	html += '<div id="pagination_links">';
	if (paginate.current_page != 1) {
		var prev_page = paginate.current_page - 1;
		html += '<span onclick="change_page(' + prev_page + ')" class="paginate_prev">&larr; ' + LANG.paginate_prev + '</span> ';
	}
	if (paginate.current_page != paginate.total_pages) {
		var next_page = paginate.current_page + 1;
		html += ' <span onclick="change_page(' + next_page + ')" class="paginate_next">' + LANG.paginate_next + ' &rarr;</span>';
	}
	html += '</div>';
	
	return html;
};

var build_special_accounts_table = function(accounts) {
	var special_panels1 = [];
	var special_panels2 = [];
	YAHOO.util.Dom.get("list_of_anonymous_account_ids").value = '';
	var html = '<table id="special_accounts_table" class="dynamic_table" cellspacing="0" cellpadding="0">';
	var row = '';
	var zebra = "A";
	
	for (var i=0; i < accounts.length; i++) {
		// convert humandiskquota to MB or infinity symbol
		if (accounts[i].diskquota == 0 || accounts[i].diskquota == LANG.unlimited) {
			accounts[i].diskquota = 0;
			accounts[i].humandiskquota = "&infin;";
		}
		else {
			accounts[i].humandiskquota = accounts[i].diskquota;
		}
		
		// convert usage to integer
		accounts[i].diskused = parseInt(accounts[i].diskused);		
		
		if (SERVER_TYPE == "PURE") {
			row  = '<tr class="dt_info_row row[% zebra %]">';
				if (accounts[i].accttype == "main") {
					row += '<td class="special_col1"><img src="[% main_icon %]" style="cursor: pointer" alt="" id="special_image_[% i %]" /></td>';
					special_panels1.push("special_image_special" + i);
					special_panels2.push("special_main_description");
				}
				if (accounts[i].accttype == "anonymous") {
					row += '<td class="special_col1"><img src="[% anon_icon %]" style="cursor: pointer" alt="" id="special_image_[% i %]" /></td>';
					special_panels1.push("special_image_special" + i);
					special_panels2.push("special_anon_description");
					YAHOO.util.Dom.get("list_of_anonymous_account_ids").value += "special" + i + "|";
				}
				if (accounts[i].accttype == "logaccess") {
					row += '<td class="special_col1"><img src="[% log_icon %]" style="cursor: pointer" alt="" id="special_image_[% i %]" /></td>';
					special_panels1.push("special_image_special" + i);
					special_panels2.push("special_log_description");
				}
				row += '<td class="special_col2" style="text-align: left; padding-left: 5px">[% serverlogin %]<input type="hidden" id="login_[% i %]" value="[% login %]" /></td>';
				row += '<td class="special_col3" style="text-align: left">[% path %]</td>';
				row += '<td class="special_col4">[% diskused %] / <span id="humandiskquota_[% i %]">[% humandiskquota %]</span> <span class="megabyte_font">MB</span><input type="hidden" id="diskused_[% i %]" value="[% diskused %]" /><input type="hidden" id="diskquota_[% i %]" value="[% diskquota %]" /><br /><div style="height: 3px"></div><div id="usage_bar_[% i %]" class="table_progress_bar"></div></td>';
				row += '<td class="special_col5">';
					row += '<table cellspacing="0" cellpadding="0" width="100%"><tr>';
					if (accounts[i].accttype == "main") {
						row += '<td width="50%">' + LANG.not_applicable + '</td>';
						row += '<td width="50%"><span class="action_link" onclick="toggle_module(\'config_module_[% i %]\')">' + LANG.configure_ftp_client + '</span></td>';
					}
					if (accounts[i].accttype == "anonymous") {
						row += '<td width="50%"><span class="action_link" onclick="toggle_module(\'changequota_module_[% i %]\')">' + LANG.change_br_quota + '</span></td>';
						row += '<td width="50%"><span class="action_link" onclick="toggle_module(\'config_module_[% i %]\')">' + LANG.configure_ftp_client + '</span></td>';
					}
					if (accounts[i].accttype == "logaccess") {
						row += '<td width="50%">' + LANG.not_applicable + '</td>';
						row += '<td width="50%"><span class="action_link" onclick="toggle_module(\'config_module_[% i %]\')">' + LANG.configure_ftp_client + '</span></td>';
					}
					row += '</tr></table>';
				row += '</td>';
			row += '</tr>';
			
			row += '<tr><td colspan="5">';
			//row += build_configureanon_module();
			row += build_changequota_module(true);
			row += build_config_module();
			row += '<div id="status_bar_[% i %]" class="cjt_status_bar"></div>';
			row += '</td></tr>';
		}
		else {
			row  = '<tr class="dt_info_row row[% zebra %]">';
				if (accounts[i].accttype == "main") {
					row += '<td class="pro_special_col1"><img src="[% main_icon %]" style="cursor: pointer" alt="" id="special_image_[% i %]" /></td>';
					special_panels1.push("special_image_special" + i);
					special_panels2.push("special_main_description");
				}
				if (accounts[i].accttype == "anonymous") {
					row += '<td class="pro_special_col1"><img src="[% anon_icon %]" style="cursor: pointer" alt="" id="special_image_[% i %]" /></td>';
					special_panels1.push("special_image_special" + i);
					special_panels2.push("special_anon_description");
				}
				if (accounts[i].accttype == "logaccess") {
					row += '<td class="pro_special_col1"><img src="[% log_icon %]" style="cursor: pointer" alt="" id="special_image_[% i %]" /></td>';
					special_panels1.push("special_image_special" + i);
					special_panels2.push("special_log_description");
				}
				row += '<td class="pro_special_col2" style="text-align: center">[% serverlogin %]<input type="hidden" id="login_[% i %]" value="[% login %]" /></td>';
				row += '<td class="pro_special_col3" style="text-align: center">[% path %]</td>';
				row += '<td class="pro_special_col4" style="text-align: center">';
					row += '<span class="action_link" onclick="toggle_module(\'config_module_[% i %]\')">' + LANG.configure_ftp_client + '</span>';
				row += '</td>';
			row += '</tr>';
			
			row += '<tr><td colspan="4">';
			row += build_changepassword_module();
			row += build_config_module();
			row += '<div id="status_bar_[% i %]" class="cjt_status_bar"></div>';
			row += '</td></tr>';
		}
		
		// TODO: replace this using YAHOO.lang.substitute
		row = row.replace(/\[% i %\]/g, "special" + i);
		row = row.replace(/\[% zebra %\]/g, zebra);
		row = row.replace(/\[% type %\]/g, accounts[i].accttype);
		row = row.replace(/\[% login %\]/g, accounts[i].login);
		row = row.replace(/\[% serverlogin %\]/g, accounts[i].serverlogin);
		row = row.replace(/\[% path %\]/g, format_path(accounts[i].dir));
		row = row.replace(/\[% diskused %\]/g, accounts[i].diskused);
		row = row.replace(/\[% humandiskquota %\]/g, accounts[i].humandiskquota);
		row = row.replace(/\[% diskquota %\]/g, accounts[i].diskquota);
		row = row.replace(/\[% url.acct %\]/g, encodeURIComponent(accounts[i].login));
		row = row.replace(/\[% url.accttype %\]/g, encodeURIComponent(accounts[i].accttype));
		row = row.replace(/\[% main_icon %\]/g, MAIN_ICON);
		row = row.replace(/\[% anon_icon %\]/g, ANON_ICON);
		row = row.replace(/\[% log_icon %\]/g, LOG_ICON);
		row = row.replace(/\[% ftp_port %\]/g, FTP_PORT);
		row = row.replace(/\[% sftp_port %\]/g, SFTP_PORT);
		row = row.replace(/\[% ftp_server %\]/g, FTP_SERVER);
		row = row.replace(/\[% url.dns %\]/g, encodeURIComponent(DNS));
		html += row;
		
		// toggle row colors
		(zebra == "A") ? zebra = "B" : zebra = "A";
	}
	
	html += '</table>';
	YAHOO.util.Dom.get("special_accounts_div").innerHTML = html;
	
	// create the help panels
	if (special_panels1.length > 0) {
		for (var i = 0; i < special_panels2.length; i++) {
			CPANEL.panels.create_help(special_panels1[i], special_panels2[i]);
		}
	}
	
	// build the progress bars
	if (SERVER_TYPE == "PURE") {
		for (var i = 0; i < accounts.length; i++) {
			show_usage_bar("usage_bar_special" + i, accounts[i].diskused, accounts[i].diskquota);
		}
	}
};

var build_changepassword_module = function() {
	var html = '<div id="changepassword_module_[% i %]" class="dt_module" style="display: none">';
	html += '<table cellspacing="0" cellpadding="3" width="500px" style="margin: 0px auto">';
		html += '<tr>';
			html += '<td width="33%" align="right">' + LANG.Password + ':</td>';
			html += '<td width="33%"><input id="change_password_1_[% i %]" type="password" style="width: 150px" /></td>';
			html += '<td width="33%"><span id="change_password_1_[% i %]_error"></span></td>';
		html += '</tr>';
		html += '<tr>';
			html += '<td width="33%" align="right">' + LANG.Password_again + ':</td>';
			html += '<td width="33%"><input id="change_password_2_[% i %]" type="password" style="width: 150px" /></td>';
			html += '<td width="33%"><span id="change_password_2_[% i %]_error"></span></td>';
		html += '</tr>';
		html += '<tr>';
			html += '<td width="33%" align="right">' + LANG.Strength + ':</td>';
			html += '<td width="33%"><div id="password_strength_[% i %]" class="password_strength"></div></td>';
			html += '<td width="33%"><input type="button" value="' + LANG.Password_Generator + '" id="password_generator_[% i %]" class="input-button" /></td>';
		html += '</tr>';
		html += '<tr>';
			html += '<td colspan="3" align="center">';
			html += '<div style="height: 8px"></div>';
			html += '<div id="change_password_input_[% i %]"><span class="action_link" onclick="toggle_module(\'changepassword_module_[% i %]\')">' + CPANEL.lang.cancel + '</span> ' + CPANEL.lang.or + ' <input type="button" value="' + LANG.Change_Password + '" class="input-button" id="change_password_[% i %]" /></div>';
			html += '<div id="change_password_status_[% i %]"></div>';
			html += '</td>';
		html += '</tr>';		
	html += '</table>';
	html += '</div>';

	return html;
};

var build_changequota_module = function(special) {
	var html = '<div id="changequota_module_[% i %]" class="dt_module" style="display: none">';
	html += '<table cellspacing="0" cellpadding="3" style="width: 500px; margin: 0px auto;">';
		html += '<tr>';
			html += '<td valign="middle" align="right" width="45%">' + LANG.FTP_Quota + ':</td>';
			html += '<td valign="middle" width="55%">';
				html += '<input type="radio" name="change_quota_[% i %]" id="change_quota_radio_number_[% i %]" onclick="toggle_quota_input(\'number\', \'[% i %]\', true)" /> <input type="text" size="5" maxlength="5" value="" id="change_quota_number_input_[% i %]" onfocus="toggle_quota_input(\'number\', \'[% i %]\', true)" /> <span class="megabyte_font">MB</span> <span id="change_quota_number_input_[% i %]_error"></span><br />';
				html += '<label><input type="radio" name="change_quota_[% i %]" id="change_quota_radio_unlimited_[% i %]" onclick="toggle_quota_input(\'unlimited\', \'[% i %]\', true)" /> ' + LANG.Unlimited + '</label> <span id="change_quota_radio_unlimited_[% i %]_error"></span>';
			html += '</td>';
		html += '</tr>';
		html += '<tr>';
			html += '<td colspan="2" align="center">';
				html += '<div style="height: 8px"></div>';
				html += '<div id="change_quota_input_[% i %]"><span class="action_link" onclick="toggle_module(\'changequota_module_[% i %]\')">' + CPANEL.lang.cancel + '</span> ' + CPANEL.lang.or + ' <input type="button" value="' + LANG.Change_Quota + '" id="change_quota_button_[% i %]" class="input-button" /></div>';
				html += '<div id="change_quota_status_[% i %]"></div>';
				if (special == true) {
					html += '<div style="height: 10px"></div><em>' + LANG.anon_quotas_share + '</em>';
				}
			html += '</td>';
		html += '</tr>';
	html += '</table>';
	html += '</div>';
	return html;
};

var build_delete_module = function() {
	var html = '<div id="delete_module_[% i %]" class="dt_module" style="display: none; text-align: center">';
	html += '<table cellspacing="0" cellpadding="0" width="580px" style="margin: 0px auto" border="0">';
		html += '<tr>';
			html += '<td width="45%">' + LANG.Delete_account + ' [% login %]?</td>';
			html += '<td width="10%" rowspan="2"><center><div style="width: 1px; height: 45px; border-left: 1px solid #666">&nbsp;</div></center></td>';
			html += '<td width="45%">' + LANG.Delete_account + ' [% login %]<br />' + LANG.delete_all_files_under + '<br />[% special_path %] ?</td>';
		html += '</tr>';
		html += '<tr>';
			html += '<td><br /></td>';
			html += '<td></td>';
		html += '</tr>';
		html += '<tr>';
			html += '<td><input type="button" value="' + LANG.Delete_Account + '" id="delete_account_[% i %]" onclick="delete_account([% i %])" /><div id="delete_account_status_[% i %]"></div></td>';
			html += '<td><span class="action_link" id="cancel_delete_[% i %]" onclick="toggle_module(\'delete_module_[% i %]\')">' + CPANEL.lang.cancel + '</span></td>';
			html += '<td><input type="button" value="' + LANG.Delete_Account_and_Files + '" id="delete_account2_[% i %]" onclick="delete_account([% i %], true)" /><div id="delete_account2_status_[% i %]"></div></td>';
		html += '</tr>';
	html += '</table>';
	html += '</div>';
	return html;
};

var build_config_module = function() {
	var html = '<div id="config_module_[% i %]" class="dt_module" style="display: none; text-align: center">';
	html += '<table cellspacing="0" cellpadding="0" width="580px" border="0" style="margin: 0px auto">';
		html += '<tr>';
			html += '<td colspan="3" align="left">' + LANG.Manual_Settings + '<hr /></td>';
		html += '</tr>';		
		html += '<tr>';
			html += '<td colspan="3" align="left" style="padding-left: 25px">';
				html += LANG.FTP_Username + ': <strong>[% serverlogin %]</strong><br />';
				html += LANG.FTP_Server + ': <strong>[% ftp_server %]</strong><br />';
				html += LANG.FTP_Server_Port + ': <strong>[% ftp_port %]</strong><br />';
				html += LANG.SFTP_Server_Port + ': <strong>[% sftp_port %]</strong><br />';
			html += '</td>';
		html += '</tr>';
		html += '<tr><td colspan="3"><br /></td></tr>';
		html += '<tr>';
			html += '<td colspan="3" align="left">' + LANG.Configuration_Files + '<hr /></td>';
		html += '</tr>';
		html += '<tr>';
			html += '<td width="33%"><img src="../images/filezilla.gif" alt="FileZilla Logo" style="width: 32px; height: 32px" /><br />Filezilla<br /><em style="font-size: 9px">' + LANG.for_Windows + '</em></td>';
			html += '<td width="33%"><img src="../images/coreftp.gif" alt="CoreFTP Logo" style="width: 32px; height: 13px" /><br />Core FTP<br /><em style="font-size: 9px">' + LANG.for_Windows + '</em></td>';
			html += '<td width="33%"><img src="../images/cyberduck.png" alt="Cyberduck Logo" style="width: 32px; height: 32px" /><br />Cyberduck<br /><em style="font-size: 9px">' + LANG.for_Mac + '</em></td>';
		html += '</tr>';
		html += '<tr><td colspan="3"><br /></td></tr>';
		html += '<tr>';
		if (DEDICATED_IP == true) {
			html += '<td width="33%">';
				html += '<a href="' + CPANEL.security_token + '/backend/filezillasetup.cgi?[% url.acct %]@[% url.dns %]|ftp.[% url.dns %]|[% url.acct %]|0">' + LANG.FTP_Configuration_File + '</a><br />';
				html += '<a href="' + CPANEL.security_token + '/backend/filezillasetup.cgi?[% url.acct %]@[% url.dns %]|ftp.[% url.dns %]|[% url.acct %]|1">' + LANG.SFTP_Configuration_File + '</a><br />';
				html += '<a target="_blank" href="instructions/filezilla.html?acct=[% url.acct %]">' + LANG.Instructions_new_window + '</a>';
			html += '</td>';
			html += '<td width="33%">';
				html += '<a href="' + CPANEL.security_token + '/backend/coreftpsetup.cgi?[% url.acct %]@[% url.dns %]|ftp.[% url.dns %]|[% url.acct %]|0">' + LANG.FTP_Configuration_File + '</a><br />';
				html += '<a href="' + CPANEL.security_token + '/backend/coreftpsetup.cgi?[% url.acct %]@[% url.dns %]|ftp.[% url.dns %]|[% url.acct %]|1">' + LANG.SFTP_Configuration_File + '</a><br />';
				html += '<a target="_blank" href="instructions/coreftp.html?acct=[% url.acct %]">' + LANG.Instructions_new_window + '</a>';
			html += '</td>';
			html += '<td width="33%">';
				html += '<a href="' + CPANEL.security_token + '/backend/cyberducksetup.cgi?[% url.acct %]@[% url.dns %]|ftp.[% url.dns %]|[% url.acct %]|0">' + LANG.FTP_Configuration_File + '</a><br />';
				html += '<a href="' + CPANEL.security_token + '/backend/cyberducksetup.cgi?[% url.acct %]@[% url.dns %]|ftp.[% url.dns %]|[% url.acct %]|1">' + LANG.SFTP_Configuration_File + '</a><br />';
				html += '<a target="_blank" href="instructions/cyberduck.html?acct=[% url.acct %]">' + LANG.Instructions_new_window + '</a>';
			html += '</td>';
		}
		else {
			html += '<td width="33%">';
				html += '<a href="' + CPANEL.security_token + '/backend/filezillasetup.cgi?[% url.acct %]@[% url.dns %]|ftp.[% url.dns %]|[% url.acct %]@[% url.dns %]|0">' + LANG.FTP_Configuration_File + '</a><br />';
				html += '<a href="' + CPANEL.security_token + '/backend/filezillasetup.cgi?[% url.acct %]@[% url.dns %]|ftp.[% url.dns %]|[% url.acct %]@[% url.dns %]|1">' + LANG.SFTP_Configuration_File + '</a><br />';
				html += '<a target="_blank" href="instructions/filezilla.html?acct=[% url.acct %]">' + LANG.Instructions_new_window + '</a>';
			html += '</td>';
			html += '<td width="33%">';
				html += '<a href="' + CPANEL.security_token + '/backend/coreftpsetup.cgi?[% url.acct %]@[% url.dns %]|ftp.[% url.dns %]|[% url.acct %]@[% url.dns %]|0">' + LANG.FTP_Configuration_File + '</a><br />';
				html += '<a href="' + CPANEL.security_token + '/backend/coreftpsetup.cgi?[% url.acct %]@[% url.dns %]|ftp.[% url.dns %]|[% url.acct %]@[% url.dns %]|1">' + LANG.SFTP_Configuration_File + '</a><br />';
				html += '<a target="_blank" href="instructions/coreftp.html?acct=[% url.acct %]">' + LANG.Instructions_new_window + '</a>';
			html += '</td>';
			html += '<td width="33%">';
				html += '<a href="' + CPANEL.security_token + '/backend/cyberducksetup.cgi?[% url.acct %]@[% url.dns %]|ftp.[% url.dns %]|[% url.acct %]@[% url.dns %]|0">' + LANG.FTP_Configuration_File + '</a><br />';
				html += '<a href="' + CPANEL.security_token + '/backend/cyberducksetup.cgi?[% url.acct %]@[% url.dns %]|ftp.[% url.dns %]|[% url.acct %]@[% url.dns %]|1">' + LANG.SFTP_Configuration_File + '</a><br />';
				html += '<a target="_blank" href="instructions/cyberduck.html?acct=[% url.acct %]">' + LANG.Instructions_new_window + '</a>';
			html += '</td>';
		}
		html += '</tr>';
		html += '<tr>';
			html += '<td colspan="3"><br /><span class="action_link" onclick="toggle_module(\'config_module_[% i %]\')">' + CPANEL.lang.cancel + '</span></td>';
		html += '</tr>';		
	html += '</table>';
	html += '</div>';
	return html;
};

/*
var build_configureanon_module = function() {
	var html = '<div id="configureanon_module_[% i %]" class="dt_module" style="display: none; text-align: center">';
	html += '<label><input type="checkbox" onclick="$(\'#configure_anonymous_ftp_settings_[% i %]\').slideToggle();" /> Enable anonymous FTP access to /home/chriso/public_ftp</label><br /><br />';
	html += '<div style="display: none" id="configure_anonymous_ftp_settings_[% i %]">';
	html += 	'<label><input type="checkbox"> Allow uploads to /home/chriso/public_ftp/incoming</label><br /><br />';
	html +=		'Anonymous FTP server welcome message:<br />';
	html +=		'<textarea rows="6" cols="35"></textarea><br /><br />';
	html += '</div>';
	html += '<span class="action_link">cancel</span> or <input type="button" value="Save Changes" class="input-button" />';
	html += '<div style="height: 8px"></div><em>Note: these settings affect all anonymous FTP accounts.</em>';
	html += '</div>';
	return html;
};
*/

var toggle_module = function(id) {
	// close OPEN_MODULE if it's open
	if (OPEN_MODULE !== id && YAHOO.util.Dom.getStyle(OPEN_MODULE, "display") == "block") {
		var currently_open_div = OPEN_MODULE;
		before_hide_module(currently_open_div);
		CPANEL.animate.slide_up(currently_open_div, function() { after_hide_module(currently_open_div) });
	}
	
	// if id is currently displayed, hide it
	if (YAHOO.util.Dom.getStyle(id, "display") != 'none') {
		before_hide_module(id);
		CPANEL.animate.slide_up(id, function() { after_hide_module(id) });
	}
	// else show id and set it as the OPEN_MODULE
	else {
		before_show_module(id);
        CPANEL.animate.slide_down(id, function() { after_show_module(id) });
		OPEN_MODULE = id;
	}
};

var before_show_module = function(id) {
	var temp = id.split("_");
	var action = temp[0];
	var index = temp[2];
	
	if (action == "changepassword") {
		CHANGE_PASS_VALID = CPANEL.password.setup("change_password_1_" + index, "change_password_2_" + index, "password_strength_" + index, REQUIRED_PASSWORD_STRENGTH, "password_generator_" + index);
		CPANEL.validate.attach_to_form("change_password_" + index, CHANGE_PASS_VALID, function() { change_password(index); });
	}
	if (action == "changequota") {
		CHANGE_QUOTA_VALID["number"] = new CPANEL.validate.validator(LANG.quota);
		CHANGE_QUOTA_VALID["number"].add("change_quota_number_input_" + index, "positive_integer", LANG.quota_positive_integer, "change_quota_radio_number_" + index);
		CHANGE_QUOTA_VALID["number"].attach();
		
		CHANGE_QUOTA_VALID["unlimited"] = new CPANEL.validate.validator(LANG.quota);
		CHANGE_QUOTA_VALID["unlimited"].add("change_quota_radio_unlimited_" + index, "anything", "", "change_quota_radio_unlimited_" + index);
		CHANGE_QUOTA_VALID["unlimited"].attach();
		
		CPANEL.validate.attach_to_form("change_quota_button_" + index, CHANGE_QUOTA_VALID, function() { change_quota(index); });
		
		var quota = YAHOO.util.Dom.get("diskquota_" + index).value;
		if (CPANEL.validate.integer(quota) == true && quota != 0) {
			YAHOO.util.Dom.get("change_quota_number_input_" + index).value = quota;
			toggle_quota_input("number", index);
		}
		else {
			YAHOO.util.Dom.get("change_quota_number_input_" + index).value = 2000;
			toggle_quota_input("unlimited", index);
		}
	}
	if (action == "delete") {
		
	}
	if (action == "config") {
		
	}
};

var before_hide_module = function(id) {
	var temp = id.split("_");
	var action = temp[0];
	var index = temp[2];
	
	if (action == "changepassword") {
		CHANGE_PASS_VALID[0].clear_messages();
		CHANGE_PASS_VALID[1].clear_messages();
		YAHOO.util.Event.purgeElement("changepassword_module_" + index, true);
	}
	if (action == "changequota") {
		CHANGE_QUOTA_VALID["number"].clear_messages();
		CHANGE_QUOTA_VALID["unlimited"].clear_messages();
		YAHOO.util.Event.purgeElement("changequota_module_" + index, true);
	}
	if (action == "delete") {
		// hide the path popup
		var path_popup_id = YAHOO.util.Dom.get("delete_module_path_popup_uid_" + index).value;
		if (PATH_POPUPS[path_popup_id]) {
			PATH_POPUPS[path_popup_id].hide();
		}
	}
	if (action == "config") {
		
	}
};

var after_show_module = function(id) {
	var temp = id.split("_");
	var action = temp[0];
	var index = temp[2];
	
	if (action == "changepassword") {
		YAHOO.util.Dom.get("change_password_1_" + index).focus();
		CPANEL.util.catch_enter(["change_password_1_" + index, "change_password_2_" + index], "change_password_" + index);
	}
	if (action == "changequota") {
		CPANEL.util.catch_enter("change_quota_number_input_" + index, "change_quota_button_" + index);
	}
	if (action == "delete") {
		
	}
	if (action == "config") {
		
	}
	CPANEL.align_panels_event.fire();
};

var after_hide_module = function(id) {
	var temp = id.split("_");
	var action = temp[0];
	var index = temp[2];
	
	if (action == "changepassword") {
		YAHOO.util.Dom.get("change_password_1_" + index).value = "";
		YAHOO.util.Dom.get("change_password_2_" + index).value = "";
	}
	if (action == "changequota") {
		
	}
	if (action == "delete") {
		
	}
	if (action == "config") {
		
	}
	CPANEL.align_panels_event.fire();
};

var toggle_quota_input = function(mode, index, validate_and_focus) {
	if (mode == "number") {
		YAHOO.util.Dom.get("change_quota_radio_number_" + index).checked = true;
		YAHOO.util.Dom.get("change_quota_radio_unlimited_" + index).checked = false;
		YAHOO.util.Dom.setStyle("change_quota_number_input_" + index, "color", "black");
		
		if (validate_and_focus) {
			YAHOO.util.Dom.get("change_quota_number_input_" + index).focus();
			CHANGE_QUOTA_VALID["number"].verify();
			CHANGE_QUOTA_VALID["unlimited"].clear_messages();
		}
	}
	else {
		YAHOO.util.Dom.get("change_quota_radio_number_" + index).checked = false;
		YAHOO.util.Dom.get("change_quota_radio_unlimited_" + index).checked = true;
		YAHOO.util.Dom.setStyle("change_quota_number_input_" + index, "color", "#888888");
		
		if (validate_and_focus) {
			CHANGE_QUOTA_VALID["number"].clear_messages();
			CHANGE_QUOTA_VALID["unlimited"].verify();
		}
	}
};

var format_path = function(path, hide_element, i) {
	if (path.length > 24) {
		var uid = YAHOO.util.Dom.generateId();
		var path2;
		if (hide_element) {
			path2 = path.slice(0, 12) + '<span class="action_link" id="' + uid + '" style="text-decoration: underline" onclick="toggle_path_popup(\'' + uid + '\', \'' + hide_element + '\')">...</span>' + path.slice(path.length-12);
			path2 += '<input type="hidden" id="delete_module_path_popup_uid_' + i + '" value="' + uid + '" />';
		}
		else {
			path2 = path.slice(0, 12) + '<span class="action_link" id="' + uid + '" style="text-decoration: underline" onclick="toggle_path_popup(\'' + uid + '\')">...</span>' + path.slice(path.length-12);
		}
		path2 += '<input type="hidden" id="' + uid + '_path" value="' + path + '" />';	
		return path2;
	}
	else {
		return path;
	}
};

var toggle_path_popup = function(id, hide_element) {
	var path = YAHOO.util.Dom.get(id + "_path").value;
	
	if (! PATH_POPUPS[id]) {
		// get the width of the path string
		var proxy_span = YAHOO.util.Dom.get("get_path_width");
		proxy_span.innerHTML = path;
		var region = YAHOO.util.Region.getRegion( proxy_span );
		proxy_span.innerHTML = '';
		var path_width = region.width;
		
		// BROWSER-SPECIFIC CODE: pad the input width for webkit and gecko
		if (YAHOO.env.ua.webkit >= 1) {
			path_width += 12;
		}
		if (YAHOO.env.ua.gecko >= 1) {
			path_width += 15;
		}
		
		var options = {
			context : [id, "tl", "br", ["beforeShow", "windowResize", CPANEL.align_panels_event] ],
			effect: { effect: YAHOO.widget.ContainerEffect.FADE, duration : 0.25 },
			visible: false
		};
		PATH_POPUPS[id] = new YAHOO.widget.Overlay(id + "_overlay", options);

		var html = '<span class="action_link" onclick="toggle_path_popup(\'' + id + '\')">&nbsp;x&nbsp;</span><input type="text" style="width: ' + path_width + 'px" value="' + path + '" onclick="this.select()" id="' + id + '_input" />';
		
		PATH_POPUPS[id].setBody(html);
		PATH_POPUPS[id].render(document.body);
		PATH_POPUPS[id].showEvent.subscribe( function() { YAHOO.util.Dom.get(id + "_input").select(); } );
		
		if (hide_element) {
			PATH_POPUPS[id].beforeShowEvent.subscribe(function() { YAHOO.util.Dom.get(hide_element).disabled = true; });
			PATH_POPUPS[id].hideEvent.subscribe(function() { YAHOO.util.Dom.get(hide_element).disabled = false; });
		}
		
		YAHOO.util.Dom.addClass(id + "_overlay", "path_popup");
	}

	if (PATH_POPUPS[id].cfg.getProperty("visible") == true) {
		PATH_POPUPS[id].hide();
	}
	else {
		PATH_POPUPS[id].show();
	}
};

var close_all_path_popups = function() {
	for (var i in PATH_POPUPS) {
           if (PATH_POPUPS.hasOwnProperty(i)) {
		PATH_POPUPS[i].hide();
           }
	}
};

var clear_add_account_input = function() {
	YAHOO.util.Dom.get("login").value = "";
	YAHOO.util.Dom.get("password").value = "";
	YAHOO.util.Dom.get("password2").value = "";
	YAHOO.util.Dom.get("homedir").value = "";
	if (SERVER_TYPE == "PURE") {
		YAHOO.util.Dom.get("quota_value").value = "2000";
		YAHOO.util.Dom.get("quota_unlimited").checked = true;
		toggle_add_account_quota();
	}
	CPANEL.password.show_strength_bar("password_strength", 0);
	for (var i in ADD_VALID) {
           if (ADD_VALID.hasOwnProperty(i)) {
		ADD_VALID[i].clear_messages();
           }
	}
};

var add_ftp_account = function() {
	var user = YAHOO.util.Dom.get("login").value;
	// create the API variables
	var api2_call = {
		"cpanel_jsonapi_version" : 2,
		"cpanel_jsonapi_module" : "Ftp",
		"cpanel_jsonapi_func" : "addftp",
		"user" : user,
		"pass" : YAHOO.util.Dom.get("password").value,
		"homedir" : YAHOO.util.Dom.get("homedir").value
	};
	if (SERVER_TYPE != "PRO") {
		(YAHOO.util.Dom.get("quota_number").checked == true) ? api2_call.quota = YAHOO.util.Dom.get("quota_value").value : api2_call.quota = 0;
	}
	
	var reset_input = function() {
		YAHOO.util.Dom.setStyle("ftp_create_submit", "display", "");
		YAHOO.util.Dom.get("add_ftp_status").innerHTML = "";
	};
	
	// callback functions
	var callback = {
		success : function(o) {
			try {
				var data = YAHOO.lang.JSON.parse(o.responseText);
			}
			catch(e) {
				CPANEL.widgets.status_bar("add_ftp_status_bar", "error", CPANEL.lang.json_error, CPANEL.lang.json_parse_failed);
				reset_input();
				return;
			}
			
			if (data.cpanelresult.data[0].result == "1") {
				CPANEL.widgets.status_bar("add_ftp_status_bar", "success", LANG.Account_Created, user);
				clear_add_account_input();
				load_accounts_table();
			}
			else if (data.cpanelresult.data[0].result == "0") {
				CPANEL.widgets.status_bar("add_ftp_status_bar", "error", CPANEL.lang.Error, data.cpanelresult.data[0].reason);
			}
			else {
				CPANEL.widgets.status_bar("add_ftp_status_bar", "error", CPANEL.lang.Error, LANG.unknown_error);
			}
			
			reset_input();
		},
		
		failure : function(o) {
			CPANEL.widgets.status_bar("add_ftp_status_bar", "error", CPANEL.lang.ajax_error, CPANEL.lang.ajax_try_again);
			reset_input();
		}
	};
	
	// send the AJAX request
	YAHOO.util.Connect.asyncRequest('GET', CPANEL.urls.json_api(api2_call), callback, '');
	
	// show the ajax loading icon
	YAHOO.util.Dom.setStyle("ftp_create_submit", "display", "none");
	YAHOO.util.Dom.get("add_ftp_status").innerHTML = CPANEL.icons.ajax + " " + LANG.creating_account;	
};

var change_password = function(id) {
	// create the API variables
	var api2_call = {
		"cpanel_jsonapi_version" : 2,
		"cpanel_jsonapi_module" : "Ftp",
		"cpanel_jsonapi_func" : "passwd",
		"user" : YAHOO.util.Dom.get("login_" + id).value,
		"pass" : YAHOO.util.Dom.get("change_password_1_" + id).value
	};
	
	var reset_input = function() {
		YAHOO.util.Dom.setStyle("change_password_input_" + id, "display", "block");
		YAHOO.util.Dom.get("change_password_status_" + id).innerHTML = '';
	};
	
	// callback functions
	var callback = {
		success : function(o) {
			try {
				var data = YAHOO.lang.JSON.parse(o.responseText);
			}
			// JSON parse error
			catch(e) {
				CPANEL.widgets.status_bar("status_bar_" + id, "error", CPANEL.lang.json_error, CPANEL.lang.json_parse_failed);
				reset_input();
				return;
			}
			
			// success
			if (data.cpanelresult.data[0].result == "1") {
				CPANEL.widgets.status_bar("status_bar_" + id, "success", LANG.Changed_Password);
				toggle_module("changepassword_module_" + id);
			}
			// error
			else if (data.cpanelresult.data[0].result == "0") {
				CPANEL.widgets.status_bar("status_bar_" + id, "error", CPANEL.lang.Error, data.cpanelresult.error);
			}
			// unknown error
			else {
				CPANEL.widgets.status_bar("status_bar_" + id, "error", CPANEL.lang.Error, LANG.unknown_error);
			}			
			reset_input();
		},
		
		failure : function(o) {
			CPANEL.widgets.status_bar("status_bar_" + id, "error", CPANEL.lang.ajax_error, CPANEL.lang.ajax_try_again);
			reset_input();
		}
	};
	
	// send the AJAX request
	YAHOO.util.Connect.asyncRequest('GET', CPANEL.urls.json_api(api2_call), callback, '');
	
	// show the ajax loading icon
	YAHOO.util.Dom.setStyle("change_password_input_" + id, "display", "none");
	YAHOO.util.Dom.get("change_password_status_" + id).innerHTML = CPANEL.icons.ajax + " " + LANG.changing_password;
};

var change_quota = function(id) {
	// get the quota
	var quota, quota_text, quota_status;
	if (YAHOO.util.Dom.get("change_quota_radio_number_" + id).checked == true) {
		quota = YAHOO.util.Dom.get("change_quota_number_input_" + id).value;
		quota_text = quota;
		quota_status = quota + ' <span class="megabyte_font">MB</span>';
	}
	else {
		quota = 0;
		quota_text = "&infin;";
		quota_status = LANG.unlimited;
	}
	
	// create the API variables
	var api2_call = {
		"cpanel_jsonapi_version" : 2,
		"cpanel_jsonapi_module" : "Ftp",
		"cpanel_jsonapi_func" : "setquota",
		"user" : YAHOO.util.Dom.get("login_" + id).value,
		"quota" : quota
	};
	
	var reset_input = function() {
		YAHOO.util.Dom.setStyle("change_quota_input_" + id, "display", "block");
		YAHOO.util.Dom.get("change_quota_status_" + id).innerHTML = '';
	};
	
	// callback functions
	var callback = {
		success : function(o) {
			try {
				var data = YAHOO.lang.JSON.parse(o.responseText);
			}
			// JSON parse error
			catch(e) {
				CPANEL.widgets.status_bar("status_bar_" + id, "error", CPANEL.lang.json_error, CPANEL.lang.json_parse_failed);
				reset_input();
				return;
			}
			
			// success
			if (data.cpanelresult.data[0].result == "1") {
				CPANEL.widgets.status_bar("status_bar_" + id, "success", LANG.Changed_Quota, quota_status);
				toggle_module("changequota_module_" + id);
				if (id.search(/special/) != -1) {
					var special_ids = YAHOO.util.Dom.get("list_of_anonymous_account_ids").value;
					special_ids = special_ids.split("|");
					for(var i = 0; i < special_ids.length; i++) {
						if (special_ids[i] != "") {
							YAHOO.util.Dom.get("humandiskquota_" + special_ids[i]).innerHTML = quota_text;
							YAHOO.util.Dom.get("diskquota_" + special_ids[i]).value = quota;
							show_usage_bar("usage_bar_" + special_ids[i], YAHOO.util.Dom.get("diskused_" + special_ids[i]).value, quota);
						}
					}
				}
				else {
					YAHOO.util.Dom.get("humandiskquota_" + id).innerHTML = quota_text;
					YAHOO.util.Dom.get("diskquota_" + id).value = quota;						
					show_usage_bar("usage_bar_" + id, YAHOO.util.Dom.get("diskused_" + id).value, quota);
				}
			}
			// known error
			else if (data.cpanelresult.data[0].result == "0") {
				CPANEL.widgets.status_bar("status_bar_" + id, "error", CPANEL.lang.Error, data.cpanelresult.error);
			}
			// unknown error
			else {
				CPANEL.widgets.status_bar("status_bar_" + id, "error", CPANEL.lang.Error, LANG.unknown_error);
			}			
			
			// reset the input fields
			reset_input();
		},
		
		failure : function(o) {
			CPANEL.widgets.status_bar("status_bar_" + id, "error", CPANEL.lang.ajax_error, CPANEL.lang.ajax_try_again);
			reset_input();
		}
	};
	
	// send the AJAX request
	YAHOO.util.Connect.asyncRequest('GET', CPANEL.urls.json_api(api2_call), callback, '');
	
	// show the ajax loading icon
	YAHOO.util.Dom.setStyle("change_quota_input_" + id, "display", "none");
	YAHOO.util.Dom.get("change_quota_status_" + id).innerHTML = CPANEL.icons.ajax + " " + LANG.changing_quota;
};

var show_usage_bar = function(id, usage, quota) {
	var percent = 100 * (usage / quota);
	if (quota == 0) percent = 0;
	CPANEL.widgets.progress_bar(id, percent, "", { inverse_colors: true });
};

var delete_account = function(id, destroy) {
	// create the API call
	var api2_call = {
		"cpanel_jsonapi_version" : 2,
		"cpanel_jsonapi_module" : "Ftp",
		"cpanel_jsonapi_func" : "delftp",
		"user" : YAHOO.util.Dom.get("login_" + id).value
	};
	if (destroy) api2_call.destroy = "1";
	
	var reset_input = function() {
		YAHOO.util.Dom.setStyle("cancel_delete_" + id, "display", "inline");
		
		YAHOO.util.Dom.get("delete_account_" + id).disabled = false;
		YAHOO.util.Dom.setStyle("delete_account2_" + id, "display", "inline");
		YAHOO.util.Dom.get("delete_account2_status_" + id).innerHTML = '';

		YAHOO.util.Dom.get("delete_account2_" + id).disabled = false;
		YAHOO.util.Dom.setStyle("delete_account_" + id, "display", "inline");
		YAHOO.util.Dom.get("delete_account_status_" + id).innerHTML = '';
	};
	
	// callback functions
	var callback = {
		success : function(o) {
			try {
				var data = YAHOO.lang.JSON.parse(o.responseText);
			}
			// JSON parse error
			catch(e) {
				CPANEL.widgets.status_bar("status_bar_" + id, "error", CPANEL.lang.json_error, CPANEL.lang.json_parse_failed);
				reset_input();
				return;
			}
			
			// error
			if (data.cpanelresult.error) {
				CPANEL.widgets.status_bar("status_bar_" + id, "error", CPANEL.lang.Error, data.cpanelresult.error);
			}
			// success
			else if (data.cpanelresult.data[0].result == "1") {
                CPANEL.animate.fade_out( 'delete_module_'+id );
                CPANEL.animate.fade_out( 'account_row_'+id, function() {
					if (FTP_ACCOUNTS_MAXED == true) {
						FTP_ACCOUNTS_MAXED = false;
						YAHOO.util.Dom.setStyle("new_ftp_account_input_div", "display", "");
						YAHOO.util.Dom.setStyle("max_ftp_accounts_alert_box", "display", "none");
					}
				});
			}
			// unknown
			else {
				CPANEL.widgets.status_bar("status_bar_" + id, "error", CPANEL.lang.Error, LANG.unknown_error);
			}
			
			reset_input();
		},
		
		failure : function(o) {
			CPANEL.widgets.status_bar("status_bar_" + id, "error", CPANEL.lang.ajax_error, CPANEL.lang.ajax_try_again);
			reset_input();
		}
	};
	
	// send the AJAX request
	YAHOO.util.Connect.asyncRequest('GET', CPANEL.urls.json_api(api2_call), callback, '');
	
	// show the ajax loading icon
	YAHOO.util.Dom.setStyle("cancel_delete_" + id, "display", "none");
	if (destroy) {
		YAHOO.util.Dom.get("delete_account_" + id).disabled = true;
		YAHOO.util.Dom.setStyle("delete_account2_" + id, "display", "none");
		YAHOO.util.Dom.get("delete_account2_status_" + id).innerHTML = CPANEL.icons.ajax + " " + LANG.deleting_account_and_files;
	}
	else {
		YAHOO.util.Dom.get("delete_account2_" + id).disabled = true;
		YAHOO.util.Dom.setStyle("delete_account_" + id, "display", "none");
		YAHOO.util.Dom.get("delete_account_status_" + id).innerHTML = CPANEL.icons.ajax + " " + LANG.deleting_account;	
	}
};

var search_field_focus = function() {
	search_field = YAHOO.util.Dom.get("search_input");
	if (search_field.value == LANG.Search_Accounts) {
		search_field.value = "";
		YAHOO.util.Dom.setStyle("search_input", "color", "black");
	}
};

var search_field_blur = function() {
	var search_field = YAHOO.util.Dom.get("search_input");
	if (search_field.value == "") {
		search_field.value = LANG.Search_Accounts;
		YAHOO.util.Dom.setStyle("search_input", "color", "#888888");
	}
};

var search_accounts = function() {
	// do not sort while a request is active
	if (TABLE_REQUEST_ACTIVE) return;
	
	var search_term = YAHOO.util.Dom.get("search_input").value;

	// this means that you can't search your email account for the phrase 'Search Accounts'
	if (search_term == LANG.Search_Accounts) search_term = '';

    // do not search for the same thing two times in a row
    if (search_term == LAST_SEARCH_TXT) return;
    LAST_SEARCH_TXT = search_term;

	FTP_API2_CALL.api2_filter = 1;
	FTP_API2_CALL.api2_filter_type = "contains";
	FTP_API2_CALL.api2_filter_column = "serverlogin";
	FTP_API2_CALL.api2_filter_term = search_term;
	
	// reset to page 1
	reset_pagination();	

	load_accounts_table();
	
	// toggle the "clear search" button
	(search_term == "") ? YAHOO.util.Dom.setStyle("clear_search", "display", "none") : YAHOO.util.Dom.setStyle("clear_search", "display", "");
};

var clear_search = function() {
	YAHOO.util.Dom.get("search_input").value = "";
	search_accounts();
	search_field_blur();
};

var change_items_per_page = function() {
	if (TABLE_REQUEST_ACTIVE == false) {
		reset_pagination();
		FTP_API2_CALL.api2_paginate_size = YAHOO.util.Dom.get("items_per_page").value;
		load_accounts_table();
	}
};

var change_page = function(page) {
	if (TABLE_REQUEST_ACTIVE == false) {
		FTP_API2_CALL.api2_paginate_start = ((page -1) * FTP_API2_CALL.api2_paginate_size) + 1;
		load_accounts_table();
	}
};

var reset_pagination = function() {
	FTP_API2_CALL.api2_paginate_start = 1;
};

// toggle sorting of table headers
var toggle_sort = function(column) {
	// do not sort while a request is active
	if (TABLE_REQUEST_ACTIVE) return true;
    
    var prefix;
    (SERVER_TYPE == "PURE") ? prefix = "pure_" : prefix = "pro_";

	// clear all sorting icons
	YAHOO.util.Dom.get(prefix + "sort_direction_serverlogin_img").innerHTML = '';
	YAHOO.util.Dom.get(prefix + "sort_direction_dir_img").innerHTML = '';
    if (SERVER_TYPE == "PURE") {
        YAHOO.util.Dom.get(prefix + "sort_direction_diskused_img").innerHTML = '';
        YAHOO.util.Dom.get(prefix + "sort_direction_diskquota_img").innerHTML = '';
    }
	
	// determine field and method to sort by
	if (column == "serverlogin") {		
		FTP_API2_CALL.api2_sort_column = "serverlogin";
		FTP_API2_CALL.api2_sort_method = "alphabet";
	}
	if (column == 'dir') {
		FTP_API2_CALL.api2_sort_column = "dir";
		FTP_API2_CALL.api2_sort_method = "alphabet";
	}
	if (column == 'diskused') {
		FTP_API2_CALL.api2_sort_column = "diskused";
		FTP_API2_CALL.api2_sort_method = "numeric";
	}
	if (column == 'diskquota') {
		FTP_API2_CALL.api2_sort_column = "diskquota";
		FTP_API2_CALL.api2_sort_method = "numeric_zero_as_max";
	}
	
	var direction_el = YAHOO.util.Dom.get(prefix + "sort_direction_" + column);
	var img_el = YAHOO.util.Dom.get(prefix + "sort_direction_" + column + "_img");
	if (direction_el.value == "asc") {
		direction_el.value = "desc";
		img_el.innerHTML = '&darr;';
		FTP_API2_CALL.api2_sort_reverse = '1';
	}
	else {
		direction_el.value = "asc";
		img_el.innerHTML = '&uarr;';
		FTP_API2_CALL.api2_sort_reverse = '0';
	}
	
	// reset to page 1
	reset_pagination();	
	
	load_accounts_table();
};

var prep_ui_server_type = function() {
	if (SERVER_TYPE == "PRO") {
		YAHOO.util.Dom.setStyle("add_new_quota_row", "display", "none");
		
		YAHOO.util.Dom.setStyle("pure_table_header", "display", "none");
		YAHOO.util.Dom.setStyle("pro_table_header", "display", "");
		
		YAHOO.util.Dom.setStyle("pure_special_table_header", "display", "none");
		YAHOO.util.Dom.setStyle("pro_special_table_header", "display", "");		
	}
};

var init = function() {	
	// change the UI based on the server type
	prep_ui_server_type();
	
	// initialize the API call
	FTP_API2_CALL = {
		cpanel_jsonapi_version: 2,
		cpanel_jsonapi_module: "Ftp",
		cpanel_jsonapi_func: "listftpwithdisk",
		include_acct_types: "sub",
		api2_paginate: 1,
		api2_paginate_size: 10,
		api2_paginate_start: 1,
		api2_sort: 1,
		api2_sort_column: "serverlogin",
		api2_sort_method: "alphabet",
		api2_sort_reverse: 0
	};
	
	CPANEL.util.catch_enter("search_input", "search_button");
	
	CPANEL.panels.create_help("special_accounts_help", "special_accounts_help_text");
	
	init_add_validation();
	load_accounts_table();
	load_special_accounts_table();
};
YAHOO.util.Event.onDOMReady(init);
