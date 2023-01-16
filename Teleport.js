import MutedTeleport from './MutedTeleport.js';
import {ErrorCancelled} from './errors.js';

export default class Teleport extends MutedTeleport {
	_requestedTp;

	constructor() {
		super();
		this._requestedTp = new MutedTeleport();
	}

	/*async*/ recv() {
		const promise = super.recv();
		promise
			.then(() => {
				if (this._requestedTp && !this._requestedTp.isClosed) {
					this._requestedTp.send(true);
				}
			})
			.catch((err) => {
				if (err instanceof ErrorCancelled) {
					return;
				}
				if (this._requestedTp && !this._requestedTp.isClosed) {
					this._requestedTp.send(true);
				}
			})
		;
		return promise;
	}

	async send(value) {
		super.send(value);
		return this._requestedTp.recv();
	}

	async reject(err) {
		super.reject(err);
		return this._requestedTp.recv();
	}
}
