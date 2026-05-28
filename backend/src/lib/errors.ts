// Shared type error for anything thrown by services. The global error
// handler *should* recognize the type and surface its code & status
export class ServiceError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number = 502 // defaults to 502 bc most failures originate upstream at Plaid
  ) {
    super(message);
    this.name = "ServiceError";
  }
}