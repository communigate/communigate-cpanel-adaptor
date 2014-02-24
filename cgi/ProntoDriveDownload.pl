#!/usr/bin/perl

use CLI;
use CGI;
use POSIX;
use Archive::Zip;
use IO::Scalar;
my $q = new CGI();

sub postmaster_pass {
    my $file = "/var/CommuniGate/Accounts/postmaster.macnt/account.settings";
    my %hash;
    open (MYFILE, "$file");
    while (<MYFILE>) {
	chomp;
	my @line = split("=",$_);
	$hash{@line[0]} = @line[1];
    }
    if ($hash{' Password '} =~ /^ ".*";$/) {
	return  substr $hash{' Password '}, 2, length($hash{' Password '})-4;
    } else {
	return  substr $hash{' Password '}, 1, length($hash{' Password '})-2;
    }
}
my $CLI = undef;
sub getCLI {
    if ($CLI && $CLI->{isConnected}) {
	return $CLI;
    } else {
	my $CGServerAddress = "127.0.0.1";
	my $PostmasterLogin = 'postmaster';
	my $PostmasterPassword = postmaster_pass();

	if ($domain) {
	    $account=$account."@".$domain;
	}

	my $cli = new CGP::CLI( { PeerAddr => $CGServerAddress,
				  PeerPort => '106',
				  login => $PostmasterLogin,
				  password => $PostmasterPassword } );
	unless($cli) {
	    print header;
	    print "Can't login to CGPro: ".$CGP::ERR_STRING,"\n";
	    exit(0);
	}
	return $cli;
    }
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
      my $shared = 0;
      if ($files->[0] =~ /^\~([A-Z0-9._%+-]+\@[A-Z0-9.-]+\.[A-Z]{2,4})\//i) {
	($username, $domain) = split "@", $1;
	$shared = 1;
      }
      for my $fileN (@$files) {
	my $file = $fileN;
	my $path = $file;
	$file =~ s/^.*\/(.*?)$/$1/;
	$path =~ s/^(.*)\/?$file$/$1/;
	my $fullpath = "private/" . $path;
	if ($shared) {
	  $fullpath = $path;
	  $fullpath =~ s/^\~.*?\/private/private/;
	}
	my $storedFiles = $cli->ListStorageFiles("$username\@$domain", $fullpath);
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
	  # delete $prefs->{"SharedFiles"}->{$fileKey};
	}
      }

      my $filename = "";
      if ($#$filesOutput == -1) {
	print $q->redirect('/notfound.wssp?Skin=ProntoDrive');
      } elsif ($#$filesOutput == 0) {
	my $rootPath  = "/var/CommuniGate/Domains/$domain/$username.macnt/account.web/private" . $filesOutput->[0]->{path};
	my $filePath  = $rootPath . "/" . $filesOutput->[0]->{file};
	if ($shared) {
	  my $localpath = $filesOutput->[0]->{path};
	  $localpath =~ s/^\~.*?\/private//;
	  $rootPath  = "/var/CommuniGate/Domains/$domain/$username.macnt/account.web/private" . $localpath;
	  $filePath  = $rootPath . "/" . $filesOutput->[0]->{file};
	}
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
	if ($shared) {
	  $filesOutput->[0]->{path} =~ s/^\~.*?\/private//;
	}
	my $rootPath  = "/var/CommuniGate/Domains/$domain/$username.macnt/account.web/private" . $filesOutput->[0]->{path};
	my $filePath  = $rootPath . "/" . $filesOutput->[0]->{file};
	$filePath =~ s#/+#/#g;
	if ($#$filesOutput > 0 || -d $filePath) {
	  my $dest = "";
	  if ($#$filesOutput > 0) {
	    $fileKey =~ m/(\w{5})$/;
	    $dest = "ProntoDrive-$1";
	    $rootPath = "/var/CommuniGate/Domains/$domain/$username.macnt/account.web/private";
	  }
	  my $zip = Archive::Zip->new();
	  for my $item (@$filesOutput) {
	    if ($shared) {
	      $item->{path} =~ s/^\~.*?\/private//;
	    }
	    my $check = "private/" . $item->{path} . "/" . $item->{file};
	    $check =~ s#/+#/#g;
	    $zip->updateTree($rootPath, $dest, sub {/$check/ && !/\.meta$/});
	  }
	  my $zipContents = '';
	  my $SH = IO::Scalar->new( \$zipContents );
	  binmode(STDOUT);
	  $zip->writeToFileHandle($SH);
	  $SH->close();
	  my $totalSize = length($zipContents);
	  print "Content-Length: $totalSize\nContent-type: application/zip\n\n";
	  print $zipContents;
	} else {
	  $filePath =~ s/~/&AH4-/g;
	  my $mimeType = `file --mime-type "$filePath"`;
	  $mimeType =~ s/^$filePath\:\s+//;
	  chomp $mimeType;
	  $mimeType = "application/x-download" if !$mimeType || $mimeType =~ /cannot open/i;
	  my $totalSize = -s $filePath;
	  print "Content-Length: $totalSize\nContent-type: $mimeType\n\n";
	  open(FI, "<", $filePath) or die "Cannot Open File";
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
	<img src="/cgi-bin/QRreferer.cgi" class="qrcode" alt="" />
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
