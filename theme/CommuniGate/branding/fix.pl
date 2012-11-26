#!/usr/bin/perl
my @imgs = split( /\n/, `find . -name "tbl-bg.jpg"` );
foreach my $img (@imgs) {
    rename( $img, "$img.fix" );
    system( "convert", "$img.fix", "-resize", "18x22!", "$img" );
}
