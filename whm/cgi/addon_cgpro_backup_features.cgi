#!/bin/sh                                                                                                                                                                                               
 eval 'if [ -x /usr/local/cpanel/3rdparty/bin/perl ]; then exec /usr/local/cpanel/3rdparty/bin/perl -x -- $0 ${1+"$@"}; else exec /usr/bin/perl -x $0 ${1+"$@"}; fi;'
    if 0;
#!/usr/bin/perl
#WHMADDON:appname:CGPro <strong>Backup Feature Lists</strong>

use Cpanel::Form            ();
use Whostmgr::HTMLInterface ();
use Whostmgr::ACLS          ();
use CLI;
use Cpanel::CachedDataStore;
use Cpanel::SafeDir;

Whostmgr::ACLS::init_acls();
if ( !Whostmgr::ACLS::hasroot() ) {
print "Content-type: text/html\r\n\r\n";
  print "You need to be root to see the hello world example.\n";
  exit();
}
my %FORM = Cpanel::Form::parseform();

if ($FORM{'get'} eq 'featurelists.backup') { 
    print "Content-type: text/plain\r\nContent-Disposition: attachment; filename=\"featurelists.backup\" \r\n\r\n";
    opendir(my $DIR, "/var/cpanel/features");
    while( my $filename = readdir $DIR ) {
	unless (-d "/var/cpanel/features/$filename") {
	    print "---$filename\n";
	    open(FI, "<", "/var/cpanel/features/$filename");
	    for (<FI>) {print};
	    close(FI);
	}
    }
    closedir($DIR);
} else {
print "Content-type: text/html\r\n\r\n";
my $restored = 0;
if ($FORM{'submit'}) {
    my $u = UploadFiles();
    if ($u->{filename} eq "file-featurelists.backup") {
	open(FI, "<", $u->{filepath});
	for (<FI>) {
	    chomp;
	    if (m/^\-{3}(.*?)$/) {
		close(FO);
		open(FO, ">", "/var/cpanel/features/$1");
	    } else {
		print FO $_, "\n";
	    }
	}
	close(FI);
	close(FO);
	unlink $u->{filepath};
	$restored = 1;
    }
}
my $conf = Cpanel::CachedDataStore::fetch_ref( '/var/cpanel/communigate.yaml' ) || {};
my $cli = new CGP::CLI( { PeerAddr => $conf->{cgprohost},
                            PeerPort => $conf->{cgproport},
                            login => $conf->{cgprouser},
                            password => $conf->{cgpropass} } );
    unless($cli) {
	print STDERR "Can't login to CGPro: ".$CGP::ERR_STRING,"\n";
	exit(0);
    }

    my $cgproversion = $cli->getversion();

    Whostmgr::HTMLInterface::defheader( "Backup/Restore Feature Lists",'', '/cgi/addon_cgpro_backup_features.cgi' );

    Cpanel::Template::process_template(
	'whostmgr',
	{
	    'template_file' => 'addon_cgpro_backup_features.tmpl',
	    cgproversion => $cgproversion,
	    restored => $restored
	},
	);
    $cli->Logout();
}

sub UploadFiles {
    Cpanel::SafeDir::safemkdir( '/tmp/csvnumbers', '0700' );
    my @RSD;
    local $Cpanel::IxHash::Modify = 'none';
  FILE:
    foreach my $file ( keys %FORM ) {
        next FILE if $file =~ m/^file-(.*)-key$/;
        next FILE if $file !~ m/^file-(.*)/;
	return {'filepath' => $FORM{$file}, 'filename' => $file};
    }
    return 0;
}


1;
