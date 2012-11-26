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

        #<image alt="<cpanel langprint="IconFor">" src="../images/smallicons/image-manager.jpg"><cpanel langprint="IMTNP">

        if ( $l =~ /\<(image|img)\s+[^\/]+([^\"]+)\"[\/\s]*\>/ ) {
            my $img = $2;
            my @IMG = split( /\//, $img );
            $img = $IMG[$#IMG];
            my $ext;
            ( $img, $ext ) = split( /\./, $img );
            print FF '
<style>
<?cp Branding::spritelist(.spriteicon_img_mini {float:left;margin-right:5px;background: url\{leftparenthesis}"%"\{rightparenthesis};} %,@spriteurl,images::#icon-${img}_mini {background-position\{colon}0 -${cssposition}px;width\{colon}${width}px;height\{colon}${height}px; }:) imgtype=icon,subtype=img,method=scale_50percent,format=png,img=' . $img . ' ?>

</style>
';
            $l =~ s/\<(image|img)\s+[^\/]+([^\"]+)\"[\/\s]*\>/<div class="spriteicon_img_mini" id="icon-${img}_mini"><\/div>/g;
            print "Replaced $img sprite\n";
        }

        print FF $l;
    }
    truncate( FF, tell(FF) );
    close(FF);
    print $file . "\n";
}
close($pf);
