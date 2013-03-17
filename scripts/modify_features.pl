#!/bin/sh                                                                                                                                                                                               
 eval 'if [ -x /usr/local/cpanel/3rdparty/bin/perl ]; then exec /usr/local/cpanel/3rdparty/bin/perl -x -- $0 ${1+"$@"}; else exec /usr/bin/perl -x $0 ${1+"$@"}; fi;'
    if 0;
#!/usr/bin/perl

use strict;
use CLI;
use Cpanel::Features ();

# if the file does not exist, create it.
if (! -f '/var/cpanel/features/default' ) {
  open(FO, ">>", '/var/cpanel/features/default');
  close(FO);
}
my @stop_features = ("webmail", "default_spamassassin", "forwarders", "emaildomainfwd", "autoresponders", "boxtrapper", "lists", "blockers", "backup", "defaultaddress", "emailarchive");
my @feature_lists = Cpanel::Features::get_feature_lists();
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
