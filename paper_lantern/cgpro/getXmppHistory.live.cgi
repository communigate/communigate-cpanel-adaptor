#!/bin/sh
 eval 'if [ -x /usr/local/cpanel/3rdparty/bin/perl ]; then exec /usr/local/cpanel/3rdparty/bin/perl -x -- $0 ${1+"$@"}; else exec /usr/bin/perl -x $0 ${1+"$@"}; fi;'
    if 0;
#!/usr/bin/perl

use Cpanel::LiveAPI ();
use CGI;
use Cpanel::CPAN::MIME::Base64::Perl qw(decode_base64);

my $q = CGI->new;

my $cpanel = Cpanel::LiveAPI->new();


my $account = $q->param('account');
my $file = $q->param('file');
my $filedata = $cpanel->api2( 'CommuniGate', 'GetFile', {account => $account, file => $file} )->{'cpanelresult'}->{'data'};

print "Content-type: application/txt\r\n";
print "Content-Disposition: attachment; filename=\"" .$file . "\"\r\n\r\n";
print decode_base64($filedata->[0]);
$cpanel->end();
