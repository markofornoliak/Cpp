import { useEffect, useRef } from 'react';
export default function ConfirmDialog({
  title,
  children,
  confirm,
  onConfirm,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  confirm: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      className="confirm-dialog"
      aria-labelledby="confirm-title"
      aria-describedby="confirm-description"
      onCancel={onClose}
    >
      <h2 id="confirm-title">{title}</h2>
      <div id="confirm-description">{children}</div>
      <div className="dialog-actions">
        <button className="button secondary" onClick={onClose} autoFocus>
          Cancel
        </button>
        <button className="button danger" onClick={onConfirm}>
          {confirm}
        </button>
      </div>
    </dialog>
  );
}
