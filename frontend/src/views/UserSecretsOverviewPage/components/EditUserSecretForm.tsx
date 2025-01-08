import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { createNotification } from "@app/components/notifications";
import { Button, FormControl, Input } from "@app/components/v2";
import { useWorkspace } from "@app/context";
import { useUpdateUserSecret } from "@app/hooks/api/userSecrets/mutations";
import {
  ZCardSecretType,
  ZLoginSecretType,
  ZSecureNoteSecretType
} from "@app/hooks/api/userSecrets/schemas";
import { UserSecretRaw, UserSecretType } from "@app/hooks/api/userSecrets/types";
import { usePopUp } from "@app/hooks/usePopUp";

import { userSecretTypeToInnerFormContent } from "./UserSecretForm";

const itemNameSchema = {
  id: z.string(),
  itemName: z.string().min(1, "Item name cannot be empty").max(100, "Item name is too long")
};
const schema = z.union([
  ZCardSecretType.extend(itemNameSchema),
  ZLoginSecretType.extend(itemNameSchema),
  ZSecureNoteSecretType.extend(itemNameSchema)
]);
type TFormSchema = z.infer<typeof schema>;

type Props = {
  onClose: () => void;
  userSecret: UserSecretRaw;
};
export default function EditUserSecretForm({ onClose, userSecret }: Props) {
  const { handlePopUpClose } = usePopUp(["editUserSecret"] as const);
  const { mutateAsync: updateUserSecret } = useUpdateUserSecret();
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id || "";

  const userSecretTypeToDefaultValues = {
    [UserSecretType.Login]: {
      password: (userSecret.decryptedJSONData as z.infer<typeof ZLoginSecretType>).password,
      userName: (userSecret.decryptedJSONData as z.infer<typeof ZLoginSecretType>).userName
    },
    [UserSecretType.CreditCard]: {
      cardNumber: (userSecret.decryptedJSONData as z.infer<typeof ZCardSecretType>).cardNumber,
      expiryDate: (userSecret.decryptedJSONData as z.infer<typeof ZCardSecretType>).expiryDate,
      CVV: (userSecret.decryptedJSONData as z.infer<typeof ZCardSecretType>).CVV
    },
    [UserSecretType.SecureNote]: {
      content: (userSecret.decryptedJSONData as z.infer<typeof ZSecureNoteSecretType>).content
    }
  };

  const {
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<TFormSchema>({
    resolver: zodResolver(schema),
    defaultValues: {
      id: userSecret.id,
      itemName: userSecret.itemName,
      ...userSecretTypeToDefaultValues[userSecret.type]
    }
  });

  const handleFormSubmit = async ({ itemName, ...values }: TFormSchema) => {
    try {
      await updateUserSecret({
        secretId: userSecret.id,
        decryptedJSONData: values,
        itemName,
        type: userSecret.type,
        workspaceId
      });
      handlePopUpClose("editUserSecret");
      reset();

      createNotification({
        type: "success",
        text: "Successfully created secret"
      });
    } catch (error) {
      console.log(error);
      createNotification({
        type: "error",
        text: "Failed to create secret"
      });
    }
  };

  const InnerFormContent = userSecretTypeToInnerFormContent[userSecret.type];

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} noValidate>
      <Controller
        control={control}
        name="itemName"
        render={({ field }) => (
          <FormControl
            label="Item name"
            isError={Boolean(errors?.itemName)}
            errorText={errors?.itemName?.message}
          >
            <Input {...field} placeholder="Enter item name" />
          </FormControl>
        )}
      />
      <InnerFormContent control={control as any} errors={errors} />
      <div className="mt-7 flex items-center">
        <Button isDisabled={isSubmitting} isLoading={isSubmitting} className="mr-4" type="submit">
          Create Secret
        </Button>
        <Button onClick={onClose} variant="plain" colorSchema="secondary">
          Cancel
        </Button>
      </div>
    </form>
  );
}
