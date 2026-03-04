import {
  PaginationBar,
  PaginationButton,
  PageNumber,
  PaginationEllipsis,
} from "./styles";

const SIBLING_COUNT = 3;

const getPageRange = (
  current: number,
  total: number,
): (number | "ellipsis")[] => {
  const range: (number | "ellipsis")[] = [];
  const left = Math.max(2, current - SIBLING_COUNT);
  const right = Math.min(total - 1, current + SIBLING_COUNT);

  range.push(1);
  if (left > 2) range.push("ellipsis");
  for (let i = left; i <= right; i++) range.push(i);
  if (right < total - 1) range.push("ellipsis");
  if (total > 1) range.push(total);

  return range;
};

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination = ({ currentPage, totalPages, onPageChange }: PaginationProps) => {
  if (totalPages <= 1) return null;

  return (
    <PaginationBar>
      <PaginationButton
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        ←
      </PaginationButton>

      {getPageRange(currentPage, totalPages).map((item, idx) =>
        item === "ellipsis" ? (
          <PaginationEllipsis key={`e${idx}`}>…</PaginationEllipsis>
        ) : (
          <PageNumber
            key={item}
            $active={item === currentPage}
            onClick={() => onPageChange(item)}
          >
            {item}
          </PageNumber>
        ),
      )}

      <PaginationButton
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        →
      </PaginationButton>
    </PaginationBar>
  );
};

export default Pagination;
