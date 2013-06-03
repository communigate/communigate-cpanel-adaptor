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

my $domainExists = $cli->GetDomainSettings('central.telnum');
unless ($domainExists) {
    my $router = 'localhost =            ; domain record to accept \'localhost\' as the main domain\emailhost  =            ; domain record to accept \'mailhost\'  as the main domain\e<blacklist-admin*@blacklisted> = postmaster      ; \'White Hole\'\e<syshelp@*>          = support@communigate.com   ; tech.support address\e<*feedback@*>        = *feedback@communigate.com ; tech.support address\e\eS:<+(7-20d)@*>  = *@central.telnum\etelnum  =  pstn\eA:<+*@pstn> = null\e\eS:<service--*@*> = service{*}#pbx\eS:<\\\**@*> = service{*}#pbx\e\e; Signal:<911@*>       = emergency@localhost     ; 911: NA emergency\e; Signal:<112@*>       = emergency@localhost     ; 112: EU emergency\e; Signal:<01@*>        = emergency@localhost     ; 01:  RU emergency\e; Signal:<emergency>   = emergency#pbx           ; start \'emergency\' app\e; Signal:<\\\*(3-4d)@*>  = voicemail#*             ; *nnn -> voicemail\e; Signal:<7(2d)@*>     = pbx{*}#pbx              ; 7nn calls go to PBX\e; Signal:<8(3d)@*>     = pickup{*}#pbx           ; 8nnn: pickup nnnn\e; Access:<8(3d)@*>     = *                       ; for picked-up transfers\e\e';
    my $domains = $cli->ListDomains;
    for my $domain (@$domains) {
	$router .= "; -- dialing plan for $domain\\eA:S:<+*\@$domain> = *\@central.telnum\\eA:S:<(7+d)\@$domain> = *\@central.telnum\\e; -- end of dialing plan for $domain\\e\\e";
    }
    $cli->CreateDomain('central.telnum');
    $cli->SetRouterTable($router);
}
