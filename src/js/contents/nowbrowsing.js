"use strict";

////////////////////////////////////////////////////////////////////////////////
// Now Browsing
////////////////////////////////////////////////////////////////////////////////
Contents.nowbrowsing = function( cp )
{
	var p = $( '#' + cp.id );
	var cont = p.find( 'div.contents' );
	var nowbrowsing_list;
	var scrollPos = null;

	cp.SetIcon( 'icon-earth' );

	////////////////////////////////////////////////////////////
	// リスト部作成
	////////////////////////////////////////////////////////////
	var ListMake = function( type ) {
		var items = new Array();

		chrome.windows.getAll( { populate: true }, function( wins ) {
			for ( var i = 0, _len = wins.length ; i < _len ; i++ )
			{
				for ( var j = 0, __len = wins[i].tabs.length ; j < __len ; j++ )
				{
					// URLがchrome～、about:～のタブは無視
					if ( !wins[i].tabs[j].url.match( /^chrome|about:/ ) )
					{
						items.push( {
							title: escapeHTML( wins[i].tabs[j].title ),
							url: wins[i].tabs[j].url,
						} );
					}
				}
			}

			nowbrowsing_list.html( OutputTPL( 'nowbrowsing_list', { items: items } ) )
				.scrollTop( 0 );

			////////////////////////////////////////
			// タイトル-URLクリック
			////////////////////////////////////////
			nowbrowsing_list.find( 'div.item .title > span' ).click( function( e ) {
				var item = $( this ).parent().parent();

				var text = $( '<div>' ).html( g_cmn.cmn_param['nowbrowsing_text'] ).text() + item.attr( 'pagetitle' ) + ' - ' + item.attr( 'url' );

				var pid = IsUnique( 'tootbox' );
				var left = null;
				var top = null;

				var SetText = function() {
					$( '.tootbox .text' ).each( function( e ) {
						var textbox = $( this );

						var areatext = textbox.val();
						var pos = textbox.get( 0 ).selectionStart;
						var bef = areatext.substr( 0, pos );
						var aft = areatext.substr( pos, areatext.length );

						textbox.val( bef + text + aft )
							.focus()
							.trigger( 'keyup' );

						return false;
					} );
				};
				
				// トゥートパネルが開いていない場合は開く
				if ( pid == null )
				{
					var _cp = new CPanel( left, top, g_defwidth, g_defheight_s );
					_cp.SetType( 'tootbox' );
					_cp.SetParam( { account_id: '' } );
					_cp.Start( function() {
						SetText();
						$( '.tootbox .text' ).SetPos( 'start' );
					} );
				}
				else
				{
					SetText();
				}

				e.stopPropagation();
			} );

			cont.trigger( 'contents_resize' );
		} );
	};

	////////////////////////////////////////////////////////////
	// 開始処理
	////////////////////////////////////////////////////////////
	this.start = function() {
		////////////////////////////////////////
		// 最小化/設定切替時のスクロール位置
		// 保存/復元
		////////////////////////////////////////
		cont.on( 'contents_scrollsave', function( e, type ) {
			// 保存
			if ( type == 0 )
			{
				if ( scrollPos == null )
				{
					scrollPos = nowbrowsing_list.scrollTop();
				}
			}
			// 復元
			else
			{
				if ( scrollPos != null )
				{
					nowbrowsing_list.scrollTop( scrollPos );
					scrollPos = null;
				}
			}
		} );

		////////////////////////////////////////
		// リサイズ処理
		////////////////////////////////////////
		cont.on( 'contents_resize', function() {
			$( '#nowbrowsing_list' ).height( cont.height() - cont.find( '.panel_btns' ).height() - 1 );
		} );

		// 全体を作成
		cont.addClass( 'nowbrowsing' )
			.html( OutputTPL( 'nowbrowsing', {} ) );

		cp.SetTitle( i18nGetMessage( 'i18n_0029' ), false );

		nowbrowsing_list = $( '#nowbrowsing_list' );

		////////////////////////////////////////
		// タブの更新イベントでリスト更新
		////////////////////////////////////////
		chrome.tabs.onUpdated.addListener( ListMake );
		chrome.tabs.onRemoved.addListener( ListMake );

		////////////////////////////////////////
		// 更新ボタンクリック
		////////////////////////////////////////
		$( '#nowbrowsing_reload' ).click( function( e ) {
			// disabledなら処理しない
			if ( $( this ).hasClass( 'disabled' ) )
			{
				return;
			}

			cont.trigger( 'reload_timer' );
			ListMake();
		} );

		// リスト部作成処理
		cont.trigger( 'reload_timer' );
		ListMake();
	};

	////////////////////////////////////////////////////////////
	// 終了処理
	////////////////////////////////////////////////////////////
	this.stop = function() {
		chrome.tabs.onUpdated.removeListener( ListMake );
		chrome.tabs.onRemoved.removeListener( ListMake );
	};
}
