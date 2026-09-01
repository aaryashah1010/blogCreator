import { useState } from "react";
import { signup } from "../api/authApi";

export default function SignupPage({ onSignedUp, onGoToLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    try {
      const user = await signup(username.trim(), password);
      onSignedUp(user);
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
          <h2>Create your account</h2>
          <p className="hint">Set up access to start generating posts.</p>

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
              autoComplete="new-password"
            />
          </label>

          <label>
            Confirm password
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
            />
          </label>

          <button type="submit" disabled={loading}>
            {loading ? "Creating account..." : "Create account"}
          </button>

          <p className="auth-switch">
            Already have an account?{" "}
            <button type="button" className="link-button" onClick={onGoToLogin}>
              Sign in
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
