import { Control, Controller, FieldErrors } from "react-hook-form";
import { usePaymentInputs } from "react-payment-inputs";
import { CardImages, images } from "react-payment-inputs/images";
import { faCreditCard } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { z } from "zod";

import { FormControl, Input, TextArea } from "@app/components/v2";
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
            isRequired
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
  const { meta, getCardNumberProps, getExpiryDateProps, getCVCProps, getCardImageProps } =
    usePaymentInputs();

  return (
    <>
      <Controller
        control={control}
        name="cardNumber"
        render={({ field }) => (
          <>
            <div className="relative ">
              <Input
                className={`pe-9 peer  rounded-b-none pl-9 shadow-none [direction:inherit] ${
                  errors?.cardNumber ? "border-red-500" : ""
                }`}
                maxLength={19}
                {...getCardNumberProps({
                  onChange: field.onChange
                })}
                {...field}
                placeholder="Card Number"
                id="card-number"
              />
              <div className="end-0 pe-3 text-muted-foreground/80 pointer-events-none absolute inset-y-0 flex items-center justify-center peer-disabled:opacity-50">
                {meta.cardType ? (
                  <svg
                    className="ml-2 mr-2 overflow-hidden rounded-sm"
                    {...getCardImageProps({ images: images as unknown as CardImages })}
                    width={20}
                  />
                ) : (
                  <FontAwesomeIcon icon={faCreditCard} className="ml-2 mr-2" />
                )}
              </div>
            </div>
            {errors?.cardNumber && (
              <span className="text-sm text-red-500">{errors.cardNumber.message}</span>
            )}
          </>
        )}
      />

      <div className="-mt-px flex">
        <Controller
          control={control}
          name="expiryDate"
          render={({ field }) => (
            <div className="min-w-0 flex-1 focus-within:z-10">
              <Input
                className={`rounded-e-none rounded-t-none rounded-br-none shadow-none [direction:inherit] ${
                  errors?.expiryDate ? "border-red-500" : ""
                }`}
                {...getExpiryDateProps({
                  onChange: field.onChange
                })}
                value={field.value}
                placeholder="MM/YY"
                id="expiry-date"
              />
              {errors?.expiryDate && (
                <span className="text-sm text-red-500">{errors.expiryDate.message}</span>
              )}
            </div>
          )}
        />
        <Controller
          control={control}
          name="CVV"
          render={({ field }) => (
            <div className="-ms-px min-w-0 flex-1 focus-within:z-10">
              <Input
                className={`rounded-s-none rounded-t-none rounded-bl-none shadow-none [direction:inherit] ${
                  errors?.CVV ? "border-red-500" : ""
                }`}
                {...getCVCProps({
                  onChange: field.onChange // Hook into react-hook-form
                })}
                value={field.value}
                placeholder="CVC"
                id="cvc"
              />
              {errors?.CVV && <span className="text-sm text-red-500">{errors.CVV.message}</span>}
            </div>
          )}
        />
      </div>
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
