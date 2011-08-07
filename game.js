(function(){
	function bind(func, scope){
		return function(){
			return func.apply(scope, arguments);
		}
	}

	function initialize(){
		enchant();
		var game = new Game( 400, 400 );
		var resources = [
			"img/panels3.png",
			"img/yajirushi.png"
		];
		var PANEL_X_SIZE = 64;
		var PANEL_Y_SIZE = 64;
		var DEBUG_MODE   = true;
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
				this.REMOVE_CHAINED_NUM = 3;
				this.panelX      = 6;
				this.panelY      = 6;
				//パネルクラスのインスタンスを格納する。
				this.fields      = [];
				this.scale       = scale || 1;
				//今タッチされているのがなんのタイプかを保存する
				this.typeOfPanel = undefined;
				this.lastTargetPos     = { x: undefined, y:undefined };
				//つながっている数。
				this.chainedNum        = 1;
				this.chainedPanels     = [];
				this.removedPositions  = [];
				this.drawnArrows       = [];
				this.createInitialField();
				this.refleshPos();
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
				this.removedPositions.push ( pos );
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
						this.removedPositions.push ( pos );
					}
				}
			},

			onTouchEnd: function(e) {
				if ( this.chainedNum >= this.REMOVE_CHAINED_NUM ) {
					for ( var i = 0; i < this.chainedPanels.length; i++ ){
						this.chainedPanels[i].removePanel();
					}
					this.closeUp();
				}
				for ( var i = 0; i < this.drawnArrows.length; i++ ){
					this.removeChild(this.drawnArrows[i]);
				}
				this.clear();
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
				this.lastTargetPos = { x:undefined, y:undefined };
				this.chainedNum = 1;
				this.chainedPanels     = [];
				this.drawnArrows       = [];
				this.removedPositions  = [];
			},

			createInitialField: function(){
				for (var x = 0; x < this.panelX; x++) {
					this.fields[x] = [];
					for (var y = 0; y < this.panelY; y++) {
						var type = parseInt( Math.random() * 5 ) + 1;
						this.fields[x][y] = this.createPanel( type );
						this.fields[x][y].setPos( { x:x, y:y } );
					}
				}
			},

			//createPanel: function( panelType, pos ){
			createPanel: function( panelType ){
				switch( panelType ) {
					case 1:
						//return new Coin(PANEL_X_SIZE, PANEL_Y_SIZE, pos);
						return new Coin( PANEL_X_SIZE, PANEL_Y_SIZE );
						break;
					case 2:
						//return new Shield(PANEL_X_SIZE, PANEL_Y_SIZE, pos);
						return new Shield( PANEL_X_SIZE, PANEL_Y_SIZE );
						break;
					case 3:
						//return new Skelton(PANEL_X_SIZE, PANEL_Y_SIZE, pos);
						return new Skelton( PANEL_X_SIZE, PANEL_Y_SIZE );
						break;
					case 4:
						//return new Sword(PANEL_X_SIZE, PANEL_Y_SIZE, pos);
						return new Sword( PANEL_X_SIZE, PANEL_Y_SIZE );
						break;
					case 5:
						//return new Sword(PANEL_X_SIZE, PANEL_Y_SIZE, pos);
						return new Potion( PANEL_X_SIZE, PANEL_Y_SIZE );
						break;
					default :
						//return new Sword(PANEL_X_SIZE, PANEL_Y_SIZE, pos);
						return new Sword( PANEL_X_SIZE, PANEL_Y_SIZE );
						break;
				}
			},

			drawField: function(){
				for (var x = 0; x < this.panelX; x++) {
					for (var y = 0; y < this.panelY; y++) {
						var p = this.fields[x][y];
						if ( p === null ) {
							console.log( "hoge" );
							this.fields[x].splice( y, 1 );
							var type = parseInt( Math.random() * 5 ) + 1;
							//p = this.createPanel( type, { x:x, y:0 } );
							p = this.createPanel( type );
							this.fields[x].unshift( p );
						}
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
			},

			closeUp: function() {
				for ( var i = 0; i < this.removedPositions.length; i++ ){
					var removedPos    = this.removedPositions[i];
					var removedPanel  = this.fields[removedPos.x][removedPos.y];
					console.log( " removed Pos ");
					console.log( " remove pos x:" + removedPos.x + "y:" + removedPos.y );
					this.removeChild( removedPanel );
					this.fields[removedPos.x][removedPos.y] = null;
				}
				this.drawField();
				this.refleshPos();
			},

			refleshPos: function() {
				for (var x = 0; x < this.panelX; x++) {
					for (var y = 0; y < this.panelY; y++) {
						var p = this.fields[x][y];
						p.moveTo( x * PANEL_X_SIZE * this.scale, y * PANEL_Y_SIZE * this.scale );
						p.scale( this.scale, this.scale );
						console.log( " reflesh pos x:" + x + "y:" + y );
						p.setPos( { x:x, y:y } );
					}
				}
			}
		});

		var Panel    = Class.create( Sprite, {
			//initialize: function( x, y, pos ) {
			initialize: function( x, y ) {
				Sprite.apply( this, arguments );
				this.panelType = undefined;
				this.isTouching = true;
				//this.pos = pos;
				this.chained = false;
				this.removed = false;
				//this.width  = PANEL_X_SIZE;
				//this.height = PANEL_Y_SIZE;
				this.onEnter();
			},

			onEnter: function() {
				this.addEventListener('touchstart', bind( function(e){
					this.onTouch();
				}, this ));
			},
			setPos: function(pos) {
				if( pos.x === undefined || pos.y === undefined ){ return; }
				this.pos = pos;
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
				console.log( "x:" + this.pos.x + "y:" + this.pos.y);
			},

			getPanelType: function() {
				return this.panelType;
			},

			isSamePanel: function( panelType) {
				return panelType === this.panelType;
			},
			removePanel: function() {
				this.frame  = 0;
				this.image  = game.assets[ 'img/panels3.png' ];
				this.removd = true;
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
				this.image = game.assets[ 'img/panels3.png'];
				this.panelType = 2;
				this.frame     = 1;
			},
		});

		var Potion    = Class.create( Panel, {
			initialize: function() {
				Panel.apply( this, arguments );
				this.image = game.assets[ 'img/panels3.png'];
				this.panelType = 3;
				this.frame     = 2;
			},
		});

		var Shield    = Class.create( Panel, {
			initialize: function() {
				Panel.apply( this, arguments );
				this.image = game.assets[ 'img/panels3.png'];
				this.panelType = 4;
				this.frame  = 3;
			},
		});

		var Skelton    = Class.create( Panel, {
			initialize: function() {
				Panel.apply( this, arguments );
				this.image = game.assets[ 'img/panels3.png'];
				this.panelType = 5;
				this.frame  = 4;
			},
		});

		var Sword    = Class.create( Panel, {
			initialize: function() {
				Panel.apply( this, arguments );
				this.image = game.assets[ 'img/panels3.png'];
				this.panelType = 6;
				this.frame  = 5;
			},
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

