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

Whostmgr::HTMLInterface::defheader( "CGPro Domain and Accounts Settings for " . $FORM{domain},'', '/cgi/addon_cgp_da_settings_domain_per_domain.cgi' );

my $defaultServerAccountPrefs = $cli->GetServerAccountPrefs();
my $serverAccountDefaults = $cli->GetServerAccountDefaults();

if ($FORM{'thedomain'}) {
	$FORM{'ClientIPs'} =~  s/(\r?\n)+/\\e/g;	
	$cli->UpdateDomainSettings(
	    domain => $FORM{'thedomain'},
	    settings => {
    		MailToUnknown => $FORM{'MailToUnknown'},
    		MailRerouteAddress => $FORM{'MailRerouteAddress'},
    		MailToAllAction => $FORM{'MailToAllAction'},
    		AllWithForwarders => $FORM{'AllWithForwarders'},
    		ForceSMTPAUTH => $FORM{'ForceSMTPAUTH'},
    		AccountsLimit => $FORM{'AccountsLimit'},
    		ListsLimit => $FORM{'ListsLimit'},
    		ClientIPs => $FORM{'ClientIPs'},
    		CallOutTelnumSelector => $FORM{'CallOutTelnumSelector'},
    	    }
	);
	$cli->UpdateAccountPrefs(
	    'pbx@' . $FORM{'thedomain'},
	    {Billing => $FORM{'Billing'}}
	);
	my $workdays = [map { $FORM{$_} } grep { /^WorkDays\-?/ }  sort keys %FORM];
	$cli->UpdateAccountDefaultPrefs(
	    domain => $FORM{'thedomain'},
 	    settings => {
		AllowMultipleIdentities => $FORM{'AllowMultipleIdentities'},
		ITLCMakeCall => $FORM{'ITLCMakeCall'},
		IVRLanguage => $FORM{'IVRLanguage'},
		TimeZone => $FORM{'TimeZone'},
		IPWatch => $FORM{'IPWatch'},
		UseCookie => $FORM{'UseCookie'},
		SentBox => ($FORM{'SentBox'} eq $defaultServerAccountPrefs->{SentBox} ? 'default' : $FORM{'SentBox'}),
		NotesBox => ($FORM{'NotesBox'} eq $defaultServerAccountPrefs->{NotesBox} ? 'default' : $FORM{'NotesBox'}),
		CalendarBox => ($FORM{'CalendarBox'} eq $defaultServerAccountPrefs->{CalendarBox} ? 'default' : $FORM{'CalendarBox'}),
		HistoryBox => ($FORM{'HistoryBox'} eq $defaultServerAccountPrefs->{HistoryBox} ? 'default' : $FORM{'HistoryBox'}),
		DraftsBox => ($FORM{'DraftsBox'} eq $defaultServerAccountPrefs->{DraftsBox} ? 'default' : $FORM{'DraftsBox'}),
		ContactsBox => ($FORM{'ContactsBox'} eq $defaultServerAccountPrefs->{ContactsBox} ? 'default' : $FORM{'ContactsBox'}),
		TasksBox => ($FORM{'TasksBox'} eq $defaultServerAccountPrefs->{TasksBox} ? 'default' : $FORM{'TasksBox'}),
		CalendarTimePeriod => $FORM{'CalendarTimePeriod'},
		WorkDayStart => $FORM{'WorkDayStart'},
		WorkDayEnd => $FORM{'WorkDayEnd'},
		WeekStart => $FORM{'WeekStart'},
		WorkDays => (join(",",@$workdays) eq join(",",@{$defaultServerAccountPrefs->{WorkDays}}) ? 'default' : $workdays),
		CalendarDays => $FORM{'CalendarDays'},
		CalendarTime => $FORM{'CalendarTime'},
		CalendarTimeSlice => $FORM{'CalendarTimeSlice'},
		CalendarByDay => $FORM{'CalendarByDay'},
		PublishFreeBusy => $FORM{'PublishFreeBusy'},
		TasksDays => $FORM{'TasksDays'},
		TasksToDisplay => $FORM{'TasksToDisplay'},
		TasksDisplayCompleted => $FORM{'TasksDisplayCompleted'},
		CallOutPrivacy => $FORM{'CallOutPrivacy'},
		HoldMusic => $FORM{'HoldMusic'},
		DeleteMode => $FORM{'DeleteMode'},
		TrashBox => ($FORM{'TrashBox'} eq $defaultServerAccountPrefs->{TrashBox} ? 'default' : $FORM{'TrashBox'}),
		EmptyTrash => $FORM{'EmptyTrash'},
		EmptyJunk => $FORM{'EmptyJunk'},
		JunkBox => ($FORM{'JunkBox'} eq $defaultServerAccountPrefs->{JunkBox} ? 'default' : $FORM{'JunkBox'}),
	    }
	);
    }
    
my $domainDefaults = $cli->GetDomainSettings($FORM{'domain'});
my $serverDomainDefaults = $cli->GetDomainDefaults();
my $accountPrefs = $cli->GetAccountPrefs('pbx@' . $FORM{'domain'});
my $accountDefaultPrefs = $cli->GetAccountDefaultPrefs($FORM{'domain'});
my $accountDefaults = $cli->GetAccountDefaults($FORM{'domain'});

Cpanel::Template::process_template(
				   'whostmgr',
				   {
				    'template_file' => 'addon_cgpro_da_settings.tmpl',
				    domainDefaults => $domainDefaults,
				    serverDomainDefaults => $serverDomainDefaults,
				    cgproversion => $cgproversion,
				    accountPrefs => $accountPrefs,
				    accountDefaultPrefs => $accountDefaultPrefs,
				    serverAccountPrefs => $accountDefaultPrefs,
				    serverAccountDefaults => $accountDefaults,
				    globalServerAccountDefaults => $serverAccountDefaults,
				    defaultServerAccountPrefs => $defaultServerAccountPrefs,
				    domain => $FORM{'domain'}
				   },
				  );

$cli->Logout();
1;
