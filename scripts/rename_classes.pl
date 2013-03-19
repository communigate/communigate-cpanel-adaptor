#!/bin/sh                                                                                                                                                                                               
 eval 'if [ -x /usr/local/cpanel/3rdparty/bin/perl ]; then exec /usr/local/cpanel/3rdparty/bin/perl -x -- $0 ${1+"$@"}; else exec /usr/bin/perl -x $0 ${1+"$@"}; fi;'
    if 0;
#!/usr/bin/perl

use strict;
use CLI;
use Cpanel::CachedDataStore;

my $conf = Cpanel::CachedDataStore::fetch_ref( '/var/cpanel/communigate.yaml' ) || {};
my $cli = new CGP::CLI( { PeerAddr => $conf->{cgprohost},
                            PeerPort => $conf->{cgproport},
                            login => $conf->{cgprouser},
                            password => $conf->{cgpropass} } );
unless($cli) {
  print STDERR "Can't login to CGPro: ".$CGP::ERR_STRING,"\n";
   exit(0);
}

my $defaults = $cli->GetServerAccountDefaults();

foreach my $classname (keys %{$defaults->{ServiceClasses}}) {
    if ($classname eq 'mailonly') {
	$defaults->{ServiceClasses}->{Standard} = $defaults->{ServiceClasses}->{mailonly};
	delete $defaults->{ServiceClasses}->{mailonly};
    }
    if ($classname eq 'groupware') {
	$defaults->{ServiceClasses}->{Premium} = $defaults->{ServiceClasses}->{groupware};
	delete $defaults->{ServiceClasses}->{groupware};
    }
}

$cli->UpdateServerAccountDefaults({
    ServiceClasses => $defaults->{ServiceClasses}
				  });
print "ServiceClasses Names updated! \n";
