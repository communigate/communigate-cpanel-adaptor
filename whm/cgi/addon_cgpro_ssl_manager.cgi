#!/bin/sh                                                                                                                                                                                               
 eval 'if [ -x /usr/local/cpanel/3rdparty/bin/perl ]; then exec /usr/local/cpanel/3rdparty/bin/perl -x -- $0 ${1+"$@"}; else exec /usr/bin/perl -x $0 ${1+"$@"}; fi;'
    if 0;
#!/usr/bin/perl
#WHMADDON:appname:CGPro <strong>SSL Manager</strong>

use Cpanel::Form            ();
use Whostmgr::HTMLInterface ();
use Whostmgr::ACLS          ();
use Cpanel::API::Branding        ();
use CLI;

$VERSION = '2.0';

print "Content-type: text/html\r\n\r\n";

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

Whostmgr::HTMLInterface::defheader( "CGPro SSL Manager",'', '/cgi/addon_cgpro_ssl_manager.cgi' );
my $hostname = `hostname`;
chomp $hostname;
my $settings;
if ($hostname) {
    $settings = $cli->GetDomainSettings($hostname);
}

my $MSG = update_ssl();

Cpanel::Template::process_template(
    'whostmgr',
    {
	'template_file' => 'addon_cgpro_ssl_manager.tmpl',
	hostname => $hostname,
	settings => $settings,
	MSG => $MSG,
	cgproversion => $cgproversion,
    },
    );

$cli->Logout();

sub update_ssl {
    my %FORM = Cpanel::Form::parseform();
    if ($FORM{'submit'}) {
      if ($FORM{'key'}) {
	my $newkey = "[" . cleanup_input($FORM{'key'}) . "]";
	    my $response = $cli->UpdateDomainSettings(domain => $hostname, settings => { 'PrivateSecureKey' => $newkey});
	    return "Error occured while importing key!" if $response != 1;
	}
      if ($FORM{'crt'}) {
	my $newcrt = "[" . cleanup_input($FORM{'crt'}) . "]";
	    my $response = $cli->UpdateDomainSettings(domain => $hostname, settings => { 'SecureCertificate' => $newcrt});
	    return "Error occured while importing certificate!" if $response != 1;
	}
      if ($FORM{'ca'}) {
	my $newkey = "[" . cleanup_input($FORM{'ca'}) . "]";
	    my $response = $cli->UpdateDomainSettings(domain => $hostname, settings => { 'CAChain' => $newkey});
	    return "Error occured while importing CA!" if $response != 1;
	}
      return "Update successfuly.";
    }
}

sub cleanup_input {
    my ($text) = @_;
    $text =~ s/\-+.*?\-+//sg;
    $text =~ s/(\n|\r)+//sg;
    $text =~ s/(\S{3})\=+(\S{3})/$1$2/sg;
    return $text;
}

1;
