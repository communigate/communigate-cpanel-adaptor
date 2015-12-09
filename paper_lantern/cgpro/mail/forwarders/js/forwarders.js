load_forwarders();
function load_forwarders () {
    var api2_call = {
        "cpanel_jsonapi_version": 2,
        "cpanel_jsonapi_module": "CommuniGate",
        "cpanel_jsonapi_func": "listforwards"
    };
    // callback
    var success = function (data) {
	var data = JSON.parse(data);
	data = data.cpanelresult;
	var forwarders = data.data;
	if (data.event.result) {
	    load_extensions(forwarders);
	}
    };
    // send the request
    if ( !$('.body-content').children().length ) {
	$('.init-loading').html(CPANEL.icons.ajax + " Loading...");
    }
    $.ajax({
	    type: "GET",
		url: CPANEL.urls.json_api() + '&' + $.param(api2_call),
		success: success
		});
};

function load_extensions (forwarders) {
    var api2_call = {
        "cpanel_jsonapi_version": 2,
        "cpanel_jsonapi_module": "CommuniGate",
        "cpanel_jsonapi_func": "ListExtensions"
    };
    // callback
    var success = function (data) {
	var data = JSON.parse(data);
	data = data.cpanelresult;
	if (data.event.result) {
	    $('.init-loading').html("");
	    var extensions = data.data;
	    var excluded_string = "";
	    for (var i = 0; i < forwarders.length; i++) {
		for (var j = 0; j < extensions.length; j++) {
		    if (extensions[j].dest == forwarders[i].dest) {
			excluded_string += forwarders[i].html_dest;
		    }
		}
	    }
	    var filtered_forwarders = forwarders.filter(function(f) { 
	    	    if (excluded_string.search(f.dest) == -1) {
			return true;
	    	    } else {
			return false;
		    }
	    	});
	    var html = new EJS({url: 'forwarders.ejs'}).render({"forwarders": filtered_forwarders});
	    $(".body-content").html(html);	
	    $(".delete_forwarder").click(function() {
		    var id = $(this).attr("id").replace("delete_","");
		    var email = $("#dest_" + id).val();
		    var forward = $("#forward_" + id).val();
		    if (confirm("Are you sure you want to delete the email forwarder " + email + " to " + forward + "?")) {
			delete_forwarder(email, forward, $(this).nextAll(".loading"));
		    }
		});
	    $("#add_forwarder").click(function() {
		    load_add_forwarder();
		});
	}
    };
    // send the request
    $.ajax({
	    type: "GET",
		url: CPANEL.urls.json_api() + '&' + $.param(api2_call),
		success: success
		});
};

function delete_forwarder (email, forward, loading) {
    var api2_call = {
        "cpanel_jsonapi_version": 2,
        "cpanel_jsonapi_module": "CommuniGate",
        "cpanel_jsonapi_func": "delforward",
	"account": email,
	"forwarder": forward,
	"domain": email.split("@")[1]
    };
    // callback
    var success = function (data) {
    	var data = JSON.parse(data);
    	data = data.cpanelresult;
	if (data.event.result) {
	    load_forwarders();
	} else {
	    loading.html("Error deleting forwarder!");
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

function load_add_forwarder () {
    var api2_call = {
        "cpanel_jsonapi_version": 2,
        "cpanel_jsonapi_module": "CommuniGate",
        "cpanel_jsonapi_func": "getEmailDomains"
    };
    // callback
    var success = function (data) {
    	var data = JSON.parse(data);
    	data = data.cpanelresult;
	if (data.event.result) {
	    var domains = data.data;
	    if (domains.length) {
		getAccountsForDomain(domains[0], domains, domains[0]);
	    }
	    // var html_add = new EJS({url: 'add_forwarder.ejs'}).render();
	    // $(".body-content").html(html_add);	
	} else {
	}
    };
    // send the request
    $('#add-loading').html(CPANEL.icons.ajax + " Loading...");
    $.ajax({
    	    type: "GET",
    		url: CPANEL.urls.json_api() + '&' + $.param(api2_call),
    		success: success
    		});
};

function getAccountsForDomain(domain, domains, selected) {
    var api2_call = {
        "cpanel_jsonapi_version": 2,
        "cpanel_jsonapi_module": "CommuniGate",
        "cpanel_jsonapi_func": "getAccountsForDomain",
	domain: domain
    };
    // callback
    var success = function (data) {
    	var data = JSON.parse(data);
    	data = data.cpanelresult;
	if (data.event.result) {
	    $('#add-loading').html("");
	    var accounts = data.data[0].accounts;
	    var html_add = new EJS({url: 'add_forwarder.ejs'}).render({'accounts': accounts, 'domains': domains, 'selected': selected});
	    $(".body-content").html(html_add);	
	    $('#email').attr('disabled', false);
	    $('#domain').change(function() {
		    getAccountsForDomain( $(this).val(), domains, $(this).val() );
		});
	    $('#fwdemail').keyup( function() { validate_fwdemail(); } );
	    $('#save').click(function() { addForwarder( $('#email').val(), $('#domain').val(), $('#fwdemail').val() ); });
	    $('#cancel').click(function() { load_forwarders(); $('#save-loading').html(CPANEL.icons.ajax + " Loading..."); });
	} 
    };
    // send the request
    $('#email').attr('disabled', 'disabled');
    $.ajax({
    	    type: "GET",
    		url: CPANEL.urls.json_api() + '&' + $.param(api2_call),
    		success: success
    		});
};

function addForwarder(email, domain, fwdemail) {
    var api2_call = {
        "cpanel_jsonapi_version": 2,
        "cpanel_jsonapi_module": "CommuniGate",
        "cpanel_jsonapi_func": "addforward",
	domain: domain,
	email: email,
	fwdemail: fwdemail
    };
    // callback
    var success = function (data) {
    	var data = JSON.parse(data);
    	data = data.cpanelresult;
	if (data.event.result) {
	    $('#save-loading').html(CPANEL.icons.ajax + " Forwarder successfully saved! Please wait...");
	    load_forwarders();
	} else {
	    $('#save-loading').html("Error saving forwarder");
	}
    };
    // send the request
    if ( validate_fwdemail() ) {
	$('#save-loading').html(CPANEL.icons.ajax + " Loading...");
	$.ajax({
		type: "GET",
		    url: CPANEL.urls.json_api() + '&' + $.param(api2_call),
		    success: success
		    });
    }
};

function validate_fwdemail() {
    var fwdemail = $('#fwdemail').val();
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    var regtest = re.test(fwdemail);
    if(regtest) {
	$('#fwdemail-error').hide();
	return true;
    }
    $('#fwdemail-error').show().html("This is not a valid record!");
    return false;
};
