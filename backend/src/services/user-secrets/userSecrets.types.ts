import { UserSecretType } from "@app/db/schemas";
import { TProjectPermission } from "@app/lib/types";

type LoginType = {
  userName: string;
  password: string;
};
type CreditCard = {
  cardNumer: string;
  expiryDate: string;
  CVV: string;
};
type SecureNote = {
  title: string;
  content: string;
};

type UserSecretData = LoginType | CreditCard | SecureNote;

export type TCreateUserSecretDTO = TProjectPermission & {
  type: UserSecretType;
  data: UserSecretData;
};
