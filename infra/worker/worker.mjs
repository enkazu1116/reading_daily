/**
 * Terraform-managed API stub. Replace with the real Worker in api/ when the backend is ready.
 * Identity is provided by Cloudflare Access via Cf-Access-Authenticated-User-Email.
 */
export default {
	async fetch(request, env) {
		const email = request.headers.get('Cf-Access-Authenticated-User-Email');

		if (request.method === 'OPTIONS') {
			return new Response(null, { status: 204 });
		}

		return new Response(
			JSON.stringify({
				ok: true,
				stub: true,
				path: new URL(request.url).pathname,
				user: email,
				bindings: {
					db: Boolean(env.DB),
					cache: Boolean(env.CACHE),
					googleBooksApiKey: Boolean(env.GOOGLE_BOOKS_API_KEY),
					corsOrigin: Boolean(env.CORS_ORIGIN)
				}
			}),
			{
				status: 200,
				headers: {
					'Content-Type': 'application/json',
					'Access-Control-Allow-Origin': env.CORS_ORIGIN || request.headers.get('Origin') || '*',
					'Access-Control-Allow-Credentials': 'true'
				}
			}
		);
	}
};
