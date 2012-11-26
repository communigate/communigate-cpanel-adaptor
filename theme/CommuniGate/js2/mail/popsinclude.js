// validator objects; using more than one because we need specific control over validation pop-up messages
var VAL_EMAIL = new CPANEL.validate.validator(LANG.new_email_input);
var VAL_PASSWORD = new CPANEL.validate.validator(LANG.password_input);
var VAL_PASSWORD2 = new CPANEL.validate.validator(LANG.password_input);
var VAL_QUOTA = new CPANEL.validate.validator(LANG.quota_input);
var PASSWORD_BAR;

// adds validation to the input fields
function add_validation() {
	VAL_EMAIL.add("email_input", "local_part_email", LANG.not_valid_email);
	VAL_EMAIL.add("email_input", "max_length(%input%, 128)", LANG.email_max_128_char);
	VAL_EMAIL.attach();
	
	VAL_PASSWORD.add("password", verify_password_strength, YAHOO.lang.substitute(LANG.password_strength_must_be,{min_passwd_strength: REQUIRED_PASSWORD_STRENGTH}));
	VAL_PASSWORD.add("password", 'no_chars(%input%, " ")', LANG.password_spaces);
	VAL_PASSWORD.attach();
	
	VAL_PASSWORD2.add("password2", "equals('password', 'password2')", LANG.passwords_not_match);
	VAL_PASSWORD2.attach();
	
	VAL_QUOTA.add("quota", quota_over_2gigs, LANG.quota_2gig);
	VAL_QUOTA.add("quota", mailbox_quota, LANG.quota_number_or_unlimited);
	VAL_QUOTA.attach();	
}

// custom validation function for the quota input
var mailbox_quota = function () {
	var quota = DOM.get("quota").value;
	if (quota === "unlimited") return true;
	if (CPANEL.validate.integer(quota) === true) return true;
	return false;
}

// custom validation function for the mailbox quota
// this function is a little weird; basically I needed a way to show the user something if they enter a number over 2 gigs, but
// I didn't want to show them the same error text for the other validator function
var quota_over_2gigs = function() {
	var quota = DOM.get("quota").value;
	if (CPANEL.validate.integer(quota) == true && quota > 2048) {
		return false;
	}
	return true;
};

// custom validation function to verify password strength
var verify_password_strength = function () {
	if (PASSWORD_BAR.current_strength >= REQUIRED_PASSWORD_STRENGTH) return true;
	return false;
}

// event handler for the "create strong password" phrase
var create_strong_password1 = function(e) {
	CPANEL.password.generate_password(use_generated_password);
};

// function that gets called when the user presses the "Use Password" button on the create strong password modal panels
function use_generated_password(password) {
	DOM.get("password").value = password;
	DOM.get("password2").value = password;
	PASSWORD_BAR.check_strength("password", function() { VAL_PASSWORD.verify() });
	VAL_PASSWORD2.verify();
}

var fill_unlimited = function() {
	YAHOO.util.Dom.get("quota").value = 0;
	VAL_QUOTA.verify();
};

var check_quota = function() {
	if (quota_over_2gigs() == false) {
		DOM.get("quota").value = 0;
		VAL_QUOTA.verify();
	}
};

// page initialization function
function init_popsinclude() {
	// add the help panel
	CPANEL.panels.create_help('why_strong_passwords_panel', 'why_strong_passwords');
	
	// add validation to the input fields
	add_validation();
	
	// initialize the password strength bar
	PASSWORD_BAR = new CPANEL.password.strength_bar("password_strength");
	PASSWORD_BAR.attach("password", function() { VAL_PASSWORD.verify(); });
	
	// attach an event handler to the create strong password link
	EVENT.on("create_strong_password", "click", create_strong_password1);
	
	EVENT.on("quota", "blur", check_quota);
	
	// attach the validators to the submit button
	CPANEL.validate.attach_to_form("new_email_submit", [VAL_EMAIL, VAL_PASSWORD, VAL_PASSWORD2, VAL_QUOTA]);
	
	// put the focus on the email field
	DOM.get("email_input").focus();	
}

// initialize the page
EVENT.onDOMReady(init_popsinclude);
