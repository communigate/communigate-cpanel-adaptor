#!/bin/sh
 eval 'if [ -x /usr/local/cpanel/3rdparty/bin/perl ]; then exec /usr/local/cpanel/3rdparty/bin/perl -x -- $0 ${1+"$@"}; else exec /usr/bin/perl -x $0 ${1+"$@"}; fi;'
    if 0;
#!/usr/bin/perl

use Cpanel::LiveAPI ();
use CGI;
use Cpanel::CPAN::MIME::Base64::Perl qw(decode_base64);

my $q = CGI->new;

my $cpanel = Cpanel::LiveAPI->new();


my $domain = $q->param('domain');
my $lang = $q->param('lang');
my $file = $q->param('file');
my $type = $q->param('type');
my $filedata = $cpanel->api2( 'CommuniGate', 'GetSound', {domain => $domain, lang => $lang, file => $file, type => $type} )->{cpanelresult}->{data}->[0];


print "Content-type: audio/x-wav\r\n";
print "Content-Disposition: attachment; filename=\"" .$file . "\"\r\n\r\n";
print decode_base64($filedata);
$cpanel->end();
