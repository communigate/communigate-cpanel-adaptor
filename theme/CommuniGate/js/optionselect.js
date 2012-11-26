var optionselectpanel;
var inited_optionselect = 0;
var optionselect_off=1;
var currentoption;
var submitwait = 0;
var optionsubmit_ok = 0;

for(var opname in optionselect_list) {
    register_interfacecfg_nvdata('optionselect_' + opname);
}

function optionselect_init() {
    optionselectpanel = new YAHOO.widget.Panel("optionselect_win", { effect:{effect:YAHOO.widget.ContainerEffect.FADE,duration:0.25}, fixedcenter: true, constraintoviewport: true, underlay:"none", close:true, visible:false, draggable:true, modal:false} );
    optionselectpanel.render();
    optionselectpanel.beforeHideEvent.subscribe(handle_hide_optionselect, optionselectpanel, true);
    inited_optionselect=1;
    for(var imgid in optionselect_images) {
        document.getElementById('postloadimg_' + imgid).src=optionselect_images[imgid];
    }
}
function handle_hide_optionselect(el) {
    var optionselectc = document.getElementById('optionselect-content');
    if (!optionselectc) { alert("The 'optionselect-content' id is missing"); }
    var winc = document.getElementById('optionselect_win');
    optionselectc.style.display='none';
    winc.style.display='none';
}
function build_optionform(optionname,optionval,domain) {
    var oplist = optionselect_list[optionname];
    if (optionval == 'homedir') {
           document.getElementById('optionselect_dir').value=homedir;
    } else if (optionval == 'webroot') {
           document.getElementById('optionselect_dir').value=homedir + '/public_html';
    } else if (optionval == 'ftproot') {
           document.getElementById('optionselect_dir').value=homedir + '/public_ftp';
    }
    var formEl = document.getElementById('optionselect_form');
    formEl.action=oplist.url;
    formEl.target=oplist.target;
}

function getoptionselectval() {
    var dirselectEl = document.getElementById('optionselect_form').dirselect;
    if (dirselectEl[0].checked) {
        return 'homedir';
    } else if (dirselectEl[1].checked) {
        return 'webroot';
    } else if (dirselectEl[2].checked) {
        return 'ftproot';
    } else if (dirselectEl[3].checked) {
        return 'domainrootselect';
    }
    return 'webroot';
}
function getoptionselectdomain() {
    var dsEl = document.getElementById('optionselect_domainselect');
    return dsEl.options[dsEl.selectedIndex].value;
}

function getoptionname() {
        return currentoption;
}

function submit_option_form_handler(optionname) {
    var oplist = optionselect_list[optionname];
    if (oplist.target == '') {
        window.location.href = oplist.url + '?dir=' + document.getElementById('optionselect_dir').value;
    } else {
        var formEl = document.getElementById('optionselect_form');
        formEl.submit();
    }
}
function updatedir_fromdomain() {
    var domain = getoptionselectdomain();
    document.getElementById('optionselect_go').disabled=true;
    document.getElementById('optionselect_go').className='input-button-disabled';
    cpanel_api2(docrootcallback,'DomainLookup','getdocroot','domain',domain);
}


function save_optionselect_form(skipnvset) {
    var optionval = getoptionselectval();    
    var optionname = getoptionname(); 
    var domain = getoptionselectdomain();
    if (!skipnvset) {
        SetNvData('optionselect_' + optionname, optionval + ':' + domain + ':' + (document.getElementById('optionselect_saved').checked ? 1 : 0) + ':' + (document.getElementById('optionselect_showhidden').checked ? 1 : 0));
    }
}

