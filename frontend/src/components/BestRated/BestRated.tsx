import { useEffect, useState } from "react";
import { MainContent } from "@/components/Sidebar/styles";
import { Spinner } from "@/components/Spinner/Spinner";
import { StatusMessage } from "@/components/Main/styles";
import { getBestRated, type RatedSongData } from "@/services/songService";
import { Video } from "@/components/Main/types";
import StarRating from "@/components/Song/StarRating";
import {
  CardGrid,
  Card,
  CardThumbnail,
  CardInfo,
  CardTitle,
  CardChannel,
  CardStat,
  PageTitle,
} from "@/components/SongCard/styles";

const decodeHtml = (html: string) => {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.documentElement.textContent ?? html;
};

interface SongWithStats {
  video: Video;
  average_rating: number;
  rating_count: number;
}

const BestRated = () => {
  const [songs, setSongs] = useState<SongWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const rated = await getBestRated();
        if (rated.length === 0) {
          setSongs([]);
          setLoading(false);
          return;
        }

        const songDetails = await Promise.all(
          rated.map(async (item: RatedSongData) => {
            const res = await fetch(
              `http://localhost:8080/getVideoById/${item.song_id}`
            );
            const videos: Video[] = await res.json();
            return videos[0]
              ? {
                  video: videos[0],
                  average_rating: item.average_rating,
                  rating_count: item.rating_count,
                }
              : null;
          })
        );

        setSongs(songDetails.filter((s): s is SongWithStats => s !== null));
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <MainContent>
        <StatusMessage>
          <Spinner />
        </StatusMessage>
      </MainContent>
    );
  }

  if (error) {
    return (
      <MainContent>
        <StatusMessage>Błąd podczas ładowania danych.</StatusMessage>
      </MainContent>
    );
  }

  return (
    <MainContent>
      <PageTitle>Najlepiej oceniane</PageTitle>
      {songs.length === 0 ? (
        <StatusMessage>Brak ocenionych utworów.</StatusMessage>
      ) : (
        <CardGrid>
          {songs.map(({ video, average_rating, rating_count }) => (
            <Card key={video.id} to={`/song/${video.id}`}>
              <CardThumbnail
                src={video.medium_thumbnail}
                alt={video.title}
                loading="lazy"
              />
              <CardInfo>
                <CardTitle>{decodeHtml(video.title)}</CardTitle>
                <CardChannel>{decodeHtml(video.channel_title)}</CardChannel>
                <CardStat>
                  <StarRating value={Number(average_rating)} size={14} />
                  {" "}
                  {Number(average_rating).toFixed(1)} ({rating_count}{" "}
                  {rating_count === 1 ? "ocena" : "ocen"})
                </CardStat>
              </CardInfo>
            </Card>
          ))}
        </CardGrid>
      )}
    </MainContent>
  );
};

export default BestRated;
