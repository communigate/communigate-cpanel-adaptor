var ACCOUNTS;
var DOMAINS;
var ENABLED = 0;
var CCLIMIT = 0;

var GetCCLimit = function (domain) {
    var api2_call = {
	"cpanel_jsonapi_version": 2,
	"cpanel_jsonapi_module": "CommuniGate",
	"cpanel_jsonapi_func": "CC_GetCCLimit",
	"domain": domain
    };
    var data;
    var domain_dot_pos = domain.lastIndexOf(".");
    var domain_username = domain.substring(0, domain_dot_pos);
    // callback functions
    var success = function(o) {
	data = $.parseJSON(o);
	if (data.cpanelresult.data[0]) {
	    data = data.cpanelresult.data[0];
	    CCLIMIT = data;
	}
	CC_CheckEnabled();
    }
    // send the AJAX request
    $.ajax({
	    type: "POST",
	    url: CPANEL.urls.json_api(),
	    data: api2_call,
	    success: success,
	    dataType: "text"
	});
};    

var GetAccounts = function() {
    var api2_call = {
	"cpanel_jsonapi_version": 2,
	"cpanel_jsonapi_module": "CommuniGate",
	"cpanel_jsonapi_func": "ListAccounts",
	"classes": "1",
    };
    // callback functions
    var success = function(o) {
	var data = $.parseJSON(o);
	if (data.cpanelresult.data[0]) {
	    data = data.cpanelresult.data[0];
	    ACCOUNTS = data.accounts;
	    CLASSES = data.classes;
	    loadTable();
	}
    }
    // send the AJAX request
    $.ajax({
	    type: "POST",
	    url: CPANEL.urls.json_api(),
	    data: api2_call,
	    success: success,
	    dataType: "text"
	});
    YAHOO.util.Dom.get(table_loading).innerHTML = " " + CPANEL.icons.ajax + " Please, wait...";
    $("#accounts_table").remove();
};

var EnableCC = function (domain) {
    var api2_call = {
	"cpanel_jsonapi_version": 2,
	"cpanel_jsonapi_module": "CommuniGate",
	"cpanel_jsonapi_func": "CC_Enable",
	"domain": domain
    };
    var data;
    var domain_dot_pos = domain.lastIndexOf(".");
    var domain_username = domain.substring(0, domain_dot_pos);
    // callback functions
    var success = function(o) {
	YAHOO.util.Dom.get(enabling_loading).innerHTML = "";
	data = $.parseJSON(o);
	$("#enabled_cc").show();
	$("#disabled_cc").hide();
	GetAccounts();	
    }
    // send the AJAX request
    $.ajax({
	    type: "POST",
	    url: CPANEL.urls.json_api(),
	    data: api2_call,
	    success: success,
	    dataType: "text"
	});
    YAHOO.util.Dom.get(enabling_loading).innerHTML = " " + CPANEL.icons.ajax + " Please, wait...";
};

var DisableCC = function (domain) {
    var api2_call = {
	"cpanel_jsonapi_version": 2,
	"cpanel_jsonapi_module": "CommuniGate",
	"cpanel_jsonapi_func": "CC_Disable",
	"domain": domain
    };
    var data;
    // callback functions
    var success = function(o) {
	YAHOO.util.Dom.get(disabling_loading).innerHTML = "";
	$("#enabled_cc").hide();
	$("#disabled_cc").show();
	$("#accounts_table").remove();
    }
    // send the AJAX request
    $.ajax({
	    type: "POST",
	    url: CPANEL.urls.json_api(),
	    data: api2_call,
	    success: success,
	    dataType: "text"
	});
    YAHOO.util.Dom.get(disabling_loading).innerHTML = " " + CPANEL.icons.ajax + " Please, wait...";
};

var CCStatus = function (domain) {
    var api2_call = {
	"cpanel_jsonapi_version": 2,
	"cpanel_jsonapi_module": "CommuniGate",
	"cpanel_jsonapi_func": "CC_Status",
	"domain": domain
    };
    var data;
    // callback functions
    var success = function(o) {
	data = $.parseJSON(o);
	if (data.cpanelresult.data[0]) {
	    data = data.cpanelresult.data[0];
	    if (data.enabled == "YES") {
		YAHOO.util.Dom.get(status_loading).innerHTML = "";
		$("#enabled_cc").show();
		GetAccounts();
	    }
	    else {
		GetCCLimit(domain);		
	    }
	}
    }
    // send the AJAX request
    $.ajax({
	    type: "POST",
	    url: CPANEL.urls.json_api(),
	    data: api2_call,
	    success: success,
	    dataType: "text"
	});
    YAHOO.util.Dom.get(status_loading).innerHTML = " " + CPANEL.icons.ajax + " Please, wait...";
};

var CC_CheckEnabled = function () {
    var api2_call = {
	"cpanel_jsonapi_version": 2,
	"cpanel_jsonapi_module": "CommuniGate",
	"cpanel_jsonapi_func": "CC_CheckEnabled"
    };
    var data;
    // callback functions
    var success = function(o) {
	YAHOO.util.Dom.get(status_loading).innerHTML = "";
	data = $.parseJSON(o);
	if (data.cpanelresult.data[0]) {
	    ENABLED = data.cpanelresult.data[0].enabled;
	}
	if (ENABLED < CCLIMIT) {
	    $("#disabled_cc").show();
	}
	else {
	    $("#enabled_error").show();
	}
    }
    // send the AJAX request
    $.ajax({
	    type: "POST",
	    url: CPANEL.urls.json_api(),
	    data: api2_call,
	    success: success,
	    dataType: "text"
	});
};
	
