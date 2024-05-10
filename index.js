require('dotenv').config();
const Mastodon = require('mastodon');
const fs = require('node:fs');
const fetch = require('node-fetch');

const m = new Mastodon({
	access_token: process.env.ACCESS_TOKEN,
	timeout_ms: 60*1000,  // optional HTTP request timeout to apply to all requests.
	api_url: `https://${process.env.API_HOST}/api/v1/`, // optional, defaults to https://mastodon.social/api/v1/
});

async function getAllFollowers(id) {
	const limit = 80;
	let allFollowers = [];
	let count = 0;
	let found = 0;
	let max_id = undefined;
	do {
		console.log('----count', count)
		const params = { limit };
		if (max_id) params.max_id = max_id;

		const { data: followers, ...more } = await m.get(`accounts/${id}/followers`, { ...params  })
		allFollowers = allFollowers.concat(followers);
		const link = more.resp.headers.link

		max_id = link.match(/max_id=(\d+)\>/)?.[1]

		found = followers.length;
		count += 1;
	} while(found === limit);

	return allFollowers;
}

async function read() {



	const { data: accountData } = await m.get('accounts/lookup', { acct: 'stefan' });

	const followers = await getAllFollowers(accountData.id)

	console.log('followers', followers.length)
	const sites = [...new Set(followers.map(a => a.acct.split('@')[1]).filter(Boolean))];

	// get  website
	const tag = `speedTestTag${Math.floor(Math.random() * 10000000)}`
	m.post('statuses', { status: `#${tag}` })
	const start = Date.now();


	fs.writeFileSync(`results.txt`, '')

	const r = sites.map(async (domain) => {
		try {
			const found = await getTag({ domain, tag })
			const end = Date.now();

			if (!found) return false;

			return {
				site: domain,
				end
			}
		} catch (e) {
			console.log('error')
		}
	})

	const results = await Promise.all(r).then(vals => {
		vals.filter(Boolean).map(({ site, end }) => {
			const data = {
				site,
				start,
				end,
				time: (end - start) / 1000
			}
			fs.appendFileSync(`results.txt`, JSON.stringify(data) + '\n')
			return data;
		})
	});


}

async function getTag({ domain, tag, count = 0 }) {
	console.log('getTag', domain, count)
	/**
	const controller = new AbortController();
	const timeout = setTimeout(() => {
		controller.abort();
	}, 1000);
	*/
	try {
		console.log(`https://${domain}/tags/${tag}`)
		//const resp = await fetch(`https://${domain}/tags/${tag}`, { signal: controller.signal });
		const resp = await fetch(`https://${domain}/tags/${tag}`);
		if (resp.status === 200) {
			return true
		} else if (count === 70) {
			throw new Error('fail')
		} else if (resp.status === 404) {
			await new Promise(resolve => setTimeout(resolve, Math.max(500, 500 + ((count - 20) * 250) )));
			return getTag({ domain, tag, count: count + 1 })
		} else {
			throw new Error('fail')
		}
	} catch (e) {
		console.log('failed to get html for: ', domain, e)
		return false;
	} finally {
		//clearTimeout(timeout);
	}

}


read();
