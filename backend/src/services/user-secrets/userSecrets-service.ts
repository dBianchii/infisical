import { ProjectType, UserSecretType } from "@app/db/schemas";
import { TPermissionServiceFactory } from "@app/ee/services/permission/permission-service";
import { BadRequestError } from "@app/lib/errors";
import { ZDecryptedJSONData } from "@app/server/routes/sanitizedSchemas";

import { TKmsServiceFactory } from "../kms/kms-service";
import { KmsDataKey } from "../kms/kms-types";
import { TProjectDALFactory } from "../project/project-dal";
import { TProjectBotServiceFactory } from "../project-bot/project-bot-service";
import { TSecretDALFactory } from "./userSecrets-dal";
import {
  TCreateUserSecretDTO,
  TCreateUserSecretRawDTO,
  TDeleteBulkUserSecretsDTO,
  TDeleteUserSecretsRawDTO,
  TGetUserSecretsRawDTO,
  TUpdateUserSecretDTO,
  TUpdateUserSecretRawDTO
} from "./userSecrets-types";

type TSecretServiceFactoryDep = {
  permissionService: Pick<TPermissionServiceFactory, "getProjectPermission">;
  userSecretsDAL: TSecretDALFactory;
  projectBotService: TProjectBotServiceFactory;
  projectDAL: TProjectDALFactory;
  kmsService: TKmsServiceFactory;
};

export type TUserSecretsServiceFactory = ReturnType<typeof userSecretsServiceFactory>;
export const userSecretsServiceFactory = ({
  permissionService,
  userSecretsDAL,
  projectDAL,
  projectBotService,
  kmsService
}: TSecretServiceFactoryDep) => {
  const $createUserSecret = async ({
    actor,
    actorId,
    actorOrgId,
    actorAuthMethod,
    projectId,
    ...inputSecret
  }: TCreateUserSecretDTO) => {
    const { ForbidOnInvalidProjectType } = await permissionService.getProjectPermission(
      actor,
      actorId,
      projectId,
      actorAuthMethod,
      actorOrgId
    );
    ForbidOnInvalidProjectType(ProjectType.UserSecrets);

    await projectDAL.checkProjectUpgradeStatus(projectId);

    const { jsonDataCiphertext, type, itemName } = inputSecret;
    const secret = await userSecretsDAL.create({
      encryptedJSONData: jsonDataCiphertext,
      projectId,
      type,
      userId: actorId,
      itemName
    });

    return secret;
  };

  const $deleteManyUserSecrets = async ({ secretIds, projectId, actorId }: TDeleteBulkUserSecretsDTO) => {
    await projectDAL.checkProjectUpgradeStatus(projectId);

    const secretsDeleted = await userSecretsDAL.delete({
      projectId,
      userId: actorId,
      $in: {
        id: secretIds
      }
    });

    return secretsDeleted;
  };

  const $updateSecret = async ({
    actor,
    actorId,
    actorOrgId,
    actorAuthMethod,
    projectId,
    secretId,
    ...inputSecret
  }: TUpdateUserSecretDTO) => {
    const { ForbidOnInvalidProjectType } = await permissionService.getProjectPermission(
      actor,
      actorId,
      projectId,
      actorAuthMethod,
      actorOrgId
    );
    ForbidOnInvalidProjectType(ProjectType.UserSecrets);

    await userSecretsDAL.update(
      {
        projectId,
        userId: actorId,
        id: secretId
      },
      {
        encryptedJSONData: inputSecret.jsonDataCiphertext,
        itemName: inputSecret.itemName
      }
    );
  };

  const createUserSecretRaw = async ({
    actor,
    actorId,
    projectId,
    actorAuthMethod,
    actorOrgId,
    type,
    itemName,
    decryptedJSONData
  }: TCreateUserSecretRawDTO) => {
    const { encryptor: secretManagerEncryptor } = await kmsService.createCipherPairWithDataKey({
      type: KmsDataKey.SecretManager, // TODO: Check if we need to have a custom 'Secret Manager' just for UserSecrets
      projectId
    });

    const secret = await $createUserSecret({
      actor,
      actorAuthMethod,
      actorId,
      actorOrgId,
      itemName,
      jsonDataCiphertext: secretManagerEncryptor({ plainText: Buffer.from(JSON.stringify(decryptedJSONData)) })
        .cipherTextBlob,
      projectId,
      type
    });
    return secret;
  };

  const getUserSecretsCount = async ({ projectId, actorId }: Pick<TGetUserSecretsRawDTO, "projectId" | "actorId">) => {
    const { shouldUseSecretV2Bridge } = await projectBotService.getBotKey(projectId);

    if (!shouldUseSecretV2Bridge)
      throw new BadRequestError({
        message: "Project version does not support pagination",
        name: "PaginationNotSupportedError"
      });

    const count = await userSecretsDAL.countSecrets({ userId: actorId, projectId });

    return count;
  };

  const getSecretsRaw = async ({
    projectId,
    actorId,
    orderBy,
    orderDirection,
    limit,
    offset
  }: TGetUserSecretsRawDTO) => {
    const secrets = await userSecretsDAL.findSecrets(
      { userId: actorId, projectId },
      {
        limit,
        offset,
        orderBy,
        orderDirection
      }
    );

    const { decryptor: secretManagerDecryptor } = await kmsService.createCipherPairWithDataKey({
      type: KmsDataKey.SecretManager,
      projectId
    });

    function decryptJSONData(secret: Awaited<ReturnType<typeof userSecretsDAL.findSecrets>>[number]) {
      const decryptedJSONDataAsString = secret.encryptedJSONData
        ? secretManagerDecryptor({ cipherTextBlob: secret.encryptedJSONData }).toString()
        : "";

      const object = JSON.parse(decryptedJSONDataAsString) as unknown;

      const decryptedJSONData = ZDecryptedJSONData.parse(object);

      return {
        id: secret.id,
        decryptedJSONData,
        itemName: secret.itemName,
        type: secret.type as UserSecretType,
        createdAt: secret.createdAt,
        updatedAt: secret.updatedAt
      };
    }

    const decryptedSecrets = secrets.map(decryptJSONData);

    return {
      secrets: decryptedSecrets
    };
  };

  const deleteManyUserSecretsRaw = async ({
    secretIds,
    projectId,
    actor,
    actorAuthMethod,
    actorId,
    actorOrgId
  }: TDeleteUserSecretsRawDTO) => {
    await $deleteManyUserSecrets({
      secretIds,
      projectId,
      actor,
      actorAuthMethod,
      actorId,
      actorOrgId
    });
  };

  const updateUserSecretRaw = async ({
    actorId,
    projectId,
    actor,
    actorOrgId,
    actorAuthMethod,
    decryptedJSONData,
    itemName,
    secretId
  }: TUpdateUserSecretRawDTO) => {
    const { encryptor: secretManagerEncryptor } = await kmsService.createCipherPairWithDataKey({
      type: KmsDataKey.SecretManager, // TODO: Check if we need to have a custom 'Secret Manager' just for UserSecrets
      projectId
    });

    await $updateSecret({
      itemName,
      projectId,
      actor,
      actorId,
      actorOrgId,
      actorAuthMethod,
      secretId,
      jsonDataCiphertext: secretManagerEncryptor({ plainText: Buffer.from(JSON.stringify(decryptedJSONData)) })
        .cipherTextBlob
    });
  };

  return {
    createUserSecretRaw,
    getUserSecretsCount,
    getSecretsRaw,
    deleteManyUserSecretsRaw,
    updateUserSecretRaw
  };
};
