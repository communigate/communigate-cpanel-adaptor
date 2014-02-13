#!/usr/bin/perl -w

#  Migration script for CommuniGate Pro.
#
#  Abstract:
#
#  Sometimes you can't move users to CommuinGate Pro form your old
#  mail server because you don't know their passwords or because
#  the passwords are stored in encrypted form and can't be revealed
#  back to plain text. This script should solve this problem.

#  How it works:
#
#  The script is implemented as the External Authentication program.
#  When user attempts to login for the first time, or when CGPro receives
#  a message for account which doesn't yet exist, CGPro calls the external
#  authenticatin script. The script connects to the old server via SMTP
#  and checks if the account with such name exists there. If yes, the
#  script creates account with the same name in CGPro.
#  When user connects, he/she submits the name and the password in plain
#  text form. Since the account is explicitly configured to use external
#  authentication, the script is invoked. The script takes the name and
#  the password, connects to the old server via IMAP or POP (configurable),
#  checks if the submitted password is accepted, and if yes, it updates the
#  internal CommuniGate password for that account and disables the external
#  authentication; then it launches MoveIMAPMail/MovePOPMail program to move
#  user's mail form the old server into CGPro.

#  Notes:
#
#  1) You should redefine some values below such as source and the
#     destination server(s) IP addresses and passwords.
#  2) This script was written for Unix-type operating systems. For Windows
#     you'll have to fix pathnames, add ".exe" suffixes to program names,
#     and change $nullPath variable.
#  3) Launching multiple MovePOPMil/MoveIMAPMail processes may overload your
#     computer. So, if you have many users who can connect at the same time,
#     instead of migrating mail in real time just save the account names
#     and plain text passwords into a text file and later use that file with
#     MoveAccounts program (change the $savePasswords variable)
#

#  Original homepage:
#  <http://www.stalker.com/CGAUTH>
#
#  Related links:
#  <http://www.stalker.com/CommuniGatePro/Migration.html#ExtAuth>
#  <http://www.stalker.com/CommuniGatePro/Security.html#External>
#
#  Mail your comments and suggestions to <support@stalker.com>
#


# You should redefine these values for CGPro
#
my $CGProServerAddress =  '127.0.0.1';
my $CGProPostmasterLogin = 'postmaster';
my $CGProPostmasterPassword = 'cp@nel';
my $doDebug=0;

# You should redefine these values for the external POP/IMAP servers you migrate from

my %externalServers = (
    # 'domain1.com' => {
    #      IP => '11.22.33.44',
    #      extDomainName => '@external1.com',
    #      usePOP=>0,
    #      savePasswords=>0,
    #    },
    # 'domain2.com' => {
    #      IP => '22.33.44.55',
    #      savePasswords=>1,
    #    },
    # 'migrate.me' => {
    # 	usePOP => 0,
    # 	savePasswords => 0,
    # 	IP => "77.77.150.125"
    # },
    # 'default' => {
    # 	IP => '33.44.55.66',
    # 	savePasswords=>1,
    # }
    );

# In the above example, if a user logins as user@domain1.com, the script
# will connect to the external server at 11.22.33.44 as user@external1.com.
# The parameter extDomainName is optional, if present - the domain part of
# the login will be replaced.
# Change it to usePOP=1 if you migrate from a POP server.
# Change it to savePasswords=1 if you can't migrate mail in real time
# but want to save passwords into "passwords(domain1.com).txt" file
#


# change this to =0 if forking causes problems in your OS
my $useFork = 1;

# Either move these programs into CGPro Base directory,
# or specify their full paths
my $migrationProgPOP  = '/opt/CommuniGate/Migration/MovePOPMail';
my $migrationProgIMAP = '/opt/CommuniGate/Migration/MoveIMAPMail';
my $nullPath='/dev/null';

if($^O eq 'MSWin32') {  #use different names for Windows
  $nullPath='nul';
  $migrationProgPOP  = 'MovePOPMail.exe';
  $migrationProgIMAP = 'MoveIMAPMail.exe';
}

#
# END of user customiseable parameters
#

# The CLI.pm module can be downloaded from <http://www.stalker.com/CGPerl>

use strict;
use CLI;
use Fcntl;
$| = 1;     #force STDOUT autoflush after each write


