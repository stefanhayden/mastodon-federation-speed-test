
const fs = require('node:fs');

const data = fs.readFileSync('results.txt', { encoding: 'utf8'  }).split('\n')
	.map(d => {
		try {
			return JSON.parse(d)
		} catch (e) {
			console.log('failed to parse ->', d)
			return undefined;
		}
	}).filter(Boolean);

console.log(data)

data.sort((a, b) => a.time - b.time)
console.log('fastest', data.slice(0, 25))

data.sort((a, b) => b.time - a.time)
console.log('slowest', data.slice(0, 5))


console.log('average', data.reduce((acc, val) => { return acc + val.time}, 0) / data.length)
