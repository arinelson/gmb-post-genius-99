
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, FileText } from "lucide-react";
import { generatePostsWithGemini } from "@/services/geminiService";

const buildPrompt = (businessInfo: any, language: string) => {
  // Prompt bem otimizado para descrição do GMB
  return `Crie uma descrição otimizada para o Google Meu Negócio para uma empresa com as seguintes informações:
Nome: ${businessInfo.name}
Categoria: ${businessInfo.category}
Endereço: ${businessInfo.address}
Site: ${businessInfo.website || "-"}
Telefone: ${businessInfo.phone || "-"}
Horário: ${businessInfo.hours || "-"}
Idioma: ${language}
A descrição deve seguir as diretrizes do GMB e do Google para SEO local e ranqueamento, ser convincente, clara e ideal para conversão.`;
};

export default function GMBDescriptionGenerator({ businessInfo, language }: { businessInfo: any, language: string }) {
  const { toast } = useToast();
  const [desc, setDesc] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const apiKey = localStorage.getItem("geminiApiKey");
      const prompt = buildPrompt(businessInfo, language);

      // Reutiliza serviço da Gemini como mock
      let result = "";
      if (!apiKey) {
        result = "Mercadinho Bela Vista é referência em produtos frescos, bom atendimento e ótimos preços em Maceió. Venha conferir nossas ofertas semanais!";
      } else {
        const posts = await generatePostsWithGemini("description", businessInfo, "default", language);
        result = Array.isArray(posts) ? posts[0] : posts;
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
