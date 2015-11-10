// Globals
var domains;

var get_domains = function (domain) {
    var api2_call = {
        "cpanel_jsonapi_version": 2,
        "cpanel_jsonapi_module": "Email",
        "cpanel_jsonapi_func": "listmaildomains"
    };
    // callback
    var success = function (res) {
	var data = JSON.parse(res);
	domains = data.cpanelresult.data;

	get_extensions_for_pstn(domains[0].domain);
    };
    // send the request
    $.ajax({
	    type: "GET",
		url: CPANEL.urls.json_api() + '&' + $.param(api2_call),
		success: success
	});
};
get_domains();

var get_accounts = function () {
    var api2_call = {
        "cpanel_jsonapi_version": 2,
        "cpanel_jsonapi_module": "CommuniGate",
        "cpanel_jsonapi_func": "ListAccounts"
    };
    // callback
    var success = function (res) {
	var data = JSON.parse(res);
	var accounts = data.cpanelresult.data[0].accounts;
	accounts = Object.keys(accounts).map(function(k) { return accounts[k] });
	list_rsip(accounts);
    };
    // send the request
    $.ajax({
	    type: "GET",
		url: CPANEL.urls.json_api() + '&' + $.param(api2_call),
		success: success
	});
};
get_accounts();

function list_rsip (accounts, selected) {
    var account;
    if (selected) {
	account = selected;
    } else {
	account = accounts[0].username + "@" + accounts[0].domain;
	selected = accounts[0].username + "@" + accounts[0].domain;
    }
    var api2_call = {
        "cpanel_jsonapi_version": 2,
        "cpanel_jsonapi_module": "CommuniGate",
        "cpanel_jsonapi_func": "ListRSIP",
	"account": account
    };
    // callback
    var success = function (res) {
	var data = JSON.parse(res);
	var rsip_data = data.cpanelresult.data[0];
	var html_sip_registration = new EJS({url: 'sip_registration.ejs'}).render({"accounts": accounts, "rsip_data": rsip_data, "selected": selected});
	$("#sip_registration").html(html_sip_registration);	
	$("#sip_account").change(function(){
		list_rsip(accounts, $(this).val());
	    });

	$("#add_sip_registration").click(function() {
		var url = "add_rsip.html?account=" + $("#sip_account").val();
		console.log(url);
		window.location = url;
	    });

	$(".delete_rsip").click(function() {
		if (confirm("Are you sure you want to delete " + $(this).val() + "?")) {
		    delete_rsip_account($("#sip_account").val(), $(this).val(), $(this).nextAll(".delete_loading"), accounts, selected);
		}
	    });
	$(".set_outgoing").click(function() {
		set_outgoing($("#sip_account").val(), $(this).val(), $(this).nextAll(".delete_loading"), accounts, selected);
	    });
	$(".unset_outgoing").click(function() {
		unset_outgoing($("#sip_account").val(), $(this).nextAll(".delete_loading"), accounts, selected);
	    });
    };
    // send the request
    $.ajax({
	    type: "GET",
		url: CPANEL.urls.json_api() + '&' + $.param(api2_call),
		success: success
	});
};

function get_extensions_for_pstn (domain) {
    var api2_call = {
        "cpanel_jsonapi_version": 2,
        "cpanel_jsonapi_module": "CommuniGate",
        "cpanel_jsonapi_func": "GetExtensionsForPSTN",
	"domain": domain
    };
    // callback
    var success = function (res) {
	var data = JSON.parse(res);
	var extensions_for_domain = data.cpanelresult.data[0];
	var html_assign_to_domain = new EJS({url: 'assign_to_domain_template.ejs'}).render({"domains": domains, "selected_domain": domain, "extensions": extensions_for_domain});
	$("#assign_to_domain_wrap").html(html_assign_to_domain);	

	// On domain change reload avaiable extensions 
	$("#domain").change(function(){
		$('#domain_extension').attr('disabled', 'disabled');
		get_extensions_for_pstn($(this).val());
	    });
	$("#assign_to_domain").click(function() {
		set_extensions_for_pstn();
	    });
    };
    // send the request
    $.ajax({
	    type: "GET",
		url: CPANEL.urls.json_api() + '&' + $.param(api2_call),
		success: success
	});
};

