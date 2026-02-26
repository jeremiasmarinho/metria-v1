import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface ClientCardProps {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  email?: string | null;
}

export function ClientCard({ id, name, slug, active, email }: ClientCardProps) {
  return (
    <Link href={`/clients/${id}`}>
      <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{name}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>{email ?? slug}</p>
          <span
            className={`inline-block mt-1 rounded-full px-2 py-0.5 text-xs ${
              active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
            }`}
          >
            {active ? "Ativo" : "Inativo"}
          </span>
        </CardContent>
      </Card>
    </Link>
  );
}