var CC_UpdateAdministrator = function (account, action) {
    var api2_call = {
	"cpanel_jsonapi_version": 2,
	"cpanel_jsonapi_module": "CommuniGate",
	"cpanel_jsonapi_func": "CC_UpdateAdministrator",
	"account": account,
	"action": action
    };
    var data;
    // callback functions
    var success = function(o) {
	GetAccounts();
    }
    // send the AJAX request
    $.ajax({
	    type: "POST",
	    url: CPANEL.urls.json_api(),
	    data: api2_call,
	    success: success,
	    dataType: "text"
	});
    var selector_loading = "#loading_" + account.split("@")[0];
    $(selector_loading).html(" " + CPANEL.icons.ajax + " Please, wait...");
    // YAHOO.util.Dom.get(selector_loading).innerHTML = " " + CPANEL.icons.ajax + " Please, wait...";
};

var loadTable = function () {
    $("#accounts_table").remove();
    var is_sip_acc = false;
    var is_result = false;
    var table = $("<table></table>").addClass("table table-striped");
    table.attr("id","accounts_table");
    var thead = $("<thead></thead>");
    var thead_tr = $("<tr></tr>");
    var th1 = $("<th></th>").text("Account");
    var th2 = $("<th></th>").text("Functions");
    thead_tr.append(th1);
    thead_tr.append(th2);
    thead.append(thead_tr);
    var colgroup = $("<colgroup></colgroup>");
    var col1 = $("<col></col>").attr("align","left").attr("width","50%");
    var col2 = $("<col></col>").attr("align","left").attr("width","50%");
    colgroup.append(col1);
    colgroup.append(col2);
    table.append(colgroup);
    table.append(thead);
    for (var acc in ACCOUNTS) {
	is_sip_acc = false;
	var acc_split = acc.split("@");
	acc_domain = acc_split[1];
	acc_name = acc_split[0];
	var acc_modes_str = "";
	if (ACCOUNTS[acc].data.AccessModes instanceof Array) {
	    acc_modes_str = ACCOUNTS[acc].data.AccessModes.join(",");
	} else {
	    acc_modes_str = ACCOUNTS[acc].data.AccessModes;
	}
	if (acc_domain == domain && acc_modes_str && ( acc_modes_str.indexOf("SIP") > -1 || acc_modes_str == "All") ) {
	    is_sip_acc = true;
	    is_result = true;
	    }
	
	if (acc_domain == domain && is_sip_acc) {
	    var row = $('<tr></tr>').addClass('accRow');
	    var td1 = $('<td></td>').text(acc);
	    var td2 = $('<td></td>');
	    if (ACCOUNTS[acc].rights.join(",").indexOf("Domain") > -1 && ACCOUNTS[acc].rights.join(",").indexOf("BasicSettings") > -1 && ACCOUNTS[acc].rights.join(",").indexOf("PSTNSettings") > -1 && ACCOUNTS[acc].rights.join(",").indexOf("CanCreateAccounts") > -1 && ACCOUNTS[acc].rights.join(",").indexOf("CanCreateAliases") > -1 && ACCOUNTS[acc].rights.join(",").indexOf("CanCreateNamedTasks") > -1 && ACCOUNTS[acc].rights.join(",").indexOf("CanAccessWebSites") > -1) {
		td1.append("<span> (Administrator)</span>");
		td2.html('<a class="btn_unset_administrator">Unset as administrator</a><span id="loading_' + acc_name + '"></span>');
	    }
	    else {
		td2.html('<a class="btn_set_administrator">Set as administrator</a><span id="loading_' + acc_name + '"></span>');
	    }
	    row.append(td1);
	    row.append(td2);
	    table.append(row);
	}
	$("#accountsTable").append(table);
	YAHOO.util.Dom.get(table_loading).innerHTML = " ";
    }
    if (is_result == false) {	
	var row = $('<tr></tr>');
	var td1 = $('<td></td>').text("No accounts!");
	var td2 = $('<td></td>');
	row.append(td1);
	row.append(td2);
	table.append(row);
    }
    $(".btn_set_administrator").click(function(e){
	    var caller = $(this).parent().parent().find("td:first-child").text();
	    CC_UpdateAdministrator(caller, "set");
	});
    $(".btn_unset_administrator").click(function(e){
	    var caller = $(this).parent().parent().find("td:first-child").text();
	    caller = caller.split("(");
	    caller = caller[0];
	    CC_UpdateAdministrator(caller, "unset");
	});
};


function getUrlParameter(sParam)
{
    var sPageURL = window.location.search.substring(1);
    var sURLVariables = sPageURL.split('&');
    for (var i = 0; i < sURLVariables.length; i++) {
	var sParameterName = sURLVariables[i].split('=');
	if (sParameterName[0] == sParam) 
	    {
		return sParameterName[1];
	    }
    }
};    
var domain = getUrlParameter('domain');

$("#btn_enable").click(function(e){
	EnableCC(domain);
    });
$("#btn_disable").click(function(e){
	DisableCC(domain);
    });

CCStatus(domain);
