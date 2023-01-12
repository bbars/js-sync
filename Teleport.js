import MutedTeleport from './MutedTeleport.js';

export default class Teleport extends MutedTeleport {
	_requestedTp;

	constructor() {
		super();
		this._requestedTp = new MutedTeleport();
	}

	async recv() {
		const res = await super.recv();
		if (this._requestedTp && !this._requestedTp.isClosed) {
			this._requestedTp.send(true);
		}
		return res;
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
