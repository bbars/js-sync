import PromiseWithCancel from './PromiseWithCancel.js';
import assert from 'assert';

function debug(...args) {
	// console.debug(...args); // suppress debug
}

it('PromiseWithCancel: cancel after some time', async function () {
	let promiseCancelled = false;
	const onCancel = () => {
		debug('promise cancelled');
		promiseCancelled = true;
	};
	const executor = (resolve, reject, isCancelled) => {
		let counter = 0;
		// some operation:
		const tmr = setInterval(() => {
			// check if client code cancelled this async task:
			if (isCancelled()) {
				// abort the task
				debug('counter', counter);
				clearInterval(tmr);
				return;
			}
			
			counter++;
			debug('counter', counter);
			
			if (counter < 5) {
				debug('continue task...');
				return;
			}
			
			clearInterval(tmr);
			debug('task done, resolve promise (fail state)');
			resolve('Five');
			throw new Error(`Promise should have been cancelled within the test`);
		}, 10);
	};
	
	// run async task:
	const prom = new PromiseWithCancel(executor, onCancel);
	
	// sleep for 30ms...
	await new Promise(r => setTimeout(r, 30));
	
	// cancel:
	prom.cancel(false);
	assert.equal(promiseCancelled, true);
});
