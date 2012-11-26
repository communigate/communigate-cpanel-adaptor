var currentuser;
var isreseller;

function getQSV(qv) {
  var queryString = window.location.search.substring(1);
  var vars = queryString.split("&");
  for (var i=0;i<vars.length;i++) {
    var pair = vars[i].split("=").map(decodeURIComponent);
    if (pair[0] == qv) {
      return pair[1];
    }
  }
  return -1;
}

function checkbranding_table() {
   var brandingpkg = getQSV('brandingpkg');
   if (brandingpkg != -1) {
        var brandingTblEl = document.getElementById('bpkg-list');
        var bRows = brandingTblEl.getElementsByTagName('tr');
        for(var i=1;i<bRows.length;i++) {
            if (bRows[i].id != "brandingpkg/" + brandingpkg) {
                bRows[i].style.display='none';
            } else {
                bRows[i].style.display='';
            }
        }
        document.getElementById('showall_branding').style.display='';
   }
}
function showall_branding() {
        document.getElementById('showall_branding').style.display='none';
        var brandingTblEl = document.getElementById('bpkg-list');
        var bRows = brandingTblEl.getElementsByTagName('tr');
        for(var i=1;i<bRows.length;i++) {
                bRows[i].style.display='';
        }
}
function checkmakepack() {
    var pack = document.makepack.pkg.value;
    if (pack == '') {
        alert(LANG.name_for_package);
        return false;
    }
}
function checkuppack(){
	var uppack = document.uploadpack.file1.value;
	if (uppack == '') {
        alert(LANG.package_to_upload);
        return false;
    }
}

function Branding_SetAllCheckBoxes(FormName, FieldName, CheckValue)
{
	if(!document.forms[FormName])
		return;
	var objCheckBoxes = document.forms[FormName].elements[FieldName];
	if(!objCheckBoxes)
		return;
	var countCheckBoxes = objCheckBoxes.length;
	if(!countCheckBoxes)
		objCheckBoxes.checked = CheckValue;
	else
		// set the check value for all check boxes
		for(var i = 0; i < countCheckBoxes; i++) {
			objCheckBoxes[i].checked = CheckValue;
            check_boxes(objCheckBoxes[i]);
        }
}

function SetitRight(){       
	if(!document.forms[0])        
		return;      
	var countCheckBoxes = document.forms[0].length;    
	for(var i = 0; i < countCheckBoxes; i++) {        
		var objCheckBoxs = document.forms[0].elements[i];            
		check_boxes(objCheckBoxs);    
	}
}
function disablelinks( bpkg){
        document.getElementById('applybpkg/' + bpkg).href = "javascript:void(0)";
        document.getElementById('applyallbpkg/' + bpkg).href = "javascript:void(0)";
        document.getElementById('setdefaultpkg/' + bpkg).href = "javascript:void(0)";
        document.getElementById('editbpkg/' + bpkg).href = "javascript:void(0)";
}
function enablelinks( bpkg){
        document.getElementById('applybpkg/' + bpkg).href = "switchstyle.html?brandingpkg=" + bpkg;
        document.getElementById('applyallbpkg/' + bpkg).href = "applyaccts.html?brandingpkg=" + bpkg;
        document.getElementById('setdefaultpkg/' + bpkg).href = "setdefault.html?brandingpkg=" + bpkg;
        document.getElementById('editbpkg/' + bpkg).href = "edit_bpkg.html?brandingpkg=" + bpkg;
}
function parse_pkgout(o){
console.log(this,arguments);
    var bpkg = o.argument.extvar;
    var rootNode = o.responseXML.getElementsByTagName('xml')[0];
    var packages = rootNode.getElementsByTagName('package');
    var branding = Array.prototype.filter.call(packages,function(p) { return p.getAttribute("name") === bpkg })[0];
    var pkgIMGsrc = CPANEL.util.get_text_content( branding.getElementsByTagName('previewimg')[0] );
    var pkgIMG = CPANEL.util.get_text_content( branding.getElementsByTagName('previewsmimg')[0] );
    var sHTML = "<a href='" + pkgIMGsrc.html_encode() + "'><img src='" + pkgIMG.html_encode() + "' alt='' /></a>";
    document.getElementById('image/' + bpkg).innerHTML = sHTML;
}
function check_boxes(mybox) {    
	var bpkgenabledname = mybox.id;
	var bpkg = bpkgenabledname.split('/')[0];
	var bpname = 'brandingpkg/' + bpkg;
	var sUrl = 'branding_status.xml';    
	var newstatus = 'disable';    
	var bClass = document.getElementById(bpname).className;    
	var bClasses = bClass.split(' ');    
	bClasses.pop();    
	if (mybox.checked) { 
		newstatus='enable'; 	
	}        
	if (newstatus == 'disable') {       
		document.getElementById(bpkg + '/display').className='brandingpkg-1';        
		var sHTML = DISABLED_IMG;        
		document.getElementById('image/' + bpkg).innerHTML=sHTML;            
		document.getElementById('ul/' + bpkg).className='greyedout';            
		disablelinks(bpkg);
		//get_enable_text('disabled', bpkg);
    }     
}

