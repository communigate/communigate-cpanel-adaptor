#!/usr/bin/perl

BEGIN {
    unshift @INC, '/usr/local/cpanel';
}
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
