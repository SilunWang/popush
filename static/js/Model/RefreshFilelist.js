
///这是一个更新文件列表的model
///用于更新文件列表
///负责单向对filelist对象传递数据，初始化

var RefreshFilelist = can.Construct({},{

	init:function(data){
		this.m_global_v = data.m_global_v;
		this.dochandler = '';
		this.doccallback = '';
		this.doc_on();
		this.m_global_v.backhome = this;
	},

	//返回当前列表n级的目录
	backto: function(n) {
		if (this.m_global_v.operationLock)
			return;
		this.m_global_v.operationLock = true;
		var temp = [];
		for (var i = 0; i < n; i++) {
			temp.push(this.m_global_v.currentDir.pop());
			m_global_v.attr("model_currentDir", m_global_v.currentDir);
		}
		this.m_global_v.currentDirString = this.m_global_v.getdirstring();
		this.refreshfilelist(function() {
			for (var i = 0; i < n; i++) {
				this.m_global_v.currentDir.push(temp.pop());
				m_global_v.attr("model_currentDir", m_global_v.currentDir);
			}
			this.m_global_v.currentDirString = this.m_global_v.getdirstring();
		});
	},

	//客户端发送请求更新文件列表
	refreshfilelist: function(error, callback) {
		this.m_global_v.operationLock = true;
		this.m_global_v.filelist.loading();
		//更改回调函数指向的值
		this.dochandler = this.refreshlistdone;
		this.doccallback = callback;
		this.m_global_v.socket.emit('doc', {
			path: this.m_global_v.currentDirString
		});
		this.m_global_v.filelisterror = error;
	},

	//服务器返回请求，回调“更新文件列表”
	refreshlistdone: function(data) {
		this.m_global_v.filelist.removeloading();
		this.m_global_v.attr("model_mode" ,this.m_global_v.filelist.getmode());
		if (data.err) {
			this.m_global_v.filelisterror();
			this.m_global_v.showmessagebox('error', 'failed', 1);
		} else {
			if (this.m_global_v.dirMode == 'owned') {
				this.m_global_v.filelist.setmode(this.m_global_v.filelist.getmode() | 2);
				this.m_global_v.attr("model_mode" ,this.m_global_v.filelist.getmode() | 2);
			}	
			else {
				this.m_global_v.filelist.setmode(0);
				this.m_global_v.attr("model_mode" ,0);
			}
			if (this.m_global_v.currentDir.length == 1) {
				if (this.m_global_v.dirMode == 'owned') {
					this.m_global_v.attr("model_mode" ,this.m_global_v.filelist.getmode() | 1);
					this.m_global_v.filelist.setmode(this.m_global_v.filelist.getmode() | 1);
				}	
				this.m_global_v.attr("model_filelist",this.m_global_v.filelist.formdocs(data.doc, this.m_global_v.docshowfilter));
				this.m_global_v.memberlist.clear();
				this.m_global_v.memberlist.add(this.m_global_v.currentUser);
			} else {
				this.m_global_v.filelist.setmode(this.m_global_v.filelist.getmode() & ~1);
				this.m_global_v.attr("model_mode" ,this.m_global_v.filelist.getmode() & ~1);
				this.m_global_v.attr("model_filelist",this.m_global_v.filelist.formdocs(data.doc.docs, this.m_global_v.docshowfilter, data.doc.members.length > 0, data.doc));
				this.m_global_v.memberlist.fromdoc(data.doc);
				this.m_global_v.memberlistdoc.fromdoc(data.doc);
			}
			if (this.m_global_v.doccallback)
				this.m_global_v.doccallback();
		}
		this.m_global_v.operationLock = false;
	},

	//服务器返回，调用dochandler
	//dochandler大多数时候是refreshfilelist，但有时候是完成共享和取消共享的回调函数
	doc_on: function() {
		var self = this;
		this.m_global_v.socket.on('doc', function(data) {
			self.dochandler(data);
		});
	}
	
});
