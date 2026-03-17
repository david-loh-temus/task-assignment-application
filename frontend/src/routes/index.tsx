import { createFileRoute } from '@tanstack/react-router';

const App = () => {
  return (
    <main className="page-shell">
      <section className="page-card">
        <h1 className="page-title">Task Assignment</h1>
        <p className="page-copy">Frontend project scaffolding is ready for the next phase.</p>
      </section>
    </main>
  );
};

export const Route = createFileRoute('/')({ component: App });
