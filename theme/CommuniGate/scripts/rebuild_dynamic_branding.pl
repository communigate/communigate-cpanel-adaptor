#!/usr/bin/perl
use XML::Simple  ();
use Data::Dumper ();

# The utility sets the width and height within a dynamicbranding.conf.
# This is usually not necessary as most people use the generator on the cPanel website to accomplish this task.

if (@ARGV) {
    usage();
    exit;
}

eval { require Image::Magick; };
if ( !exists( $INC{'Image/Magick.pm'} ) ) {
    print "This script requires Image::Magick, which does not appear to be installed\n";
    exit;
}

my @X;
open( DB, '<', 'dynamicbranding.conf' );
my @DB = <DB>;
foreach (@DB) {
    my $line = $_;
    my %OPTS;
    my @DS = split( /\s*\,\s*/, $_ );
    foreach my $set (@DS) {
        my ( $name, $value ) = split( /\s*\=\>?\s*/, $set );
        $name  =~ s/^\'|\'$//g;
        $value =~ s/^\'|\'$//g;
        $OPTS{$name} = $value;
    }

    if ( $OPTS{'type'} ne 'image' ) {
        print $line;
        ##push(@X,\%OPTS);
        next();
    }

    my $p = new Image::Magick;

    if ( -e "branding/" . $OPTS{'file'} . ".png" ) {
        $p->Read( "branding/" . $OPTS{'file'} . ".png" );
    }
    elsif ( -e "branding/" . $OPTS{'file'} . ".gif" ) {
        $p->Read( "branding/" . $OPTS{'file'} . ".gif" );
    }
    elsif ( -e "branding/" . $OPTS{'file'} . ".jpg" ) {
        $p->Read( "branding/" . $OPTS{'file'} . ".jpg" );
    }

    my $w = $p->Get('width');
    my $h = $p->Get('height');

    $OPTS{'width'}  = $w;
    $OPTS{'height'} = $h;

    my @OO;
    foreach my $opt ( sort keys %OPTS ) {
        $OPTS{$opt} =~ s/\n//g;
        push( @OO, "$opt=$OPTS{$opt}" );
    }
    print join( ',', @OO ) . "\n";
    ##push(@X,\%OPTS);
}
close(DB);

sub usage {
    print "Usage:\n";
    print "\t$0\n\n";
    print "The utility sets the width and height within a dynamicbranding.conf.\n";
    print "This is usually not necessary as most people use the generator on the cPanel website to accomplish this task.\n";
}
