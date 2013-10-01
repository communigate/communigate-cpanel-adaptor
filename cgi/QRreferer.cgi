#!/usr/bin/perl

use CGI;
use GD::Barcode::QRcode;

my $q = CGI->new;

my $versions = {
    1 => 152,
    2 => 272,
    3 => 440,
    4 => 640,
    5 => 864,
    6 => 1088,
    7 => 1248,
    8 => 1552,
    9 => 1856,
    10 => 2192,
    11 => 2592,
    12 => 2960,
    13 => 3424,
    14 => 3688,
    15 => 4184,
    16 => 4712,
    17 => 5176,
    18 => 5768,
    19 => 6360,
    20 => 6888,
    21 => 7456,
    22 => 8048,
    23 => 8752,
    24 => 9392,
    25 => 10208,
    26 => 10960,
    27 => 11744,
    28 => 12248,
    29 => 13048,
    30 => 13880,
    31 => 14744,
    32 => 15640,
    33 => 16568,
    34 => 17528,
    35 => 18448,
    36 => 19472,
    37 => 20528,
    38 => 21616,
    39 => 22496,
    40 => 23648
};
my $version = 1;
my $text = $ENV{HTTP_REFERER};

{
    use bytes;
    my $len = length($text) * 8;
    for my $v (1..40) {
	if ($versions->{$v} > $len) {
	    $version = $v;
	    last;
	}
    }
}
binmode(STDOUT);
# print "Content-Type: text/html\n\n";
print "Content-Type: image/png\n\n";
print GD::Barcode::QRcode->new($text, { Ecc => 'L', Version=> $version, ModuleSize => 5})->plot->png or print "oops";
#die Dumper \%ENV;