# check if MovePOPMail/MoveIMAPMail are needed and can be launched
# foreach(keys %externalServers) {
#   my $domain=$_;
#   my ($usePOP,$savePasswords)=(0,0);
#   $savePasswords=$externalServers{$domain}{savePasswords} if(exists $externalServers{$domain}{savePasswords});
#   unless($savePasswords) {
#    $usePOP=$externalServers{$domain}{usePOP} if(exists $externalServers{$domain}{usePOP});
#    if($usePOP) {
#      die "Unable to execute $migrationProgPOP.\n" unless(-x $migrationProgPOP);
#    } else {
#      die "Unable to execute $migrationProgIMAP.\n" unless(-x $migrationProgIMAP);
#    }
#  }
# }



$SIG{CHLD}='IGNORE' if($useFork);

print "* authMigrate.pl v2.3 started\n";
while(<STDIN>) {
  chomp;
  next if($_ eq '');
  my ($prefix,$command,$arg1,$arg2,$arg3) = split(/ /);

  if($command eq 'INTF') {
    print "$prefix INTF 3\n";
  } elsif($command eq 'QUIT') {
    print "$prefix OK\n";
    last;
  } elsif($command eq 'NEW') {
    if($useFork) {  # process async
      unless(my $pid = fork) {
        die "cannot fork: $!" unless defined $pid;
        processNEW($prefix,$arg1);
        exit;
      }
    } else {        # process synchroneously
      processNEW($prefix,$arg1);
    }

  } elsif($command eq 'VRFY') {
    my ($name,$password);
    if($arg1 =~ /^\(.*\)$/) {
      $name=$arg2; $password=$arg3;
    } else {
      $name=$arg1; $password=$arg2;
    }

    unless($name && $password) {
      print "$prefix ERROR Expected: nnn VRFY user\@domain password\n";

    } else {

      if($useFork) {  # process async
        unless(my $pid = fork) {
          die "cannot fork: $!" unless defined $pid;
          processVRFY($prefix,$name,$password);
          exit;
        }
      } else {        # process synchroneously
        processVRFY($prefix,$name,$password);
      }

    }
  } elsif($command =~ /^SASL/) {
    print "$prefix ERROR only clear text logins allowed\n";

  } else {
    print "$prefix ERROR unexpected command: $command\n";

  }
}
print "* authMigrate.pl stopped\n";
exit(0);

sub debug {
  my $str=$_[0];
  $str=~s/\r/<CR>/g;
  $str=~s/\n/<LF>/g;
  return unless($doDebug);
  print "* ".$str."\n";
}

#------------- processNEW -----------------

sub checkUserSMTP {
  my ($name,$ExtServerAddress,$ExtServerDomain)=@_;
  my $responseLine;

  debug("Connecting via SMTP to $ExtServerAddress");

  my $smtp = new IO::Socket::INET(PeerAddr => $ExtServerAddress,
                                  PeerPort => 25
                                 )
     || return "*** Can't connect to External Server via SMTP.";

  $smtp->autoflush(1);
  do {
    $responseLine = <$smtp>;
    debug("SMTP $ExtServerAddress answer: ".$responseLine);
  }until($responseLine =~/^(\d\d\d) /);
  return $responseLine unless($1 eq '220');

  print $smtp "HELO $CGProServerAddress\015\012";
  do {
    $responseLine = <$smtp>;
  }until($responseLine =~/^(\d\d\d) /);
  return $responseLine unless($1 eq '250');

  print $smtp "MAIL FROM:<>\015\012";
  do {
    $responseLine = <$smtp>;
  }until($responseLine =~/^(\d\d\d) /);
  return $responseLine unless($1 eq '250');

  print $smtp "RCPT TO:<$name$ExtServerDomain>\015\012";
  do {
    $responseLine = <$smtp>;
  }until($responseLine =~/^(\d\d\d) /);

  print $smtp "QUIT\015\012";
  <$smtp>;

  return $responseLine unless($responseLine =~/^250 /);

  return undef;
}

sub createAccount {
  my ($account)=@_;
  my $retCode=undef;

  my $UserData = {
    UseAppPassword => 'NO',
    UseExtPassword => 'YES',
  };
  debug("Creating $account");
  my $cli = new CGP::CLI( { PeerAddr => $CGProServerAddress,
                            PeerPort => 106,
                            login    => $CGProPostmasterLogin,
                            password => $CGProPostmasterPassword } )
     || return "$CGProPostmasterLogin can't login to CGPro via CLI: ".$CGP::ERR_STRING;

   $retCode="Can't create $account: ".$cli->getErrMessage
      unless($cli->CreateAccount(accountName => $account ,settings => $UserData));

   $cli->Logout();
   return $retCode;
}

