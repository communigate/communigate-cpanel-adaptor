#!/bin/sh                                                                                                                                                                                               
 eval 'if [ -x /usr/local/cpanel/3rdparty/bin/perl ]; then exec /usr/local/cpanel/3rdparty/bin/perl -x -- $0 ${1+"$@"}; else exec /usr/bin/perl -x $0 ${1+"$@"}; fi;'
    if 0;
#!/usr/bin/perl
#WHMADDON:appname:CGPro <strong>Domain and Accounts Settings</strong>

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

Whostmgr::HTMLInterface::defheader( "CGPro Domain and Accounts Settings",'', '/cgi/addon_cgp_da_settings.cgi' );

if ($FORM{'MailToUnknown'} && $FORM{'MailRerouteAddress'}) {
  $cli->UpdateDomainDefaults({
			      MailToUnknown => $FORM{'MailToUnknown'},
			      MailRerouteAddress => $FORM{'MailRerouteAddress'},
			      MailToAllAction => $FORM{'MailToAllAction'},
			      AllWithForwarders => $FORM{'AllWithForwarders'},
			      ForceSMTPAUTH => $FORM{'ForceSMTPAUTH'},
			      AccountsLimit => $FORM{'AccountsLimit'},
			      ListsLimit => $FORM{'ListsLimit'},
			     });
  $cli->UpdateServerAccountDefaults({
				     PWDAllowed => $FORM{'PWDAllowed'},
				     PasswordEncryption => $FORM{'PasswordEncryption'},
				     MailToAll => $FORM{'MailToAll'},
				    });
  $FORM{'mx_presets'} =~  s/(\r?\n)+/\\e/g;
  $cli->UpdateServerAccountPrefs({
				  IVRLanguage => $FORM{'IVRLanguage'},
				  TimeZone => $FORM{'TimeZone'},
				  IPWatch => $FORM{'IPWatch'},
				  UseCookie => $FORM{'UseCookie'},
				  SentBox => $FORM{'SentBox'},
				  NotesBox => $FORM{'NotesBox'},
				  CalendarBox => $FORM{'CalendarBox'},
				  HistoryBox => $FORM{'HistoryBox'},
				  DraftsBox => $FORM{'DraftsBox'},
				  ContactsBox => $FORM{'ContactsBox'},
				  TasksBox => $FORM{'TasksBox'},
				  CalendarTimePeriod => $FORM{'CalendarTimePeriod'},
				  WorkDayStart => $FORM{'WorkDayStart'},
				  WorkDayEnd => $FORM{'WorkDayEnd'},
				  WeekStart => $FORM{'WeekStart'},
				  WorkDays => [map { $FORM{$_} } grep { /^WorkDays\-?/ }  sort keys %FORM],
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
				  TrashBox => $FORM{'TrashBox'},
				  EmptyTrash => $FORM{'EmptyTrash'},
				  EmptyJunk => $FORM{'EmptyJunk'},
				  JunkBox => $FORM{'JunkBox'},
				  MxPresets => $FORM{'mx_presets'}
				 });
}

my $domainDefaults = $cli->GetDomainDefaults();
my $serverAccountDefaults = $cli->GetServerAccountDefaults();
my $serverAccountPrefs = $cli->GetServerAccountPrefs();

Cpanel::Template::process_template(
				   'whostmgr',
				   {
				    'template_file' => 'addon_cgpro_da_settings.tmpl',
				    domainDefaults => $domainDefaults,
				    cgproversion => $cgproversion,
				    serverAccountDefaults => $serverAccountDefaults,
				    serverAccountPrefs => $serverAccountPrefs,
				   },
				  );

$cli->Logout();
1;
