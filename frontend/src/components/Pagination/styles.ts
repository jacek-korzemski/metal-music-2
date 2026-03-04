import styled from "styled-components";

export const PaginationBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md} 0;
`;

export const PaginationButton = styled.button`
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSize.sm};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover:not(:disabled) {
    background-color: ${({ theme }) => theme.colors.surfaceHover};
    border-color: ${({ theme }) => theme.colors.borderLight};
  }

  &:disabled {
    opacity: 0.4;
    cursor: default;
  }
`;

export const PageNumber = styled.button<{ $active?: boolean }>`
  min-width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 ${({ theme }) => theme.spacing.xs};
  background-color: ${({ theme, $active }) =>
    $active ? theme.colors.borderFocus : "transparent"};
  border: 1px solid
    ${({ theme, $active }) =>
      $active ? theme.colors.borderFocus : "transparent"};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  color: ${({ theme, $active }) =>
    $active ? theme.colors.textOnPrimary ?? "#fff" : theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSize.sm};
  font-weight: ${({ theme, $active }) =>
    $active ? theme.fontWeight.semibold : theme.fontWeight.normal};
  cursor: ${({ $active }) => ($active ? "default" : "pointer")};
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    background-color: ${({ theme, $active }) =>
      $active ? theme.colors.borderFocus : theme.colors.surfaceHover};
    border-color: ${({ theme, $active }) =>
      $active ? theme.colors.borderFocus : theme.colors.borderLight};
  }
`;

export const PaginationEllipsis = styled.span`
  font-size: ${({ theme }) => theme.fontSize.sm};
  color: ${({ theme }) => theme.colors.textMuted};
  padding: 0 ${({ theme }) => theme.spacing.xxs};
  user-select: none;
`;
