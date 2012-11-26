#!/usr/bin/perl

open( F, "<", "$ARGV[0]" );
while (<F>) {
    if (/Branding\=\"image\(([^\)]+)/) {
        print "type=>'image',imgtype=>'icon',file=>'$1',description=>''\n";
    }
}
close(F);
