#!/usr/bin/perl

BEGIN {
    unshift @INC, '/usr/local/cpanel';
}
use Cpanel::LiveAPI ();
use IO::Compress::Gzip (gzip);
use CGI;

my $q = CGI->new;

my $cpanel = Cpanel::LiveAPI->new();

# print "Content-type: text/plain\r\n\r\n";

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
  print "Content-type: application/x-gzip\r\n";
  print "Content-Disposition: attachment; filename=\"aliases-" .$domain . ".gz\"\r\n\r\n";
  my $fwds = $cpanel->api2( 'CommuniGate', 'listforwards', { domain => $domain } )->{cpanelresult}->{data};
  unless (-d $cpanel->cpanelprint('$homedir') .'/tmp/backupforwarders' ) {
      mkdir $cpanel->cpanelprint('$homedir') . '/tmp/backupforwarders';
  }
  open( FO, ">", $cpanel->cpanelprint('$homedir') .'/tmp/backupforwarders/' . $domain );
  for my $fwd (@$fwds) {
    print FO $fwd->{dest}, ": ", $fwd->{forward}, "\n";
  }
  close FO;
  gzip $cpanel->cpanelprint('$homedir') .'/tmp/backupforwarders/' . $domain => \$output;
  print $output;
  unlink $cpanel->cpanelprint('$homedir') .'/tmp/backupforwarders/' . $domain;
}

$cpanel->end();
