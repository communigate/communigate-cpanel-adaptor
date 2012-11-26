/* ***** BEGIN LICENSE BLOCK *****

# cpanel12 - expander.js                     Copyright(c) 1997-2008 cPanel, Inc.
#                                                           All Rights Reserved.
# copyright@cpanel.net                                         http://cpanel.net
# This code is subject to the cPanel license. Unauthorized copying is prohibited

 * ***** END LICENSE BLOCK ***** 
  * ***** BEGIN APPLICABLE CODE BLOCK ***** */


var expanded = {};
var expanding = {};
var tracker = {};
var expc = [];
var expander_active = 0;
var expander_on = 0;

function getTime() {
    var d = new Date();
    return (d.getTime());
}

function unshadow (DivId) {
    if (! expander_on) { return; }
    var SplitDivId = DivId.split('_');
    if (SplitDivId[SplitDivId.length-1] == '0') {
        SplitDivId.pop();
    } else {
        return DivId;
    }
    return SplitDivId.join('_');
}

function shadow (DivId) {
    return DivId + '_0';
}

/* when the mouse leave the div we need to collapse it */
function runAnimOut_single(originalDivEl) {
    if (! expander_on || ! originalDivEl) { return; }
    
    var originalDivId = originalDivEl.id;
    
    if (!expanded[originalDivId]) { return; }
    if (expanding[originalDivId]) { tracker[originalDivId]=getTime(); return; }

    var shadowDivId = shadow(originalDivEl.id);
    var shadowDivEl = YAHOO.util.Dom.get(shadowDivId);

    var shadowImgEl = (shadowDivEl.getElementsByTagName('img'))[0]; 
    var originalImgEl = (originalDivEl.getElementsByTagName('img'))[0];
 
    var originalDivXY = YAHOO.util.Dom.getXY(originalDivEl);
    var ShadowDivCollapseAttributes = {
        width: {to: originalDivEl.offsetWidth},
        height: {to: originalDivEl.offsetHeight},
        points: { 
            to: [ originalDivXY[0], originalDivXY[1] ]
        },
        fontSize: {from: 11, to: 7, unit: 'px' }
    };

    var cleanupEvent = function() {
        expanded[originalDivId]=0;
        if (!shadowDivEl || !shadowDivEl.parentNode) { return; }
        shadowDivEl.parentNode.removeChild(shadowDivEl);
    };
    if (originalImgEl) {
        var ShadowImgCollapseAttributes = {
            width: {to: originalImgEl.offsetWidth},
            height: {to: originalImgEl.offsetHeight}
        };

        var ShadowImgCollapseAnimation = new YAHOO.util.Motion(shadowImgEl, ShadowImgCollapseAttributes, 0.4, YAHOO.util.Easing.easeOut);
        ShadowImgCollapseAnimation.animate();
    }
    var ShadowDivCollapseAnimation = new YAHOO.util.Motion(shadowDivEl, ShadowDivCollapseAttributes, 0.4, YAHOO.util.Easing.easeOut);
    if (!expanded[originalDivId]) { return; }
    ShadowDivCollapseAnimation.onComplete.subscribe(cleanupEvent); 
    ShadowDivCollapseAnimation.animate();
}

function trackAnim(originalDivEl) {
    if (!originalDivEl) { return; }
    delete tracker[originalDivEl.id];
    return false;
}

function runAnimOut(originalDivEl) {
    if (! expander_on || !originalDivEl)  { return; }
    var originalDivId = originalDivEl.id;
    if (!expanded[originalDivId]) { 
        tracker[originalDivId] = 0;
        return; 
    }
    tracker[originalDivId] = getTime(); 
}

var handleOuts = function(force) {
    if (! expander_on) { return; }
    var now = getTime();
    for(var killer in tracker) {
      if (tracker.hasOwnProperty(killer)) {
        if ( force || ( tracker[killer] > 0 &&  (tracker[killer] + 300) < now)  ) {
            if (expanding[killer]) { 
                tracker[killer] = getTime();
                continue; 
            } 
            delete tracker[killer];
            runAnimOut_single( YAHOO.util.Dom.get(killer) );    
        }
      }
    }
};

function trackAnim_wrapper(e) {
    if (! expander_on) { return; }
    trackAnim(YAHOO.util.Dom.get(unshadow(this.id)));
}

function runAnimOut_wrapper(e) {
    if (! expander_on) { return; }
    runAnimOut(YAHOO.util.Dom.get(unshadow(this.id)));
}

