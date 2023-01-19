/**
 * @typedef {(resolve: (value: any | PromiseLike<any>) => void, reject: (reason?: any) => void) => void} originalExecutor
 * @typedef {(res: any) => void} resolveFunc
 * @typedef {(err: any) => void} rejectFunc
 * @typedef {() => boolean} isCancelledFunc
 * @typedef {(silent: boolean) => void} onCancelFunc
 * @typedef {(resolve: resolveFunc, reject: rejectFunc, isCancelled: isCancelledFunc) => void} executorFunc
 */

export default class PromiseWithCancel extends Promise {
	_isCancelled = false;
	_isResolved = false;
	_isRejected = false;
	_onCancel;
	
	/**
	 * @param {executorFunc} executor
	 * @param {onCancelFunc} onCancel
	 */
	constructor(executor, onCancel) {
		super((resolve, reject) => {
			executor(
				(res) => { this._isResolved = true; resolve(res); },
				(err) => { this._isRejected = true; reject(err); },
				() => this.isCancelled,
			);
		});
		this._onCancel = onCancel;
	}
	
	/**
	 * @return {boolean}
	 */
	get isCancelled() {
		return this._isCancelled;
	}
	
	/**
	 * @param {boolean} silent
	 * @return {boolean}
	 */
	cancel(silent) {
		if (this._isCancelled || this._isResolved || this._isRejected) {
			return false;
		}
		if (this._onCancel) {
			this._onCancel(Boolean(silent));
		}
		this._isCancelled = true;
		return true;
	}
}
