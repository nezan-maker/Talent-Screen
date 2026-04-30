import { BrainLoader } from "@/components/ui/BrainLoader";

export function Spinner({ className }: { className?: string }) {
  return <BrainLoader className={className} label="Loading" />;
}
