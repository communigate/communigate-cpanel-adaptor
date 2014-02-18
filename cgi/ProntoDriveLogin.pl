#!/usr/bin/perl

use CLI;
use CGI;
use POSIX;
use Archive::Zip;
use IO::Scalar;
use lib "/var/CommuniGate/cgi/";
use DuoWeb;

my $q = CGI->new;

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
my $CLI = undef;
sub getCLI {
    if ($CLI && $CLI->{isConnected}) {
	return $CLI;
    } else {
	my $CGServerAddress = "127.0.0.1";
	my $PostmasterLogin = 'postmaster';
	my $PostmasterPassword = postmaster_pass();

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
	return $cli;
    }
}

if ($q->param("sig_response") && $q->param("username")) {
    my ($user, $domain) = split "@", $q->param("username");
    my $cli = getCLI();
    my $prefs = $cli->GetAccountDefaultPrefs($domain);
    if ($prefs->{'DUOSecurity'}->{'ikey'} && $prefs->{'DUOSecurity'}->{'enabled'} eq "YES" && $prefs->{'DUOSecurity'}->{'skey'} && $prefs->{'DUOSecurity'}->{'akey'} && $prefs->{'DUOSecurity'}->{'apihost'}) {
	my $verify = DuoWeb::verify_response($prefs->{'DUOSecurity'}->{'ikey'}, $prefs->{'DUOSecurity'}->{'skey'}, $prefs->{'DUOSecurity'}->{'akey'}, $q->param("sig_response"));
	if ($verify) {
	    redirect_url($q->param("username"));
	} else {
	    display_login(2);
	}
    } else {
	display_login(2);
    }
    $cli->Logout();
}elsif ($q->param("username") && $q->param("password")) {
    my $username = $q->param("username");
    my $password = $q->param("password");
    $username =~ s/%40/@/;
    my $cli = getCLI();
    if ($cli->VerifyAccountPassword($username, $password)) {
	my ($user, $domain) = split "@", $username;
	my $prefs = $cli->GetAccountDefaultPrefs($domain);
	if ($prefs->{'DUOSecurity'}->{'ikey'} && $prefs->{'DUOSecurity'}->{'enabled'} eq "YES" && $prefs->{'DUOSecurity'}->{'skey'} && $prefs->{'DUOSecurity'}->{'akey'} && $prefs->{'DUOSecurity'}->{'apihost'}) {
	    my $request = DuoWeb::sign_request($prefs->{'DUOSecurity'}->{'ikey'}, $prefs->{'DUOSecurity'}->{'skey'}, $prefs->{'DUOSecurity'}->{'akey'}, $username);
	    display_2fa($username, $domain, $request, $prefs->{'DUOSecurity'}->{'apihost'});
	} else {
	    redirect_url($username);
	}
    } else {
	display_login(1);
    }
    $cli->Logout();
} else {
    display_login();
}

sub display_login {
    my ($error) = @_;
    print "Content-type: text/html\n\n";
    print_header();
    print <<EOF
	<form method="POST" action="">
EOF
;
    if ($error) {
	print "<p>Wrong username or password!</p>"
    }
    print <<EOF	
	  <fieldset>
	    <p class="text">
	      <label>Username:</label>
	      <input type="text" name="username" value="" class="text" />
	    </p>
	    <p class="text">
	      <label>Password:</label>
	      <input type="password" name="password" value="" class="text" />
	    </p>
	    <p class="submit">
	      <input type="hidden" name="SessionSkin" value="ProntoDrive" />
	      <input type="submit" name="submit" value="Login" />
	    </p>
	  </fieldset>
	</form>
EOF
;
    print_footer();
}
sub display_2fa {
    (my $username, $domain, $request, $host) = @_;
    print "Content-type: text/html\n\n";
	print_header('<script type="text/javascript" src="/SkinFiles/' . $domain . '/ProntoDrive/duo-web-v1.bundled.min.js"></script>');
    print <<EOF
	      <script type="text/javascript">
    Duo.init({
    'host': '$host',
    'sig_request': '$request',
    'post_action': location.protocol + "//" + location.host + '/cgi-bin/ProntoDriveLogin.pl'
  });
	      </script>

	  <fieldset>
	    <form method="POST" id="duo_form">
	    <input type="hidden" name="username" value="$username" />
	    </form>
	    <p class="text">
	    <iframe id="duo_iframe" width="300" height="430" frameborder="0"></iframe>
	    </p>
	  </fieldset>
EOF
;
    print_footer();
}

sub print_header {
    my $string = shift;
print <<EOF
<!DOCTYPE html>
<html lang="en">
  <head>
    <title>Pronto!Drive</title>
    <meta charset="utf-8" />
    <link rel="icon" href="/SkinFiles/$domain/ProntoDrive/favicon.ico" />
    <!--[if IE]>
	<script language="javascript"  type="text/javascript" src="/SkinFiles/$domain/ProntoDrive/modernizr.js" ></script>
	<![endif]-->
    <link rel="stylesheet" href="/SkinFiles/$domain/ProntoDrive/screen.css" type="text/css" media="screen" />
    <meta name="HandheldFriendly" content="true"/>
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=2, user-scalable=yes"/>
    $string
  </head>
  <body>
    <div class="wrapper">
      <header>
	<h1>Pronto!Drive</h1>
      </header>
      <section class="login">
EOF
;
}

sub print_footer {
print <<EOF
      </section>
      <div class="push"></div>
    </div>
    <footer>
    </footer>
  </body>
</html>
EOF
;
}

sub redirect_url {
    my $username = shift;
    my $cli = getCLI();
    $ENV{'REMOTE_ADDR'} =~ s/[\[\]]//g;
    my $session_id = $cli->CreateWebUserSession($username, $ENV{'REMOTE_ADDR'}, undef, "ProntoDrive");
    print $q->redirect( -url => "/Session/$session_id/ProntoDrive.wcgp");
}
