/* frequently activated actions */
if (!NVData) var NVData = {};
if (self['register_interfacecfg_nvdata']) { register_interfacecfg_nvdata('icFAA'); }

function icFAA(item) {
    setQuickCookie('icFAA',item);
}

function checkFAA() {
    var icFAA_cookie = GetCookie('icFAA');
    if (icFAA_cookie && icFAA_cookie != '0') {
        if (!NVData['icFAA']) {
            fetch_icFAA_NVData();
        } else {
            parse_icFAA_cookie(icFAA_cookie);
        }
    }
}

function fetch_icFAA_NVData() {
    GetNvData('icFAA',handle_icFAA_NVData_ret);
}


function handle_icFAA_NVData_ret(nvname,nvval) {
    if (nvname) {
        var icFAA_cookie = GetCookie('icFAA');
        NVData['icFAA'] = nvval;
        parse_icFAA_cookie(icFAA_cookie);
    }
}

function parse_icFAA_cookie(icFAA_cookie) {
    setQuickCookie('icFAA','0');
    try { 
        var appCntList = fastJsonParse(NVData['icFAA']);
    } 
    catch (e) { 
        appCntList = {};
    } 

    if (!appCntList[icFAA_cookie]) {
        appCntList[icFAA_cookie]=1;
    } else {
        appCntList[icFAA_cookie]++;
    }
    var delayed_nv_set = function() {
        SetNvData('icFAA',YAHOO.lang.JSON.stringify(appCntList),null,1);
    };
    setTimeout(delayed_nv_set,100); // Make sure we set this after any pending ajax requests
}

function setQuickCookie(cookiename,cookievalue) {
    var today = new Date();
    today.setTime( today.getTime() );
    var expires_date = new Date( today.getTime() + 4000 );
	
    SetCookie(cookiename,cookievalue,expires_date);
}

function renderFAA() {
    var faaEl = document.getElementById('faa');
    if (!faaEl) { return; }    

    
    try {
        var appCntList = fastJsonParse(NVData['icFAA']);
    }
    catch (e) {
        appCntList = {};
    }

    if (!appCntList) { return; }
    var appArr = [];    
    for(var app in appCntList) {
     if (appCntList.hasOwnProperty(app)) {
        appArr.push(app);
     }
    }

    if (appArr.length < 1) {
        return;
    }

    var mysort = function(a,b) {
       return appCntList[b]-appCntList[a];
    };

    appArr.sort(mysort);
    var ulEl = document.createElement('ul');
    for(var i = 0;i <= 4;i++) {
        var targetEl = document.getElementById('item_' + appArr[i]);
        if (!targetEl) { continue; }

        var liEl = document.createElement('li');
        var aEl = document.createElement('a');
        aEl.innerHTML = targetEl.innerHTML; /* + ' (' + appCntList[appArr[i]] + ')'; */
        aEl.id = 'faa_' + targetEl.id;

        if (targetEl.onclick) {
            var clickTrap = (function() {
                var realEl = targetEl;
                return function(e,b,c) {
                    var clickok =
                          realEl.onclick ? realEl.onclick()
                        : realEl.click   ? realEl.click()
                        : true;

                    if (clickok === false) {
                        EVENT.preventDefault(e);
                        return false;
                    }
                };
            })();
            EVENT.addListener(aEl, 'click', clickTrap, aEl, true);
        }

        aEl.setAttribute('href',targetEl.getAttribute('href'));

        liEl.appendChild(aEl);
        ulEl.appendChild(liEl);
    }
    faaEl.style.display='';
    var faaBoard = document.getElementById('faaboard');
    faaBoard.innerHTML='';
    faaBoard.appendChild(ulEl);
}

function SortObject(arrayName,length) {
    for (var i=0; i<(length-1); i++)
        for (var j=i+1; j<length; j++)
            if (arrayName[j].value < arrayName[i].value) {
                var dummy = arrayName[i];
                arrayName[i] = arrayName[j];
                arrayName[j] = dummy;
            }
}

YAHOO.util.Event.onDOMReady(function() {
	checkFAA();
	renderFAA();
});
