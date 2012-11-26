/* ***** BEGIN LICENSE BLOCK *****

# cpanel12 - password_str.js                  Copyright(c) 1997-2008 cPanel, Inc.
#                                                           All Rights Reserved.
# copyright@cpanel.net                                         http://cpanel.net
# This code is subject to the cPanel license. Unauthorized copying is prohibited

 * ***** END LICENSE BLOCK ***** 
  * ***** BEGIN APPLICABLE CODE BLOCK ***** */


var tip_box_has_focus = 0;
var pw_box_has_focus = 0;
var attached_form;
var pwstrapp;
var attached_pwbox = {};
var password_str_handle_validate = 1;
var pwminstrength = 0;
var pwminstrength_fail_txt='Sorry, the password you selected cannot be used because it is too weak and would be too easy to crack.  Please select a password with strength rating of % or higher.';
var pwminstrength_tip='You can increase the strength of your password by adding UPPER CASE, numbers, and symbol characters.  You should avoid using words that are in the dictionary as <a href="http://en.wikipedia.org/wiki/Password_cracking" target="_blank">crackers</a> usually start with these first.  Currently the system requires you use a password with a strength rating of % or greater.';


function hide_password_tip_panel_if_no_box_focus() {
    if (!tip_box_has_focus && !pw_box_has_focus) {  
        hide_password_tip_panel(); 
    } 
}

function ensurePwStrength(e,pwbox) {
    var bpb = "" + pwbox.value;
    var pwstrength = getPasswordStrength(bpb);

    
    if (pwstrength < pwminstrength) {
        YAHOO.util.Event.stopEvent(e);
        alert(pwminstrength_fail_txt.replace('%',pwminstrength));
    }
}

function updatePasswordStrength_new(pwbox,pwdiv,divorderlist,noshowpanel) {
    var bpb = "" + pwbox.value;

    if (attached_pwbox[pwbox.id] != 1) {
        YAHOO.util.Event.addFocusListener(pwbox, function(e) {
                pw_box_has_focus=1;
                } );

        YAHOO.util.Event.addBlurListener(pwbox, function(e) {
        pw_box_has_focus=0;
                setTimeout(hide_password_tip_panel_if_no_box_focus,250);
                } );
        attached_pwbox[pwbox.id]=1;
    }

    if (pwstrapp && pwminstrengthapps[pwstrapp]) {
        pwminstrength = pwminstrengthapps[pwstrapp]; 
    }

    if (!attached_form) {
        init_passtip_dialog();

        var formEl = pwbox.form;
        if(formEl && formEl.action && formEl.action.length > 3) {
            if (self.register_validator) {
                register_validator('func',function(Els) {
                        var pwbox = Els[0];
                        var bpb = "" + pwbox.value;
                        var pwstrength = getPasswordStrength(bpb);
                        if (pwstrength < pwminstrength) { return false; } else { return true; } 
                        },[pwbox],pwminstrength_fail_txt.replace('%',pwminstrength));
            } else {
                YAHOO.util.Event.addListener(formEl, "submit", function(e) {
                        ensurePwStrength(e,pwbox);
                        }, this, true);
            }
        }  
        var tipBoxEl=document.getElementById('password_tip_panel');
        if (tipBoxEl) { 
            YAHOO.util.Event.addBlurListener(tipBoxEl, function(e) {
                    tip_box_has_focus=0;
                    } );
            YAHOO.util.Event.addListener(tipBoxEl, 'click', function(e) {
                    tip_box_has_focus=1;
                    } );

            YAHOO.util.Event.addFocusListener(tipBoxEl, function(e) {
                    tip_box_has_focus=1;
                    } );
            var tipBoxAEls = tipBoxEl.getElementsByTagName('a');
            for(var i = 0;i<tipBoxAEls.length;i++){
                YAHOO.util.Event.addBlurListener(tipBoxAEls[i], function(e) {
                        tip_box_has_focus=0;
                        } );
                YAHOO.util.Event.addListener(tipBoxAEls[i], 'click', function(e) {
                        tip_box_has_focus=1;
                        } );

                YAHOO.util.Event.addFocusListener(tipBoxAEls[i], function(e) {
                        tip_box_has_focus=1;
                        } );
            }
        }
        attached_form = 1;
    }


    var pwstrength = getPasswordStrength(bpb);
    var bars = (parseInt(pwstrength/10) * 10);

    var pwdivEl = document.getElementById(pwdiv);
    if (!pwdivEl) { 
        return;
        alert('Password Strength Display Element Missing');
    }

    var divlist = pwdivEl.getElementsByTagName('div');
    var maindiv = divlist[0].getElementsByTagName('div');   
       
    var pw_test_maxstrength = pwminstrength > 0 ? pwminstrength : 100;
    var pw_test_strength = pwstrength < pw_test_maxstrength ? pwstrength : pw_test_maxstrength; 
    var pwcolor = parseInt((pw_test_strength / pw_test_maxstrength) * 3); 


    maindiv[0].className='pass_bar_base pass_bar_'+bars+' pass_bar_color_'+(pwcolor?pwcolor:1);

    var txtdivnum = 1;
    if (divorderlist && divorderlist.text > -1) {
        txtdivnum = divorderlist.text;
    }

    var txtdiv = divlist[txtdivnum];
    if (txtdiv && self.pass_strength_phrases) {
        if (pwminstrength > 50 && pwstrength >= 50 && pwstrength < pwminstrength) {
            bars = 40;
        }
        txtdiv.innerHTML=pass_strength_phrases[bars] + ' (' + pwstrength  + '/100)';;   
    }

    var ratingdivnum;
    if (divorderlist && divorderlist.rating > -1) {
        ratingdivnum = divorderlist.rating;
    }

    var ratingdiv = divlist[ratingdivnum];
    if (ratingdiv && self.pass_strength_phrases) {
        ratingdiv.innerHTML='Strength: (' + pwstrength  + ')';
    }

    if (pwstrength < pwminstrength) {
       if (!noshowpanel) { show_password_tip_panel(); }
       if (password_str_handle_validate) { YAHOO.util.Dom.addClass(pwbox,'formverifyfailed'); }
    } else {
       hide_password_tip_panel();
       if (password_str_handle_validate) { YAHOO.util.Dom.removeClass(pwbox,'formverifyfailed'); }
    }

}
function updatePasswordStrength(pwbox,pwdiv,divorderlist) {
    var bpb = "" + pwbox.value;

    var pwstrength = getPasswordStrength(bpb);
    var bars = (parseInt(pwstrength/10) * 10);

    var pwdivEl = document.getElementById(pwdiv);
    if (!pwdivEl) {
        return; 
        alert('Password Strength Display Element Missing');
    }
    var divlist = pwdivEl.getElementsByTagName('div');

    var imgdivnum = 0;
    var txtdivnum = 1;
    if (divorderlist && divorderlist.text > -1) {
        txtdivnum = divorderlist.text;
    }
    if (divorderlist && divorderlist.image > -1) {
        imgdivnum = divorderlist.image;
    }
    var imgdiv = divlist[imgdivnum];
    
    imgdiv.id='ui-passbar-'+bars;
    var txtdiv = divlist[txtdivnum];
    if (txtdiv && self.pass_strength_phrases) {
        txtdiv.innerHTML=pass_strength_phrases[bars];   
    }

}
/* ***** END APPLICABLE CODE BLOCK ***** */

