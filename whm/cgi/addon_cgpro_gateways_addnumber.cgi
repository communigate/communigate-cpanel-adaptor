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

if ($FORM{submitedit} && $FORM{telnum}) {
    my $prefs = $cli->GetAccountPrefs('pbx@' . $domain);
    my $gateways = $prefs->{Gateways};
    my $id = $prefs->{Gateways}->{$FORM{provider}}->{shortId};
    $id =~ s/\D//g;
    if ($gateways->{$FORM{provider}}->{callInGw}->{proxyType} eq 'director' && ! $assigned) {
	$gateways->{$FORM{provider}}->{callInGw}->{telnums} = [] unless $gateways->{$FORM{provider}}->{callInGw}->{telnums};
	push @{$gateways->{$FORM{provider}}->{callInGw}->{telnums}}, {'telnum' => $FORM{telnum}};
    }
    if ($gateways->{$FORM{provider}}->{callInGw}->{proxyType} eq 'registrar' && ! $assigned) {
	$gateways->{$FORM{provider}}->{callInGw}->{telnums} = [] unless $gateways->{$FORM{provider}}->{callInGw}->{telnums};
	my $uin = join "-", map{ join "", map { unpack "H*", chr(rand(256)) } 1..$_} (4,2,2,2,6);
	push @{$gateways->{$FORM{provider}}->{callInGw}->{telnums}}, {
	    'telnum' => $FORM{telnum},
	    'authname' => ($FORM{authname} || undef),
	    'contact' => 'gwin-' . $id . '-' . $tel . '@' . $domain ,
	    'authpass' => ($FORM{password} || undef),
	    'username' => ($FORM{username} || undef),
	    'domain' => ($FORM{host} || undef),
	    'reguid' => $uin,
	    'server' => undef,
	    'expires' => ($FORM{expires} || undef)
	};
	my $rsips = $cli->GetAccountRSIPs('pbx@' . $domain);
	$rsips->{'rsip-' . $id . '-' . $uin } = {
	    domain => $FORM{host},
	    fromName => $FORM{username},
	    targetName => $FORM{telnum},
	    gwid => $id,
	    period => $FORM{expires},
	    authName => $FORM{authname},
	    password => $FORM{password},
	};
	$cli->SetAccountRSIPs('pbx@' . $domain, $rsips);
    }
    $cli->UpdateAccountPrefs('pbx@' . $domain, {Gateways => $gateways});

    print "HTTP/1.1 303 See Other\r\nLocation: addon_cgpro_gateways_edit.cgi?provider=" . $FORM{provider} . "\r\n\r\n";
}

my $prefs = $cli->GetAccountPrefs('pbx@' . $domain);
print "Content-type: text/html\r\n\r\n";
Whostmgr::HTMLInterface::defheader( "CGPro Gateways - Add Number",'', '/cgi/addon_cgpro_gateways_addnumber.cgi' );
Cpanel::Template::process_template(
				   'whostmgr',
				   {
				    'template_file' => 'addon_cgpro_gateways_addnumber.tmpl',
				    FORM => \%FORM,
				    prefs => $prefs,
				    provider => $FORM{provider}
				   },
				  );

$cli->Logout();
1;
