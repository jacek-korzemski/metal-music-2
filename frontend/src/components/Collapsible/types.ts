export interface CollapsibleProps {
  children: React.ReactNode;
  title: React.ReactNode;
  defaultOpen?: boolean;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  indent?: number;
  className?: string;
}

export interface CollapsibleHeaderProps {
  $indent: number;
}

export interface TreeItemProps {
  children?: React.ReactNode;
  label: React.ReactNode;
  icon?: React.ReactNode;
  indent?: number;
  onClick?: () => void;
  selected?: boolean;
  actions?: React.ReactNode;
}
