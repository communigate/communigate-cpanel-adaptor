#!/bin/sh
 eval 'if [ -x /usr/local/cpanel/3rdparty/bin/perl ]; then exec /usr/local/cpanel/3rdparty/bin/perl -x -- $0 ${1+"$@"}; else exec /usr/bin/perl -x $0 ${1+"$@"}; fi;'
    if 0;
#!/usr/bin/perl
#WHMADDON:appname:CGPro <strong>Accounts Stats</strong>

use Cpanel::Form            ();
use Whostmgr::HTMLInterface ();
use Whostmgr::ACLS          ();
use CLI;
use Cpanel::CachedDataStore;

print "Content-type: text/html\r\n\r\n";

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
if ($FORM{'account'}) {
	Whostmgr::HTMLInterface::defheader( "CGPro Accounts Stats for account \"$FORM{'account'}\"",'', '/cgi/addon_cgpro_accounts_stats.cgi' );
	my $account_details = get_account_details($FORM{'account'});
	my $domains = [$account_details->{'DOMAIN'}, @{$account_details->{'DOMAINS'}}];
	# List accounts per domain
	my $allaccounts = {};
	foreach my $domain (@$domains) {
	    my $accounts = $cli->ListAccounts($domain);
	    foreach my $userName (sort keys %$accounts) {	
		my $accountData = $cli->GetAccountEffectiveSettings("$userName\@$domain");
		my $accountStats = $cli->GetAccountStat("$userName\@$domain");
		my $service = @$accountData{'ServiceClass'} || '';
		my $accountPrefs = $cli->GetAccountEffectivePrefs("$userName\@$domain");
		my $diskquota = @$accountData{'MaxAccountSize'} || '';
		$diskquota =~ s/M//g;
		my $_diskused = $cli->GetAccountInfo("$userName\@$domain","StorageUsed");
		my $diskused = $_diskused / 1024 /1024;
		my $diskusedpercent;
		if ($diskquota eq "unlimited") {
		    $diskusedpercent = 0;
		} else {
		    $diskusedpercent = $diskused / $diskquota * 100;
		}
		$allaccounts->{$domain}->{$userName . "@" . $domain} = {
		    domain => $domain,
		    username => $userName,
		    class => $service,
		    quota => $diskquota,
		    used => $diskused,
		    data => $accountData,
		    prefs => $accountPrefs,
		    usedpercent => $diskusedpercent,
		    stats => $accountStats,
		};
	    }	
	}
	Cpanel::Template::process_template(
	    'whostmgr',
	    {
		'template_file' => 'addon_cgpro_accounts_stats.tmpl',
		cgproversion => $cgproversion,
		FORM => \%FORM,
		details => $account_details,
		domains => $domains,
		accounts => $allaccounts
		},
	);
} else {
	Whostmgr::HTMLInterface::defheader( "CGPro Accounts Stats",'', '/cgi/addon_cgpro_accounts_stats.cgi' );
	Cpanel::Template::process_template(
	    'whostmgr',
	    {
		'template_file' => 'addon_cgpro_accounts_stats.tmpl',
		cgproversion => $cgproversion,
		FORM => \%FORM,
		},
	);
}


$cli->Logout();
1;


sub get_account_details {
    my ($user) = @_;
    if ( $Cpanel::FileLookup::REVERSE_FILELOOKUPCACHE{$Cpanel::ConfigFiles::TRUEUSERDOMAINS_FILE}{$user} ) {
        return $Cpanel::FileLookup::REVERSE_FILELOOKUPCACHE{$Cpanel::ConfigFiles::TRUEUSERDOMAINS_FILE}{$user};
    }
    return unless Cpanel::Config::LoadCpUserFile::has_cpuser_file($user);
    my $cpuser_ref = Cpanel::Config::LoadCpUserFile::loadcpuserfile($user);
    return $cpuser_ref;
}
