import PromiseWithCancel from './PromiseWithCancel.js';
import Teleport from './Teleport.js';
import Channel from './Channel.js';
import select from './select.js';
import assert from 'assert';
import { ErrorCancelled, ErrorClosed } from './errors.js';

function debug(...args) {
	// console.debug(...args); // suppress debug
}

it('select: mixed sources', async () => {
	const sources = [
		makeTickChannel(10, 'tickChannelOne'),
		makeAfterTeleport(11, 'afterTeleport'),
		makeTickChannel(12, 'tickChannelTwo'),
		makeAfterPromise(13, 'afterPromise'),
		makeAfterPromiseWithCancel(14, 'afterPromiseWithCancel'),
	];
	const timeStart = Date.now();
	for await (const [msg, source] of select(...sources)) {
		debug(`selected recv (from ${source.__label}):`, msg);
		if (Date.now() - timeStart >= 60) {
			break;
		}
	}
	for (const source of sources) {
		if (source instanceof Channel) {
			source.close();
		}
	}
});

it('select: shared counter concurrency', async () => {
	let counter = 0;
	function yilder(label) {
		const chan = new Channel();
		(async () => {
			while (!chan.isClosed) {
				const delay = Math.random() * 10 | 0;
				await sleep(delay, `${label} sleep`);
				try {
					debug('counter change ++', counter+1);
					await chan.send(++counter);
					debug('counter changed++', counter);
				}
				catch (err) {
					if (err instanceof ErrorCancelled || err instanceof ErrorClosed) {
						debug('caught ErrorCancelled');
						counter--;
						debug('counter changed--', counter);
					}
				}
			}
		})();
		return chan;
	}
	
	const yilders = [
		yilder('A'),
		yilder('B'),
		yilder('C'),
	];
	
	let sum = 0;
	const counterLimit = 10;
	for await (const [num] of select(...yilders)) {
		debug('num', num);
		const prevSum = sum;
		sum += num;
		debug(`sum = prevSum + num => ${prevSum} + ${num} = ${sum}`);
		if (counter >= counterLimit) {
			break;
		}
	}
	
	await sleep(20, 'sleep before finish');
	for (const yilder of yilders) {
		await yilder.close();
	}
	await sleep(20, 'sleep after finish');
	
	// debug('counter', counter);
	// assert.equal(counter, counterLimit + yielders.length, 'final counter value is wrong'); // not sure
	debug('sum', sum);
	const expectedSum = (counterLimit * (counterLimit + 1)) / 2;
	assert.equal(sum, expectedSum, `wrong sum of R=[1, ${counterLimit}]`);
});

// UTILS:

async function sleep(delay, debugMsg = 'sleep') {
	debug(`${debugMsg}: ${delay}ms`);
	return new Promise(r => setTimeout(r, delay));
}

function makeAfterTeleport(delay, label) {
	const tele = new Teleport();
	tele.__label = label;
	(async () => {
		await sleep(delay);
		await tele.send(new Date());
	})();
	return tele;
}

function makeTickChannel(delay, label) {
	const chan = new Channel();
	chan.__label = label;
	(async () => {
		while (!chan.isClosed) {
			await chan.send(new Date());
			await sleep(delay);
		}
		debug(`ticker ${label} terminated`)
	})();
	return chan;
}

function makeAfterPromise(delay, label) {
	const prom = new Promise(async (resolve) => {
		await sleep(delay);
		resolve(new Date());
	});
	prom.__label = label;
	return prom;
}

function makeAfterPromiseWithCancel(delay, label) {
	const prom = new PromiseWithCancel(async (resolve) => {
		await sleep(delay);
		resolve(new Date());
	});
	prom.__label = label;
	return prom;
}
