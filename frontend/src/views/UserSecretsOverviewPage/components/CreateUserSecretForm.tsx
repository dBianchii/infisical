import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { createNotification } from "@app/components/notifications";
import { Button, FormControl, Input } from "@app/components/v2";
import { useWorkspace } from "@app/context";
import { useCreateUserSecret } from "@app/hooks/api/userSecrets/mutations";
import {
  ZCardSecretType,
  ZLoginSecretType,
  ZSecureNoteSecretType
} from "@app/hooks/api/userSecrets/schemas";
import { UserSecretType } from "@app/hooks/api/userSecrets/types";

import { userSecretTypeToInnerFormContent } from "./UserSecretForm";

const itemNameSchema = {
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
  type: UserSecretType;
};
export default function CreateUserSecretForm({ onClose, type }: Props) {
  const { mutateAsync: createUserSecret } = useCreateUserSecret();
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id || "";

  const {
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<TFormSchema>({ resolver: zodResolver(schema) });

  const handleFormSubmit = async ({ itemName, ...values }: TFormSchema) => {
    try {
      await createUserSecret({
        decryptedJSONData: values,
        itemName,
        type,
        workspaceId
      });
      onClose();
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

  const InnerFormContent = userSecretTypeToInnerFormContent[type];

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} noValidate>
      <Controller
        control={control}
        name="itemName"
        render={({ field }) => (
          <FormControl
            label="Item name"
            isRequired
            isError={Boolean(errors?.itemName)}
            errorText={errors?.itemName?.message}
          >
            <Input {...field} placeholder="Enter item name" />
          </FormControl>
        )}
      />
      <InnerFormContent control={control as any} errors={errors} />
      <div className="mt-7 flex items-center">
        <Button
          isDisabled={isSubmitting}
          isLoading={isSubmitting}
          key="layout-create-project-submit"
          className="mr-4"
          type="submit"
        >
          Create Secret
        </Button>
        <Button
          key="layout-cancel-create-project"
          onClick={onClose}
          variant="plain"
          colorSchema="secondary"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
