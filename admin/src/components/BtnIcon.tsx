export type BtnIconName =
  | 'add'
  | 'edit'
  | 'delete'
  | 'cancel'
  | 'submit'
  | 'save'
  | 'send'
  | 'login'
  | 'pause'
  | 'resume'
  | 'wait'
  | 'manage'
  | 'logout';

const ICONS: Record<BtnIconName, string> = {
  add: '➕',
  edit: '✏️',
  delete: '🗑️',
  cancel: '✕',
  submit: '✓',
  save: '💾',
  send: '📤',
  login: '🔐',
  pause: '⏸️',
  resume: '▶️',
  wait: '⏳',
  manage: '⚙️',
  logout: '🚪',
};

export default function BtnIcon({ name }: { name: BtnIconName }) {
  return (
    <span className="btn-icon" aria-hidden="true">
      {ICONS[name]}
    </span>
  );
}
