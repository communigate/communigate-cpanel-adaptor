package CGPro::Hooks;

use CLI;
use Cpanel::Logger ();
use Cpanel::AdminBin ();
use Cpanel::Api2::Exec ();
use Cpanel::CachedDataStore ();
use Cpanel::Config::LoadUserDomains ();

sub describe {
    my $mail_addpop = {
        'category' => 'Cpanel',
        'event'    => 'Api2::Email::addpop',
        'stage'    => 'post',
        'hook'     => 'CGPro::Hooks::addpop',
        'exectype' => 'module',
    };
    my $mail_delpop = {
        'category' => 'Cpanel',
        'event'    => 'Api2::Email::delpop',
        'stage'    => 'pre',
        'hook'     => 'CGPro::Hooks::delpop',
        'exectype' => 'module',
    };
    my $mail_passwdpop = {
        'category' => 'Cpanel',
        'event'    => 'Api2::Email::passwdpop',
        'stage'    => 'pre',
        'hook'     => 'CGPro::Hooks::passwdpop',
        'exectype' => 'module',
    };
    my $mail_editquota = {
        'category' => 'Cpanel',
        'event'    => 'Api2::Email::editquota',
        'stage'    => 'pre',
        'hook'     => 'CGPro::Hooks::editquota',
        'exectype' => 'module',
    };
    my $mail_deletefilter = {
        'category' => 'Cpanel',
        'event'    => 'Api2::Email::deletefilter',
        'stage'    => 'pre',
        'hook'     => 'CGPro::Hooks::deletefilter',
        'exectype' => 'module',
    };
    my $mail_reorderfilters = {
        'category' => 'Cpanel',
        'event'    => 'Api2::Email::reorderfilters',
        'stage'    => 'pre',
        'hook'     => 'CGPro::Hooks::reorderfilters',
        'exectype' => 'module',
    };
    my $mail_addpop1 = {
        'category' => 'Cpanel',
        'event'    => 'Api1::Email::addpop',
        'stage'    => 'post',
        'hook'     => 'CGPro::Hooks::addpop1',
        'exectype' => 'module',
    };
    my $AccountsCreate = {
        'category' => 'Whostmgr',
        'event'    => 'Accounts::Create',
        'stage'    => 'post',
        'hook'     => 'CGPro::Hooks::AccountsCreate',
        'exectype' => 'module',
    };
    my $AccountsRemove = {
        'category' => 'Whostmgr',
        'event'    => 'Accounts::Remove',
        'stage'    => 'pre',
        'hook'     => 'CGPro::Hooks::AccountsRemove',
        'exectype' => 'module',
    };
    my $dkim_install = {
        'category' => 'Cpanel',
        'event'    => 'Api2::DKIMUI::install',
        'stage'    => 'post',
        'hook'     => 'CGPro::Hooks::dkim_install',
        'exectype' => 'module',
    };
    my $dkim_uninstall = {
        'category' => 'Cpanel',
        'event'    => 'Api2::DKIMUI::uninstall',
        'stage'    => 'post',
        'hook'     => 'CGPro::Hooks::dkim_uninstall',
        'exectype' => 'module',
    };
    return [$mail_addpop,
	    $mail_delpop,
	    $mail_passwdpop,
	    $mail_editquota,
	    $mail_deletefilter,
	    $mail_reorderfilters,
	    $mail_addpop1,
	    $AccountsCreate,
	    $AccountsRemove,
	    $dkim_install,
	    $dkim_uninstall
	];
}

sub getCLI {
   (my $conf) = @_;
    if ($CLI && $CLI->{isConnected}) {
	return $CLI;
    } else {
	my $loginData = $conf;
	$loginData = Cpanel::AdminBin::adminrun('cca', 'GETLOGIN') unless $loginData;
	$loginData =~ s/^\.\n//;
	my @loginData = split "::", $loginData;
 	my $cli = new CGP::CLI( { PeerAddr => $loginData[0],
				  PeerPort => $loginData[1],
				  login => $loginData[2],
				  password => $loginData[3]
				});
	my $logger = Cpanel::Logger->new();
	unless($cli) {
	    $logger->warn("Can't login to CGPro: ".$CGP::ERR_STRING);
	    exit(0);
	}
	$CLI = $cli;
	return $cli;
    }
}
# pass it as a parramether of getCLI() if hooking WHM events
sub getConf {
    my $conf = Cpanel::CachedDataStore::fetch_ref( '/var/cpanel/communigate.yaml' ) || {};
    return $conf->{cgprohost} . "::" . $conf->{cgproport} . "::" . $conf->{cgprouser} . "::" . $conf->{cgpropass};
}
sub addpop {
    my (undef, $params) = @_;
    my $args = $params->{args};
    doaddpop($args->{'email'}, $args->{'password'}, $args->{'quota'}, $args->{'domain'});
}

