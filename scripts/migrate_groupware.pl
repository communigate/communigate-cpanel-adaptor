#!/usr/bin/perl

use strict;
use warnings;
use lib '/usr/local/cpanel/';
use Cpanel::CachedDataStore ();

if ( -f '/var/CommuniGate/cPanel/limits' ) {
    open(INLIMITS, "<", "/var/CommuniGate/cPanel/limits");
    if (! -d '/var/cpanel/cgpro' ) {
      mkdir '/var/cpanel/cgpro';
    }
    my $yamldata = Cpanel::CachedDataStore::fetch_ref( '/var/cpanel/cgpro/classes.yaml' ) || {};
    my $limits;
    while (<INLIMITS>) {
	chomp;
	my ($domain, $limit) = split(",", $_);
	unless ($yamldata->{$domain}) {
	    $yamldata->{$domain}->{'groupware'}->{'all'} = $limit;
	    $yamldata->{$domain}->{'groupware'}->{'free'} = $limit;
	    $yamldata->{$domain}->{'mailonly'}->{'all'} = -1;
	    $yamldata->{$domain}->{'mailonly'}->{'free'} = -1;
	};
    }

    unless ($yamldata->{'default'}) {
	$yamldata->{'default'}->{'groupware'}->{'all'} = -1;
	$yamldata->{'default'}->{'groupware'}->{'free'} = -1;
	$yamldata->{'default'}->{'mailonly'}->{'all'} = -1;
	$yamldata->{'default'}->{'mailonly'}->{'free'} = -1;
    }
    Cpanel::CachedDataStore::store_ref( '/var/cpanel/cgpro/classes.yaml', $yamldata );
}

