"use client";

type AppErrorFallbackProps = {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction: () => void;
};

export function AppErrorFallback({
  title = "Something went wrong",
  description = "The page hit an unexpected error. Reload to try again.",
  actionLabel = "Reload page",
  onAction,
}: AppErrorFallbackProps) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center px-6 py-16">
      <div className="w-full max-w-md rounded-2xl border border-red-500/30 bg-red-950/40 p-8 text-center shadow-lg">
        <h2 className="text-2xl font-semibold text-white">{title}</h2>
        <p className="mt-3 text-sm text-red-100/85">{description}</p>
        <button
          className="mt-6 inline-flex items-center justify-center rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-400"
          onClick={onAction}
          type="button"
        >
          {actionLabel}
        </button>
      </div>
    </div>
  );
}
