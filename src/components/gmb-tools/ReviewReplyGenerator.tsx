
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

function getMockReply(review: string) {
  if (!review) return "";
  if (/bom|ótimo|excelente|gostei|recomendo|maravilhoso/i.test(review))
    return "Olá! Agradecemos pelo seu feedback positivo. Ficamos felizes que tenha gostado da experiência!";
  if (/ruim|pior|não gostei|horrível|problema|péssimo/i.test(review))
    return "Olá! Agradecemos sua avaliação. Sentimos muito pelo ocorrido e já estamos trabalhando para melhorar. Sua opinião é importante.";
  if (/\?/i.test(review))
    return "Sua pergunta é importante! O proprietário responderá o quanto antes para ajudar :)";
  return "Obrigado pela sua avaliação. Conte sempre conosco!";
}

export default function ReviewReplyGenerator({ businessInfo }: { businessInfo: any }) {
  const [review, setReview] = useState("");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  async function handleGenerate() {
    setLoading(true);
    setReply("");
    try {
      const apiKey = localStorage.getItem("geminiApiKey");
      if (!apiKey) {
        setTimeout(() => {
          setReply(getMockReply(review));
          setLoading(false);
          toast({ title: "Sugestão gerada com exemplo", description: "Configure sua API para resultados personalizados." });
        }, 800);
        return;
      }
      // Chame sua API real aqui, lógica similar ao gerador de posts
      // const result = await generateGeminiReply(review, businessInfo);
      // setReply(result);
      setTimeout(() => {
        setReply(getMockReply(review));
        setLoading(false);
      }, 1200);
    } catch (e) {
      setLoading(false);
      toast({ title: "Erro ao gerar resposta", variant: "destructive" });
    }
  }

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-blue-700 dark:text-blue-200 mb-1">
        Cole a avaliação recebida do Google Meu Negócio:
      </label>
      <Textarea
        value={review}
        onChange={e => setReview(e.target.value)}
        placeholder="Exemplo: Atendimento excelente, super recomendo!"
        rows={3}
        className="mb-2"
      />
      <Button onClick={handleGenerate} disabled={loading || !review} className="w-full">
        {loading ? "Gerando resposta..." : "Gerar resposta automática"}
      </Button>
      {reply && (
        <div className="bg-blue-50 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-700 mt-3 p-3 rounded-lg shadow text-sm text-blue-900 dark:text-blue-100 animate-fade-in">
          <strong>Resposta sugerida:</strong>
          <div className="mt-1">{reply}</div>
        </div>
      )}
      <div className="text-xs text-blue-600 dark:text-blue-300 mt-2 opacity-80">
        Observação: Análise semântica para detectar elogio, crítica ou perguntas.<br />
        Sempre revise antes de publicar para garantir que esteja adequado ao contexto.
      </div>
    </div>
  );
}
