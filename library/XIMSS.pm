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
# You may need to change this to "use IO::Socket::INET;" if you have INET.pm
use IO::Socket;

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

  $this->{theSocket} = new IO::Socket::INET( %{$this->{connParams}} );

  unless(defined $this->{theSocket} && $this->{theSocket}) {
    $CGP::ERR_STRING = "Can't open connection to CGPro Server";
    return undef;
  };
  $this->{theSocket}->autoflush(1);
  $this->{'lastAccess'}=time();
  my $time = time();
  $this->send({
      login => {
	  authData => $this->{authData},
	  password => $this->{password},
	  id => "$time-login"
      }
	      });

  my $loginResult = $this->parseResponse("$time-login");
  if (defined $loginResult->{response}->{errorNum}) {
      croak 'You must pass correct authData and password parameter to XIMSS::new: ' . $loginResult->{response}->{errorText};
  }
  $this->{isConnected} = 1;
  1;
}

sub send {
  my ($this, $data) = @_;
  my $command = XMLout ($data, RootName => undef );
  if( time() - $this->{'lastAccess'} > $CGP::TIMEOUT ||
     !($this->{theSocket}) || $this->{theSocket}->error()) {
      $this->{theSocket}->shutdown(SHUT_RDWR) if($this->{theSocket});
      unless($this->connect()) {
      	  die "Failure: Can't reopen XIMSS connection";
      }
  }
  print STDERR ref($this) . "->send($command)\n\n" if $this->{'debug'};
  $this->{'lastAccess'} = time();
  print {$this->{theSocket}} $command . "\000";
}

sub _parseResponse {
    my $this = shift;
    my $socket = $this->{theSocket};
    my $prev = $/;
    $/ = "\000";
    my $responseLine = $this->{theSocket}->getline();
    $/ = $prev;
    $responseLine =~ s/\000//g;
    $responseLine .= $this->_parseResponse() unless $responseLine =~ m/^\<response\s/i;
    print STDERR "XIMSS->_parseResponse::responseLine = $responseLine\n\n" if $this->{'debug'};
    $this->{'lastAccess'}=time();
    return $responseLine;
}

sub parseResponse {
    my $this = shift;
    my $id = shift;
    croak "Pass and id" unless $id;
    my $string = $this->_parseResponse();
    my $response = XMLin("<opt>" . $string  . "</opt>", KeyAttr => "IgnoreKeyAttr");
    for my $tag (keys %$response) {
	if (ref($response->{$tag}) eq "ARRAY") {
	    for my $subres (@{$response->{$tag}}) {
		push @{$this->{responses}->{delete $subres->{id}}->{$tag}}, $subres;
	    }
	} else {
	    $this->{responses}->{delete $response->{$tag}->{id}}->{$tag} = $response->{$tag};
	}
    }

    return delete $this->{responses}->{$id};
}

sub close {
    my $this = shift;
    my $time = time();
    $this->send({bye => {id => "$time-bye"}});
    delete $this->{responses};
}

1;
