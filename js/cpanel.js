"use strict";

////////////////////////////////////////////////////////////////////////////////
// パネルクラス
////////////////////////////////////////////////////////////////////////////////

// コンテンツスクリプト
var Contents = {};

var CPanel = function ( x, y, w, h, id, minimum, zindex, status, startflg )
{
	// パネルのID
	if ( id == undefined )
	{
		id = GetUniqueID();
	}

	this.id = 'panel_' + id;

	// パネルのタイプ
	this.type = null;

	// パネルのタイトル
	this.title = 'new panel';

	// パネルのパラメータ
	this.param = {};

	// コンテンツ
	this.contents = null;

	// 最小化
	if ( minimum == undefined )
	{
		minimum = { minimum: false, width: null, height: null, scrollHeight: null };
	}

	this.minimum = minimum;

	// サイズ、位置固定
	if ( status == undefined )
	{
		status = { no_move: false };
	}

	this.status = status;

	// 表示順序
	if ( zindex == undefined )
	{
		zindex = 100 + g_cmn.panel.length;
	}

	this.zindex = zindex;

	// 位置
	if ( x == null || y == null )
	{
		x = Math.floor( ( $( '#head' ).outerWidth() - w ) / 2 ) + $( document ).scrollLeft();
		y = $( '#head' ).outerHeight() + $( document ).scrollTop();

		// 同一座標に他のパネルがある場合は少しずらす
		for ( var i = 0, _len = g_cmn.panel.length ; i < _len ; i++ )
		{
			if ( $( '#' + g_cmn.panel[i].id ).position().left == x &&
				 $( '#' + g_cmn.panel[i].id ).position().top == y )
			{
				x += 32, y += 32;
				i = -1;
			}
		}
	}

	////////////////////////////////////////
	// 最小化-元に戻す
	////////////////////////////////////////
	var PanelMinimum = function( p, minimum ) {
		// 元に戻す
		if ( minimum.minimum == false )
		{
			p.find( 'div.contents' )
				.show()
				.trigger( 'contents_scrollsave', [1] );

			if ( minimum.width != null && minimum.height != null )
			{
				p.css( {
					height: minimum.height,
				} );
			}

			minimum.width = null;
			minimum.height = null;

			p.resizable( 'enable' )
				.resize()
				.find( 'div.titlebar' ).find( '.minimum' )
				.removeClass( 'icon-maximize' ).addClass( 'icon-underline' );
		}
		// 最小化
		else
		{
			p.find( 'div.contents' )
				.trigger( 'contents_scrollsave', [0] )
				.hide()
				.end()
				.css( {
					height: p.find( 'div.titlebar' ).outerHeight()
					+ parseInt( p.css( 'border-top-width' ) )
					+ parseInt( p.css( 'border-bottom-width' ) )
					- parseInt( p.find( 'div.titlebar' ).css( 'border-bottom-width' ) )
				} )
				.resizable( 'disable' )
				.removeClass( 'ui-state-disabled' )
				.find( 'div.titlebar' ).find( '.minimum' )
				.removeClass( 'icon-underline' ).addClass( 'icon-maximize' );
		}
	};

	////////////////////////////////////////////////////////////
	// 新規作成
	////////////////////////////////////////////////////////////
	( function( x, y, w, h, id, minimum, zindex, status ) {
		var elem = document.createElement( 'panel' );
		elem.setAttribute( 'id', id );

		$( '#main' ).get( 0 ).appendChild( elem );

		var p = $( '#' + id );

		// HTML
		p.html( OutputTPL( 'panel', { title: 'new panel', icon: null } ) );

		var cont = p.find( 'div.contents' );
		var titlebar = p.find( 'div.titlebar' );

		// ドラッグ時、リサイズ時のパネル表示
		var GhostPanel = function( type ) {
			if ( type == 'start' )
			{
				SetFront( p );
				$( 'body' ).css( { pointerEvents: 'none' } );
			}
			else
			{
				// メイン部外に出ないようにする
				if ( p.position().top < $( '#head' ).height() )
				{
					p.css( { top: $( '#head' ).height() } );
				}

				if ( p.position().left < 0 )
				{
					p.css( { left: 0 } );
				}

				$( window ).trigger( 'resize' );

				$( 'body' ).css( { pointerEvents: 'auto' } );
			}
		};

		// スタイル、ドラッグ、リサイズ、HTML
		p
			.css( {
				position: 'absolute',
				width: w,
				height: h,
				left: x,
				top: y,
				zIndex: zindex,
			} )
			.draggable( {
				cursor: 'move',
				snap: false,
				snapMode: '',
				cancel: 'div.contents,div.titlebar > span.ctlbtn',
				start: function() {
					GhostPanel( 'start' );
				},
				stop: function() {
					GhostPanel( 'stop' );
				},
			} )
			.resizable( {
				handles: 'all',
				start: function() {
					GhostPanel( 'start' );
				},
				stop: function() {
					GhostPanel( 'stop' );
				},
			} );

		titlebar.find( '.titleicon' ).hide();

		// タイムライン-設定切替
		cont.find( '.lines' ).hide()
			.end()
			.find( '.setting' ).show();

		// 最小サイズの設定
		SetMinimumSize( w, h, p );

		////////////////////////////////////////
		// パネル上でマウスがクリックされたとき
		////////////////////////////////////////
		p.click( function( e ) {
			SetFront( $( this ) );
		});

		////////////////////////////////////////
		// クローズボタンを押したとき
		////////////////////////////////////////
		titlebar.find( '.close' ).click( function( e, conf ) {
			if ( conf != false )
			{
				if ( GetPanel( id ).status.no_move == true )
				{
					if ( !confirm( i18nGetMessage( 'i18n_0116' ) ) )
					{
						return;
					}
				}
			}

			for ( var i = 0, _len = g_cmn.panel.length ; i < _len ; i++ )
			{
				if ( id == g_cmn.panel[i].id )
				{
					if ( g_cmn.panel[i].contents )
					{
						g_cmn.panel[i].contents.stop();
					}

					var pzindex = p[0].style.zIndex;
					var _type = g_cmn.panel[i].type;

					g_cmn.panel.splice( i, 1 );

					$( '#' + id ).html( '' );
					$( '#' + id ).remove();

					$( 'panel' ).each( function() {
						var zindex = $( this )[0].style.zIndex;

						if ( zindex > pzindex )
						{
							$( this ).css( 'zIndex', zindex - 1 );
						}
					} );

					break;
				}
			}

			$( window ).trigger( 'resize' );

			// パネルリストの更新
			$( document ).trigger( 'panellist_changed' );

			e.stopPropagation();
		});

		////////////////////////////////////////
		// 設定ボタンを押したとき
		////////////////////////////////////////
		titlebar.find( '.setting' ).click( function( e ) {
			var _p = GetPanel( id );

			// 最小化中は無効
			if ( _p.minimum.minimum == true )
			{
				e.stopPropagation();
				return;
			}

			if ( cont.find( '.setting' ).css( 'display' ) == 'none' )
			{
				cont.trigger( 'setting_change', true )
					.trigger( 'contents_scrollsave', [0] )
					.find( '.lines' ).hide()
					.end()
					.find( '.setting' ).show()
					.find( 'input[type=text]' ).first().focus();
			}
			else
			{
				cont.find( '.lines' ).show()
					.end()
					.find( '.setting' ).hide()
					.end()
					.trigger( 'setting_change', false )
					.trigger( 'contents_scrollsave', [1] )
					.find( '.lines' ).find( '.timeline_list' ).trigger( 'scroll' );
			}

			e.stopPropagation();
		});

		////////////////////////////////////////
		// 最小化ボタンを押したとき
		////////////////////////////////////////
		titlebar.find( '.minimum' ).click( function( e ) {
			var _p = GetPanel( id );

			// 最小化
			if ( _p.minimum.minimum == false )
			{
				_p.minimum.minimum = true;
				_p.minimum.width = p.outerWidth();
				_p.minimum.height = p.outerHeight();
			}
			// 元に戻す
			else
			{
				_p.minimum.minimum = false;
			}

			PanelMinimum( $( '#' + id ), _p.minimum );

			SetFront( p );
			e.stopPropagation();
		} );

		// リサイズ
		p.on( 'resize', function() {
			cont.height( p.height() - titlebar.height() - 1 )
				.trigger( 'contents_resize' );
		} );

		p.resize();
	} )( x, y, w, h, this.id, this.minimum, this.zindex, this.status );

	////////////////////////////////////////
	// 最小サイズ設定
	////////////////////////////////////////
	function SetMinimumSize( w, h, p ) {
		var _tb = p.find( '.titlebar' );
		var minw = _tb.find( '.close' ).outerWidth() * 3
				 + _tb.find( '.titleicon' ).outerWidth()
				 + _tb.find( '.badge' ).outerWidth()
				 + parseInt( _tb.css( 'border-spacing' ).split(' ')[0] ) * 5 * 2
				 + parseInt( _tb.find( '.title' ).css( 'font-size' ) ) * 2;
		var minh = p.find( '.titlebar' ).outerHeight()
				+ parseInt( p.css( 'border-top-width' ) )
				+ parseInt( p.css( 'border-bottom-width' ) )
				- parseInt( p.find( 'div.titlebar' ).css( 'border-bottom-width' ) );

		if ( w < minw )
		{
			p.width( minw );
		}

		if ( h < minh )
		{
			p.height( minh );
		}

		p.resizable( 'option', 'minWidth', minw )
			.resizable( 'option', 'minHeight', minh );
	};

	this.SetMinimumSize = function( w, h, p )
	{
		SetMinimumSize( w, h, p );
	};

	////////////////////////////////////////////////////////////
	// タイプ設定
	////////////////////////////////////////////////////////////
	this.SetType = function( type ) {
		this.type = type;
	};

	////////////////////////////////////////////////////////////
	// アイコン設定
	////////////////////////////////////////////////////////////
	this.SetIcon = function( icon ) {
		var p = $( '#' + this.id );
		var titlebar = p.find( 'div.titlebar' );

		if ( icon )
		{
			titlebar.find( '.titleicon' ).show().removeClass( 'icon-file' ).addClass( icon );

			// 位置、サイズ固定メニュー設定
			var titleicon = titlebar.find( '.titleicon' );

			if ( !titleicon.attr( 'setting' ) )
			{
				var panel = this;

				titlebar.find( '.titlesetting' ).css( {
					left: titleicon.position().left + 8,
					top: titleicon.position().top + titleicon.outerWidth()
				} )
				.hide()
				.find( '.no_move input[type=checkbox]' ).attr( 'checked', panel.status.no_move )
				.change( function( e ) {
					panel.status.no_move = $( this ).prop( 'checked' );

					if ( ( panel.status.no_move ) )
					{
						p.addClass( 'fixed' );
					}
					else
					{
						p.removeClass( 'fixed' );
					}

					p.draggable( ( panel.status.no_move ) ? 'disable' : 'enable' )
					 .removeClass( 'ui-state-disabled' );
				} )
				.trigger( 'change' );

				titleicon.click( function( e ) {
					titlebar.find( '.titlesetting' ).toggle();
				} );

				titleicon.attr( 'setting', true );
			}
		}
		else
		{
			titlebar.find( '.titleicon' ).hide();
			// 位置、サイズ固定メニュー削除
			titlebar.find( '.titlesetting' ).remove();
		}

		// パネルリストの更新
		$( document ).trigger( 'panellist_changed' );
	};

	////////////////////////////////////////////////////////////
	// タイトル設定
	////////////////////////////////////////////////////////////
	this.SetTitle = function( title, setting ) {
		this.title = title;
		this.setting = setting;

		var p = $( '#' + this.id );
		var titlebar = p.find( 'div.titlebar' );
		var titlediv = titlebar.find( '.title .name' );

		titlediv.html( title );

		// バッジを隠す"
		titlebar.find( '.badge' ).hide();

		// setting=falseの場合、設定ボタンを隠す"
		if ( !setting )
		{
			titlebar.find( '.setting' ).hide();
		}

		// パネルリストの更新
		$( document ).trigger( 'panellist_changed' );
	};

	////////////////////////////////////////////////////////////
	// パラメータ設定
	////////////////////////////////////////////////////////////
	this.SetParam = function( param ) {
		this.param = param;
	};

	////////////////////////////////////////////////////////////
	// コンテンツ開始
	////////////////////////////////////////////////////////////
	this.Start = function( cb ) {
		var _cp = this;

		// コンテンツスクリプトがロードされていない
		if ( Contents[_cp.type] == undefined )
		{
			console.log( 'contents script not loaded. [' + _cp.type + ']' );

			// パネルを強制的に閉じる
			var pzindex = $( '#' + _cp.id )[0].style.zIndex;

			$( '#' + _cp.id ).html( '' );
			$( '#' + _cp.id ).remove();

			$( 'panel' ).each( function() {
				var zindex = $( this )[0].style.zIndex;

				if ( zindex > pzindex )
				{
					$( this ).css( 'zIndex', zindex - 1 );
				}
			} );

			return false;
		}

		// コンテンツ設定
		_cp.contents = new Contents[_cp.type]( _cp );

		// 共通データに追加
		g_cmn.panel.push( _cp );

		SaveData();

		// パネルリストの更新
		$( document ).trigger( 'panellist_changed' );

		$( '#' + _cp.id ).find( 'div.contents' ).css( 'visibility', 'visible' ).end()
			.find( 'div.titlebar' ).css( 'visibility', 'visible' );

		// 開始処理
		_cp.contents.start();

		// callbackが指定されている場合は呼び出す
		if ( cb != undefined )
		{
			cb();
		}

		// 最小化ボタン設定
		PanelMinimum( $( '#' + _cp.id ), _cp.minimum );

		SetFont( true );
	};
};

