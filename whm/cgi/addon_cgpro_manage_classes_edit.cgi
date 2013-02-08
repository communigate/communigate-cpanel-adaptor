#!/usr/bin/perl

use lib '/usr/local/cpanel';
use Cpanel::Form            ();
use Whostmgr::HTMLInterface ();
use Whostmgr::ACLS          ();
use CLI;
use Cpanel::API::Branding        ();
use Cpanel::CachedDataStore;


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

my $defaults = $cli->GetServerAccountDefaults();

if ($FORM{'classname'}) {
    my $AccessModes;
    if ($FORM{'AccessModes'}) {
	if ($FORM{'AccessModes-25'}) {
	    $AccessModes = 'All';
	} else {
	    $AccessModes = [];
	    $AccessModes->[0] = 27;
	    $AccessModes->[1] = $FORM{'AccessModes'};
	    for (my $id = 0; $id < 26; $id++ ) {
		last unless $FORM{'AccessModes-' . $id};
		push @$AccessModes, $FORM{'AccessModes-' . $id};
	    }
	}
    } else {
	$AccessModes = 'None';
    }

    delete $defaults->{ServiceClasses}->{$FORM{'oldclassname'}} if $FORM{'oldclassname'} && $FORM{'oldclassname'} ne $FORM{'classname'};
    $defaults->{ServiceClasses}->{$FORM{'classname'}}->{'AccessModes'} = $AccessModes;
    $cli->UpdateServerAccountDefaults({
	ServiceClasses => $defaults->{ServiceClasses}
				      });
    print "HTTP/1.1 303 See Other\r\nLocation: addon_cgpro_manage_classes.cgi\r\n\r\n";
} else {
    my $ServiceClasses = $defaults->{ServiceClasses};

    print "Content-type: text/html\r\n\r\n";
    Whostmgr::HTMLInterface::defheader( "CGPro Manage Classes",'', '/cgi/addon_cgpro_manage_classes_edit.cgi' );
    Cpanel::Template::process_template(
	'whostmgr',
	{
	    'template_file' => 'addon_cgpro_manage_classes_edit.tmpl',
	    ServiceClasses => $ServiceClasses,
	    FORM => \%FORM,
	    cgproversion => $cgproversion,
	},
	);
}
$cli->Logout();
1;
