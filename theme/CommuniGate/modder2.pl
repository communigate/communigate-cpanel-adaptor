#!/usr/bin/perl

open( my $pf, '<', 'mod_list' );
while ( readline($pf) ) {
    my ( $file, $ff ) = split( /:/, $_ );
    next if ( !-e $file );
    if ( $file !~ /\.html$/ ) { warn $file . "\n"; next(); }
    open( FF, '+<', $file );

    my @F = <FF>;
    seek( FF, 0, 0 );
    foreach my $l (@F) {

        if ( $l =~ /scale_50percent/ ) {
            $l =~ s/scale_50percent/scale_60percent/g;
        }

        print FF $l;
    }
    truncate( FF, tell(FF) );
    close(FF);
    print $file . "\n";
}
close($pf);
