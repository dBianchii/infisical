import { useState } from "react";
import { Control, Controller, FieldErrors } from "react-hook-form";
import { z } from "zod";

import { DatePicker, FormControl, Input, SecretInput, TextArea } from "@app/components/v2";
import { InfisicalSecretInput } from "@app/components/v2/InfisicalSecretInput";
import {
  ZCardSecretType,
  ZLoginSecretType,
  ZSecureNoteSecretType
} from "@app/hooks/api/userSecrets/schemas";
import { UserSecretType } from "@app/hooks/api/userSecrets/types";

type FormProps<T extends z.ZodType<any, any, any>> = {
  control: Control<z.infer<T>, any>;
  errors: FieldErrors<z.infer<T>>;
};

function LoginFormContent({ control, errors }: FormProps<typeof ZLoginSecretType>) {
  return (
    <>
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
        name="cardNumber"
        render={({ field }) => (
          <FormControl
            label="Card number"
            isRequired
            isError={Boolean(errors?.cardNumber)}
            errorText={errors?.cardNumber?.message}
          >
            {/* TODO: make it a proper Card input  */}
            <SecretInput
              maxLength={19}
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
            isRequired
          >
            <DatePicker
              showTimePicker={false}
              value={field.value?.isWellFormed() ? new Date(field.value) : undefined}
              onChange={(date) => field.onChange(date?.toISOString())}
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
            label="CVV"
            isRequired
            isError={Boolean(errors?.CVV)}
            errorText={errors?.CVV?.message}
          >
            {/* TODO: make it a proper CVV input  */}
            <SecretInput
              {...field}
              maxLength={4}
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
  );
}

export const userSecretTypeToInnerFormContent = {
  [UserSecretType.Login]: LoginFormContent,
  [UserSecretType.CreditCard]: CreditCardFormContent,
  [UserSecretType.SecureNote]: SecureNoteFormContent
};
