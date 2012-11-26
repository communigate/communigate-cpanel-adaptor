*****************************
* /js2 and /js2-min Folders *
*****************************

The purpose of the /js2 folder is to give structure to our page-specific javascript files.

Whenever an .html page in cPanel needs a substantial amount of javascript it should have a corresponding javascript file located in /js2 to contain that logic.

This is a 1-to-1 mapping, but it does not mean that every .html page will have a corresponding file in /js2 (ie: some pages don't need any page-specific javascript).

The filename of the js file should be the same as the .html page and should reside in the same directory structure as it does from the frontend/theme/ root
ie:
...frontend/x3/mail/popsinclude.html
...frontend/x3/js2/mail/popsinclude.js
...frontend/x3/js2-min/mail/popsinclude.js (minified version)

Any general-purpose functionality that may need to be repeated on multiple pages should go in the CJT.

******************
* File Structure *
******************
js2/*.js - human-readable page-specific javascript file
js2/.build - YUI Compressor packing script
js2/README.txt - this text file
js2-min/*.js - mirror of all the .js files in /js2 minified with the YUI Compressor
