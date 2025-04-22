
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, MessageSquare } from "lucide-react";
import { generatePostsWithGemini } from "@/services/geminiService";

export default function GMBReviewReplyGenerator({ businessInfo, language }: { businessInfo: any, language: string }) {
  const { toast } = useToast();
  const [review, setReview] = useState("");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const apiKey = localStorage.getItem("geminiApiKey");

      if (!review) {
        toast({ title: "Digite a avaliação!", description: "Coloque o texto da avaliação/review do cliente." });
        setLoading(false);
        return;
      }

      let result = "";
      if (!apiKey) {
        // Mock inteligente
        if (/bom|ótimo|excelente|adorei|gostei/i.test(review)) {
          result = "Agradecemos muito sua avaliação positiva! Esperamos vê-lo novamente em breve.";
        } else if (/ruim|péssimo|horrível|atraso/i.test(review)) {
          result = "Pedimos desculpas pela experiência negativa. Estamos trabalhando para melhorar. Obrigado pelo seu feedback!";
        } else {
          result = "Obrigado pelo seu comentário! Em caso de dúvidas específicas, responderemos diretamente por telefone.";
        }
      } else {
        // Usa o tipo "review-reply" e passa o texto da avaliação no customPrompt
        const response = await generatePostsWithGemini("review-reply", businessInfo, "default", language, review);
        result = typeof response === "string" ? response : (Array.isArray(response) && response.length > 0 ? response[0] : "");
      }
      setReply(result);
      toast({ title: "Resposta Gerada!", description: "Confira, edite se quiser e copie para o GMB." });
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível gerar a resposta.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center animate-fade-in">
      <div className="w-full mb-2">
        <label className="text-sm font-semibold text-blue-900 dark:text-blue-200 block mb-1">Texto da Avaliação/Review do Cliente</label>
        <Textarea value={review} onChange={e => setReview(e.target.value)} rows={4} placeholder="Cole aqui o texto da avaliação recebida…" className="w-full mb-2"/>
      </div>
      <Button onClick={handleGenerate} disabled={loading || !review || !businessInfo.name || !businessInfo.category || !businessInfo.address} className="mb-2">
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Gerar Resposta"}
      </Button>
      <Textarea className="w-full" rows={5} value={reply} onChange={e => setReply(e.target.value)} placeholder="A resposta será exibida aqui..." />
    </div>
  );
}
