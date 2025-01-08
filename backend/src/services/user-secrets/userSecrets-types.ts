import { UserSecretType } from "@app/db/schemas";
import { OrderByDirection, TProjectPermission } from "@app/lib/types";

type LoginType = {
  userName: string;
  password: string;
};
type CreditCardType = {
  cardNumber: string;
  expiryDate: string;
  CVV: string;
};
type SecureNoteType = {
  content: string;
};

type UserSecretData = LoginType | CreditCardType | SecureNoteType;

export type TCreateUserSecretRawDTO = TProjectPermission & {
  type: UserSecretType;
  decryptedJSONData: UserSecretData;
  itemName: string | undefined;
};

export type TCreateUserSecretDTO = TProjectPermission & {
  type: UserSecretType;
  jsonDataCiphertext: Buffer;
  itemName: string | undefined;
};

export type TDeleteUserSecretsRawDTO = TProjectPermission & {
  secretIds: string[];
};

export type TDeleteBulkUserSecretsDTO = {
  secretIds: string[];
} & TProjectPermission;

export enum UserSecretsOrderBy {
  ItemName = "itemName" // "key" for secrets but using name for use across resources
}
export type TGetUserSecretsRawDTO = {
  orderBy?: UserSecretsOrderBy;
  orderDirection?: OrderByDirection;
  offset?: number;
  limit?: number;
} & TProjectPermission;
