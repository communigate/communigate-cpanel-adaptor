#!/bin/sh                                                                                                                                                                                               
 eval 'if [ -x /usr/local/cpanel/3rdparty/bin/perl ]; then exec /usr/local/cpanel/3rdparty/bin/perl -x -- $0 ${1+"$@"}; else exec /usr/bin/perl -x $0 ${1+"$@"}; fi;'
    if 0;
#!/usr/bin/perl
#WHMADDON:communigatepro:CGPro <strong>Administration</strong>
# (c) 2011 CommuniGate Systems
use CLI;

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

print "HTTP/1.0\r\nStatus: 200 OK\r\nContext-type: text/html\r\n\r\n";

sub platform_owner {
    my $host = $ENV{'HTTP_HOST'};
    if ($conf->{cgprohost} !~ m/^(localhost|127\.0\.0)/) {
	$host = $conf->{cgprohost};
    }

 my $myurl="http://$host:8010";
 Whostmgr::HTMLInterface::defheader( '<br><br><br><H1>CommuniGate Pro cPanel Plugin<H1>', '/images/communigate.gif', '/cgi/addon_cgs.cgi' );
Cpanel::Template::process_template(
				   'whostmgr',
				   {
				    'template_file' => 'addon_cgpro_footer.tmpl',
				    cgproversion => $cgproversion,
				   },
				  );


print "<p class=\"description\"> This plugin installed CommuniGate Pro as mail system and proposes new features for end users (groupware, mobile synchronisation, presence and IM, etc.)<br>On the front end the plugin enables traditional cPanel account and reseller management methods and interface. The plugin uses hooks and cPanel APIs in the back to configure the CommuniGate instance. CommuniGate Theme should be chosen for the users.</p><br>";
 print "<ul>";
 print "<div id=\"doctitle\"><H2>Local Server Administration</h2></div>";
 print "<ul>";
 print "<LI><A HREF=\"$myurl\">Communigate Pro Web Administration Console</A></LI>";
 print "<LI><A HREF=\"$myurl/Master/Master/License.html?\">CommuniGate Pro License Administration page</A></LI>";
 print "<LI><A HREF=\"http://www.cpanel.communigate.com\">Request for a License</A></LI>";
 print "</ul>";

 print "<div id=\"doctitle\"><H2>CommuniGate Pro cPanel Plugin Documentation</h2></div>";
 print "<ul>";
 print "<li><a href=\"http://www.communigate.com/CommuniGatePro/History.html\" >Installation Guide</a></li>";
 print "<li><a href=\"http://www.communigate.com/CommuniGatePro/default.html#Current\">Administration Guide</a>&nbsp;</li>";
 print "</ul>";

 print "<div id=\"doctitle\"><H2>CommuniGate Pro Documentation</h2></div>";
 print "<ul>";
 print "<li><a href=\"$myurl/Guide//QuickStart.html\">Quick Start Guide</a></li>";
 print "<li><a href=\"$myurl/Guide//\">Documentation for this CommuniGate Pro version</a></li>";
 print "<li><a href=\"http://www.communigate.com/CommuniGatePro/\" >Documentation for the latest CommuniGate Pro version</a></li>";
 print "<li><a href=\"http://www.communigate.com/CommuniGatePro/History.html\" >The CommuniGate Pro Revision History</a></li>";
 print "<li><a href=\"http://www.communigate.com/CommuniGatePro/default.html#Current\">The latest versions of the CommuniGate Pro software</a>&nbsp;</li>";
 print "</ul>";
 
print "<div id=\"doctitle\"><H2>CommuniGate Pro Support</h2></div>";
 print "<ul>";
 print "<li><a href=\"http://support.communigate.com\">Support Center</a></li>";
 print "</ul>";

print "<div id=\"doctitle\"><H2>Contact CommuniGate Systems</h2></div>";
 print "<ul>";
 print "<li><a href=\"http://www.communigate.com/main/contacts.html\">Worldwide contacts</a></li>";
 print "</ul>";
 print "</ul>";

Cpanel::Template::process_template(
				   'whostmgr',
				   {
				    'template_file' => 'addon_cgpro_footer.tmpl',
				    cgproversion => $cgproversion,
				   },
				  );
}

sub reseller {
	print "This plugin is only available for the platform owner level.";
}



use lib '/usr/local/cpanel/';
use Whostmgr::ACLS ();
use Whostmgr::HTMLInterface ();
Whostmgr::ACLS::init_acls();
if (!Whostmgr::ACLS::checkacl( 'all' ) ) {
	reseller();
} else { 
 # Platform Owner
 platform_owner();
}	

exit(0);



