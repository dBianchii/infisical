import { z } from "zod";

import { UserSecretType } from "@app/db/schemas";
import { EventType } from "@app/ee/services/audit-log/audit-log-types";
import { RAW_USER_SECRETS } from "@app/lib/api-docs";
import { BadRequestError } from "@app/lib/errors";
import { secretsLimit } from "@app/server/config/rateLimiter";
import { getTelemetryDistinctId } from "@app/server/lib/telemetry";
import { getUserAgentType } from "@app/server/plugins/audit-log";
import { verifyAuth } from "@app/server/plugins/auth/verify-auth";
import { AuthMode } from "@app/services/auth/auth-type";
import { PostHogEventTypes } from "@app/services/telemetry/telemetry-types";

import { ZDecryptedJSONData } from "../sanitizedSchemas";

const SecretReferenceNode = z.object({
  key: z.string(),
  value: z.string().optional(),
  environment: z.string(),
  secretPath: z.string()
});
type TSecretReferenceNode = z.infer<typeof SecretReferenceNode> & { children: TSecretReferenceNode[] };

const SecretReferenceNodeTree: z.ZodType<TSecretReferenceNode> = SecretReferenceNode.extend({
  children: z.lazy(() => SecretReferenceNodeTree.array())
});

export const registerUserSecretsRouter = async (server: FastifyZodProvider) => {
  server.route({
    method: "POST",
    url: "/raw",
    config: {
      // TODO: Maybe use a dedicated rate limiter just for user secrets?
      rateLimit: secretsLimit
    },
    schema: {
      description: "Create a user secret",
      security: [
        {
          bearerAuth: []
        }
      ],
      body: z.object({
        workspaceId: z.string().trim().describe(RAW_USER_SECRETS.CREATE.workspaceId),
        type: z.nativeEnum(UserSecretType).default(UserSecretType.Login).describe(RAW_USER_SECRETS.CREATE.type),
        decryptedJSONData: ZDecryptedJSONData,
        itemName: z.string()
      }),
      response: {
        200: z.object({
          secret: z.object({
            id: z.string()
          })
        })
      }
    },
    onRequest: verifyAuth([AuthMode.JWT, AuthMode.API_KEY, AuthMode.SERVICE_TOKEN, AuthMode.IDENTITY_ACCESS_TOKEN]),
    handler: async (req) => {
      const secret = await server.services.userSecrets.createUserSecretRaw({
        actorId: req.permission.id,
        actor: req.permission.type,
        actorOrgId: req.permission.orgId,
        actorAuthMethod: req.permission.authMethod,
        itemName: req.body.itemName,
        projectId: req.body.workspaceId,
        type: req.body.type,
        decryptedJSONData: req.body.decryptedJSONData
      });
      await server.services.auditLog.createAuditLog({
        projectId: req.body.workspaceId,
        ...req.auditLogInfo,
        event: {
          type: EventType.CREATE_USER_SECRET,
          metadata: {
            secretId: secret.id // TODO: Check what else to send to audit log
          }
        }
      });
      await server.services.telemetry.sendPostHogEvents({
        event: PostHogEventTypes.UserSecretCreated,
        distinctId: getTelemetryDistinctId(req),
        properties: {
          numberOfSecrets: 1, // TODO: Check what else to send to posthog
          workspaceId: req.body.workspaceId,
          channel: getUserAgentType(req.headers["user-agent"]),
          ...req.auditLogInfo
        }
      });
      return {
        secret: {
          id: secret.id
        }
      };
    }
  });

  server.route({
    method: "DELETE",
    url: "/batch/raw",
    config: {
      // TODO: Maybe use a dedicated rate limiter just for user secrets?
      rateLimit: secretsLimit
    },
    schema: {
      description: "Delete many secrets",
      security: [
        {
          bearerAuth: []
        }
      ],
      body: z.object({
        workspaceId: z.string().trim().optional().describe(RAW_USER_SECRETS.CREATE.workspaceId),
        secretIds: z.string().array().min(1)
      }),
      response: {
        200: z.void()
      }
    },
    onRequest: verifyAuth([AuthMode.JWT, AuthMode.API_KEY, AuthMode.SERVICE_TOKEN, AuthMode.IDENTITY_ACCESS_TOKEN]),
    handler: async (req) => {
      const { secretIds, workspaceId } = req.body;
      if (!workspaceId) throw new BadRequestError({ message: "Missing workspace id" });

      await server.services.userSecrets.deleteManyUserSecretsRaw({
        projectId: workspaceId,
        secretIds,
        actorId: req.permission.id,
        actor: req.permission.type,
        actorOrgId: req.permission.orgId,
        actorAuthMethod: req.permission.authMethod
      });

      // TODO: Audit logs and posthog.
      // if (secretOperation.type === SecretProtectionType.Approval) {
      //   return { approval: secretOperation.approval };
      // }
      // const { secrets } = secretOperation;

      // await server.services.auditLog.createAuditLog({
      //   projectId: workspaceId,
      //   ...req.auditLogInfo,
      //   event: {
      //     type: EventType.DELETE_SECRETS,
      //     metadata: {}
      //   }
      // });

      // await server.services.telemetry.sendPostHogEvents({
      //   event: PostHogEventTypes.SecretDeleted,
      //   distinctId: getTelemetryDistinctId(req),
      //   properties: {
      //     numberOfSecrets: secrets.length,
      //     workspaceId: secrets[0].workspace,
      //     environment: req.body.environment,
      //     secretPath: req.body.secretPath,
      //     channel: getUserAgentType(req.headers["user-agent"]),
      //     ...req.auditLogInfo
      //   }
      // });
    }
  });
};
