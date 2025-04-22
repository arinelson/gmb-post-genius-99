
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Copy, FileText, Loader2, Sparkles, Plus, X } from "lucide-react";
import { generateBusinessDescriptions, getMockBusinessDescriptions } from "@/services/gmbGeneratorService";
import { useRateLimiter } from "@/services/rateLimiterService";

interface BusinessInfo {
  name: string;
  category: string;
  website: string;
  address: string;
  phone: string;
  hours: string;
}

interface BusinessDescriptionGeneratorProps {
  businessInfo: BusinessInfo;
}

const BusinessDescriptionGenerator = ({ businessInfo }: BusinessDescriptionGeneratorProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [tone, setTone] = useState("professional");
  const [language, setLanguage] = useState("pt-BR");
  const [featureInput, setFeatureInput] = useState("");
  const [features, setFeatures] = useState<string[]>([]);
  const [generatedDescriptions, setGeneratedDescriptions] = useState<string[]>([]);
  const rateLimiter = useRateLimiter();
  
  const addFeature = () => {
    if (featureInput.trim() && !features.includes(featureInput.trim())) {
      setFeatures([...features, featureInput.trim()]);
      setFeatureInput("");
    }
  };
  
  const removeFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };
  
  const handleGenerate = async () => {
    if (features.length === 0) {
      toast({
        title: "Adicione pelo menos uma característica",
        description: "Adicione pontos fortes ou destaques do seu negócio para gerar uma descrição mais precisa.",
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
          const mockDescriptions = getMockBusinessDescriptions();
          setGeneratedDescriptions(mockDescriptions);
          setLoading(false);
          rateLimiter.recordGeneration();
          toast({
            title: "Descrições geradas com dados de exemplo",
            description: "Para obter descrições personalizadas, configure sua API key nas configurações.",
          });
        }, 1000);
        return;
      }

      const descriptions = await generateBusinessDescriptions({
        businessInfo,
        featureHighlights: features,
        tone,
        language
      });
      
      setGeneratedDescriptions(descriptions);
      rateLimiter.recordGeneration();
      toast({
        title: "Descrições geradas com sucesso!",
        description: "Confira as sugestões abaixo e escolha a que mais combina com seu negócio.",
      });
    } catch (error) {
      console.error("Error generating business descriptions:", error);
      toast({
        title: "Erro ao gerar descrições",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao gerar as descrições. Por favor, tente novamente.",
        variant: "destructive",
      });
      
      const mockDescriptions = getMockBusinessDescriptions();
      setGeneratedDescriptions(mockDescriptions);
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
      <CardHeader className="bg-gradient-to-r from-purple-600 to-purple-700 dark:from-purple-700 dark:to-purple-900 text-white rounded-t-lg">
        <CardTitle className="text-xl md:text-2xl flex items-center justify-center gap-2">
          <FileText className="h-6 w-6" />
          Gerador de Descrições para GMB
        </CardTitle>
        <CardDescription className="text-purple-100">
          Crie descrições otimizadas para SEO para o seu perfil do Google Meu Negócio
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-6 space-y-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="features">Características do Negócio</Label>
            <div className="flex space-x-2">
              <Input
                id="features"
                placeholder="Ex: Atendimento personalizado, Produtos orgânicos..."
                value={featureInput}
                onChange={(e) => setFeatureInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addFeature()}
                className="border-purple-200 dark:border-purple-800 focus:ring-purple-500"
              />
              <Button 
                type="button" 
                onClick={addFeature}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Plus size={16} />
              </Button>
            </div>
            
            {features.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300 px-3 py-1 rounded-full text-sm">
                    {feature}
                    <button 
                      onClick={() => removeFeature(index)}
                      className="ml-2 text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-200"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tone">Tom da Descrição</Label>
              <Select 
                value={tone} 
                onValueChange={setTone}
              >
                <SelectTrigger className="border-purple-200 dark:border-purple-800 focus:ring-purple-500">
                  <SelectValue placeholder="Selecione o tom" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Profissional</SelectItem>
                  <SelectItem value="friendly">Amigável</SelectItem>
                  <SelectItem value="authoritative">Autoritativo</SelectItem>
                  <SelectItem value="informative">Informativo</SelectItem>
                  <SelectItem value="persuasive">Persuasivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="language">Idioma</Label>
              <Select 
                value={language} 
                onValueChange={setLanguage}
              >
                <SelectTrigger className="border-purple-200 dark:border-purple-800 focus:ring-purple-500">
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
            disabled={loading || features.length === 0}
            className="w-full bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 transition-all duration-300 text-white font-medium py-6 rounded-lg shadow-lg"
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Gerando Descrições...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2">
                <Sparkles className="h-5 w-5" />
                <span>Gerar Descrições</span>
              </div>
            )}
          </Button>
        </div>
        
        {generatedDescriptions.length > 0 && (
          <div className="mt-6 space-y-4">
            <h3 className="text-lg font-semibold text-purple-800 dark:text-purple-300">Descrições Sugeridas</h3>
            {generatedDescriptions.map((description, index) => (
              <div key={index} className="border border-purple-200 dark:border-purple-800 p-4 rounded-md bg-white dark:bg-slate-800 shadow-md">
                <div className="whitespace-pre-line text-sm text-gray-700 dark:text-gray-300">
                  {description}
                </div>
                <div className="flex justify-end mt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => copyToClipboard(description)}
                    className="hover:bg-purple-100 dark:hover:bg-purple-900 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300"
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

export default BusinessDescriptionGenerator;
