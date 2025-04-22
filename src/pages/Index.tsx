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
  MapPin, Globe, Phone, ImageIcon, Loader2, Settings, MessageCircle,
  LightbulbIcon, Star, Share2, Check
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { ThemeToggle } from "@/components/ThemeToggle";
import SettingsModal from "@/components/SettingsModal";
import { generatePostsWithGemini, getMockPosts } from "@/services/geminiService";
import { Instagram } from 'lucide-react';

function gerarPalavrasChave(categoria: string) {
  if (!categoria) return [];
  const termos = categoria.toLowerCase();
  if (termos.includes("supermercado")) {
    return [
      { termo: "supermercado", motivo: "Aumenta a relevância local nas buscas sobre mercados." },
      { termo: "produtos frescos", motivo: "Valoriza alimentos frescos, muito buscados no setor." },
      { termo: "ofertas", motivo: "Atrai público que busca promoções." },
    ];
  }
  if (termos.includes("restaurante")) {
    return [
      { termo: "restaurante", motivo: "Aparece em buscas gerais de comida fora." },
      { termo: "delivery", motivo: "Foco no serviço de entrega, aumenta visibilidade no Google." },
      { termo: "almoço", motivo: "Busca muito comum para refeições rápidas." },
    ];
  }
  return [
    { termo: categoria, motivo: "Termo exato para buscas diretas do nicho." },
    { termo: "melhor da região", motivo: "Expressão genérica, mas muito buscada em avaliações." },
  ];
}

function GMBPostPreview({
  post,
  nomeEmpresa,
  categoria,
  visualizacao,
  endereco,
}: {
  post: string;
  nomeEmpresa: string;
  categoria: string;
  visualizacao: "desktop" | "mobile";
  endereco: string;
}) {
  return (
    <div
      className={`rounded-lg shadow-lg border border-blue-300 dark:border-blue-800
        mx-auto my-2 p-0 bg-gradient-to-br from-blue-100 to-white dark:from-blue-950 dark:to-slate-900
        transition-all duration-300
        ${visualizacao === "mobile" ? "max-w-[370px]" : "max-w-2xl"}
        relative overflow-hidden`}
      style={visualizacao === "mobile"
        ? { minHeight: 370, borderRadius: 18, borderWidth: 2 }
        : { minHeight: 200, borderRadius: 20 }
      }
    >
      <div className="flex items-center gap-3 px-4 pt-3 pb-1">
        <div className="rounded-full bg-blue-700/90 dark:bg-blue-500/90 w-10 h-10 flex items-center justify-center text-white font-bold text-xl">
          {nomeEmpresa ? nomeEmpresa[0] : <span>?</span>}
        </div>
        <div>
          <div className="font-semibold text-blue-900 dark:text-blue-200 text-base">{nomeEmpresa || "Sua Empresa"}</div>
          <div className="text-blue-700 dark:text-blue-300 text-xs">{categoria || "Categoria"}</div>
        </div>
      </div>
      <div className="px-4 py-2 text-blue-900 dark:text-blue-100 text-sm whitespace-pre-wrap">
        {post}
      </div>
      <div className="px-4 pb-3 pt-1 flex items-center gap-2 text-xs text-blue-800 dark:text-blue-300">
        <span className="truncate"><strong>Local:</strong> {endereco || "Endereço da Empresa"}</span>
      </div>
      {visualizacao === "mobile" && (
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-blue-200 rounded-t-lg" />
      )}
    </div>
  );
}

