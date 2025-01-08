import { z } from "zod";

import { USER_SECRETS_DASHBOARD } from "@app/lib/api-docs";
import { BadRequestError } from "@app/lib/errors";
import { OrderByDirection } from "@app/lib/types";
import { secretsLimit } from "@app/server/config/rateLimiter";
import { verifyAuth } from "@app/server/plugins/auth/verify-auth";
import { userSecretRawSchema } from "@app/server/routes/sanitizedSchemas";
import { AuthMode } from "@app/services/auth/auth-type";
import { UserSecretsOrderBy } from "@app/services/user-secrets/userSecrets-types";

export const registerUserSecretsDashboardRouter = async (server: FastifyZodProvider) => {
  server.route({
    method: "GET",
    url: "/user-secrets-overview",
    config: {
      rateLimit: secretsLimit
    },
    schema: {
      description: "List project's user secrets overview",
      security: [
        {
          bearerAuth: []
        }
      ],
      querystring: z.object({
        projectId: z.string().trim().describe(USER_SECRETS_DASHBOARD.SECRET_OVERVIEW_LIST.projectId),
        offset: z.coerce
          .number()
          .min(0)
          .optional()
          .default(0)
          .describe(USER_SECRETS_DASHBOARD.SECRET_OVERVIEW_LIST.offset),
        limit: z.coerce
          .number()
          .min(1)
          .max(100)
          .optional()
          .default(100)
          .describe(USER_SECRETS_DASHBOARD.SECRET_OVERVIEW_LIST.limit),
        orderBy: z
          .nativeEnum(UserSecretsOrderBy)
          .default(UserSecretsOrderBy.ItemName)
          .describe(USER_SECRETS_DASHBOARD.SECRET_OVERVIEW_LIST.orderBy)
          .optional(),
        orderDirection: z
          .nativeEnum(OrderByDirection)
          .default(OrderByDirection.ASC)
          .describe(USER_SECRETS_DASHBOARD.SECRET_OVERVIEW_LIST.orderDirection)
          .optional()
      }),
      response: {
        200: z.object({
          secrets: userSecretRawSchema.array().optional(),
          totalSecretCount: z.number().optional()
        })
      }
    },
    onRequest: verifyAuth([AuthMode.JWT]),
    handler: async (req) => {
      const { projectId, limit, offset, orderBy, orderDirection } = req.query;

      if (!projectId) throw new BadRequestError({ message: "Missing workspace id" });

      const { shouldUseSecretV2Bridge } = await server.services.projectBot.getBotKey(projectId);
      // prevent older projects from accessing endpoint
      if (!shouldUseSecretV2Bridge) throw new BadRequestError({ message: "Project version not supported" });

      // const { permission } = await server.services.permission.getProjectPermission(
      //   req.permission.type,
      //   req.permission.id,
      //   projectId,
      //   req.permission.authMethod,
      //   req.permission.orgId
      // );

      const totalSecretCount = await server.services.userSecrets.getUserSecretsCount({
        actorId: req.permission.id,
        projectId
      });

      let response: Awaited<ReturnType<typeof server.services.userSecrets.getSecretsRaw>> = {
        secrets: []
      };

      if (limit > 0 && totalSecretCount > offset) {
        response = await server.services.userSecrets.getSecretsRaw({
          actorId: req.permission.id,
          actor: req.permission.type,
          actorOrgId: req.permission.orgId,
          actorAuthMethod: req.permission.authMethod,
          projectId,
          orderBy,
          orderDirection,
          limit,
          offset
        });
      }
      return {
        totalSecretCount,
        secrets: response.secrets
      };
    }
  });
};
