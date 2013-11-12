var LAST_SELECTED = null;
var TIMEOUT = 840000; // 14m
var TIMEOUT_ID;
var context;
var HOTKEYS_ENABLED = true;
window.addEvent('domready', function () {
    $$("body")[0].addClass("js");
    var progress = new Progress();
    reloadContent();
    resetTimeout();
    new PopUper($("rename"), $("RenameName"), {
	display: "inline",
	onShow: function () {
	    this.nameSpan = $("fileList").getElement("li.selected span.name");
	    this.newField.set("value", this.nameSpan.getElement("a").get("text"));
	    this.nameSpan.setStyle("display", "none");
	    this.frame.inject(this.nameSpan, "after");
	},
	onHide: function () {
 	    this.nameSpan.setStyle("display", "block");
	},
	onDone: function () {
	    this.nameSpan.getParent().getElement("span.check input").checked = true;
	}
    });
    new PopUper($("CreateDir"), $("NewName"), {
	display: "inline",
	onShow: function () {
	    if (! this.isVisible) {
		this.li = new Element("li", {"class": "folder"});
		this.li.inject($("fileList"), "top");
		this.frame.inject(this.li);
		this.isVisible = true;
	    }
	},
	onHide: function () {
	    if (this.isVisible) {
		this.li.setStyle("display", "none");
		this.isVisible = false;
	    }
	},
	onDone: function () {
	    this.isVisible = false;
	}
    });

    if ('FormData' in window) {
	// Form.MultipleFileInput instance
	var inputFiles = new Form.MultipleFileInput($("uploadField"), $$("body")[0], {
	    onDragenter: $$("body")[0].addClass.pass('hover', $$("body")[0]),
	    onDragleave: $$("body")[0].removeClass.pass('hover', $$("body")[0]),
	    onDrop: function() {
		$('uploadForm').fireEvent('submit');
		$$("body")[0].removeClass('hover');
	    }
	});
	var rowReq = new RowRequest(progress, inputFiles);
	$('uploadButton').addEvent('click', function(e) {
	    e.preventDefault();
	});
	$$("body")[0].addClass("formdata");
    } else {
	$$("body")[0].addClass("no-formdata");
    }
    $('uploadForm').addEvent("submit", function (e) {
	if ('FormData' in window) {
	    // e.preventDefault();
	    // rowReq.appendFiles(inputFiles.getFiles(), String($$("input.subdir")[0].get("value")).replace("private/", ""));
	    rowReq.appendFiles(inputFiles.getFiles(), String($$("input.subdir")[0].get("value")));
 	    inputFiles._files = [];
	} else {
	    new Toast("Upload started!");
	    this.submit();
	}
   });
    $('uploadField').addEvent("change", function () {
	$('uploadForm').fireEvent("submit");
    });
    var dummyEl = new Element("div");
    var formReq = new Form.Request("updateForm", dummyEl, {
	onSuccess: function (something, text) {
		reloadContent();
	    if (text[0].data.clean() != "OK") {
		new Toast("Action failed: " + text[0].data.clean(), { customClass: "failure"});
	    }
	    dummyEl.empty();
	}
    });
    $('updateForm').addEvent("submit", function (e) {
	e.preventDefault();
	formReq.send();
    });
    $('RenameName').addEvent("keydown", function (e) {
	if (e.key == "enter") {
	    e.stop();
	    $('rename').click();
	}
    });
    $('NewName').addEvent("keydown", function (e) {
	if (e.key == "enter") {
	    e.stop();
	    $('CreateDir').click();
	}
    });
    // enable massShare button
    var shareButton = new Element("input", {
	"type": "button",
	"value": "Share",
	"title": "Share Link",
	"class": "button share-button"
    }).inject($("buttons"));
    shareButton.addEvent("click", function(e) {
	e.preventDefault();
	shareThemAll();
    });
    // enable Copy buttons
    var copyButton = new Element("input", {
	"type": "button",
	"value": "Copy",
	"title": "Copy Selection",
	"class": "button copy-button"
    }).inject($("buttons"));
    copyButton.addEvent("click", function(e) {
	e.preventDefault();
	new Mover("copy");
    });
    var moveButton = new Element("input", {
	"type": "button",
	"value": "Move",
	"title": "Move Selection",
	"class": "button move-button"
    }).inject($("buttons"));
    moveButton.addEvent("click", function(e) {
	e.preventDefault();
	new Mover("move");
    });
    // Search field
    var searchBox = new Element("input", {"type": "text", "name": "search", "id": "search", "class": "text"}).inject($("buttons"));
    var searchClear = new Element("span", {"id": "searchClear", title: "clear"}).set("text","clear").inject($("buttons"));
    searchBox.addEvent("keyup", function (e) {
	if (e.key == "enter") e.preventDefault();
	if (this.get("value")) {
	    reloadContent("search.wcgp", this.get("value"));
	    searchClear.setStyle("display", "block");
	    searchBox.addClass("search-active");
	} else {
	    reloadContent();
	    searchBox.removeClass("search-active");
	    searchClear.setStyle("display", "none");
	}
    });
    searchClear.addEvent("click", function () {
	searchBox.set("value", "");
	searchBox.removeClass("search-active");
	searchClear.setStyle("display", "none");
	reloadContent();
    });
    // Golobal keybindings
    $(document.body).addEvent("keydown", function (e) {
	    if (e.control == true && e.shift == true && e.key == "a") {
		e.preventDefault();
		if (HOTKEYS_ENABLED) {
		    $$("#fileList li.folder, #fileList li.file").removeClass("selected");
		    $$("#fileList li.folder .check input, #fileList li.file .check input").set("checked", false);
		    toggleButtons();
		}
	    } else if (e.control == true && e.key == "a") {
		e.preventDefault();
		if (HOTKEYS_ENABLED) {
		    $$("#fileList li.folder, #fileList li.file").addClass("selected");
		    $$("#fileList li.folder .check input, #fileList li.file .check input").set("checked", true);
		    toggleButtons();
		}
	    } else if (e.key == "delete") {
		// if (HOTKEYS_ENABLED) {
		//     $("delete").click();
		// }
	    } else if (e.key == "f5") {
		// e.preventDefault();
		// reloadContent();
	    }
    });
});

