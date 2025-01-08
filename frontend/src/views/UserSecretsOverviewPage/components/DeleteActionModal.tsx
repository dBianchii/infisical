import { ReactNode, useEffect, useState } from "react";

import { Button, FormControl, Input, Modal, ModalClose, ModalContent } from "@app/components/v2";
import { useToggle } from "@app/hooks";

type Props = {
  isOpen?: boolean;
  onClose?: () => void;
  onChange?: (isOpen: boolean) => void;
  deleteKey: string;
  title: string;
  subTitle?: string;
  onDeleteApproved: () => Promise<void>;
  buttonText?: string;
  children?: ReactNode;
};

export const DeleteActionModal = ({
  isOpen,
  onClose,
  onChange,
  deleteKey,
  onDeleteApproved,
  title,
  subTitle = "This action is irreversible.",
  buttonText = "Delete",
  children
}: Props): JSX.Element => {
  const [inputData, setInputData] = useState("");
  const [isLoading, setIsLoading] = useToggle();

  useEffect(() => {
    setInputData("");
  }, [isOpen]);

  const onDelete = async () => {
    setIsLoading.on();
    try {
      await onDeleteApproved();
    } catch {
      setIsLoading.off();
    } finally {
      setIsLoading.off();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={(isOpenState) => {
        setInputData("");
        if (onChange) onChange(isOpenState);
      }}
    >
      <ModalContent
        title={title}
        subTitle={subTitle}
        footerContent={
          <div className="mx-2 flex items-center">
            <Button
              className="mr-4"
              colorSchema="danger"
              isDisabled={!(deleteKey === inputData) || isLoading}
              onClick={onDelete}
              isLoading={isLoading}
            >
              {buttonText}
            </Button>
            <ModalClose asChild>
              <Button variant="plain" colorSchema="secondary" onClick={onClose}>
                Cancel
              </Button>
            </ModalClose>{" "}
          </div>
        }
        onClose={onClose}
      >
        <form
          onSubmit={(evt) => {
            evt.preventDefault();
            if (deleteKey === inputData) onDelete();
          }}
        >
          <FormControl
            label={
              <div className="break-words pb-2 text-sm">
                Type <span className="font-bold">{deleteKey}</span> to perform this action
              </div>
            }
            className="mb-0"
          >
            <Input
              value={inputData}
              onChange={(e) => setInputData(e.target.value)}
              placeholder={`Type ${deleteKey} here`}
            />
          </FormControl>
          {children}
        </form>
      </ModalContent>
    </Modal>
  );
};
