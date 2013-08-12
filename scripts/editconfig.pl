#!/usr/bin/perl

use strict;
use warnings;
use lib '/usr/local/cpanel';
use Cpanel::CachedDataStore ();

my $correct = "n";
my $data = Cpanel::CachedDataStore::fetch_ref( '/var/cpanel/communigate.yaml' ) || {};
my $newdata = $data;
my $cgprohost = $data->{cgprohost};
my $cgproport = $data->{cgproport};
my $cgprouser = $data->{cgprouser};
my $cgpropass = $data->{cgpropass};
do {
  # Enter Hostname
  print "Enter CommuniGate Pro IP address: [" . $cgprohost . "]: ";
  $cgprohost = <>;
  chomp $cgprohost;
  $cgprohost = $newdata->{cgprohost} unless $cgprohost;
  # Enter port
  print "Enter CommuniGate Pro Port: [" . $cgproport . "]: ";
  $cgproport = <>;
  chomp $cgproport;
  $cgproport = $newdata->{cgproport} unless $cgproport;
  # Enter user
  print "Enter CommuniGate Pro Username: [" . $cgprouser . "]: ";
  $cgprouser = <>;
  chomp $cgprouser;
  $cgprouser = $newdata->{cgprouser} unless $cgprouser;
  # Enter pass
  system('stty', '-echo');	# Disable echo
  my $repass = "";
  do {
    print "Enter CommuniGate Pro Password: ";
    $cgpropass = <>;
    chomp $cgpropass;
    print "\n";
    print "Enter CommuniGate Pro Password again: ";
    $repass = <>;
    chomp $repass;
    if ($cgpropass ne $repass) {
      print "\n";
      print "Passwords do not match! \n";
    } else {
      print "\n";
      print "Password must be at least 4 symbols! \n" unless $repass =~ m/\S{4}/;
    }
    print "\n";
  } while (($cgpropass ne $repass) || $repass !~ m/\S{4}/);
  system('stty', 'echo');	# Turn echo back on
  do {
    print "==- Verify Data -==================== \n";
    print "CommuniGate Pro IP address: $cgprohost \n";
    print "CommuniGate Pro Port: $cgproport \n";
    print "CommuniGate Pro Username: $cgprouser \n";
    print "===================================== \n";
    print "Is all data correct? [Y/n]: ";
    $correct = <>;
    chomp $correct;
    $correct = 'y' unless $correct;
    print "Please answer 'y' or 'n'.\n" unless $correct =~ m/[yn]/i;
  } while ($correct !~ m/^[yn]$/i);
  $newdata->{cgprouser} = $cgprouser;
  $newdata->{cgpropass} = $cgpropass;
  $newdata->{cgprohost} = $cgprohost;
  $newdata->{cgproport} = $cgproport;
} while ($correct !~ m/^y$/i);
Cpanel::CachedDataStore::store_ref( '/var/cpanel/communigate.yaml', $newdata );
