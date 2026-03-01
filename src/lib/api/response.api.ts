export class ApiResponse {
    readonly statusCode: number;
    readonly data: any;
    readonly message: string;
    readonly success: boolean;
    readonly isError: boolean;

    constructor(
        statusCode: number,
        data: any,
        message: string = "Success",
        success: boolean = statusCode < 400,
        isError: boolean = statusCode >= 400
    ) {
        this.statusCode = statusCode;
        this.data = data;
        this.message = message;
        this.success = success;
        this.isError = isError;
    }
}
