// noinspection DuplicatedCode

import MutedTeleport from './index.js';
import assert from 'assert';

function debug(...args) {
	// console.debug(...args); // suppress debug
}

it("MutedTeleport: send-recv", async () => {
	const tele = new MutedTeleport();
	
	// send:
	// noinspection ES6MissingAwait
	send(tele, 'Hi Jack!', 0);
	
	// recv (delayed):
	await sleep(20, 'sleep before recv');
	const value = await tele.recv();
	debug('recv', value);
	assert.equal(value, 'Hi Jack!');
});

it("MutedTeleport: recv-send", async () => {
	const tele = new MutedTeleport();
	
	// send (delayed):
	// noinspection ES6MissingAwait
	send(tele, 'Hi Jack!', 20);
	
	// recv:
	const value = await tele.recv();
	debug('recv', value);
	assert.equal(value, 'Hi Jack!');
});

it("MutedTeleport: send promise-recv", async () => {
	const tele = new MutedTeleport();
	
	// send:
	// noinspection ES6MissingAwait
	send(tele, Promise.resolve('Hi Jack!'), 0);
	
	// recv (delayed):
	await sleep(20, 'sleep before recv');
	const value = await tele.recv();
	debug('recv', value);
	assert.equal(value, 'Hi Jack!');
});

it("MutedTeleport: reject-recv", async () => {
	const tele = new MutedTeleport();
	
	// reject:
	// noinspection ES6MissingAwait
	reject(tele, 'expected err', 0);
	
	// recv (delayed):
	await sleep(20, 'sleep before recv');
	let errCaught;
	try {
		await tele.recv();
	}
	catch (err) {
		debug('caught', err);
		errCaught = err;
	}
	assert.equal(errCaught, 'expected err')
});

// UTILS:

async function send(tele, value, delay = 5) {
	if (delay >= 0) {
		await sleep(delay, 'sleep before send');
	}
	debug('send', value);
	tele.send(value);
}

async function reject(tele, err, delay = 5) {
	if (delay >= 0) {
		await sleep(delay, 'sleep before reject');
	}
	debug('reject', err);
	tele.reject(err);
}

async function sleep(delay, debugMsg) {
	debug(`${debugMsg}: ${delay}ms`);
	return new Promise(r => setTimeout(r, delay));
}
