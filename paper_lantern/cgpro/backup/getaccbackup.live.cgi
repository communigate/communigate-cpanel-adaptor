#!/bin/sh                                                                                                                                                                                               
 eval 'if [ -x /usr/local/cpanel/3rdparty/bin/perl ]; then exec /usr/local/cpanel/3rdparty/bin/perl -x -- $0 ${1+"$@"}; else exec /usr/bin/perl -x $0 ${1+"$@"}; fi;'
    if 0;
#!/usr/bin/perl

use Cpanel::LiveAPI ();
use CGI;
use Text::CSV;

my $q = CGI->new;

my $cpanel = Cpanel::LiveAPI->new();


my $domain = $q->param('domain');
my $domains = $cpanel->api2( 'CommuniGate', 'ListAccountsBackups', {} )->{cpanelresult}->{data};

my $domainFound = 0;
for my $dom (@$domains) {
  if ($dom->{domain} eq $domain) {
    $domainFound = 1;
    last;
  }
}
if ( $domainFound && $cpanel->cpanelfeature('cgpro_backup')) {
  print "Content-type: text/csv\r\n";
  print "Content-Disposition: attachment; filename=\"emails-" .$domain . ".csv\"\r\n\r\n";
  my $csv = Text::CSV->new ( { binary => 1 } );
  my $accounts = $cpanel->api2( 'CommuniGate', 'GetAccountsBackups', { domain => $domain } )->{cpanelresult}->{data};
      $csv->combine(("Email", "Password", "Quota"));
      print $csv->string(), "\n";
  for my $account (@$accounts) {
      $csv->combine(($account->{email}, $account->{pass}, $account->{diskquota}));
      print $csv->string(), "\n";
  }
}

$cpanel->end();
