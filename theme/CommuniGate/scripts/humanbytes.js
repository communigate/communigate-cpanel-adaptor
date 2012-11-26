//This code is in the public domain

function bytes(num) { return num; }
function kilobytes(num) { return (num * 1024); }
function megabytes(num) { return (num * 1024 * 1024); }
function gigabytes(num) { return (num * 1024 * 1024 * 1024); }
function terabytes(num) { return (num * 1024 * 1024 * 1024 * 1024); }
function petabytes(num) { return (num * 1024 * 1024 * 1024 * 1024 * 1024); }
function exabytes(num) { return (num * 1024 * 1024 * 1024 * 1024 * 1024 * 1024); }

function toPrecision(num,per) {
 var precision = per || 2;
 var s = Math.round(num * Math.pow(10, precision)).toString();
 var pos = s.length - precision;
 var last = s.substr(pos, precision);
 return s.substr(0, pos) + (last.match("^0{" + precision + "}$") ? '' : '.' + last);
}

function toHumanSize(num) {
    if (!num || isNaN(num)) {
        return "unknown Bytes";
    }
  if(num < kilobytes(1))  return num + " Bytes";
  if(num < megabytes(1))  return toPrecision((num / kilobytes(1)))  + ' KB';
  if(num < gigabytes(1)) return toPrecision((num / megabytes(1)))  + ' MB';
  if(num < terabytes(1)) return toPrecision((num / gigabytes(1))) + ' GB';
  if(num < petabytes(1)) return toPrecision((num / terabytes(1))) + ' TB';
  if(num < exabytes(1))  return toPrecision((num / petabytes(1)))  + ' PB';
                             return toPrecision((num / exabytes(1)))   + ' EB';
}

