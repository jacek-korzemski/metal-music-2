import Modal from "./Modal";
import { StyledButton } from "./styles";
import { ConfirmDialogProps } from "./types";

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  title = 'Confirm',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'info',
}) => {
  const buttonVariant = variant === 'danger' ? 'danger' : 'primary';
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title={title}
      variant="fit-content"
      width="400px"
      footer={
        <>
          <StyledButton $variant="secondary" onClick={onCancel}>
            {cancelText}
          </StyledButton>
          <StyledButton $variant={buttonVariant} onClick={onConfirm}>
            {confirmText}
          </StyledButton>
        </>
      }
    >
      {message}
    </Modal>
  );
};

export default ConfirmDialog;