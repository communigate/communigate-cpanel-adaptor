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

my $tels = {};
my $prefs = $cli->GetAccountPrefs('pbx@' . $domain);
my $id = $prefs->{Gateways}->{$FORM{provider}}->{shortId};
$id =~ s/\D//g;
if ($FORM{submitedit} && $FORM{provider} && $FORM{name}) {
    my $providerFount = 0;
    my $gateways;
    for my $pref (keys %{$prefs->{Gateways}}) {
	if ($pref eq $FORM{oldprovider}) {
	    $gateways->{$FORM{provider}} = {
		name => $FORM{name},
		desc => $FORM{description},
		shortId => $prefs->{Gateways}->{$pref}->{shortId}
	    };
	    $providerFount = 1;
	} else {
	    $gateways->{$pref} = $prefs->{Gateways}->{$pref};
	}
    }
    my $update = {Gateways => $gateways};
    unless ($providerFount) {
	$prefs->{LastProviderId} =~ s/\D//g;
	my $provider = $FORM{provider};
	$gateways->{$provider} = {
	    name => $FORM{name},
	    desc => $FORM{description},
	    shortId => '#' . ($prefs->{LastProviderId} + 1),
	    id => $provider,
	    key => join "-", map{ join "", map { unpack "H*", chr(rand(256)) } 1..$_} (4,2,2,2,6)
	};
	$update = {
	    Gateways => $gateways,
	    LastProviderId => '#' . ($prefs->{LastProviderId} + 1)
	};
	print "HTTP/1.1 303 See Other\r\nLocation: addon_cgpro_gateways.cgi\r\n\r\n";
    }
    $cli->UpdateAccountPrefs('pbx@' . $domain, $update);
}

if ($FORM{submitdialin} && $FORM{provider}) {
	$prefs->{Gateways}->{$FORM{provider}}->{callInGw} = {
	    proxyType => "director",
	    telnums => []
	} unless $prefs->{Gateways}->{$FORM{provider}}->{callInGw};

	$prefs->{Gateways}->{$FORM{provider}}->{callInGw}->{proxyType} = $FORM{proxyType} if $FORM{proxyType};

	my $rsips = $cli->GetAccountRSIPs('pbx@' . $domain);
	# Update telnums settings
	if ($FORM{proxyType} eq "registrar") {
	    if ($prefs->{Gateways}->{$FORM{provider}}->{callInGw}->{telnums}) {
		my $rsips = $cli->GetAccountRSIPs('pbx@' . $domain);
		for my $tel (@{$prefs->{Gateways}->{$FORM{provider}}->{callInGw}->{telnums}}) {
		    $tel = {
			'telnum' => $tel->{telnum},
			'authname' => ($FORM{'authname-' . $tel->{telnum}} || $tel->{"authname"} || undef),
			'contact' => $tel->{contact},
			'authpass' => ($FORM{'password-' . $tel->{telnum}} || $tel->{"authpass"} || undef),
			'username' => ($FORM{'username-' . $tel->{telnum}} || $tel->{"username"} || undef),
			'domain' => ($FORM{'host-' . $tel->{telnum}} || $tel->{"domain"} || undef),
			'reguid' => $tel->{reguid},
			# 'server' => $tel->{server},
			'expires' => ($FORM{'expires-' . $tel->{telnum}} || $tel->{telnum} || undef),
			'assigned' => ($FORM{'assigned-' . $tel->{telnum}} || undef)
		    };
		    if ($tel->{'assigned'} && $tel->{'assigned'} ne "#NULL#") {
			    $rsips->{'rsip-' . $id . '-' . $tel->{reguid}} = {
				domain =>  $tel->{"domain"} || "",
				fromName => $tel->{"username"} || "",
				targetName => $tel->{'telnum'} . "@" . $tel->{'assigned'},
				gwid => $id,
				period => $tel->{"expires"} || "",
				authName => $tel->{"authname"} || "",
				password => $tel->{"authpass"} || ""
			    } if $tel->{"authpass"} && $tel->{"authname"} && $tel->{"expires"} && $tel->{"domain"};
			    my $domainPrefs = $cli->GetAccountDefaultPrefs($tel->{'assigned'});
			    $domainPrefs->{"assignedTelnums"} = {} unless $domainPrefs->{"assignedTelnums"};
			    $domainPrefs->{"assignedTelnums"}->{$tel->{telnum}} = {} unless $domainPrefs->{"assignedTelnums"}->{$tel->{telnum}};
			    $domainPrefs->{"assignedTelnums"}->{$tel->{telnum}}->{"gateway"} = $FORM{'provider'};
			    $domainPrefs->{"assignedTelnums"}->{$tel->{telnum}}->{"proxyType"} = "registrar";
			    $cli->UpdateAccountDefaultPrefs(domain => $tel->{'assigned'}, settings => {
				assignedTelnums => $domainPrefs->{"assignedTelnums"}
							    });
		    } else {
			unassignTelnum($cli, $FORM{'oldassigned-' . $tel->{telnum}}, $tel);
			delete $rsips->{'rsip-' . $id . '-' . $tel->{reguid}} if $rsips->{'rsip-' . $id . '-' . $tel->{reguid}};
		    }
		}
		$cli->SetAccountRSIPs('pbx@' . $domain, $rsips);
	    }
	} else {
	    if ($prefs->{Gateways}->{$FORM{provider}}->{callInGw}->{telnums}) {
		my $rsips = $cli->GetAccountRSIPs('pbx@' . $domain);
		my $rids = [keys %$rsips];
		my $tids = [map {'rsip-' . $id . '-' . $_->{reguid}} @{$prefs->{Gateways}->{$FORM{provider}}->{callInGw}->{telnums}}]; 
		my $common = [];
		# Find active RSIPs for this gateway
		for my $rid (@$rids) {
		    for my $tid (@$tids) {
			push @$common, $rid if $rid eq $tid;
		    }
		}
		# Stop active RSIPs
		for my $rid (@$common) {
		    delete $rsips->{$rid} if $rsips->{$rid};
		}
		$cli->SetAccountRSIPs('pbx@' . $domain, $rsips);
	    }
	}
	
	# Delete checked RSIPs
	if ($prefs->{Gateways}->{$FORM{provider}}->{callInGw}->{telnums}) {
	    my $rsips = $cli->GetAccountRSIPs('pbx@' . $domain);
	    my $tels = [];
	    for my $tel (@{$prefs->{Gateways}->{$FORM{provider}}->{callInGw}->{telnums}}) {
		if ($FORM{'delete-' . $tel->{telnum}}) {
		    if ($tel->{reguid}) {
			delete $rsips->{'rsip-' . $id . '-' . $tel->{reguid}};
			unassignTelnum($cli, $FORM{'oldassigned-' . $tel->{telnum}}, $tel);
		    }
		} else {
		    push @$tels, $tel;
		}
	    }
	    $prefs->{Gateways}->{$FORM{provider}}->{callInGw}->{telnums} = $tels;
	    $cli->SetAccountRSIPs('pbx@' . $domain, $rsips);

	}
    $cli->UpdateAccountPrefs('pbx@' . $domain, {Gateways => $prefs->{Gateways}});
}

