#!/usr/local/cpanel/3rdparty/bin/perl

use CPAN;
exit unless $ARGV[0];
my $missing = system("/usr/local/cpanel/3rdparty/bin/perl -MMIME::QuotedPrint::Perl -e 1 2>/dev/null");
if ($missing) {
    CPAN::Shell->force("install",$ARGV[0]);
}
