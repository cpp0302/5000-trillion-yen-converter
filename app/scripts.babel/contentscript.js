'use strict';

(() => {
	class Core {
		constructor() {
			this.observer = new MutationObserver((records) => {
				if (records.length != 0) {
					this.process();
				}
			});

			//	設定
			this.enable5000 = false;
			this.enableMoriogai = false;
			this.enableHosii = false;

			this._regex5000 = new RegExp('(5000|５０００)兆円', 'g');
			this._regexHosii = new RegExp('(ほ|欲)しい(!|！)', 'g');
			this._regexMoriogai = new RegExp('森鴎外', 'g');
		}

		get regex5000() {
			return this._regex5000;
		}

		get regexHosii() {
			return this._regexHosii;
		}

		get regexMoriogai() {
			return this._regexMoriogai;
		}

		get defaultSettings() {
			return {
				enable5000: true,
				enableMoriogai: true,
				enableHosii: true
			}
		}

		loadSettings(defaults, callback = null) {
			chrome.storage.local.get(defaults, (items) => {
				this.enable5000 = items.enable5000;
				this.enableMoriogai = items.enableMoriogai;
				this.enableHosii = items.enableHosii;

				if (callback) {
					callback();
				}
			});

			chrome.storage.onChanged.addListener((changes, namespace) => {
				if (namespace === 'local') {
					if (changes.enable5000) {
						this.enable5000 = changes.enable5000.newValue;
					}
					if (changes.enableMoriogai) {
						this.enableMoriogai = changes.enableMoriogai.newValue;
					}
					if (changes.enableHosii) {
						this.enableHosii = changes.enableHosii.newValue;
					}
				}
			});
		}

		ready() {
			let defaults = this.defaultSettings;
			this.loadSettings(defaults, () => {
				this.process();
			});
		}
		
		getImageTag(srcPath, style, alt = '5000兆円') {
			return $('<img>', {src: srcPath, alt: alt}).css(style).prop('outerHTML');
		}
		
		getStyle(height) {
			return {
				'height': height,
				'vertical-align': 'top',
			};
		}
		
		get5000(height, alt) {
			let style = this.getStyle(height);
			let path = chrome.extension.getURL('images/5000-trillion-yen.png');
			return this.getImageTag(path, style, alt);
		}

		getMoriogai(height, alt) {
			let style = this.getStyle(height);
			let path = chrome.extension.getURL('images/morimori.png');
			return this.getImageTag(path, style, alt);
		}

		getHosii(height, alt) {
			let style = this.getStyle(height);
			let path = chrome.extension.getURL('images/hosii.png');
			return this.getImageTag(path, style, alt);
		}
				
		observe() {
			let options = {
				characterData: true,
				childList: true,
				subtree: true
			};
			this.observer.observe($('body').get(0), options);
		}
		
		disconnect() {
			this.observer.disconnect();
		}

		isMatchText(text) {
			if (this.enable5000 && text.match(this.regex5000)) {
				return true;
			}
			if (this.enableMoriogai && text.match(this.regexMoriogai)) {
				return true;
			}
			if (this.enableHosii && text.match(this.regexHosii)) {
				return true;
			}
			return false;
		}
		
		process() {
			if (!this.enable5000 && !this.enableMoriogai && !this.enableHosii) {
				//	disabled
				return;
			}
			//	Disconnect Observer
			this.disconnect();
			
			/**
			 *	置き換え処理
			 */
			let self = this;
			$('div,p,a,span').contents().filter(function() {
				let text = $(this).text();
				return this.nodeType === 3 && self.isMatchText(text);
			}).html(function() {
				let html = $(this);

				//	利用できそうなCSSの値を拾ってくる
				let heightkey = ['line-height', 'font-size'].find((element) => {
					const value = $(this).closest().css(element);
					return !Number.isNaN(parseInt(value));
				});
				let height = '22px'; //	Default
				if (heightkey !== undefined) {
					height = $(this).css(heightkey);
				}

				var replacedStr = html.text();

				if (self.enable5000) {
					replacedStr = replacedStr.replace(self.regex5000, (match) => {
						return self.get5000(height, match);
					});
				}

				if (self.enableMoriogai) {
					replacedStr = replacedStr.replace(self.regexMoriogai, (match) => {
						return self.getMoriogai(height, match);
					});
				}

				if (self.enableHosii) {
					replacedStr = replacedStr.replace(self.regexHosii, (match) => {
						return self.getHosii(height, match);
					});
				}

				return html.replaceWith(replacedStr);
			});
			
			//	Reconnect
			this.observe();
		}
	}
	

	const core = new Core;
	core.ready();
})();
