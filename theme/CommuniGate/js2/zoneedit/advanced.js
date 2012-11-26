// NOTE: This page is pretty complicated.  There is a lot of DOM being injected and you need to pay attention to the objects that get
// passed around from function to function.  I originally had things separated by building all the DOM all at once and then adding all the event handlers right after.
// I had to scrap that because it was too slow.  If you see something that makes you say "geez, this is so hard to read, why did he do that?" the answer is: it's like that
// to be fast.  If you make an architecture/DOM change be sure to test it against a large number of dnszone addresses in the table.
// C. Oakman - chriso@cpanel.net

// globals
var DOM = YAHOO.util.Dom;
var EVENT = YAHOO.util.Event;
var API;
var ZONE;
var DESTROYING_OLD_TABLE = false;
var EDIT_ZONE_LINE_VALID = {};
var OPEN_MODULE = 0;
var ADD_ZONE_LINE_VALID = {};

// TODO: put this in CPANEL.validate
var typeof_validator = function(obj) {
	if (typeof(obj.add) != "function") return false;
	if (typeof(obj.attach) != "function") return false;
	if (typeof(obj.title) != "string") return false;
	return true;
};

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

var reset_zone_file = function() {
	// create the API variables
	var api2_call = {
		cpanel_jsonapi_version : 2,
		cpanel_jsonapi_module  : "ZoneEdit",
		cpanel_jsonapi_func    : "resetzone",
		domain                 : YAHOO.util.Dom.get("domain").value
	};
	
	var reset_zone_ui = function() {
		YAHOO.util.Dom.get("reset_zone_file_checkbox").checked = false;
		YAHOO.util.Dom.get("reset_zone_file").disabled = true;
		YAHOO.util.Dom.get("reset_zone_status").innerHTML = "";
	};

	// callback functions
	var callback = {
		success : function(o) {
			try {
				var data = YAHOO.lang.JSON.parse(o.responseText);
			}
			// JSON parse error
			catch (e) {
				CPANEL.widgets.status_bar("reset_zone_status_bar", "error", CPANEL.lang.json_error, CPANEL.lang.json_parse_failed);
				reset_zone_ui();
				return;
			}
			
			// error
			if (data.cpanelresult.error) {
				CPANEL.widgets.status_bar("reset_zone_status_bar", "error", CPANEL.lang.Error, data.cpanelresult.error);					
			}
			// success
			else if (data.cpanelresult.data[0].result.status == '1') {
				CPANEL.widgets.status_bar("reset_zone_status_bar", "success", LANG.zone_file_reset);
				update_dns_zone();
			}
			// unknown error
			else if (data.cpanelresult.data[0].result.status == '0') {
				CPANEL.widgets.status_bar("reset_zone_status_bar", "error", CPANEL.lang.Error, data.cpanelresult.data[0].result.statusmsg);
			}
			reset_zone_ui();
		},
		failure : function(o) {
			CPANEL.widgets.status_bar("reset_zone_status_bar", "error", CPANEL.lang.ajax_error, CPANEL.lang.ajax_try_again);
			reset_zone_ui();
		}
	};
	
	// send the AJAX request
	YAHOO.util.Connect.asyncRequest('GET', CPANEL.urls.json_api(api2_call), callback, '');
	
	YAHOO.util.Dom.get("reset_zone_file").disabled = true;
	YAHOO.util.Dom.get("reset_zone_status").innerHTML = CPANEL.icons.ajax + " " + LANG.restoring_defaults;
};

var reset_add_zone_line_form = function() {
    YAHOO.util.Dom.setStyle("add_new_zone_line_submit", "display", "block");
    YAHOO.util.Dom.get("add_new_zone_line_status").innerHTML = '';
    
	YAHOO.util.Dom.get("name").value = "";
	YAHOO.util.Dom.get("ttl").value = "";
	YAHOO.util.Dom.get("type").value = "A";
	YAHOO.util.Dom.get("address").value = "";
	YAHOO.util.Dom.get("cname").value = "";
	YAHOO.util.Dom.get("txtdata").value = "";

	for (var i in ADD_ZONE_LINE_VALID) {
		if (typeof_validator(ADD_ZONE_LINE_VALID[i]) === true) {
			ADD_ZONE_LINE_VALID[i].clear_messages();
		}
	}
	
	toggle_type_inputs();
};

var toggle_type_inputs = function() {
	// clear any validation from other types
	ADD_ZONE_LINE_VALID.address.clear_messages();
	ADD_ZONE_LINE_VALID.cname.clear_messages();
	ADD_ZONE_LINE_VALID.txtdata.clear_messages();	
	
	var type = YAHOO.util.Dom.get("type").value;
	
	if (type == "A") YAHOO.util.Dom.setStyle("type_A", "display", "");
	else YAHOO.util.Dom.setStyle("type_A", "display", "none");
		
	if (type == "CNAME") YAHOO.util.Dom.setStyle("type_CNAME", "display", "");
	else YAHOO.util.Dom.setStyle("type_CNAME", "display", "none");
	
	if (type == "TXT") YAHOO.util.Dom.setStyle("type_TXT", "display", "");
	else YAHOO.util.Dom.setStyle("type_TXT", "display", "none");		
};

var validate_address = function(select_el, address_el) {
	var type = YAHOO.util.Dom.get(select_el).value;
	if (type == "A") {
		return CPANEL.validate.ip( YAHOO.util.Dom.get(address_el).value );
	}
	else return true;
};

