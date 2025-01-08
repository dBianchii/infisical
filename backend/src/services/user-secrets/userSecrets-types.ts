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

type UserSecretJSONData = LoginType | CreditCardType | SecureNoteType;

export type TCreateUserSecretRawDTO = TProjectPermission & {
  type: UserSecretType;
  decryptedJSONData: UserSecretJSONData;
  itemName: string;
};

export type TCreateUserSecretDTO = TProjectPermission & {
  type: UserSecretType;
  jsonDataCiphertext: Buffer;
  itemName: string;
};

export type TDeleteUserSecretsRawDTO = TProjectPermission & {
  secretIds: string[];
};

export type TUpdateUserSecretRawDTO = TProjectPermission & {
  secretId: string;
  itemName: string;
  decryptedJSONData: UserSecretJSONData;
};

export type TUpdateUserSecretDTO = {
  secretId: string;
  itemName: string;
  jsonDataCiphertext: Buffer;
} & TProjectPermission;

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
