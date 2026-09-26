import { Component } from 'react';

/* Keeps the shell usable if a page fails to render; the calculation state is untouched. */
export class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error('Page render error', error, info?.componentStack); }
  componentDidUpdate(prev) { if (prev.resetKey !== this.props.resetKey && this.state.error) this.setState({ error: null }); }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="page">
        <div className="callout fail" role="alert">
          <div>
            <b>This page could not be displayed.</b> Your project data is safe. Check the highlighted inputs, or open another page from the sidebar.
            <div className="mono muted" style={{ fontSize: 11.5, marginTop: 6 }}>{String(this.state.error?.message || this.state.error)}</div>
          </div>
        </div>
      </div>
    );
  }
}
