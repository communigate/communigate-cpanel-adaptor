/* ***** BEGIN LICENSE BLOCK *****

# cpanel12 - interfacereset.js                  Copyright(c) 1997-2008 cPanel, Inc.
#                                                           All Rights Reserved.
# copyright@cpanel.net                                         http://cpanel.net
# This code is subject to the cPanel license. Unauthorized copying is prohibited

 * ***** END LICENSE BLOCK ***** 
  * ***** BEGIN APPLICABLE CODE BLOCK ***** */


var interfaceConfigs = [];
function register_interfacecfg_nvdata(nvname) {
    interfaceConfigs.push(nvname);
}

var reset_all_interface_settings = function() {
    register_interfacecfg_nvdata("x3_litegraphics");
    register_interfacecfg_nvdata("x3_hideicons");
    
    var sFormData = 'names=' + interfaceConfigs.join('|');
    for(var i=0;i<interfaceConfigs.length;i++) {
        sFormData += '&' + interfaceConfigs[i] + '=';
        NVData[interfaceConfigs[i]]='';
    }
    
    // refresh the page once the ajax call completes
    var callback = {
        success : function(o) {
            window.location.reload(true);
        }
    };    
    YAHOO.util.Connect.asyncRequest('POST', 'nvset.xml', callback, sFormData); 
};

register_interfacecfg_nvdata('ignorecharencoding');
