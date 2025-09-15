'use client';
import { useEffect } from 'react';

export default function AppLayout({ children }: { children: React.ReactNode }) {
	/* 微应用握手和token、theme消息接收 */
	useEffect(() => {
		let isReady = false;

		const handleMessage = (event: MessageEvent) => {
			if (event.data && event.data.type === 'HANDSHAKE') {
				// 回复握手，告知父应用微应用已准备就绪
				if (!isReady) {
					isReady = true;
					window.parent.postMessage(
						{
							type: 'MICRO_APP_READY'
						},
						'*'
					);
					console.log('微应用握手完成');
				}

				console.log('微应用接收到消息:', event.data);
			} else if (event.data && event.data.type === 'SEND_MESSAGE') {
				console.log('微应用接收到消息:', event.data);
			}
		};

		window.addEventListener('message', handleMessage);

		// 主动发送准备就绪消息（防止时机问题）
		const notifyReady = () => {
			if (!isReady) {
				isReady = true;
				window.parent.postMessage(
					{
						type: 'MICRO_APP_READY'
					},
					'*'
				);
				console.log('微应用主动发送准备就绪消息');
			}
		};

		// 延迟发送，确保组件完全渲染
		const timer = setTimeout(notifyReady, 100);

		return () => {
			clearTimeout(timer);
			window.removeEventListener('message', handleMessage);
		};
	}, []);
	return children;
}
