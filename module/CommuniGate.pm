package Cpanel::CommuniGate;

use strict;
use vars qw(@ISA @EXPORT $VERSION);
use CLI;
use Cpanel::Logger          ();
use Cpanel::AdminBin ();
use Cpanel::Email ();

use Cpanel                           ();
use Cpanel::SafeDir                  ();
use Cpanel::Rand                     ();
use Cpanel::Encoder::Tiny            ();
use Cpanel::PasswdStrength           ();
use Cpanel::Validate::EmailLocalPart ();
use Cpanel::Validate::EmailRFC       ();
use Cpanel::Sys::Hostname		();
use Storable                         ();
use Time::Local  'timelocal_nocheck';

require Exporter;
@ISA    = qw(Exporter);
@EXPORT = qw(CommuniGate_init );

$VERSION = '1.0';

my $logger = Cpanel::Logger->new();

sub CommuniGate_init {
    return 1;
}

sub postmaster_pass {
	return Cpanel::AdminBin::adminrun('cgppass', 'GETPASS', 'noarg','noarg');
}

sub maxgw_domain {
 my $domainname = shift;
 my $limits_file = "/var/CommuniGate/cPanel/limits";
 my %limits;
 my $default_max_gw = 5;
 open (MYFILE, "$limits_file"); # retrieve the tokens stored on file
 while (<MYFILE>) {
        chomp;
        my @line = split(",",$_);
        $limits{@line[0]} = @line[1];
 }
 close (MYFILE);
 if ($limits{$domainname}) {
	return $limits{$domainname};
 } else {
 	return $default_max_gw;
 }
}

sub currentgw_domain {
  my $domainname = shift;
  my $count=0;
  my $CGServerAddress = "91.230.195.210";
  my $PostmasterLogin = 'postmaster';
  my $PostmasterPassword = postmaster_pass();     
  my $cli = new CGP::CLI( { PeerAddr => $CGServerAddress,
                            PeerPort => 106,
                            login => $PostmasterLogin,
                            password => $PostmasterPassword } );
  unless($cli) {
                $logger->warn("Can't login to CGPro: ".$CGP::ERR_STRING);
                exit(0);
  }
  my $accounts=$cli->ListAccounts($domainname);
  my $userName;
  foreach $userName (sort keys %$accounts) {      
   my $accountData = $cli->GetAccountEffectiveSettings("$userName\@$domainname");
   my $services = @$accountData{'ServiceClass'} || '';
   if (!($services cmp "groupware")) {
	$count++;
   }
  }
  $cli->Logout();
  return $count;
}



sub api2_GWAccounts {
	my %OPTS = @_;
	my $domainparam = $OPTS{'domain'};
	my $invert = $OPTS{'invert'};
	my @domains;
	if (!$domainparam) {
		@domains = Cpanel::Email::listmaildomains(); 
	} else {
		@domains[0]=$domainparam;
	}
	my $CGServerAddress = "91.230.195.210";
	my $PostmasterLogin = 'postmaster';
	my $PostmasterPassword = postmaster_pass();	
	my $cli = new CGP::CLI( { PeerAddr => $CGServerAddress,
                            PeerPort => 106,
                            login => $PostmasterLogin,
                            password => $PostmasterPassword } );
  	unless($cli) {
   		$logger->warn("Can't login to CGPro: ".$CGP::ERR_STRING);
   		exit(0);
	}
	my @result;
	foreach my $domain (@domains) {
		my $accounts=$cli->ListAccounts($domain);
		my $userName;
		foreach $userName (sort keys %$accounts) {	
			my $accountData = $cli->GetAccountEffectiveSettings("$userName\@$domain");
  			my $services = @$accountData{'ServiceClass'} || '';
			if ((!($services cmp "groupware"))  && (!$invert)){ 
				my $mail=$userName."@".$domain;
				push( @result, { mail => $mail, domain => $domain } );
			}
                        if ((($services cmp "groupware"))  && ($invert)){ 
                                my $mail=$userName."@".$domain;
                                push( @result, { mail => $mail, domain => $domain } );
                        }

		}
	}
	$cli->Logout();
	return @result;
}

sub api2_EnableGW {
	my %OPTS = @_;
	my $account = $OPTS{'account'};
	my @values=split("@",$account);
        my $account_domain = @values[1];
	my $current=currentgw_domain($account_domain);
	my $max=maxgw_domain($account_domain);
	if ($current>=$max) {
		print "<H2><font color=red>Maximum of Groupware accounts exceeded for domain : $account_domain. (Maximum is : $max). </font></H2>\n";
		return;
 	} 
        my $CGServerAddress = "91.230.195.210";
        my $PostmasterLogin = 'postmaster';
        my $PostmasterPassword = postmaster_pass();
        my $cli = new CGP::CLI( { PeerAddr => $CGServerAddress,
                            PeerPort => 106,
                            login => $PostmasterLogin,
                            password => $PostmasterPassword } );
        unless($cli) {
                $logger->warn("Can't login to CGPro: ".$CGP::ERR_STRING);
                exit(0);
        }
	my $accountData;
	@$accountData{'ServiceClass'} = "groupware";	
	$cli->UpdateAccountSettings("$account",$accountData);
	$cli->Logout();
}

sub api2_DisableGW {
        my %OPTS = @_;
        my $account = $OPTS{'account'};
        my $CGServerAddress = "91.230.195.210";
        my $PostmasterLogin = 'postmaster';
        my $PostmasterPassword = postmaster_pass();
        my $cli = new CGP::CLI( { PeerAddr => $CGServerAddress,
                            PeerPort => 106,
                            login => $PostmasterLogin,
                            password => $PostmasterPassword } );
        unless($cli) {
                $logger->warn("Can't login to CGPro: ".$CGP::ERR_STRING);
                exit(0);
        }
        my $accountData;
        @$accountData{'ServiceClass'} = "mailonly";
        $cli->UpdateAccountSettings("$account",$accountData);
        $cli->Logout();
}

sub api2_provisioniPhone {
	my %OPTS = @_;
        my $account = $OPTS{'account'};
        my $password = $OPTS{'password'};
        my $number = $OPTS{'number'};
	my @values=split("@",$account);
	my $user=@values[0];
	my $domain=@values[1];
	$number=~ s/\+//; # Remove + from Intl Number
	my $template = "/var/CommuniGate/apple/iphonetemplate.mobileconfig";
	my $random_number = rand();
	$random_number =~ s/0.//;
	my $targetdir="/usr/local/apache/htdocs/iOS";
	# Build the file
	my $cmd="cat ".$template." | sed s/TAGUSER/".$user."/ | sed s/TAGPASS/".$password."/ | sed s/TAGDOMAIN/".$domain."/g > ".$targetdir."/".$random_number.".mobileconfig";
	system("$cmd");

	# Send the SMS
	my $hostname=Cpanel::Sys::gethostname();
	my $mailbody_bulksms="iPhone autoconfig link: $account  http://$hostname/iOS/".$random_number.".mobileconfig";
	open(MAILPIPE, '|/opt/CommuniGate/mail -s 6469646F6F '.$number.'@bulksms.net') or die "Can't open pipe $!";
	print MAILPIPE $mailbody_bulksms;
	close MAILPIPE;
	print "    SMS was sent to $number";
}

sub api2_provisioniPad {
        my %OPTS = @_;
        my $account = $OPTS{'account'};
        my $password = $OPTS{'password'};
        my @values=split("@",$account);
        my $user=@values[0];
        my $domain=@values[1];
        my $template = "/var/CommuniGate/apple/iphonetemplate.mobileconfig";
        my $random_number = rand();
        $random_number =~ s/0.//;
        my $targetdir="/usr/local/apache/htdocs/iOS";
        # Build the file
        my $cmd="cat ".$template." | sed s/TAGUSER/".$user."/ | sed s/TAGPASS/".$password."/ | sed s/TAGDOMAIN/".$domain."/g > ".$targetdir."/".$random_number.".mobileconfig";
        system("$cmd");
	my $hostname=Cpanel::Sys::gethostname();
        my $url ="http://$hostname/iOS/".$random_number.".mobileconfig";
	my @result;
	push (@result, {url => "$url"});
	return @result;
}


sub api2_listpopswithdisk {
        my %OPTS = @_;
	my @domains = Cpanel::Email::listmaildomains();
  	my $CGServerAddress = "91.230.195.210";
        my $PostmasterLogin = 'postmaster';
        my $PostmasterPassword = postmaster_pass();     
        my $cli = new CGP::CLI( { PeerAddr => $CGServerAddress,
                            PeerPort => 106,
                            login => $PostmasterLogin,
                            password => $PostmasterPassword } );
        unless($cli) {
                $logger->warn("Can't login to CGPro: ".$CGP::ERR_STRING);
                exit(0);
        }
	my @result;
        foreach my $domain (@domains) {
                my $accounts=$cli->ListAccounts($domain);
                my $userName;
                foreach $userName (sort keys %$accounts) {      
                        my $accountData = $cli->GetAccountEffectiveSettings("$userName\@$domain");
                        my $diskquota = @$accountData{'MaxAccountSize'} || '';
			$diskquota =~ s/M//g;
                        my $_diskquota = $diskquota * 1024 * 1024;
                        my $_diskused = $cli->GetAccountInfo("$userName\@$domain","StorageUsed");
                        my $diskused = $_diskused / 1024 /1024;
			my $diskusedpercent;
			if ($diskquota eq "unlimited") {
				$diskusedpercent = 0;
			} else {
				$diskusedpercent = $_diskused / $diskquota;
			}
			(my $humandiskused) = split('\.',$diskused); $humandiskused .= "M";
			my $humandiskquota = $diskquota."M";
			push( @result, { 	email => "$userName\@$domain", 
						humandiskused => "$humandiskused", 
						humandiskquota => "$humandiskquota", 
						diskusedpercent => "$diskusedpercent", 
						diskused => "$diskused" ,  
						diskquota => "$diskquota", 
						user => "$userName", 
						domain => "$domain", 
						_diskquota => "$_diskquota", 
						_diskused => "$_diskused" } );
		}

	}
	return @result;
}

sub api2_addalias {
        my %OPTS = @_;
        my $domain = $OPTS{'domain'}; 
        my $user = $OPTS{'email'}; 
        my $fwdemail = $OPTS{'fwdemail'}; 
        my $CGServerAddress = "91.230.195.210";
        my $PostmasterLogin = 'postmaster';
        my $PostmasterPassword = postmaster_pass();
        my $cli = new CGP::CLI( { PeerAddr => $CGServerAddress,
                            PeerPort => 106,
                            login => $PostmasterLogin,
                            password => $PostmasterPassword } );
        unless($cli) {
                $logger->warn("Can't login to CGPro: ".$CGP::ERR_STRING);
                exit(0);
        }       
	$cli->CreateForwarder("$user\@$domain", $fwdemail);
	my $error_msg = $cli->getErrMessage();
	my @result;
	if ($error_msg eq "OK") {
		push( @result, { email => "$user\@$domain", forward => "$fwdemail", domain => "$domain" } );
	} else {
		$Cpanel::CPERROR{'CommuniGate'} = $error_msg;
	}
        $cli->Logout();         
	return @result;
}          

sub api2_addforward {
        my %OPTS = @_;
 	my $domain = $OPTS{'domain'};
        my $user = $OPTS{'email'}; 
        my $fwdemail = $OPTS{'fwdemail'};
        my $CGServerAddress = "91.230.195.210";
        my $PostmasterLogin = 'postmaster';
        my $PostmasterPassword = postmaster_pass();
        my $cli = new CGP::CLI( { PeerAddr => $CGServerAddress,
                            PeerPort => 106,
                            login => $PostmasterLogin,
                            password => $PostmasterPassword } );
        unless($cli) {
                $logger->warn("Can't login to CGPro: ".$CGP::ERR_STRING);
                exit(0);
        }
	return addforward (
	    domain => $domain,
	    email => $user,
	    fwdemail => $fwdemail,
	    cli => $cli
	    );
}       

