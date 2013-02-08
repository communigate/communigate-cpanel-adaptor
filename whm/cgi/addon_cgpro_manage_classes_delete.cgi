#!/usr/bin/perl

use lib '/usr/local/cpanel';
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

if ($FORM{'class'}) {
    delete $defaults->{ServiceClasses}->{$FORM{'class'}} if $FORM{'class'} && $defaults->{ServiceClasses}->{$FORM{'class'}};
    $cli->UpdateServerAccountDefaults({
	ServiceClasses => $defaults->{ServiceClasses}
				      });
}
print "HTTP/1.1 303 See Other\r\nLocation: addon_cgpro_manage_classes.cgi\r\n\r\n";
$cli->Logout();
1;
