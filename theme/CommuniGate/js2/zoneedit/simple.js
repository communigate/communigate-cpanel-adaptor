
// convert Name's to their explicit version in the zone file to avoid confusion
// foo  --> foo.example.com.
// foo. --> foo.example.com.
// foo.example.com  --> foo.example.com.
// foo.example.com. --> foo.example.com. (unmodified)
var format_dns_name = function(el) {
	el = YAHOO.util.Dom.get(el);
    var name = el.value;
	var domain = YAHOO.util.Dom.get("domain").value;
	
	if (name == "") return;
	
	// add a dot at the end of the name
	if (CPANEL.validate.end_of_string(name, ".") == false) {
		name += ".";
	}
	
	// add the domain if it does not already exist
	if (CPANEL.validate.end_of_string(name, domain + ".") == false) {
		name += domain + ".";
	}
	
	el.value = name;
};

var VALID = [];

var validate_name_collisions = function(cname) {
	return (! CPANEL.array.exists(CPANEL_CONTROLLED_DOMAINS, cname));
};

var add_A_record = function() {
    // build the call
	var name = YAHOO.util.Dom.get("A_name").value;
	var address = YAHOO.util.Dom.get("A_address").value;
	var api2_call = {
		"cpanel_jsonapi_version" : 2,
		"cpanel_jsonapi_module" : "ZoneEdit",
		"cpanel_jsonapi_func" : "add_zone_record",
		"domain" : YAHOO.util.Dom.get("domain").value,
        "type" : "A",
        "ttl" : "14400",
        "class" : "IN",
        "name" : name,
        "address" : address
	};
    
    // callback
    var callback = {
        success : function(o) {
			try {
				var data = YAHOO.lang.JSON.parse(o.responseText);
				if (data.cpanelresult.error) {
					CPANEL.widgets.status_bar("add_A_record_status_bar", "error", CPANEL.lang.Error, data.cpanelresult.error);
					reset_form("A");					
				}				
				else if (data.cpanelresult.data[0].result.status == '1') {
					CPANEL.widgets.status_bar("add_A_record_status_bar", "success", LANG.SZE_added_record, name + " &rarr; " + address);
					reset_form("A");
					update_user_records_table();
				}
				else {
					CPANEL.widgets.status_bar("add_A_record_status_bar", "error", CPANEL.lang.Error, data.cpanelresult.data[0].result.statusmsg);
					reset_form("A");
				}
			}
			catch (e) {
				CPANEL.widgets.status_bar("add_A_record_status_bar", "error", CPANEL.lang.json_error, CPANEL.lang.json_parse_failed);
				reset_form("A");
				update_user_records_table();				
			}
        },
        failure : function(o) {
			YAHOO.util.Dom.setStyle("add_A_record_button", "display", "block");
			YAHOO.util.Dom.get("add_A_record_status").innerHTML = "";
			CPANEL.widgets.status_bar("add_A_record_status_bar", "error", CPANEL.lang.ajax_error, CPANEL.lang.ajax_try_again);
        }
    };
    
    // send the request
    YAHOO.util.Connect.asyncRequest('GET', CPANEL.urls.json_api(api2_call), callback, '');
    
    YAHOO.util.Dom.setStyle("add_A_record_button", "display", "none");
    YAHOO.util.Dom.get("add_A_record_status").innerHTML = CPANEL.icons.ajax + " " + LANG.SZE_adding_record;
};

var add_CNAME_record = function() {
    // build the call
	var name = YAHOO.util.Dom.get("CNAME_name").value;
	var cname = YAHOO.util.Dom.get("CNAME_cname").value;
	var api2_call = {
		"cpanel_jsonapi_version" : 2,
		"cpanel_jsonapi_module" : "ZoneEdit",
		"cpanel_jsonapi_func" : "add_zone_record",
		"domain" : YAHOO.util.Dom.get("domain").value,
        "ttl" : "14400",
        "class" : "IN",
        "type" : "CNAME",
        "name" : name,
        "cname" : cname
	};
    
    // callback
    var callback = {
        success : function(o) {
			try {
				var data = YAHOO.lang.JSON.parse(o.responseText);
				if (data.cpanelresult.error) {
					CPANEL.widgets.status_bar("add_CNAME_status_bar", "error", CPANEL.lang.Error, data.cpanelresult.error);
					reset_form("CNAME");					
				}
				else if (data.cpanelresult.data[0].result.status == '1') {
					CPANEL.widgets.status_bar("add_CNAME_status_bar", "success", LANG.SZE_added_record, name + " &rarr; " + cname);
					reset_form("CNAME");
					update_user_records_table();
				}
				else {
					CPANEL.widgets.status_bar("add_CNAME_status_bar", "error", CPANEL.lang.Error, data.cpanelresult.data[0].result.statusmsg);
					reset_form("CNAME");
				}
			}
			catch (e) {
				CPANEL.widgets.status_bar("add_CNAME_status_bar", "error", CPANEL.lang.json_error, CPANEL.lang.json_parse_failed);
				reset_form("CNAME");
				update_user_records_table();
			}
        },
        failure : function(o) {
			YAHOO.util.Dom.setStyle("add_CNAME_record_button", "display", "block");
			YAHOO.util.Dom.get("add_CNAME_record_status").innerHTML = "";
			CPANEL.widgets.status_bar("add_CNAME_status_bar", "error", CPANEL.lang.ajax_error, CPANEL.lang.ajax_try_again);
        }
    };
    
    // send the request
    YAHOO.util.Connect.asyncRequest('GET', CPANEL.urls.json_api(api2_call), callback, '');
    
    YAHOO.util.Dom.setStyle("add_CNAME_record_button", "display", "none");
    YAHOO.util.Dom.get("add_CNAME_record_status").innerHTML = CPANEL.icons.ajax + " " + LANG.SZE_adding_record;
};

