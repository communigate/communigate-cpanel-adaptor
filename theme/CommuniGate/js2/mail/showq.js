function selectBoxes(checkEl,tblId) {
    var ischecked = checkEl.checked;    var checkboxes = document.getElementById(tblId).getElementsByTagName('input');
    for (var i=0;i<checkboxes.length;i++) {
        if (checkboxes[i].type == "checkbox") {
            checkboxes[i].checked=ischecked;
        }
    }
}

