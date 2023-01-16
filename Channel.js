import MutedTeleport from './MutedTeleport.js';
import Teleport from './Teleport.js';
import PromiseWithCancel from './PromiseWithCancel.js';
import { ErrorClosed, ErrorClosedSend, ErrorClosedRecv, ErrorCancelled } from './errors.js';

export default class Channel {
	_buf = [];
	_queue = [];
	_isClosed = false;

	constructor() {
	}

	get isClosed() {
		return this._isClosed;
	}

	/**
	 * @return {PromiseWithCancel}
	 */
	/*async*/ recv() {
		if (this._buf.length > 0) {
			const buffered = this._buf.shift();
			buffered.requestedTp.send();
			return PromiseWithCancel.resolve(buffered.value);
		}
		if (this._isClosed) {
			return PromiseWithCancel.reject(new ErrorClosedRecv(`Can't recv from closed channel`));
		}
		const teleport = new Teleport();
		let numberInQueue = this._queue.push(teleport) - 1;
		return new PromiseWithCancel(
			(resolve, reject) => {
				teleport.recv().then(resolve, reject);
			},
			() => {
				teleport.reject(new ErrorCancelled());
				for (let i = numberInQueue; i >= 0; i--) {
					if (this._queue[i] === teleport) {
						this._queue.splice(i, 1);
						break;
					}
				}
			},
		);
	}

	async send(value) {
		if (this._isClosed) {
			throw new ErrorClosedSend(`Can't send to closed channel`);
		}
		const queueLength = this._queue.length;
		if (queueLength > 0) {
			await this._queue.shift().send(value);
		}
		else {
			const requestedTp = new MutedTeleport();
			this._buf.push({
				value,
				requestedTp,
			});
			await requestedTp.recv();
		}
		return queueLength - this._buf.length;
	}

	async close() {
		if (this._isClosed) {
			throw new ErrorClosed(`Channel is closed`);
		}
		this._isClosed = true;
		const queueRejected = [];
		for (const q of this._queue.splice(0, this._queue.length)) {
			queueRejected.push(q.reject(new ErrorClosed('Channel was closed')));
		}
		await Promise.all(queueRejected);
	}

	async* [Symbol.asyncIterator]() {
		while (true) {
			try {
				yield await this.recv();
			}
			catch (err) {
				if (err instanceof ErrorClosed) {
					break;
				}
				if (err instanceof ErrorCancelled) {
					break;
				}
				throw err;
			}
		}
	}
}