function set_extensions_for_pstn () {
    var api2_call = {
        "cpanel_jsonapi_version": 2,
        "cpanel_jsonapi_module": "CommuniGate",
        "cpanel_jsonapi_func": "SetDomainPSTN",
	"domain": $("#domain").val(),
	"extension": $("#domain_extension").val()
    };
    // callback
    var success = function (res) {
    	var data = JSON.parse(res);
	if (data.cpanelresult.event.result == "1") {
	    $("#assign_to_domain_loading").html("Success assigning number!");
	} else {
	    $("#assign_to_domain_loading").html("Error assigning number!");
	}
    };
    $("#assign_to_domain_loading").html(CPANEL.icons.ajax + " Loading...");
    // send the request
    $.ajax({
    	    type: "GET",
    		url: CPANEL.urls.json_api() + '&' + $.param(api2_call),
    		success: success
    	});
};

function get_account_extensions (domain) {
    var api2_call = {
        "cpanel_jsonapi_version": 2,
        "cpanel_jsonapi_module": "CommuniGate",
        "cpanel_jsonapi_func": "GetExtensions",
	"domain": domain
    };
    // callback
    var success = function (res) {
	var data = JSON.parse(res);
	var account_extensions = data.cpanelresult.data;
	
	var html_assign_phone_number_did_extensions = new EJS({url: 'assign_phone_number_did_extensions_template.ejs'}).render({"account_extensions": account_extensions});
	$("#account_extensions_wrap").html(html_assign_phone_number_did_extensions);	
    };
    // send the request
    $.ajax({
	    type: "GET",
		url: CPANEL.urls.json_api() + '&' + $.param(api2_call),
		success: success
	});
};

function get_assign_extension () {
    var api2_call = {
        "cpanel_jsonapi_version": 2,
        "cpanel_jsonapi_module": "CommuniGate",
        "cpanel_jsonapi_func": "AssignExtension"
    };
    // callback
    var success = function (res) {
	var data = JSON.parse(res);
	data = data.cpanelresult.data[0];
	var accounts = data.accounts;
	var classes = data.classes;
	var departments = data.departments;
	var ivrs = data.ivrs;
	var queues = data.queues;
	for (var class_ in classes) {
	    if ($.isArray(classes[class_].AccessModes)) {
		classes[class_].AccessModes = classes[class_].AccessModes.join(", ");
	    }
	}

	var html_assign_phone_number_did = new EJS({url: 'assign_phone_number_did_template.ejs'}).render({"accounts": accounts, "classes": classes, "departments": departments, "ivrs": ivrs, "queues": queues});
	$("#assign_phone_number_did").html(html_assign_phone_number_did);	

	// On account change reload avaiable extensions 
	$("#account").change(function(){
		$('#account_extension').attr('disabled', 'disabled');
		get_account_extensions($(this).val().split("@")[1]);
	    });
	$("#assign_account_extension_btn").click(function() {
		set_account_extension();
	    });
	get_account_extensions($("#account").val().split("@")[1]);
    };
    // send the request
    $.ajax({
	    type: "GET",
		url: CPANEL.urls.json_api() + '&' + $.param(api2_call),
		success: success
	});
};
get_assign_extension();

function get_assign_local_extension () {
    var api2_call = {
        "cpanel_jsonapi_version": 2,
        "cpanel_jsonapi_module": "CommuniGate",
        "cpanel_jsonapi_func": "AssignExtension"
    };
    // callback
    var success = function (res) {
	var data = JSON.parse(res);
	data = data.cpanelresult.data[0];
	var accounts = data.accounts;
	var classes = data.classes;
	var departments = data.departments;
	var ivrs = data.ivrs;
	var queues = data.queues;
	for (var class_ in classes) {
	    if ($.isArray(classes[class_].AccessModes)) {
		classes[class_].AccessModes = classes[class_].AccessModes.join(", ");
	    }
	}
	var html_assign_local_extension = new EJS({url: 'assign_to_local_extension.ejs'}).render({"accounts": accounts, "classes": classes, "departments": departments, "ivrs": ivrs, "queues": queues});
	$("#assign_local_extension").html(html_assign_local_extension);	
	$("#assign_local_extension_btn").click(function() {
		assign_local_extension();
	    });
    };
    // send the request
    $.ajax({
	    type: "GET",
		url: CPANEL.urls.json_api() + '&' + $.param(api2_call),
		success: success
	});
};
get_assign_local_extension();

function get_all_extensions () {
    var api2_call = {
        "cpanel_jsonapi_version": 2,
        "cpanel_jsonapi_module": "CommuniGate",
        "cpanel_jsonapi_func": "ListExtensions"
    };
    // callback
    var success = function (res) {
	var data = JSON.parse(res);
	var all_extensions = data.cpanelresult.data;
	get_all_aliases(all_extensions);
    };
    // send the request
    $.ajax({
	    type: "GET",
		url: CPANEL.urls.json_api() + '&' + $.param(api2_call),
		success: success
	});
};
get_all_extensions();

