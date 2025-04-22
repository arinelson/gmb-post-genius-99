
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Copy, HelpCircle, Loader2, Sparkles, Plus, X, BookOpen } from "lucide-react";
import { generateQAContent, getMockQAContent } from "@/services/gmbGeneratorService";
import { useRateLimiter } from "@/services/rateLimiterService";

interface BusinessInfo {
  name: string;
  category: string;
  website: string;
  address: string;
  phone: string;
  hours: string;
}

interface QAGeneratorProps {
  businessInfo: BusinessInfo;
}

const QAGenerator = ({ businessInfo }: QAGeneratorProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [tone, setTone] = useState("helpful");
  const [language, setLanguage] = useState("pt-BR");
  const [topicInput, setTopicInput] = useState("");
  const [topics, setTopics] = useState<string[]>([]);
  const [generatedQAs, setGeneratedQAs] = useState<string[]>([]);
  const rateLimiter = useRateLimiter();
  
  const addTopic = () => {
    if (topicInput.trim() && !topics.includes(topicInput.trim())) {
      setTopics([...topics, topicInput.trim()]);
      setTopicInput("");
    }
  };
  
  const removeTopic = (index: number) => {
    setTopics(topics.filter((_, i) => i !== index));
  };
  
  const handleGenerate = async () => {
    const rateLimit = rateLimiter.canGeneratePosts();
    
    if (!rateLimit.allowed) {
      if (rateLimit.dailyRemaining !== undefined && rateLimit.dailyRemaining <= 0) {
        toast({
          title: "Limite diário atingido",
          description: "Você atingiu o limite de 30 gerações diárias. Tente novamente amanhã.",
          variant: "destructive",
        });
        return;
      }
      
      if (rateLimit.remainingTime) {
        toast({
          title: "Aguarde um momento",
          description: `Por favor, aguarde ${Math.ceil(rateLimit.remainingTime / 1000)} segundos antes de gerar novo conteúdo.`,
        });
        return;
      }
    }
    
    setLoading(true);
    try {
      const apiKey = localStorage.getItem("geminiApiKey");
      
      if (!apiKey) {
        setTimeout(() => {
          const mockQAs = getMockQAContent();
          setGeneratedQAs(mockQAs);
          setLoading(false);
          rateLimiter.recordGeneration();
          toast({
            title: "Perguntas e respostas geradas com dados de exemplo",
            description: "Para obter conteúdo personalizado, configure sua API key nas configurações.",
          });
        }, 1000);
        return;
      }

      const qaContent = await generateQAContent({
        businessInfo,
        topics,
        tone,
        language
      });
      
      setGeneratedQAs(qaContent);
      rateLimiter.recordGeneration();
      toast({
        title: "Perguntas e respostas geradas com sucesso!",
        description: "Confira as sugestões abaixo e escolha as que mais combinam com seu negócio.",
      });
    } catch (error) {
      console.error("Error generating Q&A content:", error);
      toast({
        title: "Erro ao gerar perguntas e respostas",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao gerar o conteúdo. Por favor, tente novamente.",
        variant: "destructive",
      });
      
      const mockQAs = getMockQAContent();
      setGeneratedQAs(mockQAs);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: "O texto foi copiado para a área de transferência.",
    });
  };

  return (
    <Card className="w-full shadow-lg dark:border-blue-800 dark:bg-slate-900/80 animate-fade-in">
      <CardHeader className="bg-gradient-to-r from-amber-600 to-amber-700 dark:from-amber-700 dark:to-amber-900 text-white rounded-t-lg">
        <CardTitle className="text-xl md:text-2xl flex items-center justify-center gap-2">
          <BookOpen className="h-6 w-6" />
          Gerador de Perguntas e Respostas
        </CardTitle>
        <CardDescription className="text-amber-100">
          Crie perguntas frequentes e respostas otimizadas para o Google Meu Negócio
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-6 space-y-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="topics">Tópicos para Perguntas (opcional)</Label>
            <div className="flex space-x-2">
              <Input
                id="topics"
                placeholder="Ex: Horários, Estacionamento, Formas de pagamento..."
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addTopic()}
                className="border-amber-200 dark:border-amber-800 focus:ring-amber-500"
              />
              <Button 
                type="button" 
                onClick={addTopic}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                <Plus size={16} />
              </Button>
            </div>
            
            {topics.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {topics.map((topic, index) => (
                  <div key={index} className="flex items-center bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 px-3 py-1 rounded-full text-sm">
                    {topic}
                    <button 
                      onClick={() => removeTopic(index)}
                      className="ml-2 text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Se não especificar tópicos, serão geradas perguntas frequentes gerais para o tipo de negócio.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tone">Tom das Respostas</Label>
              <Select 
                value={tone} 
                onValueChange={setTone}
              >
                <SelectTrigger className="border-amber-200 dark:border-amber-800 focus:ring-amber-500">
                  <SelectValue placeholder="Selecione o tom" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="helpful">Prestativo</SelectItem>
                  <SelectItem value="professional">Profissional</SelectItem>
                  <SelectItem value="friendly">Amigável</SelectItem>
                  <SelectItem value="informative">Informativo</SelectItem>
                  <SelectItem value="confident">Confiante</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="language">Idioma</Label>
              <Select 
                value={language} 
                onValueChange={setLanguage}
              >
                <SelectTrigger className="border-amber-200 dark:border-amber-800 focus:ring-amber-500">
                  <SelectValue placeholder="Selecione o idioma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                  <SelectItem value="en-US">Inglês (EUA)</SelectItem>
                  <SelectItem value="es-ES">Espanhol</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Button 
            onClick={handleGenerate} 
            disabled={loading}
            className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 transition-all duration-300 text-white font-medium py-6 rounded-lg shadow-lg"
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Gerando Perguntas e Respostas...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2">
                <Sparkles className="h-5 w-5" />
                <span>Gerar Perguntas e Respostas</span>
              </div>
            )}
          </Button>
        </div>
        
        {generatedQAs.length > 0 && (
          <div className="mt-6 space-y-4">
            <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-300">Perguntas e Respostas Sugeridas</h3>
            {generatedQAs.map((qa, index) => (
              <div key={index} className="border border-amber-200 dark:border-amber-800 p-4 rounded-md bg-white dark:bg-slate-800 shadow-md">
                <div className="whitespace-pre-line text-sm text-gray-700 dark:text-gray-300">
                  {qa}
                </div>
                <div className="flex justify-end mt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => copyToClipboard(qa)}
                    className="hover:bg-amber-100 dark:hover:bg-amber-900 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300"
                  >
                    <Copy size={14} className="mr-1" /> Copiar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QAGenerator;
