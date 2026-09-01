import { useState } from "react";
import { login } from "../api/authApi";

export default function LoginPage({ onLoggedIn, onGoToSignup }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const user = await login(username.trim(), password);
      onLoggedIn(user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-visual">
        <img src="/images/login-hero.jpg" alt="" />
        <div className="login-visual-overlay" />
        <div className="login-visual-content">
          <div className="brand-mark">
            <span className="brand-icon">CF</span>
            <span className="brand-name">ContentForge</span>
          </div>
          <h1>Turn a rough brief into a publish-ready blog post.</h1>
          <p>Structured briefs in, SEO-ready, humanized, lead-generating posts out — in minutes, not hours.</p>
          <ul className="login-feature-list">
            <li>Keeps every target keyword you give it</li>
            <li>Enforces an 800-1000 word floor automatically</li>
            <li>Rewrites for a natural, human voice before it ships</li>
          </ul>
        </div>
      </div>

      <div className="login-form-panel">
        <form className="login-card" onSubmit={handleSubmit}>
          <div className="brand-mark brand-mark-compact">
            <span className="brand-icon">CF</span>
            <span className="brand-name">ContentForge</span>
          </div>
          <h2>Welcome back</h2>
          <p className="hint">Sign in to start writing.</p>

          {error && <div className="error-banner">{error}</div>}

          <label>
            Username
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              autoComplete="username"
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </label>

          <button type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>

          <p className="auth-switch">
            Don't have an account?{" "}
            <button type="button" className="link-button" onClick={onGoToSignup}>
              Sign up
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
