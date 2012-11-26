var Brand = new Object();
var EU = YAHOO.util.Event;
var DDM = YAHOO.util.DDM;

function number_brand(num,file,subtype) {
    if (file.match(/_vps|_opt/)) { return; } /*special case */

    Brand[num]={file:file, subtype:subtype, number:num};
}


function load_branding() {
    for(var i in Brand) {
        var subtype=Brand[i].subtype;
        var file=Brand[i].file; 
        var num = Brand[i].number;
        var bid =  new String('branding-' + subtype + '-' + file);
        var el = document.getElementById(bid);
        if (!el) {
            bid = bid.replace('_on','_off');
            el = document.getElementById(bid);
        }
        if (!el) {
            bid = new String('logo-' + file);
            el = document.getElementById(bid);
        }
        if (!el) {
            bid = bid.replace('_on','_off');
            el = document.getElementById(bid);
        } 
        if (!el) { alert("missing bid: " + bid); continue; }
        var conR = new YAHOO.util.Region.getRegion(document.getElementById('heading-top-header-bg'));
        var objR = new YAHOO.util.Region.getRegion(el);
var custom = new YAHOO.ext.Resizable(el.id, {
       wrap:true,
            minWidth:20,
            minHeight:20,
            preserveRatio: true,
            handles: 'all',
            draggable:true,
            dynamic:true
});
var HandleResize = function (e) {
    var imgEl = e.getEl();
    var csswidth =  document.getElementById(imgEl.id).firstChild.offsetWidth;
    var cssheight =  document.getElementById(imgEl.id).firstChild.offsetHeight;

    var newcss = '#cpanel #border-efx #heading-top-header-bg #heading-top-billboard #logo img { width: ' + csswidth + 'px; height: ' + cssheight + 'px; }';
    document.getElementById('imgcss').innerHTML=newcss;
    var NewobjR = new YAHOO.util.Region.getRegion(DDM.getDDById(imgEl.id).getEl().id); 
    var csstop = NewobjR.top-conR.top-2; /*correct for the div*/
    var cssleft = NewobjR.left-conR.left;
    var newcss2 = '#cpanel #border-efx #heading-top-header-bg #heading-top-billboard #logo { top: ' + csstop + 'px; left: ' + cssleft + 'px; }';

    document.getElementById('css').innerHTML=newcss2;

    savecss(newcss + "\n" + newcss2);
 
}
custom.addListener("resize",HandleResize);
        var dragger = custom.dd;
        dragger.setXConstraint(objR.left-conR.left,conR.right-objR.right);
        dragger.setYConstraint(objR.top-conR.top,conR.bottom-objR.bottom);
   
var csswidth =  el.offsetWidth;
   var cssheight =  el.offsetHeight;

        document.getElementById('imgcss').innerHTML='#cpanel #border-efx #heading-top-header-bg #heading-top-billboard #logo img { width: ' + csswidth + 'px; height: ' + cssheight + 'px; }';


     var csstop = objR.top-conR.top-2; /*correct for the div*/
        var cssleft = objR.left-conR.left;

        document.getElementById('css').innerHTML='#cpanel #border-efx #heading-top-header-bg #heading-top-billboard #logo { top: ' + csstop + 'px; left: ' + cssleft + 'px; }';
        dragger.onInvalidDrop = function(e) {
            var NewobjR = new YAHOO.util.Region.getRegion(this.getEl()); 
            var csstop = NewobjR.top-conR.top-2; /*correct for the div*/
            var cssleft = NewobjR.left-conR.left;
            var newcss = '#cpanel #border-efx #heading-top-header-bg #heading-top-billboard #logo { top: ' + csstop + 'px; left: ' + cssleft + 'px; }';
            document.getElementById('css').innerHTML=newcss;
            savecss(newcss);
        };
    }
}

function cssSave(o) {
    var root = o.responseXML.documentElement;
    if (root == null) {
    document.getElementById('cssnotes').innerHTML = LANG.problem_saving_css;
    return;
    }
    var merged = root.getElementsByTagName('merge'); 
    if (merged && merged[0] && merged[0].firstChild && merged[0].firstChild.nodeValue == "1") {
        var file = root.getElementsByTagName('file'); 
        document.getElementById('cssnotes').innerHTML = LANG.saved_ + file[0].firstChild.nodeValue;
    }
    else { 
        document.getElementById('cssnotes').innerHTML = LANG.problem_saving_css_error_log;
    }
}
function savecss(newcss) { 
        var callback =
        {   
success:cssSave,
failure:cssSave
        };

        var sUrl = "cssmerge.xml?brandingpkg=" + brandingpkg + "&css=" + encodeURIComponent(newcss);


        YAHOO.util.Connect.asyncRequest('GET', sUrl , callback, null);
}


YAHOO.util.Event.addListener(window, "load", load_branding);

