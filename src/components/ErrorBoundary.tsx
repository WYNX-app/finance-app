import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

type Props = { children: ReactNode };
type State = { error: Error | null; info: ErrorInfo | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, info: null };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info);
    this.setState({ info });
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen items-center justify-center p-6">
          <div className="w-full max-w-xl rounded-2xl border border-danger/30 bg-surface p-6 shadow-2xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-danger/10 text-danger">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold">Algo deu errado</h1>
                <p className="text-xs text-muted-foreground">Detalhe técnico abaixo.</p>
              </div>
            </div>

            <div className="mb-4 rounded-xl border border-border/60 bg-surface-muted/60 p-3 text-xs">
              <p className="font-semibold text-danger">{this.state.error.message}</p>
              {this.state.info?.componentStack && (
                <pre className="mt-2 overflow-auto whitespace-pre-wrap text-[10px] text-muted-foreground">
                  {this.state.info.componentStack}
                </pre>
              )}
            </div>

            <div className="flex gap-2">
              <button onClick={() => window.location.reload()} className="btn-primary">
                Recarregar
              </button>
              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.href = '/login';
                }}
                className="btn-ghost"
              >
                Limpar e sair
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}