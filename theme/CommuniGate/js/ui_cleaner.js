//hide the Notices box if there is no "interesting" HTML in it
function hide_notices_ifempty() {
    var noticeboard = document.getElementById('noticeboard');
    if (!noticeboard) return;

    if ( !/[^\s\n\r]/.test(noticeboard.innerHTML) ) {
        /* the box is empty, so hide it */
        document.getElementById('notices').style.display='none';
    }
}
