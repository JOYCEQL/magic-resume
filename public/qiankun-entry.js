(function (global) {
	var iframe = null;
	var pendingMessage = {
		token: null,
		theme: null
	};
	var retryCount = 0;
	var maxRetries = 10;
	var retryInterval = 500;
	var handshakeTimer = null;

	function sendToIframe(state) {
		if (!iframe || !iframe.contentWindow) return;

		try {
			iframe.contentWindow.postMessage(
				{
					type: 'SEND_MESSAGE',
					payload: state
				},
				'*'
			);
			console.log('发送 token 和 theme 到微应用:', token, theme);
		} catch (e) {
			console.warn('发送 token 和 theme 失败:', e);
		}
	}

	function waitForMicroAppReady(state) {
		if (retryCount >= maxRetries) {
			console.warn('微应用握手超时，停止重试');
			return;
		}

		// 发送握手消息
		if (iframe && iframe.contentWindow) {
			try {
				iframe.contentWindow.postMessage(
					{
						type: 'HANDSHAKE',
						payload: state
					},
					'*'
				);
				console.log('发送握手消息，重试次数:', retryCount + 1);
			} catch (e) {
				console.warn('发送握手消息失败:', e);
			}
		}

		retryCount++;
		handshakeTimer = setTimeout(() => waitForMicroAppReady(state), retryInterval);
	}

	// 清除骨架屏
	function hideSkeleton() {
		try {
			const skeleton = document.getElementById('loading-skeleton');
			if (skeleton) {
				skeleton.classList.add('fade-out');
				if (skeleton.parentNode) {
					skeleton.parentNode.removeChild(skeleton);
				}
			}
		} catch (e) {
			console.warn('隐藏骨架屏失败:', e);
		}
	}

	// 监听微应用的握手回复
	function handleReadyMessage(event) {
		if (event.data && event.data.type === 'MICRO_APP_READY') {
			console.log('微应用已准备就绪，停止握手重试');

			// 停止重试
			if (handshakeTimer) {
				clearTimeout(handshakeTimer);
				handshakeTimer = null;
			}
			retryCount = maxRetries;

			// 发送消息
			if (pendingMessage) {
				sendToIframe(pendingMessage);
			}

			// 清除骨架屏
			hideSkeleton();
		}
	}

	function render(props) {
		console.log('qiankun render props:', props);
		var container = props && props.container ? props.container : document.body;
		var url = (props && props.url) || '/app';

		// 保存 token 待发送
		pendingMessage = { ...props };

		// 创建 iframe，挂载 Next 应用
		iframe = document.createElement('iframe');
		iframe.src = url;
		iframe.style.border = '0';
		iframe.style.width = (props && props.iframeWidth) || '100%';
		iframe.style.height = (props && props.iframeHeight) || '100vh';
		iframe.setAttribute('title', 'magic-resume-next');

		// 监听来自微应用的消息
		window.addEventListener('message', handleReadyMessage);

		// iframe 加载完成后开始握手
		iframe.onload = function () {
			console.log('iframe 加载完成，开始握手');
			retryCount = 0;
			waitForMicroAppReady(pendingMessage);
		};

		container.appendChild(iframe);
		return Promise.resolve();
	}

	global['magic-resume'] = {
		bootstrap: function () {
			console.log('magic-resume bootstrap');
			return Promise.resolve();
		},
		mount: function (props) {
			console.log('magic-resume mount:', props);

			/* 基于全局state进行通信 */
			if (props && props.onGlobalStateChange) {
				props.onGlobalStateChange((state, prev) => {
					console.log('全局状态变化:', state, prev);
					sendToIframe(state);
				}, true);
			}
			return render(props || {});
		},
		unmount: function () {
			console.log('magic-resume unmount');

			// 清理握手定时器
			if (handshakeTimer) {
				clearTimeout(handshakeTimer);
				handshakeTimer = null;
			}

			// 清理事件监听
			window.removeEventListener('message', handleReadyMessage);

			if (iframe && iframe.parentNode) {
				iframe.parentNode.removeChild(iframe);
			}
			iframe = null;
			pendingMessage = null;
			retryCount = 0;
			return Promise.resolve();
		}
	};
})(window);
