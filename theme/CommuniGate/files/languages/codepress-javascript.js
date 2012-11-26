/*
 * CodePress regular expressions for JavaScript syntax highlighting
 */
 
syntax = [ // JavaScript
	/\"(.*?)(\"|<br>|<\/P>)/g,'<s>"$1$2</s>', // strings double quote
	/\'(.*?)(\'|<br>|<\/P>)/g,'<s>\'$1$2</s>', // strings single quote
	/\b(break|continue|do|for|new|this|void|case|default|else|function|return|typeof|while|if|label|switch|var|with|catch|boolean|int|try|false|throws|null|true|goto)\b/g,'<b>$1</b>', // reserved words
	/\b(alert|isNaN|parent|Array|parseFloat|parseInt|blur|clearTimeout|prompt|prototype|close|confirm|length|Date|location|Math|document|element|name|self|elements|setTimeout|navigator|status|String|escape|Number|submit|eval|Object|event|onblur|focus|onerror|onfocus|onclick|top|onload|toString|onunload|unescape|open|valueOf|window|onmouseover)\b/g,'<u>$1</u>', // special words
	/([^:]|^)\/\/(.*?)(<br|<\/P)/g,'$1<i>//$2</i>$3', // comments //
	/\/\*(.*?)\*\//g,'<i>/*$1*/</i>' // comments /* */
];

CodePress.initialize();

