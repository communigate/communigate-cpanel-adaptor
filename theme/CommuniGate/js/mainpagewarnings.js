function load_main_page_warnings_success(o) {
    var main_page_warnings_El = document.getElementById('main_page_warnings');
    main_page_warnings_El.innerHTML=o.responseText;
    hide_notices_ifempty();
}
function load_main_page_warnings_failure(o) {
    var main_page_warnings_El = document.getElementById('main_page_warnings');
    main_page_warnings_El.innerHTML='&nbsp;';
    hide_notices_ifempty();
}
function load_main_page_warnings() {
    var main_page_warnings_El = document.getElementById('main_page_warnings');
    main_page_warnings_El.innerHTML = CPANEL.icons.ajax;
    var callback = {
        success: load_main_page_warnings_success,
        failure: load_main_page_warnings_failure
    };

    YAHOO.util.Connect.asyncRequest('GET', CPANEL.security_token + '/frontend/' + thisTheme + '/main_page_warnings.html' , callback);
}

YAHOO.util.Event.onDOMReady( load_main_page_warnings );
