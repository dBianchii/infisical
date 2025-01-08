import { useState } from "react";
import { Control, Controller, FieldErrors, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { createNotification } from "@app/components/notifications";
import { Button, DatePicker, FormControl, Input, SecretInput, TextArea } from "@app/components/v2";
import { InfisicalSecretInput } from "@app/components/v2/InfisicalSecretInput";
import { useWorkspace } from "@app/context";
import { useCreateUserSecret } from "@app/hooks/api/userSecrets/mutations";
import { UserSecretType } from "@app/hooks/api/userSecrets/types";
import { usePopUp } from "@app/hooks/usePopUp";

const ZLoginSecretType = z.object({
  itemName: z.string(),
  userName: z.string(),
  password: z.string()
});
const ZCardSecretType = z.object({
  itemName: z.string(),
  cardNumber: z.string(),
  expiryDate: z.date(),
  CVV: z.string()
});
const ZSecureNoteSecretType = z.object({
  itemName: z.string(),
  content: z.string()
});

type FormProps<T extends z.ZodType<any, any, any>> = {
  control: Control<z.infer<T>, any>;
  errors: FieldErrors<z.infer<T>>;
};

function LoginFormContent({ control, errors }: FormProps<typeof ZLoginSecretType>) {
  return (
    <>
      <Controller
        control={control}
        name="itemName"
        render={({ field }) => (
          <FormControl
            label="Item name"
            isError={Boolean(errors?.itemName)}
            errorText={errors?.itemName?.message}
          >
            <Input {...field} placeholder="" />
          </FormControl>
        )}
      />
      <Controller
        control={control}
        name="userName"
        render={({ field }) => (
          <FormControl
            label="Username"
            isRequired
            isError={Boolean(errors?.userName)}
            errorText={errors?.userName?.message}
          >
            <Input {...field} placeholder="Type your username" />
          </FormControl>
        )}
      />
      <Controller
        control={control}
        name="password"
        render={({ field }) => (
          <FormControl
            label="Password"
            isError={Boolean(errors?.password)}
            errorText={errors?.password?.message}
          >
            <InfisicalSecretInput
              {...field}
              containerClassName="text-bunker-300 hover:border-primary-400/50 border border-mineshaft-600 bg-mineshaft-900 px-2 py-1.5"
            />
          </FormControl>
        )}
      />
    </>
  );
}

function CreditCardFormContent({ control, errors }: FormProps<typeof ZCardSecretType>) {
  const [open, setOpen] = useState(true);

  return (
    <>
      <Controller
        control={control}
        name="itemName"
        render={({ field }) => (
          <FormControl
            label="Item name"
            isError={Boolean(errors?.itemName)}
            errorText={errors?.itemName?.message}
          >
            <Input {...field} placeholder="" />
          </FormControl>
        )}
      />
      <Controller
        control={control}
        name="cardNumber"
        render={({ field }) => (
          <FormControl
            label="Card number"
            isRequired
            isError={Boolean(errors?.cardNumber)}
            errorText={errors?.cardNumber?.message}
          >
            {/* TODO: make it a Card input  */}
            <SecretInput
              {...field}
              containerClassName="text-bunker-300 hover:border-primary-400/50 border border-mineshaft-600 bg-mineshaft-900 px-2 py-1.5"
            />
          </FormControl>
        )}
      />
      <Controller
        control={control}
        name="expiryDate"
        render={({ field }) => (
          <FormControl
            label="Expiry Date"
            isError={Boolean(errors?.expiryDate)}
            errorText={errors?.expiryDate?.message}
          >
            <DatePicker
              showTimePicker={false}
              value={field.value}
              onChange={field.onChange}
              dateFormat="P"
              popUpProps={{
                open,
                onOpenChange: setOpen
              }}
              popUpContentProps={{}}
            />
          </FormControl>
        )}
      />
      <Controller
        control={control}
        name="CVV"
        render={({ field }) => (
          <FormControl
            label="Card number"
            isRequired
            isError={Boolean(errors?.CVV)}
            errorText={errors?.CVV?.message}
          >
            {/* TODO: make it a Proper cvv input  */}
            <SecretInput
              {...field}
              itemType="number"
              containerClassName="text-bunker-300 hover:border-primary-400/50 border border-mineshaft-600 bg-mineshaft-900 px-2 py-1.5"
            />
          </FormControl>
        )}
      />
    </>
  );
}

function SecureNoteFormContent({ control, errors }: FormProps<typeof ZSecureNoteSecretType>) {
  return (
    <>
      <Controller
        control={control}
        name="itemName"
        render={({ field }) => (
          <FormControl
            label="Item name"
            isError={Boolean(errors?.itemName)}
            errorText={errors?.itemName?.message}
          >
            <Input {...field} placeholder="" />
          </FormControl>
        )}
      />
      <Controller
        control={control}
        name="content"
        render={({ field }) => (
          <FormControl
            label="Content"
            isError={Boolean(errors?.content)}
            errorText={errors?.content?.message}
          >
            <TextArea rows={3} {...field} />
          </FormControl>
        )}
      />
    </>
  );
}

const typeSchema = z.union([ZLoginSecretType, ZCardSecretType, ZSecureNoteSecretType]);

type TFormSchema = z.infer<typeof typeSchema>;

type Props = {
  onClose: () => void;
  type: UserSecretType;
};

export default function EditUserSecretForm({ onClose, type }: Props) {
  const { handlePopUpClose } = usePopUp(["addUserSecret"] as const);
  const { mutateAsync: createUserSecret } = useCreateUserSecret();
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id || "";

  const {
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<TFormSchema>({ resolver: zodResolver(typeSchema) });

  const handleFormSubmit = async ({ itemName, ...values }: TFormSchema) => {
    try {
      await createUserSecret({
        decryptedJSONData: values,
        itemName,
        type,
        workspaceId
      });
      handlePopUpClose("addUserSecret");
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

  const userSecretTypeToFormComponentMap = {
    [UserSecretType.Login]: LoginFormContent,
    [UserSecretType.CreditCard]: CreditCardFormContent,
    [UserSecretType.SecureNote]: SecureNoteFormContent
  };
  const FormContent = userSecretTypeToFormComponentMap[type];

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} noValidate>
      <FormContent control={control as any} errors={errors} />
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
