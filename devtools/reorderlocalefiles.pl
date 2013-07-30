#!/usr/bin/perl

use strict;
use warnings;

die "Pass a locale/xx file as a param." unless $ARGV[0] && -f $ARGV[0];

open(FI, "<", $ARGV[0]) or die "Cannot open $ARGV[0] for reading.";
my $words = {};
for my $row (<FI>) {
  chomp $row;
  $row =~ s/\s+$//;
  if ($row =~ m/^(.*?):\s*["'](.*?)['"]$/) {
    $words->{$1} = $2;
  }
}
close FI;

open(FO, ">", $ARGV[0]) or die "Cannot open $ARGV[0] for writing.";
for my $key (sort keys %$words) {
  print FO "$key: '$words->{$key}'\n";
}
close FO;
