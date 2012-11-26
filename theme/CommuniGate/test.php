<?php

header("X-TEST: TEST");

session_start();

?>
<html>
<pre><a href="test.phpcp">RUN THIS TEST WITH PHP BEFORE CPANEL</a>

<?php
print $_SESSION['TEST'];

$_SESSION['TEST'] = "SESSIONS ARE WORKING\n";

echo "PHP ORDER (in relationship to CPANEL PARSER): " . $_SERVER['CPANEL_PHPENGINE'] . "\n";
echo "PHP SELF: $PHP_SELF\n";
echo "NOTE: USE A .phpcp (PHP FIRST) WHEN UPLOADING FILES INSTEAD OF .php OR .cpphp IF YOU CARE ABOUT PERFORMANCE\n";
?>
</pre>
<form method=POST>
<input type=hidden name=POST value="IS WORKING">
<input type=submit value="TEST POST">
</form>
<form method=GET>
<input type=hidden name=GET value="IS WORKING">
<input type=submit value="TEST GET">
</form>
<pre>
<form method=POST enctype="multipart/form-data">
TEST FILE: <input type="FILE" name="FILE_IS_WORKING" value="">
<input type=submit value="TEST FILE">
</form>
<?php

echo "FILE VARS: ";
var_dump($_FILES);
echo "POST VARS: ";
var_dump($_POST);
echo "GET VARS: ";
var_dump($_GET);
<cpanel PHP="loadvars()">
<cpanel PHP="loadparkeddomains()">
<cpanel PHP="loadsubdomains()">
<cpanel PHP="loaddocroots()">
echo "CPANEL VARS:";
var_dump($_CPANEL);
echo "SERVER VARS: ";
var_dump($_SERVER);

print "THE OPERATING SYSTEM IS: ";

?>
<cpanel Serverinfo="os()">
<?php
	print "PHP SHOWS THE USER AS " . $_SERVER['REMOTE_USER'] . "\n";
?>
CPANEL SHOWS THE USER AS <cpanel print="$user">

CPANEL FORM DUMP: <cpanel print="$formdump">
</html>
