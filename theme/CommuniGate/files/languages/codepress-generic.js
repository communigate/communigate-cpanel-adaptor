/*
 * CodePress regular expressions for generic syntax highlighting
 */
 
syntax = [ // generic languages
	/\"(.*?)(\"|<br>|<\/P>)/g,'<s>"$1$2</s>', // strings double quote
	/\'(.*?)(\'|<br>|<\/P>)/g,'<s>\'$1$2</s>', // strings single quote
	/\b(abstract|continue|for|new|switch|default|goto|boolean|do|if|private|this|break|double|protected|throw|byte|else|import|public|throws|case|return|catch|extends|int|short|try|char|final|interface|static|void|class|finally|long|const|float|while|function|label)\b/g,'<b>$1</b>', // reserved words
	/([\(\){}])/g,'<em>$1</em>', // special chars;
	/([^:]|^)\/\/(.*?)(<br|<\/P)/g,'$1<i>//$2</i>$3', // comments //
	/\/\*(.*?)\*\//g,'<i>/*$1*/</i>' // comments /* */
];

CodePress.initialize();

