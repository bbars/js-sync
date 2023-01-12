export class ErrorClosed extends Error {
	constructor(message = `Channel is closed`) {
		super(message);
	}
}

export class ErrorClosedSend extends ErrorClosed {
	constructor(message = `Can't send to closed channel`) {
		super(message);
	}
}

export class ErrorClosedRecv extends ErrorClosed {
	constructor(message = `Can't recv from closed channel`) {
		super(message);
	}
}
