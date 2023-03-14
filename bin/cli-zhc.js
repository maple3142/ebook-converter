#!/usr/bin/env node
const path = require('path')
const zhcEpub = require('../src/zhc-convert-epub')
const zhcText = require('../src/zhc-convert-text')

const args = process.argv.slice(2)
const [source, dest] = args.slice(0, 2).map(p => path.join(process.cwd(), p))
const fn = [zhcEpub, zhcText][args[3] === 'txt' ? 1 : 0]

fn(source, {
	type: args[2] || 'Taiwan',
	dest
}).then(() => console.log('finished'))
