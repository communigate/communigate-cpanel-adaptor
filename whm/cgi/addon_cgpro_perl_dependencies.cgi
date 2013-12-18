#!/bin/sh                                                                                                                                                                                               
 eval 'if [ -x /usr/local/cpanel/3rdparty/bin/perl ]; then exec /usr/local/cpanel/3rdparty/bin/perl -x -- $0 ${1+"$@"}; else exec /usr/bin/perl -x $0 ${1+"$@"}; fi;'
    if 0;
#!/usr/bin/perl
#WHMADDON:communigatepro:CGPro <strong>Perl Dependencies</strong>

print "HTTP/1.0\r\nStatus: 200 OK\r\nContext-type: text/html\r\n\r\n";

print <<EOF
<html>
  <head>
    <title>Perl Dependencies</title>
  </head>
  <body>
    <h1>Perl dependencies</h1>
EOF
;

my $modules_CommuniGate = ["Mail::DKIM::Verifier", "Mail::DKIM::Signer", "IO::Scalar", "Archive::Zip", "GD::Barcode::QRcode"];
my $modules_cPanel = ["YAML::Syck", "MIME::QuotedPrint::Perl", "XML::SAX", "GD::Barcode::QRcode"];

    if (-d '/var/CommuniGate/') {
	print "<h2>CommuniGate related Perl dependencies</h2>";
	print "<table border='1' cellpadding='5'>";
	for my $module (@$modules_CommuniGate) {
	    my $missing = system("perl -M$module -e 1 2>/dev/null");
	    if ($missing) {
		print "<tr><td>$module</td><td>missing</td></tr>";
	    } else {
		print "<tr><td>$module</td><td>installed</td></tr>";
	    }
	}
	print "</table>";
    }

print "<h2>cPanel related Perl dependencies</h2>";
print "<table border='1' cellpadding='5'>";
for my $module (@$modules_cPanel) {
    my $missing = system("/usr/local/cpanel/3rdparty/bin/perl -M$module -e 1 2>/dev/null");
    if ($missing) {
	print "<tr><td>$module</td><td>missing</td></tr>";
    } else {
	print "<tr><td>$module</td><td>installed</td></tr>";
    }
}
print "</table>";



print <<EOF
  </body>
</html>
EOF
;
