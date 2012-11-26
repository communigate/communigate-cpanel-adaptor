var DOM=YAHOO.util.Dom;var EVENT=YAHOO.util.Event;var API;var ZONE;var DESTROYING_OLD_TABLE=false;var EDIT_ZONE_LINE_VALID={};var OPEN_MODULE=0;var ADD_ZONE_LINE_VALID={};var typeof_validator=function(a){if(typeof(a.add)!="function"){return false}if(typeof(a.attach)!="function"){return false}if(typeof(a.title)!="string"){return false}return true};var format_dns_name=function(b){b=YAHOO.util.Dom.get(b);var a=b.value;var c=YAHOO.util.Dom.get("domain").value;if(a==""){return}if(CPANEL.validate.end_of_string(a,".")==false){a+="."}if(CPANEL.validate.end_of_string(a,c+".")==false){a+=c+"."}b.value=a};var reset_zone_file=function(){var c={cpanel_jsonapi_version:2,cpanel_jsonapi_module:"ZoneEdit",cpanel_jsonapi_func:"resetzone",domain:YAHOO.util.Dom.get("domain").value};var a=function(){YAHOO.util.Dom.get("reset_zone_file_checkbox").checked=false;YAHOO.util.Dom.get("reset_zone_file").disabled=true;YAHOO.util.Dom.get("reset_zone_status").innerHTML=""};var b={success:function(g){try{var d=YAHOO.lang.JSON.parse(g.responseText)}catch(f){CPANEL.widgets.status_bar("reset_zone_status_bar","error",CPANEL.lang.json_error,CPANEL.lang.json_parse_failed);a();return}if(d.cpanelresult.error){CPANEL.widgets.status_bar("reset_zone_status_bar","error",CPANEL.lang.Error,d.cpanelresult.error)}else{if(d.cpanelresult.data[0].result.status=="1"){CPANEL.widgets.status_bar("reset_zone_status_bar","success",LANG.zone_file_reset);update_dns_zone()}else{if(d.cpanelresult.data[0].result.status=="0"){CPANEL.widgets.status_bar("reset_zone_status_bar","error",CPANEL.lang.Error,d.cpanelresult.data[0].result.statusmsg)}}}a()},failure:function(d){CPANEL.widgets.status_bar("reset_zone_status_bar","error",CPANEL.lang.ajax_error,CPANEL.lang.ajax_try_again);a()}};YAHOO.util.Connect.asyncRequest("GET",CPANEL.urls.json_api(c),b,"");YAHOO.util.Dom.get("reset_zone_file").disabled=true;YAHOO.util.Dom.get("reset_zone_status").innerHTML=CPANEL.icons.ajax+" "+LANG.restoring_defaults};var reset_add_zone_line_form=function(){YAHOO.util.Dom.setStyle("add_new_zone_line_submit","display","block");YAHOO.util.Dom.get("add_new_zone_line_status").innerHTML="";YAHOO.util.Dom.get("name").value="";YAHOO.util.Dom.get("ttl").value="";YAHOO.util.Dom.get("type").value="A";YAHOO.util.Dom.get("address").value="";YAHOO.util.Dom.get("cname").value="";YAHOO.util.Dom.get("txtdata").value="";for(var a in ADD_ZONE_LINE_VALID){if(typeof_validator(ADD_ZONE_LINE_VALID[a])===true){ADD_ZONE_LINE_VALID[a].clear_messages()}}toggle_type_inputs()};var toggle_type_inputs=function(){ADD_ZONE_LINE_VALID.address.clear_messages();ADD_ZONE_LINE_VALID.cname.clear_messages();ADD_ZONE_LINE_VALID.txtdata.clear_messages();var a=YAHOO.util.Dom.get("type").value;if(a=="A"){YAHOO.util.Dom.setStyle("type_A","display","")}else{YAHOO.util.Dom.setStyle("type_A","display","none")}if(a=="CNAME"){YAHOO.util.Dom.setStyle("type_CNAME","display","")}else{YAHOO.util.Dom.setStyle("type_CNAME","display","none")}if(a=="TXT"){YAHOO.util.Dom.setStyle("type_TXT","display","")}else{YAHOO.util.Dom.setStyle("type_TXT","display","none")}};var validate_address=function(c,a){var b=YAHOO.util.Dom.get(c).value;if(b=="A"){return CPANEL.validate.ip(YAHOO.util.Dom.get(a).value)}else{return true}};var validate_address_no_local_ips=function(c,a){var b=YAHOO.util.Dom.get(c).value;if(b=="A"){return CPANEL.validate.no_local_ips(YAHOO.util.Dom.get(a).value)}else{return true}};var validate_cname=function(c,a){var b=YAHOO.util.Dom.get(c).value;if(b=="CNAME"){return((CPANEL.validate.zone_name(YAHOO.util.Dom.get(a).value))&&!(/\.$/.test(YAHOO.util.Dom.get(a).value)))}else{return true}};var validate_txtdata=function(d,b){var c=YAHOO.util.Dom.get(d).value;if(c=="TXT"){var a=YAHOO.util.Dom.get(b).value;return(a.length<=255&&a.length>0)}else{return true}};var validate_unique_cname=function(d,a){var b=YAHOO.util.Dom.get(d).value;for(var c=0;c<ZONE.length;c++){if(ZONE[c].type.toLowerCase()!="cname"){continue}if((ZONE[c].name.toLowerCase()==b.toLowerCase())&&(c!=a)){return false}}return true};var init_select_box=function(){YAHOO.util.Event.on("type","change",toggle_type_inputs);YAHOO.util.Event.on("name","blur",function(){format_dns_name(this);setTimeout("ADD_ZONE_LINE_VALID.name.verify()",25)});ADD_ZONE_LINE_VALID.name=new CPANEL.validate.validator(LANG.Name);ADD_ZONE_LINE_VALID.name.add("name","zone_name",LANG.not_valid_zone_name);ADD_ZONE_LINE_VALID.name.add("name",function(){return validate_unique_cname("name")},LANG.cname_must_be_unique+"<br />"+LANG.cname_must_be_unique2);ADD_ZONE_LINE_VALID.name.attach();ADD_ZONE_LINE_VALID.ttl=new CPANEL.validate.validator("TTL");ADD_ZONE_LINE_VALID.ttl.add("ttl","positive_integer",LANG.ttl_positive_integer);ADD_ZONE_LINE_VALID.ttl.attach();ADD_ZONE_LINE_VALID.address=new CPANEL.validate.validator(LANG.Address);ADD_ZONE_LINE_VALID.address.add("address",function(){return validate_address("type","address")},LANG.address_valid_ip);ADD_ZONE_LINE_VALID.address.add("address",function(){return validate_address_no_local_ips("type","address")},LANG.address_not_local_ip);ADD_ZONE_LINE_VALID.address.attach();ADD_ZONE_LINE_VALID.cname=new CPANEL.validate.validator("CNAME");ADD_ZONE_LINE_VALID.cname.add("cname",function(){return validate_cname("type","cname")},LANG.cname_valid_name);ADD_ZONE_LINE_VALID.cname.attach();ADD_ZONE_LINE_VALID.txtdata=new CPANEL.validate.validator("TXT Data");ADD_ZONE_LINE_VALID.txtdata.add("txtdata",function(){return validate_txtdata("type","txtdata")},LANG.txtdata_valid);ADD_ZONE_LINE_VALID.txtdata.attach();CPANEL.validate.attach_to_form("submit",ADD_ZONE_LINE_VALID,add_new_zone_line)};YAHOO.util.Event.onDOMReady(init_select_box);var update_dns_zone=function(){var e=function(j){if(DESTROYING_OLD_TABLE==true){setTimeout(function(){e(j)},10);return}try{var h=YAHOO.lang.JSON.parse(j.responseText)}catch(i){CPANEL.widgets.status_bar("zone_table_status_bar","error",CPANEL.lang.json_error,CPANEL.lang.json_parse_failed);show_no_zone_entries();return}if(h.cpanelresult&&h.cpanelresult.data&&h.cpanelresult.data[0].status==1){ZONE=h.cpanelresult.data[0].record;API.serialnum=h.cpanelresult.data[0].serialnum;build_dnszone_table()}else{var g=LANG.unknown_error;if(h.cpanelresult&&h.cpanelresult.data&&h.cpanelresult.data[0].statusmsg){g=h.cpanelresult.data[0].statusmsg}CPANEL.widgets.status_bar("zone_table_status_bar","error",CPANEL.lang.Error,g);show_no_zone_entries()}};var c=function(h){if(DESTROYING_OLD_TABLE==true){setTimeout(function(){c(h)},10)}else{var g='<div style="padding: 20px 60px; height: 460px">';g+=CPANEL.lang.ajax_try_again;g+="</div>";YAHOO.util.Dom.get("dns_zone_table").innerHTML=g}};var f={success:function(g){e(g)},failure:function(g){c(g)},timeout:8000};DESTROYING_OLD_TABLE=true;YAHOO.util.Connect.asyncRequest("GET",CPANEL.urls.json_api(API),f,"");var b=DOM.get("dns_zone_table").innerHTML;var d="";if(b==""){d+='<div id="loading_div" style="height: 100px">&nbsp;';d+='<div style="padding: 20px">';d+=CPANEL.icons.ajax+" "+CPANEL.lang.ajax_loading;d+="</div>";d+="</div>"}else{var a=YAHOO.util.Region.getRegion(YAHOO.util.Dom.get("dns_zone_table"));d='<div id="loading_div" style="height: '+a.height+'px">';d+='<div style="padding: 20px">';d+=CPANEL.icons.ajax+" "+CPANEL.lang.ajax_loading;d+="</div>";d+='<div id="old_dns_zone_table" style="display:none">';d+=b;d+="</div></div>"}YAHOO.util.Dom.get("dns_zone_table").innerHTML=d;YAHOO.util.Event.purgeElement("old_dns_zone_table",true);if(YAHOO.util.Dom.inDocument(OPEN_MODULE.id)==true){if(YAHOO.util.Dom.getStyle(OPEN_MODULE.id,"display")!="none"){before_hide_module(OPEN_MODULE)}}DESTROYING_OLD_TABLE=false};var show_no_zone_entries=function(){var a="";a+='<div id="loading_div" style="height: 75px; padding-top: 20px; text-align: center">';a+=LANG.no_zone_records_found+"<br /><br />";a+="</div>";YAHOO.util.Dom.get("dns_zone_table").innerHTML=a};var build_dnszone_table=function(){YAHOO.util.Dom.get("dns_zone_table").innerHTML=build_dnszone_table_markup();activate_dnszone_table();OPEN_MODULE=0};var build_dnszone_table_markup=function(){var c="rowA";var b='<table id="table_dns_zone" class="dynamic_table" border="0" cellspacing="0" cellpadding="0">';b+='<tr class="dt_header_row">';b+="<th>"+LANG.Name+"</th>";b+="<th>TTL</th>";b+="<th>Class</th>";b+="<th>"+LANG.Type+"</th>";b+='<th colspan="2">'+LANG.Record+"</th>";b+="<th>"+LANG.Action+"</th>";b+="</tr>";for(var a=0;a<ZONE.length;a++){if(!ZONE[a]["type"].match(/^(A|CNAME|TXT)$/)){continue}if(ZONE[a]["name"].match(/^default\._domainkey\./)){continue}b+='<tr id="info_row_'+a+'" class="dt_info_row '+c+'">';if(ZONE[a]["type"].match(/^(A|CNAME|TXT)$/)){b+='<td id="name_value_'+a+'">'+ZONE[a]["name"]+"</td>";b+='<td id="ttl_value_'+a+'">'+ZONE[a]["ttl"]+"</td>";b+="<td>"+ZONE[a]["class"]+"</td>";b+='<td id="type_value_'+a+'">'+ZONE[a]["type"]+"</td>";if(ZONE[a]["type"]=="A"){b+='<td colspan="2" id="value_value_hehe_'+a+'">'+ZONE[a]["address"]+"</td>"}else{if(ZONE[a]["type"]=="CNAME"){b+='<td colspan="2" id="value_value_hehe_'+a+'">'+ZONE[a]["cname"]+"</td>"}else{if(ZONE[a]["type"]=="TXT"){b+='<td colspan="2" id="value_value_hehe_'+a+'">'+ZONE[a]["txtdata"].html_encode()+"</td>"}}}}b+="<td>";b+='<span class="action_link" id="dnszone_table_edit_'+a+'">'+LANG.Edit+"</span>&nbsp;&nbsp;&nbsp;";b+='<span class="action_link" id="dnszone_table_delete_'+a+'">'+LANG.Delete+"</span>";b+="</td>";b+="</tr>";b+='<tr id="module_row_'+a+'" class="dt_module_row '+c+'"><td colspan="7">';b+='<div id="dnszone_table_edit_div_'+a+'" class="dt_module"></div>';b+='<div id="dnszone_table_delete_div_'+a+'" class="dt_module"></div>';b+='<div id="status_bar_'+a+'" class="cjt_status_bar"></div>';b+="</td></tr>";c=(c=="rowA")?c="rowB":"rowA"}b+="</table>";return b};var activate_dnszone_table=function(){for(var a in ZONE){if(ZONE.hasOwnProperty(a)){if(!ZONE[a]["type"].match(/^(A|CNAME|TXT)$/)){continue}if(ZONE[a]["name"].match(/^default\._domainkey\./)){continue}YAHOO.util.Event.on("dnszone_table_edit_"+a,"click",toggle_module,{id:"dnszone_table_edit_div_"+a,index:a,action:"edit"});YAHOO.util.Event.on("dnszone_table_delete_"+a,"click",toggle_module,{id:"dnszone_table_delete_div_"+a,index:a,action:"delete"})}}};var toggle_module=function(b,c){if(OPEN_MODULE&&OPEN_MODULE.id!==c.id&&YAHOO.util.Dom.getStyle(OPEN_MODULE.id,"display")!="none"){var a=OPEN_MODULE;before_hide_module(a);CPANEL.animate.slide_up(a.id,function(){after_hide_module(a)})}if(YAHOO.util.Dom.getStyle(c.id,"display")!="none"){before_hide_module(c);CPANEL.animate.slide_up(c.id,function(){after_hide_module(c)})}else{before_show_module(c);CPANEL.animate.slide_down(c.id,function(){after_show_module(c)});OPEN_MODULE=c}};var before_show_module=function(e){var d=YAHOO.util.Dom.get(e.id);if(d.innerHTML==""){var b="";if(e.action==="edit"){var a=ZONE[e.index]["name"]+ZONE[e.index]["ttl"]+ZONE[e.index]["type"];if(ZONE[e.index]["address"]){a+=ZONE[e.index]["address"]}if(ZONE[e.index]["cname"]){a+=ZONE[e.index]["cname"]}if(ZONE[e.index]["txtdata"]){a+=ZONE[e.index]["txtdata"]}b+='<div style="display: none" id="edit_zone_line_current_values_'+e.index+'">'+escape(a)+"</div>";b+='<div style="display: none" id="edit_zone_line_current_values_'+e.index+'_error"></div>';b+='<table cellpadding="3" cellspacing="0" style="width: 350px; margin: 0px auto" class="dt_module_table">';b+="<tr>";b+='<td class="align_right" style="width: 120px">'+LANG.Name+":</td>";b+='<td style="width: 150px"><input type="text" id="name_'+e.index+'" /></td>';b+='<td><div id="name_'+e.index+'_error"></div></td>';b+="</tr>";b+="<tr>";b+='<td class="align_right">TTL:</td>';b+='<td><input type="text" id="ttl_'+e.index+'" /></td>';b+='<td><div id="ttl_'+e.index+'_error"></div></td>';b+="</tr>";b+="<tr>";b+='<td class="align_right">Type:</td>';b+="<td>";b+='<select id="edit_zone_line_type_'+e.index+'">';b+='<option selected="selected" value="A">A</option>';b+='<option value="CNAME">CNAME</option>';b+='<option value="TXT">TXT</option>';b+="</select>";b+="</td>";b+="<td>&nbsp;</td>";b+="</tr>";b+='<tr id="type_A_'+e.index+'">';b+='<td class="align_right">'+LANG.Address+":</td>";b+='<td><input type="text" id="edit_zone_line_address_'+e.index+'" /></td>';b+='<td><div id="edit_zone_line_address_'+e.index+'_error"></div></td>';b+="</tr>";b+='<tr id="type_CNAME_'+e.index+'" style="display: none">';b+='<td class="align_right">CNAME:</td>';b+='<td><input type="text" id="cname_'+e.index+'" /></td>';b+='<td><div id="cname_'+e.index+'_error"></div></td>';b+="</tr>";b+='<tr id="type_TXT_'+e.index+'" style="display: none">';b+='<td class="align_right">TXT Data:</td>';b+='<td><input type="text" id="txtdata_'+e.index+'" /></td>';b+='<td><div id="txtdata_'+e.index+'_error"></div></td>';b+="</tr>";b+='<tr><td colspan="3" style="text-align: center; padding-top: 12px;">';b+='<div id="edit_input_'+e.index+'">';b+='<span class="action_link" id="edit_zone_line_cancel_'+e.index+'">cancel</span> or ';b+='<input type="button" class="input-button" value="'+LANG.edit_record+'" id="edit_zone_line_confirm_'+e.index+'" /></div>';b+='<div id="edit_status_'+e.index+'"></div>';b+="</td></tr>";b+="</table>"}if(e.action==="delete"){b+="<center>";b+=LANG.delete_this_record+"<br /><br />";b+='<div id="delete_input_'+e.index+'">';b+='<span class="action_link" id="delete_zone_line_cancel_'+e.index+'">'+CPANEL.lang.cancel+"</span> "+CPANEL.lang.or+" ";b+='<input type="button" class="input-button" id="delete_zone_line_confirm_'+e.index+'" value="'+LANG.Delete+'" />';b+="</div>";b+='<div id="delete_status_'+e.index+'"></div>';b+="</center>"}d.innerHTML=b}if(e.action=="edit"){YAHOO.util.Event.on("edit_zone_line_cancel_"+e.index,"click",toggle_module,e);YAHOO.util.Event.on("edit_zone_line_type_"+e.index,"change",toggle_types,e);YAHOO.util.Event.on("name_"+e.index,"blur",function(){format_dns_name(this);EDIT_ZONE_LINE_VALID.name.verify()});EDIT_ZONE_LINE_VALID={};EDIT_ZONE_LINE_VALID.name=new CPANEL.validate.validator("Name");EDIT_ZONE_LINE_VALID.name.add("name_"+e.index,"zone_name",LANG.not_valid_zone_name);EDIT_ZONE_LINE_VALID.name.add("name_"+e.index,function(){return validate_unique_cname("name_"+e.index,e.index)},LANG.cname_must_be_unique+"<br />"+LANG.cname_must_be_unique2);EDIT_ZONE_LINE_VALID.name.attach();EDIT_ZONE_LINE_VALID.ttl=new CPANEL.validate.validator("TTL");EDIT_ZONE_LINE_VALID.ttl.add("ttl_"+e.index,"positive_integer",LANG.ttl_positive_integer);EDIT_ZONE_LINE_VALID.ttl.attach();EDIT_ZONE_LINE_VALID.address=new CPANEL.validate.validator("Address");EDIT_ZONE_LINE_VALID.address.add("edit_zone_line_address_"+e.index,function(){return validate_address("edit_zone_line_type_"+e.index,"edit_zone_line_address_"+e.index)},LANG.address_valid_ip);EDIT_ZONE_LINE_VALID.address.add("edit_zone_line_address_"+e.index,function(){return validate_address_no_local_ips("edit_zone_line_type_"+e.index,"edit_zone_line_address_"+e.index)},LANG.address_not_local_ip);EDIT_ZONE_LINE_VALID.address.attach();EDIT_ZONE_LINE_VALID.cname=new CPANEL.validate.validator("CNAME");EDIT_ZONE_LINE_VALID.cname.add("cname_"+e.index,function(){return validate_cname("edit_zone_line_type_"+e.index,"cname_"+e.index)},LANG.cname_valid_name);EDIT_ZONE_LINE_VALID.cname.attach();EDIT_ZONE_LINE_VALID.txtdata=new CPANEL.validate.validator("TXT Data");EDIT_ZONE_LINE_VALID.txtdata.add("txtdata_"+e.index,function(){return validate_txtdata("edit_zone_line_type_"+e.index,"txtdata_"+e.index)},LANG.txtdata_valid);EDIT_ZONE_LINE_VALID.txtdata.attach();EDIT_ZONE_LINE_VALID.content_changed=new CPANEL.validate.validator(LANG.content_changed);EDIT_ZONE_LINE_VALID.content_changed.add("edit_zone_line_current_values_"+e.index,function(){return content_changed(e.index)},LANG.must_change_something);EDIT_ZONE_LINE_VALID.content_changed.attach();CPANEL.validate.attach_to_form("edit_zone_line_confirm_"+e.index,EDIT_ZONE_LINE_VALID,function(){edit_zone_line(null,e)});CPANEL.util.catch_enter(["name_"+e.index,"ttl_"+e.index,"edit_zone_line_address_"+e.index,"cname_"+e.index,"txtdata_"+e.index],"edit_zone_line_confirm_"+e.index);YAHOO.util.Dom.get("name_"+e.index).value=YAHOO.util.Dom.get("name_value_"+e.index).innerHTML;YAHOO.util.Dom.get("ttl_"+e.index).value=YAHOO.util.Dom.get("ttl_value_"+e.index).innerHTML;var c=YAHOO.util.Dom.get("type_value_"+e.index).innerHTML;YAHOO.util.Dom.get("edit_zone_line_type_"+e.index).value=c;if(c=="A"){YAHOO.util.Dom.get("edit_zone_line_address_"+e.index).value=YAHOO.util.Dom.get("value_value_hehe_"+e.index).innerHTML}if(c=="CNAME"){YAHOO.util.Dom.get("cname_"+e.index).value=YAHOO.util.Dom.get("value_value_hehe_"+e.index).innerHTML}if(c=="TXT"){YAHOO.util.Dom.get("txtdata_"+e.index).value=YAHOO.util.Dom.get("value_value_hehe_"+e.index).innerHTML}toggle_types(null,e)}};var after_show_module=function(a){if(a.action==="edit"){}if(a.action==="delete"){YAHOO.util.Event.on("delete_zone_line_cancel_"+a.index,"click",toggle_module,a);YAHOO.util.Event.on("delete_zone_line_confirm_"+a.index,"click",delete_zone_line,a)}};var before_hide_module=function(b){if(b.action==="edit"){for(var a in EDIT_ZONE_LINE_VALID){if(typeof_validator(EDIT_ZONE_LINE_VALID[a])===true){EDIT_ZONE_LINE_VALID[a].clear_messages()}}}};var after_hide_module=function(a){OPEN_MODULE=0;if(a.action==="edit"){YAHOO.util.Event.purgeElement(a.id,true);YAHOO.util.Dom.get("name_"+a.index).value="";YAHOO.util.Dom.get("ttl_"+a.index).value="";YAHOO.util.Dom.get("edit_zone_line_address_"+a.index).value="";YAHOO.util.Dom.get("cname_"+a.index).value="";YAHOO.util.Dom.get("txtdata_"+a.index).value=""}};var toggle_types=function(b,c){EDIT_ZONE_LINE_VALID.address.clear_messages();EDIT_ZONE_LINE_VALID.cname.clear_messages();EDIT_ZONE_LINE_VALID.txtdata.clear_messages();var a=YAHOO.util.Dom.get("edit_zone_line_type_"+c.index).value;if(a=="A"){YAHOO.util.Dom.setStyle("type_A_"+c.index,"display","")}else{YAHOO.util.Dom.setStyle("type_A_"+c.index,"display","none")}if(a=="CNAME"){YAHOO.util.Dom.setStyle("type_CNAME_"+c.index,"display","")}else{YAHOO.util.Dom.setStyle("type_CNAME_"+c.index,"display","none")}if(a=="TXT"){YAHOO.util.Dom.setStyle("type_TXT_"+c.index,"display","")}else{YAHOO.util.Dom.setStyle("type_TXT_"+c.index,"display","none")}};var content_changed=function(b,a){var c=YAHOO.util.Dom.get("edit_zone_line_current_values_"+b).innerHTML;var d=YAHOO.util.Dom.get("name_"+b).value;d+=YAHOO.util.Dom.get("ttl_"+b).value;d+=YAHOO.util.Dom.get("edit_zone_line_type_"+b).value;d+=YAHOO.util.Dom.get("edit_zone_line_address_"+b).value;d+=YAHOO.util.Dom.get("cname_"+b).value;d+=YAHOO.util.Dom.get("txtdata_"+b).value;d=escape(d);if(a){YAHOO.util.Dom.get("edit_zone_line_current_values_"+b).innerHTML=d}return(c!=d)};var delete_zone_line=function(c,d){var b=d.index;var g={cpanel_jsonapi_version:2,cpanel_jsonapi_module:"ZoneEdit",cpanel_jsonapi_func:"remove_zone_record",domain:API.domain,line:ZONE[d.index]["Line"]};var a=function(){YAHOO.util.Dom.setStyle("delete_input_"+d.index,"display","block");YAHOO.util.Dom.get("delete_status_"+d.index).innerHTML="";toggle_module(null,{id:"dnszone_table_delete_div_"+b,index:b,action:"delete"})};var f={success:function(j){try{var h=YAHOO.lang.JSON.parse(j.responseText);if(h.cpanelresult.error){a();CPANEL.widgets.status_bar("status_bar_"+b,"error",CPANEL.lang.Error,h.cpanelresult.error)}else{if(h.cpanelresult.data[0].result.status=="1"){API.serialnum=h.cpanelresult.data[0].result.newserial;CPANEL.animate.fade_out("info_row_"+b);CPANEL.animate.fade_out("module_row_"+b)}else{if(h.cpanelresult.data[0].result.status=="0"){a();CPANEL.widgets.status_bar("status_bar_"+b,"error",CPANEL.lang.Error,h.cpanelresult.data[0].result.statusmsg)}}}}catch(i){a();CPANEL.widgets.status_bar("status_bar_"+b,"error",CPANEL.lang.json_error,CPANEL.lang.json_parse_failed);return}if(h.cpanelresult.error){a();CPANEL.widgets.status_bar("status_bar_"+b,"error",CPANEL.lang.Error,h.cpanelresult.error)}else{if(h.cpanelresult.data[0].result.status=="1"){API.serialnum=h.cpanelresult.data[0].result.newserial;$("#info_row_"+b+",#module_row_"+b).fadeOut();update_dns_zone()}else{if(h.cpanelresult.data[0].result.status=="0"){a();CPANEL.widgets.status_bar("status_bar_"+b,"error",CPANEL.lang.Error,h.cpanelresult.data[0].result.statusmsg)}}}},failure:function(e){a();CPANEL.widgets.status_bar("status_bar_"+b,"error",CPANEL.lang.ajax_error,CPANEL.lang.ajax_try_again)}};YAHOO.util.Connect.asyncRequest("GET",CPANEL.urls.json_api(g),f,"");YAHOO.util.Dom.setStyle("delete_input_"+d.index,"display","none");YAHOO.util.Dom.get("delete_status_"+d.index).innerHTML=CPANEL.icons.ajax+" "+LANG.deleting};var edit_zone_line=function(g,b){var f=b.index;content_changed(b.index,true);var a=YAHOO.util.Dom.get("name_"+b.index).value;var c=YAHOO.util.Dom.get("ttl_"+b.index).value;var h=YAHOO.util.Dom.get("edit_zone_line_type_"+b.index).value;var i={cpanel_jsonapi_version:2,cpanel_jsonapi_module:"ZoneEdit",cpanel_jsonapi_func:"edit_zone_record",domain:API.domain,line:ZONE[b.index]["Line"],"class":"IN",type:h,name:a,ttl:c,serialnum:API.serialnum};var j=null;if(h=="A"){i.address=YAHOO.util.Dom.get("edit_zone_line_address_"+b.index).value;j=i.address}if(h=="CNAME"){i.cname=YAHOO.util.Dom.get("cname_"+b.index).value;j=i.cname}if(h=="TXT"){i.txtdata=YAHOO.util.Dom.get("txtdata_"+b.index).value;j=i.txtdata}var d=function(){toggle_module(null,{id:"dnszone_table_edit_div_"+f,index:f,action:"edit"});YAHOO.util.Dom.setStyle("edit_input_"+f,"display","block");YAHOO.util.Dom.get("edit_status_"+f).innerHTML=""};var k={success:function(n){try{var l=YAHOO.lang.JSON.parse(n.responseText)}catch(m){CPANEL.widgets.status_bar("status_bar_"+f,"error",CPANEL.lang.json_error,CPANEL.lang.json_parse_failed);d();return}if(l.cpanelresult.error){CPANEL.widgets.status_bar("status_bar_"+f,"error",CPANEL.lang.Error,l.cpanelresult.error);d()}else{if(l.cpanelresult.data[0].result.status=="1"){CPANEL.widgets.status_bar("status_bar_"+f,"success",LANG.updated_record);API.serialnum=l.cpanelresult.data[0].result.newserial;YAHOO.util.Dom.get("name_value_"+f).innerHTML=a;YAHOO.util.Dom.get("ttl_value_"+f).innerHTML=c;YAHOO.util.Dom.get("type_value_"+f).innerHTML=h;YAHOO.util.Dom.get("value_value_hehe_"+f).innerHTML=j;d()}else{if(l.cpanelresult.data[0].result.status=="0"){CPANEL.widgets.status_bar("status_bar_"+f,"error",CPANEL.lang.Error,l.cpanelresult.data[0].result.statusmsg);d()}}}},failure:function(e){CPANEL.widgets.status_bar("status_bar_"+f,"error",CPANEL.lang.ajax_error,CPANEL.lang.ajax_try_again);d()}};YAHOO.util.Connect.asyncRequest("GET",CPANEL.urls.json_api(i),k,"");YAHOO.util.Dom.setStyle("edit_input_"+f,"display","none");YAHOO.util.Dom.get("edit_status_"+f).innerHTML=CPANEL.icons.ajax+" "+LANG.editing_record};var switch_domain=function(){var a=YAHOO.util.Dom.get("domain").value;if(a=="_select_"){CPANEL.animate.slide_up("add_record_and_zone_table")}else{CPANEL.animate.slide_down("add_record_and_zone_table");API.domain=a;update_dns_zone()}reset_add_zone_line_form()};var add_new_zone_line=function(){var b=YAHOO.util.Dom.get("name").value;var a=YAHOO.util.Dom.get("ttl").value;var c=YAHOO.util.Dom.get("type").value;var e={cpanel_jsonapi_version:2,cpanel_jsonapi_module:"ZoneEdit",cpanel_jsonapi_func:"add_zone_record",domain:API.domain,"class":"IN",type:c,name:b,ttl:a};if(c=="A"){e.address=YAHOO.util.Dom.get("address").value}if(c=="CNAME"){e.cname=YAHOO.util.Dom.get("cname").value}if(c=="TXT"){e.txtdata=YAHOO.util.Dom.get("txtdata").value}var d={success:function(h){try{var f=YAHOO.lang.JSON.parse(h.responseText)}catch(g){CPANEL.widgets.status_bar("add_record_status_bar","error",CPANEL.lang.json_error,CPANEL.lang.json_parse_failed);update_dns_zone();reset_add_zone_line_form();return}if(f.cpanelresult.error){CPANEL.widgets.status_bar("add_record_status_bar","error",CPANEL.lang.Error,f.cpanelresult.error)}else{if(f.cpanelresult.data[0].result.status=="1"){CPANEL.widgets.status_bar("add_record_status_bar","success",LANG.added_record);update_dns_zone()}else{if(f.cpanelresult.data[0].result.status=="0"){CPANEL.widgets.status_bar("add_record_status_bar","error",CPANEL.lang.Error,f.cpanelresult.data[0].result.statusmsg)}else{CPANEL.widgets.status_bar("add_record_status_bar","error",CPANEL.lang.Error,LANG.unknown_error)}}}reset_add_zone_line_form()},failure:function(f){CPANEL.widgets.status_bar("add_record_status_bar","error",CPANEL.lang.ajax_error,CPANEL.lang.ajax_try_again);update_dns_zone();reset_add_zone_line_form()}};YAHOO.util.Connect.asyncRequest("GET",CPANEL.urls.json_api(e),d,"");YAHOO.util.Dom.setStyle("add_new_zone_line_submit","display","none");YAHOO.util.Dom.get("add_new_zone_line_status").innerHTML=CPANEL.icons.ajax+" "+LANG.adding_record};var init_dns_zone=function(){API={cpanel_jsonapi_version:2,cpanel_jsonapi_module:"ZoneEdit",cpanel_jsonapi_func:"fetchzone",domain:YAHOO.util.Dom.get("domain").value};CPANEL.util.catch_enter(["name","ttl","address","cname","txtdata"],"submit");if(YAHOO.util.Dom.inDocument("domain_select_exists")==true){YAHOO.util.Event.on("domain","change",switch_domain)}else{update_dns_zone()}};YAHOO.util.Event.onDOMReady(init_dns_zone);(function(){var a=[["div.dt_module","display:none"]];var b;var c=document.styleSheets[0];if("insertRule" in c){a.forEach(function(d){c.insertRule(d[0]+" {"+d[1]+"}",0)})}else{a.forEach(function(d){c.addRule(d[0],d[1],0)})}})();