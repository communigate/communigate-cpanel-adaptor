#!/bin/sh                                                                                                                                                                                               
 eval 'if [ -x /usr/local/cpanel/3rdparty/bin/perl ]; then exec /usr/local/cpanel/3rdparty/bin/perl -x -- $0 ${1+"$@"}; else exec /usr/bin/perl -x $0 ${1+"$@"}; fi;'
    if 0;
#!/usr/bin/perl

use Cpanel::LiveAPI ();
use Cpanel::CPAN::YAML::Syck ();
use CGI;

my $q = CGI->new;

my $cpanel = Cpanel::LiveAPI->new();

# print "Content-type: text/plain\r\n\r\n";

my $filters = $cpanel->api2( 'CommuniGate', 'dumpfilters', {} )->{cpanelresult}->{data};

print "Content-type: application/x-yaml\r\n";
print "Content-Disposition: attachment; filename=\"filter_info.yaml\"\r\n\r\n";
print YAML::Syck::Dump( $filters );

$cpanel->end();
