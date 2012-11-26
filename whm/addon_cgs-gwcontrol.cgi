#!/usr/bin/perl
#WHMADDON:communigatepro:CommuniGate Pro Groupware Accounts Control


use CLI;
use lib '/usr/local/cpanel/';
use Whostmgr::ACLS ();
use Whostmgr::HTMLInterface ();
Whostmgr::ACLS::init_acls();
use CGI qw(:standard);

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


if (!Whostmgr::ACLS::checkacl( 'all' ) ) {
	print "HTTP/1.0\r\nStatus: 200 OK\r\nContext-type: text/html\r\n\r\n";
	print "This plugin is available only at the platform owner level.";
	exit(0);
} 

my $CGServerAddress = $ENV{'HTTP_HOST'};
my $PostmasterLogin = 'postmaster';
my $PostmasterPassword = postmaster_pass();
my $limits_file = "/var/CommuniGate/cPanel/limits";
my $global_limits_file = "/var/CommuniGate/cPanel/boxlimit";
my %limits;
my $default_max_gw = 5;
my $requri=$ENV{'REQUEST_URI'};
my $form_domain=param("domain");
my $form_max=param("max");

sub read_limits {
open (MYFILE, "$limits_file"); # retrieve the tokens stored on file
while (<MYFILE>) {
	chomp;
	my @line = split(",",$_);
	$limits{@line[0]} = @line[1];
}
close (MYFILE);
}

sub read_global_limit {
 open (MYFILE3, "$global_limits_file") or return 0; # retrieve the tokens stored on file
 my @lines = <MYFILE3>;
 close (MYFILE3);
 return(@lines[0]);
}

sub total_requested {
my $total=0;
foreach $key (sort keys %limits) {
	$total += $limits{$key};
}
return $total;
}

sub write_limits {

# Check the maximum box limit if it exists, is not expired 
$boxlimit=read_global_limit;
if (($boxlimit) && (total_requested() >= $boxlimit) ) {
	return($boxlimit);
}

open (MYFILE, ">$limits_file"); # retrieve the tokens stored on file

foreach $key (sort keys %limits) {
     print MYFILE $key,",",$limits{$key},"\n";
}
close (MYFILE);
return(0);
}

# MAIN 

read_limits(); # Fills $limits hash
Whostmgr::HTMLInterface::defheader( '<br><br><br><H1>CommuniGate Groupware Accounts Control<H1>', '/images/communigate.gif', '/cgi/addon_cgs-gwcontrol.cgi' );
my $cli = new CGP::CLI( { PeerAddr => $CGServerAddress, PeerPort => 106, login => $PostmasterLogin, password => $PostmasterPassword } );
  unless($cli) {
   print STDERR "Can't login to CGPro: ".$CGP::ERR_STRING,"\n";
   exit(0);
}

if ($form_domain) { # Form submission
	read_limits;
	$limits{$form_domain} = $form_max; # set the value from the form
	$result = write_limits;
	if (!$result) {
		print "<BR><BR><b>&nbsp;&nbsp;Maximum number of Groupware accounts for domain : ",$form_domain,"is now set to : ", $form_max,"<BR><BR><BR></b>";
	} else {
		print "<BR><BR><b>&nbsp;&nbsp;Unable to set limit for domain : ",$form_domain,"to value: ", $form_max," Reason : Maximum of Groupware account exceeded for the server ($result)<BR><BR><BR></b>";
		read_limits;	
	}	
}

my $domains=$cli->ListDomains();
my $domain;
print "&nbsp;&nbsp;In this Panel you define the maximum number of Groupware account each domain is allowed to use. <BR>&nbsp;&nbsp;With the default license contract the maximum of free groupware accounts per domain is  $default_max_gw.<BR><BR><BR>";
print "<table style=\"width:60%\">";
foreach $domain (sort @$domains) {
      if (!$limits{$domain}) { $limits{$domain} = $default_max_gw; }  
      print "<TR><TD>&nbsp;&nbsp;</TD>";
      print "<form action=\"$requri\" method=\"post\"> <input type=\"hidden\" name=\"domain\" value=\"$domain\"><TD>$domain</TD>","<TD><input type=\"text\" name=\"max\" value=\"",$limits{$domain},"\" size=\"3\"></TD><TD><INPUT type=\"submit\" value=\"Set\"></TD> </form>";
     print "</TR>";
    }
print "</table>";
$cli->Logout();
