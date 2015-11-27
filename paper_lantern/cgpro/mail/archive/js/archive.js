getDomainsAndAccounts();
function getDomainsAndAccounts() {
    var api2_call = {
	cpanel_jsonapi_version: 2,
	cpanel_jsonapi_module: "CommuniGate",
	cpanel_jsonapi_func: "getDomainsAndAccounts"
    };
    var success = function(o) {
	var data = $.parseJSON(o);
	if (data.cpanelresult.event.result) {
	    $('#main-loading').html("");
	    data = data.cpanelresult.data[0];
	    var domains = data.domains;
	    var accounts = [];
	    for (var account in data.accounts) {
		accounts.push(account);
	    }
	    var html = new EJS({url: 'managing_section.ejs'}).render({"domains": domains, "accounts": accounts});
	    $("#managing").html(html);
	    getArchiveTable( $('#select-manage').val() );
	    $('#select-manage').change(function() {
		    getArchiveTable( $(this).val() );
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
}

function getArchiveTable(item) {
    var api2_call = {
	cpanel_jsonapi_version: 2,
	cpanel_jsonapi_module: "CommuniGate",
	cpanel_jsonapi_func: "get_archiving_configuration",
	'account': item
    };
    var success = function(o) {
	var data = $.parseJSON(o);
	if (data.cpanelresult.event.result) {
	    data = data.cpanelresult.data[0];
	    var html = new EJS({url: 'archive_table.ejs'}).render({"item": data});
	    $("#archive-table").html(html);
	    $('#save-btn').click(function() {
		    saveArchive();
		});
	    $('#main-loading').html("");
	} else {
	    $('#main-loading').html("");
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

function saveArchive() {
    var user = $('#select-manage').val();
    var archive = $('#archive-after').val();
    var del = $('#delete-after').val();

    var api2_call = {
	cpanel_jsonapi_version: 2,
	cpanel_jsonapi_module: "CommuniGate",
	cpanel_jsonapi_func: "updateEmailArchive"
    };
    api2_call['archive_after'] = archive;
    api2_call['delete_after'] = del;
    api2_call['domain'] = user;
    var success = function(o) {
	var data = $.parseJSON(o);
	if (data.cpanelresult.event.result) {
	    data = data.cpanelresult.data[0];
	    $('#save-loading').html(data.msg);
	} else {
	    $('#save-loading').html("Error saving archive!");
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
