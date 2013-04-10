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

if ($FORM{submitedit} && $FORM{provider} && $FORM{name}) {
    my $prefs = $cli->GetAccountPrefs('pbx@' . $domain);
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
	    shortId => $prefs->{LastProviderId} + 1
	};
	$update = {
	    Gateways => $gateways,
	    LastProviderId => '#' . ($prefs->{LastProviderId} + 1)
	};
	print "HTTP/1.1 303 See Other\r\nLocation: addon_cgpro_gateways.cgi\r\n\r\n";
    }
    $cli->UpdateAccountPrefs('pbx@' . $domain, $update);
}

my $prefs = $cli->GetAccountPrefs('pbx@' . $domain);

print "Content-type: text/html\r\n\r\n";
Whostmgr::HTMLInterface::defheader( "CGPro Edit Gateways",'', '/cgi/addon_cgpro_gateways_edit.cgi' );
Cpanel::Template::process_template(
				   'whostmgr',
				   {
				    'template_file' => 'addon_cgpro_gateways_edit.tmpl',
				    prefs => $prefs,
				    provider => $FORM{provider}
				   },
				  );

$cli->Logout();
1;