var resetTimeout = function () {
    if (TIMEOUT_ID) window.clearTimeout(TIMEOUT_ID);
    TIMEOUT_ID = (function () { window.location.assign("Bye.wssp") }).delay(TIMEOUT);
};

var buildFileList = function (object, container, preservePath) {
    if (!object.path) {
	object.path = "";
    }
    if (object.Upper && !preservePath) {
	var li = new Element("li", {"class": "up"});
	var name = new Element("span", {"class": "name"}).inject(li);
	var subfolders = object.path.split("/");
	if (object.path.match(/^~/)) subfolders.unshift("");
	var total_path = [];
	for (var i = 0; i < subfolders.length; i++ ) {
	    if (i == subfolders.length - 1 || (subfolders[i].match(/\~/) && subfolders[i].match(/\@/) && i == 1) || (i == 2 && subfolders[i] == "private")) {
		var subfoldersName = subfolders[i];
		if (i == 2 && subfolders[i] == "private") subfoldersName = "ProntoDrive";
 		new Element("em", {"class": "nolink"}).set("text", subfoldersName).inject(name);
		if (i != subfolders.length - 1) {
		    total_path.push(subfolders[i]);
		    new Element("em", {"class": "crumbs-separator"}).set("text", " > ").inject(name);
		}
 	    } else {
		total_path.push(subfolders[i]);
		var totalString = total_path.join("/");
		if (object.path.match(/^~/)) {
		    totalString = totalString.replace(/^\//,"");
		}
 		new Element("a", {"class": "crumb","href": "ProntoDrive.wcgp?path=" + totalString}).set("text", subfolders[i] || "Pronto!Drive").inject(name);
 		new Element("em", {"class": "crumbs-separator"}).set("text", " > ").inject(name);
	    }
	}
	li.inject(container);
	li.getElements("a.crumb").addEvent("click", function (e) {
	    e.preventDefault();
	    $$("input.subdir").set("value", "private/" + unescape(this.href.split("path=")[1]));
	    reloadContent();
	});
    }
    if (object.Folders) {
	object.Folders.each(function (folder) {
	    var li = new Element("li", {"class": "folder"});
	    var check = new Element("span", {"class": "check"}).inject(li);
 	    new Element("input", {"type": "checkbox", "name" : "folder", "value" : folder.Name}).inject(check);
	    folder.Path = folder.Path.replace(/^private/, "");
	    folder.Path = folder.Path.replace(/^\s+/, "");
	    var name = new Element("span", {"class": "name"}).inject(li);
 	    var link = new Element("a", {"href": "ProntoDrive.wcgp?path=" + folder.Path + "/" + folder.Name});
	    var share = new Element("span", {"class": "share"}).inject(li);
 	    var shareLink = new Element("a", {"href": "ShareFile.wcgp?file=" + folder.Path + "/" + folder.Name, "title": "Share Link"}).set("text", "Share").inject(share);
	    if (!object.Shared) {
		var usershare = new Element("span", {"class": "usershare"}).inject(li);
 		var usershareLink = new Element("a", {"href": "/sys/ProntoDriveAccess.wcgp?s=" + SESSION_ID + "&folder=" + folder.Path + "/" + folder.Name, "title": "Usershare Link"}).set("text", "Usershare").inject(usershare);
 	    }
 	    if (object.Shared) {
	    	var usershare = new Element("span", {"class": "usershare"}).set("html", "&nbsp;").inject(li);
	    }
	    var fullpath;
	    if (object.Shared) {
		fullpath = folder.Path + "/" + folder.Name;
	    } else {
		fullpath = "private/" + folder.Path + "/" + folder.Name;
	    }
	    link.addEvent("click", function (e) {
		e.preventDefault();
		$$("input.subdir").set("value", fullpath);
		reloadContent();
	    });
	    if (!object.Shared) {
		usershareLink.addEvent("click", function (e) {
		    e.preventDefault();
		    new Framer(folder.Path + "/" + folder.Name);
		});
	    }
	    if (preservePath) {
		if (folder.Path) folder.Name = folder.Path + " > " + folder.Name;
		folder.Name = folder.Name.replace(/^\/+/, "").replace(/\//g, " > ");
	    }
	    link.set("text", folder.Name).inject(name);
	    shareLink.addEvent("click", function (e) {
	    	e.preventDefault();
	    	window.open(shareLink.get('href'));
	    });
	    new Element("span", {"class": "modified"}).set("text", folder.Modified).inject(li);
	    li.inject(container);
	});
	object.Files.each(function (file) {
	    var li = new Element("li", {"class": "file file-" + file.Ext });
	    var check = new Element("span", {"class": "check"}).inject(li);
 	    new Element("input", {"type": "checkbox", "name" : "file", "value" : file.Name}).inject(check);
	    var name = new Element("span", {"class": "name"}).inject(li);
	    file.Path = file.Path.replace(/^private/, "");
	    file.Path = file.Path.replace(/^\s+/, "");
	    var fullpath;
	    if (object.Shared) {
		fullpath = file.Path + "/" + file.Name;
	    } else {
		fullpath = "private/" + file.Path + "/" + file.Name;
	    }
 	    var link = new Element("a", {"href": "WebFile/" + fullpath}).inject(name);
	    var share = new Element("span", {"class": "share"}).inject(li);
 	    var shareLink = new Element("a", {"href": "ShareFile.wcgp?file=" + file.Path + "/" + file.Name, "title": "Share Link"}).set("text", "Share").inject(share);
	    var usershare = new Element("span", {"class": "usershare"}).inject(li);
 	    var downloadLink = new Element("a", {"href": "WebFile/" + fullpath, "class": "download"}).inject(usershare).set('text','Download');
	    if (preservePath) {
		file.Name = file.Path + "/" + file.Name;
		file.Name = file.Name.replace(/^\//, "").replace(/\//g, " > ");
	    }
	    link.set("text", file.Name);
	    if (file.Name.match(/\.(jpg|png|gif|jpeg)$/i)) {
		link.addClass('lightbox');
	    } else {
		link.addEvent("click", function (e) {
		    e.preventDefault();
		    window.open(link.get('href'));
		});
	    }
	    downloadLink.addEvent("click", function (e) {
		e.preventDefault();
		window.open(link.get('href'));
	    });
	    shareLink.addEvent("click", function (e) {
		e.preventDefault();
		window.open(shareLink.get('href'));
	    });
	    new Element("span", {"class": "modified"}).set("text", file.Modified).inject(li);
	    new Element("span", {"class": "size"}).set("text", file.Size).inject(li);
	    li.inject(container);
	});
	if (object.Subscriptions) {
	    object.Subscriptions.each(function (folder, id) {
		var li = new Element("li", {"class": "folder-shared"});
		var check = new Element("span", {"class": "check"}).inject(li);
		var name = new Element("span", {"class": "name"}).inject(li);
 		var link = new Element("a", {"href": "ProntoDrive.wcgp?path=" + folder});
		link.addEvent("click", function (e) {
		    e.preventDefault();
		    $$("input.subdir").set("value", folder);
		    reloadContent();
		});
		var remove = new Element("span", {"class": "remove"}).inject(li);
 		var removeLink = new Element("a", {"href": "updateSubscription.wcgp?action=remove&folder=" + folder, "title": "Remove"}).set("text", "Remove").inject(remove);

		linkText = folder;
		linkText = linkText.replace(/^.*\//, "");
		link.set("text", linkText).inject(name);
		li.inject(container);
	    });
	    var li = new Element("li", {"class": "folder-shared-add"});
	    var check = new Element("span", {"class": "check"}).inject(li);
	    var name = new Element("span", {"class": "name"}).inject(li);
 	    var link = new Element("a", {"href": "importSubscription.wcgp"});
	    link.addEvent("click", function (e) {
		// e.preventDefault();
		// reloadContent();
	    });
	    var add = new Element("span", {"class": "add"}).inject(li);

	    linkText = "Add Subscription";
	    linkText = linkText.replace(/^.*\//, "");
	    link.set("text", linkText).inject(name);
	    li.inject(container);
	}
    }
    $$('a.lightbox').cerabox();
}

var reloadContent = function (url, search) {
    if (!url) url = 'list.wcgp';
    $('fileList').fade(0.3);
    var path =  String($$("input.subdir")[0].get("value"));
    if (!path.match(/^~/)) path = path.replace("private/", "");
    new Request.JSON({url: url,
    		      onSuccess: function(list){
			  resetTimeout();
    			  $('fileList').empty();
			  if (search) {
    			      buildFileList(list, $('fileList'), true);
			  } else {
    			      buildFileList(list, $('fileList'), false);
			  }
			  if ($('dragndrop')) $('dragndrop').destroy();
			  if (list.Folders.length + list.Files.length == 0 && 'FormData' in window && !Browser.isMobile && !search && !list.notFound) {
			      new Element("p", {"id" : "dragndrop"}).set("text", "Drag and drop files from your desktop or use the upload icon above.").inject($('mainSection'));
			  }
			  if (list.notFound) {
			      new Toast("No access to folder: " + list.notFound, { customClass: "failure"});
			  }
    			  $('fileList').fade(1);
			  // Reattach events for selection
			  $$('#fileList li.file, #fileList li.folder').addEvent("click", function (e) {
			      var checked = this.getElement("input").checked;
			      if (e.control == true || Browser.isMobile) {
				  this.getElement("input").checked = !this.getElement("input").checked;
				  this.toggleClass("selected");
			      } else if (e.shift == true) {
				  var myId = $$('#fileList li.file, #fileList li.folder').indexOf(this);
				  if (LAST_SELECTED) {
				      var lastId = $$('#fileList li.file, #fileList li.folder').indexOf(LAST_SELECTED);
				      if (myId >= 0 && lastId >= 0) {
					  if (myId < lastId) {
					      var tmp = myId;
					      myId = lastId;
					      lastId = tmp;
					  }
					  for (var i = lastId; i <= myId; i++ ) {
					      $$('#fileList li.file, #fileList li.folder')[i].addClass("selected");
					      $$('#fileList li.file input, #fileList li.folder input')[i].checked = true;
					  }
				      }
				  }
				  this.getElement("input").checked = true;
				  this.addClass("selected");
			      } else {
				  $$('#fileList li.file input, #fileList li.folder input').each(function (input) {
				      input.checked = false;
				  }, this);
				  $$('#fileList li.file, #fileList li.folder').removeClass("selected");
				  this.getElement("input").checked = !checked;
				  if (checked) {
				      this.removeClass("selected");
				  } else {
				      this.addClass("selected");
				  }
			      }
			      if (this.getElement("input").checked) LAST_SELECTED = this;
			      toggleButtons();
			  });
			  //create a context menu
			  context = new ContextMenu({
			      targets: 'body, #fileList li.file, #fileList li.folder',
			      menu: 'contextmenu',
			      actions: {
				  "delete": function(element,ref) {
				      if (context.once) {
					  context.once = false;
					  $("delete").click();
				      }
				  },
				  "rename": function(element,ref) {
				      if (context.once) {
					  context.once = false;
					  $("rename-clone").click();
				      }
				  },
				  "copy": function(element,ref) {
				      if (context.once) {
					  context.once = false;
					  new Mover('copy');
				      }
				  },
				  "move": function(element,ref) {
				      if (context.once) {
					  context.once = false;
					  new Mover('move');
 				      }
				  },
				  "createfolder": function(element,ref) {
				      if (context.once) {
					  context.once = false;
					  $("CreateDir-clone").click();
				      }
				  },
				  "sharelink": function(element,ref) {
				      if (context.once) {
					  context.once = false;
					  shareThemAll(element, ref);
				      }
				  }
 			      },
			      onShow: function (element) {
				  context.once = true;
				  if ($$("#fileList li.selected").length == 0) {
				      element.addClass("selected");
				      element.getElement("input").checked = true;
				      toggleButtons();
				  }
			      }
			  });
			  toggleButtons();
    		      }
    		     }).get({"path" : path, "search": search });
}

var toggleButtons = function () {
    // Show/Hide Buttons
    $$(".buttons input").setStyle("display", "none");
    $$(".buttons input#search").setStyle("display", "block");
    $$(".buttons input.create-clone").setStyle("display", "inline-block");
    context.disableItem('rename');
    context.disableItem('delete');
    context.disableItem('download');
    context.disableItem('sharelink');
    if ($$('#fileList li.selected').length == 1) {
 	$$(".buttons input.rename-clone").setStyle("display", "inline-block");
 	$$(".buttons input.delete").setStyle("display", "inline-block");
 	$$(".buttons input.share-button").setStyle("display", "inline-block");
 	$$(".buttons input.copy-button").setStyle("display", "inline-block");
 	$$(".buttons input.move-button").setStyle("display", "inline-block");
	context.enableItem('rename');
	context.enableItem('download');
	context.enableItem('sharelink');
	context.enableItem('delete');
    } else if ($$('#fileList li.selected').length > 1) {
	$$(".buttons input.delete").setStyle("display", "inline-block");
 	$$(".buttons input.share-button").setStyle("display", "inline-block");
	context.enableItem('sharelink');
	context.enableItem('delete');
    }
}

var shareThemAll = function (el, ref) {
    var path = $$("#fileList li.selected").map(function (item) { return "file=" + item.getElement(".share a").get("href").split("=")[1]});
    window.open("ShareFile.wcgp?" + path.join("&"));
};

RowRequest = new Class ({
    Implements: [Options],
    options: {
    },
    initialize: function(progress, inputFiles) {
	this.progress = progress;
	this.inputFiles = inputFiles;
	this.files = [];
	this.uploading = false;
    },
    appendFiles: function (files, path) {
	for (var i = 0; i < files.length; i++) {
	    if (files[i].size > 0) {
		files[i].destPath = path;
		this.files.push(files[i]);
		this.progress.addUploadingFile(files[i]);
	    } else {
		new Toast("File with 0 size ot folders are not acceptable: " + files[i].name, { customClass: "failure"});
	    }
	}
	if (this.uploading == false) {
	    this.uploadFiles();
	}
    },
    uploadFiles: function () {
	var file = this.files.shift();
	if (file) {
	    this.uploading = true;
	    that = this;
	    new Toast("File upload started: " + file.name);
	    this.progress.startUploading(file);
		var request = new Request.File({
	    	    url: 'website.wssp',
	    	    onProgress: function(data) {
	    		that.progress.onProgress(data.loaded);
	    	    },
	    	    onSuccess: function(data) {
	    		that.progress.removeUploadingFile(file.name);
	    		that.uploadFiles();
			reloadContent();
			if ( "OK" == data.clean()) {
			    new Toast( file.name + " uploaded!");
			} else {
			    new Toast("Failed to upload " + file.name + ": " + data.clean(), {customClass : "failure"});
			}
	    	    },
		    onFailure: function(xhr) {
	    		that.progress.removeUploadingFile(file.name);
			new Toast("Failed to upload " + file.name, {customClass : "failure"});
			console.log(xhr);
	    		that.uploadFiles();
		    },
		    onException: function(headerName, value) {
	    		that.progress.removeUploadingFile(file.name);
			new Toast("Got exeption while uploading " + file.name, {customClass : "failure"});
	    		that.uploadFiles();
		    }
		});
		if (!file.destPath) file.destPath = "";
		request.append('Upload' , file);
		request.append('Create',1);
		request.append('SubDir', file.destPath );
		request.send();
	} else {
	    this.uploading = false;
	}
    }
});

Progress = new Class ({
    Implements: [Options],
    options: {
    },
    initialize: function(){
    	this.uploadingFilesCount = 0;
     	this.totalFiles = 0;
     	this.totalSize = 0;
	this.totalUploadedSize = 0;
     	this.progress = $('progressbox');
     	this.progressBar = $('progressbox-progress');
     	this.progressNumber = $('progressbox-number');
     	this.progressTotal = $('progressbox-total');
     	this.progressFileName = $('progressbox-filename');
     	this.progressNumber.set('text', '0');
	this.CurrentFile = {};
    },
    addUploadingFile: function (file) {
    	if (this.progress.getStyle("display") == "none") {
    	    this.progress.setStyle("display", "block");
    	}
    	this.totalFiles = this.totalFiles + 1;
    	this.totalSize = this.totalSize + file.size;
    	this.progressTotal.set('text',this.totalFiles);
    	this.progressNumber.set('text',this.uploadingFilesCount);
    },
    startUploading: function (file) {
    	this.uploadingFilesCount = this.uploadingFilesCount  + 1;
	this.CurrentFile = file;
	this.CurrentFile.uploaded = 0;
    	this.progressNumber.set('text',this.uploadingFilesCount);
    	this.progressFileName.set('text',file.name);
    },
    removeUploadingFile: function (fileName) {
    	if (this.totalFiles == this.uploadingFilesCount) {
    	    this.totalFiles = 0;
    	    this.uploadingFilesCount = 0;
    	    this.progressBar.setStyle("width", "0%");
    	    this.progressNumber.set('text', '0');
    	    this.progress.setStyle("display", "none");
    	    this.totalSize = 0;
	    this.totalUploadedSize = 0;
    	}
    },
    onProgress: function (uploaded) {
	var oldUploaded = this.CurrentFile.uploaded;
    	if (uploaded < this.CurrentFile.uploaded) {
    	    this.CurrentFile.uploaded = this.CurrentFile.size;
    	} else {
    	    this.CurrentFile.uploaded = uploaded;
    	}
	this.totalUploadedSize = this.totalUploadedSize + this.CurrentFile.uploaded - oldUploaded;
    	var precent = Math.round(this.totalUploadedSize * 100/this.totalSize);
    	this.progressBar.setStyle("width", precent + "%");
    }
});

Toast = new Class ({
    Implements: [Options],
    options: {
	customClass: ""
    },
    initialize: function(message, options) {
	this.setOptions(options);
	var classString = "toast";
	if (this.options.customClass) classString = classString + " toast-" + this.options.customClass;
	this.toast = new Element("div", {"class": classString});
	this.toast.set("text", message);
	this.toast.set("opacity", 0);
	this.toast.inject($("toast"));
	$("toast").setStyle("display", "block");
	this.toast.fade("in");
	this.hide.delay(5000, this);
    },
    hide: function () {
	this.toast.fade("out");
	this.destroy.delay(1000, this);
    },
    destroy: function () {
	this.toast.destroy();
	if ($("toast").getChildren().length == 0) $("toast").setStyle("display", "none");
    }
});

function clickLink(link) {
    var cancelled = false;
    if (document.createEvent) {
        var event = document.createEvent("MouseEvents");
        event.initMouseEvent("click", false, true, window,
			     0, 0, 0, 0, 0,
			     false, false, false, false,
			     0, null);
        cancelled = !link.dispatchEvent(event);
    }
    else if (link.fireEvent) {
        cancelled = !link.fireEvent("onclick");
    }
}

// Context Menu CLASS
var ContextMenu = new Class({

    //implements
    Implements: [Options,Events],

    //options
    options: {
	actions: {},
	menu: 'contextmenu',
	stopEvent: true,
	targets: 'body',
	trigger: 'contextmenu',
	offsets: { x:0, y:0 },
	onShow: $empty,
	onHide: $empty,
	onClick: $empty,
	fadeSpeed: 200
    },

    //initialization
    initialize: function(options) {
	//set options
	this.setOptions(options)

	//option diffs menu
	this.menu = $(this.options.menu);
	this.targets = $$(this.options.targets);

	//fx
	this.fx = new Fx.Tween(this.menu, { property: 'opacity', duration:this.options.fadeSpeed });

	//hide and begin the listener
	this.hide().startListener();

	//hide the menu
	this.menu.setStyles({ 'position':'absolute','top':'-900000px', 'display':'block' });
    },

    //get things started
    startListener: function() {
	/* all elements */
	this.targets.each(function(el) {
	    /* show the menu */
	    el.addEvent(this.options.trigger,function(e) {
		//enabled?
		if(!this.options.disabled) {
		    //prevent default, if told to
		    if(this.options.stopEvent) { e.stop(); }
		    //record this as the trigger
		    this.options.element = $(el);
		    //position the menu
		    this.menu.setStyles({
			top: (e.page.y + this.options.offsets.y),
			left: (e.page.x + this.options.offsets.x),
			position: 'absolute',
			'z-index': '2000'
		    });
		    //show the menu
		    this.show(el);
		}
	    }.bind(this));
	},this);

	/* menu items */
	this.menu.getElements('a').each(function(item) {
	    item.addEvent('click',function(e) {
		e.preventDefault();
		if(!item.hasClass('disabled')) {
		    this.execute(item.get('href').split('#')[1],$(this.options.element));
		    this.fireEvent('click',[item,e]);
		}
	    }.bind(this));
	},this);

	//hide on body click
	$(document.body).addEvent('click', function() {
	    this.hide();
	}.bind(this));
    },

    //show menu
    show: function(trigger) {
	//this.menu.fade('in');
	this.fx.start(1);
	this.menu.setStyle("display", "block");
	this.fireEvent('show',[trigger]);
	this.shown = true;
	return this;
    },

    //hide the menu
    hide: function(trigger) {
	if(this.shown)
	{
	    this.menu.setStyle("display", "none");
	    this.fireEvent('hide');
	    this.shown = false;
	}
	return this;
    },

    //disable an item
    disableItem: function(item) {
	this.menu.getElements('a[href$=' + item + ']').addClass('disabled');
	return this;
    },

    //enable an item
    enableItem: function(item) {
	this.menu.getElements('a[href$=' + item + ']').removeClass('disabled');
	return this;
    },

    //diable the entire menu
    disable: function() {
	this.options.disabled = true;
	return this;
    },

    //enable the entire menu
    enable: function() {
	this.options.disabled = false;
	return this;
    },

    //execute an action
    execute: function(action,element) {
	if(this.options.actions[action]) {
	    this.options.actions[action](element,this);
	}
	return this;
    }

});


var PopUper = new Class({
    Implements: [Options,Events],
    options: {
	wrapper: $$("body")[0],
	display: "block"
    },
    initialize: function(button, field, options) {
	//set options
	this.setOptions(options)
	this.button = $(button);
	this.field = $(field);
	this.isVisible = false;
	this.buttonClone = new Element("input", {
	    "type": "button",
	    "value": this.button.get("value"),
	    "title": this.button.get("value"),
	    "class": this.button.get("class") + "-clone",
	    "id": this.button.get("id") + "-clone"
	}).inject(this.button, "before");
	this.frame = new Element("div", {
	    "class": "popuper-frame"
	}).inject(this.options.wrapper);

	this.newField = new Element("input", {
	    "type": "text",
	    "value": this.field.get("value"),
	    "class": this.field.get("class") + "-new text"
	}).inject(this.frame);

	this.newButton = new Element("input", {
	    "type": "button",
	    "value": this.button.get("value"),
	    "class": this.button.get("class") + "-new button " + this.button.get("class") + "-button"
	}).inject(this.frame);

	this.close = new Element("a", {
	    "href": "#",
	    "class": "popuper-close"
	}).set("text", "cancel").inject(this.frame);

	this.buttonClone.addEvent("click", function (e) {
	    e.preventDefault();
	    this.show();
	}.bind(this));

	this.newButton.addEvent("click", function (e) {
	    e.preventDefault();
	    this.done();
	}.bind(this));

	this.close.addEvent("click", function (e) {
	    e.preventDefault();
	    this.hide();
	}.bind(this));

	this.newField.addEvent("keydown", function (e) {
	    if (e.key == "enter") {
		e.preventDefault();
		this.done();
	    }
	}.bind(this));
	this.fireEvent("create");
	return this;
    },
    show: function () {
	this.fireEvent("show");
	this.frame.setStyle("display", this.options.display);
	this.newField.focus();
    },
    hide: function () {
	this.fireEvent("hide");
	this.frame.setStyle("display", "none");
    },
    done: function () {
	this.fireEvent("done");
	this.field.set("value", this.newField.get("value"));
	this.button.click();
    }

});

(function(){
    Browser.Device = {
	name: 'other'
    };
    if (Browser.Platform.ios){
	var device = navigator.userAgent.toLowerCase().match(/(ip(ad|od|hone))/)[0];
	Browser.Device[device] = true;
	Browser.Device.name = device;
    }
    if (this.devicePixelRatio == 2)
	Browser.hasHighResolution = true;
    Browser.isMobile = !['mac', 'linux', 'win'].contains(Browser.Platform.name);
}).call(this);

var Framer = new Class({
    Implements: [Options,Events],
    options: {
	display: "block"
    },
    initialize: function(folder, options) {
	//set options
	this.setOptions(options)
	this.frame = $("overlay");
	this.folder = folder;
	this.isVisible = false;
	this.close = new Element("a", {
	    "href": "#",
	    "class": "framer-close"
	}).set("text", "cancel");
	this.close.addEvent("click", function (e) {
	    e.preventDefault();
	    this.hide();
	}.bind(this));
	this.fx = new Fx.Tween(this.frame, {
	    'unit': "%",
	    "property": "left"
	});
	this.frame.setStyle("left", "-100%");
	new Request.HTML({
	    url: '/sys/ProntoDriveAccess.wcgp',
	    update: this.frame,
	    onSuccess: function () {
		this.close.inject(this.frame.getElement("p.submit"));
		activateHelps(this.frame);
		this.show();
		var form = this.frame.getElement("form");
		form.addEvent("submit", function (e) {
		    e.preventDefault();
		    new Request.HTML({
			url: '/sys/ProntoDriveAccess.wcgp?' + Object.toQueryString({'s': SESSION_ID, 'folder': this.folder, 'dynamic': 1}),
			onSuccess: function () {
			    this.hide();
			}.bind(this)
		    }).post(form.toQueryString());
		}.bind(this));
	    }.bind(this)
	}).get({'s': SESSION_ID, 'folder': this.folder, 'dynamic': 1});
	return this;
    },
    show: function () {
	this.fireEvent("show");
	HOTKEYS_ENABLED = false;
	this.frame.setStyle("display", this.options.display);
	this.fx.start(-100, 0);
    },
    hide: function () {
	this.fireEvent("hide");
	HOTKEYS_ENABLED = true;
	this.fx.start(0, -100);
	(function(){ this.frame.setStyle("display", "none"); }).delay(1000, this);
    },
    done: function () {
	this.fireEvent("done");
	HOTKEYS_ENABLED = true;
	this.field.set("value", this.newField.get("value"));
	this.button.click();
    }

});

var Mover = new Class({
    Implements: [Options,Events],
    options: {
	display: "block"
    },
    initialize: function(context, options) {
	//set options
	this.setOptions(options)
	this.frame = $("overlay");
	this.context = context;
	this.isVisible = false;
	this.close = new Element("a", {
	    "href": "#",
	    "class": "framer-close"
	}).set("text", "cancel");
	this.close.addEvent("click", function (e) {
	    e.preventDefault();
	    this.hide();
	}.bind(this));
	this.fx = new Fx.Tween(this.frame, {
	    'unit': "%",
	    "property": "left"
	});
	this.frame.setStyle("left", "-100%");
	this.buildFolderList("", this.frame);
	return this;
    },
    buildFolderList: function (path, parent) {
	if (path == "") {
	    var ul = new Element("ul", {"class": "folderlist"}).inject(parent);
	    this.buildFoldersDom([{"Name": "/"}], ul, path);
	    parent = ul.getElement("li");
	    parent.getElement(".expand").addClass("expanded");
	}
	new Request.JSON({
	    url: 'list.wcgp',
	    onSuccess: function (list) {
		var ul = new Element("ul", {"class": "folderlist"}).inject(parent);
		if (list.Folders) {
		    this.buildFoldersDom(list.Folders, ul, path);
		}
		if (list.Subscriptions) {
		    this.buildFoldersDom(list.Subscriptions, ul, path, 1);
		}
		if (path == "") {
		    var p = new Element("p", {"class": "submit"}).inject(this.frame);
		    new Element("h2").set("text", this.context + " selection to").inject(this.frame, "top");
		    var submit = new Element("input", {"type": "submit", "value" : this.context}).inject(p);
		    p.appendText(" or ");
		    this.close.inject(p);
		    submit.addEvent("click", function (e) {
			e.preventDefault();
			if (this.destination) {
			    var str = Object.toQueryString({'destination': this.destination, 'context': this.context, 'dynamic': 1}) + "&" + $("updateForm").toQueryString();
			    str = str.replace("private%2F~", "~");
			    new Toast(this.context + " started!");
			    new Request.JSON({
				url: 'copymove.wcgp',
				onSuccess: function (errors) {
				    errors.each(function (error) {
					new Toast(error, { customClass: "failure"});
				    });
				    if (! errors.length) new Toast("All files copied successfully!");
				    reloadContent();
				    this.hide();
				}.bind(this)
			    }).get(str);
			} else {
			    alert("Please select destination folder!");
			}
		    }.bind(this));

		    this.show();
		}
		parent.loaded = true;
	    }.bind(this)
	}).get({'path': path});
    },
    buildFoldersDom: function (object, ul, path, shared) {
	object.each(function (folder) {
	    var folderName = folder.Name;
	    if (shared) {
		folderName = folder;
	    }
	    var li = new Element("li").inject(ul);
	    if (shared) li.addClass("shared");
	    var wrap = new Element("span", {"class": "spanwrap"}).inject(li);
	    var expand = new Element("span", {"class" : "expand"}).inject(wrap);
	    var name = new Element("span", {"class" : "name"}).set('text', folderName).inject(wrap);
	    var pth = path + "/" + folderName;
	    pth = pth.replace("\/~", "~");
	    expand.addEvent("click", function () {
		if (! li.loaded) {
		    this.buildFolderList(pth , li);
		}
		if (expand.hasClass('expanded')) {
		    li.getChildren("ul").setStyle('display',"none");
		    expand.removeClass('expanded');
		} else {
		    li.getChildren("ul").setStyle('display',"block");
		    expand.addClass('expanded');
		}
	    }.bind(this));
	    wrap.addEvent("click", function () {
		$$("#overlay .folderlist li").removeClass("selected");
		li.addClass("selected");
		this.destination = pth;
	    }.bind(this));
	}.bind(this));
    },
    show: function () {
	this.fireEvent("show");
	HOTKEYS_ENABLED = false;
	this.frame.setStyle("display", this.options.display);
	this.fx.start(-100, 0);
    },
    hide: function () {
	this.fireEvent("hide");
	HOTKEYS_ENABLED = true;
	this.fx.start(0, -100);
	(function(){ this.frame.setStyle("display", "none"); this.frame.empty(); }).delay(1000, this);
    },
    done: function () {
	this.fireEvent("done");
	HOTKEYS_ENABLED = true;
	this.field.set("value", this.newField.get("value"));
	this.button.click();
    }

});


var activateHelps = function (parent) {
    parent = $(parent);
    parent.getElements("h3.helps").each(function (h3, id) {
	this.body = parent.getElements("div.helps")[id];
	h3.addEvent("click", function () {
	    if (this.body.getSize().y == 0) {
		this.body.setStyle("height", "auto");
	    } else {
		this.body.setStyle("height", 0);
	    }
	}.bind(this));
	this.body.setStyle("height", 0);
    });
}