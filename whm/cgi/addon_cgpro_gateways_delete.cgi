#!/bin/sh
 eval 'if [ -x /usr/local/cpanel/3rdparty/bin/perl ]; then exec /usr/local/cpanel/3rdparty/bin/perl -x -- $0 ${1+"$@"}; else exec /usr/bin/perl -x $0 ${1+"$@"}; fi;'
    if 0;
#!/usr/bin/perl

use Cpanel::Form            ();
use Whostmgr::HTMLInterface ();
use Whostmgr::ACLS          ();
use CLI;
use Cpanel::API::Branding        ();
use Cpanel::CachedDataStore;

Whostmgr::ACLS::init_acls();
if ( !Whostmgr::ACLS::hasroot() ) {
  print "You need to be root to see the hello world example.\n";
  exit();
}

my $conf = Cpanel::CachedDataStore::fetch_ref( '/var/cpanel/communigate.yaml' ) || {};
my $cli = new CGP::CLI( { PeerAddr => $conf->{cgprohost},
                            PeerPort => $conf->{cgproport},
                            login => $conf->{cgprouser},
                            password => $conf->{cgpropass} } );
unless($cli) {
  print STDERR "Can't login to CGPro: ".$CGP::ERR_STRING,"\n";
   exit(0);
}

my $cgproversion = $cli->getversion();

my %FORM = Cpanel::Form::parseform();
my $domain = $cli->MainDomainName();

if ($FORM{provider}) {
    my $prefs = $cli->GetAccountPrefs('pbx@' . $domain);
    my $id = $prefs->{Gateways}->{$FORM{provider}}->{shortId};
    $id =~ s/\D//g;
    my $rsips = $cli->GetAccountRSIPs('pbx@' . $domain);


    if ($prefs->{Gateways}->{$FORM{provider}}->{callInGw}->{telnums}) {
	my $tels = [];
	for my $tel (@{$prefs->{Gateways}->{$FORM{provider}}->{callInGw}->{telnums}}) {
	    delete $rsips->{'rsip-' . $id . '-' . $tel->{reguid}} if $rsips->{'rsip-' . $id . '-' . $tel->{reguid}};
	    unassignTelnum($cli, $tel->{"assigned"}, $tel) if $tel->{"assigned"};
	}
	$prefs->{Gateways}->{$FORM{provider}}->{callInGw}->{telnums} = $tels;
    }
    $cli->SetAccountRSIPs('pbx@' . $domain, $rsips);


    my $gateways;
    # Remove the gateway.
    for my $pref (keys %{$prefs->{Gateways}}) {
    	unless ($pref eq $FORM{provider}) {
    	    $gateways->{$pref} = $prefs->{Gateways}->{$pref};
    	}
    }
    my $update = {Gateways => $gateways};
    $cli->UpdateAccountPrefs('pbx@' . $domain, $update);
}

print "HTTP/1.1 303 See Other\r\nLocation: addon_cgpro_gateways.cgi\r\n\r\n";
$cli->Logout();
sub unassignTelnum () {
    my ($cli, $domain, $tel) = @_;
    my $telnum = $tel->{"telnum"};
    if ($domain) {
        my $domainPrefs = $cli->GetAccountDefaultPrefs($domain);
        if ($domainPrefs->{"assignedTelnums"}->{$telnum}) {
    	if ($domainPrefs->{"assignedTelnums"}->{$telnum}->{"assigned"}) {
    	    my ($type, $object) = split ":", $domainPrefs->{"assignedTelnums"}->{$telnum}->{"assigned"};
    	    if ($type eq "a") {
    		my $telnums = $cli->GetAccountTelnums($object);
    		@$telnums = grep { $_ ne $telnum } @$telnums;
    		$cli->SetAccountTelnums($object, $telnums);
		my $accountSettings = $cli->GetAccountSettings($object);
		if ($tel->{"authname"} eq $accountSettings->{"PSTNGatewayAuthName"} && $tel->{"username"} eq $accountSettings->{"PSTNFromName"}) {
		    $cli->UpdateAccountSettings($object, {
		    	PSTNFromName => "default",
		    	PSTNGatewayAuthName => "default",
		    	PSTNGatewayDomain => "default",
		    	PSTNGatewayPassword => "default",
		    	PSTNGatewayVia => "default"
		    				});
		}
    	    } else {
		# Remove Server Rule.
    		my $rules = $cli->GetServerSignalRules();
    		@$rules = grep {$_->[1] ne "$telnum\@$domain"} @$rules; # LOAD possible
    		$cli->SetServerSignalRules($rules);
    	    }
    	}
	# Unassign default outgoing
	my $accountDefaults = $cli->GetAccountDefaults($domain);
	if ($tel->{"authname"} eq $accountDefaults->{"PSTNGatewayAuthName"} && $tel->{"username"} eq $accountDefaults->{"PSTNFromName"}) {
	    my $serviceClasses = $accountDefaults->{"ServiceClasses"} || {};
	    for my $class (keys %{$accountDefaults->{"ServiceClasses"}}) {
		delete $serviceClasses->{$class}->{PSTNFromName};
		delete $serviceClasses->{$class}->{PSTNGatewayAuthName};
		delete $serviceClasses->{$class}->{PSTNGatewayDomain};
		delete $serviceClasses->{$class}->{PSTNGatewayPassword};
		delete $serviceClasses->{$class}->{PSTNGatewayVia};
		delete $serviceClasses->{$class} unless keys %{$serviceClasses->{$class}};
	    }
	    $cli->UpdateAccountDefaults(
		domain => $domain, 
		settings => {
		    PSTNFromName => $telnum[0]->{'username'},
		    PSTNGatewayAuthName => $telnum[0]->{'authname'},
		    PSTNGatewayDomain => $telnum[0]->{'domain'},
		    PSTNGatewayPassword => $telnum[0]->{'authpass'},
		    PSTNGatewayVia => $telnum[0]->{'domain'},
		    ServiceClasses => $serviceClasses
		}
		);
	}
    	delete $domainPrefs->{"assignedTelnums"}->{$telnum};
        }
        $cli->UpdateAccountDefaultPrefs(domain => $domain, settings => {
    	assignedTelnums => $domainPrefs->{"assignedTelnums"}
    				    });
    }
}
1;