var validate_address_no_local_ips = function(select_el, address_el) {
	var type = YAHOO.util.Dom.get(select_el).value;
	if (type == "A") {
		return CPANEL.validate.no_local_ips( YAHOO.util.Dom.get(address_el).value );
	}
	else return true;
};

var validate_cname = function(select_el, cname_el) {
	var type = YAHOO.util.Dom.get(select_el).value;
	if (type == "CNAME") {
		return ( (CPANEL.validate.zone_name( YAHOO.util.Dom.get(cname_el).value )) && !(/\.$/.test( YAHOO.util.Dom.get(cname_el).value)) );
	}
	else return true;
};

var validate_txtdata = function(select_el, txtdata_el) {
	var type = YAHOO.util.Dom.get(select_el).value;
	if (type == "TXT") {
		var txtdata = YAHOO.util.Dom.get(txtdata_el).value;
		return (txtdata.length <= 255 && txtdata.length > 0);
	}
	else return true;
};

var validate_unique_cname = function(input_el, idx) {
	var name = YAHOO.util.Dom.get(input_el).value;

	for (var i = 0; i < ZONE.length; i++) {		
		if (ZONE[i].type.toLowerCase() != "cname") continue;
		
		if ( (ZONE[i].name.toLowerCase() == name.toLowerCase()) && (i != idx) ) {
			return false;
		}
	}
	
	return true;
};

var init_select_box = function() {
	YAHOO.util.Event.on("type", "change", toggle_type_inputs);
    YAHOO.util.Event.on("name", "blur", function () {
		format_dns_name(this);
	        setTimeout("ADD_ZONE_LINE_VALID.name.verify()",25);
	});
	
	ADD_ZONE_LINE_VALID.name = new CPANEL.validate.validator(LANG.Name);
	ADD_ZONE_LINE_VALID.name.add("name", "zone_name", LANG.not_valid_zone_name);
	ADD_ZONE_LINE_VALID.name.add("name", function() { return validate_unique_cname("name"); }, LANG.cname_must_be_unique + "<br />" + LANG.cname_must_be_unique2);
	ADD_ZONE_LINE_VALID.name.attach();
	
	ADD_ZONE_LINE_VALID.ttl = new CPANEL.validate.validator("TTL");
	ADD_ZONE_LINE_VALID.ttl.add("ttl", "positive_integer", LANG.ttl_positive_integer);
	ADD_ZONE_LINE_VALID.ttl.attach();
	
	ADD_ZONE_LINE_VALID.address = new CPANEL.validate.validator(LANG.Address);
	ADD_ZONE_LINE_VALID.address.add("address", function() {return validate_address("type", "address"); }, LANG.address_valid_ip);
	ADD_ZONE_LINE_VALID.address.add("address", function() {return validate_address_no_local_ips("type", "address"); }, LANG.address_not_local_ip);
	ADD_ZONE_LINE_VALID.address.attach();

	ADD_ZONE_LINE_VALID.cname = new CPANEL.validate.validator("CNAME");
	ADD_ZONE_LINE_VALID.cname.add("cname", function() { return validate_cname("type", "cname"); }, LANG.cname_valid_name);
	ADD_ZONE_LINE_VALID.cname.attach();

	ADD_ZONE_LINE_VALID.txtdata = new CPANEL.validate.validator("TXT Data");
	ADD_ZONE_LINE_VALID.txtdata.add("txtdata", function() { return validate_txtdata("type", "txtdata"); }, LANG.txtdata_valid);
	ADD_ZONE_LINE_VALID.txtdata.attach();
	
	CPANEL.validate.attach_to_form("submit", ADD_ZONE_LINE_VALID, add_new_zone_line);
};
YAHOO.util.Event.onDOMReady(init_select_box);

