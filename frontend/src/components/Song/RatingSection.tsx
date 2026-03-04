import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { addOrUpdateRating, type RatingData } from '@/services/songService';
import StarRating from './StarRating';
import {
  SectionContainer,
  SectionTitle,
  RatingDisplay,
  RatingAverage,
  RatingCount,
  UserRatingRow,
  UserRatingLabel,
} from './styles';

interface RatingSectionProps {
  songId: number;
  ratingData: RatingData;
  onRatingUpdated: () => void;
}

const RatingSection: React.FC<RatingSectionProps> = ({
  songId,
  ratingData,
  onRatingUpdated,
}) => {
  const { isAuthenticated } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const handleRate = async (rating: number) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await addOrUpdateRating(songId, rating);
      onRatingUpdated();
    } catch {
      // silently fail
    } finally {
      setSubmitting(false);
    }
  };

  const hasRatings = ratingData.rating_count > 0;

  return (
    <SectionContainer>
      <SectionTitle>Ocena</SectionTitle>
      <RatingDisplay>
        <StarRating value={hasRatings ? Number(ratingData.average_rating) : 0} size={28} />
        {hasRatings ? (
          <>
            <RatingAverage>{Number(ratingData.average_rating).toFixed(1)}</RatingAverage>
            <RatingCount>({ratingData.rating_count} {ratingData.rating_count === 1 ? 'ocena' : 'ocen'})</RatingCount>
          </>
        ) : (
          <RatingCount>Brak ocen</RatingCount>
        )}
      </RatingDisplay>
      {isAuthenticated && (
        <UserRatingRow>
          <UserRatingLabel>
            {ratingData.user_rating ? 'Twoja ocena:' : 'Oceń utwór:'}
          </UserRatingLabel>
          <StarRating
            value={ratingData.user_rating ?? 0}
            onChange={handleRate}
            size={22}
          />
        </UserRatingRow>
      )}
    </SectionContainer>
  );
};

export default RatingSection;
