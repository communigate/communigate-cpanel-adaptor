// Globals
var domains = [];

getDomains();
function getDomains() {
    var api2_call = {
	cpanel_jsonapi_version: 2,
	cpanel_jsonapi_module: "Email",
	cpanel_jsonapi_func: "listmaildomains"
    };
    var success = function(o) {
	var data = $.parseJSON(o);
	if (data.cpanelresult.data) {
	    domains = data.cpanelresult.data;
	    getSettings( domains[0].domain );
	    var html = new EJS({url: 'managing-menu.ejs'}).render({"domains": domains});
	    $("#managing-menu").html(html);
	    $('#select-manage').change(function() {
		    getSettings( $(this).val() );
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

function getSettings(domain) {
    var api2_call = {
	cpanel_jsonapi_version: 2,
	cpanel_jsonapi_module: "CommuniGate",
	cpanel_jsonapi_func: "AccountDefaults",
	domain: domain
    };
    var success = function(o) {
	var data = $.parseJSON(o);
	if (data.cpanelresult.data && data.cpanelresult.data[0]) {
	    $('#main-loading').html("");
	    data = data.cpanelresult.data[0];
	    var html = new EJS({url: 'settings-template.ejs'}).render({
		    "accountDefaultPrefs": data.accountDefaultPrefs, 
		    "domain": data.domain,
		    "domainSettings": data.domainSettings,
		    "outhoingNumber": data.outhoingNumber,
		    "outhoingNumbers": data.outhoingNumbers,
		    "serverAccountPrefs": data.serverAccountPrefs,
		    "serverDomainDefaults": data.serverDomainDefaults
		});
	    $("#settings-menu").html(html);
	    $('#save-btn').click(function() {
		    setSettings();
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

function setSettings() {
    var api2_call = {
	cpanel_jsonapi_version: 2,
	cpanel_jsonapi_module: "CommuniGate",
	cpanel_jsonapi_func: "AccountDefaults",
	'save': $('#save-btn').val(),
	'domain': $('#select-manage').val(),
	'MailToAllAction': $('#MailToAllAction').val(),
	'TimeZone': $('#TimeZone').val(),
	'WorkDayStart': $('#WorkDayStart').val(),
	'WorkDayEnd': $('#WorkDayEnd').val(),
	'WeekStart': $('#WeekStart').val(),
	'WorkDays': ( $('#WorkDays-Sun').is(':checked') ? $('#WorkDays-Sun').val() : ''),
	'WorkDays-0': ( $('#WorkDays-Mon').is(':checked') ? $('#WorkDays-Mon').val() : ''),
	'WorkDays-1': ( $('#WorkDays-Tue').is(':checked') ? $('#WorkDays-Tue').val() : ''),
	'WorkDays-2': ( $('#WorkDays-Wed').is(':checked') ? $('#WorkDays-Wed').val() : ''),
	'WorkDays-3': ( $('#WorkDays-Thu').is(':checked') ? $('#WorkDays-Thu').val() : ''),
	'WorkDays-4': ( $('#WorkDays-Fri').is(':checked') ? $('#WorkDays-Fri').val() : ''),
	'WorkDays-5': ( $('#WorkDays-Sat').is(':checked') ? $('#WorkDays-Sat').val() : ''),
	'ips': $('#ips').val(),
	'number': $('#number').val()
    };
    var success = function(o) {
	var data = $.parseJSON(o);
	if (data.cpanelresult.data && data.cpanelresult.data[0]) {
	    $('#save-loading').html("Settings successfully saved!");
	} else {
	    $('#save-loading').html("Error saving settings!");
	    // error loading domains
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
