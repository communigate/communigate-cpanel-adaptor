/*
 * CodePress regular expressions for CSS syntax highlighting
 */

syntax = [ // CSS
	/(.*?){(.*?)}/g,'<b>$1</b>{<u>$2</u>}', // tags, ids, classes, values
	/([\w-]*?):([^\/])/g,'<a>$1</a>:$2', // keys
	/\((.*?)\)/g,'(<s>$1</s>)', // parameters
	/\/\*(.*?)\*\//g,'<i>/*$1*/</i>', // comments
];

CodePress.initialize();

