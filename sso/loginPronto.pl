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
# use URI::Escape;

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

my $CGServerAddress = "127.0.0.1";
my $PostmasterLogin = 'postmaster';
my $PostmasterPassword = postmaster_pass();

my $account = param("user");
my $password = param("pass");
my $cgpurl= param("cgpurl");
my $domain= param("domain");
if ($domain) {
	$account=$account."@".$domain;
}

my $cli = new CGP::CLI( { PeerAddr => $CGServerAddress,
                            PeerPort => '106',
                            login => $PostmasterLogin,
                            password => $PostmasterPassword } );
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
$myurl=$cgpurl."hPronto/?username=$account&sid=$CGPSessionID";
$cli->Logout();

print header();
print start_html("Welcome");
print "
<script type=\"text/javascript\">
 document.location.href = \"$myurl\";
</script>
";
print end_html();

