#!/usr/bin/perl

print "Content-type: text/html\n\n";

open( FILE, "count.html" );
my @lines = <FILE>;
close(FILE);

foreach my $line (@lines) {
    if ( $line =~ /<!--USERBOX-->/ ) {
        print "<input type=\"text\" size=\"10\" maxlength=\"40\" name=\"name\" value=\"$ENV{'REMOTE_USER'}\">";
    }
    else {
        print "$line";
    }
}
