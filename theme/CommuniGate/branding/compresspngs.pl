#!/usr/bin/perl

my @pngs = split( /\n/, `find . -name "*.png"` );
foreach my $png (@pngs) {
    next if ( $png !~ /sprite/i );
    my $size = ( stat($png) )[7];
    system( "pngrewrite", $png, $png . '.rewrite' );
    system( "pngcrush", '-brute', $png . '.rewrite', $png );
    my $size2 = ( stat($png) )[7];
    my $per = sprintf( "%.2f", ( $size2 / $size ) * 100 );
    print "$png ($size compressed to $size2 ... $per %)\n";
}