sub addforward {
        my %OPTS = @_;
 	my $domain = $OPTS{'domain'};
        my $user = $OPTS{'email'}; 
        my $fwdemail = $OPTS{'fwdemail'};
        my $cli = $OPTS{'cli'};
        my $Rules=$cli->GetAccountMailRules("$user\@$domain");
	my $error_msg = $cli->getErrMessage();
        if (!($error_msg eq "OK")) {
                $Cpanel::CPERROR{'CommuniGate'} = $error_msg;
		return undef;
        }
	my $found=0;
	my @NewRules;
        my @result;
        foreach my $Rule (@$Rules) {
                  if ($Rule->[1] eq "#Redirect") {
		      my %rules;
		      for my $mail (split(',', $Rule->[3]->[0]->[1])) {
			  $rules{$mail} = 1;
		      }
		      $rules{$fwdemail} = 1;
		      $Rule->[3]->[0]->[1] = join(',', keys(%rules));
		      $found=1;
                  }       
		  push(@NewRules,$Rule);
        }
	if (!$found) {
		my $Rule= [1,'#Redirect',[],[['Mirror to',$fwdemail]]];
		push(@NewRules,$Rule);
	}		
	$cli->SetAccountMailRules("$user\@$domain",\@NewRules);
	$error_msg = $cli->getErrMessage();
        if ($error_msg eq "OK") {
                push( @result, { email => "$user\@$domain", forward => "$fwdemail", domain => "$domain" } );
        } else {
	    $Cpanel::CPERROR{'CommuniGate'} = $error_msg;
        }
        return @result;

}

sub api2_listaliases {
        my %OPTS = @_;
	my $specified_domain  = $OPTS{'domain'};
        my @domains = Cpanel::Email::listmaildomains($OPTS{'domain'});
        my $CGServerAddress = "91.230.195.210";
        my $PostmasterLogin = 'postmaster';
        my $PostmasterPassword = postmaster_pass();
        my $cli = new CGP::CLI( { PeerAddr => $CGServerAddress,
                            PeerPort => 106,
                            login => $PostmasterLogin,
                            password => $PostmasterPassword } );
        unless($cli) {
                $logger->warn("Can't login to CGPro: ".$CGP::ERR_STRING);
                exit(0);
        }
        my @result;
        foreach my $domain (@domains) {
	  if (($specified_domain eq "") || ($specified_domain eq $domain)){
                my $accounts=$cli->ListForwarders($domain);
                foreach my $userName (@$accounts) {
                        my $fwddata = $cli->GetForwarder("$userName\@$domain");
                        push( @result, {        uri_dest => "$userName%40$domain",
                                                html_dest => "$userName\@$domain",
                                                dest => "$userName\@$domain",
                                                uri_forward => "$fwddata",
                                                html_forward => "$fwddata" ,
                                                forward => "$fwddata" } );
                }
	  }
        }
        return @result;
} 




sub api2_listforwards {
        my %OPTS = @_;
        my $specified_domain  = $OPTS{'domain'};
        my @domains = Cpanel::Email::listmaildomains($OPTS{'domain'});
        my $CGServerAddress = "91.230.195.210";
        my $PostmasterLogin = 'postmaster';
        my $PostmasterPassword = postmaster_pass();
        my $cli = new CGP::CLI( { PeerAddr => $CGServerAddress,
                            PeerPort => 106,
                            login => $PostmasterLogin,
                            password => $PostmasterPassword } );
        unless($cli) {
                $logger->warn("Can't login to CGPro: ".$CGP::ERR_STRING);
                exit(0);
        }
        my @result;
        foreach my $domain (@domains) {
          if (($specified_domain eq "") || ($specified_domain eq $domain)){
		my $accounts=$cli->ListAccounts($domain);
  		foreach my $userName (sort keys %$accounts) {
		 my $Rules=$cli->GetAccountMailRules("$userName\@$domain") || die "Error: ".$cli->getErrMessage.", quitting";
        	 foreach my $Rule (@$Rules) {
                  if ($Rule->[1] eq "#Redirect") {
			my @dest = split(",",$Rule->[3]->[0]->[1]);
			foreach my $value (@dest) {
			 push( @result, {       uri_dest => "$userName%40$domain",
                                                html_dest => "$userName\@$domain",
                                                dest => "$userName\@$domain",
                                                uri_forward => "$value",
                                                html_forward => "$value" ,
                                                forward => "$value" } );
			}
                  }
        	 }
		}
          }
        }
        return @result;
}



sub api2_delalias {
        my %OPTS = @_;
        my $forwarder = $OPTS{'forwarder'};
        my $CGServerAddress = "91.230.195.210";
        my $PostmasterLogin = 'postmaster';
        my $PostmasterPassword = postmaster_pass();
        my $cli = new CGP::CLI( { PeerAddr => $CGServerAddress,
                            PeerPort => 106,
                            login => $PostmasterLogin,
                            password => $PostmasterPassword } );
        unless($cli) {      
                $logger->warn("Can't login to CGPro: ".$CGP::ERR_STRING);
                exit(0);
        }       
        $cli->DeleteForwarder("$forwarder");
        my $error_msg = $cli->getErrMessage();
        my @result;
        if ($error_msg eq "OK") {
                push( @result, { forwarder => "$forwarder" } );
        } else {
		$error_msg =~ s/forwarder/alias/g;
                $Cpanel::CPERROR{'CommuniGate'} = $error_msg;
        }
        $cli->Logout();
        return @result;
}

sub api2_delforward {
        my %OPTS = @_;
        my $domain = $OPTS{'domain'};
        my $account = $OPTS{'account'};
        my $fwdemail = $OPTS{'forwarder'};
        my $CGServerAddress = "91.230.195.210";
        my $PostmasterLogin = 'postmaster';
        my $PostmasterPassword = postmaster_pass();
        my $cli = new CGP::CLI( { PeerAddr => $CGServerAddress,
                            PeerPort => 106,
                            login => $PostmasterLogin,
                            password => $PostmasterPassword } );
        unless($cli) {
                $logger->warn("Can't login to CGPro: ".$CGP::ERR_STRING);
                exit(0);
        }
        my $Rules=$cli->GetAccountMailRules("$account") || die "Error: ".$cli->getErrMessage.", quitting";
        foreach my $Rule (@$Rules) {
                  if ($Rule->[1] eq "#Redirect") {
			my @dest = split(",",$Rule->[3]->[0]->[1]);
			$Rule->[3]->[0]->[1] ="";
			my $found=0;
                        foreach my $value (@dest) {
				if ((!($value eq $fwdemail)) || $found) {
					if ($Rule->[3]->[0]->[1]) {$Rule->[3]->[0]->[1]  .=	",".$value; }
				 	else {$Rule->[3]->[0]->[1]  =     $value; }	
				} else {
			   		$found = 1;	
				} 
                        }
                  }
        }
        $cli->SetAccountMailRules("$account",$Rules);
        my $error_msg = $cli->getErrMessage();
        my @result;
        if ($error_msg eq "OK") {
                push( @result, { email => "$user\@$domain", forward => "$fwdemail", domain => "$domain" } );
        } else {
                $Cpanel::CPERROR{'CommuniGate'} = $error_msg;
        }
        return @result;
}


sub api2_ListDefAddress {
        my %OPTS = @_;
        my $CGServerAddress = "91.230.195.210";
        my $PostmasterLogin = 'postmaster';
        my $PostmasterPassword = postmaster_pass();
        my $cli = new CGP::CLI( { PeerAddr => $CGServerAddress,
                            PeerPort => 106,
                            login => $PostmasterLogin,
                            password => $PostmasterPassword } );
        unless($cli) {
                $logger->warn("Can't login to CGPro: ".$CGP::ERR_STRING);
                exit(0);
        }
	my @result;
	my @domains = Cpanel::Email::listmaildomains();
	foreach my $domain (@domains) {
		my $domaindata = $cli->GetDomainEffectiveSettings("$domain");
                my $action = @$domaindata{'MailToUnknown'} || '';
		my $forwardaddress = @$domaindata{'MailRerouteAddress'} || '';
		if ($action eq "Rejected") { push( @result, { domain => "$domain",reject => "selected",discard =>"",forward=>"",acceptedandbounced =>"" } ); }
		if ($action eq "Discarded") { push( @result, { domain => "$domain",reject => "",discard =>"selected",forward=>"",acceptedandbounced =>"" } ); }
		if ($action eq "Rerouted to") { push( @result, { domain => "$domain",reject => "",discard =>"",forward=>"selected",acceptedandbounced =>"",MailRerouteAddress => "$forwardaddress"} ); }
		if ($action eq "Accepted and Bounced") { push( @result, { domain => "$domain",reject => "",discard =>"",forward=>"",acceptedandbounced =>"selected" } ); }
	}	
        $cli->Logout();
        return @result;
}

sub api2_SetDefAddress {
        my %OPTS = @_;
	my $domain = $OPTS{'domain'};
	my $action = $OPTS{'action'};
	my $fwdmail= $OPTS{'fwdmail'};
        my $CGServerAddress = "91.230.195.210";
        my $PostmasterLogin = 'postmaster';
        my $PostmasterPassword = postmaster_pass();
        my $cli = new CGP::CLI( { PeerAddr => $CGServerAddress,
                            PeerPort => 106,
                            login => $PostmasterLogin,
                            password => $PostmasterPassword } );
        unless($cli) {
                $logger->warn("Can't login to CGPro: ".$CGP::ERR_STRING);
                exit(0);
        }
	my $domainData;
	if ($action eq "CGPDefDiscard") { @$domainData{'MailToUnknown'} = "Discarded"; }
	if ($action eq "CGPDefReject") { @$domainData{'MailToUnknown'} = "Rejected"; }
	if ($action eq "CGPDefForward") { @$domainData{'MailToUnknown'} = "Rerouted to"; @$domainData{'MailRerouteAddress'} = "$fwdmail"; }
	if ($action eq "CGPDefAcceptedAndBounced") { @$domainData{'MailToUnknown'} = "Accepted and Bounced"; }
        $cli->UpdateDomainSettings(domain => $domain,settings => $domainData);
        $cli->Logout();
}

sub api2_SpamAssassinStatus {
	my %OPTS = @_;
        my $account_domain  = $OPTS{'domain'};
	my $sa_rulname = "scanspam-".$account_domain;
	my $CGServerAddress = "91.230.195.210";
        my $PostmasterLogin = 'postmaster';
        my $PostmasterPassword = postmaster_pass();
        my $cli = new CGP::CLI( { PeerAddr => $CGServerAddress,
                            PeerPort => 106,
                            login => $PostmasterLogin,
                            password => $PostmasterPassword } );
        unless($cli) {
                $logger->warn("Can't login to CGPro: ".$CGP::ERR_STRING);
                exit(0);
        }
	my $Rules=$cli->GetServerRules() || die "Error: ".$cli->getErrMessage.", quitting";
	my @result;
   	foreach my $Rule (@$Rules) {
		if ($Rule->[1] eq "$sa_rulname") {
			push( @result, { status => "enabled" } );
        		$cli->Logout();
        		return @result;
		}
        }
        push( @result, { status => "disabled" } );
	$cli->Logout();
        return @result;
}

sub api2_EnableSpamAssassin {
        my %OPTS = @_;
        my $account_domain  = $OPTS{'domain'};
        my $sa_rulname = "scanspam-".$account_domain;
	my $account = $Cpanel::authuser;
        my $CGServerAddress = "91.230.195.210";
        my $PostmasterLogin = 'postmaster';
        my $PostmasterPassword = postmaster_pass();
        my $cli = new CGP::CLI( { PeerAddr => $CGServerAddress,
                            PeerPort => 106,
                            login => $PostmasterLogin,
                            password => $PostmasterPassword } );
        unless($cli) {
                $logger->warn("Can't login to CGPro: ".$CGP::ERR_STRING);
                exit(0);
        }
        my @result;
	my $ExistingRules=$cli->GetServerRules() || die "Error: ".$cli->getErrMessage.", quitting";
	my @domains = Cpanel::Email::listmaildomains();
	my @NewRules;
        foreach my $domain (@domains) {
	 my $sa_rulname = "scanspam-".$domain;
 	 my $NewRule =
  		[ 5, $sa_rulname ,
    			[ 
				['Any Recipient', 'in', '*@'.$domain],
				['Header Field', 'is not', 'X-Spam-Status*'] 
			],
    			[ 
				['Execute', '[STDERR] [FILE] [RETPATH] [RCPT] /var/CommuniGate/spamassassin/scanspam.sh '.$account], 
				['Discard']
			]
  		];
	 push(@NewRules,$NewRule);
         push( @result, { status => "domain: $domain ...done\n" } );
	}
	foreach my $Rule (@$ExistingRules) {
		push(@NewRules,$Rule);
        }      	

  	$cli->SetServerRules(\@NewRules) || die "Error: ".$cli->getErrMessage.", quitting";
        $cli->Logout();
        return @result;
}

