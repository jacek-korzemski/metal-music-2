import { useNavigate, useParams } from "react-router-dom";
import { MainContent } from "@/components/Sidebar/styles";
import { StatusMessage } from "@/components/Main/styles";
import { SongContainer, BackLink } from "./styles";
import SongDetail from "./SongDetail";

const SongPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const songId = Number(id);

  if (!songId) {
    return (
      <MainContent>
        <SongContainer>
          <BackLink onClick={() => navigate(-1)}>← Wróć</BackLink>
          <StatusMessage>Nie znaleziono utworu.</StatusMessage>
        </SongContainer>
      </MainContent>
    );
  }

  return (
    <MainContent>
      <SongContainer>
        <BackLink onClick={() => navigate(-1)}>← Wróć</BackLink>
        <SongDetail songId={songId} />
      </SongContainer>
    </MainContent>
  );
};

export default SongPage;
