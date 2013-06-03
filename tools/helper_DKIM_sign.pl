#!/usr/bin/perl -w

=head1 NAME

helper_DKIM_sign.pl

=head1 DESCRIPTION

An external filtering helper for CommuniGate Pro mail server
Adds DKIM signatures to outgoing messages.
Based on Mail::DKIM::Signer module.

=head1 INSTALLATION

Creating keys:
 To create the keys run these commands:
   openssl genrsa -out dkim.key 1024
   openssl rsa -in dkim.key -out dkim.public -pubout -outform PEM
 You will find two files: dkim.key & dkim.public.
 Open dkim.public and copy the contents excluding the –Begin– and –End– section. This is your DKIM key.

Adding DNS records for signature verification:
 Choose a value for Selector, e.g. "mx1" or "mail"
 Create DNS record in the following format with your key in "p=" (assuming your domain is "domain1.dom" and the Selector is "mail")
   mail._domainkey.domain1.dom. IN TXT "v=DKIM1; g=*; k=rsa; p=..."

Configuring the helper:
 Fill the %domainList dictionary below.

Configuring CommuniGate Pro:
 Create a helper:
   Name: DKIM_sign
   Program Path: /usr/bin/perl helper_DKIM_sign.pl

 Then create a server-wide rule:
   Data:
   [Source] [in] [trusted,authenticated]
   [Header Field] [is not] [DKIM-Signature:*]
   Action:
   [ExternalFilter] DKIM_sign

=head1 AUTHORS

Please mail your comments to support@communigate.com

=cut

use Mail::DKIM::Signer;  # http://search.cpan.org/~jaslong/Mail-DKIM/lib/Mail/DKIM/Signer.pm
use Mail::DKIM::TextWrap;  #recommended
use CLI;
use strict;

## BEGIN CONFIG

my $useFork=1;

## END CONFIG

$SIG{CHLD}='IGNORE' if($useFork);
$| = 1;
print "* helper_DKIM_sign.pl started.\n";

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


print "* stoppig helper_DKIM_sign.pl\n";
$cli->Logout();
exit(0);

sub processFILE {
  my ($prefix,$fileName) = @_;

  unless( open (FILE,"$fileName")) {
    print qq/$prefix REJECTED can't open $fileName: $!\n/;
    return undef;
  }
  while(<FILE>) { #skip the envelope
    chomp;
    last if($_ eq '');
  }
  my @messageText;
  my $fromAddress;
  while(<FILE>) {
    chomp;
    $_ =~ s/\015$//;
    push(@messageText,$_);
    $fromAddress=$1 if(!$fromAddress && /^from: (.*)/i)
  }
  close(FILE);
  unless($fromAddress) {
    print qq/$prefix ERROR "no From: address"\n/;
    return undef;
  }
  $fromAddress=~/\@(.*)/;
  my $domain=lc($1);
  $domain=$1 if($domain=~/^(.*)[\s>]/);

  my $dsettings = $cli->GetDomainSettings($domain);
  unless($dsettings->{DKIM}->{Enabled} eq "Yes" && $dsettings->{DKIM}->{key}) {
    print qq/$prefix OK the $domain is not served $dsettings->{DKIM}->{Enabled} \n/;
    return undef;
  }
  my $dkim = Mail::DKIM::Signer->new(
      Domain => $domain,
      Algorithm => $dsettings->{DKIM}->{Algorithm} || "rsa-sha1",
      Method => $dsettings->{DKIM}->{Method} || "relaxed",
      Selector => $dsettings->{DKIM}->{Selector} || "default",
      Key => Mail::DKIM::PrivateKey->load(Data => $dsettings->{DKIM}->{key}),
      );
  foreach(@messageText) {
      $dkim->PRINT("$_\015\012");
  }
  $dkim->CLOSE;
  my $signature = $dkim->signature->as_string;

  if($signature) {
    $signature=~s/\015\012/\\e/g;
    $signature=~s/\t/\\t/g;
    $signature=~s/\"/\\\"/g;
    print qq/$prefix ADDHEADER "$signature"\n/;
    $dkim->add_signature($signature);
  } else {
    print qq/$prefix OK failed to sign\n/;
  }
  return undef;
}#processFile

__END__


