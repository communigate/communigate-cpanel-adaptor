<?php 
$url="";
$cgpurl="";
if ($_SERVER['SERVER_PORT']==2083) {
        $url = "https://". $_SERVER['HTTP_HOST'] . ":9100/cgi-bin/login.pl";
        $cgpurl ="https://". $_SERVER['HTTP_HOST'] . ":9100/";
}
if ($_SERVER['SERVER_PORT']==2082) {
        $url = "http://". $_SERVER['HTTP_HOST'] . ":8100/cgi-bin/login.pl";
        $cgpurl ="http://". $_SERVER['HTTP_HOST'] . ":8100/";
}
if ($_SERVER['SERVER_PORT']==2096) {
	$url = "https://". $_SERVER['HTTP_HOST'] . ":9100/cgi-bin/login.pl";
	$cgpurl ="https://". $_SERVER['HTTP_HOST'] . ":9100/";
}
if ($_SERVER['SERVER_PORT']==2095) {
        $url = "http://". $_SERVER['HTTP_HOST'] . ":8100/cgi-bin/login.pl";
	$cgpurl ="http://". $_SERVER['HTTP_HOST'] . ":8100/";
}
?>
<FORM id="webform" action="<?php echo($url);?>" method="post">
  <input type="hidden" name="user" value="<?php echo($_SERVER["REMOTE_USER"]);?>" />
  <input type="hidden" name="cgpurl" value="<?php echo($cgpurl);?>" />
  <input type="hidden" name="pass" value="<?php echo($_SERVER["REMOTE_PASSWORD"]);?>"  />
 </form>

<script type="text/javascript">
	document.getElementById('webform').submit();
</script>
