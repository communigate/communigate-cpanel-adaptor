#!/bin/sh
eval 'if [ -x /usr/local/cpanel/3rdparty/bin/perl ]; then exec /usr/local/cpanel/3rdparty/bin/perl -x -- $0 ${1+"$@"}; else exec /usr/bin/perl -x $0 ${1+"$@"}; fi;'
    if 0;
#!/usr/bin/perl

use strict;
use Cpanel::Features ();

# if the file does not exist, create it.
if (! -f '/var/cpanel/features/default' ) {
    open(FO, ">>", '/var/cpanel/features/default');
    close(FO);
}
my @stop_features = ();
my @feature_lists = Cpanel::Features::get_feature_lists();
my @addonfeatures = Cpanel::Features::load_addon_feature_names();
if ($ARGV[0] eq "--preserve") {
    @stop_features = grep {/^(cgpro|itoolabs)\_/} @addonfeatures;
} else {
    @stop_features = grep {/^noncgpro\_/} @addonfeatures;
}
foreach my $feature_list_name (@feature_lists) {
    if ($feature_list_name ne 'disabled') {
	foreach my $feature (@stop_features) {
	    Cpanel::Features::modify_feature((
		'feature' => $feature,
		'value' => '0',
		'list' => $feature_list_name
					     ));
	    print "Stopping default \"" . $feature . "\" in \"".$feature_list_name."\" by default\n";
	}
    }
}
