var webmailselectpanel;
var webmailtimerpanel;
var inited_webmailselect = 0;
var inited_webmailtimer = 0;
var webmailselect_off=1;
var mailclient = 'horde';
var mailcountdown = 0;
var FORM = new Array();


function disable_webmailselect_autologin() {
    SetNvData("webmailclient", '-1');
    update_autoload_links();
}
function webmailselect_setdefaultclient(client) {
    if (NVData['webmailclient'] && NVData['webmailclient'] == client) {
        SetNvData("webmailclient", '-1');
    } else if (webmailclients[client]) {
        SetNvData("webmailclient", client);
        document.getElementById('mailclientname').innerHTML=webmailclients[client].name;
        webmailtimer_show();
    }
    update_autoload_links();
}

function webmailtimer_show() {
    var webmailtimerc = document.getElementById('webmailtimer-content');
    if (!webmailtimerc) { alert("The 'webmailtimer-content' id is missing"); }

    if (!YAHOO.util.Dom.hasClass(webmailtimerc,'mainpopbg')) {
        webmailtimerc.className='mainpopbg content';
    }

    var webmailtimer_winc = document.getElementById('webmailtimer_win');
    webmailtimer_winc.style.display='block';
    webmailtimerc.style.display='block';

    webmailtimer_init();
    webmailtimerpanel.show();

    webmailtimer_winc.style.width = webmailtimerc.offsetWidth+6;
    webmailtimer_winc.style.height = webmailtimerc.offsetHeight+8;
}



function webmailtimer_init() {
    if (inited_webmailtimer) { return; }
    var handleOk = function() {
        this.submit();
    };
    var handleCancel = function() {
        SetNvData("webmailclient", '-1');
        update_autoload_links();        
        this.cancel();
    };
    webmailtimerpanel = new YAHOO.widget.Dialog("webmailtimer_win", { fixedcenter: true, constraintoviewport: true, underlay:"none", close:true, visible:false, draggable:true, modal:false,
buttons : [ { text:"Ok", handler:handleOk, isDefault:true },
{ text:"Cancel", handler:handleCancel } ]
} );
webmailtimerpanel.render();
inited_webmailtimer=1;

}

function webmailselect_init() {
    webmailselectpanel = new YAHOO.widget.Panel("webmailselect_win", { fixedcenter: true, constraintoviewport: true, underlay:"none", close:true, visible:false, draggable:true, modal:false} );
    webmailselectpanel.render();
    webmailselectpanel.beforeHideEvent.subscribe(handle_hide_webmailselect, webmailselectpanel, true);
    inited_webmailselect=1;
    for(var webmailclient in webmailclients) {
        var autoEl = document.getElementById(webmailclient + '_auto');
        autoEl.style.display='';
    }

}
function handle_hide_webmailselect(el) {
    var webmailselectc = document.getElementById('webmailselect-content');
    if (!webmailselectc) { alert("The 'webmailselect-content' id is missing"); }
    var webmailselect_winc = document.getElementById('webmailselect_win');
    webmailselectc.style.display='none';
    webmailselect_winc.style.display='none';
}
function show_webmailselect() {
    var webmailselectc = document.getElementById('webmailselect-content');
    if (!webmailselectc) { alert("The 'webmailselect-content' id is missing"); }

    if (!YAHOO.util.Dom.hasClass(webmailselectc,'mainpopbg')) {
        webmailselectc.className='mainpopbg content';
    }

    var webmailselect_winc = document.getElementById('webmailselect_win');
    webmailselect_winc.style.display='block';
    webmailselectc.style.display='block';

    if (inited_webmailselect != 1) {
        webmailselect_init();
    }

    webmailselectpanel.beforeHideEvent.subscribe(disable_countdown, webmailselectpanel, true);

    mailclient = NVData['webmailclient'];
    begin_mail_countdown();

    webmailselectpanel.show();
    webmailselect_winc.style.width = webmailselectc.offsetWidth+6;
    webmailselect_winc.style.height = webmailselectc.offsetHeight+8;
}

function begin_mail_countdown() {
    mailcountdown=(NVData['webmail_autoload_numseconds'] || 5);
    mailcountdown_go();
}

function mailcountdown_go() {
    if (mailcountdown == -1 ) { return; } 
    document.getElementById('mailclients').innerHTML = "Loading " + webmailclients[mailclient].name + " in " + mailcountdown + " second(s).";
    mailcountdown--;
    if (mailcountdown <= 0) {
        var d = new Date();    
        window.location.href = safeurl() + '?login=1&gotime=' + d.getTime();
    } else {
        setTimeout(mailcountdown_go,1000);
    }

}

function disable_webmailselect() {
    disable_countdown(); 
    webmailselectpanel.hide();
}
function disable_countdown () {
    mailcountdown=-1;
}

function enable_webmailselect() {
    webmailselect_on = 1;
}
function check_webmailselect() {
    if (webmailclients[NVData['webmailclient']]) {
        show_webmailselect();
    }
}

function safeurl() {
    var hr = window.location.href.split('?');
    return hr[0];
}

function safe_webmailselect_check() {
    parseForm();
    var actiontime = 3200;
    var gotime = FORM['gotime'];
    var login = FORM['login'];
    if (login) {
        if (gotime && webmailclients[NVData['webmailclient']]) {
            var d = new Date();     
            var now = d.getTime();
            if ((now - actiontime) < gotime) {
                setTimeout(
                        function() {
                        window.location.href = webmailclients[NVData['webmailclient']].uri;
                        }, 500);
                return;
            } else {
                update_autoload_links();
                return;
            }
        }
        update_autoload_links();
        check_webmailselect();
    } else {
        update_autoload_links();
        return;
    }
}

function update_autoload_links () {
    for(var webmailclient in webmailclients) {
        var aEls = document.getElementById(webmailclient + '_auto').getElementsByTagName('a');
        if (NVData['webmailclient'] == webmailclient) {
            document.getElementById(webmailclient + '_cell').className='autoload';
            aEls[0].innerHTML='<span class="disable_autoload">' + webmail_disable_link + '</span>';
        } else {
            document.getElementById(webmailclient + '_cell').className='';
            aEls[0].innerHTML='<span class="enable_autoload">' + webmail_enable_link + '</span>';
        }

    }
}

function parseForm() {
    var query = window.location.search.substring(1);
    var parms = query.split('&');
    for (var i=0; i<parms.length; i++) {
        var pos = parms[i].indexOf('=');
        if (pos > 0) {
            var key = parms[i].substring(0,pos);
            var val = parms[i].substring(pos+1);
            FORM[key] = val;
        }
    }
}

YAHOO.util.Event.onDOMReady(function() {
   enable_webmailselect();
   safe_webmailselect_check();
});

