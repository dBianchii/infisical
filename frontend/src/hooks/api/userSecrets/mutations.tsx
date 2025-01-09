import { MutationOptions, useMutation, useQueryClient } from "@tanstack/react-query";

import { apiRequest } from "@app/config/request";

import { dashboardKeys } from "../userSecretsDashboard/queries";
import { TCreateUserSecrets, TDeleteUserSecretsBatchDTO, TUpdateUserSecretsDTO } from "./types";

export const useCreateUserSecret = ({
  options
}: {
  options?: Omit<MutationOptions<{}, {}, TCreateUserSecrets>, "mutationFn">;
} = {}) => {
  const queryClient = useQueryClient();
  return useMutation<{}, {}, TCreateUserSecrets>({
    mutationFn: async ({ type, workspaceId, decryptedJSONData, itemName }) => {
      const { data: response } = await apiRequest.post("/api/v3/user-secrets/raw", {
        type,
        decryptedJSONData,
        workspaceId,
        itemName
      });
      return response;
    },
    onSuccess: (_, { workspaceId }) => {
      queryClient.invalidateQueries(dashboardKeys.getDashboardSecrets({ projectId: workspaceId }));
    },
    ...options
  });
};

export const useDeleteUserSecretsBatch = ({
  options
}: {
  options?: Omit<MutationOptions<{}, {}, TDeleteUserSecretsBatchDTO>, "mutationFn">;
} = {}) => {
  const queryClient = useQueryClient();

  return useMutation<{}, {}, TDeleteUserSecretsBatchDTO>({
    mutationFn: async ({ secretIds, workspaceId }) => {
      const { data } = await apiRequest.delete("/api/v3/user-secrets/batch/raw", {
        data: {
          workspaceId,
          secretIds
        }
      });
      return data;
    },
    onSuccess: (_, { workspaceId }) => {
      queryClient.invalidateQueries(dashboardKeys.getDashboardSecrets({ projectId: workspaceId }));
    },
    ...options
  });
};

export const useUpdateUserSecret = ({
  options
}: {
  options?: Omit<MutationOptions<{}, {}, TUpdateUserSecretsDTO>, "mutationFn">;
} = {}) => {
  const queryClient = useQueryClient();
  return useMutation<{}, {}, TUpdateUserSecretsDTO>({
    mutationFn: async ({ type, workspaceId, decryptedJSONData, secretId, itemName }) => {
      const { data } = await apiRequest.patch(`/api/v3/user-secrets/raw/${secretId}`, {
        workspaceId,
        type,
        decryptedJSONData,
        itemName
      });
      return data;
    },
    onSuccess: (_, { workspaceId }) => {
      queryClient.invalidateQueries(dashboardKeys.getDashboardSecrets({ projectId: workspaceId }));
    },
    ...options
  });
};
