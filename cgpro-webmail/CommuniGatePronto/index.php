<?php 
$url="";
$cgpurl="";
if ($_SERVER['SERVER_PORT']==2083) {
        $url = "https://". $_SERVER['HTTP_HOST'] . ":9100/?Skin=hPronto-#pronto-login";
}
if ($_SERVER['SERVER_PORT']==2082) {
        $url = "http://". $_SERVER['HTTP_HOST'] . ":8100/?Skin=hPronto-#pronto-login";
}
if ($_SERVER['SERVER_PORT']==2096) {
	$url = "https://". $_SERVER['HTTP_HOST'] . ":9100/?Skin=hPronto-#pronto-login";
}
if ($_SERVER['SERVER_PORT']==2095) {
        $url = "http://". $_SERVER['HTTP_HOST'] . ":8100/?Skin=hPronto-#pronto-login";
}
?>

<script type="text/javascript">
  document.location.href = "<?php echo($url);?>/";
</script>
