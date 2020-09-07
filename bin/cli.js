#!/usr/bin/env node
const path = require('path')
const cvtEpub = require('../src/opencc-convert-epub')

const args = process.argv.slice(2)
const [source, dest] = args.slice(0, 2).map(p => path.join(process.cwd(), p))

cvtEpub(source, {
	type: {
		from: args[2] || 'cn',
		to: args[3] || 'tw'
	},
	dest
}).then(() => console.log('finished'))
