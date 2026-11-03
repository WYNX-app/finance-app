import { CheckCircle2, type LucideIcon } from 'lucide-react';

type Props = {
  icon: LucideIcon;
  title: string;
  highlight: string;
  description: string;
  features: string[];
};

export function ComingSoon({ icon: Icon, title, highlight, description, features }: Props) {
  return (
    <div className="flex min-h-[calc(100vh-14rem)] items-center justify-center py-8">
      <div className="w-full max-w-xl animate-fade-in text-center">
        <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-3xl bg-gradient-brand shadow-2xl shadow-primary/40">
          <Icon className="h-10 w-10 text-white" />
        </div>

        <h1 className="mb-2 text-3xl font-bold tracking-tight md:text-4xl">
          {title} <span className="text-gradient">{highlight}</span>
        </h1>
        <p className="mx-auto mb-8 max-w-md text-sm text-muted-foreground">{description}</p>

        <div className="card-base mb-6 text-left">
          <p className="mb-3 text-sm font-semibold">O que vem por aí</p>
          <ul className="space-y-2.5">
            {features.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-surface/60 px-4 py-2 text-xs font-medium text-muted-foreground">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
          Em desenvolvimento — em breve
        </div>
      </div>
    </div>
  );
}