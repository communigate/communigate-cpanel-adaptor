// Globals
var accounts;
var premium_accounts = {};
var server;

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
	    accounts = data[0].accounts;
	    var classes = data[0].classes;
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
		getCGProServer( Object.keys(premium_accounts)[0] );
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

function getCGProServer(selected) {
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
	    server = data[0];
	    loadRosterTemplate(selected)
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

function loadRosterTemplate(selected) {
    $('#managing-menu').show();
    $('#roster-menu').show();
    $('#local-roster').hide();
    var api2_call = {
	cpanel_jsonapi_version: 2,
	cpanel_jsonapi_module: "CommuniGate",
	cpanel_jsonapi_func: "ListXmppRoster",
	account: selected
    };
    var success = function(o) {
	var data = $.parseJSON(o);
	if (data.cpanelresult.event.result) {
	    $('#main-loading').html("");
	    data = data.cpanelresult.data;
	    var html_managing = new EJS({url: 'managing-menu.ejs'}).render({"accounts": accounts, "selected": selected, "server": server });
	    $('#managing-menu').html(html_managing);
	    var html_roster = new EJS({url: 'roster-template.ejs'}).render({"data": data[0], "selected": selected });
	    $('#roster-menu').html(html_roster);
	    $('#manage_list_select').change( function() {
	    	    loadRosterTemplate($(this).val());
	    	});
	    $('#jid').keyup(function() {
		    validateEmail( $(this).val() );
		});
	    $('#submit').click(function() {
		    addBuddy(selected);
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

function addBuddy(account) {
    var api2_call = {
	cpanel_jsonapi_version: 2,
	cpanel_jsonapi_module: "CommuniGate",
	cpanel_jsonapi_func: "AddBuddy",
	"account": account,
	"jid": $('#jid').val(),
	"name": $('#name').val(),
	"group": $('#group').val()
    };
    var success = function(o) {
	var data = $.parseJSON(o);
	if (data.cpanelresult.data && data.cpanelresult.data[0] && data.cpanelresult.data[0].success ) {
	    $('#add-loading').html(CPANEL.icons.ajax + " Buddy successfully added! Please wait...");
	    data = data.cpanelresult.data[0].success;
	    console.log(data);
	    setTimeout( function() {
	    	    loadRosterTemplate(account);
		}, 2000);
	} else {
	    $('#add-loading').html("Error adding buddy!");
	    // error loading domains
	}
    };

    if ( validateEmail( $('#jid').val() ) ) {
	$('#add-loading').html(CPANEL.icons.ajax + " Loading...");
	$.ajax({
		type: "POST",
		    url: CPANEL.urls.json_api(),
		    data: $.param(api2_call),
		    success: success,
		    dataType: "text"
		    });
    }
};

function removeBuddy(account, buddy, id) {
    var api2_call = {
	cpanel_jsonapi_version: 2,
	cpanel_jsonapi_module: "CommuniGate",
	cpanel_jsonapi_func: "RemoveBuddy",
	"account": account,
	"buddy": buddy
    };
    var success = function(o) {
	var data = $.parseJSON(o);
	if (data.cpanelresult.data && data.cpanelresult.data[0] && !data.cpanelresult.data[0].error ) {
	    loadRosterTemplate(account);
	} else {
	    $('#loading_' + id).html("");
	    $('#add-loading').html("Error removing buddy!");
	    // error loading domains
	}
    };
    if ( confirm("Are you sure you want to delete " + buddy + " buddy?") ) {
	$('#loading_' + id).html(CPANEL.icons.ajax + " Loading...");
	$.ajax({
		type: "POST",
		    url: CPANEL.urls.json_api(),
		    data: $.param(api2_call),
		    success: success,
		    dataType: "text"
		    });
    }
};

function loadLocalRoster() {
    var selected = $('#manage_list_select').val();
    var html_local = new EJS({url: 'local-roster.ejs'}).render({"accounts": premium_accounts, "selected": selected });
    $('#local-roster').html(html_local);
    $('#managing-menu').hide();
    $('#roster-menu').hide();
    $('#local-roster').show().html(html_local);
    $('#cancel_local').click(function() {
	    $('#managing-menu').show();
	    $('#roster-menu').show();
	    $('#local-roster').hide();
	});
    $('#submit_local').click(function() {
	    importLocalRoster(selected);
	});
};

function importLocalRoster(selected) {
    var api2_call = {
	cpanel_jsonapi_version: 2,
	cpanel_jsonapi_module: "CommuniGate",
	cpanel_jsonapi_func: "ImportLocalRoster",
	account: selected
    };
    var buddies = [];
    $('input[type="checkbox"][name="buddy"]').each(function() {
	    var val = (this.checked ? $(this).val() : "");
	    if (val) {
		buddies.push(val);
	    }
	});
    api2_call['buddies'] = JSON.stringify(buddies);

    var success = function(o) {
    	var data = $.parseJSON(o);
    	if (data.cpanelresult.data && data.cpanelresult.data[0] && !data.cpanelresult.data[0].error ) {
	    $('#local_loading').html(CPANEL.icons.ajax + " Local accounts successfully added! Please wait...!");
	    loadRosterTemplate(selected);
    	} else {
	    $('#local_loading').html("Error adding local accounts!");
    	}
    };
    $('#local_loading').html(CPANEL.icons.ajax + " Loading...");
    $.ajax({
    	    type: "POST",
    		url: CPANEL.urls.json_api(),
    		data: $.param(api2_call),
    		success: success,
    		dataType: "text"
    		});
};

function validateEmail(email) {
    var re = /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i.test(email);
    if(re) {
	$("#jid_error").hide();
	return true;
    }
    $("#jid_error").show().html("This is not a valid Jabber ID!");
    return false;
}
