import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "../Modal/Modal";
import Input from "../Form/Input";
import { Select } from "../Form/Select";
import { Button } from "../Button/Button";
import { useGetDataCached } from "@/hooks/useGetDataCached";
import { API_URL } from "@/config";
import { Channel } from "../Channels/types";
import styled from "styled-components";

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchParams {
  title?: string;
  published_after?: string;
  published_before?: string;
  channel?: string;
  channel_title?: string;
}

const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [publishedAfter, setPublishedAfter] = useState("");
  const [publishedBefore, setPublishedBefore] = useState("");
  const [channelId, setChannelId] = useState<string>("");
  const [channelTitle, setChannelTitle] = useState("");

  const { data: channelsData } = useGetDataCached<Channel[]>({
    apiUrl: `${API_URL}/getAllChannels`,
    enabled: isOpen,
  });

  const channelOptions =
    channelsData?.map((c) => ({
      value: String(c.id),
      label: c.channel_title,
    })) ?? [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params: SearchParams = {};
    if (title.trim()) params.title = title.trim();
    if (publishedAfter) params.published_after = publishedAfter;
    if (publishedBefore) params.published_before = publishedBefore;
    if (channelId) params.channel = channelId;
    if (channelTitle.trim()) params.channel_title = channelTitle.trim();

    const searchParams = new URLSearchParams(
      params as Record<string, string>
    ).toString();
    navigate(`/search${searchParams ? `?${searchParams}` : ""}`);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Szukaj"
      maxWidth="400px"
    >
      <Form onSubmit={handleSubmit}>
        <Input
          label="Tytuł zawiera"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Fragment tytułu"
          fullWidth
        />
        <Input
          label="Publikacja od"
          type="date"
          value={publishedAfter}
          onChange={(e) => setPublishedAfter(e.target.value)}
          fullWidth
        />
        <Input
          label="Publikacja do"
          type="date"
          value={publishedBefore}
          onChange={(e) => setPublishedBefore(e.target.value)}
          fullWidth
        />
        <Select
          label="Kanał"
          options={channelOptions}
          value={channelId}
          onChange={(v) => setChannelId(v ?? "")}
          placeholder="Wybierz kanał"
          fullWidth
        />
        <Input
          label="Nazwa kanału zawiera"
          type="text"
          value={channelTitle}
          onChange={(e) => setChannelTitle(e.target.value)}
          placeholder="Fragment nazwy kanału"
          fullWidth
        />
        <Button variant="primary" fullWidth type="submit">
          Szukaj
        </Button>
      </Form>
    </Modal>
  );
};

export default SearchModal;