sub processNEW {
  my ($prefix,$account)=@_;

  my ($name,$domain);
  if($account =~ /(.+)\@(.+)/) {
    $name=$1;$domain=$2;
  } else {
    print "$prefix ERROR Full account name with \@ and domain part expected";
    return;
  }

  my $ExtServerAddress;
  my $ExtServerDomain='@'.$domain;

  # if(exists $externalServers{$domain}) {
  #   $ExtServerAddress=$externalServers{$domain}{IP};
  #   $ExtServerDomain=$externalServers{$domain}{extDomainName} if(exists $externalServers{$domain}{extDomainName});
  # } else {
  #   $ExtServerAddress=$externalServers{'default'}{IP};
  #   $ExtServerDomain=$externalServers{'default'}{extDomainName} if(exists $externalServers{'default'}{extDomainName});
  # }

  my $cli = new CGP::CLI( { PeerAddr => $CGProServerAddress,
			    PeerPort => 106,
			    login    => $CGProPostmasterLogin,
			    password => $CGProPostmasterPassword } )
      || return "$CGProPostmasterLogin can't login to CGPro via CLI: ".$CGP::ERR_STRING;

  my $prefs = $cli->GetAccountDefaultPrefs($domain);
  if ($prefs->{"MailMigrationServerIP"}) {
      $ExtServerAddress = $prefs->{"MailMigrationServerIP"};
  }
  $cli->Logout();


  my $errorMsg=checkUserSMTP($name,$ExtServerAddress,$ExtServerDomain);
  if(defined $errorMsg) {
    chomp $errorMsg;
    print "$prefix ERROR $errorMsg\n";
    return;
  }
  $errorMsg=createAccount($account);
  if(defined $errorMsg) {
    chomp $errorMsg;
    print "$prefix ERROR $errorMsg\n";
    return;
  }
  print "$prefix OK\n";
}

#------------- processVRFY -----------------

sub checkUserPassword {
  my ($user,$password,$usePOP,$ExtServerAddress,$ExtServerDomain)=@_;

  if($usePOP) {
    debug("Connecting via POP to $ExtServerAddress");
    my $pop = new IO::Socket::INET(PeerAddr => $ExtServerAddress,
                                   PeerPort => 110
                                  )
        || return "*** Can't connect to External Server via POP.";

    $pop->autoflush(1);
    my $responseLine = <$pop>;
    debug("POP $ExtServerAddress answer: ".$responseLine);

    print $pop "USER $user$ExtServerDomain\015\012";
    $responseLine = <$pop>;
    debug("POP $ExtServerAddress answer: ".$responseLine);

    unless($responseLine =~ /^\+OK /) {
      print $pop "QUIT\n";
      $responseLine = ~/.+ (.+)/;
      return $1;
    }
    print $pop "PASS $password\015\012";
    $responseLine = <$pop>;
    debug("POP $ExtServerAddress answer: ".$responseLine);

    print $pop "QUIT\015\012";

    unless($responseLine =~ /^\+OK /) {
      $responseLine =~ /^\-\S+ (.+)/;
      return $1;
    }
    return undef;

  } else {
    debug("Connecting via IMAP to $ExtServerAddress");
    my $imap = new IO::Socket::INET(PeerAddr => $ExtServerAddress,
                                    PeerPort => 143
                                  )
        || return "*** Can't connect to External Server via IMAP.";

    $imap->autoflush(1);
    my $responseLine = <$imap>;
    debug("IMAP $ExtServerAddress answer: $responseLine");
    #print "$responseLine\n";

    my $output="x LOGIN $user$ExtServerDomain ".&CGP::CLI::convertOutput($password,1)."\015\012";
    debug("IMAP $ExtServerAddress sending: ".$output);
    print $imap "$output";

    do {
      $responseLine = <$imap>;
      debug("IMAP $ExtServerAddress answer: $responseLine");
    }until($responseLine =~/^x /);

    print $imap "x LOGOUT\015\012";

    unless($responseLine =~ /^x OK/) {
      $responseLine =~ /^x \S+ (.+)/;
      return $1;
    }
    return undef;
  }
}

sub updateAccount {
  my ($account,$password)=@_;
  my $retCode=undef;

  my $UserData = {
    Password => $password,
    UseAppPassword => 'YES', # or ='default'
    UseExtPassword => 'NO',  # or ='default'
  };
  debug("Updating $account settings");
  my $cli = new CGP::CLI( { PeerAddr => $CGProServerAddress,
                          PeerPort => 106,
                          login    => $CGProPostmasterLogin,
                          password => $CGProPostmasterPassword } )
   || return "$CGProPostmasterLogin can't login to CGPro via CLI: ".$CGP::ERR_STRING;

  $retCode="Can't update $account: ".$cli->getErrMessage
    unless($cli->UpdateAccount($account,$UserData));

  $cli->Logout();
  return $retCode;
}

