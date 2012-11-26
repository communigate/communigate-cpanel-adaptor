YAHOO.util.Region.getRegion = function(el,noadjust) {
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

    var p = YAHOO.util.Dom.getXY(el);

    var t = p[1];
    var r = p[0] + el.offsetWidth;
    var b = p[1] + el.offsetHeight;
    var l = p[0];

    if (!noadjust && el.id.indexOf('bdrow') != -1) {
        b -= filewin.scrollTop;
        t -= filewin.scrollTop;
    }

    return new YAHOO.util.Region(t, r, b, l);
};

