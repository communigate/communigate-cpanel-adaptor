
var docroot_dialog;

var start_change_docroot = function(domain, subdomain, rootdomain, docroot) {
    if (!docroot_dialog) {    
        var handleCancel = function() { this.cancel(); };
        var handleSubmit = function() { 
            var fulldomain = document.getElementById('change_docroot_domaintxt').innerHTML;
            var callback = function(data) {
                if (parseInt(data[0].result)) {
                    docroot_dialog.hide(); 
                    var newdir = data[0].reldir;
                    var alink = document.getElementById(fulldomain + '_lnk');
                    var uri = alink.href.split('?');
                    uri[1] = "dir=" + encodeURIComponent(newdir);
                    alink.href = uri.join('?');
                    CPANEL.util.set_text_content(alink,'/' + newdir);
                    waitpanel.hide();
                    alert("Document Root Updated"); 
                } else {
                    waitpanel.hide();
                    docroot_dialog.show();
                    alert(data[0].reason); 
                }
            }    
            show_loading(fulldomain,"Updating Document Root");
            docroot_dialog.hide();
            cpanel_jsonapi2(callback,'SubDomain','changedocroot','rootdomain', document.getElementById('change_docroot_rootdomain').value, 'subdomain', document.getElementById('change_docroot_subdomain').value ,'dir', document.getElementById('change_docroot_dir').value );
        } 
        docroot_dialog = new YAHOO.widget.Dialog("docroot_panel", 
            { 
              width: "450px",
              fixedcenter : true,
              visible : false, 
              postmethod: "manual",
              constraintoviewport : true,
              buttons : [ 
                          { text:"Change", handler:handleSubmit, isDefault:true },
                          { text:"Cancel", handler:handleCancel }
                        ]
             } );
        docroot_dialog.submitEvent.subscribe( handleSubmit );
        docroot_dialog.validate = function() {
            return CPANEL.validate.dir_path( this.form.docroot.value );
        };
        document.getElementById('docroot_panel').style.display='';
        docroot_dialog.render();
        var cjt_validator = new CPANEL.validate.validator( LANG.ftp_directory_path );
        cjt_validator.add( docroot_dialog.form.docroot, "dir_path", LANG.validation_directory_paths );
        cjt_validator.attach();
        docroot_dialog.showEvent.subscribe( cjt_validator.verify, cjt_validator, true );
    }
    CPANEL.util.set_text_content(document.getElementById('change_docroot_domaintxt'), domain);
    document.getElementById('change_docroot_subdomain').value = subdomain;
    document.getElementById('change_docroot_rootdomain').value = rootdomain;

    var alink = document.getElementById(domain + '_lnk');
    var uri = alink.href.split('?');
    var dirkeyval = decodeURIComponent(uri[1]).split('=');
    docroot = dirkeyval[1];
    docroot = docroot.replace (/^\//, '');
    var docrootEl = document.getElementById('change_docroot_dir');

    docrootEl.value = docroot;
    docroot_dialog.show();
}


function trapEnterPress(e) 
{
     var key = (window.event ? window.event.keyCode : e.which );
     return (key != 13);
}

