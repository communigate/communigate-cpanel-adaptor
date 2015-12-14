getAccounts();
function getAccounts() {
    var api2_call = {
	cpanel_jsonapi_version: 2,
	cpanel_jsonapi_module: "CommuniGate",
	cpanel_jsonapi_func: "AccountsOverview"
    };
    var success = function(o) {
	var data = $.parseJSON(o);
	if (data.cpanelresult.event.result) {
	    $('#main-loading').html("");
	    data = data.cpanelresult.data;
	    var accounts = data[0].accounts;
	    var classes = data[0].classes;
	    var premium_accounts = {};
	    for (var acc in accounts) {
		var myclass = accounts[acc]['class'];
		var class_string = '';
		if ( classes[myclass].AccessModes instanceof Array ) {
		    class_string = classes[myclass].AccessModes.join(',');
		} else {
		    class_string = classes[myclass].AccessModes;
		}
		if ( class_string.indexOf('XMPP') > -1 || class_string.indexOf('All') > -1 ) {
		    premium_accounts[acc] = accounts[acc];
		}
	    }
	    if (Object.keys(premium_accounts).length) {
		getCGProServer( premium_accounts, Object.keys(premium_accounts)[0] );
	    }
	} else {
	    // error loading domains
	}
    };
    $('#main-loading').html(CPANEL.icons.ajax + " Loading...");
    $.ajax({
	    type: "POST",
		url: CPANEL.urls.json_api(),
		data: $.param(api2_call),
		success: success,
		dataType: "text"
		});
};

function getCGProServer(accounts, selected) {
    var api2_call = {
	cpanel_jsonapi_version: 2,
	cpanel_jsonapi_module: "CommuniGate",
	cpanel_jsonapi_func: "getCGProServer"
    };
    var success = function(o) {
	var data = $.parseJSON(o);
	if (data.cpanelresult.event.result) {
	    $('#main-loading').html("");
	    data = data.cpanelresult.data;
	    loadHistoryTemplate(accounts, selected, data[0])
	} else {
	    // error loading domains
	}
    };
    $('#main-loading').html(CPANEL.icons.ajax + " Loading...");
    $.ajax({
	    type: "POST",
		url: CPANEL.urls.json_api(),
		data: $.param(api2_call),
		success: success,
		dataType: "text"
		});
};

function loadHistoryTemplate(accounts, selected, server) {
    var api2_call = {
	cpanel_jsonapi_version: 2,
	cpanel_jsonapi_module: "CommuniGate",
	cpanel_jsonapi_func: "ListXmppHistory",
	account: selected
    };
    var success = function(o) {
	var data = $.parseJSON(o);
	if (data.cpanelresult.event.result) {
	    $('#main-loading').html("");
	    data = data.cpanelresult.data;
	    var html_managing = new EJS({url: 'managing-menu.ejs'}).render({"accounts": accounts, "selected": selected, "server": server });
	    $('#managing-menu').html(html_managing);
	    var html_history = new EJS({url: 'history-template.ejs'}).render({"data": data[0]});
	    $('#history-menu').html(html_history);
	    $('#manage_list_select').change( function() {
	    	    loadHistoryTemplate(accounts, $(this).val(), server);
	    	});
	} else {
	    // error loading domains
	}
    };
    $('#main-loading').html(CPANEL.icons.ajax + " Loading...");
    $.ajax({
	    type: "POST",
		url: CPANEL.urls.json_api(),
		data: $.param(api2_call),
		success: success,
		dataType: "text"
		});
};
