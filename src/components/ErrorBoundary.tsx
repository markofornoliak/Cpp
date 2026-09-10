import { Component } from 'react';
import type { ReactNode } from 'react';
export default class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed)
      return (
        <main className="recovery">
          <p className="eyebrow">A pause, not a reset</p>
          <h1>Let’s reopen your workspace.</h1>
          <p>The page could not load. Your saved progress is still on this device.</p>
          <button className="button primary" onClick={() => window.location.reload()}>
            Reload Learn C++
          </button>
        </main>
      );
    return this.props.children;
  }
}
