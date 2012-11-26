/* ***** BEGIN LICENSE BLOCK *****

# cpanel12 - password_gen.js                  Copyright(c) 1997-2008 cPanel, Inc.
#                                                           All Rights Reserved.
# copyright@cpanel.net                                         http://cpanel.net
# This code is subject to the cPanel license. Unauthorized copying is prohibited

 * ***** END LICENSE BLOCK ***** 
 * ***** BEGIN APPLICABLE CODE BLOCK ***** */

var password_tip_panel;
var password_tip_panel_initted = 0;
var password_gen_panel;
var password_gen_panel_initted = 0;
var password_use_panel;
var password_use_panel_initted = 0;
var password_gen_pwbox;
var password_gen_update_func;
var did_password_gen = 0;

var chrsets = {
    'uppercase':[
    {
        'start':65,
        'end':90
    }
    ],
    'lowercase':[
    {
        'start':97,
        'end':122
    }
    ],
    'numbers':[
    {
        'start':48,
        'end':57
    }
    ],
    'symbols':[
    {
        'start':33,
        'end':47
    },
    {
        'start':58,
        'end':64
    },
    {
        'start':123,
        'end':126
    }
    ]   
};

var defaultallowedtxt = ['lowercase','uppercase','numbers','symbols'];

function get_chr_string(chrset) {
    var txt = '';
    if (!chrsets[chrset] || !chrsets[chrset].length) { return ''; }

    for(var ct=0;ct < chrsets[chrset].length;ct++) {        
        for(var i = chrsets[chrset][ct]['start'];i<=chrsets[chrset][ct]['end'];i++) {
            txt += String.fromCharCode(i);
        }
    }
    return txt;
}

function getrand(max) {
    return Math.floor(Math.random() * max);
}

function generate_password(plength,allowedtxt,forbiddentxt) {
    var passtxt = '';
    if (!allowedtxt.length) { allowedtxt=defaultallowedtxt; }

    for (var i=0;i<allowedtxt.length;i++) {
        passtxt += get_chr_string(allowedtxt[i]);
    }

    var ft = forbiddentxt.split('');
    for(var i = 0; i < ft.length; i++) {
        passtxt = passtxt.replace(ft[i],'');
    }

    if (passtxt.length == 0) { return ''; }

    var newpass='';
    while(newpass.length < plength) {
        newpass += passtxt.charAt(getrand(passtxt.length));
    }

    return newpass;
}

function open_usepass_dialog(newpass) {
    init_usepass_dialog();
    document.getElementById('password_use_newpass').innerHTML = html_encode_str(newpass);
    password_use_panel.show();
}

function open_passgen_dialog(pwupdatebox,pwbox) {
    init_passgen_dialog();
    password_gen_pwbox = pwbox;
    password_gen_update_func = pwupdatebox;
    password_gen_panel.show();
    if (!did_password_gen) { dialogGeneratePass(); }
}

function handlePassCancel() {
    password_gen_panel.hide();
}

function handlePassSubmit() {
    password_gen_panel.hide();
    var dialogPasswordEl = document.getElementById('dialogPassword');
    var mainPasswordEl = document.getElementById(password_gen_pwbox);
    mainPasswordEl.value=dialogPasswordEl.value;

    var ElList = [mainPasswordEl];

/* if we do double verification find the next input type=password after the one supplied and fill it as wekk */
    if (mainPasswordEl.type=="password") {
        var next_input = 0;
        var allinputs = document.getElementsByTagName('input');
        for(var i=0;i<allinputs.length;i++) {
            if (next_input) {
                if (allinputs[i].type == "password") {
                    ElList.push(allinputs[i]);
                    allinputs[i].value = dialogPasswordEl.value;
                    break; 
                } else if (allinputs[i].type == "text") {
                    break;
                }
            } else if (allinputs[i].id == password_gen_pwbox) {
                next_input = 1;
            } 
        }
    }

    password_gen_update_func();

    if (self.do_validate) {
        for(var i=0;i<ElList.length;i++) {
            if (ElList[i].form && ElList[i].form.id) {
                do_validate(ElList[i].form.id,0,0,ElList[i].id);
            }
        }
    }

    open_usepass_dialog(dialogPasswordEl.value);
}

function init_passtip_dialog() {
    if (password_tip_panel_initted)  { return; }

    password_tip_panel_initted = 1;

password_tip_panel =
        new YAHOO.widget.Panel('password_tip_panel',
                {
width:'300px',
fixedcenter:false,
constraintoviewport:false,
close:true,
draggable:true,
modal:false,
visible:false
}
                );
           password_tip_panel.setBody(pwminstrength_tip.replace('%',pwminstrength));
    //password_tip_panel.beforeHideEvent.subscribe(handle_hide_passtip, password_tip_panel, true);
    var tdiv = document.getElementById('sdiv');
    if (!tdiv) { tdiv = document.body; }
    password_tip_panel.render(tdiv);
    password_tip_panel.hide();
    document.getElementById('password_tip_panel').style.display='';
}

