#!/bin/sh
 eval 'if [ -x /usr/local/cpanel/3rdparty/bin/perl ]; then exec /usr/local/cpanel/3rdparty/bin/perl -x -- $0 ${1+"$@"}; else exec /usr/bin/perl -x $0 ${1+"$@"}; fi;'
    if 0;
#!/usr/bin/perl

use Cpanel::Form            ();
use Whostmgr::HTMLInterface ();
use Whostmgr::ACLS          ();
use Cpanel::CachedDataStore;

Whostmgr::ACLS::init_acls();
if ( !Whostmgr::ACLS::hasroot() ) {
  print "You need to be root to see the hello world example.\n";
  exit();
}


my %FORM = Cpanel::Form::parseform();

if ($FORM{'account'}) {
    my $conf = Cpanel::CachedDataStore::fetch_ref( '/var/cpanel/communigate.yaml' ) || {};
    delete $conf->{'users'}->{$FORM{'account'}} if $conf->{'users'}->{$FORM{'account'}};
    Cpanel::CachedDataStore::store_ref( '/var/cpanel/communigate.yaml', $conf );
}

print "HTTP/1.1 303 See Other\r\nLocation: addon_cgpro_servers.cgi\r\n\r\n";
1;
