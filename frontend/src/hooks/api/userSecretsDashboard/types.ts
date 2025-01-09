import { OrderByDirection } from "../generic/types";
import { UserSecretRaw } from "../userSecrets/types";

export enum DashboardUserSecretsOrderBy {
  ItemName = "itemName"
}

export type TGetDashboardProjectUserSecretsOverviewDTO = {
  projectId: string;
  offset?: number;
  limit?: number;
  orderBy?: DashboardUserSecretsOrderBy;
  orderDirection?: OrderByDirection;
  // search?: string;
};

export type DashboardProjectUserSecretsOverviewResponse = {
  secrets?: UserSecretRaw[];
  totalSecretCount: number;
};

export type DashboardProjectUserSecretsOverview = Omit<
  DashboardProjectUserSecretsOverviewResponse,
  "secrets"
> & {
  secrets?: UserSecretRaw[];
};
