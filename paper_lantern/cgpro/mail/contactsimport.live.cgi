#!/bin/sh
 eval 'if [ -x /usr/local/cpanel/3rdparty/bin/perl ]; then exec /usr/local/cpanel/3rdparty/bin/perl -x -- $0 ${1+"$@"}; else exec /usr/bin/perl -x $0 ${1+"$@"}; fi;'
    if 0;
#!/usr/bin/perl

use Cpanel::LiveAPI ();
use CGI;

my $q = CGI->new;

my $cpanel = Cpanel::LiveAPI->new();
print "Content-type: text/html\r\n\r\n";
my $file = $q->upload("file");
my $data = [];
my $contact = [];
my $rowdata = {};
my $encoded = undef;
if ($q->param("file") =~ m/\.vcf$/i) {
    for my $row (<$file>) {
	$row =~ s/(\n|\r)//g;
	if ($row =~ m/^(\w+);?(\w+)?.*?\:(.*?)$/) {
	    $rowdata = {name => $1, value => $3};
	    next if $rowdata->{name} eq 'BEGIN' || $rowdata->{name} eq 'VERSION';
	    $rowdata->{type} = $2 if $2 && $2 ne "CHARSER" && $2 ne "ENCODING";
	    if ($row =~ s/;CHARSET=UTF-8;ENCODING=QUOTED-PRINTABLE//i) {
		$encoded = "qp";
		next if $rowdata->{value} =~ s/=$//;
	    } else {
		$encoded = undef;
	    }
	} else {
	    $rowdata->{value} .= $row;
	}
	next if $rowdata->{name} eq 'PHOTO';
	if ($encoded) {
	    $rowdata->{value} = decode_qp($rowdata->{value});
	}
	if ($rowdata->{name} eq 'END') {
	    push @$data, $contact;
	    $contact = [];
	}
	push @$contact, $rowdata unless $rowdata->{name} eq "END";
    }
} elsif ($q->param("file") =~ m/\.csv$/i) {
    open (FO, ">", $ENV{"HOME"} . "/tmp/" . $q->param("file"));
    for my $row (<$file>) {
	print FO $row;
    }
    close(FO);
} else {
    print "Unsupported format!";
}
my $file = $q->param("file");
my $return = $cpanel->api2('CommuniGate', 'ImportContacts', { 'account' => $q->param("account"), 'header' => ($q->param("header") || ""), 'box' => $q->param("box"), 'filename' => "$file", 'data' => $data } );
print $cpanel->api1('Branding', 'include', ('stdheader.html') )->{cpanelresult}->{data}->{result};
print '<div class="body-content">';
print "<h1>" . $cpanel->cpanellangprint("CGPImportContacts"), "</h1>";
print "<p>" . $cpanel->cpanellangprint("Imported"), "</p>";
print '<div class="return-link">';
print '<a href="contacts.html?account=' . $q->param("account") . '">&larr; Go Back</a>';
print "</div>";
print "</div>";


$cpanel->api1('Branding', 'include', ('stdfooter.html'))->{cpanelresult}->{data}->{result};

$cpanel->end();

