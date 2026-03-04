import { MainContent } from "@/components/Sidebar/styles";
import { Spinner } from "@/components/Spinner/Spinner";
import useGetData from "@/hooks/useGetData";
import { API_URL } from "@/config";
import { Video } from "./types";
import {
  VideoGrid,
  VideoCard,
  Thumbnail,
  VideoInfo,
  VideoTitle,
  ChannelName,
  PublishedDate,
  StatusMessage,
} from "./styles";

const decodeHtml = (html: string) => {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.documentElement.textContent ?? html;
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const Main = () => {
  const { data, isFetching, isError } = useGetData<Video[]>({
    apiUrl: `${API_URL}/getNewVideos`,
  });

  const visibleVideos = data?.filter((v) => !v.hide && !v.deleted) ?? [];

  if (isFetching) {
    return (
      <MainContent>
        <StatusMessage>
          <Spinner />
        </StatusMessage>
      </MainContent>
    );
  }

  if (isError) {
    return (
      <MainContent>
        <StatusMessage>Błąd podczas ładowania danych.</StatusMessage>
      </MainContent>
    );
  }

  return (
    <MainContent>
      <VideoGrid>
        {visibleVideos.map((video) => (
          <VideoCard
            key={video.id}
            to={`/song/${video.id}`}
          >
            <Thumbnail
              src={video.medium_thumbnail}
              alt={video.title}
              loading="lazy"
            />
            <VideoInfo>
              <VideoTitle>{decodeHtml(video.title)}</VideoTitle>
              <ChannelName>{decodeHtml(video.channel_title)}</ChannelName>
              <PublishedDate>{formatDate(video.published_at)}</PublishedDate>
            </VideoInfo>
          </VideoCard>
        ))}
      </VideoGrid>
    </MainContent>
  );
};

export default Main;