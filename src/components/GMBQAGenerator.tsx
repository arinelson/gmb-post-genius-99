
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
      
      let result: string[] = [];
      if (!apiKey) {
        result = [
          "Pergunta: O Mercadinho tem estacionamento?\nResposta: Sim, oferecemos estacionamento gratuito para clientes.",
          "Pergunta: Aceitam cartão de crédito?\nResposta: Sim, aceitamos todas as principais bandeiras.",
        ];
      } else {
        // Usa o tipo "qa" diretamente - a função interna agora escolhe o prompt adequado
        const response = await generatePostsWithGemini("qa", businessInfo, "default", language);
        
        if (Array.isArray(response)) {
          result = response;
        } else if (typeof response === "string") {
          // Se vier como string única, dividir em pares Q&A
          result = response.split(/\n\s*\n/).filter(qa => qa.trim().length > 0);
        } else {
          result = ["Não foi possível gerar perguntas e respostas."];
        }
      }
      
      setQuestions(result);
      toast({ title: "Q&A Gerada!", description: "Veja exemplos gerados abaixo, edite se quiser." });
    } catch (error) {
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
          <Textarea key={i} className="w-full" value={item} rows={4} onChange={(e) => {
            const updatedQuestions = [...questions];
            updatedQuestions[i] = e.target.value;
            setQuestions(updatedQuestions);
          }} />
        ))}
      </div>
    </div>
  );
}
