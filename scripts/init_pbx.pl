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

my $domain = $cli->MainDomainName();
unless ($cli->GetAccountSettings("pbx\@$domain")) {
    $cli->CreateAccount(accountName => "pbx\@$domain");
}
my $rights = $cli->GetAccountRights("pbx\@$domain");
my @found = grep {$_ eq "UserAccounts"} @$rights;
unless (scalar @found) {
    push @$rights, "UserAccounts";
    $cli->SetAccountRights("pbx\@$domain", $rights);
}
$cli->Logout();
