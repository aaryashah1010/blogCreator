const STEPS = [
  { key: "form", label: "Brief" },
  { key: "brief", label: "Review" },
  { key: "draft", label: "Publish" }
];

export default function StepIndicator({ currentStep, published }) {
  const currentIndex = STEPS.findIndex((s) => s.key === currentStep);

  return (
    <ol className="step-indicator">
      {STEPS.map((step, i) => {
        const isComplete = i < currentIndex || (i === currentIndex && step.key === "draft" && published);
        const isActive = i === currentIndex && !isComplete;
        return (
          <li key={step.key} className={isComplete ? "is-complete" : isActive ? "is-active" : ""}>
            <span className="step-dot">{isComplete ? "✓" : i + 1}</span>
            <span className="step-label">{step.label}</span>
          </li>
        );
      })}
    </ol>
  );
}
