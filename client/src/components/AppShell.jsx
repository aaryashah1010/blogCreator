import StepIndicator from "./StepIndicator";

export default function AppShell({ step, published, contentType, onLogout, onGoToDashboard, onGoToResources, children }) {
  const isWebpage = contentType === "webpage";
  return (
    <div className="app-shell">
      <header className="app-header">
        <button type="button" className="brand-mark brand-mark-button" onClick={onGoToDashboard}>
          <span className="brand-icon">CF</span>
          <span className="brand-name">ContentForge</span>
        </button>
        <nav className="app-nav">
          <button type="button" className="logout-button" onClick={onGoToDashboard}>
            Dashboard
          </button>
          {onGoToResources && (
            <button type="button" className="logout-button" onClick={onGoToResources}>
              Resources
            </button>
          )}
          <button type="button" className="logout-button" onClick={onLogout}>
            Log out
          </button>
        </nav>
      </header>

      {step === "form" && (
        <section className="hero-banner">
          <img src="/images/app-hero.jpg" alt="" />
          <div className="hero-banner-overlay" />
          <div className="hero-banner-content">
            <h1>{isWebpage ? "Write a high-converting webpage from a rough brief" : "Write a lead-generating blog post from a rough brief"}</h1>
            <p>
              {isWebpage
                ? "Fill in the essentials — we'll turn it into a structured brief, then short, punchy page copy built to convert."
                : "Fill in the essentials — we'll turn it into a structured brief, then a polished, humanized post."}
            </p>
          </div>
        </section>
      )}

      <div className="app-content">
        {step && <StepIndicator currentStep={step} published={published} />}
        {children}
      </div>
    </div>
  );
}
