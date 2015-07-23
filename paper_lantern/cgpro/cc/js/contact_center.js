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
    // callback functions
    var success = function(o) {
	var data = $.parseJSON(o);
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
	    ACCOUNTS = Object.keys(data.accounts).map(function(k) { return data.accounts[k] });
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
    $("#table_loading").html(" " + CPANEL.icons.ajax + " Please, wait...");
};

var EnableCC = function (domain) {
    var api2_call = {
	"cpanel_jsonapi_version": 2,
	"cpanel_jsonapi_module": "CommuniGate",
	"cpanel_jsonapi_func": "CC_Enable",
	"domain": domain
    };
    // callback functions
    var success = function(o) {
	$("#enabling_loading").html("");
	var data = $.parseJSON(o);
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
    $("#enabling_loading").html(" " + CPANEL.icons.ajax + " Please, wait...");
};

var DisableCC = function (domain) {
    var api2_call = {
	"cpanel_jsonapi_version": 2,
	"cpanel_jsonapi_module": "CommuniGate",
	"cpanel_jsonapi_func": "CC_Disable",
	"domain": domain
    };
    // callback functions
    var success = function(o) {
	$("#disabling_loading").html("");
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
    $("#disabling_loading").html(" " + CPANEL.icons.ajax + " Please, wait...");
};

var CCStatus = function (domain) {
    var api2_call = {
	"cpanel_jsonapi_version": 2,
	"cpanel_jsonapi_module": "CommuniGate",
	"cpanel_jsonapi_func": "CC_Status",
	"domain": domain
    };
    // callback functions
    var success = function(o) {
	var data = $.parseJSON(o);
	if (data.cpanelresult.data[0]) {
	    data = data.cpanelresult.data[0];
	    if (data.enabled == "YES") {
		$("#status_loading").html("");
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
    $("#status_loading").html(" " + CPANEL.icons.ajax + " Please, wait...");
};

var CC_CheckEnabled = function () {
    var api2_call = {
	"cpanel_jsonapi_version": 2,
	"cpanel_jsonapi_module": "CommuniGate",
	"cpanel_jsonapi_func": "CC_CheckEnabled"
    };
    // callback functions
    var success = function(o) {
	$("#status_loading").html("");
	var data = $.parseJSON(o);
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
};

var loadTable = function () {
    var html = new EJS({url: 'contact_center.ejs'}).render();
    $("#accounts_table_div").html(html);
    $("#table_loading").html("");
    $(".btn_set_administrator").click(function(e){
    	    var caller = $(this).parent().parent().find("td:first-child").text().trim();
    	    CC_UpdateAdministrator(caller, "set");
    	});
    $(".btn_unset_administrator").click(function(e){
    	    var caller = $(this).parent().parent().find("td:first-child").text();
    	    caller = caller.split("(");
    	    caller = caller[0].trim();
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