sub api2_DisableSpamAssassin {
        my %OPTS = @_;
        my $account_domain  = $OPTS{'domain'};
        my $CGServerAddress = "91.230.195.210";
        my $PostmasterLogin = 'postmaster';
        my $PostmasterPassword = postmaster_pass();
        my $cli = new CGP::CLI( { PeerAddr => $CGServerAddress,
                            PeerPort => 106,
                            login => $PostmasterLogin,
                            password => $PostmasterPassword } );
        unless($cli) {
                $logger->warn("Can't login to CGPro: ".$CGP::ERR_STRING);
                exit(0); 
        }
        my $Rules=$cli->GetServerRules() || die "Error: ".$cli->getErrMessage.", quitting";
        my @result;
	my @NewRules;
 	my @domains = Cpanel::Email::listmaildomains();
        foreach my $Rule (@$Rules) {
	 my $match=0;
         foreach my $domain (@domains) {
	        my $sa_rulname = "scanspam-".$domain;
                if ($Rule->[1] eq "$sa_rulname") {
			push( @result, { status => "domain: $domain ...done\n" } );
			$match=1;
                }
	 }
         if (!$match) {push( @NewRules, $Rule );}
        }
	$cli->SetServerRules(\@NewRules) || die "Error: ".$cli->getErrMessage.", quitting";
        $cli->Logout();
        return @result;
}

sub count_x {
 my $string = shift;
 my $count = 0;
 while ($string =~ /x/g) { $count++ }
 return $count;
}


sub api2_SpamAssassinStatusAutoDelete {
	my %OPTS = @_;
        my $account_domain  = $OPTS{'domain'};
	my $sa_rulname = "deletespam-".$account_domain;
	my $CGServerAddress = "91.230.195.210";
        my $PostmasterLogin = 'postmaster';
        my $PostmasterPassword = postmaster_pass();
        my $cli = new CGP::CLI( { PeerAddr => $CGServerAddress,
                            PeerPort => 106,
                            login => $PostmasterLogin,
                            password => $PostmasterPassword } );
        unless($cli) {
                $logger->warn("Can't login to CGPro: ".$CGP::ERR_STRING);
                exit(0);
        }
	my $Rules=$cli->GetServerRules() || die "Error: ".$cli->getErrMessage.", quitting";
	my @result;
   	foreach my $Rule (@$Rules) {
		if ($Rule->[1] eq "$sa_rulname") {
			push( @result, { status => "enabled" } );
			$Cpanel::CPVAR{'spam_auto_delete'} = 1;
			$Cpanel::CPVAR{'spam_auto_delete_score'} = count_x($Rule->[2]->[0]->[2]);
        		$cli->Logout();
        		return @result;
		}
        }
        push( @result, { status => "disabled" } );
	$Cpanel::CPVAR{'spam_auto_delete'} = 0;
	$cli->Logout();
        return @result;
}

sub api2_EnableSpamAssassinAutoDelete {
        my %OPTS = @_;
        my $account_domain  = $OPTS{'domain'};
        my $score = $OPTS{'score'};
	my $score_string = "";
	for (my $i=0;$i<$score;$i++) {$score_string .= "x"; }
        my $sa_rulname = "deletespam-".$account_domain;
        my $CGServerAddress = "91.230.195.210";
        my $PostmasterLogin = 'postmaster';
        my $PostmasterPassword = postmaster_pass();
        my $cli = new CGP::CLI( { PeerAddr => $CGServerAddress,
                            PeerPort => 106,
                            login => $PostmasterLogin,
                            password => $PostmasterPassword } );
        unless($cli) {
                $logger->warn("Can't login to CGPro: ".$CGP::ERR_STRING);
                exit(0);
        }
        my @result;
	my $ExistingRules=$cli->GetServerRules() || die "Error: ".$cli->getErrMessage.", quitting";
	my @domains = Cpanel::Email::listmaildomains();
	my @NewRules;
        foreach my $domain (@domains) {
	 my $sa_rulname = "deletespam-".$domain;
 	 my $NewRule =
  		[ 4, $sa_rulname ,
    			[ 
				['Header Field', 'is', 'X-Spam-Level: '.$score_string.'*'] 
			],
    			[ 
				['Discard']
			]
  		];
	 push(@NewRules,$NewRule);
         push( @result, { status => "domain: $domain ...done\n" } );
	}
	foreach my $Rule (@$ExistingRules) {
		push(@NewRules,$Rule);
        }      	

  	$cli->SetServerRules(\@NewRules) || die "Error: ".$cli->getErrMessage.", quitting";
        $cli->Logout();
        return @result;
}

sub api2_DisableSpamAssassinAutoDelete {
        my %OPTS = @_;
        my $account_domain  = $OPTS{'domain'};
        my $CGServerAddress = "91.230.195.210";
        my $PostmasterLogin = 'postmaster';
        my $PostmasterPassword = postmaster_pass();
        my $cli = new CGP::CLI( { PeerAddr => $CGServerAddress,
                            PeerPort => 106,
                            login => $PostmasterLogin,
                            password => $PostmasterPassword } );
        unless($cli) {
                $logger->warn("Can't login to CGPro: ".$CGP::ERR_STRING);
                exit(0); 
        }
        my $Rules=$cli->GetServerRules() || die "Error: ".$cli->getErrMessage.", quitting";
        my @result;
	my @NewRules;
 	my @domains = Cpanel::Email::listmaildomains();
        foreach my $Rule (@$Rules) {
	 my $match=0;
         foreach my $domain (@domains) {
	        my $sa_rulname = "deletespam-".$domain;
                if ($Rule->[1] eq "$sa_rulname") {
			push( @result, { status => "domain: $domain ...done\n" } );
			$match=1;
                }
	 }
         if (!$match) {push( @NewRules, $Rule );}
        }
	$cli->SetServerRules(\@NewRules) || die "Error: ".$cli->getErrMessage.", quitting";
        $cli->Logout();
        return @result;
}

sub api2_SpamAssassinStatusSpamBox {
	my %OPTS = @_;
        my $account_domain  = $OPTS{'domain'};
	my $sa_rulname = "spambox";
	my $CGServerAddress = "91.230.195.210";
        my $PostmasterLogin = 'postmaster';
        my $PostmasterPassword = postmaster_pass();
        my $cli = new CGP::CLI( { PeerAddr => $CGServerAddress,
                            PeerPort => 106,
                            login => $PostmasterLogin,
                            password => $PostmasterPassword } );
        unless($cli) {
                $logger->warn("Can't login to CGPro: ".$CGP::ERR_STRING);
                exit(0);
        }
	my $Rules=$cli->GetDomainMailRules($account_domain) || die "Error: ".$cli->getErrMessage.", quitting";
	my @result;
   	foreach my $Rule (@$Rules) {
		if ($Rule->[1] eq "$sa_rulname") {
			push( @result, { status => "enabled" } );
        		$cli->Logout();
        		return @result;
		}
        }
        push( @result, { status => "disabled" } );
	$cli->Logout();
        return @result;
}

sub api2_EnableSpamAssassinSpamBox {
        my %OPTS = @_;
        my $account_domain  = $OPTS{'domain'};
        my $score = $OPTS{'score'};
	my $score_string = "";
	for (my $i=0;$i<$score;$i++) {$score_string .= "x"; }
        my $sa_rulname = "spambox";
        my $CGServerAddress = "91.230.195.210";
        my $PostmasterLogin = 'postmaster';
        my $PostmasterPassword = postmaster_pass();
        my $cli = new CGP::CLI( { PeerAddr => $CGServerAddress,
                            PeerPort => 106,
                            login => $PostmasterLogin,
                            password => $PostmasterPassword } );
        unless($cli) {
                $logger->warn("Can't login to CGPro: ".$CGP::ERR_STRING);
                exit(0);
        }
        my @result;
	my @domains = Cpanel::Email::listmaildomains();
	my @NewRules;
        foreach my $domain (@domains) {
         @NewRules=();
	 my $ExistingRules=$cli->GetDomainMailRules($domain) || die "Error: ".$cli->getErrMessage.", quitting";
	 my $sa_rulname = "spambox";
 	 my $NewRule =
  		[ 4, $sa_rulname ,
    			[ 
				['Header Field', 'is', 'X-Spam-Flag: YES'] 
			],
    			[
				['Store in', 'Spam'], 
				['Discard']
			]
  		];
	 push(@NewRules,$NewRule);
         push( @result, { status => "domain: $domain ...done\n" } );
	 foreach my $Rule (@$ExistingRules) {
	 	push(@NewRules,$Rule);
         }      	
	 $cli->SetDomainMailRules($domain,\@NewRules) || die "Error: ".$cli->getErrMessage.", quitting";		
        }
        $cli->Logout();
        return @result;
}

sub api2_DisableSpamAssassinSpamBox {
        my %OPTS = @_;
        my $account_domain  = $OPTS{'domain'};
        my $CGServerAddress = "91.230.195.210";
        my $PostmasterLogin = 'postmaster';
        my $PostmasterPassword = postmaster_pass();
        my $cli = new CGP::CLI( { PeerAddr => $CGServerAddress,
                            PeerPort => 106,
                            login => $PostmasterLogin,
                            password => $PostmasterPassword } );
        unless($cli) {
                $logger->warn("Can't login to CGPro: ".$CGP::ERR_STRING);
                exit(0); 
        }
        my @result;
	my @NewRules;
 	my @domains = Cpanel::Email::listmaildomains();
        foreach my $domain (@domains) {
	 @NewRules=();
	 my $Rules=$cli->GetDomainMailRules($domain) || die "Error: ".$cli->getErrMessage.", quitting";
         foreach my $Rule (@$Rules) {
	  my $sa_rulname = "spambox";
          if ($Rule->[1] eq "$sa_rulname") {
	   push( @result, { status => "domain: $domain ...done\n" } );
          } else {
	   push( @NewRules, $Rule );
          }
	 }
	 $cli->SetDomainMailRules($domain,\@NewRules) || die "Error: ".$cli->getErrMessage.", quitting";
        }
        $cli->Logout();
        return @result;
}

sub AddCGPAccount {
	my ( $email, $password, $quota ) = @_;
	my @values = split('@',$email);
	my $user=@values[0];
	my $domain=@values[1];
        my $CGServerAddress = "91.230.195.210";
        my $PostmasterLogin = 'postmaster';
        my $PostmasterPassword = postmaster_pass();
        my $cli = new CGP::CLI( { PeerAddr => $CGServerAddress,
                            PeerPort => 106,
                            login => $PostmasterLogin,
                            password => $PostmasterPassword } );
        unless($cli) {      
                $logger->warn("Can't login to CGPro: ".$CGP::ERR_STRING);
                exit(0); 
        }       

	if ($quota == 0) {
        	$quota="unlimited" ;
	}else{
        	$quota .= "M";
	}

	my $data=$cli->GetDomainSettings("$domain");

	if (!$data) {
        	$cli->CreateDomain("$domain");
	}
	my $UserData;
	@$UserData{'Password'}=$password;
	@$UserData{'ServiceClass'}="mailonly";
	@$UserData{'MaxAccountSize'}=$quota;

	$cli->CreateAccount(accountName => "$user\@$domain", settings => $UserData);

	my $error_msg = $cli->getErrMessage();
	my $result;
        if ($error_msg eq "OK") {
		$result = 1;
        } else {
		$result=0;
        }

	$cli->CreateMailbox("$user\@$domain", "Calendar");
	$cli->CreateMailbox("$user\@$domain", "Spam");
	$cli->Logout();
	return $result;
}


