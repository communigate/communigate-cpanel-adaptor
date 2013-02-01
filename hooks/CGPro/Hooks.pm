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
    return [$mail_addpop, $mail_delpop, $mail_passwdpop, $mail_editquota];
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
    my $cli = getCLI();

    my $domain = $args->{'domain'};
    my $user= $args->{'email'};
    my $password= $args->{'password'};
    my $quota = $args->{'quota'};
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


1;
