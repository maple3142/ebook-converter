#!/usr/bin/env node
const path = require('path')
const ccEpub = require('../src/opencc-convert-epub')
const ccText = require('../src/opencc-convert-text')

const args = process.argv.slice(2)
const [source, dest] = args.slice(0, 2).map(p => path.join(process.cwd(), p))
const fn = [ccEpub, ccText][args[4] === 'txt' ? 1 : 0]

fn(source, {
	type: {
		from: args[2] || 'cn',
		to: args[3] || 'tw'
	},
	dest
}).then(() => console.log('finished'))
