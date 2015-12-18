// Globals
var accounts;

getAccounts();
function getAccounts() {
    var api2_call = {
	cpanel_jsonapi_version: 2,
	cpanel_jsonapi_module: "CommuniGate",
	cpanel_jsonapi_func: "ListAccounts"
    };
    var success = function(o) {
	var data = $.parseJSON(o);
	if (data.cpanelresult.data && data.cpanelresult.data[0]) {
	    $('#main-loading').html("");
	    accounts = Object.keys(data.cpanelresult.data[0].accounts).map(function(k) { return data.cpanelresult.data[0].accounts[k] });
	    listRPOP(accounts[0].username + '@' + accounts[0].domain);
	} else {
	    $('#main-loading').html("Error loading Remote POP!");
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
}

function listRPOP(account) {
    var api2_call = {
	cpanel_jsonapi_version: 2,
	cpanel_jsonapi_module: "CommuniGate",
	cpanel_jsonapi_func: "ListRPOP",
	account: account
    };
    var success = function(o) {
	var data = $.parseJSON(o);
	if (data.cpanelresult.data && data.cpanelresult.data[0]) {
	    $('#main-loading').html("");
	    var html = new EJS({url: 'managing-menu.ejs'}).render({"accounts": accounts, "selected": account});
	    $("#managing-menu").show().html(html);
	    $('#select-manage').change(function() {
	    	    listRPOP( $(this).val() );
	    	});
	    var rpop = data.cpanelresult.data[0].rpop;
	    var rpopInfo = data.cpanelresult.data[0].rpopInfo;
	    var html_rpop = new EJS({url: 'rpop-table.ejs'}).render({"rpop": rpop, "rpopInfo": rpopInfo});
	    $("#rpop-table").show().html(html_rpop);
	    $('#add-btn').click(function() {
		    addRPOP();
		});
	    // $('.edit-rpop').click(function() {
	    // 	    getRPOP( $(this).attr('id'). );
	    // 	});
	    $('.delete-rpop').click(function() {
		    getRPOP( $(this).attr('id') );
		});
	    $("#add-rpop").hide();
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
}

function getRPOP(rpop) {
    var api2_call = {
	cpanel_jsonapi_version: 2,
	cpanel_jsonapi_module: "CommuniGate",
	cpanel_jsonapi_func: "EditRPOP",
	account: $('#select-manage').val(),
	rpop: rpop
    };
    var success = function(o) {
	var data = $.parseJSON(o);
	if (data.cpanelresult.data && data.cpanelresult.data[0]) {
	    data = data.cpanelresult.data[0];
	    addRPOP(data, rpop);
	    $('#' + rpop + '-loading').html("");
	} else {
	    // error loading domains
	}
    };
    $('#' + rpop + '-loading').html(CPANEL.icons.ajax + " Loading...");
    $.ajax({
	    type: "POST",
		url: CPANEL.urls.json_api(),
		data: $.param(api2_call),
		success: success,
		dataType: "text"
		});
}

function addRPOP(rpop, rpop_name) {
    var edit = false;
    if (rpop) { edit = true; }
    var html = new EJS({url: 'add-template.ejs'}).render({"edit": edit, "rpop": rpop, "rpop_name": rpop_name });
    $("#add-rpop").show().html(html);
    $("#rpop-table").hide();
    $("#managing-menu").hide();
    $('#save-btn').click(function() {
	    saveRPOP( $('#select-manage').val(), rpop_name );
	});
    $('#cancel-btn').click(function() {
	    $("#rpop-table").show();
	    $("#managing-menu").show();
	    $("#add-rpop").hide();
	});
}

function saveRPOP(account, rpop_name) {
    var api2_call = {
        cpanel_jsonapi_version: 2,
        cpanel_jsonapi_module: "CommuniGate",
        cpanel_jsonapi_func: "DoEditRPOP",
        account: $('#select-manage').val(),
	name: rpop_name,
	period: $("#period").val(),
	authName: $("#authName").val(),
	domain: $("#domain").val(),
	password: $("#password").val(),
	mailbox: $("#mailbox").val(),
	leave: ( $('#leave').is(':checked') ? $('#leave').val() : '' ),
	APOP: ( $('#APOP').is(':checked') ? $('#APOP').val() : '' ),
	TLS: ( $('#TLS').is(':checked') ? $('#TLS').val() : '' )
    };
    var success = function(o) {
    	var data = $.parseJSON(o);
    	if (data.cpanelresult.data && data.cpanelresult.data[0]) {
	    $('#save-loading').html(CPANEL.icons.ajax + " Remorte POP saved successfully! Please wait...");
	    setTimeout(function() {
		    listRPOP(account);	    
		}, 2000);
    	} else {
	    $('#save-loading').html("Error saving Remote POP!");
    	}
    };
    $('#save-loading').html(CPANEL.icons.ajax + " Loading...");
    $.ajax({
    	    type: "POST",
    		url: CPANEL.urls.json_api(),
    		data: $.param(api2_call),
    		success: success,
    		dataType: "text"
    		});
}

function deleteRPOP(rpop) {
    var api2_call = {
        cpanel_jsonapi_version: 2,
        cpanel_jsonapi_module: "CommuniGate",
        cpanel_jsonapi_func: "DeleteRPOP",
        account: $('#select-manage').val(),
	rpop: rpop
    };
 
    var success = function(o) {
    	var data = $.parseJSON(o);
    	if (data.cpanelresult.data && data.cpanelresult.data[0]) {
	    setTimeout(function() {
	    	    listRPOP( $('#select-manage').val() );	    
	    	}, 2000);
    	} else {
	    $('#' + rpop + '-loading').html("Error deleting Remote POP!");
    	}
    };
    if ( confirm('Are you sure you want to delete Remote POP ' + rpop + '?') ) {
	$('#' + rpop + '-loading').html(CPANEL.icons.ajax + " Loading...");
	$.ajax({
		type: "POST",
		    url: CPANEL.urls.json_api(),
		    data: $.param(api2_call),
		    success: success,
		    dataType: "text"
		    });
    }
}