# GETS
my $prefs = $cli->GetAccountPrefs('pbx@' . $domain);
$tels = {};


my $telnumDetails = {};
if ($prefs->{Gateways}->{$FORM{provider}}->{callInGw} && $prefs->{Gateways}->{$FORM{provider}}->{callInGw} ne '#NULL#') {
    %$tels = map {$_->{telnum} => $_->{assigned_domain}} @{$prefs->{Gateways}->{$FORM{provider}}->{callInGw}->{telnums}};
    for $num (@{$prefs->{Gateways}->{$FORM{provider}}->{callInGw}->{telnums}}) {
	$telnumDetails->{$num->{telnum}} = $num;
    }

    my $methods = {};
    my $i = 0;
    for $method (@{$prefs->{Gateways}->{$FORM{provider}}->{callInGw}->{CLIDMethods}}) {
	$methods->{$method} = ++$i;
    }
}

my $rsipstatus;
if (defined $prefs->{Gateways}->{$FORM{provider}}->{callInGw} && $prefs->{Gateways}->{$FORM{provider}}->{callInGw}->{proxyType} eq "registrar") {
    $rsipstatus = $cli->GetAccountInfo('pbx@' . $domain, "RSIP");
}

print "Content-type: text/html\r\n\r\n";
Whostmgr::HTMLInterface::defheader( "CGPro Edit Gateways",'', '/cgi/addon_cgpro_gateways_edit.cgi' );
Cpanel::Template::process_template(
				   'whostmgr',
				   {
				    'template_file' => 'addon_cgpro_gateways_edit.tmpl',
				    prefs => $prefs,
				    provider => $FORM{provider},
				    providerID => $id,
				    FORM => \%FORM,
				    telnums => $tels,
				    telnumDetails => $telnumDetails,
				    methods => $methods,
				    rsipStatus => $rsipstatus,
				   },
				  );

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
    	delete $domainPrefs->{"assignedTelnums"}->{$telnum};
        }
        $cli->UpdateAccountDefaultPrefs(domain => $domain, settings => {
    	assignedTelnums => $domainPrefs->{"assignedTelnums"}
    				    });
    }
}
1;
