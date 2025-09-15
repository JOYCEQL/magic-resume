import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const config = {
	typescript: {
		ignoreBuildErrors: true
	},
	output: 'standalone',
	/* 微前端 */
	// 解决主应用和微应用通信时的跨域问题
	async headers() {
		return [
			{
				source: '/:path*',
				headers: [
					{ key: 'Access-Control-Allow-Origin', value: '*' },
					{ key: 'Access-Control-Allow-Methods', value: '*' },
					{ key: 'Access-Control-Allow-Headers', value: '*' }
				]
			}
		];
	}
};

export default withNextIntl(config);
