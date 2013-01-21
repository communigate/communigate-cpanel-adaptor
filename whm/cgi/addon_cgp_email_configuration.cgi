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

my $conf = Cpanel::CachedDataStore::fetch_ref( '/etc/cpanel_cgpro.conf' ) || {};
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
  $cli->UpdateServerAccountDefaults({MailOutFlow => [$FORM{'limit-MailOutFlow'}, $FORM{'period-MailOutFlow'}]});
}
my $defaults = $cli->GetServerAccountDefaults();
my $mailOutFlowLimit =  $defaults->{MailOutFlow}->[0];
my $mailOutFlowPeriod =  $defaults->{MailOutFlow}->[1];

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

sub postmaster_pass {
  my $file = "/var/CommuniGate/Accounts/postmaster.macnt/account.settings";
  my %hash;
  open (MYFILE, "$file");
  while (<MYFILE>) {
    chomp;
    my @line = split("=",$_);
    $hash{@line[0]} = @line[1];
  }
  if ($hash{' Password '} =~ /^ ".*";$/) {
    return  substr $hash{' Password '}, 2, length($hash{' Password '})-4;
  } else {
    return  substr $hash{' Password '}, 1, length($hash{' Password '})-2;
  }
}

Cpanel::Template::process_template(
				   'whostmgr',
				   {
				    'template_file' => 'addon_cgp_email_configuration.tmpl',
				    mailOutFlowLimit => $mailOutFlowLimit,
				    mailOutFlowPeriod => $mailOutFlowPeriod,
				    UseRBL => $defaultsNetwork->{UseRBL},
				    RBLDomain => $defaultsNetwork->{RBLDomain}
				   },
				  );

1;
