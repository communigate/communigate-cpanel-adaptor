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

my $defaults = $cli->GetServerAccountDefaults();

if ($FORM{'class'} && $FORM{'class'} ne "mailonly") {
    delete $defaults->{ServiceClasses}->{$FORM{'class'}} if $FORM{'class'} && $defaults->{ServiceClasses}->{$FORM{'class'}};
    $cli->UpdateServerAccountDefaults({
	ServiceClasses => $defaults->{ServiceClasses}
				      });
    my $data = Cpanel::CachedDataStore::fetch_ref( '/var/cpanel/cgpro/classes.yaml' ) || {};
    for my $setting (keys %$data) {
	delete $data->{$setting}->{$FORM{'class'}} if defined $data->{$setting}->{$FORM{'class'}};
    }
    Cpanel::CachedDataStore::store_ref( '/var/cpanel/cgpro/classes.yaml', $data );
}
print "HTTP/1.1 303 See Other\r\nLocation: addon_cgpro_manage_classes.cgi\r\n\r\n";
$cli->Logout();
1;
