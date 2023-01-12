import MutedTeleport from './MutedTeleport.js';
import Teleport from './Teleport.js';
import { ErrorClosed, ErrorClosedSend, ErrorClosedRecv } from './errors.js';

export default class Channel {
	_buf = [];
	_queue = [];
	_isClosed = false;

	constructor() {
	}

	get isClosed() {
		return this._isClosed;
	}

	async recv() {
		if (this._buf.length > 0) {
			const buffered = this._buf.shift();
			buffered.requestedTp.send();
			return buffered.value;
		}
		if (this._isClosed) {
			throw new ErrorClosedRecv(`Can't recv from closed channel`);
		}
		const teleport = new Teleport();
		this._queue.push(teleport);
		try {
			return teleport.recv();
		}
		catch (err) {
			if (err === EOF) {
				throw new ErrorClosed(`Channel is closed`);
			}
			throw err;
		}
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

	close() {
		if (this._isClosed) {
			throw new ErrorClosed(`Channel is closed`);
		}
		this._isClosed = true;
		for (const q of this._queue.splice(0, this._queue.length)) {
			q.reject(new ErrorClosed('Channel was closed'));
		}
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
				throw err;
			}
		}
	}
}