sub CommuniGate_doimport {
    my ( $id, $type, $domain ) = @_;
    return if ( !Cpanel::hasfeature('csvimport') );
    if ( $Cpanel::CPDATA{'DEMO'} eq '1' ) {
        print 'Sorry, this feature is disabled in demo mode.';
        return;
    }

    if ( !$domain ) {
        $domain = $Cpanel::CPDATA{'DNS'};
    }

    $id =~ s/\///g;

    my $file       = $Cpanel::homedir . '/tmp/cpcsvimport/' . $id;
    my $importdata = Storable::lock_retrieve( $file . '.import' );

    my $numrows  = scalar @$importdata;
    my $rowcount = 0;
    foreach my $row (@$importdata) {
        $rowcount++;
        my ( $status, $msg );
        if ( $type eq 'fwd' ) {
            ( $status, $msg ) = Cpanel::Email::addforward( $row->{'source'}, $row->{'target'}, $domain, 1 );
            print '<div class="statusline"><div class="statusitem">' . Cpanel::Encoder::Tiny::safe_html_encode_str("$row->{'source'} => $row->{'target'} ") . '</div><div class="status ' . ( $status ? 'green-status' : 'red-status' ) . '">' . $msg . '</div></div>' . "\n";
        }
        else {
            ( $status, $msg ) = Cpanel::Email::addpop( $row->{'email'}, $row->{'password'}, $row->{'quota'}, '', 0, 1 );
	    if ($status) { $status = AddCGPAccount($row->{'email'}, $row->{'password'}, $row->{'quota'})}; 
            print '<div class="statusline"><div class="statusitem">' . Cpanel::Encoder::Tiny::safe_html_encode_str( $row->{'email'} ) . '</div><div class="status ' . ( $status ? 'green-status' : 'red-status' ) . '">' . $msg . '</div></div>' . "\n";
        }
        print qq{<script>setcompletestatus($rowcount,$numrows)</script>\n\n};
    }

}

sub api2_AddMailingList {
        my %OPTS = @_;
        my $domain = $OPTS{'domain'};
        my $listname = $OPTS{'email'};
        my $owner = $OPTS{'owner'};
        my $CGServerAddress = "91.230.195.210";
        my $PostmasterLogin = 'postmaster';
        my $PostmasterPassword = postmaster_pass();
        my $cli = new CGP::CLI( { PeerAddr => $CGServerAddress,
                            PeerPort => 106,
                            login => $PostmasterLogin,
                            password => $PostmasterPassword } );
        unless($cli) {      
                $logger->warn("Can't login to CGPro: ".$CGP::ERR_STRING);
                exit(0);
        }      
        $cli->CreateList("$listname\@$domain","$owner");
        my $error_msg = $cli->getErrMessage();
        my @result;
        if ($error_msg eq "OK") {
                push( @result, { email => "$listname", domain => "$domain" } );
        } else {
                $Cpanel::CPERROR{'CommuniGate'} = $error_msg;
        }
        return @result;
}

sub api2_ListMailingLists {
        my %OPTS = @_;
	@domains = Cpanel::Email::listmaildomains();
        my $CGServerAddress = "91.230.195.210";
        my $PostmasterLogin = 'postmaster';
        my $PostmasterPassword = postmaster_pass();
        my $cli = new CGP::CLI( { PeerAddr => $CGServerAddress,
                            PeerPort => 106,
                            login => $PostmasterLogin,
                            password => $PostmasterPassword } );
        unless($cli) {
                $logger->warn("Can't login to CGPro: ".$CGP::ERR_STRING);
                exit(0);
        }
        my @result;
	foreach my $domain (@domains) {
		my $lists=$cli->GetDomainLists($domain);
                foreach $listName (sort keys %$lists) {
		 push( @result, { list => "$listName\@$domain" , domain =>"$domain"} );
		}
	}
        return @result;
}



sub api2_DelMailingList {
        my %OPTS = @_;
        my $listname = $OPTS{'email'};
        my $CGServerAddress = "91.230.195.210";
        my $PostmasterLogin = 'postmaster';
        my $PostmasterPassword = postmaster_pass();
        my $cli = new CGP::CLI( { PeerAddr => $CGServerAddress,
                            PeerPort => 106,
                            login => $PostmasterLogin,
                            password => $PostmasterPassword } );
        unless($cli) {      
                $logger->warn("Can't login to CGPro: ".$CGP::ERR_STRING);
                exit(0);
        }       
        $cli->DeleteList("$listname");
        my $error_msg = $cli->getErrMessage();
        my @result;
        if ($error_msg eq "OK") {
                push( @result, { email => "$listname" } );
        } else {
                $Cpanel::CPERROR{'CommuniGate'} = $error_msg;
        }       
        return @result;
}

sub api2_RenameMailingList {
        my %OPTS = @_;
        my $email = $OPTS{'email'};
        my $newname = $OPTS{'newname'};
        my $CGServerAddress = "91.230.195.210";
        my $PostmasterLogin = 'postmaster';
        my $PostmasterPassword = postmaster_pass();
        my $cli = new CGP::CLI( { PeerAddr => $CGServerAddress,
                            PeerPort => 106,
                            login => $PostmasterLogin,
                            password => $PostmasterPassword } );
        unless($cli) {
                $logger->warn("Can't login to CGPro: ".$CGP::ERR_STRING);
                exit(0);
        }
        $cli->RenameList("$email","$newname");
        my $error_msg = $cli->getErrMessage();
        my @result;
        if ($error_msg eq "OK") {
                push( @result, { email => "$email" } );
        } else {
                $Cpanel::CPERROR{'CommuniGate'} = $error_msg;
        }
        return @result;
}


# Mailing List Global Variables for Settings Page

my @IndexesToValues_OwnerCheck;
my %ValuesToIndexes_OwnerCheck;
my @IndexesToValues_Charset;
my %ValuesToIndexes_Charset;
my %ValuesToIndexes_Subscribe;
my @IndexesToValues_Subscribe;
my %ValuesToIndexes_SaveRequests;
my @IndexesToValues_SaveRequests;
my %ValuesToIndexes_Distribution;
my @IndexesToValues_Distribution;

sub MLSettingsSetIndexToValue {
	@IndexesToValues_OwnerCheck = ( "Return-Path", "IP Addresses", "Authentication" );
	@IndexesToValues_Charset = ("iso-8859-1","windows-1252","iso-2022-jp","euc-jp","shift-jis","koi8-r","iso-8859-5","windows-1251","cp866","koi8-u","iso-8859-2","windows-1250","iso-8859-7","windows-1253","iso-8859-8","windows-1255","iso-8859-9","windows-1254","iso-8859-4","windows-1257","big5","gb2312","gb18030","gbk","euc-tw","iso-2022-kr","euc-kr","ks_c_5601-1987","iso-8859-6","windows-1256","iso-8859-11","windows-874","iso-8859-3","iso-8859-10","iso-8859-13","iso-8859-14","iso-8859-15","iso-8859-16","windows-1258","utf-8");
	@IndexesToValues_Subscribe = ("nobody","moderated","this domain only","locals only","anybody");
	@IndexesToValues_SaveRequests= ("no","accepted","rejected","all");
	@IndexesToValues_Distribution = ("feed","null","banned","digest","index");
	@IndexesToValues_Postings = ("from owner only","moderated","from subscribers","moderate guests","from anybody"); 
	@IndexesToValues_Format = ("plain text only","text only","text alternative","anything");
	@IndexesToValues_SizeLimit = ("unlimited","0","1024","3K","10K","30K","100K","300K","1024K","3M","10M","300M");
	@IndexesToValues_CoolOffPeriod= ("1h","2h","3h","6h","12h","1d","2d","3d","5d","7d","10d");
	@IndexesToValues_UnsubBouncedPeriod= ("1h","2h","3h","6h","12h","1d","2d","3d","5d","7d","10d");
	@IndexesToValues_CleanupPeriod= ("1h","2h","3h","6h","12h","1d","2d","3d","5d","7d","10d");
	@IndexesToValues_SaveReports=("no","unprocessed","all");
	@IndexesToValues_Reply=("to list","to sender");
	@IndexesToValues_ArchiveSizeLimit=("unlimited","0","1024","3K","10K","30K","100K","300K","1024K","3M","10M","30M","100M","300M","1024M","3G","10G","30G");
}

sub MLSettingsSetValueToIndex {
        %ValuesToIndexes_OwnerCheck = ( "Return-Path",0,"IP Addresses",1,"Authentication",2 );
	%ValuesToIndexes_Charset = ( "iso-8859-1",0,"windows-1252",1,"iso-2022-jp",2,"euc-jp",3,"shift-jis",4,"koi8-r",5,"iso-8859-5",6,"windows-1251",7,"cp866",8,"koi8-u",9,"iso-8859-2",10,"windows-1250",11,"iso-8859-7",12,"windows-1253",13,"iso-8859-8",14,"windows-1255",15,"iso-8859-9",16,"windows-1254",17,"iso-8859-4",18,"windows-1257",19,"big5",20,"gb2312",21,"gb18030",22,"gbk",23,"euc-tw",24,"iso-2022-kr",25,"euc-kr",26,"ks_c_5601-1987",27,"iso-8859-6",28,"windows-1256",29,"iso-8859-11",30,"windows-874",31,"iso-8859-3",32,"iso-8859-10",33,"iso-8859-13",34,"iso-8859-14",35,"iso-8859-15",36,"iso-8859-16",37,"windows-1258",38,"utf-8",39);
	%ValuesToIndexes_Subscribe= ("nobody",0,"moderated",1,"this domain only",2,"locals only",3,"anybody",4);
	%ValuesToIndexes_SaveRequests= ("no",0,"accepted",1,"rejected",2,"all",3);
	%ValuesToIndexes_Distribution = ("feed",0,"null",1,"banned",2,"digest",3,"index",4);
	%ValuesToIndexes_Postings = ("from owner only",0,"moderated",1,"from subscribers",2,"moderate guests",3,"from anybody",4); 
	%ValuesToIndexes_Format = ("plain text only",0,"text only",1,"text alternative",2,"anything",3);
	%ValuesToIndexes_SizeLimit = ("unlimited",0,"0",1,"1024",2,"3K",3,"10K",4,"30K",5,"100K",6,"300K",7,"1024K",8,"3M",9,"10M",10,"300M",11);
	%ValuesToIndexes_CoolOffPeriod = ("1h",0,"2h",1,"3h",2,"6h",3,"12h",4,"1d",5,"2d",6,"3d",7,"5d",8,"7d",9,"10d",10);
	%ValuesToIndexes_UnsubBouncedPeriod= ("1h",0,"2h",1,"3h",2,"6h",3,"12h",4,"1d",5,"2d",6,"3d",7,"5d",8,"7d",9,"10d",10);
	%ValuesToIndexes_CleanupPeriod= ("1h",0,"2h",1,"3h",2,"6h",3,"12h",4,"1d",5,"2d",6,"3d",7,"5d",8,"7d",9,"10d",10);
	%ValuesToIndexes_SaveReports=("no",0,"unprocessed",1,"all",2);
	%ValuesToIndexes_Reply=("to list",0,"to sender",1);
	%ValuesToIndexes_ArchiveSizeLimit=("unlimited",0,"0",1,"1024",2,"3K",3,"10K",4,"30K",5,"100K",6,"300K",7,"1024K",8,"3M",9,"10M",10,"30M",11,"100M",12,"300M",13,"1024M",14,"3G",15,"10G",16,"30G",17);

	
}


