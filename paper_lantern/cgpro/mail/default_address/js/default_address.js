getDefaultAddress();
function getDefaultAddress() {
    var api2_call = {
	cpanel_jsonapi_version: 2,
	cpanel_jsonapi_module: 'CommuniGate',
	cpanel_jsonapi_func: 'ListDefAddress'
    };
    var success = function(o) {
	var data = $.parseJSON(o);
	if (data.cpanelresult.event.result) {
	    $('#main-loading').html('');
	    var default_address = data.cpanelresult.data;
	    console.log(default_address);
	    var html = new EJS({url: 'default_address_table.ejs'}).render({'data': default_address});
	    $('#default-address-table').html(html);
	    $('.action').change(function(){ changeAction( $(this) ); });
	    $('.text').keyup( function() { validate_fwdemail( $(this).attr('id').split('_')[1] ); } );
	} else {
	    // error loading domains
	}
    };
    $('#main-loading').html(CPANEL.icons.ajax + ' Loading...');
    $.ajax({
	    type: 'POST',
		url: CPANEL.urls.json_api(),
		data: $.param(api2_call),
		success: success,
		dataType: 'text'
		});
};

function changeAction(item) {
    var caller_id = item.attr('id');
    var caller = caller_id.split('_')[1];
    $('#text_' + caller).val('');
    var value = $(item).find(':selected').val();
    if (value == 'DefForward') {
	$('#text_' + caller).removeAttr('disabled');
    } else {
	$('#text_' + caller).attr('disabled', 'disabled');
    }
    $('.error').each(function() { $(this).hide(); } );
};

function updateDefaultAddress(domain, id) {
    var api2_call = {
	cpanel_jsonapi_version: 2,
	cpanel_jsonapi_module: 'CommuniGate',
	cpanel_jsonapi_func: 'SetDefAddress',
	'domain': domain,
	'action': $('#action_' + id).val(),
	'fwdmail': $('#text_' + id).val()
    };
    
    console.log(api2_call);
    
    var success = function(o) {
	var data = $.parseJSON(o);
	console.log(data);
	if (data.cpanelresult.event.result) {
	    $('#save_loading_' + id).html('Successfully saved!');
	} else {
	    $('#save_loading_' + id).html('Error!');
	}
    };

    $('#save_loading_' + id).html(CPANEL.icons.ajax + ' Loading...');
    $.ajax({
    	    type: 'POST',
    		url: CPANEL.urls.json_api(),
    		data: $.param(api2_call),
    		success: success,
    		dataType: 'text'
    		});
};

function validate_fwdemail(id) {
    var fwdemail = $('#text_' + id).val();
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    var regtest = re.test(fwdemail);
    if(regtest) {
	$('#text_' + id + '_error').hide();
	return true;
    }
    $('#text_' + id + '_error').show().html("This is not a valid email!");
    return false;
};

		