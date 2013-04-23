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

my $telnums = $cli->ListForwarders($domain);
my $tels = {};
for my $telnum (@$telnums) {
    if ($telnum =~ m/^i\-(\d+)$/) {
	my $tel = $1;
	my $to = $cli->GetForwarder($telnum);
	$to =~ s/\.local//;
	if ($to =~ m/$FORM{provider}\@(.*?)$/) {
	    $tels->{$tel} = $1;
	}
    }
}
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
	$provider =~ s/\W//g;
	$gateways->{lc $provider} = {
	    name => $FORM{name},
	    desc => $FORM{description},
	    shortId => '#' . ($prefs->{LastProviderId} + 1),
	    id => lc $provider,
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
    if ($FORM{dialInEnabled}) {
	$prefs->{Gateways}->{$FORM{provider}}->{callInGw} = {
	    disabled => undef,
	    proxyType => "registrar",
	    telnums => []
	} unless $prefs->{Gateways}->{$FORM{provider}}->{callInGw};
	if ($FORM{dialInDisable}) {
	    $prefs->{Gateways}->{$FORM{provider}}->{callInGw}->{disabled} = "YES";
	} else {
	    $prefs->{Gateways}->{$FORM{provider}}->{callInGw}->{disabled} = undef;
	}

	$prefs->{Gateways}->{$FORM{provider}}->{callInGw}->{proxyType} = $FORM{proxyType};
	
	if ($FORM{proxyType} eq "trunk") {
	    $prefs->{Gateways}->{$FORM{provider}}->{callInGw}->{calledIDMethod} = "uri";
	    $prefs->{Gateways}->{$FORM{provider}}->{callInGw}->{destination} = $FORM{localIP};
	} else {
	    delete $prefs->{Gateways}->{$FORM{provider}}->{callInGw}->{calledIDMethod} if $prefs->{Gateways}->{$FORM{provider}}->{callInGw}->{calledIDMethod};
	    delete $prefs->{Gateways}->{$FORM{provider}}->{callInGw}->{destination} if $prefs->{Gateways}->{$FORM{provider}}->{callInGw}->{destination};
	}

	if (($FORM{proxyType} eq "registrar" && $FORM{proxyTypeOld} ne "registrar") || ($FORM{proxyType} eq "director" && $FORM{proxyTypeOld} ne "director")) {
	    $prefs->{Gateways}->{$FORM{provider}}->{callInGw}->{telnums} = [];
	}
	# Update Gateways trunk
	$prefs->{Gateways}->{$FORM{provider}}->{callInGw}->{trunk} = [];
	if ($FORM{proxyType} ne "registrar") {
	    for my $ip (split "\r?\n", $FORM{gateways}) {
		# #I[192.168.2.1]:*
		$ip =~ s/^(.*?)(\:\d+)?$/#I[$1]$2/;
		$ip .= ":*" unless $ip =~ /\:/;
		warn $ip;
		push @{$prefs->{Gateways}->{$FORM{provider}}->{callInGw}->{trunk}}, {
		    source => $ip,
		    descr => ""
		} if $ip =~ m/^\#I\[\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\]\:(\*|\d{1,2})$/;
	    }
	}
	# Common GWin
	my $rsips = $cli->GetAccountRSIPs('pbx@' . $domain);
	for my $tel (keys %$tels) {
	    # Modify telnums
	    if ($FORM{proxyType} eq "registrar" && $FORM{proxyTypeOld} ne "registrar") {
		my $uin = join "-", map{ join "", map { unpack "H*", chr(rand(256)) } 1..$_} (4,2,2,2,6);
		push @{$prefs->{Gateways}->{$FORM{provider}}->{callInGw}->{telnums}}, {
		    'authname' => undef,
		    'telnum' => $tel,
		    'contact' => 'gwin-' . $id . '-' . $tel . '@' . $domain ,
		    'authpass' => undef,
		    'username' => undef,
		    'domain' => '',
		    'reguid' => $uin,
		    'server' => undef,
		    'expires' => '30m'
		};
		$rsips->{'rsip-' . $id . '-' . $uin } = {
		    domain => "",
		    fromName => $tel,
		    gwid => $id,
		    period => '30m',
		    telnum => $tel,
		}
	    }
	    if ($FORM{proxyType} eq "director" && $FORM{proxyTypeOld} ne "director") {
		push @{$prefs->{Gateways}->{$FORM{provider}}->{callInGw}->{telnums}}, {
		    telnum => $tel
		};
	    }
	}
	if ($FORM{proxyType} eq "registrar" && $FORM{proxyTypeOld} ne "registrar") {
	    $cli->SetAccountRSIPs('pbx@' . $domain, $rsips);
	}
	if ($FORM{proxyType} eq "trunk" && $FORM{proxyTypeOld} ne "trunk") {
	    delete $prefs->{Gateways}->{$FORM{provider}}->{callInGw}->{telnums};
	}
	if ($FORM{proxyType} ne "registrar" && $FORM{proxyTypeOld} eq "registrar") {
	    my $newRsips = {};
	    for my $rsip (keys $rsips) {
		$newRsips->{$rsip} = $rsips->{$rsip} unless $rsip =~ m/^rsip-$id/;
	    }
	    $cli->SetAccountRSIPs('pbx@' . $domain, $newRsips);
	}
	# Media relay
	$prefs->{Gateways}->{$FORM{provider}}->{callInGw}->{forceRelay} = $FORM{forceRelay} ? "YES" : 'default';
	if ($FORM{forceMediaProcessing}) {
	    $prefs->{Gateways}->{$FORM{provider}}->{callInGw}->{forceRelay} = "YES";
	    $prefs->{Gateways}->{$FORM{provider}}->{callInGw}->{forceMediaProcessing} = "YES";
	} else {
	    $prefs->{Gateways}->{$FORM{provider}}->{callInGw}->{forceMediaProcessing} = 'default';
	}
	# Caller ID
	if ($FORM{CLIDEnabled}) {
	    $prefs->{Gateways}->{$FORM{provider}}->{callInGw}->{CLIDEnabled} = "YES";
	    $prefs->{Gateways}->{$FORM{provider}}->{callInGw}->{CLIDTrusted} = $FORM{CLIDTrusted} ? "YES" : undef;
	    my $methods = {};
	    for my $method ( ('dis', 'rpi', 'pai') ) {
		if ($FORM{"CLIDMethods-" . $method}) {
		    $methods->{$FORM{"CLIDMethods-" . $method . "-order"} || rand()} = $method;
		}
	    }
	    my $mth = [];
	    for my $key (sort keys %$methods) {
		push @$mth, $methods->{$key};
	    }
	    $prefs->{Gateways}->{$FORM{provider}}->{callInGw}->{CLIDMethods} = $mth;
	    # Rules
	    $prefs->{Gateways}->{$FORM{provider}}->{callInGw}->{callerIdReRules} = [];
	    for my $rul (split "\r?\n", $FORM{callerIdReRules}) {
		$rul =~ s/\s+//g;
		my ($r,$a) = split "->", $rul;
		if ($r && $a && $r =~ m/^(.*?)(\(.*?\)|\*)$/) {
		    my $numbers = $1;
		    my $wildcard = $2;
		    my $range = "";
		    if ($wildcard eq '*') {
			$range = undef;
			$r =~ s/\*/(.*)/;
		    } else {
			$r =~ s/(\(.*?\))/([0-9]+)/;
			$wildcard =~ s/[\(\)]//g;
			my ($from, $to) = split "-", $wildcard;
			if ($to) {
			    $range = [["#".$from, "#".$to]];
			} else {
			    $range = ["#".$from];
			}
		    }
		    $r =~ s/^\+/\\\\+?/;
		    $r =~ s/^(.*?)$/^$1\$/;
		    $a =~ s/(\(.*?\)|\*)//;
		    push @{$prefs->{Gateways}->{$FORM{provider}}->{callInGw}->{callerIdReRules}}, [$r, $range, $a, '#1'];
		}
	    }
	    use Data::Dumper;
	    warn Dumper $prefs->{Gateways}->{$FORM{provider}}->{callInGw}->{callerIdReRules};
	} else {
	    delete $prefs->{Gateways}->{$FORM{provider}}->{callInGw}->{CLIDEnabled};
	    delete $prefs->{Gateways}->{$FORM{provider}}->{callInGw}->{CLIDTrusted};
	    delete $prefs->{Gateways}->{$FORM{provider}}->{callInGw}->{CLIDMethods};
	    delete $prefs->{Gateways}->{$FORM{provider}}->{callInGw}->{callerIdReRules};
	}
	# Update telnums settings
	if ($FORM{proxyType} eq "registrar" && $FORM{proxyTypeOld} eq "registrar") {
	    if ($prefs->{Gateways}->{$FORM{provider}}->{callInGw}->{telnums}) {
		my $rsips = $cli->GetAccountRSIPs('pbx@' . $domain);
		for my $tel (@{$prefs->{Gateways}->{$FORM{provider}}->{callInGw}->{telnums}}) {
		    $tel = {
			'telnum' => $tel->{telnum},
			'authname' => ($FORM{'authname-' . $tel->{telnum}} || undef),
			'contact' => $tel->{contact},
			'authpass' => ($FORM{'password-' . $tel->{telnum}} || undef),
			'username' => ($FORM{'username-' . $tel->{telnum}} || undef),
			'domain' => ($FORM{'host-' . $tel->{telnum}} || undef),
			'reguid' => $tel->{reguid},
			'server' => $tel->{server},
			'expires' => ($FORM{'expires-' . $tel->{telnum}} || undef)
		    };
		    warn $FORM{'host-' . $tel->{telnum}}, "\n";
		    $rsips->{'rsip-' . $id . '-' . $tel->{reguid}} = {
			domain => $FORM{'host-' . $tel->{telnum}},
			fromName => $FORM{'username-' . $tel->{telnum}},
			telnum => $tel->{telnum},
			gwid => $id,
			period => $FORM{'expires-' . $tel->{telnum}},
			authName => $FORM{'authname-' . $tel->{telnum}},
			password => $FORM{'password-' . $tel->{telnum}},
		    };
		}
		$cli->SetAccountRSIPs('pbx@' . $domain, $rsips);
	    }
	}
	for my $tel (keys %$tels) {
	    if ($FORM{'delete-' . $tel}) {
		# Delete Forwarders
		$cli->DeleteForwarder($tel . '@central.telnum');
		my $assigned = $cli->GetForwarder("i-" . $tel . '@' . $domain);
		$assigned =~ s/^.*?@(.*?)\.local$/$1/;
		$cli->DeleteForwarder("i-" . $tel . '@' . $domain);
		$cli->DeleteForwarder("tn-" . $tel . '@' . $domain);
		if ($assigned ne 'null') {
		    $cli->DeleteForwarder("tn-" . $tel . '@' . $assigned);
		    $cli->DeleteForwarder("i-" . $tel . '@' . $assigned);
		}
	    } else {
		 $cli->DeleteForwarder("i-" . $tel . '@' . $domain);
		 $cli->DeleteForwarder("tn-" . $tel . '@' . $domain);
		 $cli->DeleteForwarder("tn-" . $tel . '@' . $FORM{'assigned-' . $tel});
		 $cli->DeleteForwarder("i-" . $tel . '@' . $FORM{'assigned-' . $tel});
		 $cli->CreateForwarder("i-" . $tel . '@' . $domain, $FORM{provider} . '@' . ( $FORM{'assigned-' . $tel} ? $FORM{'assigned-' . $tel} : 'null' ) . '.local' );
		 $cli->CreateForwarder("tn-" . $tel . '@' . $domain, ($FORM{'assigned-' . $tel} ? "tn-" . $tel . '@' . $FORM{'assigned-' . $tel} : 'null' ) );
		 my $fwd = $cli->GetForwarder("tn-" . $tel . '@' . $FORM{'assigned-' . $tel});
		 warn $cli->CreateForwarder("tn-" . $tel . '@' . $FORM{'assigned-' . $tel}, $fwd || 'null' ) if $FORM{'assigned-' . $tel};
		 warn $cli->CreateForwarder("i-" . $tel . '@' . $FORM{'assigned-' . $tel}, $FORM{'provider'} . "+" . $domain . "@" . $FORM{'assigned-' . $tel} . '.local' ) if $FORM{'assigned-' . $tel};
	    }
	}
	if ($prefs->{Gateways}->{$FORM{provider}}->{callInGw}->{telnums}) {
	    my $rsips = $cli->GetAccountRSIPs('pbx@' . $domain);
	    my $tels = [];
	    for my $tel (@{$prefs->{Gateways}->{$FORM{provider}}->{callInGw}->{telnums}}) {
		if ($FORM{'delete-' . $tel->{telnum}}) {
		    if ($tel->{reguid}) {
			delete $rsips->{'rsip-' . $id . '-' . $tel->{reguid}};
		    }
		} else {
		    push @$tels, $tel;
		}
	    }
	    $prefs->{Gateways}->{$FORM{provider}}->{callInGw}->{telnums} = $tels;
	    $cli->SetAccountRSIPs('pbx@' . $domain, $rsips);
	}
	$cli->UpdateAccountPrefs('pbx@' . $domain, {Gateways => $prefs->{Gateways}});
    } else {
	if ($prefs->{Gateways}->{$FORM{provider}}->{callInGw}) {
	    delete $prefs->{Gateways}->{$FORM{provider}}->{callInGw};
	    $cli->UpdateAccountPrefs('pbx@' . $domain, {Gateways => $prefs->{Gateways}});
	}
    }
}
my $prefs = $cli->GetAccountPrefs('pbx@' . $domain);
$telnums = $cli->ListForwarders($domain);
$tels = {};
for my $telnum (@$telnums) {
    if ($telnum =~ m/^i\-(\d+)$/) {
	my $tel = $1;
	my $to = $cli->GetForwarder($telnum);
	$to =~ s/\.local//;
	if ($to =~ m/$FORM{provider}\@(.*?)$/) {
	    $tels->{$tel} = $1;
	}
    }
}

