import { cn } from "@/lib/utils";

export function BrainLoader({
  className,
  label = "Loading",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <span
      className={cn(
        "brain-loader inline-flex h-5 w-5 items-center justify-center text-accent",
        className,
      )}
      aria-label={label}
      role="status"
    >
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-full overflow-visible"
      >
        <path
          className="brain-loader__outline"
          d="M24 13C18.477 13 14 17.477 14 23c0 .87.11 1.713.317 2.517A9.98 9.98 0 0 0 10 34c0 4.064 2.424 7.56 5.904 9.118A9 9 0 0 0 24 51h6V13h-6Z"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          className="brain-loader__outline brain-loader__outline--delay"
          d="M40 13c5.523 0 10 4.477 10 10 0 .87-.11 1.713-.317 2.517A9.98 9.98 0 0 1 54 34c0 4.064-2.424 7.56-5.904 9.118A9 9 0 0 1 40 51h-6V13h6Z"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          className="brain-loader__trace"
          d="M23 23h6m-9 9h9m-7 9h7m6-18h8m-8 9h10m-10 9h8M32 17v30"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.9"
        />
        <circle className="brain-loader__node" cx="22" cy="23" r="2.2" fill="currentColor" />
        <circle className="brain-loader__node brain-loader__node--delay-1" cx="43" cy="23" r="2.2" fill="currentColor" />
        <circle className="brain-loader__node brain-loader__node--delay-2" cx="24" cy="41" r="2.2" fill="currentColor" />
        <circle className="brain-loader__node brain-loader__node--delay-3" cx="41" cy="41" r="2.2" fill="currentColor" />
      </svg>
    </span>
  );
}
