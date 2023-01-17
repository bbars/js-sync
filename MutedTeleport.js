import { ErrorClosedSend, ErrorClosedRecv, ErrorConcurrentRecv, ErrorCancelled } from './errors.js';
import PromiseWithCancel from './PromiseWithCancel.js';

export default class MutedTeleport {
	_multiRecv;
	_promise;
	_resolve;
	_reject;
	_received = false;
	_value;
	_success = null;

	constructor(multiRecv = false) {
		this._multiRecv = multiRecv;
	}

	get isClosed() {
		return this._success !== null;
	}

	/*async*/ recv() {
		if (!this._multiRecv) {
			if (this._received) {
				return PromiseWithCancel.reject(new ErrorClosedRecv(`Can't recv from closed teleport`));
			}
			if (this._promise) {
				return PromiseWithCancel.reject(new ErrorConcurrentRecv(`Can't recv from a concurrently used teleport`));
			}
		}
		
		if (this._success === null) {
			// return await this._promise;
			if (this._promise) {
				return this._promise;
			}
			this._promise = new PromiseWithCancel(
				(resolve, reject) => {
					this._resolve = resolve;
					this._reject = reject;
				},
				(silent) => {
					if (!silent) {
						this._reject(new ErrorCancelled(`Operation was cancelled`));
					}
					this._promise = null;
					this._resolve = null;
					this._reject = null;
				},
			);
			return this._promise;
		}
		
		try {
			if (this._success) {
				return PromiseWithCancel.resolve(this._value);
			}
			else {
				return PromiseWithCancel.reject(this._value);
			}
		}
		finally {
			this._received = true;
			if (!this._multiRecv) {
				this._value = null;
			}
			this._promise = null;
			this._resolve = null;
			this._reject = null;
		}
	}

	send(value) {
		if (this.isClosed) {
			throw new ErrorClosedSend(`Can't send to closed teleport`);
		}
		try {
			if (this._promise) {
				this._resolve(value);
				if (this._multiRecv) {
					this._value = value;
				}
			}
			else {
				this._value = value;
			}
		}
		finally {
			this._success = true;
			this._promise = null;
			this._resolve = null;
			this._reject = null;
		}
		return this;
	}

	reject(err) {
		if (this.isClosed) {
			throw new ErrorClosedSend(`Can't send rejection to closed teleport`);
		}
		try {
			if (this._promise) {
				this._reject(err);
				if (this._multiRecv) {
					this._value = err;
				}
			}
			else {
				this._value = err;
			}
		}
		finally {
			this._success = false;
			this._promise = null;
			this._resolve = null;
			this._reject = null;
		}
		return this;
	}
}
