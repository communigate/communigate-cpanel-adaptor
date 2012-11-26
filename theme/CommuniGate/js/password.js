/* ***** BEGIN LICENSE BLOCK *****

# cpanel12 - password.js                     Copyright(c) 1997-2008 cPanel, Inc.
#                                                           All Rights Reserved.
# copyright@cpanel.net                                         http://cpanel.net
# This code is subject to the cPanel license. Unauthorized copying is prohibited

* ***** END LICENSE BLOCK ***** 
* ***** BEGIN APPLICABLE CODE BLOCK ***** */

// this function returns the strength of a password
// formula inspired by http://passwordmeter.com
// parameters: password
// returns: strength (integer between 0 and 100)
function getPasswordStrength(password) {
    // list of the worst 500 passwords from the book "Perfect Passwords" by Mark Burnett
    // I added some cPanel-related passwords on the first line
    var worst_passwords = [
    "cpanel","cpanel1","server","hosting","linux","website",
    "123456","porsche","firebird","prince","rosebud","password","guitar","butter","beach","jaguar","12345678","chelsea","united","amateur","great","1234","black","turtle","7777777","cool","pussy","diamond","steelers","muffin","cooper","12345","nascar","tiffany","redsox","1313","dragon","jackson","zxcvbn","star","scorpio","qwerty","cameron","tomcat","testing","mountain","696969","654321","golf","shannon","madison","mustang","computer","bond007","murphy","987654","letmein","amanda",
    "bear","frank","brazil","baseball","wizard","tiger","hannah","lauren","master","xxxxxxxx","doctor","dave","japan","michael","money","gateway","eagle1","naked","football","phoenix","gators","11111","squirt","shadow","mickey","angel","mother","stars","monkey","bailey","junior","nathan","apple","abc123","knight","thx1138","raiders","alexis","pass","iceman","porno","steve","aaaa","fuckme","tigers","badboy","forever","bonnie","6969","purple",
    "debbie","angela","peaches","jordan","andrea","spider","viper","jasmine","harley","horny","melissa","ou812","kevin","ranger","dakota","booger","jake","matt","iwantu","aaaaaa","1212","lovers","qwertyui","jennifer","player","flyers","suckit","danielle","hunter","sunshine","fish","gregory","beaver","fuck","morgan","porn","buddy","4321","2000","starwars","matrix","whatever","4128","test","boomer","teens","young","runner","batman","cowboys",
    "scooby","nicholas","swimming","trustno1","edward","jason","lucky","dolphin","thomas","charles","walter","helpme","gordon","tigger","girls","cumshot","jackie","casper","robert","booboo","boston","monica","stupid","access","coffee","braves","midnight","shit","love","xxxxxx","yankee","college","saturn","buster","bulldog","lover","baby","gemini","1234567","ncc1701","barney","cunt","apples","soccer","rabbit","victor","brian","august","hockey","peanut",
    "tucker","mark","3333","killer","john","princess","startrek","canada","george","johnny","mercedes","sierra","blazer","sexy","gandalf","5150","leather","cumming","andrew","spanky","doggie","232323","hunting","charlie","winter","zzzzzz","4444","kitty","superman","brandy","gunner","beavis","rainbow","asshole","compaq","horney","bigcock","112233","fuckyou","carlos","bubba","happy","arthur","dallas","tennis","2112","sophie","cream","jessica","james",
    "fred","ladies","calvin","panties","mike","johnson","naughty","shaved","pepper","brandon","xxxxx","giants","surfer","1111","fender","tits","booty","samson","austin","anthony","member","blonde","kelly","william","blowme","boobs","fucked","paul","daniel","ferrari","donald","golden","mine","golfer","cookie","bigdaddy","king","summer","chicken","bronco","fire","racing","heather","maverick","penis","sandra","5555","hammer","chicago",
    "voyager","pookie","eagle","yankees","joseph","rangers","packers","hentai","joshua","diablo","birdie","einstein","newyork","maggie","sexsex","trouble","dolphins","little","biteme","hardcore","white","redwings","enter","666666","topgun","chevy","smith","ashley","willie","bigtits","winston","sticky","thunder","welcome","bitches","warrior","cocacola","cowboy","chris","green","sammy","animal","silver","panther","super","slut","broncos","richard","yamaha",
    "qazwsx","8675309","private","fucker","justin","magic","zxcvbnm","skippy","orange","banana","lakers","nipples","marvin","merlin","driver","rachel","power","blondes","michelle","marine","slayer","victoria","enjoy","corvette","angels","scott","asdfgh","girl","bigdog","fishing","2222","vagina","apollo","cheese","david","asdf","toyota","parker","matthew","maddog","video","travis","qwert","121212","hooters","london","hotdog","time","patrick","wilson",
    "7777","paris","sydney","martin","butthead","marlboro","rock","women","freedom","dennis","srinivas","xxxx","voodoo","ginger","fucking","internet","extreme","magnum","blowjob","captain","action","redskins","juice","nicole","bigdick","carter","erotic","abgrtyu","sparky","chester","jasper","dirty","777777","yellow","smokey","monster","ford","dreams","camaro","xavier","teresa","freddy","maxwell","secret","steven","jeremy","arsenal","music","dick","viking",
    "11111111","access14","rush2112","falcon","snoopy","bill","wolf","russia","taylor","blue","crystal","nipple","scorpion","111111","eagles","peter","iloveyou","rebecca","131313","winner","pussies","alex","tester","123123","samantha","cock","florida","mistress","bitch","house","beer","eric","phantom","hello","miller","rocket","legend","billy","scooter","flower","theman","movie","6666","please","jack","oliver","success","albert"        
    ];
    
    // positive metrics
    var n_chars = 0;
    var n_uppercase = 0;
    var n_lowercase = 0;
    var n_numbers = 0;
    var n_symbols = 0;
    var n_middle_number_symbol = 0;
    var n_variety_bonus = 0;
    
    // negative metrics
    var n_letters_only = 0;
    var n_numbers_only = 0;
    var n_repeat_chars = 0;
    var n_consec_uppercase = 0;
    var n_consec_lowercase = 0;
    var n_consec_numbers = 0;
    var n_worst_list = 0;
    
    // get a count of the metrics
    n_chars = password.length;
    var last_char = false;
    for (var i=0; i<n_chars; i++) {
        var character = password.charAt(i);
        
        // uppercase characters
        var uppercase_pattern = new RegExp(/[A-Z]/);
        if (character.match(uppercase_pattern)) {
            n_uppercase++;
            
            if (last_char) {
                if (last_char.match(uppercase_pattern)) n_consec_uppercase++;
            }
        }
        // lowercase characters
        var lowercase_pattern = new RegExp(/[a-z]/);
        if (character.match(lowercase_pattern)) {
            n_lowercase++;
            
            if (last_char) {
                if (last_char.match(lowercase_pattern)) n_consec_lowercase++;
            }
        }
        // numbers
        var number_pattern = new RegExp(/\d/);
        if (character.match(number_pattern)) {
            n_numbers++;
            
            if (last_char) {
                if (last_char.match(number_pattern)) n_consec_numbers++;
            }
        }
        // symbols
        if (character.match(new RegExp(/\W/))) {
            n_symbols++;
        }
        // middle numbers or symbols
        if (i != 0 && i != n_chars-1) {
            if (character.match(new RegExp(/\d/)) || character.match(new RegExp(/\W/))) {
                n_middle_number_symbol++;
            }
        }
        // repeat characters
        for (var j=0; j<n_chars; j++) {
            if (character == password.charAt(j) && j != i) n_repeat_chars++;
        }
        
        last_char = character;
    }
    // letters only
    if (n_numbers == 0 && n_symbols == 0) n_letters_only = n_lowercase + n_uppercase;
    
    // numbers only
    if (n_lowercase == 0 && n_uppercase == 0 && n_symbols == 0) n_numbers_only = n_numbers;
    
    // variety bonus
    var variety = 0;
    if (n_uppercase != 0) variety++;
    if (n_lowercase != 0) variety++;
    if (n_numbers != 0) variety++;
    if (n_symbols != 0) variety++;
    if (n_chars >= 8 && variety >= 3) {
        n_variety_bonus = n_chars;
    }
    
    // check against the worst password's list (case insensitive)
    for (var i=0; i<worst_passwords.length; i++) {
        var worst_pattern = new RegExp(worst_passwords[i], 'i');
        if (password.match(worst_pattern)) n_worst_list++;
    }
    
    // calculate the overall strength based on our metrics
    var strength = 0;
    
    // additive metrics
    strength += n_chars*4;      
    strength += (n_chars - n_uppercase)*2;
    strength += (n_chars - n_lowercase)*2;
    strength += n_numbers*4;
    strength += n_symbols*6;
    strength += n_middle_number_symbol*2;
    strength += n_variety_bonus*2;
    
    // negative metrics
    strength -= n_letters_only;
    strength -= n_numbers_only;
    strength -= n_repeat_chars*(n_repeat_chars-1);
    strength -= n_consec_uppercase*2;
    strength -= n_consec_lowercase*2;
    strength -= n_consec_numbers*2;
    strength -= n_worst_list*(strength/5);
    
    // make sure strength is an integer between 0 and 100
    strength = parseInt(strength);
    if (strength < 0) strength = 0;
    if (strength > 100) strength = 100;
    
    return strength;
}
/* ***** END APPLICABLE CODE BLOCK ***** */