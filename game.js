(function(){
	function bind(func, scope){
		return function(){
			return func.apply(scope, arguments);
		}
	}

	function initialize(){
		enchant();
		var game = new Game( 640, 960 );
		var resources = [
			"img/panels2.png",
			"img/yajirushi.png"
		];
		var PANEL_X_SIZE = 64;
		var PANEL_Y_SIZE = 64;
		game.preload( resources );

		var TitleScene = Class.create( Scene, {
			initialize: function( game, nextScene ) {
				Scene.apply( this, arguments );
				this.game       = game;
				this.nextScene  = nextScene;
				this.onEnter();
			},
			onEnter: function() {
				this.title      = new Label( "Dungeon Raid" );
				this.gamestart  = new Label( "Game Start" );
				this.gamestart.moveTo( 0, 20 );
				this.gamestart.addEventListener('touchstart', bind( function(e) {
					this.game.replaceScene( this.nextScene );
					this.onExit();
				}, this ));
				this.addChild(this.title);
				this.addChild(this.gamestart);
			},
			onExit: function(){
			}
		});

		var GameScene = Class.create( Scene, {
			initialize: function( game, nextScene ) {
				Scene.apply( this, arguments );
				this.game       = game;
				this.nextScene  = nextScene;
				this.onEnter();
			},
			onEnter: function() {
				this.title = new Label( "Game Main" );
				this.addChild(this.title);
				this.Field      = new Field();
				this.Field.moveTo( 0, 20 );
				this.addChild( this.Field );
			},
			onExit: function() {
			}
		});

		var Field    = Class.create( Group, {
			initialize: function( scale ) {
				Group.apply( this, arguments );
				this.panelX      = 6;
				this.panelY      = 6;
				//パネルクラスのインスタンスを格納する。
				this.fields      = [];
				this.scale       = scale || 1;
				//今タッチされているのがなんのタイプかを保存する
				this.typeOfPanel = undefined;
				this.lastTargetPos     = { x: undefined, y:undefined };
				//つながっている数。
				this.chainedNum        = 0;
				this.chainedPanels     = [];
				this.drawnArrows       = [];
				this.createInitialField();
				this.onEnter();
			},

			onEnter: function(){
				this.drawField();
				this.addEventListener( 'touchstart', this.onTouchStart );
				this.addEventListener( 'touchend', this.onTouchEnd );
				this.addEventListener( 'touchmove', this.onTouchMove );
			},
			setLastTargetPos: function(pos) {
				//posの型が異なる場合は何もしない。
				if(pos.x === undefined || pos.y === undefined) { return; }
				this.lastTargetPos = pos;
			},

			onTouchStart: function(e) {
				var pos = this.getTouchPosition( e.localX, e.localY );
				//このタイミングで、なにがタップされたか記録
				this.typeOfPanel = this.fields[pos.x][pos.y].getPanelType();
				this.setLastTargetPos(pos);
				this.chainedPanels.push ( this.fields[pos.x][pos.y] );
			},

			onTouchMove: function(e) {
				var pos = this.getTouchPosition( e.localX, e.localY );
				var isSame          = false;
				var isNextToLastPos = false;
				var panel = this.fields[pos.x][pos.y];
				isSame          = panel.isSamePanel( this.typeOfPanel )
				isNextToLastPos = panel.isNextPanel( this.lastTargetPos );
				if ( isSame && isNextToLastPos ) {
					var dirs = this.getDirection( pos );
					console.log( dirs );
					this.drawArrow( this.lastTargetPos, dirs.lastPanel );
					this.drawArrow( pos,                dirs.newPanel );
					if( panel.setChained() ){
						this.chainedNum++
						this.setLastTargetPos( pos );
						this.chainedPanels.push ( panel );
					}
				}
			},

			onTouchEnd: function(e) {
				this.clear();
				console.log( this.chainedNum );
			},

			getTouchPosition: function( x, y ) {
				var indexX = parseInt( x / PANEL_X_SIZE / this.scale );
				var indexY = parseInt( y / PANEL_Y_SIZE / this.scale );

				return { x:indexX, y:indexY };
			},

			//その位置が最後の位置に対してどの方角かを得る。
			getDirection: function( pos ) {
				var dir = new Direction();
				if ( pos.x === this.lastTargetPos.x + 1 && pos.y === this.lastTargetPos.y     ) { return {lastPanel: dir.RIGHT,       newPanel: dir.LEFT }; }
				if ( pos.x === this.lastTargetPos.x - 1 && pos.y === this.lastTargetPos.y     ) { return {lastPanel: dir.LEFT,        newPanel: dir.RIGHT }; }
				if ( pos.x === this.lastTargetPos.x     && pos.y === this.lastTargetPos.y + 1 ) { return {lastPanel: dir.DOWN,        newPanel: dir.TOP }; }
				if ( pos.x === this.lastTargetPos.x     && pos.y === this.lastTargetPos.y - 1 ) { return {lastPanel: dir.TOP,         newPanel: dir.DOWN }; }
				if ( pos.x === this.lastTargetPos.x + 1 && pos.y === this.lastTargetPos.y - 1 ) { return {lastPanel: dir.RIGHTTOP,    newPanel: dir.LEFTDOWN }; }
				if ( pos.x === this.lastTargetPos.x - 1 && pos.y === this.lastTargetPos.y - 1 ) { return {lastPanel: dir.LEFTTOP,     newPanel: dir.RIGHTDOWN }; }
				if ( pos.x === this.lastTargetPos.x + 1 && pos.y === this.lastTargetPos.y + 1 ) { return {lastPanel: dir.RIGHTDOWN,   newPanel: dir.LEFTTOP }; }
				if ( pos.x === this.lastTargetPos.x - 1 && pos.y === this.lastTargetPos.y + 1 ) { return {lastPanel: dir.LEFTDOWN,    newPanel: dir.RIGHTTOP }; }
			},

			clear: function() {
				this.typeOfPanel = undefined;
				this.setLastTargetPos( { x:undefined, y:undefined } );
				for ( var i = 0; i < this.chainedPanels.length; i++ ){
					this.chainedPanels[i].removePanel();
				}
				for ( var i = 0; i < this.drawnArrows.length; i++ ){
					this.removeChild(this.drawnArrows[i]);
				}
			},

			createInitialField: function(){
				for (var x = 0; x < this.panelX; x++) {
					this.fields[x] = [];
					for (var y = 0; y < this.panelY; y++) {
						var type = parseInt( Math.random() * 4 ) + 1;
						this.fields[x][y] = this.createPanel( type, { x:x, y:y } );
					}
				}
			},

			createPanel: function( panelType, pos ){
				switch( panelType ) {
					case 1:
						return new Coin(PANEL_X_SIZE, PANEL_Y_SIZE, pos);
						break;
					case 2:
						return new Shield(PANEL_X_SIZE, PANEL_Y_SIZE, pos);
						break;
					case 3:
						return new Skelton(PANEL_X_SIZE, PANEL_Y_SIZE, pos);
						break;
					case 4:
						return new Sword(PANEL_X_SIZE, PANEL_Y_SIZE, pos);
						break;
					default :
						return new Sword(PANEL_X_SIZE, PANEL_Y_SIZE, pos);
						break;
				}
			},

			drawField: function(){
				for (var x = 0; x < this.panelX; x++) {
					for (var y = 0; y < this.panelY; y++) {
						var p = this.fields[x][y];
						p.moveTo( x * PANEL_X_SIZE * this.scale, y * PANEL_Y_SIZE * this.scale );
						p.scale( this.scale, this.scale );
						//p.moveTo( x * PANEL_X_SIZE, y * PANEL_Y_SIZE );
						this.addChild(p);
					}
				}
			},

			drawArrow: function( pos, dir ) {
				var arrow =  new Arrow( PANEL_X_SIZE, PANEL_Y_SIZE, dir );
				arrow.moveTo( pos.x * PANEL_X_SIZE * this.scale, pos.y * PANEL_Y_SIZE * this.scale );
				arrow.scale( this.scale, this.scale );
				this.drawnArrows.push( arrow );
				this.addChild( arrow );
			}
		});

		var Panel    = Class.create( Sprite, {
			initialize: function( x, y, pos ) {
				Sprite.apply( this, arguments );
				this.panelType = undefined;
				this.isTouching = true;
				this.pos = pos;
				this.chained = false;
				//this.width  = PANEL_X_SIZE;
				//this.height = PANEL_Y_SIZE;
				this.onEnter();
			},

			onEnter: function() {
				this.addEventListener('touchstart', bind( function(e){
					this.onTouch();
				}, this ));
			},

			setChained: function() {
				if ( this.chained ){ return false; }
				this.chained = true;
				return true;
			},

			setUnChained: function() {
				this.chained = false;
			},

			onTouch: function() {
			},

			getPanelType: function() {
				return this.panelType;
			},

			isSamePanel: function( panelType) {
				return panelType === this.panelType;
			},
			removePanel: function() {
				this.frame = 0;
				this.image = game.assets[ 'img/panels2.png' ];
			},

			isNextPanel: function( pos ){
				if ( pos.x === this.pos.x - 1 || pos.x === this.pos.x + 1 || pos.x === this.pos.x ) {
					if ( pos.y === this.pos.y - 1 || pos.y === this.pos.y + 1 || pos.y === this.pos.y ) {
						return ( pos.x === this.pos.x && pos.y === this.pos.y ) ? false : true;
					}
				}
				return false;
			}
		});

		var Coin    = Class.create( Panel, {
			initialize: function() {
				Panel.apply( this, arguments );
				this.image = game.assets[ 'img/panels2.png'];
				this.panelType = 2;
				this.frame     = 1;
			},
			onTouch: function() {
				console.log( "Coin がタッチされたよ" );
			}
		});

		var Shield    = Class.create( Panel, {
			initialize: function() {
				Panel.apply( this, arguments );
				this.image = game.assets[ 'img/panels2.png'];
				this.panelType = 3;
				this.frame  = 2;
			},
			onTouch: function() {
				console.log( "Shield がタッチされたよ" );
			}
		});

		var Skelton    = Class.create( Panel, {
			initialize: function() {
				Panel.apply( this, arguments );
				this.image = game.assets[ 'img/panels2.png'];
				this.panelType = 4;
				this.frame  = 3;
			},
			onTouch: function() {
				console.log( "Skelton がタッチされたよ" );
			}
		});

		var Sword    = Class.create( Panel, {
			initialize: function() {
				Panel.apply( this, arguments );
				this.image = game.assets[ 'img/panels2.png'];
				this.panelType = 5;
				this.frame  = 4;
			},
			onTouch: function() {
				console.log( "Sword がタッチされたよ" );
			}
		});

		var Arrow   = Class.create( Sprite, {
			initialize: function( x, y, dir ) {
				Sprite.apply( this, arguments );
				this.image = game.assets[ 'img/yajirushi.png' ];
				this.frame = dir;
			},
			setDirection: function ( dir ) {
				this.frame = dir;
			},
		});

		var Direction = Class.create({
			initialize: function(){
				this.RIGHT     = 0;
				this.DOWN      = 1;
				this.LEFT      = 2;
				this.TOP       = 3;
				this.RIGHTDOWN = 4;
				this.LEFTDOWN  = 5;
				this.LEFTTOP   = 6;
				this.RIGHTTOP  = 7;
			}
		});


		window.onload = function(){
			//game.preload( 'img/skelton.png' );
			game.onload = function() {
				var gameScene  = new GameScene ( game, scoreScene );
				var titleScene = new TitleScene( game, gameScene );
				var scoreScene = new Scene();
				game.pushScene( titleScene );
			}
			game.start();
		}
	}

	window.addEventListener( 'DOMContentLoaded', initialize, false );
})();