sub delpop {
    my (undef, $params) = @_;
    my $args = $params->{args};
    my $cli = getCLI();
    my $domain = $args->{'domain'};
    my $user= $args->{'email'};

    $cli->DeleteAccount("$user\@$domain");
    $cli->Logout();
}

sub passwdpop {
    my (undef, $params) = @_;
    my $args = $params->{args};
    my $cli = getCLI();

    my $domain = $args->{'domain'};
    my $user= $args->{'email'};
    my $pass= $args->{'password'};
    $cli->SetAccountPassword("$user\@$domain","$pass",0);
    $cli->Logout();
}

sub editquota {
    my (undef, $params) = @_;
    my $args = $params->{args};
    my $cli = getCLI();

    my $domain = $args->{'domain'};
    my $user= $args->{'email'};
    my $quota = $args->{'quota'};
    if ($quota == 0) {
	$quota="unlimited" ;
    }else{
	$quota .= "M";
    }

    my $data = $cli->GetDomainSettings("$domain");
    if (!$data) {
	$cli->CreateDomain("$domain");
    }
    my $data;
    $data->{'MaxAccountSize'} = $quota;
    if ($args->{'realaname'}) {
	$data->{'RealName'} = $args->{'realaname'};
    } else {
	delete $data->{'RealName'} if $data->{'RealName'};
    }
    if ($args->{'unit'}) {
	$data->{'ou'} = $args->{'unit'};
    } else {
	delete $data->{'ou'} if $data->{'ou'};
    }
    if ($args->{'mobile'}) {
	$data->{'MobilePhone'} = $args->{'mobile'};
    } else {
	delete $data->{'MobilePhone'} if $data->{'MobilePhone'};
    }
    if ($args->{'workphone'}) {
	$data->{'WorkPhone'} = $args->{'workphone'};
    } else {
	delete $data->{'WorkPhone'} if $data->{'WorkPhone'};
    }
    # Update WorkDays
    if ($args->{'WorkDays'}) {
	my $WorkDays = [];
	@$WorkDays = grep(/\w/, ($args->{'WorkDays'}, $args->{'WorkDays-0'}, $args->{'WorkDays-1'}, $args->{'WorkDays-2'}, $args->{'WorkDays-3'}, $args->{'WorkDays-4'}, $args->{'WorkDays-5'})); # remove empty entries
	my $serverDefaults = $cli->GetServerAccountPrefs();
	my $domainDefaults = $cli->GetAccountDefaultPrefs($domain);
	my $defaultWorkDays = $serverDefaults->{WorkDays};
	$defaultWorkDays = $domainDefaults->{WorkDays} if $domainDefaults->{WorkDays};
	my $prefs = {};
	if (join(',',$defaultWorkDays) eq join(',',$WorkDays)) {
	    $prefs->{WorkDays} = 'default';
	} else {
	    $prefs->{WorkDays} = $WorkDays;
	}
	$cli->UpdateAccountPrefs("$user\@$domain", $prefs);
    }
    $cli->SetAccountSettings("$user\@$domain", $data);
    $cli->Logout();
}

sub deletefilter {
    my (undef, $params) = @_;
    my $args = $params->{args};
    my $cli = getCLI();

    my $account = $args->{'account'};
    my $filtername = $args->{'filtername'};

    my $rules = $cli->GetAccountMailRules($account);
    if ($rules) {
	my $newrules = [];
	for my $rule (@$rules) {
	    if ($rule->[1] ne $filtername) {
		push @$newrules, $rule;
	    }
	}
	$cli->SetAccountMailRules($account,$newrules);
    }
    $cli->Logout();
}

sub reorderfilters {
    my (undef, $params) = @_;
    my $args = $params->{args};
    my $cli = getCLI();

    my $account = $args->{'mailbox'};
    my $order = {};
    for my $filter (keys %$args) {
	if ($filter =~ m/^filter(\d+)$/) {
	    $order->{$args->{$filter}} = $1;
	}
    }
    my $rules = $cli->GetAccountMailRules($account);
    if ($rules) {
    	my $newrules = [];
    	for my $rule (@$rules) {
    	    if (defined $order->{$rule->[1]}) {
		$rule->[0] = 9 - $order->{$rule->[1]};
		$rule->[0] = 1 if $rule->[0] < 1;
    	    }
	    push @$newrules, $rule;
    	}
    	$cli->SetAccountMailRules($account,$newrules);
    }
    $cli->Logout();
}

