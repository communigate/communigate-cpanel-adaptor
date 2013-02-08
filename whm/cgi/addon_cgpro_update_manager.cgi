#!/usr/bin/perl
#WHMADDON:appname:CGPro <strong>Update Manager</strong>

use lib '/usr/local/cpanel';
use Cpanel::Form            ();
use Whostmgr::HTMLInterface ();
use Whostmgr::ACLS          ();
use Cpanel::API::Branding        ();
use LWP::UserAgent;

$VERSION = '2.0';

print "Content-type: text/html\r\n\r\n";

Whostmgr::HTMLInterface::defheader( "CGPro Update Manager",'', '/cgi/addon_cgpro_update_manager.cgi' );

my $ua = LWP::UserAgent->new;
$ua->timeout(10);

my $response = $ua->get('http://communigate-cpanel-adaptor.googlecode.com/files/LatestVersion.txt');

if ($response->is_success) {
    use Data::Dumper;
    my $newversion = $response->decoded_content;  # or whatever
    $newversion =~ s/Version:\s+(\S+)/$1/;
    chomp $newversion;
    if ($newversion eq $VERSION) {
	print "<p>Communigate Cpanel Adaptor is up to date (Version: $VERSION)</p>";
    } else {
	my %FORM = Cpanel::Form::parseform();
	if ($FORM{'upgrade'}) {
	    print "<h2>Downloading files</h2>";
	    print "<pre>\n";
	    $response = $ua->get("http://communigate-cpanel-adaptor.googlecode.com/files/Communigate-Cpanel-adaptor-$newversion.tar.gz", ':content_file' => "/usr/src/Communigate-Cpanel-adaptor-$newversion.tar.gz");
	    if ($response->is_success) {
		print "Download successful. '/usr/src/Communigate-Cpanel-adaptor-$newversion.tar.gz' \n";
		if ( -d '/usr/src/communigate-cpanel-adaptor' ) {
		    system("rm -rf /usr/src/communigate-cpanel-adaptor");
		}
		print "Extracting files...\n";
		system ("cd /usr/src ; tar -xzf  /usr/src/Communigate-Cpanel-adaptor-$newversion.tar.gz; cd communigate-cpanel-adaptor; /bin/bash ./upgrade.sh");
	    } else {
		print "Error while downloading package: <em>" . $response->status_line . "</em>";
	    }
	    print "</pre>\n";
	} else {
	    print "<p>New version of CommuniGate cPanel adaptor is avaliable:<strong> $newversion</strong>. Your current Version is $VERSION</p>";
	    print '<form action="" method="post">';
	    print '<input type="submit" value="Upgrade Now!" name="upgrade" />';
	    print '</form>';
	}
    }
} else {
    print "<p>Cannot get version from server: <em>" . $response->status_line . "</em></p>";
}

1;
