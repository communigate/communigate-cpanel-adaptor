#!/usr/bin/perl
use Data::Dumper;
my %DYNAMIC_UI_CONF;
open( my $dbc_fh, "<", '../dynamicui.conf' );
while ( readline($dbc_fh) ) {
    chomp();
    my @OPTS = split( /\,/, $_ );
    my %DYA;
    foreach my $opt (@OPTS) {
        my ( $name, $value ) = split( /=\>/, $opt );
        $DYA{$name} = $value;
    }
    $DYNAMIC_UI_CONF{ $DYA{'file'} } = \%DYA;
}
close($dbc_fh);
print Dumper( \%DYNAMIC_UI_CONF );
