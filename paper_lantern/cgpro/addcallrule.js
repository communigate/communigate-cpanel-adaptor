// Page initialization script
var init = function() {
    var validation = new CPANEL.validate.validator(LOCALE.maketext("Rule Name"));
    validation.add("rulename", "min_length(%input%, 1)", LOCALE.maketext("The rule name cannot be empty."));
    validation.add("RequestURI", "min_length(%input%, 1)", LOCALE.maketext("You must select an account."));
    validation.add("action", "min_length(%input%, 1)", LOCALE.maketext("You must select an action."));
    validation.attach();
    // validation.verify();
    CPANEL.validate.attach_to_form("activate-button", validation);
};

EVENT.onDOMReady(init);
