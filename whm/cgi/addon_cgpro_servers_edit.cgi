#!/bin/sh
 eval 'if [ -x /usr/local/cpanel/3rdparty/bin/perl ]; then exec /usr/local/cpanel/3rdparty/bin/perl -x -- $0 ${1+"$@"}; else exec /usr/bin/perl -x $0 ${1+"$@"}; fi;'
    if 0;
#!/usr/bin/perl

use Cpanel::Form            ();
use Whostmgr::HTMLInterface ();
use Whostmgr::ACLS          ();
use Cpanel::CachedDataStore;

print "Content-type: text/html\r\n\r\n";

Whostmgr::ACLS::init_acls();
if ( !Whostmgr::ACLS::hasroot() ) {
  print "You need to be root to see the hello world example.\n";
  exit();
}

my $conf = Cpanel::CachedDataStore::fetch_ref( '/var/cpanel/communigate.yaml' ) || {};

my %FORM = Cpanel::Form::parseform();

if ($FORM{'save'}) {
    if ($FORM{'account'}) {
	$conf->{'users'}->{$FORM{'account'}}->{'cgprohost'} = $FORM{"host"};
	$conf->{'users'}->{$FORM{'account'}}->{'cgproport'} = $FORM{"port"};
	$conf->{'users'}->{$FORM{'account'}}->{'cgprouser'} = $FORM{"user"};
	$conf->{'users'}->{$FORM{'account'}}->{'cgpropass'} = $FORM{"pass"} if $FORM{"pass"} && $FORM{"pass"} eq $FORM{"repass"};
    } else {
	$conf->{'cgprohost'} = $FORM{"host"};
	$conf->{'cgproport'} = $FORM{"port"};
	$conf->{'cgprouser'} = $FORM{"user"};
	$conf->{'cgpropass'} = $FORM{"pass"} if $FORM{"pass"} && $FORM{"pass"} eq $FORM{"repass"};
    }
    Cpanel::CachedDataStore::store_ref( '/var/cpanel/communigate.yaml', $conf );
    $conf = Cpanel::CachedDataStore::fetch_ref( '/var/cpanel/communigate.yaml' ) || {};
}

my $settings = {%$conf};
if ($FORM{account}) {
    Whostmgr::HTMLInterface::defheader( "Server configuration for $FORM{account}",'', '/cgi/addon_cgpro_servers_edit.cgi' );
    $settings = $settings->{'users'}->{$FORM{account}} if $settings->{'users'}->{$FORM{account}};
} else {
    Whostmgr::HTMLInterface::defheader( "default Server Configuration",'', '/cgi/addon_cgpro_servers_edit.cgi' );
}
    
Cpanel::Template::process_template(
    'whostmgr',
    {
	'template_file' => 'addon_cgpro_servers_edit.tmpl',
	conf => $settings,
	FORM => \%FORM
	},
);

1;