var reset_form = function(type) {
    YAHOO.util.Dom.setStyle("add_" + type + "_record_button", "display", "block");
    YAHOO.util.Dom.get("add_" + type + "_record_status").innerHTML = '';
    
	YAHOO.util.Dom.get(type + "_name").value = "";
    if (type == "A") YAHOO.util.Dom.get("A_address").value = "";
    if (type == "CNAME") YAHOO.util.Dom.get("CNAME_cname").value = "";
    
    VALID[type + "_name"].clear_messages();
    if (type == "A") VALID["A_address"].clear_messages();
    if (type == "CNAME") VALID["CNAME_cname"].clear_messages();
};

var toggle_confirm_delete = function(line) {
    CPANEL.animate.slide_toggle( 'delete_confirm_'+line );
};

var delete_line = function(line) {
    // build the call
	var api2_call = {
		"cpanel_jsonapi_version" : 2,
		"cpanel_jsonapi_module" : "ZoneEdit",
		"cpanel_jsonapi_func" : "remove_zone_record",
		"domain" : YAHOO.util.Dom.get("domain").value,
        "line" : line
	};
    
    // callback
    var callback = {
        success : function(o) {
			try {
				var data = YAHOO.lang.JSON.parse(o.responseText);
				if (data.cpanelresult.error) {
					YAHOO.util.Dom.setStyle("delete_input_" + line, "display", "block");
					YAHOO.util.Dom.get("delete_status_" + line).innerHTML = "";
					CPANEL.widgets.status_bar("delete_status_bar_" + line, "error", CPANEL.lang.Error, data.cpanelresult.error);					
				}						
				else if (data.cpanelresult.data[0].result.status == "1") {
                    CPANEL.animate.fade_out( 'info_row_'+line, function() {
						var records_showing = false;
						var records = YAHOO.util.Dom.getElementsByClassName("dt_info_row", "tr", "user_records_table");
						for (var i=0; i<records.length; i++) {
							if (YAHOO.util.Dom.getStyle(records[i], "display") != "none") records_showing = true;
						}
						if (records_showing == false) update_user_records_table();						
					});
                    CPANEL.animate.fade_out('module_row_'+line);
                                        update_user_records_table();
				}
				else {
					YAHOO.util.Dom.setStyle("delete_input_" + line, "display", "block");
					YAHOO.util.Dom.get("delete_status_" + line).innerHTML = "";
					CPANEL.widgets.status_bar("delete_status_bar_" + line, "error", CPANEL.lang.Error, data.cpanelresult.data[0].result.statusmsg);
                                        update_user_records_table();
				}
			}
			catch (e) {
				YAHOO.util.Dom.setStyle("delete_input_" + line, "display", "block");
				YAHOO.util.Dom.get("delete_status_" + line).innerHTML = "";
				CPANEL.widgets.status_bar("delete_status_bar_" + line, "error", CPANEL.lang.json_error, CPANEL.lang.json_parse_failed);	
			}
        },
        failure : function(o) {
			YAHOO.util.Dom.setStyle("delete_input_" + line, "display", "block");
			YAHOO.util.Dom.get("delete_status_" + line).innerHTML = "";
            CPANEL.widgets.status_bar("delete_status_bar_" + line, "error", CPANEL.lang.ajax_error, CPANEL.lang.ajax_try_again);
        }
    };
    
    // send the request
    YAHOO.util.Connect.asyncRequest('GET', CPANEL.urls.json_api(api2_call), callback, '');
    
	YAHOO.util.Dom.setStyle("delete_input_" + line, "display", "none");
    YAHOO.util.Dom.get("delete_status_" + line).innerHTML = CPANEL.icons.ajax + " " + LANG.SZE_deleting_record;
};

var update_user_records_table = function() {
    var callback = {
        success : function(o) {
            YAHOO.util.Dom.get("user_records_div").innerHTML = o.responseText;
        },
        failure : function(o) {
            YAHOO.util.Dom.get("user_records_div").innerHTML = '<div style="padding: 20px">' + CPANEL.icons.error + " " + CPANEL.lang.ajax_error + ": " + CPANEL.lang.ajax_try_again + "</div>";
        }
    };
    
    // send the AJAX request
    var domain = YAHOO.util.Dom.get("domain").value;
	YAHOO.util.Connect.asyncRequest('GET', "user_zone_records.html?domain=" + domain, callback, '');
    
    YAHOO.util.Dom.get("user_records_div").innerHTML = '<div style="padding: 20px">' + CPANEL.icons.ajax + " " + CPANEL.lang.ajax_loading + "</div>";
};

