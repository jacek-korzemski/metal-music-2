export interface BoxProps {
  children: React.ReactNode;
  title?: string;
  closable?: boolean;
  collapsible?: boolean;
  onClose?: () => void;
  padding?: string;
  variant?: 'default' | 'elevated' | 'outlined' | 'ghost';
  headerActions?: React.ReactNode;
  footer?: React.ReactNode;
  fullHeight?: boolean;
  maxHeight?: string;
  loading?: boolean;
  className?: string;
}

export interface BoxContainerProps {
  $variant: 'default' | 'elevated' | 'outlined' | 'ghost';
  $fullHeight?: boolean;
  $maxHeight?: string;
}