var Paw = (function() {
	var _DEBUG = false;

	var _c, _ctx;
	var _w = 0, _h = 0;

	var _sprites = [];

	var timer = 0;
	var _timer_reset = new Date().getTime();
	var mouse = {x: 0, y: 0, onscreen: false};
	var _keys = [];

	function initiate(canvas, width, height, db) {
		requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
		_DEBUG = db;

		_c = canvas;
		_ctx = canvas.getContext("2d");
		w = width;
		h = height;

		_timer_reset = new Date().getTime();

		canvas.setAttribute("tabindex", 0);
		canvas.addEventListener("mousemove", function(e){
			if(e.offsetX) {
				mouse.x = e.offsetX - canvas.width / 2;
				mouse.y = e.offsetY - canvas.height / 2;
			} else {
				mouse.x = e.layerX - canvas.width / 2;
				mouse.y = e.layerY - canvas.height / 2;
			}
			mouse.onscreen = true;
		});
		canvas.addEventListener("mouseout", function(){
			mouse.onscreen = false;
		});
		canvas.addEventListener("keydown", function(e){
			var keynum = (e.charCode) ? e.charCode : e.keyCode;

			if(_keys.indexOf(keynum) === -1) _keys.push(keynum);
		});
		canvas.addEventListener("keyup", function(e){
			var keynum = (e.charCode) ? e.charCode : e.keyCode;

			if(_keys.indexOf(keynum) > -1) _keys.splice(_keys.indexOf(keynum), 1);
		});

		window.requestAnimationFrame(_render);

		if(_DEBUG) {
			console.log("Canvas initiated");
			_c.style.boxShadow = "0 0 0 1px #444";

			// FPS Counter -- https://github.com/mrdoob/stats.js/
			stats = new Stats();
			stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
			document.body.appendChild( stats.dom );
		}
	}

	function _render() {
		_c.width = w;
		_c.height = h;

		_ctx.clearRect(0, 0, _ctx.canvas.width, _ctx.canvas.height);
		_ctx.beginPath();

		for(i = 0; i < _sprites.length; i++) {
			s = _sprites[i];

			s._localRender();
			_ctx.drawImage(s.canvas, s.x - s.canvas.width / 2 + _c.width / 2, s.y - s.canvas.height / 2 + _c.height / 2);
		}
	}

	function Sprite(x, y, size, dir, showing) {
		this.x = x || 0;
		this.y = y || 0;
		this.size = size || 100;
		this.showing = showing || true;
		this.costumes = [];
		this.costumeNumber = null;
		this.costumeName = "";
		this.direction = dir || 0;

		_sprites.push(this);
	}

	Sprite.prototype._localRender = function() {
		if(!this.canvas) {
			this.canvas = document.createElement("canvas");
			this.ctx = this.canvas.getContext("2d");

			if(false) {
				document.body.appendChild(this.canvas);
				this.canvas.style.border = "1px dotted black";
			}
		}

		var costume = this.costumes[this.costumeNumber];
		this.canvas.width = Math.ceil(Math.max(costume.width, costume.height) * Math.sqrt(2) * this.size / 100);
		this.canvas.height = Math.ceil(Math.max(costume.width, costume.height) * Math.sqrt(2) * this.size / 100);

		if(this.showing) {
			// Check that costume has loaded
			if(!(!costume.complete || (typeof costume.naturalWidth !== "undefined" && costume.naturalWidth === 0))) {
				var costumeWidth = costume.width * s.size / 100;
				var costumeHeight = costume.height * s.size / 100;
				this.ctx.save();
				this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
				this.ctx.rotate(s.direction * Math.PI/180);
				this.ctx.drawImage(costume, -costumeWidth / 2, -costumeHeight / 2, costumeWidth, costumeHeight);
				this.ctx.restore();
			}
		}
	}

	Sprite.prototype.touching = function(sprite2) {
		// Todo: Optimize for horizontal sprites (both at direction 0)

		function P(x, y, rot, cx, cy) {
			var tmpX = x - cx;
			var tmpY = y - cy;
			var rotatedX = tmpX * Math.cos(rot) - tmpY * Math.sin(rot);
			var rotatedY = tmpX * Math.sin(rot) + tmpY * Math.cos(rot);

			return {x: rotatedX + cx, y: rotatedY + cy};
		}

		function rectPoints(s) {
			var c = s.costumes[s.costumeNumber];
			var dir = s.direction * Math.PI / 180;
			return {UR: new P(c.width * s.size / 200 + s.x,  c.height * s.size / 200 + s.y,  dir, s.x, s.y),
			        UL: new P(c.width * s.size / -200 + s.x, c.height * s.size / 200 + s.y,  dir, s.x, s.y),
			        LL: new P(c.width * s.size / -200 + s.x, c.height * s.size / -200 + s.y, dir, s.x, s.y),
			        LR: new P(c.width * s.size / 200 + s.x,  c.height * s.size / -200 + s.y, dir, s.x, s.y)};
		}

		var A = rectPoints(this);
		var B = rectPoints(sprite2);

		var Axis1 = {x: A.UR.x - A.UL.x,
		             y: A.UR.y - A.UL.y};
		var Axis2 = {x: A.UR.x - A.LR.x,
		             y: A.UR.y - A.LR.y};
		var Axis3 = {x: B.UL.x - B.LL.x,
		             y: B.UL.y - B.LL.y};
		var Axis4 = {x: B.UL.x - B.UR.x,
		             y: B.UL.y - B.UR.y};
		var axes = [Axis1, Axis2, Axis3, Axis4];

		function project(point, axis) {
			var multiplier = (point.x * axis.x + point.y * axis.y) / (axis.x * axis.x + axis.y * axis.y);
			return {
				x: axis.x * multiplier,
				y: axis.y * multiplier
			};
		}

		for(i = 0; i < 3; i++) {
			var axis = axes[i];

			var A_Projections = [project(A.UR, axis), project(A.UL, axis), project(A.LL, axis), project(A.LR, axis)];
			var B_Projections = [project(B.UR, axis), project(B.UL, axis), project(B.LL, axis), project(B.LR, axis)];
			var A_Scales = A_Projections.map(function(n){
				return n.x * axis.x + n.y * axis.y;
			});
			var B_Scales = B_Projections.map(function(n){
				return n.x * axis.x + n.y * axis.y;
			});

			var MinA = Math.min.apply(null, A_Scales);
			var MaxA = Math.max.apply(null, A_Scales);
			var MinB = Math.min.apply(null, B_Scales);
			var MaxB = Math.max.apply(null, B_Scales);

			if(!(MinB <= MaxA && MaxB >= MinA)) {
				return false;
			}
		}

		return true;
	}

	var _loadedCostumeCount = 0;
	var _targetLoadedCostumeCount = 0;
	Sprite.prototype.addCostume = function(c) {
		if(typeof(c) !== "string")  {
			if(_DEBUG) console.error("addCostume needs a string input");
			return;
		}
		var costume = new Image();
		costume.src = c;

		_targetLoadedCostumeCount += 1;
		costume.addEventListener("load", function(){
			_loadedCostumeCount += 1;
		})
		costume.addEventListener("error", function(){
			if(_DEBUG) console.error("Costume failed to load: " + c);
			_loadedCostumeCount += 1;
		});

		this.costumes.push(costume);
	}

	function _validateProperties() {
		for(i = 0; i < _sprites.length; i++) {
			var s = _sprites[i];

			if(s.size < 0) s.size = 0;
			s.costumeNumber = Math.round(Math.abs(s.costumeNumber)) % s.costumes.length;
		}
	}

	var _loopFunction = function(){};
	function loop(f) {
		if(_DEBUG) stats.begin();

		if(typeof(f) == "function") _loopFunction = f;
		if(_loadedCostumeCount >= _targetLoadedCostumeCount) {
			Paw.timer = (new Date().getTime() - _timer_reset) / 1000;
			_loopFunction();
			_validateProperties();
			_render();
		}

		if(_DEBUG) stats.end();

		requestAnimationFrame(loop);
	}

	function reset_timer() {
		_timer_reset = new Date().getTime();
	}

	function keyPressed(key) {
		var code = key;
		switch(code.toLowerCase()) {
			case "tab": code = 9; break;
			case "enter": code = 13; break;
			case "shift": code = 16; break;
			case "ctrl": code = 17; break;
			case "alt": code = 18; break;
			case "esc": code = 27; break;
			case "space": code = 32; break;
			case "right": code = 39; break;
			case "left": code = 37; break;
			case "up": code = 38; break;
			case "down": code = 40; break;
		}
		if(typeof code === "string") {
			code = key.toUpperCase().charCodeAt(0);
		}

		return _keys.indexOf(code) > -1;
	}


	return {
		// Initiate
		initiate: initiate,
		sprite: Sprite,

		// Loop
		loop: loop,

		// Global blocks and watchers
		timer: timer,
		reset_timer: reset_timer,
		mouse: mouse,
		keyPressed: keyPressed
	};
})();