import { UserSecretType } from "@app/db/schemas";
import { TProjectPermission } from "@app/lib/types";

type LoginType = {
  userName: string;
  password: string;
};
type CreditCardType = {
  cardNumer: string;
  expiryDate: string;
  CVV: string;
};
type SecureNoteType = {
  title: string;
  content: string;
};

type UserSecretData = LoginType | CreditCardType | SecureNoteType;

export type TCreateUserSecretRawDTO = TProjectPermission & {
  type: UserSecretType;
  jsonData: UserSecretData;
};

export type TCreateUserSecretDTO = TProjectPermission & {
  type: UserSecretType;
  jsonDataCiphertext: string;
};
