var use_fast_proto=1;function cpanel_api1(){var g=cpanel_api1.arguments;var b=g[0];var a=g[1];var c=g[2];var d=g.length;var j={success:cpanel_api1_parser,argument:b};var h;if(use_fast_proto){h="cpanel_xmlapi_module="+encodeURIComponent(a)+"&cpanel_xmlapi_func="+encodeURIComponent(c)+"&cpanel_xmlapi_apiversion=1";var f=0;for(var e=3;e<d;e++){h+="&arg-"+f+"="+encodeURIComponent(g[e]);f++}}else{h="xmlin=<cpanelaction><apiversion>1</apiversion><module>"+a+"</module><func>"+c+"</func>";for(var e=3;e<d;e++){h+="<args>"+g[e]+"</args>"}h+="</cpanelaction>"}if(h.length<2000){YAHOO.util.Connect.asyncRequest("GET",CPANEL.security_token+"/xml-api/cpanel?"+h,j)}else{YAHOO.util.Connect.asyncRequest("POST",CPANEL.security_token+"/xml-api/cpanel",j,h)}}function cpanel_api1_parser(g){var f=g.argument;var c=g.responseXML;var b=c.getElementsByTagName("cpanelresult")[0];var d=b.getElementsByTagName("data")[0];var a=d.getElementsByTagName("result")[0];var e;if(a.firstChild){e=a.firstChild.nodeValue}if(f){f(e)}}function cpanel_api2(){var a=cpanel_api2.arguments;var f=a[0];var c=a[1];var d=a[2];var g=a.length;var h={success:cpanel_api2_parser,argument:f};var e;if(use_fast_proto){e="cpanel_xmlapi_module="+encodeURIComponent(c)+"&cpanel_xmlapi_func="+encodeURIComponent(d)+"&cpanel_xmlapi_apiversion=2";for(var b=3;b<g;b+=2){e+="&"+encodeURIComponent(a[b])+"="+encodeURIComponent(a[b+1])}}else{e="xmlin=<cpanelaction><apiversion>2</apiversion><module>"+c+"</module><func>"+d+"</func><args>";for(var b=3;b<g;b+=2){e+="<"+a[b]+">"+a[b+1]+"</"+a[b]+">"}e+="</args></cpanelaction>"}if(e.length<2000){YAHOO.util.Connect.asyncRequest("GET",CPANEL.security_token+"/xml-api/cpanel?"+e,h)}else{YAHOO.util.Connect.asyncRequest("POST",CPANEL.security_token+"/xml-api/cpanel",h,e)}}function cpanel_api2_parser(e){var d=e.argument;var b=e.responseXML;var a=b.getElementsByTagName("cpanelresult")[0];var c=a.getElementsByTagName("data");if(d){d(c)}};