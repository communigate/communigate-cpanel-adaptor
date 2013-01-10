#!/usr/bin/perl

BEGIN {
    unshift @INC, '/usr/local/cpanel';
}
use Cpanel::LiveAPI ();
use CGI;
use Text::CSV;

my $q = CGI->new;

my $cpanel = Cpanel::LiveAPI->new();


my $domain = $q->param('domain');
my $domains = $cpanel->api2( 'CommuniGate', 'ListForwardersBackups', {} )->{cpanelresult}->{data};

my $domainFound = 0;
for my $dom (@$domains) {
  if ($dom->{domain} eq $domain) {
    $domainFound = 1;
    last;
  }
}

if ( $domainFound ) {
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