// update the dnszone accounts table with fresh information from the server
var update_dns_zone = function() {
	// success function defined here so we can use a setTimeout to call it
	// need to call this function like this to prevent a possible race condition when the ajax request returns faster
	// than it takes the browser to destroy the table elements and all event handlers in it
	var ajax_success = function(o) {
		// if we are still destroying the table poll every 10 milliseconds until that task is finished
		if (DESTROYING_OLD_TABLE == true) {
			setTimeout(function() { ajax_success(o); }, 10);
			return;
		}
		
		// parse the JSON response data
		try {
			var data = YAHOO.lang.JSON.parse(o.responseText);
		}
		catch (e) {
			CPANEL.widgets.status_bar("zone_table_status_bar", "error", CPANEL.lang.json_error, CPANEL.lang.json_parse_failed);
			show_no_zone_entries();
			return;
		}
		
		// success
		if (data.cpanelresult && data.cpanelresult.data && data.cpanelresult.data[0].status == 1) {
			ZONE = data.cpanelresult.data[0].record;
			API.serialnum = data.cpanelresult.data[0].serialnum;
			build_dnszone_table();			
		}
		else {
			var error_message = LANG.unknown_error;
			if (data.cpanelresult && data.cpanelresult.data && data.cpanelresult.data[0].statusmsg) {
				error_message = data.cpanelresult.data[0].statusmsg;
			}
			CPANEL.widgets.status_bar("zone_table_status_bar", "error", CPANEL.lang.Error, error_message);
			show_no_zone_entries();			
		}
	};

	// failure function defined here so we can use a setTimeout to call it
	// need to call this function like this to prevent a possible race condition when the ajax request returns faster
	// than it takes the browser to destroy the table elements and all event handlers in it	
	var ajax_failure = function(o) {
		// if we are still destroying the table poll every 10 milliseconds until that task is finished
		if (DESTROYING_OLD_TABLE == true) {
			setTimeout(function() { ajax_failure(o); }, 10);
		}
		// once the table is fully destroyed we can write things to it
		else {
			var html = '<div style="padding: 20px 60px; height: 460px">';
			html += CPANEL.lang.ajax_try_again;
			html += '</div>';
			YAHOO.util.Dom.get("dns_zone_table").innerHTML = html;
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
		timeout: 8000
	};
	
	// set this variable to prevent a race condition with the ajax request
	DESTROYING_OLD_TABLE = true;
	
	// send the AJAX request
	YAHOO.util.Connect.asyncRequest('GET', CPANEL.urls.json_api(API), callback, '');
	//ajax_success({ responseText: document.getElementById('json').value });
	
	// put the current table into a hidden div and show the loading icon
	var old_table = DOM.get("dns_zone_table").innerHTML;
	var html = '';
	// if this is the first time the page loads give the table an initial height
	if (old_table == '') {
		html += '<div id="loading_div" style="height: 100px">&nbsp;';
		html += '<div style="padding: 20px">';
		html += 	CPANEL.icons.ajax + " " + CPANEL.lang.ajax_loading;
		html += '</div>';
		html += '</div>';
	}
	else {
		var table_region = YAHOO.util.Region.getRegion(YAHOO.util.Dom.get("dns_zone_table"));
		html = '<div id="loading_div" style="height: ' + table_region.height + 'px">';
		html += '<div style="padding: 20px">';
		html += 	CPANEL.icons.ajax + " " + CPANEL.lang.ajax_loading;
		html += '</div>';
		html += '<div id="old_dns_zone_table" style="display:none">';
		html += 	old_table;
		html += '</div></div>';
	}
	YAHOO.util.Dom.get("dns_zone_table").innerHTML = html;
	
	// while the AJAX request is being sent purge the previous table of all event handlers
	// NOTE: this is a recursive DOM manipulation function and can take some time to execute, particularly in ie6/7
	YAHOO.util.Event.purgeElement("old_dns_zone_table", true);
	
	// clear any validation that may still be hanging around (ie6 bug with the YUI panels)
	if (YAHOO.util.Dom.inDocument(OPEN_MODULE.id) == true) {
		if (YAHOO.util.Dom.getStyle(OPEN_MODULE.id, "display") != "none") {
		    before_hide_module(OPEN_MODULE);
		}
	}
	
	// toggle the race condition flag
	DESTROYING_OLD_TABLE = false;
};

// message shown when no entries are returned from the API2 call
var show_no_zone_entries = function() {
	var html = '';
	html += '<div id="loading_div" style="height: 75px; padding-top: 20px; text-align: center">';
	html += LANG.no_zone_records_found + '<br /><br />';
	html += '</div>';
	YAHOO.util.Dom.get("dns_zone_table").innerHTML = html;
};

// destroy the current dnszone table and build a new one from the ZONE variable
var build_dnszone_table = function() {
	YAHOO.util.Dom.get("dns_zone_table").innerHTML = build_dnszone_table_markup();
	activate_dnszone_table();		
    OPEN_MODULE = 0;
};

/*
// we're not currently using this function; commenting out for now - C. Oakman 14 Sep 09
var validate_dnszone_with_changes = function(newrecord) {
    var domain = newrecord.domain;
	var newname = (newrecord.name.match(/\.$/) ? newrecord.name : (newrecord.name + domain + '.'));
    var newtype = newrecord.type;
    for (var i in ZONE) {
        if (ZONE[i].name == newname) {
            if (newtype == 'CNAME') {
                return(0, newname + ' already has a ' + ZONE[i].type + ' record.  You many not mix CNAME records with other records');
            } else if (ZONE[i].type == 'CNAME') {
                return(0, newname + ' already has a CNAME record.  You many not mix CNAME records with other records (' + newtype + ')');
            }
        }   
    } 
    return (1, 'OK');
}
*/

// build the HTML markup for the new dnszone table
var build_dnszone_table_markup = function() {
	// set the initial row stripe
	var row_toggle = 'rowA';
	
	// loop through the dnszone accounts and build the table
	var html  = '<table id="table_dns_zone" class="dynamic_table" border="0" cellspacing="0" cellpadding="0">';
        html += '<tr class="dt_header_row">';
        html += 	'<th>' + LANG.Name + '</th>';
        html += 	'<th>TTL</th>';
        html += 	'<th>Class</th>';
        html += 	'<th>' + LANG.Type + '</th>';
        html += 	'<th colspan="2">' + LANG.Record + '</th>';
        html += 	'<th>' + LANG.Action + '</th>';
        html += '</tr>';

	for (var i=0; i<ZONE.length; i++) {
        if (! ZONE[i]['type'].match(/^(A|CNAME|TXT)$/)) continue; // only edit these types
        if (ZONE[i]['name'].match(/^default\._domainkey\./)) continue; // do not show domain keys
    
        html += '<tr id="info_row_' + i + '" class="dt_info_row ' + row_toggle + '">';
    
        // A, MX, CNAME, TXT records
        if (ZONE[i]['type'].match(/^(A|CNAME|TXT)$/)) {
            html += '<td id="name_value_' + i + '">' + ZONE[i]['name'] + '</td>';
            html += '<td id="ttl_value_' + i + '">' + ZONE[i]['ttl'] + '</td>';
            html += '<td>' + ZONE[i]['class'] + '</td>';
            html += '<td id="type_value_' + i + '">' + ZONE[i]['type'] + '</td>';
            // A
            if (ZONE[i]['type'] == 'A') {
                html += '<td colspan="2" id="value_value_hehe_' + i + '">' + ZONE[i]['address'] + '</td>';
            } 
            // CNAME
            else if (ZONE[i]['type'] == 'CNAME') {
                html += '<td colspan="2" id="value_value_hehe_' + i + '">' + ZONE[i]['cname'] + '</td>';
            } 
            // TXT
            else if (ZONE[i]['type'] == 'TXT') {
                html += '<td colspan="2" id="value_value_hehe_' + i + '">' + ZONE[i]['txtdata'].html_encode() + '</td>';
            }
        }
		
		// action links
        html += '<td>';
		html +=		'<span class="action_link" id="dnszone_table_edit_' + i + '">' + LANG.Edit + '</span>&nbsp;&nbsp;&nbsp;';
		html +=		'<span class="action_link" id="dnszone_table_delete_' + i + '">' + LANG.Delete + '</span>';
		html += '</td>';
		
        html += '</tr>';

        html += '<tr id="module_row_' + i + '" class="dt_module_row ' + row_toggle + '"><td colspan="7">';
        html += 	'<div id="dnszone_table_edit_div_' + i + '" class="dt_module"></div>';
        html += 	'<div id="dnszone_table_delete_div_' + i + '" class="dt_module"></div>';
		html += 	'<div id="status_bar_' + i + '" class="cjt_status_bar"></div>';
        html += '</td></tr>';

        // alternate row stripes
		row_toggle = (row_toggle == 'rowA') ? row_toggle = 'rowB' : 'rowA';
	}
	html += '</table>';
	
	return html;
};

// add event handlers for the new dnszone table
var activate_dnszone_table = function() {
	for (var i in ZONE) {
		if (ZONE.hasOwnProperty(i)) {
	        if (! ZONE[i]['type'].match(/^(A|CNAME|TXT)$/))  { continue; } // only edit these types
	        if (ZONE[i]['name'].match(/^default\._domainkey\./))  { continue; } // do not show domain keys
	
			YAHOO.util.Event.on("dnszone_table_edit_" + i, "click", toggle_module, { "id" : "dnszone_table_edit_div_" + i, "index" : i, "action" : "edit" });
			YAHOO.util.Event.on("dnszone_table_delete_" + i, "click", toggle_module, { "id" : "dnszone_table_delete_div_" + i, "index" : i, "action" : "delete" });
		}
	}
};

var toggle_module = function(e, o) {
	// if a div, that is not o, is already open, close it
	if ( OPEN_MODULE && OPEN_MODULE.id !== o.id && YAHOO.util.Dom.getStyle(OPEN_MODULE.id, "display") != "none") {
		var currently_open_div = OPEN_MODULE;
		before_hide_module(currently_open_div);
		CPANEL.animate.slide_up( currently_open_div.id, function() { after_hide_module(currently_open_div) });
	}
	
	// if o is currently displayed, hide it
	if (YAHOO.util.Dom.getStyle(o.id, "display") != 'none') {
		before_hide_module(o);
		CPANEL.animate.slide_up( o.id, function() { after_hide_module(o) });
	}
	// else show o and set it as the OPEN_MODULE
	else {
		before_show_module(o);
        CPANEL.animate.slide_down( o.id, function() { after_show_module(o); } );
		OPEN_MODULE = o;
	}
};

// build the HTML markup for the modules if it doesn't exist already
var before_show_module = function(o) {

	var el = YAHOO.util.Dom.get(o.id);
	if (el.innerHTML == '') {
		var html = '';
		if (o.action === 'edit') {
            var all_values = ZONE[o.index]['name'] + ZONE[o.index]['ttl'] + ZONE[o.index]['type'];
            if (ZONE[o.index]['address'])    all_values += ZONE[o.index]['address'];
            if (ZONE[o.index]['cname'])      all_values += ZONE[o.index]['cname'];
            if (ZONE[o.index]['txtdata'])    all_values += ZONE[o.index]['txtdata'];
            html += '<div style="display: none" id="edit_zone_line_current_values_' + o.index + '">' + escape(all_values) + '</div>';
            html += '<div style="display: none" id="edit_zone_line_current_values_' + o.index + '_error"></div>';
			
            html +=	'<table cellpadding="3" cellspacing="0" style="width: 350px; margin: 0px auto" class="dt_module_table">';
			html += 	'<tr>';
			html += 		'<td class="align_right" style="width: 120px">' + LANG.Name + ':</td>';
			html += 		'<td style="width: 150px"><input type="text" id="name_' + o.index + '" /></td>';
			html += 		'<td><div id="name_' + o.index + '_error"></div></td>';
			html += 	'</tr>';
			html += 	'<tr>';
			html += 		'<td class="align_right">TTL:</td>';
			html += 		'<td><input type="text" id="ttl_' + o.index + '" /></td>';
			html += 		'<td><div id="ttl_' + o.index + '_error"></div></td>';
			html += 	'</tr>';
			html += 	'<tr>';
			html += 		'<td class="align_right">Type:</td>';
			html += 		'<td>';
			html +=				'<select id="edit_zone_line_type_' + o.index + '">';
			html +=					'<option selected="selected" value="A">A</option>';
			html +=					'<option value="CNAME">CNAME</option>';
			html +=					'<option value="TXT">TXT</option>';
			html +=				'</select>';
			html +=			'</td>';
			html += 		'<td>&nbsp;</td>';
			html += 	'</tr>';
			html += 	'<tr id="type_A_' + o.index + '">';
			html += 		'<td class="align_right">' + LANG.Address + ':</td>';
			html += 		'<td><input type="text" id="edit_zone_line_address_' + o.index + '" /></td>';
			html += 		'<td><div id="edit_zone_line_address_' + o.index + '_error"></div></td>';
			html +=		'</tr>';
			html +=		'<tr id="type_CNAME_' + o.index + '" style="display: none">';
			html += 		'<td class="align_right">CNAME:</td>';
			html += 		'<td><input type="text" id="cname_' + o.index + '" /></td>';
			html += 		'<td><div id="cname_' + o.index + '_error"></div></td>';
			html += 	'</tr>';
			html += 	'<tr id="type_TXT_' + o.index + '" style="display: none">';
			html += 		'<td class="align_right">TXT Data:</td>';
			html += 		'<td><input type="text" id="txtdata_' + o.index + '" /></td>';
			html += 		'<td><div id="txtdata_' + o.index + '_error"></div></td>';
			html += 	'</tr>';
			html += 	'<tr><td colspan="3" style="text-align: center; padding-top: 12px;">';
			html +=			'<div id="edit_input_' + o.index + '">';
			html +=			'<span class="action_link" id="edit_zone_line_cancel_' + o.index + '">cancel</span> or ';
			html += 		'<input type="button" class="input-button" value="' + LANG.edit_record + '" id="edit_zone_line_confirm_' + o.index + '" /></div>';
			html +=			'<div id="edit_status_' + o.index + '"></div>';
			html +=		'</td></tr>';
			html += '</table>';
		}
		
		if (o.action === 'delete') {
			html += '<center>';
			html +=	LANG.delete_this_record + '<br /><br />';
			html += '<div id="delete_input_' + o.index + '">';
			html +=		'<span class="action_link" id="delete_zone_line_cancel_' + o.index + '">' + CPANEL.lang.cancel + '</span> ' + CPANEL.lang.or + ' ';
			html += 	'<input type="button" class="input-button" id="delete_zone_line_confirm_' + o.index + '" value="' + LANG.Delete + '" />';
			html += '</div>';
			html += '<div id="delete_status_' + o.index + '"></div>';
			html += '</center>';
		}
		
		el.innerHTML = html;
	}
    
    if (o.action == "edit") {
		YAHOO.util.Event.on("edit_zone_line_cancel_" + o.index, "click", toggle_module, o);
		YAHOO.util.Event.on("edit_zone_line_type_" + o.index, "change", toggle_types, o);
        YAHOO.util.Event.on("name_" + o.index, "blur", function () {
			format_dns_name(this);
			EDIT_ZONE_LINE_VALID.name.verify();
		});

		EDIT_ZONE_LINE_VALID = {};
		EDIT_ZONE_LINE_VALID.name = new CPANEL.validate.validator("Name");
		EDIT_ZONE_LINE_VALID.name.add("name_" + o.index, "zone_name", LANG.not_valid_zone_name);
		EDIT_ZONE_LINE_VALID.name.add("name_" + o.index, function() { return validate_unique_cname("name_" + o.index, o.index); }, LANG.cname_must_be_unique + "<br />" + LANG.cname_must_be_unique2);
		EDIT_ZONE_LINE_VALID.name.attach();
		
		EDIT_ZONE_LINE_VALID.ttl = new CPANEL.validate.validator("TTL");
		EDIT_ZONE_LINE_VALID.ttl.add("ttl_" + o.index, "positive_integer", LANG.ttl_positive_integer);
		EDIT_ZONE_LINE_VALID.ttl.attach();

		EDIT_ZONE_LINE_VALID.address = new CPANEL.validate.validator("Address");
		EDIT_ZONE_LINE_VALID.address.add("edit_zone_line_address_" + o.index, function() {
            return validate_address("edit_zone_line_type_" + o.index, "edit_zone_line_address_" + o.index);
        }, LANG.address_valid_ip);
		EDIT_ZONE_LINE_VALID.address.add("edit_zone_line_address_" + o.index, function() {
            return validate_address_no_local_ips("edit_zone_line_type_" + o.index, "edit_zone_line_address_" + o.index);
        }, LANG.address_not_local_ip);		
		EDIT_ZONE_LINE_VALID.address.attach();
		
		EDIT_ZONE_LINE_VALID.cname = new CPANEL.validate.validator("CNAME");
		EDIT_ZONE_LINE_VALID.cname.add("cname_" + o.index, function() {
            return validate_cname("edit_zone_line_type_" + o.index, "cname_" + o.index);
        }, LANG.cname_valid_name);
		EDIT_ZONE_LINE_VALID.cname.attach();
		
		EDIT_ZONE_LINE_VALID.txtdata = new CPANEL.validate.validator("TXT Data");
		EDIT_ZONE_LINE_VALID.txtdata.add("txtdata_" + o.index, function() { return validate_txtdata("edit_zone_line_type_" + o.index, "txtdata_" + o.index); }, LANG.txtdata_valid);
		EDIT_ZONE_LINE_VALID.txtdata.attach();
        
        EDIT_ZONE_LINE_VALID.content_changed = new CPANEL.validate.validator(LANG.content_changed);
        EDIT_ZONE_LINE_VALID.content_changed.add("edit_zone_line_current_values_" + o.index, function() { return content_changed(o.index); }, LANG.must_change_something);
        EDIT_ZONE_LINE_VALID.content_changed.attach();
		
		CPANEL.validate.attach_to_form("edit_zone_line_confirm_" + o.index, EDIT_ZONE_LINE_VALID, function() { edit_zone_line(null, o); });
		
		CPANEL.util.catch_enter(["name_" + o.index, "ttl_" + o.index, "edit_zone_line_address_" + o.index, "cname_" + o.index, "txtdata_" + o.index], "edit_zone_line_confirm_" + o.index);        
        
		YAHOO.util.Dom.get("name_" + o.index).value = YAHOO.util.Dom.get("name_value_" + o.index).innerHTML;
		YAHOO.util.Dom.get("ttl_" + o.index).value = YAHOO.util.Dom.get("ttl_value_" + o.index).innerHTML;
        var type = YAHOO.util.Dom.get("type_value_" + o.index).innerHTML;
		YAHOO.util.Dom.get("edit_zone_line_type_" + o.index).value = type;
		if (type == "A") YAHOO.util.Dom.get("edit_zone_line_address_" + o.index).value = YAHOO.util.Dom.get("value_value_hehe_" + o.index).innerHTML;
		if (type == "CNAME") YAHOO.util.Dom.get("cname_" + o.index).value = YAHOO.util.Dom.get("value_value_hehe_" + o.index).innerHTML;
		if (type == "TXT") YAHOO.util.Dom.get("txtdata_" + o.index).value = YAHOO.util.Dom.get("value_value_hehe_" + o.index).innerHTML;
		toggle_types(null, o);
    }
};

// add event handlers and validation to an input div
var after_show_module = function(o) {
	
	if (o.action === 'edit') {

    }
	
	if (o.action === 'delete') { 
		YAHOO.util.Event.on("delete_zone_line_cancel_" + o.index, "click", toggle_module, o);
		YAHOO.util.Event.on("delete_zone_line_confirm_" + o.index, "click", delete_zone_line, o);
    }
};

// hide validation messages before we hide the module
var before_hide_module = function(o) {
	if (o.action === 'edit') { 
		// hide all validation
		for (var i in EDIT_ZONE_LINE_VALID) {
			if (typeof_validator(EDIT_ZONE_LINE_VALID[i]) === true) {
				EDIT_ZONE_LINE_VALID[i].clear_messages();
			}
		}
    }
};

// restore a module's markup and input fields to their original (blank) values after the module is hidden
var after_hide_module = function(o) {
    OPEN_MODULE = 0;
	if (o.action === 'edit') { 
		// remove any event handlers (includes validation)
		YAHOO.util.Event.purgeElement(o.id, true);
        
        YAHOO.util.Dom.get("name_" + o.index).value = "";
        YAHOO.util.Dom.get("ttl_" + o.index).value = "";
        YAHOO.util.Dom.get("edit_zone_line_address_" + o.index).value = "";
        YAHOO.util.Dom.get("cname_" + o.index).value = "";
        YAHOO.util.Dom.get("txtdata_" + o.index).value = "";
    }
};

// toggle zone line type inputs
var toggle_types = function(e, o) {
	// clear validation messages when switching type
	EDIT_ZONE_LINE_VALID.address.clear_messages();
	EDIT_ZONE_LINE_VALID.cname.clear_messages();
	EDIT_ZONE_LINE_VALID.txtdata.clear_messages();		
	
	var type = YAHOO.util.Dom.get("edit_zone_line_type_" + o.index).value;
	
	if (type == "A") YAHOO.util.Dom.setStyle("type_A_" + o.index, "display", "");
	else YAHOO.util.Dom.setStyle("type_A_" + o.index, "display", "none");
		
	if (type == "CNAME") YAHOO.util.Dom.setStyle("type_CNAME_" + o.index, "display", "");
	else YAHOO.util.Dom.setStyle("type_CNAME_" + o.index, "display", "none");
	
	if (type == "TXT") YAHOO.util.Dom.setStyle("type_TXT_" + o.index, "display", "");
	else YAHOO.util.Dom.setStyle("type_TXT_" + o.index, "display", "none");		
};

// check that the content has changed before we send an edit request
var content_changed = function(index, force_change) {
    var old_content = YAHOO.util.Dom.get("edit_zone_line_current_values_" + index).innerHTML;
	
    var new_content = YAHOO.util.Dom.get("name_" + index).value;
    new_content += YAHOO.util.Dom.get("ttl_" + index).value;
    new_content += YAHOO.util.Dom.get("edit_zone_line_type_" + index).value;    
    new_content += YAHOO.util.Dom.get("edit_zone_line_address_" + index).value;
    new_content += YAHOO.util.Dom.get("cname_" + index).value;
    new_content += YAHOO.util.Dom.get("txtdata_" + index).value;
    new_content = escape(new_content);
    if (force_change) { YAHOO.util.Dom.get("edit_zone_line_current_values_"+index).innerHTML = new_content; }
    return (old_content != new_content);
};

// delete a zone line
var delete_zone_line = function(e, o) {
	var index = o.index;

	// create the API variables
	var api2_call = {
		"cpanel_jsonapi_version" : 2,
		"cpanel_jsonapi_module" : "ZoneEdit",
		"cpanel_jsonapi_func" : "remove_zone_record",
		"domain" : API.domain,
		"line" : ZONE[o.index]['Line']
	};
	
	var reset_module = function() {
		YAHOO.util.Dom.setStyle("delete_input_" + o.index, "display", "block");
		YAHOO.util.Dom.get("delete_status_" + o.index).innerHTML = "";
		toggle_module(null, { "id" : "dnszone_table_delete_div_" + index, "index" : index, "action" : "delete" });
	};
	
	// callback functions
	var callback = {
		success : function(o) {
			try {
				var data = YAHOO.lang.JSON.parse(o.responseText);
				if (data.cpanelresult.error) {
					reset_module();
					CPANEL.widgets.status_bar("status_bar_" + index, "error", CPANEL.lang.Error, data.cpanelresult.error);					
				}
				// remove the record from the table
				else if (data.cpanelresult.data[0].result.status == '1') {
                    API.serialnum = data.cpanelresult.data[0].result.newserial;
                    CPANEL.animate.fade_out( 'info_row_'+index );
                    CPANEL.animate.fade_out( 'module_row_'+index );
				}
				// show error message
				else if (data.cpanelresult.data[0].result.status == '0') {
					reset_module();
					CPANEL.widgets.status_bar("status_bar_" + index, "error", CPANEL.lang.Error, data.cpanelresult.data[0].result.statusmsg);
				}
			}
			// JSON parse error
			catch (e) {
				reset_module();
				CPANEL.widgets.status_bar("status_bar_" + index, "error", CPANEL.lang.json_error, CPANEL.lang.json_parse_failed);
				return;
			}
			
			// error
			if (data.cpanelresult.error) {
				reset_module();
				CPANEL.widgets.status_bar("status_bar_" + index, "error", CPANEL.lang.Error, data.cpanelresult.error);					
			}
			// success, remove the record from the table
			else if (data.cpanelresult.data[0].result.status == '1') {
				API.serialnum = data.cpanelresult.data[0].result.newserial;
				$("#info_row_" + index + ",#module_row_" + index).fadeOut();
                                // refresh to ensure table and backend are syncronized.
                                update_dns_zone();
			}
			// show error message
			else if (data.cpanelresult.data[0].result.status == '0') {
				reset_module();
				CPANEL.widgets.status_bar("status_bar_" + index, "error", CPANEL.lang.Error, data.cpanelresult.data[0].result.statusmsg);
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
	YAHOO.util.Dom.setStyle("delete_input_" + o.index, "display", "none");
	YAHOO.util.Dom.get("delete_status_" + o.index).innerHTML = CPANEL.icons.ajax + " " + LANG.deleting;
};

// edit a zone line
// note: this function only runs after validation has passed
var edit_zone_line = function(e, o) {
	var index = o.index;
        content_changed(o.index, true);
	var name = YAHOO.util.Dom.get("name_" + o.index).value;
	var ttl = YAHOO.util.Dom.get("ttl_" + o.index).value;
	var type = YAHOO.util.Dom.get("edit_zone_line_type_" + o.index).value;

	// create the API variables
	var api2_call = {
		"cpanel_jsonapi_version" : 2,
		"cpanel_jsonapi_module" : "ZoneEdit",
		"cpanel_jsonapi_func" : "edit_zone_record",
		"domain" : API.domain,
		"line" : ZONE[o.index]['Line'],
        "class" : "IN",
        "type" : type,
        "name" : name,
        "ttl" : ttl,
        "serialnum" : API.serialnum
	};
    
    var new_value = null;
    if (type == "A") {
        api2_call.address = YAHOO.util.Dom.get("edit_zone_line_address_" + o.index).value;
        new_value = api2_call.address;
    }
    if (type == "CNAME") {
        api2_call.cname = YAHOO.util.Dom.get("cname_" + o.index).value;
        new_value = api2_call.cname;
    }
    if (type == "TXT") {
        api2_call.txtdata = YAHOO.util.Dom.get("txtdata_" + o.index).value;
        new_value = api2_call.txtdata;        
    }
	
	var reset_module = function() {
		toggle_module(null, { "id" : "dnszone_table_edit_div_" + index, "index" : index, "action" : "edit" });
		YAHOO.util.Dom.setStyle("edit_input_" + index, "display", "block");
		YAHOO.util.Dom.get("edit_status_" + index).innerHTML = '';
	};
	
	// callback functions
	var callback = {
		success : function(o) {
			try {
				var data = YAHOO.lang.JSON.parse(o.responseText);
			}
			catch (e) {
				CPANEL.widgets.status_bar("status_bar_" + index, "error", CPANEL.lang.json_error, CPANEL.lang.json_parse_failed);
				reset_module();
				return;
			}				
			
			if (data.cpanelresult.error) {
				CPANEL.widgets.status_bar("status_bar_" + index, "error", CPANEL.lang.Error, data.cpanelresult.error);
				reset_module();					
			}
			else if (data.cpanelresult.data[0].result.status == '1') {
				CPANEL.widgets.status_bar("status_bar_" + index, "success", LANG.updated_record);
				API.serialnum = data.cpanelresult.data[0].result.newserial;
				YAHOO.util.Dom.get("name_value_" + index).innerHTML = name;
				YAHOO.util.Dom.get("ttl_value_" + index).innerHTML = ttl;
				YAHOO.util.Dom.get("type_value_" + index).innerHTML = type;
				YAHOO.util.Dom.get("value_value_hehe_" + index).innerHTML = new_value;
				reset_module();
			}
			else if (data.cpanelresult.data[0].result.status == '0') {
				CPANEL.widgets.status_bar("status_bar_" + index, "error", CPANEL.lang.Error, data.cpanelresult.data[0].result.statusmsg);
				reset_module();
			}
		},
		
		failure : function(o) {
			CPANEL.widgets.status_bar("status_bar_" + index, "error", CPANEL.lang.ajax_error, CPANEL.lang.ajax_try_again);
			reset_module();
		}
	};
	
	// send the AJAX request
	YAHOO.util.Connect.asyncRequest('GET', CPANEL.urls.json_api(api2_call), callback, '');
	
	// show the ajax loading icon
	YAHOO.util.Dom.setStyle("edit_input_" + index, "display", "none");
	YAHOO.util.Dom.get("edit_status_" + index).innerHTML = CPANEL.icons.ajax + " " + LANG.editing_record;
};

// when a user switches a domain 
var switch_domain = function() {
	var domain = YAHOO.util.Dom.get("domain").value;
	if (domain == "_select_") {
		CPANEL.animate.slide_up('add_record_and_zone_table');
	}
	else {
		CPANEL.animate.slide_down('add_record_and_zone_table');
		API.domain = domain;
		update_dns_zone();
	}
	reset_add_zone_line_form();
};

// function to add a new zone line
var add_new_zone_line = function() {
	var name = YAHOO.util.Dom.get("name").value;
	var ttl = YAHOO.util.Dom.get("ttl").value;
	var type = YAHOO.util.Dom.get("type").value;

	// create the API variables
	var api2_call = {
		cpanel_jsonapi_version : 2,
		cpanel_jsonapi_module  : "ZoneEdit",
		cpanel_jsonapi_func    : "add_zone_record",
		domain  : API.domain,
        "class" : "IN",
        type    : type,
        name    : name,
        ttl     : ttl
	};
    
    if (type == "A") api2_call.address = YAHOO.util.Dom.get("address").value;
    if (type == "CNAME") api2_call.cname = YAHOO.util.Dom.get("cname").value;
    if (type == "TXT") api2_call.txtdata = YAHOO.util.Dom.get("txtdata").value;
	
	// callback functions
	var callback = {
		success : function(o) {
			try {
				var data = YAHOO.lang.JSON.parse(o.responseText);
			}
			catch (e) {
				CPANEL.widgets.status_bar("add_record_status_bar", "error", CPANEL.lang.json_error, CPANEL.lang.json_parse_failed);
				update_dns_zone();
				reset_add_zone_line_form();
				return;
			}
			
			// update the table and display the status
			if (data.cpanelresult.error) {
				CPANEL.widgets.status_bar("add_record_status_bar", "error", CPANEL.lang.Error, data.cpanelresult.error);
			}
			else if (data.cpanelresult.data[0].result.status == '1') {
				CPANEL.widgets.status_bar("add_record_status_bar", "success", LANG.added_record);
				update_dns_zone();
			}
			else if (data.cpanelresult.data[0].result.status == '0') {
				CPANEL.widgets.status_bar("add_record_status_bar", "error", CPANEL.lang.Error, data.cpanelresult.data[0].result.statusmsg);
			}
			else {
				CPANEL.widgets.status_bar("add_record_status_bar", "error", CPANEL.lang.Error, LANG.unknown_error);
			}
			reset_add_zone_line_form();
		},
		failure : function(o) {
			CPANEL.widgets.status_bar("add_record_status_bar", "error", CPANEL.lang.ajax_error, CPANEL.lang.ajax_try_again);
			update_dns_zone();
			reset_add_zone_line_form();			
		}
	};
	
	// send the AJAX request
	YAHOO.util.Connect.asyncRequest('GET', CPANEL.urls.json_api(api2_call), callback, '');
	
	// show the ajax loading icon
	YAHOO.util.Dom.setStyle("add_new_zone_line_submit", "display", "none");
	YAHOO.util.Dom.get("add_new_zone_line_status").innerHTML = CPANEL.icons.ajax + " " + LANG.adding_record;
};

// page initialization
var init_dns_zone = function() {
	// initialize the API variables
	API = {
		"cpanel_jsonapi_version" : 2,
		"cpanel_jsonapi_module" : "ZoneEdit",
		"cpanel_jsonapi_func" : "fetchzone",		
		"domain" : YAHOO.util.Dom.get("domain").value
	};
	
	CPANEL.util.catch_enter(["name", "ttl", "address", "cname", "txtdata"], "submit");
	
	// add an event handler on the domain select
	if (YAHOO.util.Dom.inDocument("domain_select_exists") == true) {
		YAHOO.util.Event.on("domain", "change", switch_domain);
	}
	else {
		update_dns_zone();
	}
};
YAHOO.util.Event.onDOMReady(init_dns_zone);

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
