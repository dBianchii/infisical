export enum UserSecretType {
  Login = "login",
  CreditCard = "credit-card",
  SecureNote = "secure-note"
}

export type TCreateUserSecrets = {
  secretKey: string;
  secretValue: string;
  secretComment: string;
  skipMultilineEncoding?: boolean;
  secretPath: string;
  workspaceId: string;
  environment: string;
  type: UserSecretType;
  tagIds?: string[];
};
