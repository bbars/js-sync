import { ErrorClosedSend, ErrorClosedRecv } from './errors.js';

export default class MutedTeleport {
	_promise;
	// _resolve
	// _reject
	_isClosed = false;

	constructor() {
		this._promise = new Promise((resolve, reject) => {
			this._resolve = resolve;
			this._reject = reject;
		});
	}

	get isClosed() {
		return this._isClosed;
	}

	/*async*/ recv() {
		if (this._isClosed) {
			throw new ErrorClosedRecv(`Can't recv from closed teleport`);
		}
		return this._promise;
	}

	send(value) {
		if (this._isClosed) {
			throw new ErrorClosedSend(`Can't send to closed teleport`);
		}
		try {
			this._resolve(value);
		}
		finally {
			this._isClosed = true;
			this._resolve = null;
			this._reject = null;
		}
		return this;
	}

	reject(err) {
		if (this._isClosed) {
			throw new ErrorClosedSend(`Can't send rejection to closed teleport`);
		}
		try {
			this._reject(err);
		}
		finally {
			this._isClosed = true;
			this._resolve = null;
			this._reject = null;
		}
		return this;
	}
}