function closeUsePass() {
    password_use_panel.hide();
}

function init_usepass_dialog() {
    if (password_use_panel_initted)  { return; }

    password_use_panel_initted = 1;

password_use_panel =
        new YAHOO.widget.Dialog('password_use_panel',
                {
width:'400px',
fixedcenter:true,
constraintoviewport:true,
close:true,
draggable:false,
modal:false,
buttons: [ { text:"Close", handler:closeUsePass, isDefault:true } ],
visible:false
}
                );
        //password_use_panel.setHeader('Generate Password');
    //password_use_panel.beforeHideEvent.subscribe(handle_hide_passgen, password_use_panel, true);


    var tdiv = document.getElementById('sdiv');
    if (!tdiv) { tdiv = document.body; }
    password_use_panel.render(tdiv);
    password_use_panel.hide();
    document.getElementById('password_use_panel').style.display='';
}

function init_passgen_dialog() {
    if (password_gen_panel_initted)  { return; }

    password_gen_panel_initted = 1;

password_gen_panel =
        new YAHOO.widget.Dialog('password_gen_panel',
                {
width:'400px',
fixedcenter:true,
constraintoviewport:true,
close:true,
draggable:true,
modal:false,
buttons: [ { text:"Use Password", handler:handlePassSubmit, isDefault:true },
{ text:"Cancel", handler:handlePassCancel } ],
visible:false
}
                );
        //password_gen_panel.setHeader('Generate Password');
    //password_gen_panel.beforeHideEvent.subscribe(handle_hide_passgen, password_gen_panel, true);


    var tdiv = document.getElementById('sdiv');
    if (!tdiv) { tdiv = document.body; }
    password_gen_panel.render(tdiv);
    password_gen_panel.hide();
    document.getElementById('password_gen_panel').style.display='';
}

function handle_hide_passtip() {
    if (password_tip_panel.cfg.getProperty('visible')) {
        password_tip_panel.hide();
    }
}

function hide_password_tip_panel() {
    handle_hide_passtip();
}

function handle_hide_passgen() {

}

function show_password_tip_panel() {

    var pwEl = document.getElementById('password');
    var pwRegion = YAHOO.util.Region.getRegion(pwEl);

    var passwdGenEl = document.getElementById('passwdGen');
    if (passwdGenEl) {
        var passwdGenRegion = YAHOO.util.Region.getRegion(passwdGenEl);
        if (passwdGenRegion.bottom > pwRegion.bottom) {
            pwRegion.bottom = passwdGenRegion.bottom; 

        }
    }
    password_tip_panel.moveTo(pwRegion.right+5,pwRegion.bottom+10);

    if (! password_tip_panel.cfg.getProperty('visible')) {
        password_tip_panel.show();
        if (pwEl){ 
            try {
                pwEl.focus();
            } catch(e){ 

            }
        }
    }
}

function dialogGeneratePass() {
    did_password_gen=1;
    var dialogPasswordEl = document.getElementById('dialogPassword');
    var pwLengthEl = document.getElementById('pwlength');
    var pwLength = parseInt(pwLengthEl.value);
    if (!pwLength || pwLength < 8) { pwLength=8;}
    dialogPasswordEl.setAttribute('size',pwLength);
    for(var i=0;i<10;i++) { /* try up to 10 times to generate a 100 level password with the requirements they gave */
        dialogPasswordEl.value = generate_password(pwLength,
        [
            document.getElementById('uppercase').checked ? 'uppercase' : '',
            document.getElementById('lowercase').checked ? 'lowercase' : '',
            document.getElementById('numbers').checked ? 'numbers' : '',
            document.getElementById('symbols').checked ? 'symbols' : ''
        ],'\'oO0"');

        var bpb = dialogPasswordEl.value + '';
        var pwstrength = getPasswordStrength(bpb);
        if (pwstrength >= 100) { break; } 
    }


    updatePasswordStrength_new(dialogPasswordEl,'Dialog_passwdRating',{ 'text':2, 'rating':3 }, 1);

    password_gen_panel.show();
}

function html_encode_str(mystr) {
        return mystr.replace(/\&/g,"&amp;").replace(/\</g,"&lt;").replace(/\>/g,"&gt;").replace(/\"/g,"&quot;");
        /* ie does not like .replace(/\'/g,"&apos;"); */
}

/* ***** END APPLICABLE CODE BLOCK ***** */


