#!/bin/sh
 eval 'if [ -x /usr/local/cpanel/3rdparty/bin/perl ]; then exec /usr/local/cpanel/3rdparty/bin/perl -x -- $0 ${1+"$@"}; else exec /usr/bin/perl -x $0 ${1+"$@"}; fi;'
    if 0;
#!/usr/bin/perl
#WHMADDON:appname:CGPro <strong>CommuniGate Servers</strong>

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
Whostmgr::HTMLInterface::defheader( "CommuniGate Pro Servers",'', '/cgi/addon_cgpro_servers.cgi' );

Cpanel::Template::process_template(
    'whostmgr',
    {
	'template_file' => 'addon_cgpro_servers.tmpl',
	conf => $conf,
	FORM => \%FORM
	},
);

1;
