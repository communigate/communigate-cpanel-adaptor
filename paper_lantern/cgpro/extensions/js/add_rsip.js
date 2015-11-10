init();
function init() {
    var account = getParameterByName("account");
    var rsip = getParameterByName("rsip");
    if (account && rsip) {
	load_edit_rsip(account, rsip);
    } else {
	var html_add_rsip = new EJS({url: 'add_rsip.ejs'}).render({"rsip": ""});
	$(".body-content").html(html_add_rsip);	
	$("#save").click(function() {
		save_rsip(account);
	    });
    }
}

function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

function load_edit_rsip(account, rsip) {
    var api2_call = {
        "cpanel_jsonapi_version": 2,
        "cpanel_jsonapi_module": "CommuniGate",
        "cpanel_jsonapi_func": "EditRSIP",
    	"account": account,
    	"rsip": rsip
    };
    // callback
    var success = function (res) {
    	var data = JSON.parse(res);
	data = data.cpanelresult.data[0];
	data.rsip.name = rsip;
	var html_add_rsip = new EJS({url: 'add_rsip.ejs'}).render({"rsip": data.rsip});
	$(".body-content").html(html_add_rsip);	
	$("#save").click(function() {
		save_rsip(account);
	    });
    };
    // send the request
    $.ajax({
    	    type: "GET",
    		url: CPANEL.urls.json_api() + '&' + $.param(api2_call),
    		success: success
    	});
};

function save_rsip(account) {
    var api2_call = {
        "cpanel_jsonapi_version": 2,
        "cpanel_jsonapi_module": "CommuniGate",
        "cpanel_jsonapi_func": "DoEditRSIP",
    	"account": account,
    	"name": $("#name").val(),
    	"authName": $("#authName").val(),
    	"fromName": $("#fromName").val(),
    	"domain": $("#domain").val(),
    	"password": $("#password").val(),
    	"targetName": $("#targetName").val(),
    	"period": $("#period").val()
    };
    console.log(api2_call);
    
    // callback
    var success = function (res) {
    	var data = JSON.parse(res);
	data = data.cpanelresult;
    	console.log(data);
	if (data.event.result) {
	    $("#save_loading").html("Successfylly saved!");
	} else {
	    $("#save_loading").html("Error saving Remote SIP!");
	}
    };
    // send the request
    $("#save_loading").html(CPANEL.icons.ajax + " Loading...");
    $.ajax({
    	    type: "GET",
    		url: CPANEL.urls.json_api() + '&' + $.param(api2_call),
    		success: success
    	});
};