my $telnumDetails = {};
for $num (@{$prefs->{Gateways}->{$FORM{provider}}->{callInGw}->{telnums}}) {
    $telnumDetails->{$num->{telnum}} = $num;
}

my $methods = {};
my $i = 0;
for $method (@{$prefs->{Gateways}->{$FORM{provider}}->{callInGw}->{CLIDMethods}}) {
    $methods->{$method} = ++$i;
}

my $callerIdReRules;
for my $rule (@{$prefs->{Gateways}->{$FORM{provider}}->{callInGw}->{callerIdReRules}}) {
    my $condition = $rule->[0];
    my $digits = $rule->[1];
    my $action = $rule->[2];
    if ($digits eq '#NULL#') {
	$digits = '*';
    } else {
	$digits = $digits->[0];
	unless ($digits =~ s/^\#(\d+)$/$1/) {
	    $digits = join "-", map {$_ =~ s/^\#(\d+)$/$1/ ? $_ : ""} @$digits;
	}
	$digits = "($digits)";
    }
    $condition =~ s/^\^(.*?)\(.*\)\$$/$1/;
    $condition =~ s/[\\\?]//g;
    $callerIdReRules .= "$condition$digits -> $action*\n";
}

print "Content-type: text/html\r\n\r\n";
Whostmgr::HTMLInterface::defheader( "CGPro Edit Gateways",'', '/cgi/addon_cgpro_gateways_edit.cgi' );
Cpanel::Template::process_template(
				   'whostmgr',
				   {
				    'template_file' => 'addon_cgpro_gateways_edit.tmpl',
				    prefs => $prefs,
				    provider => $FORM{provider},
				    FORM => \%FORM,
				    telnums => $tels,
				    telnumDetails => $telnumDetails,
				    methods => $methods,
				    callerIdReRules => $callerIdReRules
				   },
				  );

$cli->Logout();
1;
