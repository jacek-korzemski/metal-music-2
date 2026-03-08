import { useState } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { ThemeProvider } from "styled-components";
import Sidebar from "./components/Sidebar/Sidebar";
import SidebarLayout from "./components/Sidebar/SidebarLayout";
import { SnackbarProvider } from "./components/Snackbar";
import { GlobalStyles } from "./styles/GlobalStyles";
import { theme } from "./styles/theme";
import { Button } from "@/components/Button/Button";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LoginModal from "./components/Auth/LoginModal";
import RegisterModal from "./components/Auth/RegisterModal";
import Main from "@/components/Main/Main";
import SongPage from "@/components/Song/SongPage";
import MostCommented from "@/components/MostCommented/MostCommented";
import BestRated from "@/components/BestRated/BestRated";
import AdminPanel from "@/components/Admin/AdminPanel";
import Channels from "@/components/Channels/Channels";
import ChannelPage from "@/components/Channels/ChannelPage";
import SearchModal from "@/components/Search/SearchModal";
import SearchResults from "@/components/Search/SearchResults";

const SidebarContent: React.FC = () => {
  const { isAuthenticated, isAdmin, logout, isLoading } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <Button variant="tertiary" fullWidth onClick={() => navigate('/')}>
        Strona główna
      </Button>
      <Button variant="tertiary" fullWidth onClick={() => navigate('/most-commented')}>
        Najczęściej komentowane
      </Button>
      <Button variant="tertiary" fullWidth onClick={() => navigate('/best-rated')}>
        Najlepiej oceniane
      </Button>
      <Button variant="tertiary" fullWidth onClick={() => navigate('/channels')}>
        Wszystkie kanały
      </Button>
      <Button variant="tertiary" fullWidth onClick={() => setSearchModalOpen(true)}>
        Szukaj
      </Button>
      <SearchModal isOpen={searchModalOpen} onClose={() => setSearchModalOpen(false)} />
      {isAdmin && (
        <>
          <hr style={{ border: 'none', borderTop: '1px solid #3c3c3c', margin: '4px 0' }} />
          <Button variant="tertiary" fullWidth onClick={() => navigate('/admin')}>
            Redakcja ocen i komentarzy
          </Button>
        </>
      )}
      <hr style={{ border: 'none', borderTop: '1px solid #3c3c3c', margin: '4px 0' }} />
      {isLoading ? null : isAuthenticated ? (
        <Button variant="tertiary" fullWidth onClick={logout}>
          Log out
        </Button>
      ) : (
        <>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button variant="tertiary" fullWidth onClick={() => setLoginOpen(true)}>
              Sign in
            </Button>
            <Button variant="tertiary" fullWidth onClick={() => setRegisterOpen(true)}>
              Register
            </Button>
          </div>
          <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
          <RegisterModal isOpen={registerOpen} onClose={() => setRegisterOpen(false)} />
        </>
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <GlobalStyles theme={theme} />
        <AuthProvider>
          <SnackbarProvider>
            <SidebarLayout
              leftSidebar={
                <Sidebar
                  position="left"
                  defaultWidth={260}
                  minWidth={200}
                  maxWidth={400}
                  collapsible
                  resizable
                  header={<span style={{ fontWeight: 600 }}>React Music App 2</span>}
                >
                  <SidebarContent />
                </Sidebar>
              }
            >
              <Routes>
                <Route path="/" element={<Main />} />
                <Route path="/song/:id" element={<SongPage />} />
                <Route path="/most-commented" element={<MostCommented />} />
                <Route path="/best-rated" element={<BestRated />} />
                <Route path="/channels" element={<Channels />} />
                <Route path="/channel/:id" element={<ChannelPage />} />
                <Route path="/search" element={<SearchResults />} />
                <Route path="/admin" element={<AdminPanel />} />
              </Routes>
            </SidebarLayout>
          </SnackbarProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

export default App;
