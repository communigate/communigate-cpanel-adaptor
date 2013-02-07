#!/usr/bin/perl

use lib '/usr/local/cpanel';
use Cpanel::Form            ();
use Whostmgr::HTMLInterface ();
use Whostmgr::ACLS          ();
use CLI;
use Cpanel::API::Branding        ();
use Cpanel::CachedDataStore;

print "Content-type: text/html\r\n\r\n";

Whostmgr::ACLS::init_acls();
if ( !Whostmgr::ACLS::hasroot() ) {
  print "You need to be root to see this page.\n";
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

Whostmgr::HTMLInterface::defheader( "CGPro Mail Delimiter for " . $FORM{domain},'', '/cgi/addon_cgp_email_configuration.cgi' );

# Mail delimiter
my $defaults = $cli->GetAccountDefaults($FORM{domain});

my $mailOutFlowLimit;
my $mailOutFlowPeriod;
my $mailInpFlowLimit;
my $mailInpFlowPeriod;
my $maxMessageSize;
my $MaxMailOutSize;
if ($defaults && $defaults->{MailOutFlow}) {
    $mailOutFlowLimit = $defaults->{MailOutFlow}->[0];
    $mailOutFlowPeriod = $defaults->{MailOutFlow}->[1];
    $mailInpFlowLimit = $defaults->{MailInpFlow}->[0];
    $mailInpFlowPeriod = $defaults->{MailInpFlow}->[1];
    $maxMessageSize = $defaults->{MaxMessageSize};
    $MaxMailOutSize = $defaults->{MaxMailOutSize};
}
if ($FORM{'limit-MailOutFlow'} && $FORM{'period-MailOutFlow'}) {
    my $settings = {};
    if ($FORM{'MailOutFlow-default'} == 1) {
	$settings->{MailOutFlow} = undef;
	$mailOutFlowLimit = undef;
    } else {
	$settings->{MailOutFlow} = [$FORM{'limit-MailOutFlow'}, $FORM{'period-MailOutFlow'}];
	$mailOutFlowPeriod = $FORM{'period-MailOutFlow'};
	$mailOutFlowLimit = $FORM{'limit-MailOutFlow'};
    }
    if ($FORM{'MailInpFlow-default'} == 1) {
	$settings->{MailInpFlow} = undef;
	$mailInpFlowLimit = undef;
    } else {
	$settings->{MailInpFlow} = [$FORM{'limit-MailInpFlow'}, $FORM{'period-MailInpFlow'}];
	$mailInpFlowPeriod = $FORM{'period-MailInpFlow'};
	$mailInpFlowLimit = $FORM{'limit-MailInpFlow'};
    }
    if ($FORM{'maxMessageSize-default'} == 1) {
	$settings->{MaxMessageSize} = undef;
	$maxMessageSize = undef;
    } else {
	$settings->{MaxMessageSize} = $FORM{'maxMessageSize'};
	$maxMessageSize = $FORM{'maxMessageSize'};
    }
    if ($FORM{'MaxMailOutSize-default'} == 1) {
	$settings->{MaxMailOutSize} = undef;
	$MaxMailOutSize = undef;
    } else {
	$settings->{MaxMailOutSize} = $FORM{'MaxMailOutSize'};
	$MaxMailOutSize = $FORM{'MaxMailOutSize'};
    }
    $cli->UpdateAccountDefaults( domain => $FORM{'domain'}, settings => $settings );
}

Cpanel::Template::process_template(
				   'whostmgr',
				   {
				    'template_file' => 'addon_cgpro_email_configuration_delimiter_per_domain.tmpl',
				    defaults => $defaults,
				    mailOutFlowLimit => $mailOutFlowLimit,
				    mailOutFlowPeriod => $mailOutFlowPeriod,
				    mailInpFlowLimit => $mailInpFlowLimit,
				    mailInpFlowPeriod => $mailInpFlowPeriod,
				    maxMessageSize => $maxMessageSize,
				    MaxMailOutSize => $MaxMailOutSize,
				    domain => $FORM{domain},
				    cgproversion => $cgproversion
				   },
				  );

$cli->Logout();
1;
