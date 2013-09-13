#!/usr/bin/perl

use CLI;
use CGI;
use POSIX;
use Archive::Zip;
my $q = new CGI();

use Data::Dumper;

unless (open(CONF, "<", "/var/cpanel/communigate.yaml")) {
  warn "* Error opening config file: $! \n";
  exit 0;
}
my $conf = {};
for my $row (<CONF>) {
  if ($row =~ m/(\w+)\:\s+\'(.*?)\'/) {
    $conf->{$1} = $2;
  }
}
close(CONF);
my $cli = undef;
sub getCLI {
  my $c =  new CGP::CLI( { PeerAddr => $conf->{cgprohost},
			   PeerPort => $conf->{cgproport},
			   login => $conf->{cgprouser},
			   password => $conf->{cgpropass}
			 });
  unless( $c ) {
    warn ("* Can't login to CGPro.");
    return undef;
  }
  return $c;
}

my (undef, $account, $fileKey, $getFile) = split "/", $q->path_info();
$account =~ s/%40/@/;
if ($account && $fileKey) {
  my $cli = getCLI();
  if ($cli) {
    my $prefs = $cli->GetAccountPrefs($account);
    if ($prefs->{"SharedFiles"}) {
      for my $pref (keys %{$prefs->{"SharedFiles"}}) {
	delete $prefs->{"SharedFiles"}->{$pref} if isExpired($prefs->{"SharedFiles"}->{$pref});
      }
    }
    if ($prefs->{"SharedFiles"}->{$fileKey}) {
      my ($username, $domain) = split "@", $account;
      my $url = $q->url(-full => 1, -path_info => 1);
      $url =~ s/%40/@/;
      my $files = $prefs->{"SharedFiles"}->{$fileKey}->{file};
      my $filesOutput = [];

      for my $fileN (@$files) {
	my $file = $fileN;
	my $path = $file;
	$file =~ s/^.*\/(.*?)$/$1/;
	$path =~ s/^(.*)\/?$file$/$1/;
	my $storedFiles = $cli->ListStorageFiles($account, "ProntoDrive/" . $path);
	my $fileFound = 0;
	for my $storedFile (keys %$storedFiles) {
	  if ($storedFile eq $file) {
	    $fileFound = 1;
	    last;
	  }
	}
	if ($fileFound) {
	  push @$filesOutput, {file => $file, path => $path};
	} else {
	  delete $prefs->{"SharedFiles"}->{$fileKey};
	}
      }

      my $filename = "";
      if ($#$filesOutput == -1) {
	print $q->redirect('/notfound.wssp?Skin=ProntoDrive');
      } elsif ($#$filesOutput == 0) {
	my $filePath  = "/var/CommuniGate/Domains/$domain/$username.macnt/account.web/ProntoDrive" . $filesOutput->[0]->{path} . "/" . $filesOutput->[0]->{file};
	$filePath =~ s#/+#/#g;
	if (-d $filePath) {
	  $filename = $filesOutput->[0]->{file} . ".zip";
	} else {
	  $filename = $filesOutput->[0]->{file};
	}
      } else {
	$fileKey =~ m/(\w{5})$/;
	$filename = "ProntoDrive-$1.zip";
      }
      if ($getFile) {
	# Just for debugging
	# print "Content-type: text/html\n\n";
	my $rootPath  = "/var/CommuniGate/Domains/$domain/$username.macnt/account.web/ProntoDrive" . $filesOutput->[0]->{path};
	my $filePath  = $rootPath . "/" . $filesOutput->[0]->{file};
	$filePath =~ s#/+#/#g;
	if ($#$filesOutput > 0 || -d $filePath) {
	  my $dest = "";
	    if ($#$filesOutput > 0) {
	      $fileKey =~ m/(\w{5})$/;
	      $dest = "ProntoDrive-$1";
	      $rootPath = "/var/CommuniGate/Domains/$domain/$username.macnt/account.web/ProntoDrive";
	    }
	  my $zip = Archive::Zip->new();
	  for my $item (@$filesOutput) {
	    my $check = "ProntoDrive/" . $item->{path} . "/" . $item->{file};
	    $check =~ s#/+#/#g;
	    $zip->updateTree($rootPath, $dest, sub {/$check/});
	  }
	  print "Content-type: application/zip\n\n";
	  $zip->writeToFileHandle(STDOUT);
	} else {
	  my $mimeType = `file --mime-type $filePath`;
	  $mimeType =~ s/^$filePath\:\s+//;
	  chomp $mimeType;
	  $mimeType = "application/x-download" unless $mimeType;
	  print "Content-type: $mimeType\n\n";
	  open(FI, "<", $filePath) or print "Cannot Open File";
	  my ($fl, $buff);
	  while (read FI, $buff, 1024) {
	      $fl .= $buff;
	  }
	  close(FI);
	  print $fl;
	}
      } else {
	print "Content-type: text/html\n\n";
	print <<EOF
<!DOCTYPE html>
<html lang="bg">
  <head>
    <title>Pronto!Drive</title>
    <meta charset="utf-8" />
    <link rel="icon" href="/SkinFiles/$domain/ProntoDrive/favicon.ico" />
    <!--[if IE]>
	<script language="javascript"  type="text/javascript" src="/SkinFiles/$domain/ProntoDrive/modernizr.js" ></script>
	<![endif]-->
    <link rel="stylesheet" href="/SkinFiles/$domain/ProntoDrive/screen.css" type="text/css" media="screen" />
    <meta name="HandheldFriendly" content="true"/>
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=2, user-scalable=yes"/>
    <!-- <script type="text/javascript">var switchTo5x=true;</script> -->
    <script type="text/javascript" src="http://w.sharethis.com/button/buttons.js"></script>
  </head>
  <body>
    <div class="wrapper">
      <header>
	<h1>Pronto!Drive</h1>
      </header>
      <section class="main">
	<h2>Download: $filename</h2>
	<p class="shareLink">
	  <label>Share link:</label>
          <textarea name="link" id="" rows="2" cols="100" onClick="this.select();" readonly="readonly">$url</textarea>
	</p>
	<p>
	  <span class='st_facebook_large' displayText='Facebook'></span>
	  <span class='st_twitter_large' displayText='Tweet'></span>
	  <span class='st_googleplus_large' displayText='Google +'></span>
	  <span class='st_linkedin_large' displayText='LinkedIn'></span>
	  <script type="text/javascript">stLight.options({publisher: "a1c5aa21-4119-4ea2-91b7-9678fe60f5ef", doNotHash: true, doNotCopy: true, hashAddressBar: true});</script>
	</p>
	<p class="downloadButton">
	  <a href="$url/$filename">Download</a>
	</p>
      </section>
      <div class="push"></div>
    </div>
    <footer>
    </footer>
  </body>
</html>
EOF
	  ;
      }
    } else {
      print $q->redirect('/notfound.wssp?Skin=ProntoDrive');
    }
    $cli->UpdateAccountPrefs($account, {SharedFiles => $prefs->{"SharedFiles"}});
    $cli->Logout();
  } else {
    print $q->redirect('/notfound.wssp?Skin=ProntoDrive');
  }
} else {
  print $q->redirect('/notfound.wssp?Skin=ProntoDrive');
}

sub isExpired {
  my $pref = shift;
  return 0 unless $pref;
  my $expires = $pref->{expires};
  my ($year, $month, $day, $seconds) = split '\W', $pref->{LastUpdated};
  my $time_t = POSIX::mktime( 0, 0, 0, $day, $month - 1, $year - 1900 );
  $time_t += $seconds;
  my $time = time();
  my $deltaT = $time_t + $expires - $time;
  return $deltaT < 0;
}
