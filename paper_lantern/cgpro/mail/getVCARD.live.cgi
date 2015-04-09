#!/bin/sh
 eval 'if [ -x /usr/local/cpanel/3rdparty/bin/perl ]; then exec /usr/local/cpanel/3rdparty/bin/perl -x -- $0 ${1+"$@"}; else exec /usr/bin/perl -x $0 ${1+"$@"}; fi;'
    if 0;
#!/usr/bin/perl

use Cpanel::LiveAPI ();
use CGI;

my $q = CGI->new;

my $cpanel = Cpanel::LiveAPI->new();
print "Content-type: text/x-vcard\r\n";
print "Content-Disposition: attachment; filename=\"" .$q->param('name') . ".vcf\"\r\n\r\n";
my $account = $q->param('account');
my $box = $q->param('box');
my $uid = $q->param('contact');
my $contacts = $cpanel->api2('CommuniGate', 'exportContacts', { account => $account, box => $box, uid => $uid } )->{cpanelresult}->{data};
for my $contact (@$contacts) {
    if ($contact->{vcard}) {
	print "BEGIN:VCARD\nVERSION:2.1\n";
	print "N:", "$contact->{vcard}->{N}->{FAMILY};$contact->{vcard}->{N}->{GIVEN};$contact->{vcard}->{N}->{MIDDLE}", "\n";
	print "FN:","$contact->{vcard}->{FN}->{VALUE}", "\n";
	print "NICKNAME:", "$contact->{vcard}->{NICKNAME}->{VALUE}", "\n" if $contact->{vcard}->{NICKNAME};
	print "BDAY:", $contact->{vcard}->{BDAY}->{VALUE}, "\n" if $contact->{vcard}->{BDAY};
	if ( $contact->{vcard}->{ADR} ) {
	    for my $address (@{forceArray($contact->{vcard}->{ADR})}) {
		my @addresstype = grep {m/(HOME|WORK|DOM|POSTAL|PARCEL|OTHER)/} keys %{$address};
		print "ADR" . ($addresstype[0] ? ";$addresstype[0]" : "") . ":","$address->{POBOX};;$address->{STREET};$address->{LOCALITY};$address->{REGION};$address->{PCODE};$address->{CTRY}", "\n";
	    }
	}
	if ( $contact->{vcard}->{TEL} ) {
	    for my $tel (@{forceArray($contact->{vcard}->{TEL})}) {
		my @teltype = grep {m/(HOME|WORK|CELL|FAX|VIDEO|AGENT|PAGER|OTHER)/} keys %{$tel};
		print "TEL" . ($teltype[0] ? ";$teltype[0]" : "") . ":", "$tel->{VALUE}", "\n";
	    }
	}
 	if ( $contact->{vcard}->{EMAIL} ) {
	    for my $email (@{forceArray($contact->{vcard}->{EMAIL})}) {
		my @emailtype = grep {m/(HOME|WORK|OTHER)/} keys %{$email};
		print "EMAIL" . ($emailtype[0] ? ";$emailtype[0]" : "") . ":", "$email->{VALUE}", "\n";
	    }
	}
 	if ( $contact->{vcard}->{URL} ) {
	    for my $url (@{forceArray($contact->{vcard}->{URL})}) {
		my @urltype = grep {m/(HOME|WORK|OTHER)/} keys %{$url};
		print "URL" . ($urltype[0] ? ";$urltype[0]" : "") . ":", "$url->{VALUE}", "\n";
	    }
	}
	if ( $contact->{vcard}->{GEO} ) {
	    $contact->{vcard}->{GEO}->{VALUE} =~ s/\,\s+/;/;
	    print "GEO:", $contact->{vcard}->{GEO}->{VALUE}, "\n";
	}
	if ( $contact->{vcard}->{TZ} ) {
	    print "TZ:", $contact->{vcard}->{TZ}->{VALUE}, "\n";
	}
	if ( $contact->{vcard}->{ORG} ) {
	    print "ORG:", "$contact->{vcard}->{ORG}->{ORGNAME};;$contact->{vcard}->{ORG}->{ORGUNIT}", "\n";
	}
	if ( $contact->{vcard}->{ROLE} ) {
	    print "ROLE:", "$contact->{vcard}->{ROLE}->{VALUE}", "\n";
	}
	if ( $contact->{vcard}->{TITLE} ) {
	    print "TITLE:", "$contact->{vcard}->{TITLE}->{VALUE}", "\n";
	}
	if ( $contact->{vcard}->{NOTE} ) {
	    print "NOTE:", "$contact->{vcard}->{NOTE}->{VALUE}", "\n";
	}
	print "END:VCARD\n";
	}
}
$cpanel->end();

sub forceArray {
    my $data = shift;
    return undef unless $data;
    if (ref($data) eq "ARRAY") {
	return $data;
    } else {
	return [$data];
    }
}
