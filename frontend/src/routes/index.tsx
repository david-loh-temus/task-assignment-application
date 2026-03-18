import { createFileRoute } from '@tanstack/react-router';

const HomePage = () => {
  return (
    <main className="page-shell">
      <header className="page-shell__header">
        <h1 className="page-shell__title">Tasks</h1>
      </header>

      <section className="page-shell__panel" aria-label="page skeleton">
        <div className="page-shell__row page-shell__row--header" />
        <div className="page-shell__table">
          <div className="page-shell__table-line" />
          <div className="page-shell__table-line" />
          <div className="page-shell__table-line" />
        </div>
      </section>
    </main>
  );
};

export const Route = createFileRoute('/')({ component: HomePage });
