getAutoresponders();
function getAutoresponders() {
    $('#add-autoresponder-btn').show();
    $('#autoresponder-add').html("");
    $('#autoresponder-add-email').html("");
    var api2_call = {
	cpanel_jsonapi_version: 2,
	cpanel_jsonapi_module: "CommuniGate",
	cpanel_jsonapi_func: "ListAutoresponders"
    };
    var success = function(o) {
	var data = $.parseJSON(o);
	if (data.cpanelresult.event.result) {
	    $('#main-loading').html("");
	    data = data.cpanelresult.data;
	    var html = new EJS({url: 'autoresponder-table.ejs'}).render({"data": data});
	    $('#autoresponder-table').html(html);
	    $('#add-autoresponder-btn').click(function() {
		    $('#add-autoresponder-btn-loading').html(CPANEL.icons.ajax + " Loading...");
		    loadDomains();
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

function loadDomains() {
    var api2_call = {
	cpanel_jsonapi_version: 2,
	cpanel_jsonapi_module: "Email",
	cpanel_jsonapi_func: "listmaildomains"
    };
    var success = function(o) {
	var data = $.parseJSON(o);
	if (data.cpanelresult.event.result) {
	    data = data.cpanelresult.data;
	    loadAccounts(data[0].domain, data);
	} else {
	    // error loading accounts
	}
    };
    $.ajax({
	    type: "POST",
		url: CPANEL.urls.json_api(),
		data: $.param(api2_call),
		success: success,
		dataType: "text"
		});
}

function loadAccounts(domain, domains, autoresponder) {
    var api2_call = {
	cpanel_jsonapi_version: 2,
	cpanel_jsonapi_module: "CommuniGate",
	cpanel_jsonapi_func: "getDomainAccounts",
	"domain": domain
    };
    var success = function(o) {
	var data = $.parseJSON(o);
	if (data.cpanelresult.event.result) {
	    data = data.cpanelresult.data[0];
	    var accounts = Object.keys(data);
	    showAddTemplate(accounts, domain, domains, autoresponder);
	} else {
	    // error loading accounts
	}
    };
    $.ajax({
	    type: "POST",
		url: CPANEL.urls.json_api(),
		data: $.param(api2_call),
		success: success,
		dataType: "text"
		});
}

function showAddTemplate(accounts, domain, domains, autoresponder) {
    $('#domain-loading').html('');
    $('#email').prop('disabled', false);
    $('#add-autoresponder-btn-loading').html("");
    $('#add-autoresponder-btn').hide();
    $('#autoresponder-table').html("");

    var html = new EJS({url: 'autoresponder-add.ejs'}).render({"autoresponder": autoresponder});
    $('#autoresponder-add').html(html);
    var html_accounts = new EJS({url: 'autoresponder-add-email.ejs'}).render({'accounts': accounts, 'domain': domain, 'domains': domains, "autoresponder": autoresponder});
    $('#autoresponder-add-email').html(html_accounts);
    
    $('#subject').keyup(function() {
	    validateEmpty( 'subject' );
	});
    $('#body').keyup(function() {
	    validateEmpty( 'body' );
	});
    $('#domain').change(function() {
	    $('#domain-loading').html(CPANEL.icons.ajax + " Loading...");
	    $('#email').attr('disabled', 'disabled');
	    loadAccounts($(this).val(), domains);
	});

    var moment = rome.moment;
    rome(start_date, { min: moment().format("YYYY-MM-DD") });
    rome(stop_date, { min: moment().format("YYYY-MM-DD") });

    $('#start_date').click(function() {
    	    if($('input:radio[name="start_control"]').filter('[value="1"]').is(':checked') === false) {
    		$('input:radio[name="start_control"]').filter('[value="1"]').prop('checked', true);
    	    }
    	});
    $('#stop_date').click(function() {
    	    if($('input:radio[name="stop_control"]').filter('[value="1"]').is(':checked') === false) {
    		$('input:radio[name="stop_control"]').filter('[value="1"]').prop('checked', true);
    	    }
    	});
    $('#save-btn').click(function() {
    	    saveAutoresponder();
    	});
    $('#cancel-btn').click(function() {
	    getAutoresponders();
	});
}

function saveAutoresponder() {
    var valid_dates = validateDates();
    var valid_subject = validateEmpty( 'subject' );
    var valid_body = validateEmpty( 'body' );

    var api2_call = {
	cpanel_jsonapi_version: 2,
	cpanel_jsonapi_module: "CommuniGate",
	cpanel_jsonapi_func: "SetAutoresponder",
	email: $('#email').val(),
	subject: $('#subject').val(),
	body: $('#body').val(),
	domain: $('#domain').val()
    };
    if ($('input:radio[name="start_control"]').filter('[value="1"]').is(':checked')) {
	api2_call['start'] = rome.moment( $('#start_date').val() ).unix();
    } else {
	api2_call['start'] = '';
    }
    if ($('input:radio[name="stop_control"]').filter('[value="1"]').is(':checked')) {
	api2_call['stop'] = rome.moment( $('#stop_date').val() ).unix();
    } else {
	api2_call['stop'] = '';
    }
    
    var success = function(o) {
	var data = $.parseJSON(o);
	if (data.cpanelresult.event.result) {
	    $('#save-loading').html(CPANEL.icons.ajax + " The auto responder <strong>" + api2_call.email + "@" + api2_call.domain + " </strong>was successfully saved. Please wait...");
	    setTimeout( function(){
		    getAutoresponders()
			}, 2000);
	} else {
	    $('#save-loading').html("Error creating autoresponder!");
	}
    };
    if (valid_dates && valid_subject && valid_body) {
	$('#save-loading').html(CPANEL.icons.ajax + " Loading...");
	$.ajax({
		type: "POST",
		    url: CPANEL.urls.json_api(),
		    data: $.param(api2_call),
		    success: success,
		    dataType: "text"
		    });
    }
}

function deleteAutoresponder(email, id) {
    var api2_call = {
    	cpanel_jsonapi_version: 2,
    	cpanel_jsonapi_module: "CommuniGate",
    	cpanel_jsonapi_func: "DeleteAutoresponder",
    	email: email
    };
    var success = function(o) {
    	var data = $.parseJSON(o);
    	if (data.cpanelresult.event.result) {
	    getAutoresponders();
    	} else {
	    $('#loading_' + id).html("Error deleting autoresponder!");
    	}
    };
    if (confirm("Are you sure you want todelete autoresponder " + email + "?")) {
	$('#loading_' + id).html(CPANEL.icons.ajax + " Loading...");
	$.ajax({
		type: "POST",
		    url: CPANEL.urls.json_api(),
		    data: $.param(api2_call),
		    success: success,
		    dataType: "text"
		    });
    }
}

function editAutoresponder(autoresponder) {
    var api2_call = {
	cpanel_jsonapi_version: 2,
	cpanel_jsonapi_module: "Email",
	cpanel_jsonapi_func: "listmaildomains"
    };
    var success = function(o) {
	var data = $.parseJSON(o);
	if (data.cpanelresult.event.result) {
	    data = data.cpanelresult.data;
	    loadAccounts(autoresponder.email.split('@')[1], data, autoresponder);
	} else {
	    // error loading accounts
	}
    };
    $.ajax({
	    type: "POST",
		url: CPANEL.urls.json_api(),
		data: $.param(api2_call),
		success: success,
		dataType: "text"
		});
}

function getAutoresponder(email, id) {
    var api2_call = {
    	cpanel_jsonapi_version: 2,
    	cpanel_jsonapi_module: "CommuniGate",
    	cpanel_jsonapi_func: "EditAutoresponder",
    	email: email
    };
    var success = function(o) {
    	var data = $.parseJSON(o);
    	if (data.cpanelresult.event.result) {
	    var autoresponder = data.cpanelresult.data[0];
	    autoresponder.email = email;
	    if (autoresponder.start) {
		autoresponder.start = rome.moment.unix(autoresponder.start).format("YYYY-MM-DD HH:mm");
	    }
	    if (autoresponder.stop) {
		autoresponder.stop = rome.moment.unix(autoresponder.stop).format("YYYY-MM-DD HH:mm");
	    }
	    editAutoresponder(autoresponder);
    	} else {
	    $('#loading_' + id).html("Error!");
    	}
    };
    $('#loading_' + id).html(CPANEL.icons.ajax + " Loading...");
    $.ajax({
	    type: "POST",
		url: CPANEL.urls.json_api(),
		data: $.param(api2_call),
		success: success,
		dataType: "text"
		});
}

function validateDates() {
    if ($('input:radio[name="stop_control"]').filter('[value="1"]').is(':checked')) {
	if ($('#start_date').val() && $('#stop_date').val() && $('#start_date').val() < $('#stop_date').val() ) {
	    $('#date-error').hide();
	    return true;
	} else {
	    $('#date-error').html('The stop time must be later than the start time!').show();
	    return false;
	}
    } else if($('#start_date').val() && $('#stop_date').val()) {
	return true;
    } else {
	$('#date-error').html('Pleace fill in all data fields!').show();
	return false;
    }
}

function validateEmpty(field) {
    if ( $('#' + field).val() ) {
	$('#' + field + '_error').hide();
	return true;
    } else {
	$('#' + field + '_error').html('This field can not be empty!').show();
	return false;
    }
}

