export class ComparisonError extends Error {
    message;
    details;
    constructor(message, details) {
        super(message);
        this.message = message;
        this.details = details;
        this.name = "ComparisonError";
    }
    toJSON() {
        return {
            error: this.name,
            message: this.message,
            details: this.details,
        };
    }
}
