#!/bin/sh
 eval 'if [ -x /usr/local/cpanel/3rdparty/bin/perl ]; then exec /usr/local/cpanel/3rdparty/bin/perl -x -- $0 ${1+"$@"}; else exec /usr/bin/perl -x $0 ${1+"$@"}; fi;'
    if 0;
#!/usr/bin/perl

use Cpanel::LiveAPI ();
use CGI;
use GD::Barcode::QRcode;

my $q = CGI->new;

my $cpanel = Cpanel::LiveAPI->new();
my $account = $q->param('account');
my $box = $q->param('box');
my $uid = $q->param('contact');
my $contacts = $cpanel->api2('CommuniGate', 'exportContacts', { account => $account, box => $box, uid => $uid } )->{cpanelresult}->{data};
my $vcard = "";
for my $contact (@$contacts) {
    if ($contact->{vcard}) {
	$vcard .= "BEGIN:VCARD\nVERSION:2.1\n";
	$vcard .= "N:". "$contact->{vcard}->{N}->{FAMILY};$contact->{vcard}->{N}->{GIVEN};$contact->{vcard}->{N}->{MIDDLE}". "\n";
	$vcard .= "FN:"."$contact->{vcard}->{FN}->{VALUE}". "\n";
	$vcard .= "NICKNAME:". "$contact->{vcard}->{NICKNAME}->{VALUE}". "\n" if $contact->{vcard}->{NICKNAME};
	$vcard .= "BDAY:". $contact->{vcard}->{BDAY}->{VALUE}. "\n" if $contact->{vcard}->{BDAY};
	if ( $contact->{vcard}->{ADR} ) {
	    for my $address (@{forceArray($contact->{vcard}->{ADR})}) {
		my @addresstype = grep {m/(HOME|WORK|DOM|POSTAL|PARCEL|OTHER)/} keys %{$address};
		$vcard .= "ADR" . ($addresstype[0] ? ";$addresstype[0]" : "") . ":"."$address->{POBOX};;$address->{STREET};$address->{LOCALITY};$address->{REGION};$address->{PCODE};$address->{CTRY}". "\n";
	    }
	}
	if ( $contact->{vcard}->{TEL} ) {
	    for my $tel (@{forceArray($contact->{vcard}->{TEL})}) {
		my @teltype = grep {m/(HOME|WORK|CELL|FAX|VIDEO|AGENT|PAGER|OTHER)/} keys %{$tel};
		$vcard .= "TEL" . ($teltype[0] ? ";$teltype[0]" : "") . ":". "$tel->{VALUE}". "\n";
	    }
	}
 	if ( $contact->{vcard}->{EMAIL} ) {
	    for my $email (@{forceArray($contact->{vcard}->{EMAIL})}) {
		my @emailtype = grep {m/(HOME|WORK|OTHER)/} keys %{$email};
		$vcard .= "EMAIL" . ($emailtype[0] ? ";$emailtype[0]" : "") . ":". "$email->{VALUE}". "\n";
	    }
	}
 	if ( $contact->{vcard}->{URL} ) {
	    for my $url (@{forceArray($contact->{vcard}->{URL})}) {
		my @urltype = grep {m/(HOME|WORK|OTHER)/} keys %{$url};
		$vcard .= "URL" . ($urltype[0] ? ";$urltype[0]" : "") . ":". "$url->{VALUE}". "\n";
	    }
	}
	if ( $contact->{vcard}->{GEO} ) {
	    $contact->{vcard}->{GEO}->{VALUE} =~ s/\.\s+/;/;
	    $vcard .= "GEO:". $contact->{vcard}->{GEO}->{VALUE}. "\n";
	}
	if ( $contact->{vcard}->{TZ} ) {
	    $vcard .= "TZ:". $contact->{vcard}->{TZ}->{VALUE}. "\n";
	}
	if ( $contact->{vcard}->{ORG} ) {
	    $vcard .= "ORG:". "$contact->{vcard}->{ORG}->{ORGNAME};;$contact->{vcard}->{ORG}->{ORGUNIT}". "\n";
	}
	if ( $contact->{vcard}->{ROLE} ) {
	    $vcard .= "ROLE:". "$contact->{vcard}->{ROLE}->{VALUE}". "\n";
	}
	if ( $contact->{vcard}->{TITLE} ) {
	    $vcard .= "TITLE:". "$contact->{vcard}->{TITLE}->{VALUE}". "\n";
	}
	if ( $contact->{vcard}->{NOTE} ) {
	    $vcard .= "NOTE:". "$contact->{vcard}->{NOTE}->{VALUE}". "\n";
	}
	$vcard .= "END:VCARD\n";
	}
}
$cpanel->end();

my $versions = {
    1 => 152,
    2 => 272,
    3 => 440,
    4 => 640,
    5 => 864,
    6 => 1088,
    7 => 1248,
    8 => 1552,
    9 => 1856,
    10 => 2192,
    11 => 2592,
    12 => 2960,
    13 => 3424,
    14 => 3688,
    15 => 4184,
    16 => 4712,
    17 => 5176,
    18 => 5768,
    19 => 6360,
    20 => 6888,
    21 => 7456,
    22 => 8048,
    23 => 8752,
    24 => 9392,
    25 => 10208,
    26 => 10960,
    27 => 11744,
    28 => 12248,
    29 => 13048,
    30 => 13880,
    31 => 14744,
    32 => 15640,
    33 => 16568,
    34 => 17528,
    35 => 18448,
    36 => 19472,
    37 => 20528,
    38 => 21616,
    39 => 22496,
    40 => 23648
};
my $version = 1;
{
    use bytes;
    my $len = length($vcard) * 8;
    for my $v (1..40) {
	if ($versions->{$v} > $len) {
	    $version = $v;
	    last;
	}
    }
}
binmode(STDOUT);
print "Content-Type: image/png\n\n";
print GD::Barcode::QRcode->new($vcard, { Ecc => 'L', Version=> $version, ModuleSize => 3})->plot->png or print "oops";
sub forceArray {
    my $data = shift;
    return undef unless $data;
    if (ref($data) eq "ARRAY") {
	return $data;
    } else {
	return [$data];
    }
}
