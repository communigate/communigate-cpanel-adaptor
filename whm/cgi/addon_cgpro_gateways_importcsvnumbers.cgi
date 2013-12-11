#!/bin/sh                                                                                                                                                                                               
eval 'if [ -x /usr/local/cpanel/3rdparty/bin/perl ]; then exec /usr/local/cpanel/3rdparty/bin/perl -x -- $0 ${1+"$@"}; else exec /usr/bin/perl -x $0 ${1+"$@"}; fi;'
    if 0;
#!/usr/bin/perl

use Cpanel::Form            ();
use Whostmgr::HTMLInterface ();
use Whostmgr::ACLS          ();
use CLI;
use Cpanel::API::Branding        ();
use Cpanel::CachedDataStore;
use Storable ();


Whostmgr::ACLS::init_acls();
if ( !Whostmgr::ACLS::hasroot() ) {
    print "You need to be root to see the hello world example.\n";
    exit();
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

my %FORM = Cpanel::Form::parseform();

my $prefs = $cli->GetAccountPrefs('pbx@' . $domain);
my $gateways = $prefs->{Gateways};
my $id = $prefs->{Gateways}->{$FORM{provider}}->{shortId};
$id =~ s/\D//g;

my $domain = $cli->MainDomainName();
my $file = UploadForwarders();
if (-f $file && $FORM{provider}) {
    system '/usr/local/cpanel/bin/csvprocess', $file, 0;
    my $csvdata = Cpanel::SafeStorable::lock_retrieve( $file . '.parsed' );
    my $tels = {};
    if (defined $gateways->{$FORM{provider}}->{callInGw} && defined $gateways->{$FORM{provider}}->{callInGw}->{telnums}) {
	my $i = 0;
	for my $tel (@{$gateways->{$FORM{provider}}->{callInGw}->{telnums}}) {
	    $tels->{$tel->{telnum}} = $tel;
	    $tels->{$tel->{telnum}}->{id} = $i++;
	}
    }
    for my $row (@{$csvdata->{data}}) {
	my ($telnum, $host, $username, $authname, $authpass, $expires) = @$row;
	$expires = convertTime($expires);
	$telnum =~ s/\D//g;
	next unless $telnum;
	if ($gateways->{$FORM{provider}}->{callInGw}->{proxyType} eq 'director') {
	    $gateways->{$FORM{provider}}->{callInGw}->{telnums} = [] unless $gateways->{$FORM{provider}}->{callInGw}->{telnums};
	    push @{$gateways->{$FORM{provider}}->{callInGw}->{telnums}}, {'telnum' => $telnum};
	}
	if ($gateways->{$FORM{provider}}->{callInGw}->{proxyType} eq 'registrar') {
	    $gateways->{$FORM{provider}}->{callInGw}->{telnums} = [] unless $gateways->{$FORM{provider}}->{callInGw}->{telnums};
	    my $uin = join "-", map{ join "", map { unpack "H*", chr(rand(256)) } 1..$_} (4,2,2,2,6);
	    my $values = {
		'telnum' => $telnum,
		'authname' => ($authname || undef),
		'contact' => 'gwin-' . $id . '-' . $telnum . '@' . $domain ,
		'authpass' => ($authpass || undef),
		'username' => ($username || undef),
		'domain' => ($host || undef),
		'reguid' => $uin,
		'server' => undef,
		'expires' => ($expires || undef)
	    };
	    if ($tels->{$telnum}->{reguid}) {
		$values->{reguid} = $tels->{$telnum}->{reguid};
		$uin = $tels->{$telnum}->{reguid};
		$gateways->{$FORM{provider}}->{callInGw}->{telnums}->[$tels->{$telnum}->{id}] = $values;
	    } else {
		push @{$gateways->{$FORM{provider}}->{callInGw}->{telnums}}, $values;
	    }
	    my $rsips = $cli->GetAccountRSIPs('pbx@' . $domain);
	    $rsips->{'rsip-' . $id . '-' . $uin } = {
		domain => $host || '',
		fromName => $username || '',
		targetName => $telnum || '',
		gwid => $id,
		period => $expires || '30m',
		authName => $authname || '',
		password => $authpass || '',
	    # } if $host && $expires && $authpass && $authname;
	    };
	    $cli->SetAccountRSIPs('pbx@' . $domain, $rsips);
	}

    }
    unlink $file;
    unlink $file . '.parsed';
    $cli->UpdateAccountPrefs('pbx@' . $domain, {Gateways => $gateways});
}

print "Content-type: text/html\r\n\r\n";
Whostmgr::HTMLInterface::defheader( "CGPro Gateways - Import Numbers",'', '/cgi/addon_cgpro_gateways_importcsvnumbers.cgi' );
Cpanel::Template::process_template(
    'whostmgr',
    {
	'template_file' => 'addon_cgpro_gateways_importcsvnumbers.tmpl',
	FORM => \%FORM,
	provider => $FORM{provider},
    },
    );

$cli->Logout();

sub UploadForwarders {
    Cpanel::SafeDir::safemkdir( '/tmp/csvnumbers', '0700' );
    my @RSD;
    local $Cpanel::IxHash::Modify = 'none';
  FILE:
    foreach my $file ( keys %FORM ) {
        next FILE if $file =~ m/^file-(.*)-key$/;
        next FILE if $file !~ m/^file-(.*)/;
	return $FORM{$file};
    }
}

sub convertTime {
    my $time = shift;
    if ($time < 60) {
	$time .= 's';
    } elsif ($time >= 60 && $time < 3600 ){
	$time = int ($time / 60) . 'm';
    } elsif ($time >= 3600 && $time < 86400 ){
	$time = int ($time / 3600) . 'h';
    } else {
	$time = int ($time / 86400) . 'd';
    }
    return $time;
}
1;
