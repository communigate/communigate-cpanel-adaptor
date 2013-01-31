#!/usr/bin/perl
#WHMADDON:appname:CGPro Mail Configuration Manager

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


my %FORM = Cpanel::Form::parseform();

Whostmgr::HTMLInterface::defheader( "CGPro Mail Configuration Manager",'', '/cgi/addon_cgp_email_configuration.cgi' );

# Mail delimiter
if ($FORM{'limit-MailOutFlow'} && $FORM{'period-MailOutFlow'}) {
  $cli->UpdateServerAccountDefaults({
      MailOutFlow => [$FORM{'limit-MailOutFlow'}, $FORM{'period-MailOutFlow'}],
      MailInpFlow => [$FORM{'limit-MailInpFlow'}, $FORM{'period-MailInpFlow'}],
      MaxMessageSize => $FORM{'maxMessageSize'},
      MaxMailOutSize => $FORM{'MaxMailOutSize'},
				    });
}
my $defaults = $cli->GetServerAccountDefaults();
my $mailOutFlowLimit =  $defaults->{MailOutFlow}->[0];
my $mailOutFlowPeriod =  $defaults->{MailOutFlow}->[1];
my $mailInpFlowLimit =  $defaults->{MailInpFlow}->[0];
my $mailInpFlowPeriod =  $defaults->{MailInpFlow}->[1];
my $maxMessageSize =  $defaults->{MaxMessageSize};
my $MaxMailOutSize =  $defaults->{MaxMailOutSize};

# RBLs
my $defaultsNetwork = $cli->GetNetwork();
if ($FORM{'UseRBL'}) {
  if ($FORM{'RBLDomain'}) {
    $defaultsNetwork->{UseRBL} = $FORM{'UseRBL'} if $FORM{'UseRBL'} =~ m/^(YES|NO)$/;
    $FORM{'RBLDomain'} =~ s/\n+/\n/g;
    $FORM{'RBLDomain'} =~ s/(^\s+|\s+$|\r)//g;
    my @domains = split "\n+", $FORM{'RBLDomain'};
    $defaultsNetwork->{'RBLDomain'} =  \@domains;
  } else {
    $defaultsNetwork->{UseRBL} = 'NO';
    $defaultsNetwork->{RBLDomain} = [];
  }
  $cli->SetNetwork($defaultsNetwork);
}


Cpanel::Template::process_template(
				   'whostmgr',
				   {
				    'template_file' => 'addon_cgpro_email_configuration.tmpl',
				    mailOutFlowLimit => $mailOutFlowLimit,
				    mailOutFlowPeriod => $mailOutFlowPeriod,
				    mailInpFlowLimit => $mailInpFlowLimit,
				    mailInpFlowPeriod => $mailInpFlowPeriod,
				    maxMessageSize => $maxMessageSize,
				    MaxMailOutSize => $MaxMailOutSize,
				    UseRBL => $defaultsNetwork->{UseRBL},
				    RBLDomain => $defaultsNetwork->{RBLDomain}
				   },
				  );

$cli->Logout();
1;
