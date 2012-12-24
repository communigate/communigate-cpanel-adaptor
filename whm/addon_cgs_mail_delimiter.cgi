#!/usr/bin/perl
#WHMADDON:appname:CGPro Mail delimiter

use lib '/usr/local/cpanel';
use Cpanel::Form            ();
use Whostmgr::HTMLInterface ();
use Whostmgr::ACLS          ();
use CLI;

print "Content-type: text/html\r\n\r\n";

Whostmgr::ACLS::init_acls();
if ( !Whostmgr::ACLS::hasroot() ) {
  print "You need to be root to see the hello world example.\n";
  exit();
}

my $CGServerAddress = '91.230.195.210';
my $PostmasterLogin = 'postmaster';
my $PostmasterPassword = postmaster_pass();

my $cli = new CGP::CLI({
			PeerAddr => $CGServerAddress,
			PeerPort => 106,
			login => $PostmasterLogin,
			password => $PostmasterPassword
		       });
unless($cli) {
  print STDERR "Can't login to CGPro: ".$CGP::ERR_STRING,"\n";
   exit(0);
}


my %FORM = Cpanel::Form::parseform();

Whostmgr::HTMLInterface::defheader( "CGPro Mail Delimiter",'', '/cgi/addon_mail_delimiter.cgi' );

if ($FORM{'limit-MailOutFlow'} && $FORM{'period-MailOutFlow'}) {
  $cli->UpdateServerAccountDefaults({MailOutFlow => [$FORM{'limit-MailOutFlow'}, $FORM{'period-MailOutFlow'}]});
}

my $defaults = $cli->GetServerAccountDefaults();
my $mailOutFlowLimit =  $defaults->{MailOutFlow}->[0];
my $mailOutFlowPeriod =  $defaults->{MailOutFlow}->[1];

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


print <<EOF;
	  <form action="" method="post">
	    <table class="datatable brick" cellspacing="0" cellpadding="5" width="100%" border="0" align="center">
	      <tbody>
		<tr>
		  <td nowrap="nowrap" align="RIGHT">Outgoing Mail Limit per Account (defaults):</td>
		  <td nowrap="nowrap">
		    <select name="limit-MailOutFlow" class="popup">
EOF
print '<option ' . (($mailOutFlowLimit == -1)?'selected="selected"':"") . ' value="-1">unlimited</option>';
print '<option ' . (($mailOutFlowLimit == 0)?'selected="selected"':"") . ' value="0">0</option>';
print '<option ' . (($mailOutFlowLimit == 1)?'selected="selected"':"") . ' value="1">1</option>';
print '<option ' . (($mailOutFlowLimit == 3)?'selected="selected"':"") . ' value="3">3</option>';
print '<option ' . (($mailOutFlowLimit == 5)?'selected="selected"':"") . ' value="5">5</option>';
print '<option ' . (($mailOutFlowLimit == 10)?'selected="selected"':"") . ' value="10">10</option>';
print '<option ' . (($mailOutFlowLimit == 15)?'selected="selected"':"") . ' value="15">15</option>';
print '<option ' . (($mailOutFlowLimit == 20)?'selected="selected"':"") . ' value="20">20</option>';
print '<option ' . (($mailOutFlowLimit == 30)?'selected="selected"':"") . ' value="30">30</option>';
print '<option ' . (($mailOutFlowLimit == 100)?'selected="selected"':"") . ' value="100">100</option>';
print '<option ' . (($mailOutFlowLimit == 300)?'selected="selected"':"") . ' value="300">300</option>';
print '<option ' . (($mailOutFlowLimit == 1000)?'selected="selected"':"") . ' value="1000">1000</option>';
print '<option ' . (($mailOutFlowLimit == 3000)?'selected="selected"':"") . ' value="3000">3000</option>';
print '<option ' . (($mailOutFlowLimit == 10000)?'selected="selected"':"") . ' value="10000">10000</option>';
print '<option ' . (($mailOutFlowLimit == 30000)?'selected="selected"':"") . ' value="30000">30000</option>';
print '<option ' . (($mailOutFlowLimit == 100000)?'selected="selected"':"") . ' value="100000">100000</option>';
print '<option ' . (($mailOutFlowLimit == 300000)?'selected="selected"':"") . ' value="300000">300000</option>';
print '<option ' . (($mailOutFlowLimit == 1000000)?'selected="selected"':"") . ' value="1000000">1000000</option>';
print <<EOF;
		    </select>
		    in
		    <select name="period-MailOutFlow" class="popup">
