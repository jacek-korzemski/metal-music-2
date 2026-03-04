import { useEffect, useState } from "react";
import { MainContent } from "@/components/Sidebar/styles";
import { Spinner } from "@/components/Spinner/Spinner";
import { StatusMessage } from "@/components/Main/styles";
import { getMostCommented, type CommentedSongData } from "@/services/songService";
import { API_URL } from "@/config";
import { Video } from "@/components/Main/types";
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
  comment_count: number;
}

const MostCommented = () => {
  const [songs, setSongs] = useState<SongWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const commented = await getMostCommented();
        if (commented.length === 0) {
          setSongs([]);
          setLoading(false);
          return;
        }

        const songDetails = await Promise.all(
          commented.map(async (item: CommentedSongData) => {
            const res = await fetch(
              `${API_URL}/getVideoById/${item.song_id}`
            );
            const videos: Video[] = await res.json();
            return videos[0]
              ? { video: videos[0], comment_count: item.comment_count }
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
      <PageTitle>Najczęściej komentowane</PageTitle>
      {songs.length === 0 ? (
        <StatusMessage>Brak komentowanych utworów.</StatusMessage>
      ) : (
        <CardGrid>
          {songs.map(({ video, comment_count }) => (
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
                  {comment_count} {comment_count === 1 ? "komentarz" : "komentarzy"}
                </CardStat>
              </CardInfo>
            </Card>
          ))}
        </CardGrid>
      )}
    </MainContent>
  );
};

export default MostCommented;
