import Teleport from './Teleport.js';
import Channel from './Channel.js';

/**
 *
 * @param {Channel | Teleport | PromiseWithCancel} sources
 * @return {Generator<*, void, *>}
 */
export default async function* select(...sources) {
	const proms = [];
	const cleanProms = (fired) => {
		for (const prom of proms) {
			if (prom !== fired) {
				prom.cancel();
			}
		}
	};
	const chan = new Channel();
	while (sources.length > 0) {
		for (let i = sources.length - 1; i >= 0; i--) {
			const source = sources[i];
			if ((source instanceof Channel || source instanceof Teleport) && !source.isClosed) {
				// noinspection ES6MissingAwait
				(async () => {
					const prom = source.recv();
					proms.push(prom);
					try {
						const value = await prom;
						cleanProms(prom);
						await chan.send([value, source]);
					}
					catch (err) {
						// console.warn(err);
						// ignore
						// TODO: ignore ErrorCancelled only
					}
				})();
			}
			else {
				sources.splice(i, 1);
			}
		}
		yield (await chan.recv());
	}
}
