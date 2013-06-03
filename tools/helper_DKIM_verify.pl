#!/usr/bin/perl

=head1 NAME

helper_DKIM_verify.pl

=head1 DESCRIPTION

An external filtering helper for CommuniGate Pro mail server
Verifies DKIM signatures
Based on Mail::DKIM::Verifier module

=head1 INSTALLATION

Configuring CommuniGate Pro:
 Create a helper:
   Name: DKIM_verify
   Program Path: /usr/bin/perl helper_DKIM_verify.pl

 Then create a server-wide rule:
   Data: [Header field] [is] [DKIM-Signature:*]
   Action: [ExternalFilter] DKIM_verify

=head1 AUTHORS

Please mail your comments to support@communigate.com

=cut

use Mail::DKIM::Verifier; # http://search.cpan.org/~jaslong/Mail-DKIM/lib/Mail/DKIM/Verifier.pm
use CLI;
use strict;

## BEGIN CONFIG

my $useAddHeader = 1;  # either add header (1) or reject the message (0) if the verification failed
my $Header="X-DKIM-Authentication-Results";
my $useFork=1;

## END CONFIG

$SIG{CHLD}='IGNORE' if($useFork);
$| = 1;
print "* helper_DKIM_verify.pl started.\n";

unless (open(CONF, "<", "/var/cpanel/communigate.yaml")) {
    print "* Error opening config file: $! \n";
    exit 0;
}
my $conf = {};
for my $row (<CONF>) {
    if ($row =~ m/(\w+)\:\s+\'(.*?)\'/) {
	$conf->{$1} = $2;
      }
}
close(CONF);
my $cli = undef;
sub getCLI {
    my $c =  new CGP::CLI( { PeerAddr => $conf->{cgprohost},
		       PeerPort => $conf->{cgproport},
		       login => $conf->{cgprouser},
		       password => $conf->{cgpropass}
		     });
    unless( $c ) {
	print("* Can't login to CGPro.");
	exit 0;
    }
    return $c;
}

my $counter=0;
while(<STDIN>) {
  chomp;
  $cli = getCLI() unless $cli;
  my ($command,$prefix);
  my @args;
  ($prefix,$command,@args) = split(/ /);
  if($command eq 'INTF') {
    print "$prefix INTF 3\n";

  } elsif($command eq 'QUIT') {
    print "$prefix OK\n";
    last;
  } elsif($command eq 'KEY') {
    print "$prefix OK\n";
  } elsif($command eq 'FILE') {
    if($useFork) {  # process async
      unless(my $pid = fork) {
        die "cannot fork: $!" unless defined $pid;
        processFILE($prefix,$args[0]);
        exit;
      }
    } else {        # process synchronously
       processFILE($prefix,$args[0]);
    }

  } else {
    print "$prefix ERROR unexpected command: $command\n";
  }
}


print "* stoppig helper_DKIM_verify.pl\n";
$cli->Logout();
exit(0);

sub processFILE {
  my ($prefix,$fileName) = @_;
  unless( open (FILE,"$fileName")) {
    print qq/$prefix REJECTED can't open $fileName: $!\n/;
    return undef;
  }
  my $dkim = Mail::DKIM::Verifier->new();
  my $content = "";
  while(<FILE>) { #skip the envelope
      $content .= $_;
    chomp;
    last if ($_ eq '');
  }
  my $indkim = 0;
  my $dkimheader = "";
  my $domain = "";
  while(<FILE>) {
      $content .= $_;
      chomp;
      s/\015$//;
      $dkim->PRINT("$_\015\012");
      if ($_ =~ m/with\s+ESMTPS\s+id\s+\d+\s+for\s+.*?\@(.*?)\;/i) {
	  $domain = $1;
      }
  }
  close(FILE);
  $dkim->CLOSE;
  my $result = $dkim->result_detail;
  my $auth_results = join("; ",
			  map { make_auth_result($_) }
			  $dkim->signatures);
  if($result eq 'pass' || $result eq 'none') {
      print qq/$prefix ADDHEADER "$Header: $result\\nAuthentication-Results: $auth_results"\n/;
      # print qq/$prefix OK\n/;
  } else {
      my $domainPrefs = {};
      if ($domain) {
	  $domainPrefs = $cli->GetAccountDefaultPrefs($domain);
      }
      my $serverPrefs = $cli->GetServerAccountPrefs();
      unless ($serverPrefs->{DKIMVerifyEnable} eq 'YES' && $domainPrefs->{DKIMVerifyEnable} eq 'YES') {
	  print "$prefix OK\n";
	  return;
      }
      if ((defined $domainPrefs->{DKIMVerifyReject} && $domainPrefs->{DKIMVerifyReject} eq 'YES') || $serverPrefs->{DKIMVerifyReject} eq 'YES') {
	  $useAddHeader = 0;
      }
      if (defined $domainPrefs->{DKIMVerifyReject} && $domainPrefs->{DKIMVerifyReject} eq 'NO') {
	  $useAddHeader = 1;
      }
      if($useAddHeader) {
	  $content =~ s/(\n\s*Subject\:\s*)(.*?\n)/$1\[Message NOT verified\] $2/i;
	  open(FO, ">", $fileName);
	  print FO $content;
	  close(FO);
	  print qq/$prefix ADDHEADER "$Header: $result\\nAuthentication-Results: $auth_results"\n/;
      } else {
	  print qq/$prefix ERROR "DKIM check result: $result"\n/;
      }
  }
  return undef;
}#processFile

sub make_auth_result {
    my $signature = shift;
    my $type = $signature->isa("Mail::DKIM::DkSignature")
	? "domainkeys" : "dkim";
    my $tag = $signature->can("identity_source")
	? $signature->identity_source : "header.i";
    return "$type=" . $signature->result_detail
	. " $tag=" . $signature->identity;
}


__END__


