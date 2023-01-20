import MutedTeleport from './MutedTeleport.js';
import Teleport from './Teleport.js';
import Channel from './Channel.js';
import PromiseWithCancel from './PromiseWithCancel.js';

/**
 * @param {Channel | Teleport | PromiseWithCancel | Promise} ...sources
 * @return {Generator<*, void, *>}
 */
export default async function* select(...sources) {
	const proms = [];
	const clean = (firedProm, firedSource) => {
		for (const prom of proms) {
			if (prom !== firedProm) {
				prom.cancel();
			}
		}
		proms.splice(0, proms.length);
		if (firedSource instanceof Promise || firedSource instanceof Teleport || firedSource instanceof MutedTeleport) {
			const i = sources.indexOf(firedSource);
			if (i >= 0) {
				sources.splice(i, 1);
			}
		}
	};
	const listen = async (i, source) => {
		let prom;
		if ((source instanceof Channel || source instanceof Teleport || source instanceof MutedTeleport) && !source.isClosed) {
			prom = source.recv();
			proms.push(prom);
		}
		else if (source instanceof Promise) {
			prom = source;
			sources.splice(i, 1);
		}
		else {
			sources.splice(i, 1);
			return;
		}
		
		try {
			const value = await prom;
			clean(prom, source);
			await chan.send([value, source]);
		}
		catch (err) {
			// console.warn(err);
			// ignore
			// TODO: ignore ErrorCancelled only?
		}
	};
	const chan = new Channel();
	while (sources.length > 0) {
		for (let i = sources.length - 1; i >= 0; i--) {
			// noinspection ES6MissingAwait
			listen(i, sources[i]);
		}
		yield (await chan.recv());
	}
}
