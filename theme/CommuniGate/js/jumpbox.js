/* ***** BEGIN LICENSE BLOCK *****

# cpanel12 - jumpbox.js                      Copyright(c) 1997-2008 cPanel, Inc.
#                                                           All Rights Reserved.
# copyright@cpanel.net                                         http://cpanel.net
# This code is subject to the cPanel license. Unauthorized copying is prohibited

 * ***** END LICENSE BLOCK ***** 
  * ***** BEGIN APPLICABLE CODE BLOCK ***** */

register_interfacecfg_nvdata('x3finder');

function collapse() {
    /* Needs to be implmented in 11.6 */
    /* Should use /xml-api/cpanel to set nvdata */
    /* import xml-api.js */
}
/*perhaps some yui auto complete here as well */
var idgen = 0;

var ElementTextCache = {};
var tblParentCache = {};
var JumpEl;
var jumpcount = 0;

var insearch = 0;

function searchpage(searchBoxEl) {
    var searchText = searchBoxEl.value.toLowerCase();
    var rootSearchElement = document.getElementById('boxes');
    if (!rootSearchElement) {
        rootSearchElement = document.getElementById('x');
    }
    
    var liEls = rootSearchElement.getElementsByTagName('div');
    var matchCount = 0;
    var allParentUls = {};
    var matchedParentUls = {};
    var matchEl;

    if (! insearch) { 
		/* call to boxes_combined.js */
        tempexpandboxes();
        insearch = 1;
        if (NVData['x3finder'] != 'off') {
			SetNvData('x3finder', 'off');
		}
    }

    if (! searchText) {
        /* call to boxes_combined.js */
        restoreboxes();
        insearch = 0;
        document.getElementById('clearlnk').style.display = 'none';
    }
	
    for (var i = 0; i < liEls.length; i++) {
	    if (YAHOO.util.Dom.hasClass(liEls[i],'item') == false) continue;
		
        var innerText;
        if (! ElementTextCache[liEls[i].id] || ElementTextCache[liEls[i].id] == "") {
			// add the innerHTML text to the search cache
            innerText = liEls[i].innerHTML.replace(/\<[^\>]+\>/g,'').toLowerCase();
			
			// add the additional search text if it exists
			var additional_search_text = '';
			var additional_search_text_el = YAHOO.util.Dom.getFirstChildBy(liEls[i], function(e) { return YAHOO.util.Dom.hasClass(e, "additional_search_text"); });
			if (additional_search_text_el == true) {
				additional_search_text = additional_search_text_el.innerHTML;
			}
			innerText += " " + additional_search_text;
			
            ElementTextCache[liEls[i].id] = innerText;
        }
		else {
            innerText = ElementTextCache[liEls[i].id];
        }

        var tblParent = getTblParent(liEls[i]);
        if (innerText.match(searchText)) {
            matchEl = liEls[i];
            matchCount++;

            YAHOO.util.Dom.removeClass(liEls[i], 'searchhide');
            matchedParentUls[tblParent.id] = 1;
            allParentUls[tblParent.id] = tblParent;
        }
		else {
            allParentUls[tblParent.id] = tblParent;
            YAHOO.util.Dom.addClass(liEls[i], 'searchhide');
        }
    }
    if (matchCount == 0) {
        document.getElementById('gosearch').style.display = '';
    }
	else {
        document.getElementById('gosearch').style.display = 'none';
    }
    if (searchText) {
        document.getElementById('clearlnk').style.display = '';
    }
	
	//for (var i = 0; i < allParentUls.length; i++) {
	for (var i in allParentUls) {
        if (matchedParentUls[i]) {
            YAHOO.util.Dom.removeClass(allParentUls[i], 'searchhide');
        }
		else {
			YAHOO.util.Dom.addClass(allParentUls[i], 'searchhide');
        }
    }
}

function getTblParent(tagEl) {
    if (!tagEl.id) { 
        tagEl.id = 'idgen' + idgen++;
    }
    if (tblParentCache[tagEl.id]) { return tblParentCache[tagEl.id]; } 
    
    var thisEl = tagEl;
    while((thisEl.tagName != "DIV" || !YAHOO.util.Dom.hasClass(thisEl,'itembox')) && thisEl.parentNode) {
        thisEl = thisEl.parentNode;
    }
    tblParentCache[tagEl.id] = thisEl;
    return thisEl;
}

function clearsearch() {
    var quickJumpEl = document.getElementById('quickjump');
    quickJumpEl.value='';
    searchpage(quickJumpEl);
/* call to boxes_combined.js */
    restoreboxes();
    insearch = 0;
}

function gosearch() {
    var lnkEls = jumpEl.getElementsByTagName('a');
    if (! lnkEls[0].name) {
        lnkEls[0].name = 'jump' + jumpcount++;
    }
    window.location.href='#' + lnkEls[0].name;
}

function focus_quickjump() {
    var quickJumpEl = document.getElementById('quickjump');
    if (!quickJumpEl) return;

    quickJumpEl.focus();
}
YAHOO.util.Event.onDOMReady(focus_quickjump);
