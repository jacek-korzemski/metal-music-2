import { MainContent } from "@/components/Sidebar/styles";
import { Spinner } from "@/components/Spinner/Spinner";
import useGetData from "@/hooks/useGetData";
import { Channel } from "./types";
import {
  ChannelList,
  ChannelCard,
  ChannelIndex,
  ChannelTitle,
  PageTitle,
} from "./styles";
import { StatusMessage } from "@/components/Main/styles";

const Channels = () => {
  const { data, isFetching, isError } = useGetData<Channel[]>({
    apiUrl: "http://localhost:8080/getAllChannels",
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
        <StatusMessage>Błąd podczas ładowania kanałów.</StatusMessage>
      </MainContent>
    );
  }

  const channels = data ?? [];

  return (
    <MainContent>
      <PageTitle>Wszystkie kanały ({channels.length})</PageTitle>
      <ChannelList>
        {channels.map((channel, index) => (
          <ChannelCard key={channel.id} to={`/channel/${channel.id}`}>
            <ChannelIndex>{index + 1}.</ChannelIndex>
            <ChannelTitle>{channel.channel_title}</ChannelTitle>
          </ChannelCard>
        ))}
      </ChannelList>
    </MainContent>
  );
};

export default Channels;
