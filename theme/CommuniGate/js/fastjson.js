var NativeJson = Object.prototype.toString.call(this.JSON) === '[object JSON]' && this.JSON;
function fastJsonParse (s, reviver) {
          return NativeJson ?
        NativeJson.parse(s,reviver) : YAHOO.lang.JSON.parse(s,reviver);
}