EOF
print '<option ' . (($mailOutFlowPeriod eq '1s')?'selected="selected"':"") . ' value="1s">1 sec</option>';
print '<option ' . (($mailOutFlowPeriod eq '3s')?'selected="selected"':"") . ' value="3s">3 sec</option>';
print '<option ' . (($mailOutFlowPeriod eq '5s')?'selected="selected"':"") . ' value="5s">5 sec</option>';
print '<option ' . (($mailOutFlowPeriod eq '10s')?'selected="selected"':"") . ' value="10s">10 sec</option>';
print '<option ' . (($mailOutFlowPeriod eq '15s')?'selected="selected"':"") . ' value="15s">15 sec</option>';
print '<option ' . (($mailOutFlowPeriod eq '20s')?'selected="selected"':"") . ' value="20s">20 sec</option>';
print '<option ' . (($mailOutFlowPeriod eq '30s')?'selected="selected"':"") . ' value="30s">30 sec</option>';
print '<option ' . (($mailOutFlowPeriod eq '60s')?'selected="selected"':"") . ' value="60s">60 sec</option>';
print '<option ' . (($mailOutFlowPeriod eq '2m')?'selected="selected"':"") . ' value="2m">2 min</option>';
print '<option ' . (($mailOutFlowPeriod eq '3m')?'selected="selected"':"") . ' value="3m">3 min</option>';
print '<option ' . (($mailOutFlowPeriod eq '5m')?'selected="selected"':"") . ' value="5m">5 min</option>';
print '<option ' . (($mailOutFlowPeriod eq '10m')?'selected="selected"':"") . ' value="10m">10 min</option>';
print '<option ' . (($mailOutFlowPeriod eq '15m')?'selected="selected"':"") . ' value="15m">15 min</option>';
print '<option ' . (($mailOutFlowPeriod eq '20m')?'selected="selected"':"") . ' value="20m">20 min</option>';
print '<option ' . (($mailOutFlowPeriod eq '30m')?'selected="selected"':"") . ' value="30m">30 min</option>';
print '<option ' . (($mailOutFlowPeriod eq '1h')?'selected="selected"':"") . ' value="1h">60 min</option>';
print '<option ' . (($mailOutFlowPeriod eq '2h')?'selected="selected"':"") . ' value="2h">2 hour(s)</option>';
print '<option ' . (($mailOutFlowPeriod eq '3h')?'selected="selected"':"") . ' value="3h">3 hour(s)</option>';
print '<option ' . (($mailOutFlowPeriod eq '6h')?'selected="selected"':"") . ' value="6h">6 hour(s)</option>';
print '<option ' . (($mailOutFlowPeriod eq '12h')?'selected="selected"':"") . ' value="12h">12 hour(s)</option>';
print '<option ' . (($mailOutFlowPeriod eq '1d')?'selected="selected"':"") . ' value="1d">24 hour(s)</option>';
print '<option ' . (($mailOutFlowPeriod eq '2d')?'selected="selected"':"") . ' value="2d">2 day(s)</option>';
print '<option ' . (($mailOutFlowPeriod eq '3d')?'selected="selected"':"") . ' value="3d">3 day(s)</option>';
print '<option ' . (($mailOutFlowPeriod eq '7d')?'selected="selected"':"") . ' value="7d">7 day(s)</option>';
print '<option ' . (($mailOutFlowPeriod eq '14d')?'selected="selected"':"") . ' value="14d">2 week(s)</option>';
print '<option ' . (($mailOutFlowPeriod eq '21d')?'selected="selected"':"") . ' value="21d">3 week(s)</option>';
print '<option ' . (($mailOutFlowPeriod eq '28d')?'selected="selected"':"") . ' value="28d">4 week(s)</option>';
print <<EOF;
		    </select>
		  </td>
		</tr>
	      </tbody>
	    </table>

	    <p>
	      <input type="submit" value="Save" class="input-button" />
	    </p>
	  </form>
EOF

1;
