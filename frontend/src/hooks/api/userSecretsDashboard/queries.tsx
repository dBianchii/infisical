import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import axios from "axios";

import { createNotification } from "@app/components/notifications";
import { apiRequest } from "@app/config/request";

import { OrderByDirection } from "../generic/types";
import {
  DashboardProjectUserSecretsOverview,
  DashboardProjectUserSecretsOverviewResponse,
  DashboardUserSecretsOrderBy,
  TGetDashboardProjectUserSecretsOverviewDTO
} from "./types";

export const fetchProjectUserSecretsOverview = async ({
  ...params
}: TGetDashboardProjectUserSecretsOverviewDTO) => {
  const { data } = await apiRequest.get<DashboardProjectUserSecretsOverviewResponse>(
    "/api/v3/user-secrets-dashboard/user-secrets-overview",
    {
      params
    }
  );
  return data;
};

export const dashboardKeys = {
  all: () => ["dashboard"] as const,
  getDashboardSecrets: ({
    projectId
  }: Pick<TGetDashboardProjectUserSecretsOverviewDTO, "projectId">) =>
    [...dashboardKeys.all(), { projectId }] as const,
  getProjectUserSecretsOverview: ({
    projectId,
    ...params
  }: TGetDashboardProjectUserSecretsOverviewDTO) =>
    [...dashboardKeys.getDashboardSecrets({ projectId }), "secrets-overview", params] as const
};

export const useGetProjectUserSecretsOverview = (
  {
    projectId,
    offset = 0,
    limit = 100,
    orderBy = DashboardUserSecretsOrderBy.ItemName,
    orderDirection = OrderByDirection.ASC
  }: // search = ""
  TGetDashboardProjectUserSecretsOverviewDTO,
  options?: Omit<
    UseQueryOptions<
      DashboardProjectUserSecretsOverviewResponse,
      unknown,
      DashboardProjectUserSecretsOverview,
      ReturnType<typeof dashboardKeys.getProjectUserSecretsOverview>
    >,
    "queryKey" | "queryFn"
  >
) => {
  return useQuery({
    ...options,
    // wait for all values to be available
    enabled: Boolean(projectId) && (options?.enabled ?? true),
    queryKey: dashboardKeys.getProjectUserSecretsOverview({
      limit,
      orderBy,
      orderDirection,
      offset,
      projectId
    }),
    queryFn: () =>
      fetchProjectUserSecretsOverview({
        limit,
        orderBy,
        orderDirection,
        offset,
        projectId
      }),
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        // TODO: Get message and place in text
        const { reqId } = error.response?.data as {
          message: string;
          reqId: string;
        };
        console.log(error.response?.data);
        createNotification({
          title: "Error fetching user secret details",
          type: "error",
          text: "Something went wrong",
          copyActions: [
            {
              value: reqId,
              name: "Request ID",
              label: `Request ID: ${reqId}`
            }
          ]
        });
      }
    },
    keepPreviousData: true
  });
};
