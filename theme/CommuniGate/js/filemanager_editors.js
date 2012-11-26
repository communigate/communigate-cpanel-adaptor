String.prototype.normalize_charset = function() {
    return this.toLowerCase().replace(/[_,.-]/,"");
}

function check_for_encoding_change(template,result) {
    var saved_charset = result.data[0].charset;
    if ( saved_charset.normalize_charset() !== CHARSET.normalize_charset() ) {
        var message = YAHOO.lang.substitute(
            template,
            {
                old_charset: CHARSET.toUpperCase(),
                new_charset: saved_charset.toUpperCase()
            }
        );

        var enc_dialog = new CPANEL.ajax.Common_Dialog( "enc_changed", {
            width: "500px",
            show_status: true,
            status_html: LOCALE.reloading,
        } );

        //_ajaxapp.tmpl gives us CPANEL.LANG.ok
        enc_dialog.cfg.getProperty("buttons")[0].text = CPANEL.LANG.ok;

        //Omit the cancel button
        enc_dialog.cfg.getProperty("buttons").pop();

        DOM.addClass( enc_dialog.element, "cjt_notice_dialog cjt_info_dialog" );

        enc_dialog.setHeader( LOCALE.charset_changed );

        enc_dialog.renderEvent.subscribe( function() {
            this.form.innerHTML = message;
            this.center();
        } );

        enc_dialog.submitEvent.subscribe( function() {
            //so we catch file_charset as well as charset, the_charset, etc.
            var new_url = location.href.replace(/([^&?]*charset)=[^&]*/g,"$1="+saved_charset);
            location.href = new_url;
        } );

        this.fade_to(enc_dialog)[0];

        return false;
    }
}

function confirm_close(clicked_el) {
    var to_confirm = window.CODEWINDOW
        ? CODEWINDOW.value !== CODEWINDOW.defaultValue
        : wp_current_obj.getSubmitValue() !== LAST_SAVED_VALUE
    ;

    if (to_confirm) {
        var confirmation = new CPANEL.ajax.Common_Dialog();
        confirmation.setBody(LOCALE.confirm_close);
        confirmation.submit = function() { window.close() };
        confirmation.beforeShowEvent.subscribe( confirmation.center, confirmation, true )
        confirmation.show(clicked_el);  //no fade so this stands out more
    }
    else {
        window.close();
    }
}
