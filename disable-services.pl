#!/usr/bin/perl

use strict;
use LWP::UserAgent;
use MIME::Base64;

if ($#ARGV != 0) {
	print "usage $0 <root password>\nNeeded for WHM XML API CALL\n";
	exit(1);
} 

my $user = "root";
my $pass = $ARGV[0];

my $auth = "Basic " . MIME::Base64::encode( $user . ":" . $pass );

my $ua = LWP::UserAgent->new;
my $request = HTTP::Request->new( GET => "http://127.0.0.1:2086/xml-api/configureservice?service=spamd&enabled=0&monitored=0" );
$request->header( Authorization => $auth );
my $response = $ua->request($request);
print $response->content;
my $request = HTTP::Request->new( GET => "http://127.0.0.1:2086/xml-api/configureservice?service=exim&enabled=0&monitored=0" );
$request->header( Authorization => $auth );
my $response = $ua->request($request);
print $response->content;
my $request = HTTP::Request->new( GET => "http://127.0.0.1:2086/xml-api/configureservice?service=mailman&enabled=0&monitored=0" );
$request->header( Authorization => $auth );
my $response = $ua->request($request);
print $response->content;
my $request = HTTP::Request->new( GET => "http://127.0.0.1:2086/xml-api/configureservice?service=pop&enabled=0&monitored=0" );
$request->header( Authorization => $auth );
my $response = $ua->request($request);
print $response->content;
my $request = HTTP::Request->new( GET => "http://127.0.0.1:2086/xml-api/configureservice?service=imap&enabled=0&monitored=0" );
$request->header( Authorization => $auth );
my $response = $ua->request($request);
print $response->content;

my $cmd = "cat /var/cpanel/cpanel.config | grep -v skipspamassassin > /tmp/toto";
system($cmd);
$cmd = "echo skipspamassassin=1 >> /tmp/toto";
system($cmd);
$cmd = "mv /tmp/toto /var/cpanel/cpanel.config";
system($cmd);
$cmd = "/usr/local/cpanel/whostmgr/bin/whostmgr2 --updatetweaksettings";
system($cmd);

system("/etc/init.d/CommuniGate stop");
system("/etc/init.d/CommuniGate start");

