
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, HelpCircle } from "lucide-react";
import { generatePostsWithGemini } from "@/services/geminiService";

export default function GMBQAGenerator({ businessInfo, language }: { businessInfo: any, language: string }) {
  const { toast } = useToast();
  const [questions, setQuestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const apiKey = localStorage.getItem("geminiApiKey");
      const prompt = `Gere uma seção de perguntas e respostas (Q&A) para o Google Meu Negócio de uma empresa com as características:
Nome: ${businessInfo.name}
Categoria: ${businessInfo.category}
Endereço: ${businessInfo.address}
Site: ${businessInfo.website || "-"}
Serviços e diferenciais: ${businessInfo.category || "-"}
Siga boas práticas do GMB e Google, em SEO, conversão e ranqueamento local. O conteúdo deve ser útil e relevante ao público. Retorne uma lista de Q&As com perguntas comuns e suas respectivas respostas.
Idioma: ${language}
`;
      let result: string[] = [];
      if (!apiKey) {
        result = [
          "Pergunta: O Mercadinho tem estacionamento?\nResposta: Sim, oferecemos estacionamento gratuito para clientes.",
          "Pergunta: Aceitam cartão de crédito?\nResposta: Sim, aceitamos todas as principais bandeiras.",
        ];
      } else {
        const posts = await generatePostsWithGemini("qa", businessInfo, "default", language, prompt);
        if (Array.isArray(posts)) {
          result = posts;
        } else if (typeof posts === "string") {
          // Se veio string, parse em linhas
          result = posts.split(/\n\s*\n/);
        }
      }
      setQuestions(result);
      toast({ title: "Q&A Gerada!", description: "Veja exemplos gerados abaixo, edite se quiser." });
    } catch {
      toast({ title: "Erro", description: "Não foi possível gerar Q&A.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center animate-fade-in">
      <p className="mb-2 text-sm text-blue-700 dark:text-blue-300 flex items-center gap-2">
        <HelpCircle size={16} /> Gere perguntas e respostas relevantes para o GMB deste negócio.
      </p>
      <Button onClick={handleGenerate} disabled={loading || !businessInfo.name || !businessInfo.category || !businessInfo.address} className="mb-4">
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Gerar Perguntas & Respostas"}
      </Button>
      <div className="w-full flex flex-col gap-3">
        {questions.length === 0 && (
          <Textarea className="w-full" rows={8} value="" placeholder="As perguntas & respostas geradas aparecerão aqui..." readOnly/>
        )}
        {questions.map((item, i) => (
          <Textarea key={i} className="w-full" value={item} rows={4} onChange={() => {}} />
        ))}
      </div>
    </div>
  );
}
