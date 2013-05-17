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

my $settings = $cli->GetServerSettings();
my $found = 0;
for my $setting (@{$settings->{ExternalFilters}}) {
    $found = 1 if $setting->{Name} eq 'DKIM_sign';
}
unless ($found) {
    push @{$settings->{ExternalFilters}}, {
	Enabled => 'YES',
	LogLevel =>  2,
	Name => 'DKIM_sign',
	ProgramName => "/usr/bin/perl helper_DKIM_sign.pl",
	RestartPause => '5m',
	Timeout => '10s'
    }; 
    $cli->UpdateServerSettings($settings);
}
my $rules = $cli->GetServerMailRules();
my $rfound = 0;
for my $rule (@$rules) {
    $rfound = 1 if $rule->[1] eq 'DKIM_sign';
}
unless ($rfound) {
    push @$rules, [
	5,
	'DKIM_sign',
	[
	 ['Source', 'in', "trusted,authenticated"],
	 ["Header Field", "is not", "DKIM-Signature:*"]
	],
	[['ExternalFilter', 'DKIM_sign']]
    ];
    $cli->SetServerMailRules($rules)
}