function get_all_aliases (all_extensions) {
    var api2_call = {
        "cpanel_jsonapi_version": 2,
        "cpanel_jsonapi_module": "CommuniGate",
        "cpanel_jsonapi_func": "GetAliases"
    };
    // callback
    var success = function (res) {
	var data = JSON.parse(res);
	var all_aliases = data.cpanelresult.data;
	var html_extensions_table = new EJS({url: 'extensions_table.ejs'}).render({"extensions": all_extensions, "aliases": all_aliases});
	$("#extensions_table").html(html_extensions_table);	
	$('.delete_extension').click(function() {
		if (confirm("Are you sure you want to delete " + $(this).val() + "?")) {
		    unset_account_pstn($(this).val(), $(this).attr("id").split("_")[1]);
		    delete_account_extension($(this).val(), $(this).attr("id").split("_")[1]);
		}
	    });
	$('.set-outgoing').click(function() {
		set_account_pstn($(this).val(), $(this).attr("id").split("_")[1]);
	    });
	$('.unset-outgoing').click(function() {
		unset_account_pstn($(this).val(), $(this).attr("id").split("_")[1]);
	    });
	$(".delete-local").click(function() {
		if (confirm("Are you sure you want to delete " + $(this).val() + "?")) {
		    delete_local_extension($(this).val().split("/")[0], $(this).val().split("/")[1], $(this).next(".delete_loading"));
		}
	    });
    };
    // send the request
    $.ajax({
	    type: "GET",
		url: CPANEL.urls.json_api() + '&' + $.param(api2_call),
		success: success
	});
};

function set_account_extension () {
    var api2_call = {
        "cpanel_jsonapi_version": 2,
        "cpanel_jsonapi_module": "CommuniGate",
        "cpanel_jsonapi_func": "AssignExtension",
	"account": $("#account").val(),
	"extension": $("#account_extension").val()
    };
    // callback
    var success = function (res) {
    	var data = JSON.parse(res);
	data = data.cpanelresult.data[0];
	if (data.error) {
	    $("#assign_account_extension_loading").html(data.error);
	} else {
	    $("#assign_account_extension_loading").html("Extension added successfully!");
	    get_assign_extension();
	    get_all_extensions();
	}
    };
    $("#assign_account_extension_loading").html(CPANEL.icons.ajax + " Loading...");
    // send the request
    $.ajax({
    	    type: "GET",
    		url: CPANEL.urls.json_api() + '&' + $.param(api2_call),
    		success: success
    	});
};

function set_account_pstn (extension, id) {
    var api2_call = {
        "cpanel_jsonapi_version": 2,
        "cpanel_jsonapi_module": "CommuniGate",
        "cpanel_jsonapi_func": "SetAccountPSTN",
    	"extension": extension
    };
    // callback
    var success = function (res) {
    	var data = JSON.parse(res);
    	data = data.cpanelresult.data[0];
    	if (data.success) {
	    get_assign_extension();
	    get_all_extensions();
    	} else {
    	    $("#delete_extension_loading_" + id).html("Error deleting extension!");
    	}
    };
    // send the request
    $("#delete_extension_loading_" + id).html(CPANEL.icons.ajax + " Loading...");
    $.ajax({
    	    type: "GET",
    		url: CPANEL.urls.json_api() + '&' + $.param(api2_call),
    		success: success
    	});
};

function unset_account_pstn (extension, id) {
    var api2_call = {
        "cpanel_jsonapi_version": 2,
        "cpanel_jsonapi_module": "CommuniGate",
        "cpanel_jsonapi_func": "UnsetAccountPSTN",
    	"extension": extension
    };
    // callback
    var success = function (res) {
    	var data = JSON.parse(res);
    	data = data.cpanelresult.data[0];
    	if (data.success) {	    
	    get_assign_extension();
	    get_all_extensions();
	} else {
	    $("#delete_extension_loading_" + id).html("Error deleting extension!");
    	}
    };
    // send the request
    $("#delete_extension_loading_" + id).html(CPANEL.icons.ajax + " Loading...");
    $.ajax({
    	    type: "GET",
    		url: CPANEL.urls.json_api() + '&' + $.param(api2_call),
    		success: success
    	});
};

