#!/usr/bin/perl

my $buffer;

# Get the input
read( STDIN, $buffer, $ENV{'CONTENT_LENGTH'} );

# Split the name-value pairs
my @pairs = split( /&/, $buffer );

my %FORM;

foreach my $pair (@pairs) {
    my ( $name, $value ) = split( /=/, $pair );

    # Un-Webify plus signs and %-encoding
    $value =~ tr/+/ /;
    $value =~ s/%([a-fA-F0-9][a-fA-F0-9])/pack("C", hex($1))/eg;
    $value =~ s/<!--(.|\n)*-->//g;
    $value =~ s/^\n+|\n+$//g;

    $FORM{$name} = $value;
}

#if (-e "/var/cpanel/Counters/$FORM{'name'}.dat") {
open( DFCA, ">/var/cpanel/Counters/$FORM{'name'}.dat" );
print DFCA "$FORM{'num'}";
close(DFCA);

#}

print <<ROM;
Location: count.cgi
URI: count.cgi

ROM
