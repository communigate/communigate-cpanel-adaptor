<html>
<pre>
<?php

include("/usr/local/cpanel/php/cpanel.php");


$cpanel = &new CPANEL();
print_r  ( $cpanel->exec('<cpanel print="cow">') );
print_r  ( $cpanel->api1('print','',array('cow')) );
print_r  ( $cpanel->exec('<cpanel setvar="debug=0">') );
print_r  ( $cpanel->api('exec',1,'print','',array('cow')) );
print_r  ( $cpanel->cpanelprint('$homedir') );
print_r  ( $cpanel->cpanelprint('$hasvalidshell') );
print_r  ( $cpanel->cpanelprint('$isreseller') );
print_r  ( $cpanel->cpanelprint('$isresellerlogin') );
print_r  ( $cpanel->exec('<cpanel Branding="file(local.css)">') );
print_r  ( $cpanel->exec('<cpanel Branding="image(ftpaccounts)">') );
print_r  ( $cpanel->api2('Email','listpopswithdisk',array("acct"=>1) ) ) ;
print_r  ( $cpanel->fetch('$CPDATA{\'DNS\'}') );
print_r  ( $cpanel->api2('Ftp','listftpwithdisk',array("skip_acct_types"=>'sub') ) ) ;

if ( $cpanel->cpanelif('$haspostgres') ) { print "Postgres is installed\n"; }
if ( $cpanel->cpanelif('!$haspostgres') ) { print "Postgres is not installed\n"; }
if ($cpanel->cpanelfeature("fileman")) {
        print "The file manager feature is enabled\n";
}
print "test complete\n";
$cpanel->end();

?>
</pre>
</html>
