package CGPro::Hooks;

use CLI;
use Cpanel::AdminBin ();
use Cpanel::Api2::Exec ();

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
    return [$mail_addpop, $mail_delpop, $mail_passwdpop, $mail_editquota, $mail_deletefilter, $mail_reorderfilters, $mail_addpop1];
}

sub getCLI {
    if ($CLI && $CLI->{isConnected}) {
	return $CLI;
    } else {
	my $loginData = Cpanel::AdminBin::adminrun('cca', 'GETLOGIN');
	$loginData =~ s/^\.\n//;
	my @loginData = split "::", $loginData;
 	my $cli = new CGP::CLI( { PeerAddr => $loginData[0],
				  PeerPort => $loginData[1],
				  login => $loginData[2],
				  password => $loginData[3]
				});
	unless($cli) {
	    $logger->warn("Can't login to CGPro: ".$CGP::ERR_STRING);
	    exit(0);
	}
	$CLI = $cli;
	return $cli;
    }
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

    my $data=$cli->GetDomainSettings("$domain");
    if (!$data) {
	$cli->CreateDomain("$domain");
    } 
    my $UserData;
    @$UserData{'MaxAccountSize'}=$quota;

    $cli->UpdateAccountSettings("$user\@$domain", { MaxAccountSize => $quota });
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
    doaddpop($args->[0], $args->[1], $args->[2], $args->[3]);
}

sub doaddpop {
    my ($user, $password, $quota, $domain) = @_;
    my $cli = getCLI();
    if ($quota == 0) {
        $quota="unlimited" ;
    }else{
        $quota .= "M";
    }
    my $cli = getCLI();
    my $data = $cli->GetDomainSettings("$domain");
    if (!$data) {
    	$cli->CreateDomain("$domain");
    } 
    my $UserData;
    @$UserData{'Password'}=$password;
    @$UserData{'ServiceClass'}="mailonly";
    @$UserData{'MaxAccountSize'}=$quota;
    my $response = $cli->CreateAccount(accountName => "$user\@$domain", settings => $UserData);
    if ($response) {
    	$cli->CreateMailbox("$user\@$domain", "Calendar");
    	$cli->CreateMailbox("$user\@$domain", "Spam");
    } else {
    	my $apiref = Cpanel::Api2::Exec::api2_preexec( 'Email', 'delpop' );
    	my ( $data, $status ) = Cpanel::Api2::Exec::api2_exec( 'Email', 'delpop', $apiref, {domain => 'anton.bg', email=>'testov'} );
    }
    $cli->Logout();
}

1;