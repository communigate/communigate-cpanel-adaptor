#!/bin/sh
 eval 'if [ -x /usr/local/cpanel/3rdparty/bin/perl ]; then exec /usr/local/cpanel/3rdparty/bin/perl -x -- $0 ${1+"$@"}; else exec /usr/bin/perl -x $0 ${1+"$@"}; fi;'
    if 0;
#!/usr/bin/perl
#WHMADDON:appname:CGPro <strong>Update Manager</strong>

use Cpanel::Form            ();
use Whostmgr::HTMLInterface ();
use Whostmgr::ACLS          ();
use Cpanel::API::Branding        ();
use LWP::UserAgent;

$VERSION = '3.0.2-1';

print "Content-type: text/html\r\n\r\n";

Whostmgr::HTMLInterface::defheader( "CGPro Update Manager",'', '/cgi/addon_cgpro_update_manager.cgi' );

my $ua = LWP::UserAgent->new;
$ua->timeout(10);

my $response = $ua->get('https://raw.github.com/webfacebg/communigate-cpanel-adaptor/master/LatestVersion');

if ($response->is_success) {
    my $newversion = $response->decoded_content;  # or whatever
    $newversion =~ s/Version:\s+(\S+)/$1/;
    chomp $newversion;
    $newversion =~ s/\s+//;
    if ($newversion eq $VERSION) {
	print "<p>Communigate Cpanel Adaptor is up to date (Version: $VERSION)</p>";
    } else {
	my %FORM = Cpanel::Form::parseform();
	if ($FORM{'upgrade'}) {
	    print "<h2>Downloading files</h2>";
	    print "<pre>\n";
	    $response = $ua->get("https://github.com/webfacebg/communigate-cpanel-adaptor/archive/v$newversion.tar.gz", ':content_file' => "/usr/src/CommuniGate-cPanel-adaptor-$newversion.tar.gz");
	    if ($response->is_success) {
		print "Download successful. '/usr/src/CommuniGate-cPanel-adaptor-$newversion.tar.gz' \n";
		if ( -d '/usr/src/communigate-cpanel-adaptor' ) {
		    system("rm -rf /usr/src/communigate-cpanel-adaptor");
		}
		print "Extracting files...\n";
		system ("cd /usr/src ; tar -xzf  /usr/src/CommuniGate-cPanel-adaptor-$newversion.tar.gz; cd communigate-cpanel-adaptor-$newversion; /bin/bash ./upgrade.sh");
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
