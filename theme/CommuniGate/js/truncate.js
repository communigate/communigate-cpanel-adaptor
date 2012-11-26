/* ***** BEGIN LICENSE BLOCK *****

# cpanel12 - truncate.js                     Copyright(c) 1997-2008 cPanel, Inc.
#                                                           All Rights Reserved.
# copyright@cpanel.net                                         http://cpanel.net
# This code is subject to the cPanel license. Unauthorized copying is prohibited

 * ***** END LICENSE BLOCK ***** 
  * ***** BEGIN APPLICABLE CODE BLOCK ***** */


var maxwidth = 710;
var truncate_fontsize = 11;
var quirksmode = 'Mozilla';
if (navigator.appVersion.indexOf("Safari")!=-1){
    quirksmode = 'Safari';
}
if (navigator.appVersion.indexOf("MSIE")!=-1){
    quirksmode = 'MSIE';
}
if (navigator.appVersion.indexOf("Opera")!=-1 || navigator.userAgent.indexOf("Opera")!=-1){
    quirksmode = 'Opera';
}


function getRegion(el) {
    if (quirksmode == 'Safari' && el.cells && el.cells[0]) {
        var p = YAHOO.util.Dom.getXY(el.cells[0]);
        var t = p[1];
        var r = p[0];
        for(var i = 0; i < el.cells.length ; i++) {
            r += el.cells[i].offsetWidth;
        }
        var b = p[1] + el.cells[0].offsetHeight;
        var l = p[0];

        return new YAHOO.util.Region(t, r, b, l);
    }
    return YAHOO.util.Region.getRegion(el);
}

var truncate_on = 0;
var truncate_tooltips = 0;
var truncate_wrap = 1;
var truncate_start_row = 1;
var truncatetables = [];
var truncatetableids = [];

function post_register_truncate_tables() {
    for(var i=0;i<truncatetableids.length;i++) {
        var thistbl = document.getElementById(truncatetableids[i]);
        if (!thistbl) {
            alert("truncate.js: Table not found " + truncatetableids[i]);
        } else {
            truncate_on=1;
            var hastbl = 0;
            for(var i=0;i<truncatetables.length;i++) {
                if (truncatetables[i].id==thistbl.id) {
                    hastbl=1;
                }
            }
            if (!hastbl) {
                truncatetables.push(thistbl);
            }
        }
    }
}

function register_truncate_table(tid) {
    truncatetableids.push(tid);
}

function truncater(){
    post_register_truncate_tables();
    if (! truncate_on) { return; }

    var ttid = 0;
    var fontwidth = 1.50;
    if (!truncatetables) { return; }        
    for(var t=0;t<truncatetables.length;t++) {
        if (truncatetables[t].rows.length > 1000) { continue; }
        var fixedtruncate = 0;
        if (truncatetables[t].getAttribute('fixedtruncate')) {
            fixedtruncate = 1;
        }
        var truncaterows = truncatetables[t].rows;
        var rowRegion = getRegion(truncaterows[0]); 
        var rowWidth = (rowRegion.right - rowRegion.left);
        for (var i = truncate_start_row; i < truncaterows.length; i++){
            if (!fixedtruncate && rowWidth < maxwidth) { continue; } 

            var cellsWidth = 0;
            var truncateRows = [];
            var truncatePercent = [];
            for(var j=0;j<truncaterows[i].cells.length;j++) {
                if (! YAHOO.util.Dom.hasClass(truncaterows[i].cells[j],"truncate")) {
                    /* usually I want to mash IE but this is a safari bug */
                    var cw = truncaterows[i].cells[j].offsetWidth;
                    if (cw && !isNaN(cw)) {
                        cellsWidth+=cw;
                    }                
                } else {
                    truncateRows.push({row:truncaterows[i].cells[j],fixed:truncaterows[i].cells[j].getAttribute('truncatefixed'),percent:truncaterows[i].cells[j].getAttribute('truncate')});
                }
            }
            var newcellWidth = (maxwidth - cellsWidth);
            var fontsize = parseInt(truncaterows[i].style.fontSize) || truncate_fontsize;
                
            for(var j=0;j<truncateRows.length;j++) {
                var cellContents;
                var newLength;
                if (truncateRows[j].fixed) {
                    newLength = parseInt(truncateRows[j].fixed);
                } else {
                    var cellPercentage = truncateRows[j].percent;
                    if (!cellPercentage) { cellPercentage = 100 / truncateRows.length; }
                    var thisCellWidth = newcellWidth * (cellPercentage / 100); 
                    newLength = parseInt(thisCellWidth / (fontsize / fontwidth));
                }
                cellContents = getFirstTextNode(truncateRows[j].row);
                if (!cellContents) { continue; /* empty cell */ }
                cellText = cellContents.nodeValue;
                if (!cellText) { continue; }

                if (newLength + 2 >= cellText.length) { continue; }
                if (newLength < 17) { newLength = 17; }
                truncateRows[j].row.removeAttribute('nowrap');

                var tspan = document.createElement('span');
                tspan.innerHTML=break_text(cellText,newLength,truncate_wrap);

                var myParent = cellContents.parentNode;
                myParent.removeChild(cellContents);
                myParent.appendChild(tspan);

                while(tspan.offsetWidth > newcellWidth && newLength > 17) {
                    newLength--;
                    if (newLength < 4) { break; }
                    tspan.innerHTML=break_text(cellText,newLength,truncate_wrap);
                }
                if (truncate_tooltips) {
                    var overimg = document.createElement('img');
                    overimg.src="/frontend/" + thisTheme + "/images/arrow-right.gif";
                    overimg.style.display='inline';
                    overimg.setAttribute('title',cellText);

                    truncateRows[j].row.appendChild(overimg);
                    ttid++;
                    var tooltip = new YAHOO.widget.Tooltip("truncate_tt" + ttid,  
                            { context:overimg,  
text:cellText }); 
                }
            }
        }
    }
}


function getFirstTextNode(el) {
    var l = el.childNodes.length;
    for (var i = 0; i < l; i++) {
        switch (el.childNodes[i].nodeType) {
            case 1: //ELEMENT_NODE
                var thisnode = getFirstTextNode(el.childNodes[i]);
                if (thisnode) { return thisnode; }
                break;
            case 3: //TEXT_NODE
                return el.childNodes[i];
                break;
        }
    }
}


function break_text(cellText,newLength,truncate_wrap) {        
	var startpt = 0;
	var newText = '';
    if (newLength < 4) { return cellText; }
    while(1) {
		newText += cellText.substr(startpt,newLength);
		if (truncate_wrap) {
			startpt += newLength;
			if (startpt >= cellText.length || startpt > 4096) {
				break;
			}
			newText += "<br />";
		} else {
			break;
		}
	}
	if (truncate_wrap) { newText+=" "; }
	return newText;
}

YAHOO.util.Event.onDOMReady(truncater);
