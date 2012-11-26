/* ***** BEGIN LICENSE BLOCK *****

# cpanel12 - password.js                     Copyright(c) 1997-2008 cPanel, Inc.
#                                                           All Rights Reserved.
# copyright@cpanel.net                                         http://cpanel.net
# This code is subject to the cPanel license. Unauthorized copying is prohibited

* ***** END LICENSE BLOCK ***** 
* ***** BEGIN APPLICABLE CODE BLOCK ***** */

// this function returns the strength of a password
// formula inspired by http://passwordmeter.com
// parameters: password
// returns: strength (integer between 0 and 100)
function getPasswordStrength(password) {
    // list of the worst 500 passwords from the book "Perfect Passwords" by Mark Burnett
    // I added some cPanel-related passwords on the first line
    var worst_passwords = [
    "cpanel","cpanel1","server","hosting","linux","website",
    "123456","porsche","firebird","prince","rosebud","password","guitar","butter","beach","jaguar","12345678","chelsea","united","amateur","great","1234","black","turtle","7777777","cool","pussy","diamond","steelers","muffin","cooper","12345","nascar","tiffany","redsox","1313","dragon","jackson","zxcvbn","star","scorpio","qwerty","cameron","tomcat","testing","mountain","696969","654321","golf","shannon","madison","mustang","computer","bond007","murphy","987654","letmein","amanda",
    "bear","frank","brazil","baseball","wizard","tiger","hannah","lauren","master","xxxxxxxx","doctor","dave","japan","michael","money","gateway","eagle1","naked","football","phoenix","gators","11111","squirt","shadow","mickey","angel","mother","stars","monkey","bailey","junior","nathan","apple","abc123","knight","thx1138","raiders","alexis","pass","iceman","porno","steve","aaaa","fuckme","tigers","badboy","forever","bonnie","6969","purple",
    "debbie","angela","peaches","jordan","andrea","spider","viper","jasmine","harley","horny","melissa","ou812","kevin","ranger","dakota","booger","jake","matt","iwantu","aaaaaa","1212","lovers","qwertyui","jennifer","player","flyers","suckit","danielle","hunter","sunshine","fish","gregory","beaver","fuck","morgan","porn","buddy","4321","2000","starwars","matrix","whatever","4128","test","boomer","teens","young","runner","batman","cowboys",
    "scooby","nicholas","swimming","trustno1","edward","jason","lucky","dolphin","thomas","charles","walter","helpme","gordon","tigger","girls","cumshot","jackie","casper","robert","booboo","boston","monica","stupid","access","coffee","braves","midnight","shit","love","xxxxxx","yankee","college","saturn","buster","bulldog","lover","baby","gemini","1234567","ncc1701","barney","cunt","apples","soccer","rabbit","victor","brian","august","hockey","peanut",
    "tucker","mark","3333","killer","john","princess","startrek","canada","george","johnny","mercedes","sierra","blazer","sexy","gandalf","5150","leather","cumming","andrew","spanky","doggie","232323","hunting","charlie","winter","zzzzzz","4444","kitty","superman","brandy","gunner","beavis","rainbow","asshole","compaq","horney","bigcock","112233","fuckyou","carlos","bubba","happy","arthur","dallas","tennis","2112","sophie","cream","jessica","james",
    "fred","ladies","calvin","panties","mike","johnson","naughty","shaved","pepper","brandon","xxxxx","giants","surfer","1111","fender","tits","booty","samson","austin","anthony","member","blonde","kelly","william","blowme","boobs","fucked","paul","daniel","ferrari","donald","golden","mine","golfer","cookie","bigdaddy","king","summer","chicken","bronco","fire","racing","heather","maverick","penis","sandra","5555","hammer","chicago",
    "voyager","pookie","eagle","yankees","joseph","rangers","packers","hentai","joshua","diablo","birdie","einstein","newyork","maggie","sexsex","trouble","dolphins","little","biteme","hardcore","white","redwings","enter","666666","topgun","chevy","smith","ashley","willie","bigtits","winston","sticky","thunder","welcome","bitches","warrior","cocacola","cowboy","chris","green","sammy","animal","silver","panther","super","slut","broncos","richard","yamaha",
    "qazwsx","8675309","private","fucker","justin","magic","zxcvbnm","skippy","orange","banana","lakers","nipples","marvin","merlin","driver","rachel","power","blondes","michelle","marine","slayer","victoria","enjoy","corvette","angels","scott","asdfgh","girl","bigdog","fishing","2222","vagina","apollo","cheese","david","asdf","toyota","parker","matthew","maddog","video","travis","qwert","121212","hooters","london","hotdog","time","patrick","wilson",
    "7777","paris","sydney","martin","butthead","marlboro","rock","women","freedom","dennis","srinivas","xxxx","voodoo","ginger","fucking","internet","extreme","magnum","blowjob","captain","action","redskins","juice","nicole","bigdick","carter","erotic","abgrtyu","sparky","chester","jasper","dirty","777777","yellow","smokey","monster","ford","dreams","camaro","xavier","teresa","freddy","maxwell","secret","steven","jeremy","arsenal","music","dick","viking",
    "11111111","access14","rush2112","falcon","snoopy","bill","wolf","russia","taylor","blue","crystal","nipple","scorpion","111111","eagles","peter","iloveyou","rebecca","131313","winner","pussies","alex","tester","123123","samantha","cock","florida","mistress","bitch","house","beer","eric","phantom","hello","miller","rocket","legend","billy","scooter","flower","theman","movie","6666","please","jack","oliver","success","albert"        
    ];
    
    // positive metrics
    var n_chars = 0;
    var n_uppercase = 0;
    var n_lowercase = 0;
    var n_numbers = 0;
    var n_symbols = 0;
    var n_middle_number_symbol = 0;
    var n_variety_bonus = 0;
    
    // negative metrics
    var n_letters_only = 0;
    var n_numbers_only = 0;
    var n_repeat_chars = 0;
    var n_consec_uppercase = 0;
    var n_consec_lowercase = 0;
    var n_consec_numbers = 0;
    var n_worst_list = 0;
    
    // get a count of the metrics
    n_chars = password.length;
    var last_char = false;
    for (var i=0; i<n_chars; i++) {
        var character = password.charAt(i);
        
        // uppercase characters
        var uppercase_pattern = new RegExp(/[A-Z]/);
        if (character.match(uppercase_pattern)) {
            n_uppercase++;
            
            if (last_char) {
                if (last_char.match(uppercase_pattern)) n_consec_uppercase++;
            }
        }
        // lowercase characters
        var lowercase_pattern = new RegExp(/[a-z]/);
        if (character.match(lowercase_pattern)) {
            n_lowercase++;
            
            if (last_char) {
                if (last_char.match(lowercase_pattern)) n_consec_lowercase++;
            }
        }
        // numbers
        var number_pattern = new RegExp(/\d/);
        if (character.match(number_pattern)) {
            n_numbers++;
            
            if (last_char) {
                if (last_char.match(number_pattern)) n_consec_numbers++;
            }
        }
        // symbols
        if (character.match(new RegExp(/\W/))) {
            n_symbols++;
        }
        // middle numbers or symbols
        if (i != 0 && i != n_chars-1) {
            if (character.match(new RegExp(/\d/)) || character.match(new RegExp(/\W/))) {
                n_middle_number_symbol++;
            }
        }
        // repeat characters
        for (var j=0; j<n_chars; j++) {
            if (character == password.charAt(j) && j != i) n_repeat_chars++;
        }
        
        last_char = character;
    }
    // letters only
    if (n_numbers == 0 && n_symbols == 0) n_letters_only = n_lowercase + n_uppercase;
    
    // numbers only
    if (n_lowercase == 0 && n_uppercase == 0 && n_symbols == 0) n_numbers_only = n_numbers;
    
    // variety bonus
    var variety = 0;
    if (n_uppercase != 0) variety++;
    if (n_lowercase != 0) variety++;
    if (n_numbers != 0) variety++;
    if (n_symbols != 0) variety++;
    if (n_chars >= 8 && variety >= 3) {
        n_variety_bonus = n_chars;
    }
    
    // check against the worst password's list (case insensitive)
    for (var i=0; i<worst_passwords.length; i++) {
        var worst_pattern = new RegExp(worst_passwords[i], 'i');
        if (password.match(worst_pattern)) n_worst_list++;
    }
    
    // calculate the overall strength based on our metrics
    var strength = 0;
    
    // additive metrics
    strength += n_chars*4;      
    strength += (n_chars - n_uppercase)*2;
    strength += (n_chars - n_lowercase)*2;
    strength += n_numbers*4;
    strength += n_symbols*6;
    strength += n_middle_number_symbol*2;
    strength += n_variety_bonus*2;
    
    // negative metrics
    strength -= n_letters_only;
    strength -= n_numbers_only;
    strength -= n_repeat_chars*(n_repeat_chars-1);
    strength -= n_consec_uppercase*2;
    strength -= n_consec_lowercase*2;
    strength -= n_consec_numbers*2;
    strength -= n_worst_list*(strength/5);
    
    // make sure strength is an integer between 0 and 100
    strength = parseInt(strength);
    if (strength < 0) strength = 0;
    if (strength > 100) strength = 100;
    
    return strength;
}
/* ***** END APPLICABLE CODE BLOCK ***** *//* ***** BEGIN LICENSE BLOCK *****

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


