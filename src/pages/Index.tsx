import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { 
  Copy, Sparkles, MessageSquare, Tag, Calendar, Info, Clock, 
  MapPin, Globe, Phone, ImageIcon, Loader2, Settings
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { ThemeToggle } from "@/components/ThemeToggle";
import SettingsModal from "@/components/SettingsModal";
import { generatePostsWithGemini, getMockPosts } from "@/services/geminiService";

const Index = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [postType, setPostType] = useState("update");
  const [businessInfo, setBusinessInfo] = useState({
    name: "",
    category: "",
    website: "",
    address: "",
    phone: "",
    hours: ""
  });
  const [tone, setTone] = useState("friendly");
  const [language, setLanguage] = useState("pt-BR");
  const [generatedPosts, setGeneratedPosts] = useState<string[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const isMobile = useIsMobile();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setBusinessInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    if (name === "tone") {
      setTone(value);
    } else if (name === "language") {
      setLanguage(value);
    } else if (name === "postType") {
      setPostType(value);
    }
  };

  const handleGeneratePosts = async () => {
    setLoading(true);
    try {
      const apiKey = localStorage.getItem("geminiApiKey");
      
      if (!apiKey) {
        setTimeout(() => {
          const mockPosts = getMockPosts(postType, businessInfo, tone, language);
          setGeneratedPosts(mockPosts);
          setLoading(false);
          toast({
            title: "Posts gerados com dados de exemplo",
            description: "Para obter posts personalizados, configure sua API key nas configurações.",
          });
        }, 1000);
        return;
      }

      const posts = await generatePostsWithGemini(postType, businessInfo, tone, language);
      setGeneratedPosts(posts);
      toast({
        title: "Posts gerados com sucesso!",
        description: "Confira as sugestões abaixo e escolha a que mais combina com seu negócio.",
      });
    } catch (error) {
      console.error("Error generating posts:", error);
      toast({
        title: "Erro ao gerar posts",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao gerar os posts. Por favor, tente novamente.",
        variant: "destructive",
      });
      
      const mockPosts = getMockPosts(postType, businessInfo, tone, language);
      setGeneratedPosts(mockPosts);
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white dark:from-blue-950 dark:to-slate-900 transition-colors duration-300">
      <div className="container px-4 py-6 md:py-10">
        <div className="flex justify-between mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSettingsOpen(true)}
            className="rounded-full w-10 h-10 bg-white/80 dark:bg-slate-800 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900 transition-all"
          >
            <Settings className="h-5 w-5 text-blue-700 dark:text-blue-400" />
            <span className="sr-only">Configurações</span>
          </Button>
          <ThemeToggle />
        </div>
        
        <div className="flex flex-col items-center justify-center space-y-6 md:space-y-8 text-center">
          <div className="animate-fade-in w-full">
            <h1 className="text-2xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-blue-400 dark:from-blue-400 dark:to-blue-200 bg-clip-text text-transparent animate-pulse">
              GMB Post Generator
            </h1>
            <p className="text-sm md:text-lg text-blue-700 dark:text-blue-300 mt-2 animate-fade-in delay-200 px-2">
              Gere posts personalizados para o Google Meu Negócio em segundos
            </p>
          </div>

          <Card className="w-full max-w-4xl gradient-card animate-fade-in delay-300 shadow-lg dark:border-blue-800 dark:bg-slate-900/80">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-700 dark:to-blue-900 text-white rounded-t-lg p-4 md:p-6">
              <CardTitle className="text-xl md:text-2xl flex items-center justify-center gap-2 animate-float">
                <Sparkles size={isMobile ? 20 : 24} className="animate-pulse text-yellow-200" />
                Configurações do Post
                <Sparkles size={isMobile ? 20 : 24} className="animate-pulse text-yellow-200" />
              </CardTitle>
              <CardDescription className="text-blue-100 text-sm md:text-base">
                Preencha as informações abaixo para gerar posts personalizados
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 md:p-6 dark:bg-slate-900/80">
              <Tabs defaultValue="post-type" className="w-full">
                <TabsList className="grid grid-cols-3 gap-2 mb-6 md:mb-8 w-full overflow-x-auto md:overflow-visible">
                  <TabsTrigger value="post-type" className="flex items-center justify-center gap-1 text-xs md:text-sm py-2 md:py-3 px-1 md:px-3">
                    <MessageSquare size={isMobile ? 14 : 18} /> <span className={isMobile ? "ml-1" : "ml-2"}>Tipo de Post</span>
                  </TabsTrigger>
                  <TabsTrigger value="business-info" className="flex items-center justify-center gap-1 text-xs md:text-sm py-2 md:py-3 px-1 md:px-3">
                    <Info size={isMobile ? 14 : 18} /> <span className={isMobile ? "ml-1" : "ml-2"}>Informações</span>
                  </TabsTrigger>
                  <TabsTrigger value="tone-format" className="flex items-center justify-center gap-1 text-xs md:text-sm py-2 md:py-3 px-1 md:px-3">
                    <Sparkles size={isMobile ? 14 : 18} /> <span className={isMobile ? "ml-1" : "ml-2"}>Tom e Formato</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="post-type" className="space-y-4 animate-fade-in">
                  <div className="space-y-2 p-2 md:p-4 bg-white/40 dark:bg-slate-800/40 rounded-lg">
                    <Label htmlFor="post-type" className="text-blue-700 dark:text-blue-300 font-medium text-sm md:text-base flex items-center gap-2">
                      <Tag size={16} className="animate-pulse" /> 
                      Selecione o tipo de post
                    </Label>
                    <Select 
                      value={postType} 
                      onValueChange={(value) => handleSelectChange("postType", value)}
                    >
                      <SelectTrigger className="border-blue-200 dark:border-blue-800 focus:ring-blue-500 md:h-12">
                        <SelectValue placeholder="Selecione o tipo de post" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="update" className="flex items-center gap-2">
                          <MessageSquare size={16} /> Updates (Atualizações Gerais)
                        </SelectItem>
                        <SelectItem value="offer" className="flex items-center gap-2">
                          <Tag size={16} /> Offers (Ofertas/Promoções)
                        </SelectItem>
                        <SelectItem value="event" className="flex items-center gap-2">
                          <Calendar size={16} /> Events (Eventos)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs md:text-sm text-blue-600 dark:text-blue-300 mt-3 bg-blue-50 dark:bg-blue-900/30 p-3 rounded-md shadow-inner">
                      {postType === "update" && "Informações gerais sobre o negócio, como novidades, serviços ou produtos."}
                      {postType === "offer" && "Anunciar descontos, promoções ou vendas especiais."}
                      {postType === "event" && "Promover eventos específicos, como workshops, feiras ou celebrações."}
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="business-info" className="space-y-4 animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 bg-white/40 dark:bg-slate-800/40 p-4 rounded-lg">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-blue-700 dark:text-blue-300 font-medium flex items-center gap-1 text-sm">
                        <Info size={14} className="animate-pulse" /> Nome da Empresa
                      </Label>
                      <Input
                        id="name"
                        name="name"
                        placeholder="Ex: Mercadinho Bela Vista"
                        value={businessInfo.name}
                        onChange={handleInputChange}
                        className="border-blue-200 dark:border-blue-800 focus:ring-blue-500 text-sm md:h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category" className="text-blue-700 dark:text-blue-300 font-medium flex items-center gap-1 text-sm">
                        <Tag size={14} className="animate-pulse" /> Categoria do Negócio
                      </Label>
                      <Input
                        id="category"
                        name="category"
                        placeholder="Ex: Supermercado, Restaurante, etc."
                        value={businessInfo.category}
                        onChange={handleInputChange}
                        className="border-blue-200 dark:border-blue-800 focus:ring-blue-500 text-sm md:h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="website" className="text-blue-700 dark:text-blue-300 font-medium flex items-center gap-1 text-sm">
                        <Globe size={14} className="animate-pulse" /> Website (opcional)
                      </Label>
                      <Input
                        id="website"
                        name="website"
                        placeholder="Ex: www.mercadinhobelavista.com"
                        value={businessInfo.website}
                        onChange={handleInputChange}
                        className="border-blue-200 dark:border-blue-800 focus:ring-blue-500 text-sm md:h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-blue-700 dark:text-blue-300 font-medium flex items-center gap-1 text-sm">
                        <Phone size={14} className="animate-pulse" /> Telefone (opcional)
                      </Label>
                      <Input
                        id="phone"
                        name="phone"
                        placeholder="Ex: (82) 99999-9999"
                        value={businessInfo.phone}
                        onChange={handleInputChange}
                        className="border-blue-200 dark:border-blue-800 focus:ring-blue-500 text-sm md:h-12"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="address" className="text-blue-700 dark:text-blue-300 font-medium flex items-center gap-1 text-sm">
                        <MapPin size={14} className="animate-pulse" /> Endereço Completo
                      </Label>
                      <Input
                        id="address"
                        name="address"
                        placeholder="Ex: Av. Eng. Corintho Campelo da Paz, N° 29 - Santos Dumont, Maceió"
                        value={businessInfo.address}
                        onChange={handleInputChange}
                        className="border-blue-200 dark:border-blue-800 focus:ring-blue-500 text-sm md:h-12"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="hours" className="text-blue-700 dark:text-blue-300 font-medium flex items-center gap-1 text-sm">
                        <Clock size={14} className="animate-pulse" /> Horário de Funcionamento
                      </Label>
                      <Input
                        id="hours"
                        name="hours"
                        placeholder="Ex: Segunda a Sábado: 8h às 22h | Domingo: Fechado"
                        value={businessInfo.hours}
                        onChange={handleInputChange}
                        className="border-blue-200 dark:border-blue-800 focus:ring-blue-500 text-sm md:h-12"
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="tone-format" className="space-y-4 animate-fade-in">
                  <div className="space-y-5 bg-white/40 dark:bg-slate-800/40 p-4 rounded-lg">
                    <div className="space-y-2">
                      <Label htmlFor="tone" className="text-blue-700 dark:text-blue-300 font-medium text-sm md:text-base flex items-center gap-2">
                        <Sparkles size={16} className="animate-pulse" /> Tom do Post
                      </Label>
                      <Select 
                        value={tone} 
                        onValueChange={(value) => handleSelectChange("tone", value)}
                      >
                        <SelectTrigger className="border-blue-200 dark:border-blue-800 focus:ring-blue-500 md:h-12">
                          <SelectValue placeholder="Selecione o tom" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="friendly">Amigável/Friendly</SelectItem>
                          <SelectItem value="brief">Curto/Breve</SelectItem>
                          <SelectItem value="promotional">Promocional</SelectItem>
                          <SelectItem value="funny">Engraçado/Humorístico</SelectItem>
                          <SelectItem value="detailed">Detalhado/Descritivo</SelectItem>
                          <SelectItem value="emoji">Com Ênfase em Emojis</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="language" className="text-blue-700 dark:text-blue-300 font-medium text-sm md:text-base flex items-center gap-2">
                        <Globe size={16} className="animate-pulse" /> Idioma
                      </Label>
                      <Select 
                        value={language} 
                        onValueChange={(value) => handleSelectChange("language", value)}
                      >
                        <SelectTrigger className="border-blue-200 dark:border-blue-800 focus:ring-blue-500 md:h-12">
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
                </TabsContent>
              </Tabs>

              <div className="mt-6 md:mt-8">
                <Button 
                  onClick={handleGeneratePosts} 
                  disabled={loading || !businessInfo.name || !businessInfo.category || !businessInfo.address}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 dark:from-blue-500 dark:to-indigo-600 dark:hover:from-blue-400 dark:hover:to-indigo-500 transition-all text-white font-medium py-6 rounded-lg shadow-lg hover:shadow-xl dark:shadow-blue-500/20 relative overflow-hidden group"
                >
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
                  
                  {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Gerando Posts...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <Sparkles className="h-5 w-5 animate-pulse" />
                      <span>Gerar Post</span>
                    </div>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {generatedPosts.length > 0 && (
            <Card className="w-full max-w-4xl animate-fade-in delay-400 shadow-lg border-blue-200 dark:border-blue-800 dark:bg-slate-900/80">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-700 dark:to-blue-900 text-white rounded-t-lg p-4 md:p-6">
                <CardTitle className="text-xl md:text-2xl flex items-center justify-center gap-2 animate-float">
                  <Sparkles size={isMobile ? 20 : 24} className="animate-pulse text-yellow-200" />
                  Sugestões de Posts
                  <Sparkles size={isMobile ? 20 : 24} className="animate-pulse text-yellow-200" />
                </CardTitle>
                <CardDescription className="text-blue-100 text-sm md:text-base">
                  Escolha uma das opções abaixo ou use como inspiração para criar seu próprio post
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 md:space-y-6 p-4 md:p-6 dark:bg-slate-900/80">
                {generatedPosts.map((post, index) => (
                  <div key={index} className="border border-blue-200 dark:border-blue-800 p-3 md:p-4 rounded-md bg-white dark:bg-slate-800 shadow-md hover:shadow-lg transition-all animate-fade-in" style={{animationDelay: `${0.5 + index * 0.2}s`}}>
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-1 text-sm md:text-base">
                        <Sparkles size={14} className="animate-pulse" /> Sugestão {index + 1}
                      </h3>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => copyToClipboard(post)}
                        className="hover:bg-blue-100 dark:hover:bg-blue-900 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 flex items-center gap-1 text-xs md:text-sm h-8 px-2 md:px-3"
                      >
                        <Copy size={14} /> Copiar
                      </Button>
                    </div>
                    <div className="whitespace-pre-wrap bg-blue-50 dark:bg-blue-900/30 p-3 md:p-4 rounded text-left border-l-4 border-blue-500 text-blue-800 dark:text-blue-200 text-xs md:text-sm overflow-x-auto">
                      {post}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card className="w-full max-w-4xl animate-fade-in delay-500 gradient-card shadow-lg dark:border-blue-800 dark:bg-slate-900/80">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-700 dark:to-blue-900 text-white rounded-t-lg p-4 md:p-6">
              <CardTitle className="text-xl md:text-2xl flex items-center justify-center gap-2 animate-float">
                <Sparkles size={isMobile ? 20 : 24} className="animate-pulse text-yellow-200" />
                Dicas e Recomendações
                <Sparkles size={isMobile ? 20 : 24} className="animate-pulse text-yellow-200" />
              </CardTitle>
              <CardDescription className="text-blue-100 text-sm md:text-base">
                Siga estas orientações para maximizar o impacto dos seus posts no Google Meu Negócio
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 md:p-6 dark:bg-slate-900/80">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                <div className="border border-blue-200 dark:border-blue-800 p-3 md:p-4 rounded-md bg-white dark:bg-slate-800 shadow hover:shadow-md transition-all hover:-translate-y-1">
                  <h3 className="font-semibold mb-1 md:mb-2 text-blue-700 dark:text-blue-300 flex items-center gap-1 text-sm">
                    <MapPin size={14} className="animate-pulse" /> Use Palavras-Chave Locais
                  </h3>
                  <p className="text-xs md:text-sm text-blue-600 dark:text-blue-400">
                    Inclua nomes de bairros, cidades ou regiões próximas para aumentar a visibilidade local.
                  </p>
                </div>
                <div className="border border-blue-200 dark:border-blue-800 p-3 md:p-4 rounded-md bg-white dark:bg-slate-800 shadow hover:shadow-md transition-all hover:-translate-y-1">
                  <h3 className="font-semibold mb-1 md:mb-2 text-blue-700 dark:text-blue-300 flex items-center gap-1 text-sm">
                    <MessageSquare size={14} className="animate-pulse" /> Incentive Interações
                  </h3>
                  <p className="text-xs md:text-sm text-blue-600 dark:text-blue-400">
                    Use chamadas para ação (CTAs) claras, como "Venha visitar!", "Reserve agora!" ou "Entre em contato".
                  </p>
                </div>
                <div className="border border-blue-200 dark:border-blue-800 p-3 md:p-4 rounded-md bg-white dark:bg-slate-800 shadow hover:shadow-md transition-all hover:-translate-y-1">
                  <h3 className="font-semibold mb-1 md:mb-2 text-blue-700 dark:text-blue-300 flex items-center gap-1 text-sm">
                    <ImageIcon size={14} className="animate-pulse" /> Adicione Conteúdo Visual
                  </h3>
                  <p className="text-xs md:text-sm text-blue-600 dark:text-blue-400">
                    Carregue fotos ou vídeos profissionais que mostrem produtos, serviços ou o ambiente da empresa.
                  </p>
                </div>
                <div className="border border-blue-200 dark:border-blue-800 p-3 md:p-4 rounded-md bg-white dark:bg-slate-800 shadow hover:shadow-md transition-all hover:-translate-y-1">
                  <h3 className="font-semibold mb-1 md:mb-2 text-blue-700 dark:text-blue-300 flex items-center gap-1 text-sm">
                    <MessageSquare size={14} className="animate-pulse" /> Monitore e Responda
                  </h3>
                  <p className="text-xs md:text-sm text-blue-600 dark:text-blue-400">
                    Após publicar o post, monitore comentários e responda rapidamente para engajar os clientes.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="text-xs text-blue-500 dark:text-blue-400 mt-4 opacity-75">
            &copy; 2025 GMB Post Generator | Todos os direitos reservados
          </div>
        </div>
      </div>
      
      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
};

export default Index;