sub api2_GetListSettings {

	# Select values : 
	MLSettingsSetValueToIndex();

        my %OPTS = @_;
        my $email = $OPTS{'email'};
        my $CGServerAddress = "91.230.195.210";
        my $PostmasterLogin = 'postmaster';
        my $PostmasterPassword = postmaster_pass();
        my $cli = new CGP::CLI( { PeerAddr => $CGServerAddress,
                            PeerPort => 106,
                            login => $PostmasterLogin,
                            password => $PostmasterPassword } );
        unless($cli) {
                $logger->warn("Can't login to CGPro: ".$CGP::ERR_STRING);
                exit(0);
        }
        my $listSettings = $cli->GetList("$email");
        my $error_msg = $cli->getErrMessage();
        my @result;
        if ($error_msg eq "OK") {
		foreach (keys %$listSettings) {
			my $key=$_;
			my $value = @$listSettings{$key};
                	push( @result, { "$key" => "$value" } );
			if ($key eq "OwnerCheck") { 
				$Cpanel::CPDATA{"$key"} = $ValuesToIndexes_OwnerCheck{$value};
			} elsif ($key eq "Charset") {
				$Cpanel::CPDATA{"$key"} = $ValuesToIndexes_Charset{$value};
                        } elsif ($key eq "Subscribe") {
                                $Cpanel::CPDATA{"$key"} = $ValuesToIndexes_Subscribe{$value};
                        } elsif ($key eq "SaveRequests") {
                                $Cpanel::CPDATA{"$key"} = $ValuesToIndexes_SaveRequests{$value};
                        } elsif ($key eq "Distribution") {
                                $Cpanel::CPDATA{"$key"} = $ValuesToIndexes_Distribution{$value};
                        } elsif ($key eq "Postings") {
                                $Cpanel::CPDATA{"$key"} = $ValuesToIndexes_Postings{$value};
                        } elsif ($key eq "Format") {
                                $Cpanel::CPDATA{"$key"} = $ValuesToIndexes_Format{$value};
                       } elsif ($key eq "SizeLimit") {
                                $Cpanel::CPDATA{"$key"} = $ValuesToIndexes_SizeLimit{$value};
                       } elsif ($key eq "CoolOffPeriod") {
                                $Cpanel::CPDATA{"$key"} = $ValuesToIndexes_CoolOffPeriod{$value};
                       } elsif ($key eq "UnsubBouncedPeriod") {
                                $Cpanel::CPDATA{"$key"} = $ValuesToIndexes_UnsubBouncedPeriod{$value};
                       } elsif ($key eq "CleanupPeriod") {
                                $Cpanel::CPDATA{"$key"} = $ValuesToIndexes_CleanupPeriod{$value};
                       } elsif ($key eq "SaveReports") {
                                $Cpanel::CPDATA{"$key"} = $ValuesToIndexes_SaveReports{$value};
                       } elsif ($key eq "Reply") {
                                $Cpanel::CPDATA{"$key"} = $ValuesToIndexes_Reply{$value};
                      } elsif ($key eq "ArchiveSizeLimit") {
                                $Cpanel::CPDATA{"$key"} = $ValuesToIndexes_ArchiveSizeLimit{$value};
                     } elsif ($key eq "DigestFormat") {
                                $Cpanel::CPDATA{"$key"} = $value;
				$Cpanel::CPDATA{"$key"} =~ s/ /_/g;
			} else {
				$Cpanel::CPDATA{"$key"} = "$value";
			}
  		}
        } else {
                $Cpanel::CPERROR{'CommuniGate'} = $error_msg;
        }
        return @result;
}

#Used to set values
sub html_to_text {
 my $text=shift;
 $text =~ s/\r//g;
 $text =~ s/&quot;/\\\"/g;
 $text =~ s/&lt;/</g;
 $text =~ s/&gt;/>/g;
 $text =~ s/&amp;/\&/g; 
 return($text);
}

sub html_to_text_out {
 my $text=shift;
 $text =~ s/\r//g;
 $text =~ s/&quot;/\"/g;
 $text =~ s/&lt;/</g;
 $text =~ s/&gt;/>/g;
 $text =~ s/&amp;/\&/g;
 return($text);
}


sub api2_SetListSettings {

      # Select values : 
        MLSettingsSetIndexToValue();

        my %OPTS = @_;
        my $email = $OPTS{'email'};
        my $CGServerAddress = "91.230.195.210";
        my $PostmasterLogin = 'postmaster';
        my $PostmasterPassword = postmaster_pass();
        my $cli = new CGP::CLI( { PeerAddr => $CGServerAddress,
                            PeerPort => 106,
                            login => $PostmasterLogin,
                            password => $PostmasterPassword } );
        unless($cli) {
                $logger->warn("Can't login to CGPro: ".$CGP::ERR_STRING);
                exit(0);
        }
        my $listSettings;
	@$listSettings{'Charset'} = @IndexesToValues_Charset[$OPTS{'Charset'}];
	@$listSettings{'OwnerCheck'} = @IndexesToValues_OwnerCheck[$OPTS{'OwnerCheck'}];
	@$listSettings{'Subscribe'} = @IndexesToValues_Subscribe[$OPTS{'Subscribe'}];
	@$listSettings{'SaveRequests'} = @IndexesToValues_SaveRequests[$OPTS{'SaveRequests'}];
	@$listSettings{'Distribution'} = @IndexesToValues_Distribution[$OPTS{'Distribution'}];
	@$listSettings{'Confirmation'} = ($OPTS{'Confirmation'}?'YES':'NO');
	@$listSettings{'ConfirmationSubject'} = html_to_text($OPTS{'ConfirmationSubject'});
	@$listSettings{'ConfirmationText'} = html_to_text($OPTS{'ConfirmationText'});
	@$listSettings{'Postings'} = @IndexesToValues_Postings[$OPTS{'Postings'}];
	@$listSettings{'FirstModerated'} = $OPTS{'FirstModerated'};
	@$listSettings{'Format'} = @IndexesToValues_Format[$OPTS{'Format'}];
	@$listSettings{'SizeLimit'} = @IndexesToValues_SizeLimit[$OPTS{'SizeLimit'}];
	@$listSettings{'CheckDigestSubject'} = ($OPTS{'CheckDigestSubject'}?'YES':'NO');
	@$listSettings{'CheckCharset'} = ($OPTS{'CheckCharset'}?'YES':'NO');
	@$listSettings{'ListFields'} = html_to_text($OPTS{'ListFields'});
	@$listSettings{'HideFromAddress'} = ($OPTS{'HideFromAddress'}?'YES':'NO');
	@$listSettings{'TillConfirmed'} = ($OPTS{'TillConfirmed'}?'YES':'NO');
	@$listSettings{'CoolOffPeriod'} = @IndexesToValues_CoolOffPeriod[$OPTS{'CoolOffPeriod'}];
	@$listSettings{'MaxBounces'} = $OPTS{'MaxBounces'};
	@$listSettings{'UnsubBouncedPeriod'} = @IndexesToValues_UnsubBouncedPeriod[$OPTS{'UnsubBouncedPeriod'}];
	@$listSettings{'FatalWeight'} = $OPTS{'FatalWeight'};
	@$listSettings{'FailureNotification'} = ($OPTS{'FailureNotification'}?'YES':'NO');
	@$listSettings{'CleanupPeriod'} = @IndexesToValues_CleanupPeriod[$OPTS{'CleanupPeriod'}];
	@$listSettings{'SaveReports'} = @IndexesToValues_SaveReports[$OPTS{'SaveReports'}];
        @$listSettings{'WarningSubject'} = html_to_text($OPTS{'WarningSubject'});
        @$listSettings{'WarningText'} = html_to_text($OPTS{'WarningText'});
        @$listSettings{'FeedSubject'} = html_to_text($OPTS{'FeedSubject'});
	@$listSettings{'Reply'} = @IndexesToValues_Reply[$OPTS{'Reply'}];
	@$listSettings{'FeedPrefixMode'} = ($OPTS{'FeedPrefixMode'}?'YES':'NO');
        @$listSettings{'FeedHeader'} = html_to_text($OPTS{'FeedHeader'});
        @$listSettings{'FeedTrailer'} = html_to_text($OPTS{'FeedTrailer'});
        @$listSettings{'PolicySubject'} = html_to_text($OPTS{'PolicySubject'});
        @$listSettings{'PolicyText'} = html_to_text($OPTS{'PolicyText'});
        @$listSettings{'ByeSubject'} = html_to_text($OPTS{'ByeSubject'});
        @$listSettings{'ByeText'} = html_to_text($OPTS{'ByeText'});
	@$listSettings{'Store'} = ($OPTS{'Store'}?'YES':'NO');
	@$listSettings{'ArchiveSizeLimit'} = @IndexesToValues_ArchiveSizeLimit[$OPTS{'ArchiveSizeLimit'}];
	@$listSettings{'ArchiveMessageLimit'} = $OPTS{'ArchiveMessageLimit'};
	@$listSettings{'ArchiveSwapPeriod'} = $OPTS{'ArchiveSwapPeriod'};
	@$listSettings{'Browse'} = $OPTS{'Browse'};
	@$listSettings{'DigestPeriod'} = $OPTS{'DigestPeriod'};
	@$listSettings{'DigestSizeLimit'} = $OPTS{'DigestSizeLimit'};
	@$listSettings{'DigestMessageLimit'} = $OPTS{'DigestMessageLimit'};
	@$listSettings{'DigestTimeOfDay'} = $OPTS{'DigestTimeOfDay'};
        @$listSettings{'DigestSubject'} = html_to_text($OPTS{'DigestSubject'});
	@$listSettings{'DigestFormat'} = $OPTS{'DigestFormat'};
        @$listSettings{'DigestHeader'} = html_to_text($OPTS{'DigestHeader'});
        @$listSettings{'TOCLine'} = html_to_text($OPTS{'TOCLine'});
        @$listSettings{'TOCTrailer'} = html_to_text($OPTS{'TOCTrailer'});
        @$listSettings{'DigestTrailer'} = html_to_text($OPTS{'DigestTrailer'});

	$cli->UpdateList("$email",$listSettings);
        my $error_msg = $cli->getErrMessage();
        my @result;
        if ($error_msg eq "OK") {
		#noop
        } else {
                $Cpanel::CPERROR{'CommuniGate'} = $error_msg;
        }
        return @result;
}


sub CommuniGate_PrintTextArea_api1 {
 my ($text) = @_;
 @lines = split(/\\e/,$text);
 foreach my $line (@lines) {
  $line = html_to_text_out($line);
  $line =~ s/\\"/&quot;/g;
  print "$line\n";
 }
}

