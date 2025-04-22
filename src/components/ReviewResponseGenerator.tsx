
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Copy, MessageCircle, ThumbsUp, ThumbsDown, HelpCircle, Loader2, Sparkles } from "lucide-react";
import { generateReviewResponses, getMockReviewResponses } from "@/services/gmbGeneratorService";
import { useRateLimiter } from "@/services/rateLimiterService";

interface BusinessInfo {
  name: string;
  category: string;
  website: string;
  address: string;
  phone: string;
  hours: string;
}

interface ReviewResponseGeneratorProps {
  businessInfo: BusinessInfo;
}

const ReviewResponseGenerator = ({ businessInfo }: ReviewResponseGeneratorProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [reviewType, setReviewType] = useState("positive");
  const [reviewText, setReviewText] = useState("");
  const [tone, setTone] = useState("friendly");
  const [language, setLanguage] = useState("pt-BR");
  const [generatedResponses, setGeneratedResponses] = useState<string[]>([]);
  const rateLimiter = useRateLimiter();
  
  const handleGenerate = async () => {
    if (!reviewText.trim()) {
      toast({
        title: "Texto da avaliação é obrigatório",
        description: "Por favor, insira o texto da avaliação para gerar respostas.",
        variant: "destructive",
      });
      return;
    }
    
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
          const mockResponses = getMockReviewResponses(reviewType, reviewText);
          setGeneratedResponses(mockResponses);
          setLoading(false);
          rateLimiter.recordGeneration();
          toast({
            title: "Respostas geradas com dados de exemplo",
            description: "Para obter respostas personalizadas, configure sua API key nas configurações.",
          });
        }, 1000);
        return;
      }

      const responses = await generateReviewResponses({
        businessInfo,
        reviewType: reviewType as "positive" | "negative" | "question" | "general",
        reviewText,
        tone,
        language
      });
      
      setGeneratedResponses(responses);
      rateLimiter.recordGeneration();
      toast({
        title: "Respostas geradas com sucesso!",
        description: "Confira as sugestões abaixo e escolha a que mais combina com seu negócio.",
      });
    } catch (error) {
      console.error("Error generating review responses:", error);
      toast({
        title: "Erro ao gerar respostas",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao gerar as respostas. Por favor, tente novamente.",
        variant: "destructive",
      });
      
      const mockResponses = getMockReviewResponses(reviewType, reviewText);
      setGeneratedResponses(mockResponses);
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
      <CardHeader className="bg-gradient-to-r from-green-600 to-green-700 dark:from-green-700 dark:to-green-900 text-white rounded-t-lg">
        <CardTitle className="text-xl md:text-2xl flex items-center justify-center gap-2">
          <MessageCircle className="h-6 w-6" />
          Gerador de Respostas para Avaliações
        </CardTitle>
        <CardDescription className="text-green-100">
          Crie respostas profissionais para as avaliações do seu negócio no Google
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-6 space-y-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="review-type">Tipo de Avaliação</Label>
            <Select 
              value={reviewType} 
              onValueChange={setReviewType}
            >
              <SelectTrigger className="border-green-200 dark:border-green-800 focus:ring-green-500">
                <SelectValue placeholder="Selecione o tipo de avaliação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="positive" className="flex items-center gap-2">
                  <ThumbsUp size={16} className="text-green-500" /> Positiva
                </SelectItem>
                <SelectItem value="negative" className="flex items-center gap-2">
                  <ThumbsDown size={16} className="text-red-500" /> Negativa
                </SelectItem>
                <SelectItem value="question" className="flex items-center gap-2">
                  <HelpCircle size={16} className="text-blue-500" /> Pergunta
                </SelectItem>
                <SelectItem value="general" className="flex items-center gap-2">
                  <MessageCircle size={16} className="text-gray-500" /> Geral
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="review-text">Texto da Avaliação</Label>
            <Textarea
              id="review-text"
              placeholder="Cole aqui o texto da avaliação que você recebeu..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              className="min-h-[100px] border-green-200 dark:border-green-800 focus:ring-green-500"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tone">Tom da Resposta</Label>
              <Select 
                value={tone} 
                onValueChange={setTone}
              >
                <SelectTrigger className="border-green-200 dark:border-green-800 focus:ring-green-500">
                  <SelectValue placeholder="Selecione o tom" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="friendly">Amigável</SelectItem>
                  <SelectItem value="professional">Profissional</SelectItem>
                  <SelectItem value="grateful">Agradecido</SelectItem>
                  <SelectItem value="apologetic">Apologético</SelectItem>
                  <SelectItem value="helpful">Prestativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="language">Idioma</Label>
              <Select 
                value={language} 
                onValueChange={setLanguage}
              >
                <SelectTrigger className="border-green-200 dark:border-green-800 focus:ring-green-500">
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
            disabled={loading || !reviewText.trim()}
            className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 transition-all duration-300 text-white font-medium py-6 rounded-lg shadow-lg"
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Gerando Respostas...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2">
                <Sparkles className="h-5 w-5" />
                <span>Gerar Respostas</span>
              </div>
            )}
          </Button>
        </div>
        
        {generatedResponses.length > 0 && (
          <div className="mt-6 space-y-4">
            <h3 className="text-lg font-semibold text-green-800 dark:text-green-300">Respostas Sugeridas</h3>
            {generatedResponses.map((response, index) => (
              <div key={index} className="border border-green-200 dark:border-green-800 p-4 rounded-md bg-white dark:bg-slate-800 shadow-md">
                <div className="whitespace-pre-line text-sm text-gray-700 dark:text-gray-300">
                  {response}
                </div>
                <div className="flex justify-end mt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => copyToClipboard(response)}
                    className="hover:bg-green-100 dark:hover:bg-green-900 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300"
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

export default ReviewResponseGenerator;
