function check_required(reqlist) {
    for(var reqfield in reqlist) {
      if (reqlist.hasOwnProperty(reqfield)) {
        if (document.getElementById(reqfield).value == '') {
            alert(reqlist[reqfield] + ' must be filled in.');
            return false;
        }
      }
    }
    return true;
}