sub migrateMail {
    my ($user,$password,$name,$usePOP,$ExtServerAddress,$ExtServerDomain)=@_;

    my $command;

    my $convPassword=&CGP::CLI::convertOutput($password,1);
    $convPassword=&CGP::CLI::convertOutput($convPassword,1);
# $convPassword =~s/</\\</g;
# $convPassword =~s/>/\\>/g;
# $convPassword =~s/\|/\\\|/g;

    if($usePOP) {
	$command="$migrationProgPOP --notimeout $ExtServerAddress $name$ExtServerDomain $convPassword $CGProServerAddress $user";
    } else {
	$command="$migrationProgIMAP --notimeout $ExtServerAddress $name$ExtServerDomain $convPassword $CGProServerAddress $user $convPassword";
    }
    if ( !-d "/var/CommuniGate/Migration/" ) {
	mkdir "/var/CommuniGate/Migration/";
    }
    sysopen(FO, "/var/CommuniGate/Migration/migrationQueue", O_WRONLY|O_CREAT|O_APPEND, 0600);
    print FO "$command\n";
    close(FO);

    # unless($useFork) { $command .= ' &';}
    # debug("Launching ".$command);
    # unless($useFork) {
    #   system($command)
    #     && print "* Error: couldn't launch \"$command\": $!\n";
    # } else {
    #   exec($command)
    #     && print "* Error: couldn't exec \"$command\": $!\n";
    # }

}

sub processVRFY {
  my ($prefix,$account,$password)=@_;

  my ($name,$domain);
  if($account =~ /(.+)\@(.+)/) {
    $name=$1;$domain=$2;
  } else {
    print "$prefix ERROR Full account name with \@ and domain part expected\n";
    return;
  }

  my $ExtServerAddress;
  my $ExtServerDomain='@'.$domain;
  my ($usePOP,$savePasswords)=(0,0);

  # if(exists $externalServers{$domain}) {
  #   $ExtServerAddress=$externalServers{$domain}{IP};
  #   $ExtServerDomain=$externalServers{$domain}{extDomainName} if(exists $externalServers{$domain}{extDomainName});
  #   $usePOP=$externalServers{$domain}{usePOP} if(exists $externalServers{$domain}{usePOP});
  #   $savePasswords=$externalServers{$domain}{savePasswords} if(exists $externalServers{$domain}{savePasswords});
  # } else {
  #   $ExtServerAddress=$externalServers{'default'}{IP};
  #   $ExtServerDomain=$externalServers{'default'}{extDomainName} if(exists $externalServers{'default'}{extDomainName});
  #   $usePOP=$externalServers{'default'}{usePOP} if(exists $externalServers{'default'}{usePOP});
  #   $savePasswords=$externalServers{'default'}{savePasswords} if(exists $externalServers{'default'}{savePasswords});
  # }

  my $cli = new CGP::CLI( { PeerAddr => $CGProServerAddress,
			    PeerPort => 106,
			    login    => $CGProPostmasterLogin,
			    password => $CGProPostmasterPassword } )
      || return "$CGProPostmasterLogin can't login to CGPro via CLI: ".$CGP::ERR_STRING;

  my $prefs = $cli->GetAccountDefaultPrefs($domain);
  if ($prefs->{"MailMigrationServerIP"}) {
      $ExtServerAddress = $prefs->{"MailMigrationServerIP"};
  }


  my $errorMsg=checkUserPassword($name,$password,$usePOP,$ExtServerAddress,$ExtServerDomain);
  if(defined $errorMsg) {
    print "$prefix ERROR $errorMsg\n";
    return;
  }

  $errorMsg=updateAccount($account,$password);
  if(defined $errorMsg) {
    print "* $prefix ERROR $errorMsg\n";
    # return;
  }
  print "$prefix OK\n";

  if($savePasswords) {
    open(PWFILE,">> passwords($domain).txt")
      || print "* can't open passwords.txt\n";
    print PWFILE "$name\t$password\n";
    close(PWFILE);
    return;
  } else {
    migrateMail($account,$password,$name,$usePOP,$ExtServerAddress,$ExtServerDomain);
  }
}

__END__;

