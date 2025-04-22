
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, FileText } from "lucide-react";
import { generatePostsWithGemini } from "@/services/geminiService";

export default function GMBDescriptionGenerator({ businessInfo, language }: { businessInfo: any, language: string }) {
  const { toast } = useToast();
  const [desc, setDesc] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const apiKey = localStorage.getItem("geminiApiKey");

      // Reutiliza serviço da Gemini com prompt específico para descrição
      let result = "";
      if (!apiKey) {
        result = "Mercadinho Bela Vista é referência em produtos frescos, bom atendimento e ótimos preços em Maceió. Venha conferir nossas ofertas semanais!";
      } else {
        // Usa o tipo "description" diretamente - a função interna agora escolhe o prompt adequado
        const response = await generatePostsWithGemini("description", businessInfo, "default", language);
        result = typeof response === "string" ? response : (Array.isArray(response) && response.length > 0 ? response[0] : "");
      }
      setDesc(result);
      toast({ title: "Descrição Gerada!", description: "Você pode editar ou copiar o texto abaixo." });
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível gerar a descrição.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center animate-fade-in">
      <p className="mb-2 text-sm text-blue-700 dark:text-blue-200 flex items-center gap-2">
        <FileText size={16}/> Gere uma descrição otimizada do seu GMB seguindo as melhores práticas do Google.
      </p>
      <Button onClick={handleGenerate} disabled={loading || !businessInfo.name || !businessInfo.category || !businessInfo.address} className="mb-4">
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Gerar Descrição"}
      </Button>
      <Textarea className="w-full mb-2" rows={6} value={desc} onChange={e => setDesc(e.target.value)} placeholder="A descrição será exibida aqui..." />
    </div>
  );
}
