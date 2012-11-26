        //    This code is in the public domain. Feel free to link back to http://jan.moesen.nu/
        function sprintf()
        {
            if (!arguments || arguments.length < 1 || !RegExp)
            {
                return;
            }
            var str = arguments[0];
            var re = /([^%]*)%('.|0|\x20)?(-)?(\d+)?(\.\d+)?(%|b|c|d|u|f|o|s|x|X)(.*)/;
            var a = b = [], numSubstitutions = 0, numMatches = 0;
            while (a = re.exec(str))
            {
                var leftpart = a[1], pPad = a[2], pJustify = a[3], pMinLength = a[4];
                var pPrecision = a[5], pType = a[6], rightPart = a[7];
                
                //alert(a + '\n' + [a[0], leftpart, pPad, pJustify, pMinLength, pPrecision);

                numMatches++;
                if (pType == '%')
                {
                    subst = '%';
                }
                else
                {
                    numSubstitutions++;
                    if (numSubstitutions >= arguments.length)
                    {
                        alert('Error! Not enough function arguments (' + (arguments.length - 1) + ', excluding the string)\nfor the number of substitution parameters in string (' + numSubstitutions + ' so far).');
                    }
                    var param = arguments[numSubstitutions];
                    var pad = '';
                           if (pPad && pPad.substr(0,1) == "'") pad = leftpart.substr(1,1);
                      else if (pPad) pad = pPad;
                    var justifyRight = true;
                           if (pJustify && pJustify === "-") justifyRight = false;
                    var minLength = -1;
                           if (pMinLength) minLength = parseInt(pMinLength);
                    var precision = -1;
                           if (pPrecision && pType == 'f') precision = parseInt(pPrecision.substring(1));
                    var subst = param;
                           if (pType == 'b') subst = parseInt(param).toString(2);
                      else if (pType == 'c') subst = String.fromCharCode(parseInt(param));
                      else if (pType == 'd') subst = parseInt(param) ? parseInt(param) : 0;
                      else if (pType == 'u') subst = Math.abs(param);
                      else if (pType == 'f') subst = (precision > -1) ? Math.round(parseFloat(param) * Math.pow(10, precision)) / Math.pow(10, precision): parseFloat(param);
                      else if (pType == 'o') subst = parseInt(param).toString(8);
                      else if (pType == 's') subst = param;
                      else if (pType == 'x') subst = ('' + parseInt(param).toString(16)).toLowerCase();
                      else if (pType == 'X') subst = ('' + parseInt(param).toString(16)).toUpperCase();
                }
                str = leftpart + subst + rightPart;
            }
            return str;
        }
//This code is in the public domain

function bytes(num) { return num; }
function kilobytes(num) { return (num * 1024); }
function megabytes(num) { return (num * 1024 * 1024); }
function gigabytes(num) { return (num * 1024 * 1024 * 1024); }
function terabytes(num) { return (num * 1024 * 1024 * 1024 * 1024); }
function petabytes(num) { return (num * 1024 * 1024 * 1024 * 1024 * 1024); }
function exabytes(num) { return (num * 1024 * 1024 * 1024 * 1024 * 1024 * 1024); }

function toPrecision(num,per) {
 var precision = per || 2;
 var s = Math.round(num * Math.pow(10, precision)).toString();
 var pos = s.length - precision;
 var last = s.substr(pos, precision);
 return s.substr(0, pos) + (last.match("^0{" + precision + "}$") ? '' : '.' + last);
}

function toHumanSize(num) {
    if (!num || isNaN(num)) {
        return "unknown Bytes";
    }
  if(num < kilobytes(1))  return num + " Bytes";
  if(num < megabytes(1))  return toPrecision((num / kilobytes(1)))  + ' KB';
  if(num < gigabytes(1)) return toPrecision((num / megabytes(1)))  + ' MB';
  if(num < terabytes(1)) return toPrecision((num / gigabytes(1))) + ' GB';
  if(num < petabytes(1)) return toPrecision((num / terabytes(1))) + ' TB';
  if(num < exabytes(1))  return toPrecision((num / petabytes(1)))  + ' PB';
                             return toPrecision((num / exabytes(1)))   + ' EB';
}

/* ***** BEGIN LICENSE BLOCK *****

# cpanel12 - filemanager_upload.js           Copyright(c) 1997-2008 cPanel, Inc.
#                                                           All Rights Reserved.
# copyright@cpanel.net                                         http://cpanel.net
# This code is subject to the cPanel license. Unauthorized copying is prohibited

 * ***** END LICENSE BLOCK ***** 
  * ***** BEGIN APPLICABLE CODE BLOCK ***** */


var thisuploader=0;
var boxes = 1;
var sdlg;
var createdlg=0;
var asyncRequests = [];
var uploadKeys = [];
var emptyCount = {};
var tNotice;
var tNoticeDialog;
var tNoticetimeout;

var status_timeout;
var finished_uploads = {};

var windowo = window.opener;
var thiswindow = window;
var windowcloser = function() { thiswindow.close(); };

var INITIAL_UPLOAD_STATUS_DELAY = 3000;
var UPLOAD_STATUS_INTERVAL      = 2000;

function gobacktodir(dir) {
  if (windowo && windowo.updateFileList) {
      show_loading("Waiting for File Manager to Refresh");
      setTimeout(windowcloser,10000);
      windowo.updateFileList(dir,0,windowcloser);
      return false;
  } else {
      return true;
  }
}


function safeencode(st) {
    var enc = encodeURIComponent(st);
    var ecp = -1;
    var safeenc = '';

    for(var i=0;i<enc.length;i++) {

        if (ecp >= 0) { ecp++; }
        if (ecp >= 3) { ecp = -1; }
        if (ecp == 1 || ecp == 2) {
            safeenc += enc.substring(i,i+1).toLowerCase();
        } else {
            safeenc += enc.substring(i,i+1);
        }
        if (enc.substring(i,i+1) == '%') {
            ecp = 0;
        }
    }
    
    return safeenc.replace('(','%28').replace(')','%29').replace(',','%2c');
}

// this function adds a file upload input to the page
function adduploader() {
    var thisid=0;
    var uploaders = YAHOO.util.Dom.get("uploaders");

    if (uploaders.hasChildNodes()) {
        thisid+=uploaders.childNodes.length;
    }

    var template_text = DOM.get('uploaderhtml_template').text.trim();
    var uploaderhtml = YAHOO.lang.substitute( template_text, {
        thisid_html: thisid
    } );

    var dNew = document.createElement('div');
    dNew.id='uploader'+thisid;
    dNew.innerHTML=uploaderhtml;
    uploaders.appendChild(dNew);
}

function uploadcallbackfail(o) {
    if (!o) { return; };
    window.status_timeout = setTimeout('updatefilestatus(' + o.argument.thisid + ')',UPLOAD_STATUS_INTERVAL);
}

function uploadcallback(o) {
    if (!o) { return; };

    var root = o.responseXML.documentElement;
    if (root == null || o.responseText == "") {
        if (!emptyCount[uploadKeys[o.argument.thisid]]) { emptyCount[uploadKeys[o.argument.thisid]]=0; }
        emptyCount[uploadKeys[o.argument.thisid]]+=1;

        if (emptyCount[uploadKeys[o.argument.thisid]] >= 30) {
            updatefilestatusHTML(o.argument.thisid,fileName,"unknown",isComplete,0,0,0,1,"Unknown error or disk quota exceeded.");
            return;
        }
        window.status_timeout = setTimeout('updatefilestatus(' + o.argument.thisid + ')',UPLOAD_STATUS_INTERVAL);
        debug("no xml");
        return;
    }
    var fileupload = root.getElementsByTagName('fileupload');
    var totalSize = root.getAttribute('size');
    var niceSize = toHumanSize(totalSize);

    var isComplete = 0;
    var bytesSent = 0;
    var bps = 0;
    var fileName;

    var files = root.getElementsByTagName('file');
    if (files.length > 0) {
        var fileName = files[files.length-1].getElementsByTagName('name');

        var errors = files[files.length-1].getElementsByTagName('error');
        if (errors.length > 0) {
            var failreason = errors[errors.length-1].getAttribute('failreason');
            var failmsg = errors[errors.length-1].getAttribute('failmsg');
            updatefilestatusHTML(o.argument.thisid,fileName,(totalSize || 'unknown'),isComplete,0,0,0,1,failmsg);
            return;
        }

        var progresses = files[files.length-1].getElementsByTagName('progress');
        if (progresses.length > 0) {
            isComplete = progresses[progresses.length-1].getAttribute('complete');
            bytesSent = progresses[progresses.length-1].getAttribute('bytes');
            bps = progresses[progresses.length-1].getAttribute('bps');
        }
    } else {
        debug("no files");
        window.status_timeout = setTimeout('updatefilestatus(' + o.argument.thisid + ')',UPLOAD_STATUS_INTERVAL);
        return;
    }

    var pcomplete=0;

    if (totalSize > 0 && bytesSent) {
        pcomplete = Math.floor((bytesSent/totalSize)*100);
    } else {
        pcomplete = 100;
    }
    updatefilestatusHTML(o.argument.thisid,fileName,totalSize,isComplete,bytesSent,bps,pcomplete);

    // add another callback to updatefilestatus
    if (isComplete != 1) {
        window.status_timeout = setTimeout('updatefilestatus(' + o.argument.thisid + ')',INITIAL_UPLOAD_STATUS_DELAY);
    }
}

var updates = {};
function updatefilestatusHTML(thisid,fileName,fileSize,isComplete,bytesSent,cur_bps,pcomplete,isFailure,failReason) {

    if ( updates[thisid] ) {
        updates[thisid].count++;
        updates[thisid].total_bps += parseFloat(cur_bps);
    }
    else {
        updates[thisid] = { count: 1, total_bps: parseFloat(cur_bps) };
    }

    var bps = updates[thisid].total_bps / updates[thisid].count;

    var pghtml = YAHOO.util.Dom.get('progresstxt'+thisid);

    var pbarcSize = Math.ceil((pcomplete / 100) * 200);
    var pbariSize = Math.floor((1 - (pcomplete / 100)) * 200);

    var pbarimg = YAHOO.util.Dom.get('progress-image' + thisid);
    var pbarc = YAHOO.util.Dom.get('progress-complete' + thisid);
    var pbari = YAHOO.util.Dom.get('progress-incomplete' + thisid);

    var timeleft;

    var niceBps = toHumanSize(bps);

    debug("niceBps" + niceBps);

    if (bps > 0) {
        var secleft  = sprintf("%.2f",((fileSize-bytesSent) / bps));
        var sec = parseInt( secleft % 60 );
        var min = parseInt( secleft / 60 );
        timeleft  = min + 'm ' + sec + 's';
    } else {
        if (!isComplete && !isFailure) { return; }
    }

    var newHTML;
    if (isComplete || isFailure) {
        show_finished_upload(thisid, fileSize, !isFailure, failReason);
    } else if ( !finished_uploads[ thisid ] ) {
        DOM.setStyle( "progress-image"+thisid, "width", pcomplete+"%" );
        var humanSize = toHumanSize(fileSize);
        var humanSent = toHumanSize(bytesSent);
        var thisFile = YAHOO.util.Dom.get('file'+thisid).value;

        var filePath = thisFile.split('/');
        var fileName = filePath[filePath.length-1];

        if ( finished_uploads[ thisid ] ) return;
        newHTML = fileName + ': ' + humanSent + ' / ' + humanSize + ' (' +pcomplete + '%) complete<br />ETA ~ ' + timeleft + ' @ ' + niceBps + '/s';
        debug("new html is" + newHTML);
        pghtml.innerHTML = newHTML;
    }
}

function updatefilestatus(thisid) {
    var statcallback = {
        success : uploadcallback,
        failure : uploadcallbackfail,
        timeout : 10000,
        argument: { thisid:thisid }
    };

    var sUrl = CPANEL.security_token + '/uploadstatus/?uploadid=' + uploadKeys[thisid];
    var thisRequestId = asyncRequests.length;
    asyncRequests[thisRequestId] = YAHOO.util.Connect.asyncRequest('GET', sUrl , statcallback, null);
}

function startupload(file_input,overwriteanyway) {
    var thisid = (file_input.id.split('file'))[1];

    var ro=Math.random()*9999999;
    var ri=Math.floor(ro);

    uploadKeys[thisid] = uploadkey+ri;

    var the_form = file_input.form;

    var thisoverwrite = the_form.overwrite;
    if (overwriteanyway || YAHOO.util.Dom.get('overwrite_checkbox').checked) {
        thisoverwrite.value = "1";
    } else {
        thisoverwrite.value = "0";
    }

    var fmode = document.fmode;
    the_form.permissions.value = "0" + fmode.u.value + fmode.g.value + fmode.w.value;
    the_form["cpanel-trackupload"].value=uploadKeys[thisid];

    DOM.get('upload_queue').appendChild( DOM.get('uploaderstatus'+thisid) );
    YAHOO.util.Dom.get('uploaderstatus'+thisid).style.display='block';

    var iframe = DOM.get("ut"+thisid);
    iframe.onload = function() {
        iframe.onload = function() {};
        var json = CPANEL.util.get_text_content(iframe.contentDocument.documentElement);
        var jdata = YAHOO.lang.JSON.parse(json);
        if (jdata) {
            var upload, diskinfo;
            try {
                upload = jdata.cpanelresult.data[0].uploads[0];
                diskinfo = jdata.cpanelresult.data[0].diskinfo;
            }
            catch(e) {}

            if ( upload && !finished_uploads[thisid]) {
                show_finished_upload( thisid, upload.size, parseInt(upload.status), upload.reason );
            }
            if ( diskinfo ) {
                CPANEL.util.set_text_content("file_upload_remain", diskinfo.file_upload_remain_humansize);
            }
        }
    };

    the_form.submit();
    the_form.style.display = "none";
    file_input.disabled=true;
    adduploader();

    window.status_timeout = setTimeout(function() {updatefilestatus(thisid)}, INITIAL_UPLOAD_STATUS_DELAY);
}

function show_finished_upload(thisid, fileSize, success, failReason) {
    if (finished_uploads[thisid]) return;

    clearTimeout(window.status_timeout);
    finished_uploads[thisid] = true;

    DOM.addClass("uploaderstatus"+thisid, "complete");
    DOM.get("uploaderstatus"+thisid).title = LANG.click_to_close;
    YAHOO.util.Event.on("uploaderstatus"+thisid, "click", function clicker() {
        YAHOO.util.Event.removeListener( this, "click", clicker );  //IE 6
        this.parentNode.removeChild(this);
    } );

    var humanSize = toHumanSize(fileSize);
    var thisFile = YAHOO.util.Dom.get('file'+thisid).value;

    var filePath = thisFile.split('/');
    var fileName = filePath[filePath.length-1].html_encode();

    var pghtml = YAHOO.util.Dom.get('progresstxt'+thisid);
    var newHTML = fileName + ': ' + humanSize + ' complete' + (!success ? (' FAILED! :' + failReason) : '');
    pghtml.innerHTML = newHTML;

    var pbarimg = YAHOO.util.Dom.get('progress-image' + thisid);
    pbarimg.style.backgroundImage = 'url(' + DOM.get("progress_bar_done_prototype").src + ')';

    DOM.setStyle( "progress-image"+thisid, "width", "100%" );
}

function parsexmlStat(o) {
    var root = o.responseXML.documentElement;
    if (root == null) { alert("There was a problem fetching the file list! Please reload and try again."); return; }
    var filelist = root.getElementsByTagName('file');
    if (!filelist || !filelist[0]) {
        startupload(o.argument.file_input);
        return;
    }

    var i = 0;
    var fileexists = 1;
    if ( ! filelist[i].getElementsByTagName('mtime')[0].firstChild ) {
        fileexists = 0;
    } else {
        if ( ! filelist[i].getElementsByTagName('mtime')[0].firstChild.nodeValue ) {
            fileexists = 0;
        }
    }
    thisfile_input = o.argument.file_input;
    var overwrite_files = YAHOO.util.Dom.get("overwrite_checkbox").checked;
    if (fileexists && overwrite_files == false) {
        var fileName = unescape(filelist[i].getElementsByTagName('name')[0].firstChild.nodeValue);
        var fileMtime = unescape(filelist[i].getElementsByTagName('mtime')[0].firstChild.nodeValue);
        var theDate = new Date(fileMtime * 1000);
        var niceMtime = theDate.toLocaleString();

        var clickyes = function() { this.hide(); startupload(thisfile_input,1); };
        var clickno = function(){ this.hide();  };
        var msg = YAHOO.lang.substitute( DOM.get("already_exists_template").text.trim(), {
            file_html     : fileName.html_encode(),
            last_mod_html : niceMtime.html_encode()
        } );

        if (!createdlg) {
            sdlg = new YAHOO.widget.SimpleDialog("sdlg1", {
                width: "450px",
                fixedcenter: true,
                visible: false,
                modal: true,
                draggable: false,
                close: true,
                constraintoviewport: true,
                effect: {effect: CPANEL.animate.ContainerEffect.FADE_MODAL, duration:0.25},
                buttons: [
                    { text:LANG.yes, handler:clickyes, isDefault:true },
                    { text:LANG.no,  handler:clickno }
                ]
            } );
            sdlg.setHeader("<div class='lt'></div>&nbsp;<div class='rt'></div>");
            createdlg=1;
        }
        sdlg.cfg.queueProperty("text",msg);
        sdlg.render();
        sdlg.show();
    } else {
        startupload(o.argument.file_input);
    }
}

function xmlStaterrorFunction(o) {
    if (!o) { return; };
    alert("Error: " + o.status + " " + o.statusText + " There was a problem fetching the files information: " + o.responseText);
}

function uploadfile(file_input) {
    var thisFile = file_input.value;
    var backSlash = String.fromCharCode(92); 
    var matchchar = '/';
    if (thisFile.indexOf(backSlash) > -1) {
        matchchar = backSlash;
    }
    var filePath = thisFile.split(matchchar);
    var fileName = safeencode(filePath[filePath.length-1]);

    var statcallback = {
        success : parsexmlStat,
        failure : xmlStaterrorFunction,
        argument : { file_input : file_input }
    };

    var sUrl = "live_statfiles.xml?files=" + safeencode(dir) + '%2f' + fileName;
    var thisRequestId = asyncRequests.length;
    asyncRequests[thisRequestId] = YAHOO.util.Connect.asyncRequest('GET', sUrl , statcallback, null);
}

function debug(txt) {
    return false;
}

function setuppanels () {
    window.waitpanel = new YAHOO.widget.Panel( "waitpanel", {
        width:"252px",
        fixedcenter:true,
        close:false,
        draggable:false,
        modal:true,
        visible:false,
        effect: {effect: CPANEL.animate.ContainerEffect.FADE_MODAL, duration:0.25}
    } );
}

function show_loading(action,body) {
    waitpanel.setHeader(action);
    var loadingimg = '<img src="img/yui/rel_interstitial_loading.gif" alt="" />';
    if (body) {
        waitpanel.setBody(body + '<br />' + loadingimg);
    }  else {
        waitpanel.setBody(loadingimg);
    }
    waitpanel.render(document.body);
    waitpanel.show();
}

// this function loads when the DOM is ready
function initialize() {
    adduploader();

    // initialize the panels
    setuppanels();

    var chmod_div = DOM.get("chmod");
    var fmode_form = document.fmode;
    fmode_form.onsubmit = function() { return false };
    fmode_form.ur.checked = fmode_form.gr.checked = fmode_form.wr.checked = true;
    fmode_form.uw.checked = true;
    calcperm();
    DOM.removeClass("chmodtbl","sortable");
    chmod_div.parentNode.replaceChild(fmode_form, chmod_div);
    YAHOO.util.Event.throwErrors = true;
}
YAHOO.util.Event.onDOMReady(initialize);
/* ***** BEGIN LICENSE BLOCK *****

# cpanel12 - xmlapi.js                       Copyright(c) 1997-2008 cPanel, Inc.
#                                                           All Rights Reserved.
# copyright@cpanel.net                                         http://cpanel.net
# This code is subject to the cPanel license. Unauthorized copying is prohibited

 * ***** END LICENSE BLOCK ***** 
  * ***** BEGIN APPLICABLE CODE BLOCK ***** */
var use_fast_proto=1;

function cpanel_api1() {
    var argv = cpanel_api1.arguments;
    var mycallback = argv[0];
    var module = argv[1];
    var func = argv[2];
    var argc = argv.length;
    
    var callback = {
        success: cpanel_api1_parser,
        argument: mycallback
    };
    
    var sFormData;
    if (use_fast_proto) {
        sFormData = 'cpanel_xmlapi_module=' + encodeURIComponent(module) + '&cpanel_xmlapi_func=' + encodeURIComponent(func) + '&cpanel_xmlapi_apiversion=1';
        var argnum=0;
        for(var i=3;i<argc;i++) {
            sFormData += '&arg-' + argnum + '=' + encodeURIComponent(argv[i]);
            argnum++;
        }
    } else {
        sFormData = 'xmlin=<cpanelaction><apiversion>1</apiversion><module>' + module + '</module><func>' + func + '</func>';
        for(var i=3;i<argc;i++) {
            sFormData += '<args>' + argv[i] + '</args>';
        }
        sFormData += '</cpanelaction>';
    }
    if (sFormData.length < 2000) {
        YAHOO.util.Connect.asyncRequest('GET', CPANEL.security_token + '/xml-api/cpanel?' + sFormData , callback);
    } else {
        YAHOO.util.Connect.asyncRequest('POST', CPANEL.security_token + '/xml-api/cpanel' , callback,sFormData);
    }
}

function cpanel_api1_parser(o) {
    var mycallback = o.argument;
    var rootNode = o.responseXML;
    var cpanelresultEl = rootNode.getElementsByTagName('cpanelresult')[0];
    var cpaneldataEl = cpanelresultEl.getElementsByTagName('data')[0];
    var dataresultEl = cpaneldataEl.getElementsByTagName('result')[0];

    var parsed_data;
    if( dataresultEl.firstChild ) { 
        parsed_data = dataresultEl.firstChild.nodeValue;
    }
    if (mycallback) {
        mycallback(parsed_data);
    }
}

function cpanel_api2() {
    var argv = cpanel_api2.arguments;
    var mycallback = argv[0];
    var module = argv[1];
    var func = argv[2];
    var argc = argv.length;
    
    var callback = {
        success: cpanel_api2_parser,
        argument: mycallback
    };

    var sFormData;
    if (use_fast_proto) {
        sFormData = 'cpanel_xmlapi_module=' + encodeURIComponent(module) + '&cpanel_xmlapi_func=' + encodeURIComponent(func) + '&cpanel_xmlapi_apiversion=2';
         for(var i=3;i<argc;i+=2) {
            sFormData += '&' + encodeURIComponent(argv[i]) + '=' + encodeURIComponent(argv[i+1]);
        }
    } else {
        sFormData = 'xmlin=<cpanelaction><apiversion>2</apiversion><module>' + module + '</module><func>' + func + '</func><args>';
        for(var i=3;i<argc;i+=2) {
            sFormData += '<' + argv[i] + '>' + argv[i+1] + '</' + argv[i] + '>';
        }
        sFormData += '</args></cpanelaction>';
    }
    if (sFormData.length < 2000) {
        YAHOO.util.Connect.asyncRequest('GET', CPANEL.security_token + '/xml-api/cpanel?' + sFormData , callback);
    } else {
        YAHOO.util.Connect.asyncRequest('POST', CPANEL.security_token + '/xml-api/cpanel' , callback,sFormData);
    }
}

function cpanel_api2_parser(o) {
    var mycallback = o.argument;
    var rootNode = o.responseXML;
    var cpanelresultEl = rootNode.getElementsByTagName('cpanelresult')[0];
    var cpaneldataEl = cpanelresultEl.getElementsByTagName('data');

    if (mycallback) {
        mycallback(cpaneldataEl);
    }
}
/* ***** BEGIN LICENSE BLOCK *****

# cpanel12 - jsonapi.js                       Copyright(c) 1997-2009 cPanel, Inc.
#                                                           All Rights Reserved.
# copyright@cpanel.net                                         http://cpanel.net
# This code is subject to the cPanel license. Unauthorized copying is prohibited

 * ***** END LICENSE BLOCK ***** 
  * ***** BEGIN APPLICABLE CODE BLOCK ***** */

function cpanel_jsonapi1() {
    var argv = cpanel_jsonapi1.arguments;
    var mycallback = argv[0];
    var module = argv[1];
    var func = argv[2];
    var argc = argv.length;
    
    var callback = {
        success: cpanel_jsonapi1_parser,
        failure: mycallback,
        argument: mycallback
    };
    
    var sFormData = 'cpanel_jsonapi_module=' + encodeURIComponent(module) + '&cpanel_jsonapi_func=' + encodeURIComponent(func) + '&cpanel_jsonapi_apiversion=1';
    var argnum=0;
    for(var i=3;i<argc;i++) {
        sFormData += '&arg-' + argnum + '=' + encodeURIComponent(argv[i]);
        argnum++;
    }
    if (sFormData.length < 2000) {
        YAHOO.util.Connect.asyncRequest('GET', CPANEL.security_token + '/json-api/cpanel?' + sFormData , callback);
    } else {
        YAHOO.util.Connect.asyncRequest('POST', CPANEL.security_token + '/json-api/cpanel' , callback,sFormData);
    }
}

function cpanel_jsonapi1_parser(o) {
    var mycallback = o.argument;
    var jsonCode = fastJsonParse(o.responseText);
    if (mycallback) {
        mycallback(jsonCode.cpanelresult.data.result);
    }
}

function cpanel_jsonapi2() {
    var argv = cpanel_jsonapi2.arguments;
    var mycallback = argv[0];
    var module = argv[1];
    var func = argv[2];
    var argc = argv.length;
    
    var callback = {
        success: cpanel_jsonapi2_parser,
        failure: mycallback,
        argument: mycallback
    };

    var sFormData = 'cpanel_jsonapi_module=' + encodeURIComponent(module) + '&cpanel_jsonapi_func=' + encodeURIComponent(func) + '&cpanel_jsonapi_apiversion=2';
    for(var i=3;i<argc;i+=2) {
        sFormData += '&' + encodeURIComponent(argv[i]) + '=' + encodeURIComponent(argv[i+1]);
    }
    if (sFormData.length < 2000) {
        YAHOO.util.Connect.asyncRequest('GET', CPANEL.security_token + '/json-api/cpanel?' + sFormData , callback);
    } else {
        YAHOO.util.Connect.asyncRequest('POST', CPANEL.security_token + '/json-api/cpanel' , callback,sFormData);
    }
}

function cpanel_jsonapi2_parser(o) {
    var mycallback = o.argument;
    var jsonCode = fastJsonParse(o.responseText);
    if (mycallback) {
        mycallback(jsonCode.cpanelresult.data);
    }
}
var NativeJson = Object.prototype.toString.call(this.JSON) === '[object JSON]' && this.JSON;
function fastJsonParse (s, reviver) {
          return NativeJson ?
        NativeJson.parse(s,reviver) : YAHOO.lang.JSON.parse(s,reviver);
}
