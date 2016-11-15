package XIMSS;

use strict;
use Carp;
BEGIN {
    # push 3rdparty Perl PATHs;
    my $addonPaths = `/usr/local/cpanel/3rdparty/bin/perl -V`;
    $addonPaths =~ s/^.*\@INC\:\s+(.*?)\s+\.$/$1/s;
    my @addonPaths = split '\s+', $addonPaths;
    @INC = (@INC, @addonPaths);
}
use XML::Simple;
use LWP::UserAgent;
use Encode qw(encode_utf8 decode_utf8);
$CGP::TIMEOUT = 60*5-5;  # 5 minutes timeout

sub new {
  my ($class, $params) = @_;
  my $this = {};
  $this->{'authData'} = delete $params->{'authData'};
  $this->{'password'} = delete $params->{'password'};

  croak 'You must pass login parameter to XIMSS::new'
    unless defined $this->{'authData'};
  croak 'You must pass password parameter to XIMSS::new'
    unless defined $this->{'password'};

  bless $this, $class;
  $this->{'connParams'} = $params;

  unless($this->connect()) {
      return undef;
  }
  $this;
}

sub connect {
  my ($this) = @_;
  $this->{isConnected} = 0;

  delete $this->{theSocket} if exists $this->{theSocket};

  my $ua = LWP::UserAgent->new(
      ssl_opts => { verify_hostname => 0 }
      );
  $ua->timeout(30);
  $ua->env_proxy;
   my $response = $ua->get("https://" . $this->{"connParams"}->{"PeerAddr"} . ":9100/ximsslogin/?username=" . $this->{"authData"} . "&password=" . $this->{"password"});
  if ($response->is_success) {
      my $response = XMLin($response->content, KeyAttr => "IgnoreKeyAttr");
      $this->{SID} = $response->{"session"}->{"urlID"};
  }
  else {
      warn $response->status_line;
  }
  1;
}

sub send {
  my ($this, $data, $options) = @_;
  my $command = XMLout ($data, RootName => undef );

  my $ua = LWP::UserAgent->new(
      ssl_opts => { verify_hostname => 0 }
      );
  $ua->timeout(15);
  $ua->env_proxy;
  my $response = $ua->post("https://" . $this->{"connParams"}->{"PeerAddr"} . ":9100/Session/" . $this->{"SID"} . "/sync", Content => "<XIMSS>" . $command.  "</XIMSS>");
  if ($response->is_success) {
    return XMLin(encode_utf8 $response->content, KeyAttr => "IgnoreKeyAttr", forceArray => ($options->{forceArray} || 0));
  }
  else {
      warn $response->status_line;
      return undef;
  }
}

# Deprecated functions
sub _parseResponse {
    my $this = shift;
}

sub parseResponse {
    my $this = shift;
    my $id = shift;
}
sub getAnyResponse {
  my $this = shift;
}
# END Deprecated functions

sub close {
    my $this = shift;
    my $time = time();
    my $command = XMLout({bye => {id => "$time-bye"}}, RootName => undef );
    my $ua = LWP::UserAgent->new(
        ssl_opts => { verify_hostname => 0 }
        );
    $ua->timeout(15);
    $ua->env_proxy;
    my $response = $ua->post("https://" . $this->{"connParams"}->{"PeerAddr"} . ":9100/Session/" . $this->{"SID"} . "/sync", Content => "<XIMSS>" . $command.  "</XIMSS>");

    if ($response->is_success) {
        warn XMLin($response->content, KeyAttr => "IgnoreKeyAttr");
        # urlID
    }
    else {
        warn $response->status_line;
    }

}

1;
