import { useEffect, useState } from "react";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import DashboardPage from "./pages/DashboardPage";
import NewPost from "./pages/NewPost";
import AppShell from "./components/AppShell";
import { me, getToken, logout } from "./api/authApi";

function App() {
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState(null);
  const [view, setView] = useState("login"); // login | signup | dashboard | new-post
  const [openDraftId, setOpenDraftId] = useState(null);

  useEffect(() => {
    if (!getToken()) {
      setAuthChecked(true);
      return;
    }
    me().then((u) => {
      if (u) {
        setUser(u);
        setView("dashboard");
      }
      setAuthChecked(true);
    });
  }, []);

  useEffect(() => {
    function handleUnauthorized() {
      setUser(null);
      setView("login");
    }
    window.addEventListener("contentforge:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("contentforge:unauthorized", handleUnauthorized);
  }, []);

  if (!authChecked) {
    return <div className="app-loading">Loading...</div>;
  }

  if (!user) {
    if (view === "signup") {
      return (
        <SignupPage
          onSignedUp={(u) => {
            setUser(u);
            setView("dashboard");
          }}
          onGoToLogin={() => setView("login")}
        />
      );
    }
    return (
      <LoginPage
        onLoggedIn={(u) => {
          setUser(u);
          setView("dashboard");
        }}
        onGoToSignup={() => setView("signup")}
      />
    );
  }

  function goToDashboard() {
    setOpenDraftId(null);
    setView("dashboard");
  }

  async function handleLogout() {
    await logout();
    setUser(null);
    setView("login");
  }

  if (view === "new-post") {
    return (
      <NewPost
        onLoggedOut={() => {
          setUser(null);
          setView("login");
        }}
        onGoToDashboard={goToDashboard}
        openDraftId={openDraftId}
      />
    );
  }

  return (
    <AppShell onLogout={handleLogout} onGoToDashboard={goToDashboard}>
      <DashboardPage
        onNewPost={() => {
          setOpenDraftId(null);
          setView("new-post");
        }}
        onOpenDraft={(id) => {
          setOpenDraftId(id);
          setView("new-post");
        }}
      />
    </AppShell>
  );
}

export default App;
