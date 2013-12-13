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
		history.go(-2);
	</script>
	";
	print end_html();
	exit(0);
}
$ENV{'REMOTE_ADDR'} =~ /\[(.*)\]/;
my $userIP=$1;
$CGPSessionID=$cli->CreateWebUserSession($account,$userIP,0,"XChange");
$myurl=$cgpurl."Session\/$CGPSessionID\/frameset.wssp";
my $domain = $cli->MainDomainName();
my $uuid = (join "-", map{ join "", map { unpack "H*", chr(rand(256)) } 1..$_} (4,2,2,2,6)) . "@" . $domain;
my $itl =  $account . ":" . $uuid;
my $cookie = `echo $itl | base64 -w 0`;
$cookie = substr($cookie, 0 ,length($cookie) - 4);

my $prefs = $cli->GetAccountPrefs($account);
my ($sec,$min,$hour,$mday,$mon,$year,undef,undef,undef) = localtime(time);
$prefs->{'WebAuthCookie'}->{$uuid} = {
    'LastCheck' => "#TTT$mday-" . ($mon + 1 ). "-" . (1900 + $year) . "_$hour:$min:$sec",
    'Apps' => {
	webmail => $CGPSessionID
    },
	    'IP' => "#I[$userIP]"
};
$cli->UpdateAccountPrefs($account, {"WebAuthCookie" => $prefs->{'WebAuthCookie'}});
$cli->Logout();

my $cookie = cookie(-name=>'ITLA', -value=>$cookie);
print header(-cookie=>$cookie);
print start_html("Welcome");
print "
<script type=\"text/javascript\">
 document.location.href = \"/\";
</script>
";
print end_html();