function PalavrasChaveDestaque({ categoria }: { categoria: string }) {
  const palavras = gerarPalavrasChave(categoria);
  if (!palavras?.length) return null;
  return (
    <div className="my-4 bg-blue-50 dark:bg-slate-800/40 p-3 rounded-md border border-blue-200 dark:border-blue-700 shadow-inner">
      <div className="font-semibold text-blue-900 dark:text-blue-100 mb-1 text-sm flex items-center gap-1">
        🔑 Palavras-chave recomendadas para o seu nicho
      </div>
      <ul className="list-disc list-inside space-y-1 ml-2">
        {palavras.map((kw, i) => (
          <li key={i} className="text-blue-800 dark:text-blue-200 text-xs">
            <span className="font-bold">{kw.termo}</span> — <span className="italic">{kw.motivo}</span>
          </li>
        ))}
      </ul>
      <div className="text-xs mt-2 text-blue-700 dark:text-blue-300">
        Use essas palavras no texto dos seus posts para ajudar seu negócio a ser encontrado mais facilmente no Google.
      </div>
    </div>
  );
}

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
  const [visualizacao, setVisualizacao] = useState<"desktop" | "mobile">("desktop");
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
            className="rounded-full w-10 h-10 bg-white/80 dark:bg-slate-800 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900 transition-all shadow-md animate-pulse"
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
                <div className="mt-4 flex gap-3 justify-center">
                  <Button
                    variant={visualizacao === "desktop" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setVisualizacao("desktop")}
                    className={visualizacao === "desktop" ? "bg-blue-800 text-white" : ""}
                  >
                    Desktop
                  </Button>
                  <Button
                    variant={visualizacao === "mobile" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setVisualizacao("mobile")}
                    className={visualizacao === "mobile" ? "bg-blue-500 text-white" : ""}
                  >
                    Mobile
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 md:space-y-6 p-4 md:p-6 dark:bg-slate-900/80">
                <PalavrasChaveDestaque categoria={businessInfo.category} />
                {generatedPosts.map((post, index) => (
                  <div key={index} className="border border-blue-200 dark:border-blue-800 p-3 md:p-4 rounded-md bg-white dark:bg-slate-800 shadow-md hover:shadow-lg transition-all animate-fade-in" style={{animationDelay: `${0.5 + index * 0.2}s`}}>
                    <GMBPostPreview
                      post={post}
                      nomeEmpresa={businessInfo.name}
                      categoria={businessInfo.category}
                      visualizacao={visualizacao}
                      endereco={businessInfo.address}
                    />
                    <div className="flex justify-end gap-2 mt-3">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => copyToClipboard(post)}
                        className="hover:bg-blue-100 dark:hover:bg-blue-900 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 flex items-center gap-1 text-xs md:text-sm h-8 px-2 md:px-3"
                      >
                        <Copy size={14} /> Copiar
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="flex items-center gap-1 h-8 px-2 md:px-3 bg-green-500 hover:bg-green-600 text-white"
                        onClick={() => {
                          const msg = encodeURIComponent(post);
                          window.open(`https://wa.me/?text=${msg}`, "_blank");
                        }}
                        title="Compartilhar no WhatsApp"
                      >
                        <MessageCircle size={14} />
                        <span className="sr-only md:not-sr-only">WhatsApp</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card className="w-full max-w-4xl animate-fade-in delay-500 gradient-card shadow-lg dark:border-blue-800 dark:bg-slate-900/80 glass-effect">
            <CardHeader className="bg-gradient-to-r from-blue-400 to-blue-700 dark:from-indigo-700 dark:to-blue-900 text-white rounded-t-lg p-4 md:p-6">
              <CardTitle className="text-xl md:text-2xl flex items-center justify-center gap-2 animate-float">
                <Sparkles size={isMobile ? 20 : 24} className="animate-pulse text-yellow-200" />
                <span className="tracking-wide">Dicas & Recomendações</span>
                <Sparkles size={isMobile ? 20 : 24} className="animate-pulse text-yellow-200" />
              </CardTitle>
              <CardDescription className="text-blue-100 text-sm md:text-base opacity-90">
                Maximize o impacto dos seus posts no Google Meu Negócio com estas sugestões práticas
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 md:p-2 dark:bg-slate-900/80">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 py-4 px-2">
                <div className="bg-gradient-to-br from-blue-100/80 to-white/80 dark:from-blue-900/40 dark:to-slate-800/70 backdrop-blur-md border border-blue-100 dark:border-blue-800 p-4 rounded-2xl shadow-md hover:shadow-xl transition hover:scale-105 flex flex-col gap-2 animate-fade-in">
                  <div className="flex items-center gap-2">
                    <LightbulbIcon size={18} className="text-blue-500 animate-pulse" />
                    <span className="font-bold text-blue-800 dark:text-blue-100 text-sm">Use Palavras-chave Locais</span>
                  </div>
                  <div className="text-xs md:text-sm text-blue-600 dark:text-blue-400 opacity-90 pl-6 flex gap-1 items-center">
                    <span>
                      Inclua <span className="font-semibold underline decoration-blue-400">nomes de bairros, cidades ou regiões</span> para impulsionar as buscas locais e atrair quem está por perto.
                    </span>
                    <Star size={14} className="ml-1 text-yellow-400" />
                  </div>
                </div>
                <div className="bg-gradient-to-br from-green-50/70 to-white/80 dark:from-blue-900/40 dark:to-slate-800/70 backdrop-blur-md border border-green-200 dark:border-blue-800 p-4 rounded-2xl shadow-md hover:shadow-xl transition hover:scale-105 flex flex-col gap-2 animate-fade-in delay-100">
                  <div className="flex items-center gap-2">
                    <MessageSquare size={18} className="text-green-700 dark:text-green-300 animate-fade-in" />
                    <span className="font-bold text-green-900 dark:text-green-200 text-sm">Incentive Interações</span>
                  </div>
                  <div className="text-xs md:text-sm text-green-900 dark:text-green-200 opacity-90 pl-6 flex gap-1 items-center">
                    <span>
                      Adicione <span className="font-semibold underline decoration-green-400">chamadas para ação (CTAs)</span> claras como "Reserve já!" ou "Fale conosco", tornando a comunicação mais engajadora.
                    </span>
                    <Share2 size={14} className="ml-1 text-green-500" />
                  </div>
                </div>
                <div className="bg-gradient-to-br from-yellow-100/90 to-white/80 dark:from-blue-900/40 dark:to-slate-800/70 backdrop-blur-md border border-yellow-200 dark:border-blue-800 p-4 rounded-2xl shadow-md hover:shadow-xl transition hover:scale-105 flex flex-col gap-2 animate-fade-in delay-200">
                  <div className="flex items-center gap-2">
                    <ImageIcon size={18} className="text-yellow-500" />
                    <span className="font-bold text-yellow-700 dark:text-yellow-300 text-sm">Adicione Conteúdo Visual</span>
                  </div>
                  <div className="text-xs md:text-sm text-yellow-900 dark:text-yellow-100 opacity-90 pl-6">
                    Imagens e vídeos de qualidade <span className="font-semibold">chamam atenção</span> e geram mais confiança, tornando seu perfil mais atrativo e profissional.
                  </div>
                </div>
                <div className="bg-gradient-to-br from-purple-100/90 to-white/80 dark:from-blue-900/40 dark:to-slate-800/70 backdrop-blur-md border border-purple-200 dark:border-blue-800 p-4 rounded-2xl shadow-md hover:shadow-xl transition hover:scale-105 flex flex-col gap-2 animate-fade-in delay-300">
                  <div className="flex items-center gap-2">
                    <Check size={18} className="text-purple-600 dark:text-purple-300" />
                    <span className="font-bold text-purple-800 dark:text-purple-100 text-sm">Monitore e Responda</span>
                  </div>
                  <div className="text-xs md:text-sm text-purple-900 dark:text-purple-100 opacity-90 pl-6">
                    Acompanhe comentários e <span className="font-semibold">responda rapidamente</span> para mostrar cuidado e aumentar o engajamento dos clientes.
                  </div>
                </div>
              </div>
              <div className="mt-2 pb-2 text-xs text-blue-700 dark:text-blue-300 text-center opacity-80 animate-fade-in delay-400">
                Fique atento às tendências e personalize sempre que possível. Pequenas mudanças podem gerar grandes resultados!
              </div>
            </CardContent>
          </Card>
          
          <div className="text-xs text-blue-500 dark:text-blue-400 mt-4 opacity-75">
            &copy; 2025 GMB Post Generator | Todos os direitos reservados
          </div>
        </div>
      </div>
      
      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />

      <footer className="text-center py-4 mt-8 bg-blue-50 dark:bg-slate-900 border-t border-blue-100 dark:border-slate-800">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          Idealizado por{' '}
          <a 
            href="https://www.instagram.com/arinelsonsantos" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="font-semibold hover:text-blue-900 dark:hover:text-blue-200 transition-colors flex items-center justify-center gap-1"
          >
            Arinelson Santos
            <Instagram size={16} className="inline-block" />
          </a>
        </p>
      </footer>
    </div>
  );
};

export default Index;
