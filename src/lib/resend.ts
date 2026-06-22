import { Resend } from "resend";

const key = process.env.RESEND_API_KEY;
if (!key) throw new Error("RESEND_API_KEY environment variable is required");

export const resend = new Resend(key);
