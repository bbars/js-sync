import { Channel, ErrorClosed } from './index.js';

function debug(...args) {
	// console.debug(...args); // suppress debug
}

it('Channel: send-recv', async function () {
	const chan = new Channel();
	let limit = 3;
	
	// noinspection ES6MissingAwait
	send(chan, true, limit, 5, false);
	
	// recv:
	while (limit-- > 0) {
		const i = await chan.recv();
		debug('recv', i);
	}
});

it('Channel: send-iter', async function () {
	const chan = new Channel();
	let limit = 3;
	
	// noinspection ES6MissingAwait
	send(chan, true, limit, 5, false);
	
	// recv (iter):
	for await (const i of chan) {
		debug('recv', i);
		if (--limit <= 0) {
			break;
		}
	}
});

it('Channel: send-close-recv', async function () {
	const chan = new Channel();
	let limit = 3;
	
	// noinspection ES6MissingAwait
	send(chan, true, limit, -1, true);
	
	let errCaught;
	// recv:
	try {
		limit += 1; // excessive
		
		while (limit-- > 0) {
			const i = await chan.recv();
			debug('recv', i);
		}
	}
	catch (err) {
		if (err instanceof ErrorClosed) {
			errCaught = err;
		}
		else {
			throw err;
		}
	}
	
	console.assert(errCaught, 'error expected');
});

it('Channel: send-close-iter', async function () {
	const chan = new Channel();
	
	// noinspection ES6MissingAwait
	send(chan, true, 3, -1, true);
	
	// recv (iter):
	for await (const i of chan) {
		debug('recv', i);
		await new Promise(r => setTimeout(r, 5));
	}
});

async function send(chan, synchronize, limit, delay = 5, close = false) {
	for (let i = 0; i < limit; i++) {
		if (i > 0 && delay >= 0) {
			await new Promise(r => setTimeout(r, delay));
		}
		if (synchronize) {
			debug('sync send...', i);
			await chan.send(i);
			debug('sync sent', i);
		}
		else {
			debug('sync send...', i);
			chan.send(i);
		}
	}
	if (close) {
		chan.close();
	}
}
