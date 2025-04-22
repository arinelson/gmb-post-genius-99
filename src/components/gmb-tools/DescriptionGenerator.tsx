
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

function getMockDescription(info: {name?: string, category?: string, address?: string, hours?: string}) {
  const name = info.name || "Seu Negócio";
  const category = info.category || "Categoria";
  const address = info.address ? `Estamos localizados em ${info.address}.` : "";
  const hours = info.hours ? `Atendemos em: ${info.hours}.` : "";
  return `${name} é referência em ${category.toLowerCase()} na região! ${address} ${hours} Prezamos por qualidade e ótimo atendimento. Visite-nos e confira nossas ofertas e diferenciais!`;
}

export default function DescriptionGenerator({ businessInfo }: { businessInfo: any }) {
  const [desc, setDesc] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  async function handleGenerate() {
    setDesc("");
    setLoading(true);
    try {
      const apiKey = localStorage.getItem("geminiApiKey");
      if (!apiKey) {
        setTimeout(() => {
          setDesc(getMockDescription(businessInfo));
          setLoading(false);
          toast({ title: "Exemplo gerado", description: "Configure sua API para uma descrição mais rica e personalizada." });
        }, 900);
        return;
      }
      // Chame sua API real aqui.
      setTimeout(() => {
        setDesc(getMockDescription(businessInfo));
        setLoading(false);
      }, 1400);
    } catch (e) {
      setLoading(false);
      toast({ title: "Erro ao gerar descrição", variant: "destructive" });
    }
  }

  return (
    <div className="space-y-4">
      <Button onClick={handleGenerate} disabled={loading} className="w-full">
        {loading ? "Gerando descrição..." : "Gerar descrição recomendada"}
      </Button>
      {desc && (
        <div className="bg-blue-50 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-700 mt-3 p-3 rounded-lg shadow text-sm text-blue-900 dark:text-blue-100 animate-fade-in">
          <strong>Descrição sugerida:</strong>
          <div className="mt-1">{desc}</div>
        </div>
      )}
      <div className="text-xs text-blue-600 dark:text-blue-300 mt-2 opacity-80">
        Dica: Capriche nas palavras-chave da sua categoria. O texto precisa ser natural, original e atender às recomendações do Google Meu Negócio.
      </div>
    </div>
  );
}
