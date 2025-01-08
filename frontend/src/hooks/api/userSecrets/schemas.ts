import { z } from "zod";

function luhnCheck(cardNumber: string): boolean {
  let sum = 0;
  let shouldDouble = false;
  for (let i = cardNumber.length - 1; i >= 0; i -= 1) {
    let digit = parseInt(cardNumber.charAt(i), 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

export const ZLoginSecretType = z.object({
  userName: z.string(),
  password: z.string()
});

export const ZCardSecretType = z.object({
  cardNumber: z
    .string()
    .regex(/^\d{13,19}$/, "Card number must be between 13 to 19 digits")
    .refine(luhnCheck, "Card number is invalid"),
  expiryDate: z.date().refine((date) => date > new Date(), "Expiry date must be in the future"),
  CVV: z.string().regex(/^\d{3,4}$/, "CVV must be 3 or 4 digits")
});

export const ZSecureNoteSecretType = z.object({
  content: z.string()
});

export const ZSecureSecretJSONDataSchema = z.union([
  ZLoginSecretType,
  ZCardSecretType,
  ZSecureNoteSecretType
]);
