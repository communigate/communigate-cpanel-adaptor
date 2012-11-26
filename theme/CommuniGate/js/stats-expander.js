// build a progress bar for a div, only builds if the element contains elements with classnames "stats_progress_bar_percent" and "stats_progress_bar_text"
var build_progress_bar = function(el) {
	var percent_el = YAHOO.util.Dom.getElementsByClassName("cpanel_widget_progress_bar_percent", "div", el);
    
    for (var i in percent_el) {
        var percent = percent_el[i].innerHTML;
        if (CPANEL.validate.positive_integer(percent)) {
            CPANEL.widgets.progress_bar(el, percent, '', '{"inverse_colors":"true"}');
        }
    }
};

// build the progress bars on the page
var build_progress_bars = function(root_el) {
    // find all the elements with class "stats_progress_bar" in the root_el element and builds their progress bar(s)
	YAHOO.util.Dom.getElementsByClassName("stats_progress_bar", "div", root_el, build_progress_bar);
};

// destroy progress bars (needed for ie animation bug)
var destroy_progress_bars = function(root_el) {
    YAHOO.util.Dom.getElementsByClassName("cpanel_widget_progress_bar", "div", root_el, function(el) {
        YAHOO.util.Dom.get(el).innerHTML = '';
    });
};

// grab the extended stats with an AJAX call
var fetch_extended_stats = function() {
	// show the loading icon
	YAHOO.util.Dom.setStyle("toggle_extended_stats", "display", "none");
	YAHOO.util.Dom.setStyle("extended_stats_loading_icon", "display", "block");
	YAHOO.util.Dom.get("extended_stats_loading_icon").innerHTML = CPANEL.icons.ajax + ' loading...';
	
	// create the callback functions
	var callback = {
		success : function(o) {
			YAHOO.util.Dom.get("extended_stats").innerHTML = o.responseText;
            
            /*
                disabled per case 32783: now done on the backend
                CPANEL.util.zebra(["stats", "extended_stats"], "info-even", "info-odd");
            */
			build_progress_bars("stats_extended");
			expand_extended_stats();
		},

		failure : function(o) {
			YAHOO.util.Dom.get("extended_stats_loading_icon").innerHTML = '';
			YAHOO.util.Dom.setStyle("toggle_extended_stats", "display", "block");
			YAHOO.util.Dom.get("toggle_extended_stats").innerHTML = "AJAX Failure: click to try again";
		},
        
        timeout: 3000
	};
  
	// send the AJAX request
	YAHOO.util.Connect.asyncRequest('GET', "extended_statsbar.html?secpolicy_ui=no&rowcounter=mainstats&rowcountervalue=" + ROWCOUNTER['mainstats'], callback, null);	
};

// function to run after the expand animation has finished
var finish_expand_extended_stats = function() {
    
    // build the progress bars in IE (trailing animation bug)
    if (YAHOO.env.ua.ie > 5 && YAHOO.env.ua.ie < 8) {
        build_progress_bars("stats_extended");
    }
    
    // update the toggle text
	YAHOO.util.Dom.get("toggle_extended_stats").innerHTML = "collapse stats";
	YAHOO.util.Dom.setStyle("toggle_extended_stats", "display", "");
	YAHOO.util.Dom.setStyle("extended_stats_loading_icon", "display", "none");
	
	// swap the up/down arrow
	YAHOO.util.Dom.replaceClass("toggle_extended_stats_img", "box-expand-control", "box-collapse-control");
	
	// set the environment variable
	SetNvData("xstatscollapsed", "expanded");
    
    // set the state to shown
    YAHOO.util.Dom.get("extended_stats_state").innerHTML = "shown";
};

// function that starts the expand animation
var expand_extended_stats = function() {
    // set the state to animating
    YAHOO.util.Dom.get("extended_stats_state").innerHTML = "animating";
    
	// hide the loading icon
	YAHOO.util.Dom.get("toggle_extended_stats").innerHTML = '';
	
    // start the show animation
	var auto_height = CPANEL.animate.getAutoHeight("extended_stats");
	YAHOO.util.Dom.setStyle("extended_stats", "height", "0px");
	YAHOO.util.Dom.setStyle("extended_stats", "display", "block");
	var attributes = {
		height: { to: auto_height, units: "px" }
	};
	var anim = new YAHOO.util.Anim("extended_stats", attributes, "0.5", YAHOO.util.Easing.easeOutStrong);
	anim.onComplete.subscribe(finish_expand_extended_stats);
	anim.animate();
};

// function to run after the hide animation has finished
var finish_hide_extended_stats = function() {
    // update the toggle text
	YAHOO.util.Dom.get("toggle_extended_stats").innerHTML = "expand stats";
	
	// swap the up/down arrow
	YAHOO.util.Dom.replaceClass("toggle_extended_stats_img", "box-collapse-control", "box-expand-control");
	
	// set the environment variable
	SetNvData("xstatscollapsed", 'collapsed');
    
    // set the state to hidden
    YAHOO.util.Dom.get("extended_stats_state").innerHTML = "hidden";
};

// function to start the hide animation
var hide_extended_stats = function() {
    
    // destroy the progress bars in IE (trailing animation bug)
    if (YAHOO.env.ua.ie > 5 && YAHOO.env.ua.ie < 8) {
        destroy_progress_bars("extended_stats");
    }
    
    // set the state to animating
    YAHOO.util.Dom.get("extended_stats_state").innerHTML = "animating";    
    
    // hide toggle text
	YAHOO.util.Dom.get("toggle_extended_stats").innerHTML = "";
    
    // begin the hide animation
	var attributes = {
		height: { to: "0", units: "px" }
	};
	var anim = new YAHOO.util.Anim("extended_stats", attributes, "0.5", YAHOO.util.Easing.easeOutStrong);
	anim.onComplete.subscribe(finish_hide_extended_stats);
	anim.animate();
};

// toggle extended stats expansion/hide
var toggle_extended_stats = function() {
	YAHOO.util.Dom.get("toggle_extended_stats").blur();
    var state = YAHOO.util.Dom.get("extended_stats_state").innerHTML;
	if (state == "hidden") {
		if (YAHOO.util.Dom.get("extended_stats").innerHTML == "") {
			fetch_extended_stats();
		}
		else {
			expand_extended_stats();
		}
	}
	else if (state == "shown") {
		hide_extended_stats();
	}
};

// omDOMReady function
var init_extended_stats = function() {
	// disable the expand/collapse links if JS is enabled
	YAHOO.util.Event.on("toggle_extended_stats", "click", function(e) { YAHOO.util.Event.preventDefault(e); });
	
	// add event handlers to toggle extended stats
    YAHOO.util.Event.on(["toggle_extended_stats","stats-header"], "click", toggle_extended_stats);
	
    // build all progress bars in the main stats
    build_progress_bars("content-stats");
	
	// set the initial state of extended stats
	register_interfacecfg_nvdata("xstatscollapsed");
	if (NVData['xstatscollapsed'] == "expanded" && YAHOO.util.Dom.get("extended_stats").innerHTML == "") {
		fetch_extended_stats();
	}
     
    /*
       disabled per case 32783: now done on the backend
       zebra-stripe the rows
       CPANEL.util.zebra(["stats", "extended_stats"], "info-even", "info-odd");
     */
};
