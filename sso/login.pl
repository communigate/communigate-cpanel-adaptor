#!/usr/bin/perl


# (c) 2011 CommuniGate Systems

BEGIN
{
 use FindBin qw($Bin);
 use lib "$Bin";
 use lib '/usr/local/cpanel';
}#This is for web server so it could find CLI.pm from the current directory

use CLI;
use CGI qw(:standard);
use LWP::UserAgent;
use HTTP::Request::Common;
use URI::Escape;
use Cpanel::CachedDataStore;

use Data::Dumper;

my $account = param("user");
my $password = param("pass");
my $cgpurl= param("cgpurl");
my $domain= param("domain");
if ($domain) {
	$account=$account."@".$domain;
}


my $conf = Cpanel::CachedDataStore::fetch_ref( '/var/cpanel/communigate.yaml' ) || {};
my $cli = new CGP::CLI( { PeerAddr => $conf->{cgprohost},
                            PeerPort => $conf->{cgproport},
                            login => $conf->{cgprouser},
                            password => $conf->{cgpropass} } );
  unless($cli) {
   print header;
   print "Can't login to CGPro: ".$CGP::ERR_STRING,"\n";
   exit(0);
}

my $passwdok = $cli->VerifyAccountPassword($account,$password);
if (!$passwdok) {
	print header;
	print start_html("Invalid Username Password\n");
	print "
	<script type=\"text/javascript\">
		history.go(-1);
	</script>
	";
	print end_html();
	exit(0);
}
$ENV{'REMOTE_ADDR'} =~ /\[(.*)\]/;
my $userIP=$1;
$CGPSessionID=$cli->CreateWebUserSession($account,$userIP,0,"XChange");
$myurl=$cgpurl."Session\/$CGPSessionID\/frameset.wssp";
$cli->Logout();

print header;
print start_html("Welcome");
print "
<script type=\"text/javascript\">
 document.location.href = \"$myurl\";
</script>
";

print end_html();

