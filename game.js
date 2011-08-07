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
			"img/panels5.png",
			"img/yajirushi.png"
		];
		var PANEL_X_SIZE = 64;
		var PANEL_Y_SIZE = 64;

		var PanelType = Class.create({
			initialize: function() {
				this.COIN      = 2;
				this.POTION    = 3;
				this.SHIELD    = 4;
				this.SKELTON   = 5;
				this.SWORD     = 6;
			}
		});

		var PANEL_TYPE   = new PanelType();

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

		var Score     = Class.create({
			initialize: function() {
				this.COIN      = 10;
				this.SKELTON   = 5;
				this.SWORD     = 1;
				this.POTION    = 2;
				this.SHIELD    = 1;
			}
		});

		var DIRECTION = new Direction();
		var SCORE     = new Score();
		var DEBUG_MODE   = true;
		game.preload( resources );

		var TitleScene = Class.create( Scene, {
			initialize: function( game, nextScene ) {
				Scene.apply( this, arguments );
				this.game       = game;
				this.onEnter();
			},
			onEnter: function() {
				this.title      = new Label( "Dungeon Raid" );
				this.gamestart  = new Label( "Game Start" );
				this.gamestart.moveTo( 0, 20 );
				this.gamestart.addEventListener('touchstart', bind( function(e) {
					this.nextScene  = new GameScene( game );
					this.game.replaceScene( this.nextScene );
					this.onExit();
				}, this ));
				this.addChild(this.title);
				this.addChild(this.gamestart);
			},
			onExit: function(){
			}
		});

		var GameOverScene = Class.create( Scene, {
			initialize: function( game, score ) {
				Scene.apply( this, arguments );
				this.game       = game;
				this.score      = score;
				this.onEnter();
			},
			onEnter: function() {
				this.title      = new Label( "Game Over" );
				this.gamestart  = new Label( "Retry" );
				this.scoreLabel = new Label( "今回のスコア:" + this.score );
				this.gamestart.moveTo( 0, 20 );
				this.scoreLabel.moveTo( 0, 40 );
				this.gamestart.addEventListener('touchstart', bind( function(e) {
					this.nextScene  = new GameScene( game );
					this.game.replaceScene( this.nextScene );
					this.onExit();
				}, this ));
				this.addChild(this.title);
				this.addChild(this.scoreLabel)
				this.addChild(this.gamestart);
			},
			onExit: function(){
			}
		});

		var GameScene = Class.create( Scene, {
			initialize: function( game, nextScene ) {
				Scene.apply( this, arguments );
				this.game       = game;
				this.onEnter();
			},
			onEnter: function() {
				this.title = new Label( "Game Main" );
				this.addChild(this.title);
				this.turnManager = new TurnManager( bind( this.onGameOver, this ) );
				this.turnLabel   = new Label();
				this.turnLabel.moveTo( 100, 0 );
				this.addEventListener( 'enterframe', this.onUpdate );
				this.Field      = new Field();
				this.Field.moveTo( 0, 20 );
				this.Field.addTurnManager( this.turnManager );
				this.Player     = new Player();

				this.lifeLabel  = new Label();
				this.lifeLabel.moveTo( 150, 0 );

				this.shieldLabel = new Label();
				this.shieldLabel.moveTo( 200, 0 );

				this.scoreLabel  = new Label();
				this.scoreLabel.moveTo( 250, 0 );

				this.addChild( this.turnLabel );
				this.addChild( this.lifeLabel );
				this.addChild( this.shieldLabel );
				this.addChild( this.scoreLabel );
				this.addChild( this.Field );
				this.addChild( this.Player );
				this.turnManager.addField( this.Field );
				this.turnManager.addPlayer( this.Player );
				this.turnManager.startTurn();
			},

			onUpdate: function() {
				this.turnLabel.text   = "turn: " + this.turnManager.getTurn();
				this.lifeLabel.text   = "life: " + this.Player.getLife();
				this.shieldLabel.text = "shield: " + this.Player.getShield();
				this.scoreLabel.text  = "score: "  + this.Player.getScore();
			},

			onGameOver: function() {
				this.nextScene  = new GameOverScene( game, this.Player.getScore() );
				this.game.replaceScene( this.nextScene );
			},


			onExit: function() {
			}
		});

		var TurnManager = Class.create({
			initialize: function( onGameOver ) {
				this.turn       = 0;
				this.onGameOver = onGameOver;
			},

			getTurn: function() {
				return this.turn;
			},

			addField: function( field ) {
				this.Field = field;
			},

			addPlayer: function( player ) {
				this.Player = player;
			},


			startTurn: function() {
				this.onEnterTurn();
			},

			endTurn: function() {
				this.Field.closeUp();
				var damage      = this.Field.getDamageFromEnemies() * (parseInt(this.turn / 10) + 1);
				var gotDamage   = ( ( damage - this.Player.getShield() ) < 0 ) ? 0 : damage - this.Player.getShield();
				var restoreLife = this.Field.getRemovedPanelsInfo();
				var score       = this.Field.getGotScores();
				var shields     = this.Field.getGotShields();
				this.Player.restoreLife( restoreLife );
				this.Player.reduceLife( gotDamage );
				this.Player.consumeShield( damage );
				this.Player.addScore( score );
				this.Player.addShield( shields );
				if ( this.Player.getLife() <= 0) {
					this.onGameOver();
				}
				this.onExitTurn();
			},

			onEnterTurn: function() {
			},

			onCancelTouch: function() {
				this.Field.clear();
			},

			onExitTurn: function() {
				this.turn++;
				//ターンが終了したときに呼ばれる。
				//終了処理
				this.Field.clear();
				this.startTurn();
			}
		});

		var Player   = Class.create( Group, {
			initialize: function() {
				Group.apply( this, arguments );
				this.life       = 50;
				this.maxLife    = 100;
				this.shield     = 5;
				this.score      = 0;
			},

			getLife: function() {
				return this.life;
			},

			reduceLife: function( dLife ) {
				if ( dLife === undefined ) { return; }
				this.life -= dLife;
			},

			restoreLife: function( dLife ) {
				if ( dLife === undefined ) { return; }
				this.life += dLife;
				if ( this.life > this.maxLife ) { this.life = this.maxLife; }
			},

			getShield: function() {
				return this.shield;
			},

			addShield: function( dShield ) {
				if ( dShield === undefined ) { return; }
				this.shield += dShield;
				if ( this.shield > 5 ) { this.shield = 5; }
			},

			consumeShield: function( dShield ) {
				if ( dShield === undefined ) { return; }
				this.shield -= dShield;
				if ( this.shield < 0 ) { this.shield = 0; }
			},

			getScore: function() {
				return this.score;
			},

			addScore: function( dScore ) {
				if ( dScore === undefined ) { return; }
				this.score += dScore;
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
				//this.drawnArrowsInfo    = {};
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

			addTurnManager: function( manager ) {
				this.turnManager = manager;
			},

			setLastTargetPos: function(pos) {
				//posの型が異なる場合は何もしない。
				if(pos.x === undefined || pos.y === undefined) { return; }
				this.lastTargetPos = pos;
			},

			onTouchStart: function(e) {
				var pos = this.getTouchPosition( e.localX, e.localY );
				//このタイミングで、なにがタップされたか記録
				this.typeOfPanel = this.fields[pos.x][pos.y].getChainedType();
				console.log( this.typeOfPanel );
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
					this.drawArrow( this.lastTargetPos, dirs.lastPanel );
					this.drawArrow( pos,                dirs.newPanel );
					if( panel.setChained() ){
						this.chainedNum++
						panel.onTouch();
						this.setLastTargetPos( pos );
						this.chainedPanels.push ( panel );
						this.removedPositions.push ( pos );
					}
				}
			},

			onTouchEnd: function(e) {
				//ターン終了か、消えなかったときは、ターン中に戻る。
				var drawnArrowLength    = this.drawnArrows.length;
				var chainedPanelsLength = this.chainedPanels.length;
				for ( var i = 0; i < drawnArrowLength; i++ ){
					this.removeChild(this.drawnArrows[i]);
				}
				for ( var i = 0; i < chainedPanelsLength; i++ ){
					this.chainedPanels[i].onTouchEnd();
				}
				if ( this.chainedNum >= this.REMOVE_CHAINED_NUM ) {
					for ( var i = 0; i < chainedPanelsLength; i++ ){
						this.chainedPanels[i].removePanel();
					}
					this.turnManager.endTurn();
				}
				this.turnManager.onCancelTouch();
				//this.clear();
			},

			getTouchPosition: function( x, y ) {
				var indexX = parseInt( x / PANEL_X_SIZE / this.scale );
				var indexY = parseInt( y / PANEL_Y_SIZE / this.scale );

				return { x:indexX, y:indexY };
			},

			//その位置が最後の位置に対してどの方角かを得る。
			getDirection: function( pos ) {
				var dir = DIRECTION;
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
				//this.drawnArrowsInfo   = {};
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
					case PANEL_TYPE.COIN:
						//return new Coin(PANEL_X_SIZE, PANEL_Y_SIZE, pos);
						return new Coin( PANEL_X_SIZE, PANEL_Y_SIZE );
						break;
					case PANEL_TYPE.SHIELD:
						//return new Shield(PANEL_X_SIZE, PANEL_Y_SIZE, pos);
						return new Shield( PANEL_X_SIZE, PANEL_Y_SIZE );
						break;
					case PANEL_TYPE.SKELTON:
						//return new Skelton(PANEL_X_SIZE, PANEL_Y_SIZE, pos);
						return new Skelton( PANEL_X_SIZE, PANEL_Y_SIZE );
						break;
					case PANEL_TYPE.SWORD:
						//return new Sword(PANEL_X_SIZE, PANEL_Y_SIZE, pos);
						return new Sword( PANEL_X_SIZE, PANEL_Y_SIZE );
						break;
					case PANEL_TYPE.POTION:
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
				var drawnArrowLength    = this.drawnArrows.length;
				for ( var i = 0; i < drawnArrowLength; i++ ){
					var a = this.drawnArrows[i];
					if ( pos === a.pos && dir === a.dir ) { return; }
				}
				
				var arrow =  new Arrow( PANEL_X_SIZE, PANEL_Y_SIZE, dir );
				arrow.moveTo( pos.x * PANEL_X_SIZE * this.scale, pos.y * PANEL_Y_SIZE * this.scale );
				arrow.scale( this.scale, this.scale );
				arrow.setPosAndDir( pos, dir );
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
						p.setPos( { x:x, y:y } );
					}
				}
			},

			getDamageFromEnemies: function() {
				var damage = 0;
				for (var x = 0; x < this.panelX; x++) {
					for (var y = 0; y < this.panelY; y++) {
						var p = this.fields[x][y];
						if ( p.getPanelType() === PANEL_TYPE.SKELTON) {
							damage += p.getDamage();
						}
					}
				}
				return damage;
			},

			getRemovedPanelsInfo: function() {
				//まずはライフだけ
				var restoreLife = 0;
				var length = this.chainedPanels.length;
				for ( var i = 0; i < length; i++ ){
					restoreLife += this.chainedPanels[i].getInfoWhenRemoved();
				}
				return restoreLife ;
			},

			//TODO:上とまとめる。
			getGotScores: function() {
				var score = 0;
				var length = this.chainedPanels.length;
				for ( var i = 0; i < length; i++ ){
					score += this.chainedPanels[i].getScore() * ( i + 1 );
				}
				return score;
			},

			getGotShields: function() {
				var shields = 0;
				var length = this.chainedPanels.length;
				for ( var i = 0; i < length; i++ ){
					shields += this.chainedPanels[i].getInfoWhenRemoved();
				}
				return shields;
			}
		});

		var Panel    = Class.create( Sprite, {
			//initialize: function( x, y, pos ) {
			initialize: function( x, y ) {
				Sprite.apply( this, arguments );
				this.panelType   = undefined;
				this.chainedType = undefined; 
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
			setChainedType: function() {
				this.chainedType = this.panelType;
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
			onTouchEnd: function(){
			},

			getPanelType: function() {
				return this.panelType;
			},
			
			getChainedType: function() {
				return this.chainedType;
			},

			getScore: function() {
				return this.score;
			},

			isSamePanel: function( panelType) {
				return panelType === this.chainedType;
			},

			removePanel: function() {
				this.frame  = 0;
				this.image  = game.assets[ 'img/panels5.png' ];
				this.removd = true;
			},

			getInfoWhenRemoved: function() {
				return 0;
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
				this.image = game.assets[ 'img/panels5.png'];
				this.panelType = PANEL_TYPE.COIN;
				this.score      = SCORE.COIN;
				this.frame     = 1;
				this.setChainedType();
			},
		});

		var Potion    = Class.create( Panel, {
			initialize: function() {
				Panel.apply( this, arguments );
				this.image = game.assets[ 'img/panels5.png'];
				this.panelType = PANEL_TYPE.POTION;
				this.score      = SCORE.POTION;
				this.frame     = 2;
				this.restore   = 1;
				this.setChainedType();
			},
			getRestore: function() {
				return this.restore;
			},
			getInfoWhenRemoved: function() {
				return this.getRestore();
			}
		});

		var Shield    = Class.create( Panel, {
			initialize: function() {
				Panel.apply( this, arguments );
				this.image = game.assets[ 'img/panels5.png'];
				this.panelType = PANEL_TYPE.SHIELD;
				this.score      = SCORE.SHIELD;
				this.frame  = 3;
				this.setChainedType();
				this.shield = 1;
			},
			getInfoWhenRemoved: function() {
				return this.shield;
			}
		});

		var Skelton    = Class.create( Panel, {
			initialize: function() {
				Panel.apply( this, arguments );
				this.image = game.assets[ 'img/panels5.png'];
				this.panelType = PANEL_TYPE.SKELTON;
				this.score      = SCORE.SKELTON;
				this.frame  = 4;
				this.damage = 1;
				this.setChainedType();
				this.life   = 1;
			},
			getDamage: function() {
				return this.damage;
			},
			setChainedType: function() {
				this.chainedType = PANEL_TYPE.SWORD;
			},
			onTouch: function() {
				if( this.isDead() ) { this.changeImage(); }
			},
			onTouchEnd: function() {
				this.frame = 4;
			},
			isDead: function( damage ) {
				//damageを与えて死ぬかどうかをlifeと比べる
				return true;
			},
			changeImage: function() {
				this.frame = 5;
			}
		});

		var Sword    = Class.create( Panel, {
			initialize: function() {
				Panel.apply( this, arguments );
				this.image = game.assets[ 'img/panels5.png'];
				this.panelType = PANEL_TYPE.SWORD;
				this.score      = SCORE.SWORD;
				this.frame  = 6;
				this.setChainedType();
			},
		});

		var Arrow   = Class.create( Sprite, {
			initialize: function( x, y, dir ) {
				Sprite.apply( this, arguments );
				this.image = game.assets[ 'img/yajirushi.png' ];
				this.frame = dir;
				this.dir   = dir;
				this.pos   = {x: undefined, y: undefined };
			},
			setPosAndDir: function ( pos, dir ) {
				this.frame = dir;
				this.pos   = pos;
				this.dir   = dir;
			},
		});




		window.onload = function(){
			//game.preload( 'img/skelton.png' );
			game.onload = function() {
				//var gameScene  = new GameScene( game, gameOverScene );
				var titleScene = new TitleScene( game );
				//var gameOverScene = new GameOverScene( game, titleScene );
				game.pushScene( titleScene );
			}
			game.start();
		}
	}

	window.addEventListener( 'DOMContentLoaded', initialize, false );
})();

