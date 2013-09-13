var LAST_SELECTED = null;
var TIMEOUT = 840000; // 14m
var TIMEOUT_ID;
var context;
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
	    rowReq.appendFiles(inputFiles.getFiles(), String($$("input.subdir")[0].get("value")).replace("ProntoDrive/", ""));
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
	onSuccess: function () {
	    reloadContent();
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
    // Search field
    var searchBox = new Element("input", {"type": "text", "name": "search", "id": "search", "class": "text"}).inject($("buttons"));
    searchBox.addEvent("keyup", function (e) {
	if (e.key == "enter") e.preventDefault();
	if (this.get("value")) {
	    reloadContent("search.wcgp", this.get("value"));
	} else {
	    reloadContent();
	}
    });
    // Golobal keybindings
    $(document.body).addEvent("keydown", function (e) {
	if (e.control == true && e.shift == true && e.key == "a") {
	    e.preventDefault();
	    $$("#fileList li.folder, #fileList li.file").removeClass("selected");
	    $$("#fileList li.folder .check input, #fileList li.file .check input").set("checked", false);
	} else if (e.control == true && e.key == "a") {
	    e.preventDefault();
	    $$("#fileList li.folder, #fileList li.file").addClass("selected");
	    $$("#fileList li.folder .check input, #fileList li.file .check input").set("checked", true);
	} else if (e.key == "delete") {
	    $("delete").click();
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
	var total_path = [];
	for (var i = 0; i < subfolders.length; i++ ) {
	    if (i == subfolders.length - 1) {
 		new Element("em", {"class": "nolink"}).set("text", subfolders[i]).inject(name);
	    } else {
		total_path.push(subfolders[i]);
 		new Element("a", {"class": "crumb","href": "ProntoDrive.wcgp?path=" + total_path.join("/")}).set("text", subfolders[i] || "Pronto!Drive").inject(name);
 		new Element("em", {"class": "crumbs-separator"}).set("text", " > ").inject(name);
	    }
	}
	li.inject(container);
	li.getElements("a.crumb").addEvent("click", function (e) {
	    e.preventDefault();
	    $$("input.subdir").set("value", "ProntoDrive/" + unescape(this.href.split("path=")[1]));
	    reloadContent();
	});
    }
    if (object.Folders) {
	object.Folders.each(function (folder) {
	    var li = new Element("li", {"class": "folder"});
	    var check = new Element("span", {"class": "check"}).inject(li);
 	    new Element("input", {"type": "checkbox", "name" : "folder", "value" : folder.Name}).inject(check);
	    var name = new Element("span", {"class": "name"}).inject(li);
 	    var link = new Element("a", {"href": "ProntoDrive.wcgp?path=" + folder.Path + "/" + folder.Name});
	    folder.Path = folder.Path.replace(/^\s+/, "");
	    folder.Path = folder.Path.replace(/^ProntoDrive/, "");
	    var share = new Element("span", {"class": "share"}).set("html", "&nbsp;").inject(li);
 	    var shareLink = new Element("a", {"href": "ShareFile.wcgp?file=" + folder.Path + "/" + folder.Name, "title": "Share Link"}).set("text", "Share").inject(share);
	    if (preservePath) {
		folder.Name = folder.Path + " > " + folder.Name;
		folder.Name = folder.Name.replace(/^\//, "").replace(/\//g, " > ");
	    }
	    link.set("text", folder.Name).inject(name);
	    link.addEvent("click", function (e) {
		e.preventDefault();
		$$("input.subdir").set("value", "ProntoDrive/" + object.path + "/" + folder.Name);
		reloadContent();
	    });
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
	    file.Path = file.Path.replace(/^\s+/, "");
	    file.Path = file.Path.replace(/^ProntoDrive/, "");
 	    var link = new Element("a", {"href": "WebFile/ProntoDrive/" + file.Path + "/" + file.Name}).inject(name);
	    var share = new Element("span", {"class": "share"}).inject(li);
 	    var shareLink = new Element("a", {"href": "ShareFile.wcgp?file=" + file.Path + "/" + file.Name, "title": "Share Link"}).set("text", "Share").inject(share);
	    if (preservePath) {
		file.Name = file.Path + "/" + file.Name;
		file.Name = file.Name.replace(/^\//, "").replace(/\//g, " > ");
	    }
	    link.set("text", file.Name);
	    link.addEvent("click", function (e) {
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
 	if (!preservePath)
	    $$("input.subdir").each(function (field) {
		field.set("value", "ProntoDrive/" + object.path );
	    });
    }
}

var reloadContent = function (url, search) {
    if (!url) url = 'list.wcgp';
    $('fileList').fade(0.3);
    var path =  String($$("input.subdir")[0].get("value"));
    path = path.replace("ProntoDrive/", "");
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
			  if (list.Folders.length + list.Files.length == 0 && 'FormData' in window && !Browser.isMobile && !search) {
			      new Element("p", {"id" : "dragndrop"}).set("text", "Drag and drop files from your desktop or use the upload icon above.").inject($('mainSection'));
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
			      targets: 'body, #fileList li',
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
			new Toast( file.name + " uploaded!");
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
		request.append('SubDir',"ProntoDrive/" + file.destPath );
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