//preload this file
var DISABLED_IMG = "<img src='../../images/disable-previewsm2.gif' />";
EVENT.onDOMReady( function() {
    var div = document.createElement("div");
    div.style.display = "none";
    div.innerHTML = DISABLED_IMG;
    document.body.appendChild(div);
} );

function toggle_pkg(mybox) {
    var bpkgenabledname = mybox.id;
    var bpkg = bpkgenabledname.split('/')[0];
    var bpname = 'brandingpkg/' + bpkg;

    var newstatus = mybox.checked ? "enable" : "disable";
    var url = mybox.checked ? "brandinginfo.xml" : "branding_status.xml";

    var postData = 'brandingpkg=' + encodeURIComponent(bpkg) + '&status=' + newstatus;

    var onsuccess = function(o) {
        if (newstatus == 'disable') {
            document.getElementById('image/' + bpkg).innerHTML = DISABLED_IMG;
            DOM.addClass( "ul/"+bpkg, "greyedout");
            DOM.replaceClass( bpkg+"/display", "brandingpkg-0", "brandingpkg-1");
            disablelinks(bpkg);
        }
        else {
            DOM.removeClass( "ul/"+bpkg, "greyedout");
            DOM.replaceClass( bpkg+"/display", "brandingpkg-1", "brandingpkg-0");
            enablelinks(bpkg);
            parse_pkgout.apply(this,arguments);
        }
    }

    var callback = {
        success: onsuccess,
        argument: {extvar: bpkg}
    };

    YAHOO.util.Connect.asyncRequest('POST', url, callback, postData); //YUI bug 2528480
}

function applyToAccounts(El) {
    if (currentuser == 'cpanel') {
        var pkg = El.id.split('/').pop();
        if (!pkg) { pkg = ''; } 
        // Do you want to apply this to reseller's accounts as well?
        document.getElementById('reseller_apply_pkg').value=pkg;
        CPANEL.util.set_text_content("reseller_apply_pkgname", pkg || "[root]");
        make_form_popup('reseller_apply_dialog', function() {
            this.hide();
            show_loading(LANG.applying_your_changes);
            setTimeout(submit_apply,2000);
        } );
        popupwindows['reseller_apply_dialog'].show();
        return false;
    }
    return true;
}

function submit_setdefault() {
    document.getElementById('reseller_setdefault_form').submit(); 
}

function submit_apply() {
    document.getElementById('reseller_apply_form').submit(); 
}

function setDefault(El) {
    if (currentuser == 'cpanel') {
        var pkg = El.id.split('/').pop();
        if (!pkg) { pkg = ''; } 
        // Do you want to set this as the default for reseller's accounts as well?
        document.getElementById('reseller_setdefault_pkg').value=pkg;
        CPANEL.util.set_text_content("reseller_setdefault_pkgname", pkg || "[root]");
        make_form_popup('reseller_setdefault_dialog', function() {
            this.hide();
            show_loading(LANG.applying_your_changes);
            setTimeout(submit_setdefault,2000);
        });
        popupwindows['reseller_setdefault_dialog'].show();
        return false;
    }
    return true;
} 


function make_form_popup(Elid,handlerFunc) {
    if (!popupwindows) { popupwindows={}; }
    if ( popupwindows[Elid] ) { return; }
    document.getElementById(Elid).style.display='';
    var pixels=500;
    popupwindows[Elid] = new YAHOO.widget.Dialog( Elid, {
        effect:{effect:YAHOO.widget.ContainerEffect.FADE,duration:0.25},
        width: pixels,
        buttons: [
            { text:"Submit", handler:handlerFunc, isDefault:true },
            { text:"Close", handler:function() { popupwindows[Elid].hide(); }, isDefault:false }
        ],
        fixedcenter: true,
        constraintoviewport: true,
        underlay:"none",
        close:true,
        visible:false,
        draggable:true,
        modal:false
    } );
    popupwindows[Elid].render();
}

YAHOO.util.Event.onDOMReady(checkbranding_table);
