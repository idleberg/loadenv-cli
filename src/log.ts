import { bgBlue, bgCyan, bgGreen, bgRed, bgYellow } from 'kleur/colors';

export const logger = {
	debug: (message: unknown) => console.debug(bgCyan(' DEBUG '), message),
	error: (message: unknown) => console.error(bgRed(' ERROR '), message),
	info: (message: unknown) => console.info(bgBlue(' INFO '), message),
	log: (message: unknown) => console.log(message),
	success: (message: unknown) => console.log(bgGreen(' SUCCESS '), message),
	warn: (message: unknown) => console.warn(bgYellow(' WARN '), message),
};
