(function(){
	function bind(func, scope){
		return function(){
			return func.apply(scope, arguments);
		}
	}

	function initialize(){
		enchant();
		var game = new Game( 320, 480 );
		var resources = [
			"img/panels.png"
		];
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
				this.addChild( this.Field );
			},
			onExit: function() {
			}
		});

		var Field    = Class.create( Group, {
			initialize: function() {
				Group.apply( this, arguments );
				this.panelX  = 6;
				this.panelY  = 6;
				this.fields  = [];
				this.createInitialField();
				this.onEnter();
			},

			onEnter: function(){
				this.drawField();
				this.addEventListener( 'touchstart', function(e){
					console.log("fieldががタッチされたよ。");
				});
				this.addEventListener( 'touchend', function(e){
					console.log("fieldのタッチが終了したよ");
				});
			},

			createInitialField: function(){
				for (var x = 0; x < this.panelX; x++) {
					this.fields[x] = [];
					for (var y = 0; y < this.panelY; y++) {
						this.fields[x][y] = parseInt( Math.random() * 4 ) + 1;
					}
				}
			},

			createPanel: function( panelType ){
				switch( panelType ) {
					case 1:
						return new Coin();
						break;
					case 2:
						return new Shield();
						break;
					case 3:
						return new Skelton();
						break;
					case 4:
						return new Sword();
						break;
					default :
						return new Sword();
						break;
				}
			},
			drawField: function(){
				for (var x = 0; x < this.panelX; x++) {
					for (var y = 0; y < this.panelY; y++) {
						var p = this.createPanel( this.fields[x][y] );
						p.moveTo( x * 64, y * 64 );
						this.addChild(p);
					}
				}
			}
		});

		var Panel    = Class.create( Sprite, {
			initialize: function() {
				Sprite.apply( this, arguments );
				this.panelType = undefined;
				this.isTouching = true;
				this.onEnter();
			},
			onEnter: function() {
				this.addEventListener('touchstart', bind( function(e){
					this.onTouch();
				}, this ));
			},
			onTouch: function() {
			},
		});

		var Coin    = Class.create( Panel, {
			initialize: function() {
				Panel.apply( this, arguments );
				this.image = game.assets[ 'img/panels.png'];
				this.width  = 64;
				this.height = 64;
				this.frame  = 0;
			},
			onTouch: function() {
				console.log( "Coin がタッチされたよ" );
			}
		});

		var Shield    = Class.create( Panel, {
			initialize: function() {
				Panel.apply( this, arguments );
				this.image = game.assets[ 'img/panels.png'];
				this.width  = 64;
				this.height = 64;
				this.frame  = 1;
			},
			onTouch: function() {
				console.log( "Shield がタッチされたよ" );
			}
		});

		var Skelton    = Class.create( Panel, {
			initialize: function() {
				Panel.apply( this, arguments );
				this.image = game.assets[ 'img/panels.png'];
				this.width  = 64;
				this.height = 64;
				this.frame  = 2;
			},
			onTouch: function() {
				console.log( "Skelton がタッチされたよ" );
			}
		});

		var Sword    = Class.create( Panel, {
			initialize: function() {
				Panel.apply( this, arguments );
				this.image = game.assets[ 'img/panels.png'];
				this.width  = 64;
				this.height = 64;
				this.frame  = 3;
			},
			onTouch: function() {
				console.log( "Sword がタッチされたよ" );
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

