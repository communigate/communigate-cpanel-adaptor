#!/bin/sh
 eval 'if [ -x /usr/local/cpanel/3rdparty/bin/perl ]; then exec /usr/local/cpanel/3rdparty/bin/perl -x -- $0 ${1+"$@"}; else exec /usr/bin/perl -x $0 ${1+"$@"}; fi;'
    if 0;
#!/usr/bin/perl

use Cpanel::LiveAPI ();
use CGI;

my $q = CGI->new;

my $cpanel = Cpanel::LiveAPI->new();


my $domain = $q->param('domain');
my $lang = $q->param('lang');
my $file = $q->param('file');
my $type = $q->param('type');
my $filedata = $cpanel->api2( 'CommuniGate', 'GetSound', {domain => $domain, lang => $lang, file => $file, type => $type} )->{cpanelresult}->{data}->[0];


print "Content-type: text/html\r\n\r\n";
print <<EOF
<!DOCTYPE HTML>
<html>
  <head>
    <meta charset="utf-8">
    <title>Playing $lang/$file ...</title>
  </head>
  <body>
    <audio controls autoplay autobuffer>
      <source src="data:audio/x-wav;base64,$filedata" type="audio/x-wav">
    </audio> 
    <script type="text/javascript">
      var videoElement = document.createElement('video');
      var support = videoElement.canPlayType('audio/x-wav');
      if (support == "") {
       alert("Your browser does not support the HTML5 audio tag.");
      }
    </script>
  </body>
</html> 
EOF
;

$cpanel->end();
