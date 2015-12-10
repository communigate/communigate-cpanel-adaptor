getAccountsStatusMonitor();
function getAccountsStatusMonitor() {
    var api2_call = {
	cpanel_jsonapi_version: 2,
	cpanel_jsonapi_module: "CommuniGate",
	cpanel_jsonapi_func: "getAccountsStatusMonitor"
    };
    var success = function(o) {
	var data = $.parseJSON(o);
	console.log(data);
	if (data.cpanelresult.event.result) {
	    var statuses = data.cpanelresult.data[0];
	    console.log(statuses);
	    var html = new EJS({url: 'accounts_table.ejs'}).render({"data": statuses});
	    $('#accounts-table').html(html);
	    $('#search_input').keyup( function() { search_logs(); } );
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

function clear_search() {
    $('#search_input').val('');
    search_logs();
};

function search_logs() {
    $(".result_rows").each( function(index) {
	    $(this).css("display", "")
	});
    var no_rows = 0;       
  
    $(".result_rows").each( function(index) {
	    $(".no_results").css("display", "none");
	    var searchstring = "";
	    var searchregex = $("#search_input").val();
	    searchstring += $(this).find(".td1").html();
	    var res = searchstring.match(searchregex);
	    if (!res) {
		$(this).css("display", "none");
	    }
	    var none = $(this).css("display");
	    if (none != "none") {
		no_rows += 1;
	    }
	});
    if (no_rows == 0) {
	$(".no_results").show();
    }
};   

