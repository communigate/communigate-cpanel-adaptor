var ACCOUNTS;
var ENABLED;
var DOMAINS;
var ALREADY_ENABLED = 0;
var CCLIMIT;

var SetDomainSignalRules = function(domain) {
    var api2_call = {
	"cpanel_jsonapi_version": 2,
	"cpanel_jsonapi_module": "CommuniGate",
        "cpanel_jsonapi_func": "SetDomainSignalRules",
	"domain" : domain
    };
    // callback functions
    var success = function(o) {
	YAHOO.util.Dom.get("enabling_loading").innerHTML = "";
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

    // show the ajax loading icon
    YAHOO.util.Dom.get("enabling_loading").innerHTML = CPANEL.icons.ajax + " Please, wait...";
};

var UnsetDomainSignalRules = function(domain) {
    var api2_call = {
	"cpanel_jsonapi_version": 2,
	"cpanel_jsonapi_module": "CommuniGate",
        "cpanel_jsonapi_func": "UnsetDomainSignalRules",
	"domain": domain
    };
    // callback functions
    var success = function(o) {
	YAHOO.util.Dom.get("disabling_loading").innerHTML = "";
	$("#enabled_cc").hide();
	$("#disabled_cc").show();
	$("#accounts_table").hide();
    }

    // send the AJAX request
    $.ajax({
	    type: "POST",
	    url: CPANEL.urls.json_api(),
	    data: api2_call,
	    success: success,
	    dataType: "text"
	});

    // show the ajax loading icon
    YAHOO.util.Dom.get("disabling_loading").innerHTML = CPANEL.icons.ajax + " Please, wait...";
};

var SetServerSignalRules = function(domain) {
    var api2_call = {
	"cpanel_jsonapi_version": 2,
	"cpanel_jsonapi_module": "CommuniGate",
        "cpanel_jsonapi_func": "SetServerSignalRules",
	"domain" : domain
    };
    // callback functions
    var success = function(o) {
	YAHOO.util.Dom.get("enabling_loading").innerHTML = "";
	SetDomainSignalRules(domain);
    }

    // send the AJAX request
    $.ajax({
	    type: "POST",
	    url: CPANEL.urls.json_api(),
	    data: api2_call,
	    success: success,
	    dataType: "text"
	});

    // show the ajax loading icon
    YAHOO.util.Dom.get("enabling_loading").innerHTML = CPANEL.icons.ajax + " Please, wait...";
};

var UnsetServerSignalRules = function() {
    var api2_call = {
	"cpanel_jsonapi_version": 2,
	"cpanel_jsonapi_module": "CommuniGate",
        "cpanel_jsonapi_func": "UnsetServerSignalRules"
    };
    // callback functions
    var success = function(o) {
	YAHOO.util.Dom.get("disabling_loading").innerHTML = "";
	$("#enabled_cc").hide();
	$("#disabled_cc").show();
    }

    // send the AJAX request
    $.ajax({
	    type: "POST",
	    url: CPANEL.urls.json_api(),
	    data: api2_call,
	    success: success,
	    dataType: "text"
	});

    // show the ajax loading icon
    YAHOO.util.Dom.get("disabling_loading").innerHTML = CPANEL.icons.ajax + " Please, wait...";
};

var CreatePbxAccount = function(domain) {
    var api2_call = {
	"cpanel_jsonapi_version": 2,
	"cpanel_jsonapi_module": "CommuniGate",
        "cpanel_jsonapi_func": "CreatePbxAccount",
	"domain" : domain
    };
    // callback functions
    var success = function(o) {
	YAHOO.util.Dom.get("enabling_loading").innerHTML = "";
	SetPbxRights(domain);
    }
    // send the AJAX request
    $.ajax({
	    type: "POST",
	    url: CPANEL.urls.json_api() + '&' + $.param(api2_call),
	    data: api2_call,
	    success: success,
	    dataType: "text"
	});

    // show the ajax loading icon
    YAHOO.util.Dom.get("enabling_loading").innerHTML = CPANEL.icons.ajax + " Please, wait...";
};

var SetPbxRights = function(domain) {
    var api2_call = {
	"cpanel_jsonapi_version": 2,
	"cpanel_jsonapi_module": "CommuniGate",
        "cpanel_jsonapi_func": "SetPbxRights",
	"domain" : domain
    };
    // callback functions
    var success = function(o) {
	YAHOO.util.Dom.get("enabling_loading").innerHTML = "";
	SetDomainSignalRules(domain);
    }

    // send the AJAX request
    $.ajax({
	    type: "POST",
	    url: CPANEL.urls.json_api(),
	    data: api2_call,
	    success: success,
	    dataType: "text"
	});

    // show the ajax loading icon
    YAHOO.util.Dom.get("enabling_loading").innerHTML = CPANEL.icons.ajax + " Please, wait...";
};

var CCStatus = function(domain) {
    var api2_call = {
	"cpanel_jsonapi_version": 2,
	"cpanel_jsonapi_module": "CommuniGate",
        "cpanel_jsonapi_func": "CCStatus",
	"domain": domain
    };
    // callback functions
    var success = function(o) {
	var data = $.parseJSON(o);

	if (data.cpanelresult.data[0]) {
	    data = data.cpanelresult.data[0]
	    var pbx_account = false;
	    if (data.account_prefs && data.account_prefs.AccountName && data.account_prefs.AccountName == "pbx@" + domain) {
		pbx_account = true;
	    }
	    
	    var account_rights = false;
	    var account_rights_str = JSON.stringify(data.account_rights);
	    if (account_rights_str && account_rights_str == "[\"Domain\",\"BasicSettings\",\"CanCreateNamedTasks\",\"CanAccessWebSites\",\"CanCreateAliases\",\"CanImpersonate\"]") {
		account_rights = true;
	    }

	    var domain_rules = false;
	    for (var i=0; i < data.domain_rules.length; i++ ) {
		var domain_rules_str = JSON.stringify(data.domain_rules[i]);
		var compar = "[\"100010\",\"ccIn_" + domain + "\",[[\"Method\",\"is\",\"INVITE\"],[\"RequestURI\",\"is not\",\"*;fromCC=true\"]],[[\"Redirect to\",\"ccincoming#pbx\"],[\"Stop Processing\"]]]";
	
		if (domain_rules_str && domain_rules_str == compar) {
		    domain_rules = true;
		}
	    }
	    
	    // YAHOO.util.Dom.get("status_loading").innerHTML = "";
	    YAHOO.util.Dom.get("enabling_loading").innerHTML = "";
	    
	    if (pbx_account, account_rights, domain_rules) {
		$("#enabled_cc").show();
		ENABLED = true;
		GetAccounts();
		YAHOO.util.Dom.get("status_loading").innerHTML = "";
	    }
	    else {
		// $("#disabled_cc").show();
		ENABLED = false;
		GetAllDomains();
	    }
	}
	else {
	    // YAHOO.util.Dom.get("status_loading").innerHTML = "";
	    // YAHOO.util.Dom.get("enabling_loading").innerHTML = "";
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

    // show the ajax loading icon
    YAHOO.util.Dom.get("enabling_loading").innerHTML = CPANEL.icons.ajax + " Please, wait...";
    YAHOO.util.Dom.get("status_loading").innerHTML = CPANEL.icons.ajax + " Please, wait...";
};

var GetAllDomains = function () {
    var api2_call = {
	"cpanel_jsonapi_version": 2,
	"cpanel_jsonapi_module": "Email",
	"cpanel_jsonapi_func": "listmaildomains"
    };
    var data;
    // callback functions
    var success = function(o) {
	data = $.parseJSON(o);
	if (data.cpanelresult.data) {
	    DOMAINS = data.cpanelresult.data;
	    CheckIfCCActivated();
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
}

var GetDomainRules = function (domain) {
    var api2_call = {
	"cpanel_jsonapi_version": 2,
	"cpanel_jsonapi_module": "CommuniGate",
	"cpanel_jsonapi_func": "GetDomainSignalRules",
	"domain": domain
    };
    var data;
    // callback functions
    var success = function(o) {
	// data = $.parseJSON(o);
	// if (data.cpanelresult.data) {
	//     DOMAINS = data.cpanelresult.data;
	//     CheckIfCCActivated();
	// }
    }
    // send the AJAX request
    $.ajax({
	    type: "POST",
	    url: CPANEL.urls.json_api(),
	    data: api2_call,
	    success: success,
	    dataType: "text"
	});
}

var GetCCLimit = function () {
    var api2_call = {
	"cpanel_jsonapi_version": 2,
	"cpanel_jsonapi_module": "CommuniGate",
	"cpanel_jsonapi_func": "GetCCLimit"
    };
    var data;
    // callback functions
    var success = function(o) {
	data = $.parseJSON(o);
	if (data.cpanelresult.data[0]) {
	    data = data.cpanelresult.data[0];
	    if (data.cc_limit) {
		CCLIMIT = data.cc_limit.CommuniGate.contact_center.all;
		CCStatus(domain);
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
}

var CheckIfCCActivated = function () {
    ALREADY_ENABLED = 0;
    var counter = 0;
    var CCStatusForDomain = function() {
	$("#enabled_error").hide();
	var api2_call = {
	    "cpanel_jsonapi_version": 2,
	    "cpanel_jsonapi_module": "CommuniGate",
	    "cpanel_jsonapi_func": "CCStatus",
	    "domain": DOMAINS[counter]["domain"]
	};
	// callback functions
	var success = function(o) {
	    var data = $.parseJSON(o);
	    if (data.cpanelresult.data[0]) {
	    	data = data.cpanelresult.data[0];
		
		for (var i=0; i < data.domain_rules.length; i++ ) {
		    var domain_rules = false;
		    var domain_rules_str = JSON.stringify(data.domain_rules[i]);
		    console.log(domain_rules_str);
		    var compar = "[\"100010\",\"ccIn_" + DOMAINS[counter]["domain"] + "\",[[\"Method\",\"is\",\"INVITE\"],[\"RequestURI\",\"is not\",\"*;fromCC=true\"]],[[\"Redirect to\",\"ccincoming#pbx\"],[\"Stop Processing\"]]]";
		    if (domain_rules_str && domain_rules_str == compar) {
			domain_rules = true;
		    }
		    if (domain_rules) {
			ALREADY_ENABLED += 1;
		    }
		}
	    
		counter += 1;
		if (counter < DOMAINS.length) {
		CCStatusForDomain();
		}

		if (ALREADY_ENABLED < CCLIMIT && counter >= DOMAINS.length) {
		    YAHOO.util.Dom.get("status_loading").innerHTML = "";
		    $("#disabled_cc").show();
		    $("#enabled_error").hide();
		}
		if (ALREADY_ENABLED >= CCLIMIT) {
		    YAHOO.util.Dom.get("status_loading").innerHTML = "";
		    $("#enabled_error").show();
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
	// show the ajax loading icon
	// YAHOO.util.Dom.get("enabling_loading").innerHTML = CPANEL.icons.ajax + " Please, wait...";
	// YAHOO.util.Dom.get("status_loading").innerHTML = CPANEL.icons.ajax + " Please, wait...";
    };
    CCStatusForDomain();
};

var GetAccounts = function(domain) {
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
	    data = data.cpanelresult.data[0]
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
	    SetAdministrator(caller);
	});
    $(".btn_unset_administrator").click(function(e){
	    var caller = $(this).parent().parent().find("td:first-child").text();
	    caller = caller.split("(");
	    caller = caller[0];
	    UnsetAdministrator(caller);
	});
}

var SetAdministrator = function(account) {
    var api2_call = {
	"cpanel_jsonapi_version": 2,
	"cpanel_jsonapi_module": "CommuniGate",
        "cpanel_jsonapi_func": "SetAdministrator",
	"account" : account
    };
    // callback functions
    var success = function(o) {
	GetAccounts(domain);
    }
    // send the AJAX request
    $.ajax({
	    type: "POST",
	    url: CPANEL.urls.json_api(),
	    data: api2_call,
	    success: success,
	    dataType: "text"
	});

    // show the ajax loading icon
    var span_loading = 'loading_' + account.split("@")[0];
    YAHOO.util.Dom.get(span_loading).innerHTML = " " + CPANEL.icons.ajax + " Please, wait...";
};

var UnsetAdministrator = function(account) {
    var api2_call = {
	"cpanel_jsonapi_version": 2,
	"cpanel_jsonapi_module": "CommuniGate",
        "cpanel_jsonapi_func": "UnsetAdministrator",
	"account" : account
    };
    // callback functions
    var success = function(o) {
	GetAccounts(domain);
    }
    // send the AJAX request
    $.ajax({
	    type: "POST",
	    url: CPANEL.urls.json_api(),
	    data: api2_call,
	    success: success,
	    dataType: "text"
	});
    // show the ajax loading icon
    var span_loading = 'loading_' + account.split("@")[0];
    YAHOO.util.Dom.get(span_loading).innerHTML = " " + CPANEL.icons.ajax + " Please, wait...";
};

var RemoveAllAdmins = function(account) {
    var admins_arr = [];
    for (var acc in ACCOUNTS) {
	if (ACCOUNTS[acc].rights.join(",").indexOf("Domain") > -1 && ACCOUNTS[acc].rights.join(",").indexOf("BasicSettings") > -1 && ACCOUNTS[acc].rights.join(",").indexOf("PSTNSettings") > -1 && ACCOUNTS[acc].rights.join(",").indexOf("CanCreateAccounts") > -1 && ACCOUNTS[acc].rights.join(",").indexOf("CanCreateAliases") > -1 && ACCOUNTS[acc].rights.join(",").indexOf("CanCreateNamedTasks") > -1 && ACCOUNTS[acc].rights.join(",").indexOf("CanAccessWebSites") > -1) {
	    admins_arr.push(acc);
	}
    }
    var counter = 0;
    var RemoveAdmin = function (account) {
    	var api2_call = {
    	    "cpanel_jsonapi_version": 2,
    	    "cpanel_jsonapi_module": "CommuniGate",
    	    "cpanel_jsonapi_func": "UnsetAdministrator",
    	    "account" : account
    	};
    	// callback functions
    	var success = function(o) {
	    YAHOO.util.Dom.get("disabling_loading").innerHTML = "";
	    counter += 1;
	    if (counter < admins_arr.length) {
		RemoveAdmin(admins_arr[counter]);
	    }
	    if (counter >= admins_arr.length) {
		UnsetDomainSignalRules(domain);
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
    	// show the ajax loading icon
	YAHOO.util.Dom.get("disabling_loading").innerHTML = CPANEL.icons.ajax + " Please, wait...";
    }
    if (admins_arr[0]) {
	RemoveAdmin(admins_arr[0]);
    }
    if (admins_arr.length == 0) {
	UnsetDomainSignalRules(domain);
    }
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
}    

var domain = getUrlParameter('domain');
GetCCLimit();
GetDomainRules(domain);

YAHOO.util.Dom.get("status_loading").innerHTML = CPANEL.icons.ajax + " Please, wait...";

$("#btn_enable").click(function(e){
	CreatePbxAccount(domain);
    });
$("#btn_disable").click(function(e){
	RemoveAllAdmins();
    });