sub addpop1 {
    my (undef, $params) = @_;
    my $args = $params->{args};
    doaddpop($args->[0], $args->[1], $args->[2], $args->[3], $args->[4], $args->[5], [$args->[6],$args->[7],$args->[8],$args->[9],$args->[10],$args->[11],$args->[12]], $args->[13], $args->[14], $args->[15]);
}

sub doaddpop {
    my ($user, $password, $quota, $domain, $realname, $type, $workDays, $unit, $mobilePhone, $workPhone) = @_;
    @$workDays = grep(/\w/, @$workDays); # remove empty entries
    my $cli = getCLI();
    if ($quota == 0) {
        $quota="unlimited" ;
    }else{
        $quota .= "M";
    }
    my $data = $cli->GetDomainSettings("$domain");
    if (!$data) {
    	$cli->CreateDomain("$domain");
    }
    my $UserData;
    @$UserData{'Password'}=$password;
    @$UserData{'MaxAccountSize'}=$quota;
    my $response = $cli->CreateAccount(accountName => "$user\@$domain", settings => $UserData);
    if ($response) {
    	$cli->CreateMailbox("$user\@$domain", "Calendar");
    	$cli->CreateMailbox("$user\@$domain", "Spam");
	my $settings = {};
	$settings->{RealName} = $realname if $realname;
	$settings->{ServiceClass} = $type if $type;
	$settings->{ou} = $unit if $unit;
	$settings->{MobilePhone} = $mobilePhone if $mobilePhone;
	$settings->{WorkPhone} = $workPhone if $workPhone;
	$cli->UpdateAccountSettings("$user\@$domain", $settings);
	my $serverDefaults = $cli->GetServerAccountPrefs();
	my $domainDefaults = $cli->GetAccountDefaultPrefs($domain);
	my $defaultWorkDays = $serverDefaults->{WorkDays};
	$defaultWorkDays = $domainDefaults->{WorkDays} if $domainDefaults->{WorkDays};
	my $prefs = {};
	if (join(',',$defaultWorkDays) eq join(',',$workDays)) {
	    $prefs->{WorkDays} = 'default';
	} else {
	    $prefs->{WorkDays} = $workDays;
	}
	$cli->UpdateAccountPrefs("$user\@$domain", $prefs);
    } else {
    	my $apiref = Cpanel::Api2::Exec::api2_preexec( 'Email', 'delpop' );
    	my ( $data, $status ) = Cpanel::Api2::Exec::api2_exec( 'Email', 'delpop', $apiref, {domain => $domain, email=> $user} );
    }
    $cli->Logout();
}

sub AccountsCreate {
    my (undef, $params) = @_;
    my $domain = $params->{'domain'};
    if ($domain) {
	my $cli = getCLI(getConf());
	$cli->CreateDomain("$domain");
	$cli->Logout();
    }
    return 1;
}

sub AccountsRemove {
    my (undef, $params) = @_;
    my $user = $params->{'user'};
    if ($user) {
	my $cli = getCLI(getConf());
	my $users = Cpanel::Config::LoadUserDomains::loaduserdomains( undef, 0, 1 );
	for my $domain (@{$users->{$user}}) {
	    $cli->DeleteDomain($domain, 1);
	}
	$cli->Logout();
    }
    return 1;
}

sub dkim_install {
    my (undef, $params) = @_;
    my $user = $params->{'user'};
    my $cli = getCLI();
    my @domains = Cpanel::Email::listmaildomains();
    for my $domain (@domains) {
	my $key = Cpanel::AdminBin::adminrun('cca', 'READFILE', "/var/cpanel/domain_keys/private/" . $domain);
	$key =~ s/(\-{5}.*?\-{5}|^\.|\n|\r)//g;
	$cli->UpdateDomainSettings(domain => $domain,settings => {
	    DKIM => {
		Enabled => 'Yes',
		key => $key,
		Selector => "default"
	    }
				   });
    }
    $cli->Logout();
}

sub dkim_uninstall {
    my (undef, $params) = @_;
    my $user = $params->{'user'};
    my $cli = getCLI();
    my @domains = Cpanel::Email::listmaildomains();
    for my $domain (@domains) {
	$cli->UpdateDomainSettings(domain => $domain,settings => {DKIM => {DKIMEnabled => 'No'}});
    }
    $cli->Logout();
}


1;
