import { useRef } from "react";
import { useParams } from "react-router-dom";
import { useVirtualizer } from "@tanstack/react-virtual";
import { MainContent } from "@/components/Sidebar/styles";
import { Spinner } from "@/components/Spinner/Spinner";
import useGetData from "@/hooks/useGetData";
import ChevronLeftIcon from "@/components/Icon/ChevronLeftIcon";
import { ChannelVideo } from "./types";
import {
  ChannelPageHeader,
  BackButton,
  PageTitle,
  VideoCount,
  VirtualListContainer,
  VirtualVideoRow,
  VideoRowThumbnail,
  VideoRowInfo,
  VideoRowTitle,
  VideoRowDate,
} from "./styles";
import { StatusMessage } from "@/components/Main/styles";

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

const ROW_HEIGHT = 84;
const ROW_GAP = 8;

const ChannelPage = () => {
  const { id } = useParams<{ id: string }>();
  const parentRef = useRef<HTMLDivElement>(null);

  const { data, isFetching, isError } = useGetData<ChannelVideo[]>({
    apiUrl: `http://localhost:8080/getChannelById/${id}`,
    enabled: !!id,
  });

  const videos = data?.filter((v) => !v.hide && !v.deleted) ?? [];

  const virtualizer = useVirtualizer({
    count: videos.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT + ROW_GAP,
    overscan: 10,
  });

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
        <StatusMessage>Błąd podczas ładowania danych kanału.</StatusMessage>
      </MainContent>
    );
  }

  const channelTitle = videos.length > 0 ? videos[0].channel_title : "Kanał";

  return (
    <MainContent style={{ display: "flex", flexDirection: "column" }}>
      <ChannelPageHeader>
        <BackButton to="/channels">
          <ChevronLeftIcon />
        </BackButton>
        <PageTitle style={{ padding: 0 }}>{decodeHtml(channelTitle)}</PageTitle>
      </ChannelPageHeader>
      <VideoCount>{videos.length} filmów</VideoCount>

      <VirtualListContainer ref={parentRef}>
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const video = videos[virtualRow.index];
            return (
              <div
                key={virtualRow.key}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: `${virtualRow.size - ROW_GAP}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <VirtualVideoRow
                  to={`/song/${video.id}`}
                  style={{ height: "100%" }}
                >
                  <VideoRowThumbnail
                    src={video.medium_thumbnail}
                    alt={video.title}
                    loading="lazy"
                  />
                  <VideoRowInfo>
                    <VideoRowTitle>{decodeHtml(video.title)}</VideoRowTitle>
                    <VideoRowDate>
                      {formatDate(video.published_at)}
                    </VideoRowDate>
                  </VideoRowInfo>
                </VirtualVideoRow>
              </div>
            );
          })}
        </div>
      </VirtualListContainer>
    </MainContent>
  );
};

export default ChannelPage;
