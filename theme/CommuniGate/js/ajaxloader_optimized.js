var ajaxloader_on=0;function initAjaxLoader(){if(!ajaxloader_on){return}var f=YAHOO.util.Dom.getElementsByClassName("ajaxlink","a");var e=YAHOO.util.Dom.getElementsByClassName("ajax-mail","a");var h=YAHOO.util.Dom.getElementsByClassName("ajaxfiles","a");var g=YAHOO.util.Dom.getElementsByClassName("noscript","div");for(var d=0;d<g.length;d++){g[d].style.display="none"}for(var d=0;d<h.length;d++){var c=h[d].getAttribute("href");var a=c.split("?");a[0]=a[0].replace(/\/files\//,"/filemanager/");var b=a.join("?");h[d].setAttribute("href",b)}for(var d=0;d<e.length;d++){var c=e[d].getAttribute("href");var a=c.split("?");a[0]=a[0].replace(/\.html$/,"-ajax.html");var b=a.join("?");e[d].setAttribute("href",b)}for(var d=0;d<f.length;d++){var c=f[d].getAttribute("href");var a=c.split("?");a[0]=a[0].replace(/\.html$/,"-ajax.html");var b=a.join("?");f[d].setAttribute("href",b)}}YAHOO.util.Event.onDOMReady(initAjaxLoader);