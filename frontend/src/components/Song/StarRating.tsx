import { useState } from 'react';
import { StarContainer, Star } from './styles';

interface StarRatingProps {
  value: number;
  onChange?: (rating: number) => void;
  max?: number;
  size?: number;
}

const StarRating: React.FC<StarRatingProps> = ({
  value,
  onChange,
  max = 5,
  size = 24,
}) => {
  const [hoverValue, setHoverValue] = useState(0);
  const interactive = !!onChange;

  return (
    <StarContainer>
      {Array.from({ length: max }, (_, i) => {
        const starValue = i + 1;
        const filled = interactive
          ? starValue <= (hoverValue || value)
          : starValue <= Math.round(value);

        return (
          <Star
            key={starValue}
            $filled={filled}
            $interactive={interactive}
            $size={size}
            onClick={() => interactive && onChange?.(starValue)}
            onMouseEnter={() => interactive && setHoverValue(starValue)}
            onMouseLeave={() => interactive && setHoverValue(0)}
          >
            ★
          </Star>
        );
      })}
    </StarContainer>
  );
};

export default StarRating;
