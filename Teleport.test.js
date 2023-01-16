// noinspection DuplicatedCode

import Teleport from './Teleport.js';
import assert from 'assert';
import { ErrorClosedCancel } from './errors.js';

function debug(...args) {
	// console.debug(...args); // suppress debug
}

it("Teleport: send-recv", async () => {
	const tele = new Teleport();
	
	// send:
	// noinspection ES6MissingAwait
	send(tele, 'Hi Jack!', 0);
	
	// recv (delayed):
	await sleep(20, 'sleep before recv');
	const value = await tele.recv();
	debug('recv', value);
	assert.equal(value, 'Hi Jack!');
});

it("Teleport: recv-send", async () => {
	const tele = new Teleport();
	
	// send (delayed):
	// noinspection ES6MissingAwait
	send(tele, 'Hi Jack!', 20);
	
	// recv:
	const value = await tele.recv();
	debug('recv', value);
	assert.equal(value, 'Hi Jack!');
});

it("Teleport: send promise-recv", async () => {
	const tele = new Teleport();
	
	// send:
	// noinspection ES6MissingAwait
	send(tele, Promise.resolve('Hi Jack!'), 0);
	
	// recv (delayed):
	await sleep(20, 'sleep before recv');
	const value = await tele.recv();
	debug('recv', value);
	assert.equal(value, 'Hi Jack!');
});

it("Teleport: reject-recv", async () => {
	const tele = new Teleport();
	
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
		errCaught = err;
	}
	assert.equal(errCaught, 'expected err')
});

it("Teleport: recv-cancel-recv-send", async () => {
	const tele = new Teleport();
	
	// send (delayed):
	// noinspection ES6MissingAwait
	send(tele, 'Hi Jack!', 20);
	
	// recv (delay, then cancel):
	const promise1 = tele.recv();
	// noinspection ES6MissingAwait
	(async () => {
		let errCaught;
		try {
			const value = await promise1;
			debug(`error should be thrown, but a value have been read instead`, value);
		}
		catch (err) {
			errCaught = err;
		}
		assert(errCaught instanceof ErrorClosedCancel, 'Cancelled promise of recv() must be rejected with ErrorClosedCancel');
	})();
	await sleep(5, 'sleep before cancel');
	debug('cancel');
	promise1.cancel();
	
	// recv:
	const promise2 = tele.recv();
	const value = await promise2;
	debug('recv', value);
	assert.equal(value, 'Hi Jack!');
	assert.notEqual(promise2, promise1, 'A fresh promise must be returned by recv() instead of cancelled one');
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
