#!/bin/sh                                                                                                                                                                                               
 eval 'if [ -x /usr/local/cpanel/3rdparty/bin/perl ]; then exec /usr/local/cpanel/3rdparty/bin/perl -x -- $0 ${1+"$@"}; else exec /usr/bin/perl -x $0 ${1+"$@"}; fi;'
    if 0;
#!/usr/bin/perl

use Cpanel::LiveAPI ();
use CGI;

my $q = CGI->new;

my $cpanel = Cpanel::LiveAPI->new();
print "Content-type: text/plain\r\n\r\n";
my $domain = $q->param('domain');
my $accounts = $cpanel->api2('CommuniGate', 'getDomainAccounts', { 'domain' => $domain } );
die "No accounts!" unless $accounts->{cpanelresult}->{data}->[0];
# print "\n<select name='owner'>\n";
print "<option value=''>Please select</option>\n";
for my $account (sort keys %{$accounts->{cpanelresult}->{data}->[0]}) {
    print "<option value='$account'>$account\@$domain</option>\n";
}
# print "</select>\n";

$cpanel->end();
