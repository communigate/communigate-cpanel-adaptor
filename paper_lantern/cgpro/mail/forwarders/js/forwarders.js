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
	console.log(data);
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
		get_accounts_and_domains(domains[0]);
	    }
	    // var html_add = new EJS({url: 'add_forwarder.ejs'}).render();
	    // $(".body-content").html(html_add);	
	} else {
	}
    };
    // send the request
    $.ajax({
    	    type: "GET",
    		url: CPANEL.urls.json_api() + '&' + $.param(api2_call),
    		success: success
    		});
};

function get_accounts_and_domains (domain) {
    var api2_call = {
        "cpanel_jsonapi_version": 2,
        "cpanel_jsonapi_module": "CommuniGate",
        "cpanel_jsonapi_func": "getAccountsAndDomains"
    };
    // callback
    var success = function (data) {
    	var data = JSON.parse(data);
    	data = data.cpanelresult;
	if (data.event.result) {
	    var domains = data.data;
	    if (domains.length) {
		getAccountsForDomain(domains[0]);
	    }
	    // var html_add = new EJS({url: 'add_forwarder.ejs'}).render();
	    // $(".body-content").html(html_add);	
	} else {
	}
    };
    // send the request
    $.ajax({
    	    type: "GET",
    		url: CPANEL.urls.json_api() + '&' + $.param(api2_call),
    		success: success
    		});
};
