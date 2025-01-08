import { z } from "zod";

import { ZSecureSecretJSONDataSchema } from "./schemas";

export enum UserSecretType {
  Login = "login",
  CreditCard = "credit-card",
  SecureNote = "secure-note"
}

type DecryptedJSONData = z.infer<typeof ZSecureSecretJSONDataSchema>; // TODO: correct types for data, make sure we can only send certain formats for certain types
export type TCreateUserSecrets = {
  workspaceId: string;
  decryptedJSONData: DecryptedJSONData;
  type: UserSecretType;
  itemName?: string;
};

export type TDeleteUserSecretsBatchDTO = {
  secretIds: string[];
  workspaceId: string;
};

export type TUpdateUserSecretsDTO = {
  workspaceId: string;
  secretId: string;
  type: UserSecretType;
  itemName?: string;
  decryptedJSONData: DecryptedJSONData;
};

export type UserSecretRaw = {
  id: string;
  type: UserSecretType;
  decryptedJSONData: DecryptedJSONData;
  itemName: string;
};
