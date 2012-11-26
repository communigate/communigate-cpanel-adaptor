/*
 * CodePress regular expressions for HTML syntax highlighting
 */

syntax = [ // HTML
	/(&lt;[^!]*?&gt;)/g,'<b>$1</b>', // all tags
	/(&lt;a .*?&gt;|&lt;\/a&gt;)/g,'<a>$1</a>', // links
	/(&lt;img .*?&gt;)/g,'<big>$1</big>', // images
	/(&lt;\/?(button|textarea|form|input|select|option|label).*?&gt;)/g,'<u>$1</u>', // forms
	/(&lt;style.*?&gt;)(.*?)(&lt;\/style&gt;)/g,'<em>$1</em><em>$2</em><em>$3</em>', // style tags
	/(&lt;script.*?&gt;)(.*?)(&lt;\/script&gt;)/g,'<strong>$1</strong><tt>$2</tt><strong>$3</strong>', // script tags
	/=(".*?")/g,'=<s>$1</s>', // atributes double quote
	/=('.*?')/g,'=<s>$1</s>', // atributes single quote
	/(&lt;!--.*?--&gt.)/g,'<ins>$1</ins>', // comments 
	/\b(alert|window|document|break|continue|do|for|new|this|void|case|default|else|function|return|typeof|while|if|label|switch|var|with|catch|boolean|int|try|false|throws|null|true|goto)\b/g,'<i>$1</i>', // script reserved words
];

CodePress.initialize();

