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

export class ErrorConcurrentRecv extends Error {
	constructor(message = `Can't recv from a concurrently used teleport`) {
		super(message);
	}
}

export class ErrorCancelled extends Error {
	constructor(message = `Operation was cancelled`) {
		super(message);
	}
}

export class ErrorClosedCancel extends ErrorClosed {
	constructor(message = `Operation was cancelled`) {
		super(message);
	}
}