var add_validation = function() {
    // A
    VALID["A_name"] = new CPANEL.validate.validator("A Name");
    VALID["A_name"].add("A_name", "zone_name", LANG.SZE_not_valid_zone_name);
	VALID["A_name"].add("A_name", function() { return validate_unique_cname("A_name"); }, LANG.cname_unique1 + "<br />" + LANG.cname_unique2);
    VALID["A_name"].attach();
    
    VALID["A_address"] = new CPANEL.validate.validator("A Address");
    VALID["A_address"].add("A_address", "ip", LANG.SZE_address_valid_ip);
	VALID["A_address"].add("A_address", "no_local_ips", LANG.SZE_address_not_local);
    VALID["A_address"].attach();
    
    CPANEL.validate.attach_to_form("A_submit", [VALID["A_name"], VALID["A_address"]], add_A_record);
    
    // CNAME
    VALID["CNAME_name"] = new CPANEL.validate.validator("CNAME Name");
    VALID["CNAME_name"].add("CNAME_name", "zone_name", LANG.SZE_not_valid_zone_name);
	VALID["CNAME_name"].add("CNAME_name", function() { return validate_name_collisions(YAHOO.util.Dom.get("CNAME_name").value); }, LANG.SZE_name_reserved);
	VALID["CNAME_name"].add("CNAME_name", function() { return validate_unique_cname("CNAME_name"); }, LANG.cname_unique1 + "<br />" + LANG.cname_unique2);
    VALID["CNAME_name"].attach();
    
    VALID["CNAME_cname"] = new CPANEL.validate.validator("A Address");
    VALID["CNAME_cname"].add("CNAME_cname", "fqdn", LANG.SZE_address_fqdn);
    VALID["CNAME_cname"].attach();
    
    CPANEL.validate.attach_to_form("CNAME_submit", [VALID["CNAME_name"], VALID["CNAME_cname"]], add_CNAME_record);
};

var validate_unique_cname = function(input_el) {
	var name = YAHOO.util.Dom.get(input_el).value;
	
	if (name == "") return true;
	
	var names = YAHOO.util.Dom.getElementsByClassName("zone_records_name", "span", "user_records_table");
	var types = YAHOO.util.Dom.getElementsByClassName("zone_records_type", "span", "user_records_table");
	
	if (names.length == 0) return true;
	
	for (var i = 0; i < names.length; i++) {
		if (types[i].innerHTML.toLowerCase() != "cname") continue;
		
		if (names[i].innerHTML.toLowerCase() == name.toLowerCase()) return false;
	}
	
	return true;
};

var toggle_domain = function() {
	var domain = YAHOO.util.Dom.get("domain").value;
	if (domain == "_select_") {
        CPANEL.animate.slide_up('add_record_and_zone_table');
	}
	else {
        CPANEL.animate.slide_down('add_record_and_zone_table');
		update_user_records_table();
	}
	reset_form("A");
	reset_form("CNAME");
};

var init_page = function() {
    // change domain
	YAHOO.util.Event.on("domain", "change", toggle_domain);
    
    // toggle help questions
    YAHOO.util.Event.on("toggle_A_record_description", "click", function() { CPANEL.animate.slide_toggle("A_record_description"); });
    YAHOO.util.Event.on("toggle_CNAME_record_description", "click", function() { CPANEL.animate.slide_toggle("CNAME_record_description"); });
    
    // toggle IP address resolvers
    YAHOO.util.Event.on("toggle_A_ip_resolve", "click", function() { CPANEL.animate.slide_toggle("A_ip_resolve"); });
    YAHOO.util.Event.on("toggle_CNAME_ip_resolve", "click", function() { CPANEL.animate.slide_toggle("CNAME_ip_resolve"); });
	
    add_validation();
   
    YAHOO.util.Event.addListener('A_name','blur',function () { 
		format_dns_name(this); 
		VALID["A_name"].verify(); 
	});
    YAHOO.util.Event.addListener('CNAME_name','blur',function () { 
		format_dns_name(this); 
		VALID["CNAME_name"].verify(); 
	});
	
	CPANEL.util.catch_enter(["A_name", "A_address"], "A_submit");
	CPANEL.util.catch_enter(["CNAME_name", "CNAME_cname"], "CNAME_submit");
 
    // load the table
	if (YAHOO.util.Dom.get("domain").value != "_select_") {
		update_user_records_table();
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
        _stylesheet.forEach( function(rule) {
            first_stylesheet.insertRule( rule[0] + ' {'+rule[1]+'}', 0 );
        } );
    }
    else { //IE
        _stylesheet.forEach( function(rule) {
            first_stylesheet.addRule( rule[0], rule[1], 0 );
        } );
    }
})();
