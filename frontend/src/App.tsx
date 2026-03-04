import { useState } from "react";
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

const AuthButtons: React.FC = () => {
  const { isAuthenticated, logout, isLoading } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);

  if (isLoading) return null;

  if (isAuthenticated) {
    return (
      <Button variant="tertiary" fullWidth onClick={logout}>
        Log out
      </Button>
    );
  }

  return (
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
  );
};

const App: React.FC = () => {
  return (
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
                <AuthButtons />
              </Sidebar>
            }
          >
            ...
          </SidebarLayout>
        </SnackbarProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
