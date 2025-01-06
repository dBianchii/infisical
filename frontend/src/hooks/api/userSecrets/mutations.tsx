import { MutationOptions, useMutation } from "@tanstack/react-query";

import { apiRequest } from "@app/config/request";

import { TCreateUserSecrets } from "./types";

export const useCreateUserSecret = ({
  options
}: {
  options?: Omit<MutationOptions<{}, {}, TCreateUserSecrets>, "mutationFn">;
} = {}) => {
  // const queryClient = useQueryClient();
  return useMutation<{}, {}, TCreateUserSecrets>({
    mutationFn: async ({
      secretPath = "/",
      type,
      environment,
      workspaceId,
      secretKey,
      secretValue,
      secretComment,
      skipMultilineEncoding,
      tagIds
    }) => {
      const { data } = await apiRequest.post(`/api/v3/user-secrets/raw/${secretKey}`, {
        secretPath,
        type,
        environment,
        workspaceId,
        secretValue,
        secretComment,
        skipMultilineEncoding,
        tagIds
      });
      return data;
    },
    // onSuccess: (_, { workspaceId, environment, secretPath }) => {
    //   queryClient.invalidateQueries(
    //     dashboardKeys.getDashboardSecrets({ projectId: workspaceId, secretPath })
    //   );
    //   queryClient.invalidateQueries(
    //     secretKeys.getProjectSecret({ workspaceId, environment, secretPath })
    //   );
    //   queryClient.invalidateQueries(
    //     secretSnapshotKeys.list({ environment, workspaceId, directory: secretPath })
    //   );
    //   queryClient.invalidateQueries(
    //     secretSnapshotKeys.count({ environment, workspaceId, directory: secretPath })
    //   );
    //   queryClient.invalidateQueries(secretApprovalRequestKeys.count({ workspaceId }));
    // },
    ...options
  });
};
