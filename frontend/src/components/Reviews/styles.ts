import styled from 'styled-components';

/** Pełna wysokość obszaru głównego: toolbar + treść recenzji + player */
export const ReviewsExpandedRoot = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
`;

export const ReviewsRightPane = styled.div`
  display: flex;
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
`;

export const ReviewArticleColumn = styled.div`
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow-y: auto;
  padding: ${({ theme }) => theme.spacing.lg};
  border-right: 2px solid ${({ theme }) => theme.colors.borderFocus};
  background: ${({ theme }) => theme.colors.background};
`;

export const ReviewArticleTitle = styled.h2`
  margin: 0 0 ${({ theme }) => theme.spacing.sm};
  font-size: ${({ theme }) => theme.fontSize.xxl};
  color: ${({ theme }) => theme.colors.text};
`;

export const ReviewArticleMeta = styled.div`
  font-size: ${({ theme }) => theme.fontSize.sm};
  color: ${({ theme }) => theme.colors.textMuted};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

export const ReviewArticleBody = styled.div`
  font-size: ${({ theme }) => theme.fontSize.lg};
  color: ${({ theme }) => theme.colors.text};
  line-height: 1.6;

  p {
    margin: 0 0 ${({ theme }) => theme.spacing.sm};
  }
`;

export const ReviewPlaceholder = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSize.xl};
  padding: ${({ theme }) => theme.spacing.xl};
  text-align: center;
`;

export const SongDetailColumn = styled.div`
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;