function submitoptionform(dosubmit) {
    var optionval = getoptionselectval();    
    var optionname = getoptionname(); 
    var domain = getoptionselectdomain();
    build_optionform(optionname,optionval,domain);
    var oplist = optionselect_list[optionname];
    if (oplist.target == '') {
        SetCookie('showdotfiles',(document.getElementById('optionselect_showhidden').checked ? 1 : 0));
        optionselectpanel.hide();
        window.location.href = oplist.url + '?dir=' + document.getElementById('optionselect_dir').value;
        return false;
    } else {
        SetCookie('showdotfiles',(document.getElementById('optionselect_showhidden').checked ? 1 : 0));
        if (dosubmit) {
            document.getElementById('optionselect_form').submit();
        }
        optionselectpanel.hide();
        return true;
    }
}

function docrootcallback(result) {
    var dir = homedir;
    var dirEl = result[0].getElementsByTagName('docroot')[0];
    if (dirEl.firstChild) {
        dir = dirEl.firstChild.nodeValue;
    }
    if (!dir) { dir=homedir; }

    document.getElementById('optionselect_dir').value=dir;
    document.getElementById('optionselect_go').disabled=false;
    document.getElementById('optionselect_go').className='input-button';
    save_optionselect_form();
}

function show_optionselect(optionname) {
    var currentsetting = NVData['optionselect_' + optionname];
    var optionval = (currentsetting.split(':'))[0];
    var domain = (currentsetting.split(':'))[1];
    var optionsaved = (currentsetting.split(':'))[2];
    var optionshowhidden = (currentsetting.split(':'))[3];
    currentoption=optionname;
   
    if (self['checkFAA']) { checkFAA(); } 
    
    var optionselectc = document.getElementById('optionselect-content');
    if (!optionselectc) { alert("The 'optionselect-content' id is missing"); }

    if (!YAHOO.util.Dom.hasClass(optionselectc,'mainpopbg')) {
        optionselectc.className='mainpopbg content';
    }


    var winc = document.getElementById('optionselect_win');
    winc.style.display='block';
    optionselectc.style.display='block';

    if (inited_optionselect != 1) {
        optionselect_init();
    }

    optionselectpanel.show();
    winc.style.width = optionselectc.offsetWidth+6;
    winc.style.height = optionselectc.offsetHeight+8;

    var oplist = optionselect_list[optionname];
    var showlist = oplist.show;
    for(var i=0;i<showlist.length;i++) {
        document.getElementById('optionselect_' + showlist[i]).style.display='';
    }
    document.getElementById('optionselect_namehdr').innerHTML=oplist.name;
    document.getElementById('optionselect_namecheck').innerHTML=oplist.name;

    restore_optionform(optionname,optionval,optionsaved,optionshowhidden,domain);

    if (optionsaved == '1' || optionselect_autogo) {
        submitoptionform(1);
        return;
    }

}

function restore_optionform(optionname,savedoptionval,optionsaved,optionshowhidden,domain) {
    var dirselectEl = document.getElementById('optionselect_form').dirselect;
    if (savedoptionval == 'homedir') {
        dirselectEl[0].checked=true;
    } else if (savedoptionval == 'webroot') {
        dirselectEl[1].checked=true;
    } else if (savedoptionval == 'ftproot') {
        dirselectEl[2].checked=true;
    } else if (savedoptionval == 'domainrootselect') {
        dirselectEl[3].checked=true;
    } else {
        dirselectEl[1].checked=true;
    }
    var dsEl = document.getElementById('optionselect_domainselect');
    for(var i=0;i<dsEl.options.length;i++) {
        if (dsEl.options[i].value == domain) {
            dsEl.selectedIndex = i;
        }
    }
    if (optionsaved == '1') {
        document.getElementById('optionselect_saved').checked = true;
    } else {
        document.getElementById('optionselect_saved').checked = false;
    }
    if (optionshowhidden == '1') {
        document.getElementById('optionselect_showhidden').checked = true;
    } else {
        document.getElementById('optionselect_showhidden').checked = false;
    }
    if (savedoptionval == 'domainrootselect') { updatedir_fromdomain(); }
}

function enable_optionselect() {
    optionselect_on = 1;
}

YAHOO.util.Event.onDOMReady(enable_optionselect);