sub api2_ListMailingListsSubs{
        my %OPTS = @_;
        my $listname = $OPTS{'listname'};
        my $CGServerAddress = "91.230.195.210";
        my $PostmasterLogin = 'postmaster';
        my $PostmasterPassword = postmaster_pass();
        my $cli = new CGP::CLI( { PeerAddr => $CGServerAddress,
                            PeerPort => 106,
                            login => $PostmasterLogin,
                            password => $PostmasterPassword } );
        unless($cli) {
                $logger->warn("Can't login to CGPro: ".$CGP::ERR_STRING);
                exit(0);
        }
        my @result;
        my $subs_array=$cli->ListSubscribers($listname);
	foreach my $sub (@$subs_array) {
		my $SubInfos=$cli->GetSubscriberInfo($listname,$sub); 	
		my $postmode = @$SubInfos{'posts'};
		my $numpost;
		my ($mod1sel,$mod2sel,$mod3sel,$mod4sel,$mod5sel,$modallsel,$unmodsel,$nopostsel)=("","","","","","","","");
		my ($r_feedsel,$r_indexsel,$r_digestsel,$r_nullsel,$r_bannedsel,$r_subscribesel,$r_unsubscribesel) = ("","","","","","","");
		if ($postmode eq "moderateAll") {$modallsel="selected=\"selected\"";}
                elsif ($postmode eq "prohibited") {$nopostsel="selected=\"selected\"";}
		elsif (($postmode =~ /#[0-9]+/) || ($postmode eq "")) {
			$numpost = $postmode;
			$numpost =~ s/#//g;
			if ($postmode eq "") {$numpost = 0;};
                        $unmodsel="selected=\"selected\"";
                }
		elsif (@$SubInfos{'posts'}->[0]) {
		 	$postmode = "next @$SubInfos{'posts'}->[0] moderated";
			if (@$SubInfos{'posts'}->[0] == 1) { $mod1sel="selected=\"selected\"";}
			if (@$SubInfos{'posts'}->[0] == 2) { $mod2sel="selected=\"selected\"";}
			if (@$SubInfos{'posts'}->[0] == 3) { $mod3sel="selected=\"selected\"";}
			if (@$SubInfos{'posts'}->[0] == 4) { $mod4sel="selected=\"selected\"";}
			if (@$SubInfos{'posts'}->[0] == 5) { $mod5sel="selected=\"selected\"";}
                }
		if (@$SubInfos{'mode'} eq "feed") { $r_feedsel="selected=\"selected\"";}
		if (@$SubInfos{'mode'} eq "index") { $r_indexsel="selected=\"selected\"";}
		if (@$SubInfos{'mode'} eq "digest") { $r_digestsel="selected=\"selected\"";}
		if (@$SubInfos{'mode'} eq "null") { $r_nullsel="selected=\"selected\"";}
		if (@$SubInfos{'mode'} eq "banned") { $r_bannedsel="selected=\"selected\"";}
		if (@$SubInfos{'mode'} eq "subscribe") { $r_subscribesel="selected=\"selected\"";}
		if (@$SubInfos{'mode'} eq "unsubscribe") { $r_unsubscribesel="selected=\"selected\"";}
		push (@result, {subemail => "$sub" ,rcvmode => "@$SubInfos{'mode'}", postmode => "$postmode" , mod1sel => "$mod1sel",mod2sel=>"$mod2sel",mod3sel=>"$mod3sel",mod4sel=>"$mod4sel",mod5sel=>"$mod5sel",modallsel=>"$modallsel",unmodsel=>"$unmodsel",nopostsel=>"$nopostsel",r_feedsel=>"$r_feedsel",r_indexsel=>"$r_indexsel",r_digestsel=>"$r_digestsel",r_nullsel=>"$r_nullsel",r_bannedsel=>"$r_bannedsel", numpost=>"$numpost", r_subscribesel=>"$r_subscribesel", r_unsubscribesel=>"$r_unsubscribesel"});

	}
        return @result;
}       

sub api2_SetSubSettings {
        my %OPTS = @_;
        my $listname = $OPTS{'listname'};
        my $subemail = $OPTS{'subemail'};
        my $CGPMLReceivingMode= $OPTS{'CGPMLReceivingMode'};
        my $CGPMLPostingMode= $OPTS{'CGPMLPostingMode'};
        my $CGServerAddress = "91.230.195.210";
        my $PostmasterLogin = 'postmaster';
        my $PostmasterPassword = postmaster_pass();
        my $cli = new CGP::CLI( { PeerAddr => $CGServerAddress,
                            PeerPort => 106,
                            login => $PostmasterLogin,
                            password => $PostmasterPassword } );
        unless($cli) {      
                $logger->warn("Can't login to CGPro: ".$CGP::ERR_STRING);
                exit(0);
        }       
	if ($CGPMLPostingMode eq "mod1") {$CGPMLPostingMode=1;};
	if ($CGPMLPostingMode eq "mod2") {$CGPMLPostingMode=2;};
	if ($CGPMLPostingMode eq "mod3") {$CGPMLPostingMode=3;};
	if ($CGPMLPostingMode eq "mod4") {$CGPMLPostingMode=4;};
	if ($CGPMLPostingMode eq "mod5") {$CGPMLPostingMode=5;};
	if ($CGPMLPostingMode eq "modall") {$CGPMLPostingMode="MODERATEALL";};
	if ($CGPMLPostingMode eq "unmod") {$CGPMLPostingMode="UNMODERATED";};
	if ($CGPMLPostingMode eq "nopost") {$CGPMLPostingMode="PROHIBITED";};
	$cli->SetPostingMode("$listname","$subemail","$CGPMLPostingMode");
	$cli->List("$listname","$CGPMLReceivingMode","$subemail");
        my $error_msg = $cli->getErrMessage();
        if ($error_msg eq "OK") {
                #noop
        } else {
                $Cpanel::CPERROR{'CommuniGate'} = $error_msg; 
        }               
        return @result; 

}

sub api2_UnSub {
        my %OPTS = @_;
        my $listname = $OPTS{'listname'};
        my $subemail = $OPTS{'subemail'};
        my $CGServerAddress = "91.230.195.210";
        my $PostmasterLogin = 'postmaster';
        my $PostmasterPassword = postmaster_pass();
        my $cli = new CGP::CLI( { PeerAddr => $CGServerAddress,
                            PeerPort => 106,
                            login => $PostmasterLogin,
                            password => $PostmasterPassword } );
        unless($cli) {
                $logger->warn("Can't login to CGPro: ".$CGP::ERR_STRING);
                exit(0);
        }
        $cli->List("$listname","unsubscribe","$subemail");
        my $error_msg = $cli->getErrMessage();
        if ($error_msg eq "OK") {
                #noop
        } else {
                $Cpanel::CPERROR{'CommuniGate'} = $error_msg;
        }
        return @result;

}

sub api2_Sub {
        my %OPTS = @_;
        my $listname = $OPTS{'listname'};
        my $subemail = $OPTS{'subemail'};
        my $CGPMLReceivingMode= $OPTS{'CGPMLReceivingMode'};
        my $CGPMLPostingMode= $OPTS{'CGPMLPostingMode'};
        my $CGServerAddress = "91.230.195.210";
        my $PostmasterLogin = 'postmaster';
        my $PostmasterPassword = postmaster_pass();
        my $cli = new CGP::CLI( { PeerAddr => $CGServerAddress,
                            PeerPort => 106,
                            login => $PostmasterLogin,
                            password => $PostmasterPassword } );
        unless($cli) {
                $logger->warn("Can't login to CGPro: ".$CGP::ERR_STRING);
                exit(0);
        }
        $cli->List("$listname","$CGPMLReceivingMode","$subemail");
 	if ($CGPMLPostingMode eq "mod1") {$CGPMLPostingMode=1;};
        if ($CGPMLPostingMode eq "mod2") {$CGPMLPostingMode=2;};
        if ($CGPMLPostingMode eq "mod3") {$CGPMLPostingMode=3;};
        if ($CGPMLPostingMode eq "mod4") {$CGPMLPostingMode=4;};
        if ($CGPMLPostingMode eq "mod5") {$CGPMLPostingMode=5;};
        if ($CGPMLPostingMode eq "modall") {$CGPMLPostingMode="MODERATEALL";};
        if ($CGPMLPostingMode eq "unmod") {$CGPMLPostingMode="UNMODERATED";};
        if ($CGPMLPostingMode eq "nopost") {$CGPMLPostingMode="PROHIBITED";};

	$cli->SetPostingMode("$listname","$subemail","$CGPMLPostingMode");
        my $error_msg = $cli->getErrMessage();
        if ($error_msg eq "OK") {
                #noop
        } else {
                $Cpanel::CPERROR{'CommuniGate'} = $error_msg;
        }
        return @result;
}

sub api2_ListGroups{
        my %OPTS = @_;
        @domains = Cpanel::Email::listmaildomains();
        my $CGServerAddress = "91.230.195.210";
        my $PostmasterLogin = 'postmaster';
        my $PostmasterPassword = postmaster_pass();
        my $cli = new CGP::CLI( { PeerAddr => $CGServerAddress,
                            PeerPort => 106,
                            login => $PostmasterLogin,
                            password => $PostmasterPassword } );
        unless($cli) {
                $logger->warn("Can't login to CGPro: ".$CGP::ERR_STRING);
                exit(0);
        }
        my @result;
        foreach my $domain (@domains) {
                my $groups=$cli->ListGroups($domain);
                foreach $groupName (sort @$groups) {
                 push( @result, { list => "$groupName\@$domain" , domain =>"$domain"} );
                }
        }
        return @result;
}

sub api2_DelGroup{
        my %OPTS = @_;
        my $listname = $OPTS{'email'};
        my $CGServerAddress = "91.230.195.210";
        my $PostmasterLogin = 'postmaster';
        my $PostmasterPassword = postmaster_pass();
        my $cli = new CGP::CLI( { PeerAddr => $CGServerAddress,
                            PeerPort => 106,
                            login => $PostmasterLogin,
                            password => $PostmasterPassword } );
        unless($cli) {
                $logger->warn("Can't login to CGPro: ".$CGP::ERR_STRING);
                exit(0);
        }
        $cli->DeleteGroup("$listname");
        my $error_msg = $cli->getErrMessage();
        my @result;
        if ($error_msg eq "OK") {
                push( @result, { email => "$listname" } );
        } else {
                $Cpanel::CPERROR{'CommuniGate'} = $error_msg;
        }
        return @result;
}

sub api2_RenameGroup {
        my %OPTS = @_;
        my $email = $OPTS{'email'};
        my $newname = $OPTS{'newname'};
        my $CGServerAddress = "91.230.195.210";
        my $PostmasterLogin = 'postmaster';
        my $PostmasterPassword = postmaster_pass();
        my $cli = new CGP::CLI( { PeerAddr => $CGServerAddress,
                            PeerPort => 106,
                            login => $PostmasterLogin,
                            password => $PostmasterPassword } );
        unless($cli) {
                $logger->warn("Can't login to CGPro: ".$CGP::ERR_STRING);
                exit(0);
        }
        $cli->RenameGroup("$email","$newname");
        my $error_msg = $cli->getErrMessage();
        my @result;
        if ($error_msg eq "OK") {
                push( @result, { email => "$email" } );
        } else {
                $Cpanel::CPERROR{'CommuniGate'} = $error_msg;
        }
        return @result;
}



sub api2_AddGroup{
        my %OPTS = @_;
        my $domain = $OPTS{'domain'};
        my $listname = $OPTS{'email'};
        my $spectre = $OPTS{'spectre'};
        my $realname = $OPTS{'realname'};
        my $CGServerAddress = "91.230.195.210";
        my $PostmasterLogin = 'postmaster';
        my $PostmasterPassword = postmaster_pass();
        my $cli = new CGP::CLI( { PeerAddr => $CGServerAddress,
                            PeerPort => 106,
                            login => $PostmasterLogin,
                            password => $PostmasterPassword } );
        unless($cli) {
                $logger->warn("Can't login to CGPro: ".$CGP::ERR_STRING);
                exit(0);
        }
        $cli->CreateGroup("$listname\@$domain");
        my $error_msg = $cli->getErrMessage();
        my @result;
        if ($error_msg eq "OK") {
                push( @result, { email => "$listname", domain => "$domain" } );
        } else {
                $Cpanel::CPERROR{'CommuniGate'} = $error_msg;
        }

	# set real name
	$Settings=$cli->GetGroup("$listname\@$domain");
  	@$Settings{'RealName'}=$realname; 
  	$cli->SetGroup("$listname\@$domain",$Settings);
	$cli->Logout();


	# Create rule if posting is restricted to members : (spectre = 0)
	if (!$spectre) {
		SetGroupInternal("$listname\@$domain");
	}

        return @result;
}


sub api2_ListGroupMembers {
        my %OPTS = @_;
        my $listname = $OPTS{'listname'};
        my $CGServerAddress = "91.230.195.210";
        my $PostmasterLogin = 'postmaster';
        my $PostmasterPassword = postmaster_pass();
        my $cli = new CGP::CLI( { PeerAddr => $CGServerAddress,
                            PeerPort => 106,
                            login => $PostmasterLogin,
                            password => $PostmasterPassword } );
        unless($cli) {
                $logger->warn("Can't login to CGPro: ".$CGP::ERR_STRING);
                exit(0);
        }
        my @result;
	my $Settings;
	$Settings=$cli->GetGroup($listname);
        foreach (keys %$Settings) {
      		my $data=@$Settings{$_};
      		if (ref ($data) eq 'ARRAY') {
        		foreach my $member (@$data) {
					push (@result, {subemail => "$member"});
        		}
		}
    	}
        return @result;
}      


sub api2_AddGroupMember {
        my %OPTS = @_;
        my $listname = $OPTS{'listname'};
        my $subemail = $OPTS{'subemail'};
	if (!$subemail) {
	 $Cpanel::CPERROR{'InputWrong'} = "Group Name must not be empty";
	 return;
	}
        my $domain = $OPTS{'domain'};
        my $CGServerAddress = "91.230.195.210";
        my $PostmasterLogin = 'postmaster';
        my $PostmasterPassword = postmaster_pass();
        my $cli = new CGP::CLI( { PeerAddr => $CGServerAddress,
                            PeerPort => 106,
                            login => $PostmasterLogin,
                            password => $PostmasterPassword } );
        unless($cli) {
                $logger->warn("Can't login to CGPro: ".$CGP::ERR_STRING);
                exit(0);
        }

	my $Settings=$cli->GetGroup($listname);
  	@$Settings{'Members'}=[] unless(@$Settings{'Members'});
  	my $Members=@$Settings{'Members'};
  	push(@$Members,"$subemail\@$domain");
  	$cli->SetGroup($listname,$Settings);
        my $error_msg = $cli->getErrMessage();
        if ($error_msg eq "OK") {
                #noop
        } else {
                $Cpanel::CPERROR{'CommuniGate'} = $error_msg;
        }
	if (IsGroupInternal($listname)) {
		SetGroupExternal($listname);
		SetGroupInternal($listname);
	}
        return @result;
}

sub api2_RemoveGroupMember {
        my %OPTS = @_;
        my $listname = $OPTS{'listname'};
        my $subemail = $OPTS{'subemail'};
        my $CGServerAddress = "91.230.195.210";
        my $PostmasterLogin = 'postmaster';
        my $PostmasterPassword = postmaster_pass();
        my $cli = new CGP::CLI( { PeerAddr => $CGServerAddress,
                            PeerPort => 106,
                            login => $PostmasterLogin,
                            password => $PostmasterPassword } );
        unless($cli) {      
                $logger->warn("Can't login to CGPro: ".$CGP::ERR_STRING);
                exit(0);
        }       
        
        my $Settings=$cli->GetGroup($listname);
        @$Settings{'Members'}=[] unless(@$Settings{'Members'});
        my $Members=@$Settings{'Members'};
        my $NewMembers=[];
	my $found=0;
	foreach my $member (@$Members) {
         	if ((!($subemail eq $member)) || $found) {push(@$NewMembers,$member);};
		if ($subemail eq $member) {$found=1;}
        }
	@$Settings{'Members'}=$NewMembers;
        $cli->SetGroup($listname,$Settings);
        my $error_msg = $cli->getErrMessage();
        if ($error_msg eq "OK") {
                #noop
        } else {
                $Cpanel::CPERROR{'CommuniGate'} = $error_msg;
        }       
        if (IsGroupInternal($listname)) {
                SetGroupExternal($listname);
                SetGroupInternal($listname);
        }
        return @result;
}

sub api2_GetGroupSettings {

        my %OPTS = @_;
        my $email = $OPTS{'email'};
        my $CGServerAddress = "91.230.195.210";
        my $PostmasterLogin = 'postmaster';
        my $PostmasterPassword = postmaster_pass();
        my $cli = new CGP::CLI( { PeerAddr => $CGServerAddress,
                            PeerPort => 106,
                            login => $PostmasterLogin,
                            password => $PostmasterPassword } );
        unless($cli) {
                $logger->warn("Can't login to CGPro: ".$CGP::ERR_STRING);
                exit(0);
        }
        my $listSettings = $cli->GetGroup("$email");
        my $error_msg = $cli->getErrMessage();
        my @result;
        if ($error_msg eq "OK") {
                foreach (keys %$listSettings) {
                        my $key=$_;
                        my $value = @$listSettings{$key};
                        push( @result, { "$key" => "$value" } );
                        $Cpanel::CPDATA{"$key"} = "$value";
             }
        } else {
                $Cpanel::CPERROR{'CommuniGate'} = $error_msg;
        }
	if (IsGroupInternal($email)) {
		push( @result, { "spectre" => "0" } );
                $Cpanel::CPDATA{"spectre"} = "0";
	} else {
		push( @result, { "spectre" => "1" } );
                $Cpanel::CPDATA{"spectre"} = "1";
	}
        return @result;
}

sub api2_SetAutoresponder {
        my %OPTS = @_;
	my $email = $OPTS{'email'};
        my $CGServerAddress = "91.230.195.210";
        my $PostmasterLogin = 'postmaster';
        my $PostmasterPassword = postmaster_pass();
        my $cli = new CGP::CLI( { PeerAddr => $CGServerAddress,
				  PeerPort => 106,
				  login => $PostmasterLogin,
				  password => $PostmasterPassword } );
        unless($cli) {
	  $logger->warn("Can't login to CGPro: ".$CGP::ERR_STRING);
	  exit(0);
        }

	my $body = '+Subject: ' . $OPTS{'subject'} . "\n";
	$body .= "In-Reply-To: ^I\n";
	$body .= "From: " . $OPTS{'from'} . " <" . $OPTS{'email'} . '@' . $OPTS{'domain'} . ">\n\n";
	$body .= $OPTS{'body'};

	my $conditions = [
			  ["Human Generated", "---"],
			  ['From', "not in", "#RepliedAddresses"]
			 ];
	if ($OPTS{'start'}) {
	  my $start = scalar localtime ($OPTS{'start'});
	  $start =~ m/^\w{3}\s+(\w{3})\s+(\d+)\s+(.*?)\s+(\d{4})$/;
	  $start = sprintf('%02d', $2) . " $1 $4 $3";
	  push @$conditions, ["Current Date", "greater than", $start];
	}
	if ($OPTS{'stop'}) {
	  my $stop = scalar localtime ($OPTS{'stop'});
	  $stop =~ m/^\w{3}\s+(\w{3})\s+(\d+)\s+(.*?)\s+(\d{4})$/;
	  $stop = sprintf('%02d', $2) . " $1 $4 $3";
	  push @$conditions, ["Current Date", "less than", $stop];
	}

	my $rule = [2,"#Vacation",$conditions,[
				     [
				      "Reply with",
				      $body
				     ],
				     ["Remember 'From' in", 'RepliedAddresses']
				    ]];

        $cli->UpdateAutoresponder(email => $OPTS{'email'} . '@' . $OPTS{'domain'}, rule => $rule );
        $cli->Logout();
}

sub api2_DeleteAutoresponder {
        my %OPTS = @_;
        my $CGServerAddress = "91.230.195.210";
        my $PostmasterLogin = 'postmaster';
        my $PostmasterPassword = postmaster_pass();
        my $cli = new CGP::CLI( { PeerAddr => $CGServerAddress,
				  PeerPort => 106,
				  login => $PostmasterLogin,
				  password => $PostmasterPassword } );
        unless($cli) {
	  $logger->warn("Can't login to CGPro: ".$CGP::ERR_STRING);
	  exit(0);
        }
	my $rule = undef;

        $cli->UpdateAutoresponder(email => $OPTS{'email'}, rule => $rule );
        $cli->Logout();
}

sub api2_ListAutoresponders {
        my %OPTS = @_;

	my @domains = Cpanel::Email::listmaildomains();
  	my $CGServerAddress = "91.230.195.210";
        my $PostmasterLogin = 'postmaster';
        my $PostmasterPassword = postmaster_pass();     
        my $cli = new CGP::CLI( { PeerAddr => $CGServerAddress,
                            PeerPort => 106,
                            login => $PostmasterLogin,
                            password => $PostmasterPassword } );
        unless($cli) {
                $logger->warn("Can't login to CGPro: ".$CGP::ERR_STRING);
                exit(0);
        }
	my @result;
        foreach my $domain (@domains) {
                my $accounts=$cli->ListAccounts($domain);
                my $userName;
                foreach $userName (sort keys %$accounts) {      
		  my $account = "$userName\@$domain";
		  if ($OPTS{regex}) {
		    my $qstr = $OPTS{regex};
		    next unless $account =~ /$qstr/;
		  }
		  my $rule = $cli->GetAutoresponder(account => $account);
		  if ( $rule->[0] == 2 ) {
		    my $subject = $rule->[3]->[0]->[1];
		    $subject =~ s/^\+Subject\: (.*?)\\e.*?$/$1/;
		    push( @result, {
				    email => $account, 
				    subject => $subject, 
				    domain => $domain, 
				   });
		  }
		}
	}
	return @result;
}

sub api2_EditAutoresponder {
  my %OPTS = @_;

  my $CGServerAddress = "91.230.195.210";
  my $PostmasterLogin = 'postmaster';
  my $PostmasterPassword = postmaster_pass();     
  my $cli = new CGP::CLI( { PeerAddr => $CGServerAddress,
                            PeerPort => 106,
                            login => $PostmasterLogin,
                            password => $PostmasterPassword } );
  unless($cli) {
    $logger->warn("Can't login to CGPro: ".$CGP::ERR_STRING);
    exit(0);
  }

  my $account = $OPTS{email};
  if ($OPTS{regex}) {
    my $qstr = $OPTS{regex};
    next unless $account =~ /$qstr/;
  }
  my $rule = $cli->GetAutoresponder(account => $account);
  my $replay = $rule->[3]->[0]->[1];
  $replay =~ m/^\+Subject\: (.*?)\\e.*?\\e\\e(.*?)$/;
  my $subject = $1;
  my $body = $2;
  $body =~ s/\\r\\e/\n/g;
  my $start = undef;
  my $stop = undef;
  for my $condition (@{$rule->[2]}) {
    if ($condition->[0] eq 'Current Date') {
      my %months = (
		    'Jan' => 0,
		    'Feb' => 1,
		    'Mar' => 2,
		    'Apr' => 3,
		    'May' => 4,
		    'Jun' => 5,
		    'Jul' => 6,
		    'Aug' => 7,
		    'Sep' => 8,
		    'Oct' => 9,
		    'Nov' => 10,
		    'Dec' => 11
		   );
      my @date = split " ", $condition->[2];
      if ($condition->[1] eq 'greater than') {
	$start = timelocal_nocheck( $date[5], $date[4], $date[3], $date[0], $months{$date[1]}, ($date[2]-1900) );
      } elsif ($condition->[1] eq 'less than') {
	$stop = timelocal_nocheck( $date[5], $date[4], $date[3], $date[0], $months{$date[1]}, ($date[2]-1900) );
      }
    }
  }
  
  return {
	  subject => $subject, 
	  body => $body,
	  start => $start,
	  stop => $stop
	 };
}


sub api2_ListForwardersBackups {
    my %OPTS = @_;
    
    my @domains = Cpanel::Email::listmaildomains();
    my $CGServerAddress = "91.230.195.210";
    my $PostmasterLogin = 'postmaster';
    my $PostmasterPassword = postmaster_pass();     
    my $cli = new CGP::CLI( { PeerAddr => $CGServerAddress,
			      PeerPort => 106,
			      login => $PostmasterLogin,
			      password => $PostmasterPassword } );
    unless($cli) {
	$logger->warn("Can't login to CGPro: ".$CGP::ERR_STRING);
	exit(0);
    }
    my @result;
    foreach my $domain (@domains) {
	my $accounts=$cli->ListAccounts($domain);
	my $domainFound = 0;
	foreach my $userName (sort keys %$accounts) {
	    my $Rules=$cli->GetAccountMailRules("$userName\@$domain") || die "Error: ".$cli->getErrMessage.", quitting";
	    foreach my $Rule (@$Rules) {
		if ($Rule->[1] eq "#Redirect" && $Rule->[3]->[0]->[1] ne '' ) {
		    push( @result, {
			domain => $domain
			  } );
		    $domainFound = 1;
		}
		last if $domainFound;
	    }
	    last if $domainFound;
	}
        next if $domainFound;
    }
    return @result;
}
sub api2_UploadForwarders {
    my $randdata = Cpanel::Rand::getranddata(32);
    $Cpanel::CPVAR{'forwardersimportid'} = $randdata;
    Cpanel::SafeDir::safemkdir( $Cpanel::homedir . '/tmp/forwardersimport', '0700' );
    my @RSD;
    local $Cpanel::IxHash::Modify = 'none';
  FILE:
    foreach my $file ( keys %Cpanel::FORM ) {
        next FILE if $file =~ m/^file-(.*)-key$/;
        next FILE if $file !~ m/^file-(.*)/;
        my $tmpfilepath = $Cpanel::FORM{$file};
        rename( $tmpfilepath, $Cpanel::homedir . '/tmp/forwardersimport/' . $randdata );
        push @RSD, { 'id' => $randdata };
        last;
    }
    return \@RSD;
}

sub api2_RestoreForwarders {
    my %OPTS = @_;
    
    my @domains = Cpanel::Email::listmaildomains();
    my $CGServerAddress = "91.230.195.210";
    my $PostmasterLogin = 'postmaster';
    my $PostmasterPassword = postmaster_pass();     
    my $cli = new CGP::CLI( { PeerAddr => $CGServerAddress,
			      PeerPort => 106,
			      login => $PostmasterLogin,
			      password => $PostmasterPassword } );
    unless($cli) {
	$logger->warn("Can't login to CGPro: ".$CGP::ERR_STRING);
	exit(0);
    }
    my @result;
    my $gzfile = $Cpanel::homedir . '/tmp/forwardersimport/' . $Cpanel::CPVAR{'forwardersimportid'};
    open(IN, "gunzip -c $gzfile |") || die "can't open pipe to $file";
    my @input = <IN>;
    close IN;
    unlink $gzfile;
    foreach my $domain (@domains) {
	my $accounts=$cli->ListAccounts($domain);
	foreach my $userName (sort keys %$accounts) {
	    my $email = "$userName\@$domain";
	    for my $row (@input) {
		if ( $row =~ m/^\Q$email\:/i ) {
		    my (undef, $fwdemail) = split '[\:\s]+', $row, 2;
		    chomp $fwdemail;
		    addforward(
			domain => $domain,
			email => $userName,
			fwdemail => $fwdemail,
			cli => $cli
			);
		    push @result, {row => $row};
		}
	    }
	}
    }
    return @result;
}

sub api2_ListAccountsBackups {
    my %OPTS = @_;
    
    my @domains = Cpanel::Email::listmaildomains();
    my $CGServerAddress = "91.230.195.210";
    my $PostmasterLogin = 'postmaster';
    my $PostmasterPassword = postmaster_pass();     
    my $cli = new CGP::CLI( { PeerAddr => $CGServerAddress,
			      PeerPort => 106,
			      login => $PostmasterLogin,
			      password => $PostmasterPassword } );
    unless($cli) {
	$logger->warn("Can't login to CGPro: ".$CGP::ERR_STRING);
	exit(0);
    }
    my @result;
    foreach my $domain (@domains) {
	my $accounts=$cli->ListAccounts($domain);
	foreach my $userName (sort keys %$accounts) {
	    push( @result, {
		domain => $domain
		  } );
	    last;
	}
    }
    return @result;
}

sub api2_GetAccountsBackups {
    my %OPTS = @_;
    my $CGServerAddress = "91.230.195.210";
    my $PostmasterLogin = 'postmaster';
    my $PostmasterPassword = postmaster_pass();     
    my $cli = new CGP::CLI( { PeerAddr => $CGServerAddress,
			      PeerPort => 106,
			      login => $PostmasterLogin,
			      password => $PostmasterPassword } );
    unless($cli) {
	$logger->warn("Can't login to CGPro: ".$CGP::ERR_STRING);
	exit(0);
    }
    my $domain = $OPTS{'domain'};
    my $accounts=$cli->ListAccounts($domain);
    my @result;
    foreach my $userName (sort keys %$accounts) {      
	my $accountData = $cli->GetAccountEffectiveSettings("$userName\@$domain");
	my $pass = $cli->GetAccountPlainPassword("$userName\@$domain");
	my $diskquota = @$accountData{'MaxAccountSize'} || '';
	$diskquota =~ s/M//g;
	push( @result, {
	    email => "$userName\@$domain", 
	    diskquota => "$diskquota", 
	    pass => "$pass"
 	      } );
    }
    return @result;
}



sub api2_SetGroupSettings {
        my %OPTS = @_;
        my $email = $OPTS{'email'};
        my $CGServerAddress = "91.230.195.210";
        my $PostmasterLogin = 'postmaster';
        my $PostmasterPassword = postmaster_pass();
        my $cli = new CGP::CLI( { PeerAddr => $CGServerAddress,
                            PeerPort => 106,
                            login => $PostmasterLogin,
                            password => $PostmasterPassword } );
        unless($cli) {
                $logger->warn("Can't login to CGPro: ".$CGP::ERR_STRING);
                exit(0);
        }

        $Settings=$cli->GetGroup($email);
        @$Settings{'RealName'}=$OPTS{'RealName'};
        @$Settings{'RemoveToAndCc'}=($OPTS{'RemoveToAndCc'}?'YES':'NO');;
        @$Settings{'Expand'}=($OPTS{'Expand'}?'YES':'NO');;
        @$Settings{'FinalDelivery'}=($OPTS{'FinalDelivery'}?'YES':'NO');;
        @$Settings{'RejectAutomatic'}=($OPTS{'RejectAutomatic'}?'YES':'NO');;
        @$Settings{'RemoveAuthor'}=($OPTS{'RemoveAuthor'}?'YES':'NO');;
        @$Settings{'SetReplyTo'}=($OPTS{'SetReplyTo'}?'YES':'NO');;
        $cli->SetGroup($email,$Settings);
        my $error_msg = $cli->getErrMessage();
        my @result;
        if ($error_msg eq "OK") {
                #noop
        } else {
                $Cpanel::CPERROR{'CommuniGate'} = $error_msg;
        }
	$cli->Logout();
	if ($OPTS{'spectre'} && IsGroupInternal($email)) {
		SetGroupExternal($email);
	}
	if (!$OPTS{'spectre'} && (!IsGroupInternal($email))) {
                SetGroupInternal($email);
        } 

        return @result;
}

sub IsGroupInternal {
  	my $groupwithdomain = shift;
	my @values = split("@",$groupwithdomain);
  	my $domain = @values[1]; 
  	my $group = @values[0]; 
        my $CGServerAddress = "91.230.195.210";
        my $PostmasterLogin = 'postmaster';
        my $PostmasterPassword = postmaster_pass();
        my $cli = new CGP::CLI( { PeerAddr => $CGServerAddress,
                            PeerPort => 106,
                            login => $PostmasterLogin,
                            password => $PostmasterPassword } );
        unless($cli) {      
                $logger->warn("Can't login to CGPro: ".$CGP::ERR_STRING);
                exit(0);
        }
	my $ExistingRules=$cli->GetServerRules() || die "Error: ".$cli->getErrMessage.", quitting";
        my $sa_rulname = $group."_posting_policy";
        foreach my $Rule (@$ExistingRules) {
		if ($Rule->[1] eq "$sa_rulname") {$cli->Logout();return(1);}
        }
	$cli->Logout();
	return(0);
}


sub GroupMembersForRule{
	my $group = shift;
	my $domain = shift;
	my $CGServerAddress = "91.230.195.210";
        my $PostmasterLogin = 'postmaster';
        my $PostmasterPassword = postmaster_pass();
        my $cli = new CGP::CLI( { PeerAddr => $CGServerAddress,
                            PeerPort => 106,
                            login => $PostmasterLogin,
                            password => $PostmasterPassword } );
        unless($cli) {
                $logger->warn("Can't login to CGPro: ".$CGP::ERR_STRING);
                exit(0);
        }

	my $result;
        my $Settings;
        $Settings=$cli->GetGroup("$group\@$domain");
        foreach (keys %$Settings) {
                my $data=@$Settings{$_};
                if (ref ($data) eq 'ARRAY') {
                        foreach my $member (@$data) {
					if (!$result) {$result = $member; }		
					else {$result .= ",".$member;}
                        }
                }
        }       
        return $result;
}

sub SetGroupInternal {
        my $groupwithdomain = shift;
        my @values = split("@",$groupwithdomain);
        my $domain = @values[1];
        my $group = @values[0];
        my $CGServerAddress = "91.230.195.210";
        my $PostmasterLogin = 'postmaster';
        my $PostmasterPassword = postmaster_pass();
        my $cli = new CGP::CLI( { PeerAddr => $CGServerAddress,
                            PeerPort => 106,
                            login => $PostmasterLogin,
                            password => $PostmasterPassword } );
        unless($cli) {     
                $logger->warn("Can't login to CGPro: ".$CGP::ERR_STRING);
                exit(0);
        }
 	my @NewRules;
        @NewRules=(); 
        my $ExistingRules=$cli->GetServerRules() || die "Error: ".$cli->getErrMessage.", quitting";
        my $sa_rulname = $group."_posting_policy";
	my $rule_string = GroupMembersForRule($group,$domain);
        my $NewRule =       
                [ 5, $sa_rulname ,
                        [
                                ['Any To or Cc', 'is', $group."@".$domain],
                                ['From', 'not in', $rule_string ]
                        ],
                        [
                                ['Reject with', 'Not Allowed'],
                                ['Discard']
                        ]
                ];
        push(@NewRules,$NewRule);
        foreach my $Rule (@$ExistingRules) {
                push(@NewRules,$Rule);
        }
        $cli->SetServerRules(\@NewRules) || die "Error: ".$cli->getErrMessage.", quitting";
        $cli->Logout();
}

sub SetGroupExternal{
        my $groupwithdomain = shift;
        my @values = split("@",$groupwithdomain);
        my $domain = @values[1];
        my $group = @values[0];
        my $CGServerAddress = "91.230.195.210";
        my $PostmasterLogin = 'postmaster';
        my $PostmasterPassword = postmaster_pass();
        my $cli = new CGP::CLI( { PeerAddr => $CGServerAddress,
                            PeerPort => 106,
                            login => $PostmasterLogin,
                            password => $PostmasterPassword } );
        unless($cli) {    
                $logger->warn("Can't login to CGPro: ".$CGP::ERR_STRING);
                exit(0);
        }
        my @NewRules;
        @NewRules=();
        my $ExistingRules=$cli->GetServerRules() || die "Error: ".$cli->getErrMessage.", quitting";
        my $sa_rulname = $group."_posting_policy";
        foreach my $Rule (@$ExistingRules) {
 		if (!($Rule->[1] eq "$sa_rulname")) {
                	push(@NewRules,$Rule);
		}
        }
        $cli->SetServerRules(\@NewRules) || die "Error: ".$cli->getErrMessage.", quitting";
        $cli->Logout();
}


sub api2 {
    my $func = shift;
    my (%API);
    $API{'GWAccounts'} = {};
    $API{'EnableGW'} = {};
    $API{'DisableGW'} = {};
    $API{'provisioniPhone'} = {};
    $API{'listpopswithdisk'} = {};
    $API{'addalias'} = {};
    $API{'delalias'} = {};
    $API{'listalias'} = {};
    $API{'addforward'} = {};
    $API{'delforward'} = {};
    $API{'listforwards'} = {};
    $API{'ListDefAddress'} = {};
    $API{'SetDefAddress'} = {};
    $API{'SpamAssassinStatus'} = {};
    $API{'EnableSpamAssassin'} = {};
    $API{'DisableSpamAssassin'} = {};
    $API{'SpamAssassinStatusAutoDelete'} = {};
    $API{'EnableSpamAssassinAutoDelete'} = {};
    $API{'DisableSpamAssassinAutoDelete'} = {};
    $API{'SpamAssassinStatusSpamBox'} = {};
    $API{'EnableSpamAssassinSpamBox'} = {};
    $API{'DisableSpamAssassinSpamBox'} = {};
    $API{'AddMailingList'} = {};
    $API{'ListMailingLists'} = {};
    $API{'DelMailingList'} = {};
    $API{'RenameMailingList '} = {};
    $API{'GetListSetting'} = {};
    $API{'PrintTextArea'} = {};
    $API{'ListMailingListsSubs'} = {};
    $API{'SetSubSettings'} = {};
    $API{'UnSub'} = {};
    $API{'Sub'} = {};
    $API{'ListGroups'} = {};
    $API{'DelGroup'} = {};
    $API{'RenameGroup'} = {};
    $API{'AddGroup'} = {};
    $API{'ListGroupMembers'} = {};
    $API{'AddGroupMember'} = {};
    $API{'RemoveGroupMember'} = {};
    $API{'GetGroupSettings'} = {};
    $API{'SetGroupSettings'} = {};
    $API{'SetAutoresponder'} = {};
    $API{'ListAutoresponder'} = {};
    $API{'DeleteAutoresponder'} = {};
    $API{'ListForwardersBackups'} = {};
    $API{'UploadForwarders'} = {};
    $API{'RestoreForwarders'} = {};
    $API{'ListAccountsBackups'} = {};
    $API{'GetAccountsBackups'} = {};
    return ( \%{ $API{$func} } );
}

1;
