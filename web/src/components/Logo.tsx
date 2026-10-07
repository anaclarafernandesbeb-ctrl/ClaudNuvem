import Link from "next/link";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="font-display text-2xl font-bold tracking-tight">
      Prospecta<span className="text-laranja">.</span>
    </Link>
  );
}