function delete_account_extension (extension, id) {
    var api2_call = {
        "cpanel_jsonapi_version": 2,
        "cpanel_jsonapi_module": "CommuniGate",
        "cpanel_jsonapi_func": "DeleteExtension",
    	"extension": extension
    };
    // callback
    var success = function (res) {
    	var data = JSON.parse(res);
	data = data.cpanelresult.data[0];
	if (data.success) {
	    get_assign_extension();
	    get_all_extensions();
	} else {
	    $("#delete_extension_loading_" + id).html("Error deleting extension!");
	}
    };
    // send the request
    $("#delete_extension_loading_" + id).html(CPANEL.icons.ajax + " Loading...");
    $.ajax({
    	    type: "GET",
    		url: CPANEL.urls.json_api() + '&' + $.param(api2_call),
    		success: success
    	});
};

function assign_local_extension () {
    var api2_call = {
        "cpanel_jsonapi_version": 2,
        "cpanel_jsonapi_module": "CommuniGate",
        "cpanel_jsonapi_func": "AssignExtension",
	"account": $("#local_account").val(),
	"local_extension": $("#local_extension").val()
    };
    // callback
    var success = function (res) {
    	var data = JSON.parse(res);
	data = data.cpanelresult.data[0];
	if (data.error) {
	    $("#assign_local_extension_loading").html(data.error);
	} else {
	    $("#assign_local_extension_loading").html("Extension added successfully!");
	    get_assign_local_extension();
	    get_all_extensions();
	}
    };
    $("#assign_local_extension_loading").html(CPANEL.icons.ajax + " Loading...");
    // send the request
    $.ajax({
    	    type: "GET",
    		url: CPANEL.urls.json_api() + '&' + $.param(api2_call),
    		success: success
    	});
};

function delete_local_extension (alias, account, loading) {
    var api2_call = {
        "cpanel_jsonapi_version": 2,
        "cpanel_jsonapi_module": "CommuniGate",
        "cpanel_jsonapi_func": "DeleteAlias",
    	"alias": alias,
	"account": account
    };
    // callback
    var success = function (res) {
    	var data = JSON.parse(res);
    	data = data.cpanelresult.data[0];
    	if (data.success) {
    	    get_assign_extension();
    	    get_all_extensions();
    	} else {
    	}
    };
    // send the request
    loading.html(CPANEL.icons.ajax + " Loading...");
    $.ajax({
    	    type: "GET",
    		url: CPANEL.urls.json_api() + '&' + $.param(api2_call),
    		success: success
    	});
};

function delete_rsip_account (account, rsip, loading, accounts, selected) {
    var api2_call = {
        "cpanel_jsonapi_version": 2,
        "cpanel_jsonapi_module": "CommuniGate",
        "cpanel_jsonapi_func": "DeleteRSIP",
    	"rsip": rsip,
    	"account": account
    };
    // callback
    var success = function (res) {
    	var data = JSON.parse(res);
    	data = data.cpanelresult;
    	if (data.event.result) {
    	    list_rsip(accounts, selected);
    	} else {
    	    loading.html("Error deleting SIP account!");
    	}
    };
    // send the request
    loading.html(CPANEL.icons.ajax + " Loading...");
    $.ajax({
    	    type: "GET",
    		url: CPANEL.urls.json_api() + '&' + $.param(api2_call),
    		success: success
    	});
};

function set_outgoing (account, rsip, loading, accounts, selected) {
    var api2_call = {
        "cpanel_jsonapi_version": 2,
        "cpanel_jsonapi_module": "CommuniGate",
        "cpanel_jsonapi_func": "UpdatePSTN",
    	"rsip": rsip,
    	"account": account
    };
    // callback
    var success = function (res) {
    	var data = JSON.parse(res);
    	data = data.cpanelresult;
    	if (data.event.result) {
    	    list_rsip(accounts, selected);
    	} else {
    	    loading.html("Error setting as outgoing!");
    	}
    };
    // send the request
    loading.html(CPANEL.icons.ajax + " Loading...");
    $.ajax({
    	    type: "GET",
    		url: CPANEL.urls.json_api() + '&' + $.param(api2_call),
    		success: success
    	});
};

function unset_outgoing (account, loading, accounts, selected) {
    var api2_call = {
        "cpanel_jsonapi_version": 2,
        "cpanel_jsonapi_module": "CommuniGate",
        "cpanel_jsonapi_func": "UnsetPSTN",
    	"account": account
    };
    // callback
    var success = function (res) {
    	var data = JSON.parse(res);
    	data = data.cpanelresult;
    	if (data.event.result) {
    	    list_rsip(accounts, selected);
    	} else {
    	    loading.html("Error unsetting as outgoing!");
    	}
    };
    // send the request
    loading.html(CPANEL.icons.ajax + " Loading...");
    $.ajax({
    	    type: "GET",
    		url: CPANEL.urls.json_api() + '&' + $.param(api2_call),
    		success: success
    	});
};