function handleOuts_wrapper() {
    if (! expander_on) { return; }
    handleOuts(1); 
}

function pop_start() {
    if (!expander_on) { return; }
    if (!YAHOO) { return; }

    for (var i = 0; i<expc.length; i++) {
        var expele = YAHOO.util.Dom.get(expc[i]);
        var elelist = expele.getElementsByTagName('td');
        for (var j = 0; j<elelist.length; j++) {
            if (YAHOO.util.Dom.hasClass(elelist[j],'exptextboxpre')) {
                elelist[j].className='exptxtbox';
            } else if (YAHOO.util.Dom.hasClass(elelist[j],'maindisp')) {
                elelist[j].className='mainhide';
            } else if (YAHOO.util.Dom.hasClass(elelist[j],'mainhide')) {
                elelist[j].className='maindisp';
            }        
       }
    } 
    expander_active = 1;
    setInterval(handleOuts, 250);
    YAHOO.util.Event.addListener(document,'mousemove',handleOuts_wrapper);
}

function register_expander_container(objn) {
    expander_on = 1;
    expc.push(objn);
}

function register_expander_obj(objn) {
    expander_on = 1;
}

function runAnimOver_single(originalDivEl,isimg) {
    if (! expander_on || ! originalDivEl) { return; }
    
    var originalDivId = originalDivEl.id;

    if (expanded[originalDivId] || expanding[originalDivId]) { return; }
    expanding[originalDivId] = 1;

    var originalDivXY = YAHOO.util.Dom.getXY(originalDivEl);
    
    var shadowDivEl = document.createElement('div');
    var newid = originalDivEl.id + '_0';
    shadowDivEl.id = newid;
    shadowDivEl.className='expbox';
    shadowDivEl.innerHTML=originalDivEl.innerHTML;
    YAHOO.util.Dom.get('divgen_expand').appendChild(shadowDivEl);  
    YAHOO.util.Event.addListener(shadowDivEl,'mousemove',trackAnim_wrapper,this); 
    YAHOO.util.Event.addListener(shadowDivEl,'mouseout',runAnimOut_wrapper,this); 
    
    //collapse all others
    handleOuts(1);

    shadowDivEl.style.border = 'solid 1px';
    shadowDivEl.style.background = '#fff';
    shadowDivEl.style.position='absolute';
    shadowDivEl.style.zIndex=30;
    shadowDivEl.style.left = originalDivXY[0]+'px';
    shadowDivEl.style.top = originalDivXY[1]+'px';
    
    var newtop = (originalDivXY[1] - originalDivEl.offsetHeight/2);
    var newleft = (originalDivXY[0] - originalDivEl.offsetWidth/2);

    var ShadowDivExpandAttributes = {
        width: {to: (originalDivEl.offsetWidth * 2)},
        height: {to: (originalDivEl.offsetHeight * 2)},
        points: { 
            to: [ newleft, newtop ]
        },
        fontSize: {from: 7, to: 11, unit: 'px' }
    };
    
    var shadowImgEl = (shadowDivEl.getElementsByTagName('img'))[0]; 
    var originalImgEl = (originalDivEl.getElementsByTagName('img'))[0];
 
    var setupEvent = function() {
        if (tracker[originalDivId] === null) { tracker[originalDivId] = 0; }
        expanded[originalDivId] = 1;
        expanding[originalDivId] = 0;
    };

    var ShadowDivExpandAnimation = new YAHOO.util.Motion(shadowDivEl, ShadowDivExpandAttributes, 0.4);
    ShadowDivExpandAnimation.onComplete.subscribe(setupEvent); 
    ShadowDivExpandAnimation.animate();

    if (shadowImgEl && originalImgEl) {
        var ShadowImgExpandAttributes = {
                width: {to: (originalImgEl.offsetWidth*2)},
                height: {to: (originalImgEl.offsetHeight*2)}
        };
        var ShadowImgExpandAnimation = new YAHOO.util.Motion(shadowImgEl, ShadowImgExpandAttributes, 0.4);
        ShadowImgExpandAnimation.animate();
    }
}

function runAnimOver(originalDivEl) {
    if (! expander_on || ! originalDivEl) { return; }
    runAnimOver_single(YAHOO.util.Dom.get(unshadow(originalDivEl.id)));

}

YAHOO.util.Event.onDOMReady(pop_start);
