
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
  Copy, MessageSquare, Tag, Calendar, Info, Clock,
  MapPin, Globe, Phone, ImageIcon, Loader2, Settings, MessageCircle, Star, Share2, Check, Instagram, Sparkles, HelpCircle
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { ThemeToggle } from "@/components/ThemeToggle";
import SettingsModal from "@/components/SettingsModal";
import { generatePostsWithGemini, getMockPosts } from "@/services/geminiService";
import CountdownTimer from "@/components/CountdownTimer";
import { useRateLimiter } from "@/services/rateLimiterService";
import GMBDescriptionGenerator from "@/components/GMBDescriptionGenerator";
import GMBReviewReplyGenerator from "@/components/GMBReviewReplyGenerator";
import GMBQAGenerator from "@/components/GMBQAGenerator";

const fontFamilyVar = {
  fontFamily: "'Inter', 'Segoe UI', 'Helvetica Neue', Arial, 'sans-serif'",
};

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

function KeywordFilters({ value, onChange }: { value: string, onChange: (v: string) => void }) {
  return (
    <div className="flex gap-2 flex-wrap items-center my-2">
      <label className="text-xs font-semibold">Filtro:</label>
      <select
        className="p-1 rounded bg-blue-50 border text-xs shadow outline-none focus:border-blue-500 transition"
        value={value}
        onChange={e => onChange(e.target.value)}
      >
        <option value="">Todos</option>
        <option value="popular">Mais populares</option>
        <option value="local">Locais</option>
        <option value="promo">Promoções</option>
        <option value="outros">Outros</option>
      </select>
    </div>
  );
}

function PalavrasChaveDestaque({ categoria }: { categoria: string }) {
  const [filter, setFilter] = useState("");
  const palavras = gerarPalavrasChave(categoria);
  const filtradas = palavras.filter(kw => {
    if (!filter) return true;
    if (filter === "popular" && kw.termo.includes("melhor")) return true;
    if (filter === "local" && kw.termo.toLowerCase().includes("região")) return true;
    if (filter === "promo" && kw.termo.toLowerCase().includes("oferta")) return true;
    return false;
  });
  if (!palavras?.length) return null;

  return (
    <div style={fontFamilyVar} className="my-4 bg-gradient-to-br from-blue-50 to-blue-200 dark:from-slate-800/70 dark:to-blue-950/40 p-4 rounded-2xl border border-blue-200 dark:border-blue-700 shadow-xl shadow-blue-100/40 dark:shadow-blue-900/20 animate-fade-in hover:scale-105 hover:shadow-2xl transition-all duration-500">
      <div className="flex items-center gap-2 mb-2">
        <Tag size={18} className="text-blue-500 animate-fade-in" />
        <span className="font-bold text-blue-900 dark:text-blue-100 text-base drop-shadow">Palavras-chave recomendadas para o seu nicho</span>
      </div>
      <KeywordFilters value={filter} onChange={setFilter} />
      <ul className="flex flex-wrap gap-2 mt-2">
        {filtradas.map((kw, i) => (
          <li
            key={i}
            className="relative bg-blue-100/40 dark:bg-blue-900/20 group px-3 py-2 rounded-lg font-medium text-blue-800 dark:text-blue-200 text-xs shadow-inner cursor-pointer hover:scale-105 transition-transform duration-200 animate-fade-in"
          >
            <span className="font-bold">{kw.termo}</span>
            <span className="absolute top-1 right-1 opacity-50 text-xs">
              <Star className="inline-block" size={12} />
            </span>
            <div className="opacity-0 group-hover:opacity-100 absolute left-0 top-full mt-1 text-[11px] bg-white/90 dark:bg-blue-900/90 p-2 rounded shadow transition-all duration-300 w-60 z-10 pointer-events-none group-hover:pointer-events-auto">
              {kw.motivo}
            </div>
          </li>
        ))}
      </ul>
      <div className="text-xs mt-3 text-blue-700 dark:text-blue-300 italic animate-fade-in">
        Gere sugestões ainda melhores ao conectar uma IA em breve!
      </div>
    </div>
  );
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

const Dica = ({
  icon,
  title,
  children,
  delay,
  colorClass
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  delay?: number;
  colorClass?: string;
}) => (
  <div
    className={`relative flex flex-col gap-2 rounded-2xl bg-white/70 dark:bg-slate-800/70 border shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-400 animate-fade-in ${colorClass ?? ""}`}
    style={{
      boxShadow: "0 6px 24px 0 rgba(38,74,144,.08)",
      animationDelay: delay ? `${delay}ms` : undefined,
      ...fontFamilyVar
    }}
  >
    <div className="flex items-center gap-2 px-3 pt-4">
      <span className="bg-gradient-to-br from-blue-100 via-blue-300 to-blue-500 dark:from-blue-900/30 dark:to-blue-800/70 p-3 rounded-full shadow animate-scale-in">
        {icon}
      </span>
      <span className="font-bold text-blue-900 dark:text-blue-100 drop-shadow-sm text-base">{title}</span>
    </div>
    <div className="px-6 pb-4 text-[13px] md:text-sm text-blue-800 dark:text-blue-300 opacity-85">
      {children}
    </div>
    <span className="absolute right-2 bottom-2 opacity-10 pointer-events-none animate-pulse">{icon}</span>
  </div>
);

const DICAS = [
  {
    icon: <Tag size={19} className="text-blue-500" />,
    title: "Use Palavras-chave Locais",
    color: "",
    text: (
      <>
        Inclua nomes de bairros, cidades ou regiões para impulsionar as <span className="font-semibold underline decoration-blue-400">buscas locais</span> e atrair quem está por perto.
      </>
    )
  },
  {
    icon: <MessageSquare size={19} className="text-green-600" />,
    title: "Incentive Interações",
    color: "border-green-100 dark:border-green-600/40",
    text: (
      <>
        Adicione <span className="font-semibold underline decoration-green-400">chamadas para ação</span> como “Reserve já!” ou “Fale conosco” para tornar a comunicação mais engajadora.
      </>
    )
  },
  {
    icon: <ImageIcon size={19} className="text-yellow-600" />,
    title: "Adicione Conteúdo Visual",
    color: "border-yellow-100 dark:border-yellow-700/40",
    text: (
      <>
        Imagens e vídeos de qualidade <span className="font-semibold">chamam atenção</span>
        {' '}<span className="hidden md:inline-block">e geram mais confiança</span>, tornando <span className="font-semibold">seu perfil mais atrativo</span>.
      </>
    )
  },
  {
    icon: <Check size={19} className="text-purple-600" />,
    title: "Monitore e Responda",
    color: "border-purple-100 dark:border-purple-700/40",
    text: (
      <>
        Acompanhe comentários e <span className="font-semibold">responda rapidamente</span> para mostrar cuidado e aumentar <span className="font-semibold">o engajamento</span>.
      </>
    )
  }
];

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
  const [cooldownTime, setCooldownTime] = useState(0);
  const isMobile = useIsMobile();
  const rateLimiter = useRateLimiter();

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

  const updateCooldown = () => {
    const { cooldown } = rateLimiter.getRemainingTime();
    setCooldownTime(cooldown);
  };

  useEffect(() => {
    updateCooldown();
    const interval = setInterval(updateCooldown, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleGeneratePosts = async () => {
    const rateLimit = rateLimiter.canGeneratePosts();
    
    if (!rateLimit.allowed) {
      if (rateLimit.dailyRemaining !== undefined && rateLimit.dailyRemaining <= 0) {
        toast({
          title: "Limite diário atingido",
          description: "Você atingiu o limite de 30 posts diários. Tente novamente amanhã.",
          variant: "destructive",
        });
        return;
      }
      
      if (rateLimit.remainingTime) {
        setCooldownTime(rateLimit.remainingTime);
        toast({
          title: "Aguarde um momento",
          description: `Por favor, aguarde ${Math.ceil(rateLimit.remainingTime / 1000)} segundos antes de gerar novos posts.`,
        });
        return;
      }
    }
    
    setLoading(true);
    try {
      const apiKey = localStorage.getItem("geminiApiKey");
      
      if (!apiKey) {
        setTimeout(() => {
          const mockPosts = getMockPosts(postType, businessInfo, tone, language);
          setGeneratedPosts(mockPosts);
          setLoading(false);
          rateLimiter.recordGeneration();
          updateCooldown();
          toast({
            title: "Posts gerados com dados de exemplo",
            description: "Para obter posts personalizados, configure sua API key nas configurações.",
          });
        }, 1000);
        return;
      }

      const posts = await generatePostsWithGemini(postType, businessInfo, tone, language);
      setGeneratedPosts(posts);
      rateLimiter.recordGeneration();
      updateCooldown();
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

  const rateLimit = rateLimiter.canGeneratePosts();
  const dailyPostsRemaining = rateLimit.dailyRemaining !== undefined ? rateLimit.dailyRemaining : 30;

  // ATENÇÃO: Layout centralizado com campos do negócio PRIMEIRO, e abaixo as abas dos geradores
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white dark:from-blue-950 dark:to-slate-900 transition-colors duration-500" style={{ fontFamily: "'Inter', 'Segoe UI', 'Helvetica Neue', Arial, 'sans-serif'" }}>
      <div className="container px-2 py-4 md:py-10">
        <div className="flex justify-between mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSettingsOpen(true)}
            className="rounded-full w-10 h-10 bg-white/80 dark:bg-slate-800 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900 transition-all duration-300 shadow-md animate-pulse hover:animate-none"
          >
            <Sparkles className="h-5 w-5 text-blue-700 dark:text-blue-400" />
            <span className="sr-only">Configurações</span>
          </Button>
          <ThemeToggle />
        </div>

        <Card className="mx-auto mb-8 w-full max-w-xl md:max-w-2xl gradient-card animate-fade-in shadow-lg dark:border-blue-800 dark:bg-slate-900/80">
          <CardHeader className="text-center bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-700 dark:to-blue-900 text-white rounded-t-lg p-4 md:p-6">
            <CardTitle className="flex items-center justify-center gap-2 text-2xl md:text-3xl font-bold animate-float">
              <Sparkles size={24} className="animate-pulse text-yellow-200" />
              Central de Geração GMB
              <Sparkles size={24} className="animate-pulse text-yellow-200" />
            </CardTitle>
            <CardDescription className="text-blue-100 text-sm md:text-base">
              Preencha suas informações uma vez e utilize todos os geradores.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            {/* Campos compartilhados do negócio */}
            <form className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome da Empresa</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Ex: Mercadinho Bela Vista"
                    value={businessInfo.name}
                    onChange={e => setBusinessInfo(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="category">Categoria</Label>
                  <Input
                    id="category"
                    name="category"
                    placeholder="Ex: Supermercado"
                    value={businessInfo.category}
                    onChange={e => setBusinessInfo(prev => ({ ...prev, category: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    name="website"
                    placeholder="www.suaempresa.com"
                    value={businessInfo.website}
                    onChange={e => setBusinessInfo(prev => ({ ...prev, website: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    placeholder="(DD) 99999-9999"
                    value={businessInfo.phone}
                    onChange={e => setBusinessInfo(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="address">Endereço</Label>
                  <Input
                    id="address"
                    name="address"
                    placeholder="Endereço completo"
                    value={businessInfo.address}
                    onChange={e => setBusinessInfo(prev => ({ ...prev, address: e.target.value }))}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="hours">Horário</Label>
                  <Input
                    id="hours"
                    name="hours"
                    placeholder="Ex: Seg-Sab 8h-22h"
                    value={businessInfo.hours}
                    onChange={e => setBusinessInfo(prev => ({ ...prev, hours: e.target.value }))}
                  />
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Abas de seleção dos geradores */}
        <Tabs defaultValue="posts" className="w-full max-w-4xl mx-auto animate-fade-in delay-300">
          <TabsList className="grid grid-cols-4 gap-1 mb-4 w-full overflow-x-auto">
            <TabsTrigger value="posts" className="flex items-center justify-center gap-2">
              <MessageSquare size={18}/> Posts
            </TabsTrigger>
            <TabsTrigger value="desc" className="flex items-center justify-center gap-2">
              <FileText size={18}/> Descrição
            </TabsTrigger>
            <TabsTrigger value="review" className="flex items-center justify-center gap-2">
              <Sparkles size={18}/> Respostas de Avaliações
            </TabsTrigger>
            <TabsTrigger value="qa" className="flex items-center justify-center gap-2">
              <HelpCircle size={18}/> Perguntas & Respostas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts">
            <div className="min-h-[50vh] bg-gradient-to-br from-blue-50 to-white dark:from-blue-950 dark:to-slate-900 transition-colors duration-500" style={fontFamilyVar}>
              <div className="container px-4 py-6 md:py-10">
                <div className="flex flex-col items-center justify-center space-y-6 md:space-y-8 text-center">
                  <div className="animate-fade-in w-full">
                    <h1 className="text-2xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-blue-400 dark:from-blue-400 dark:to-blue-200 bg-clip-text text-transparent animate-pulse">
                      GMB Post Generator
                    </h1>
                    <p className="text-sm md:text-lg text-blue-700 dark:text-blue-300 mt-2 animate-fade-in delay-200 px-2 font-light tracking-wide">
                      Gere posts personalizados para o Google Meu Negócio em segundos
                    </p>
                  </div>

                  <Card className="w-full max-w-4xl gradient-card animate-fade-in delay-300 shadow-lg dark:border-blue-800 dark:bg-slate-900/80 transform transition-all duration-300 hover:shadow-xl">
                    <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-700 dark:to-blue-900 text-white rounded-t-lg p-4 md:p-6">
                      <CardTitle className="text-xl md:text-2xl flex items-center justify-center gap-2 animate-float">
                        <Sparkles size={isMobile ? 20 : 24} className="animate-pulse text-yellow-200" />
                        Configurações do Post
                        <Sparkles size={isMobile ? 20 : 24} className="animate-pulse text-yellow-200" />
                      </CardTitle>
                      <CardDescription className="text-blue-100 text-sm md:text-base">
                        Preencha as informações abaixo para gerar posts personalizados
                      </CardDescription>
                      <div className="mt-2 text-xs font-medium text-blue-100">
                        <span className="bg-blue-800/50 px-2 py-1 rounded-full inline-flex items-center gap-1 shadow-inner">
                          <Clock size={12} /> Restantes hoje: <span className="font-bold">{dailyPostsRemaining}</span> posts
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 md:p-6 dark:bg-slate-900/80">
                      <Tabs defaultValue="post-type" className="w-full">
                        <TabsList className="grid grid-cols-3 gap-2 mb-6 md:mb-8 w-full overflow-x-auto md:overflow-visible">
                          <TabsTrigger value="post-type" className="flex items-center justify-center gap-1 text-xs md:text-sm py-2 md:py-3 px-1 md:px-3 transition-all duration-300 data-[state=active]:shadow-md">
                            <MessageSquare size={isMobile ? 14 : 18} /> <span className={isMobile ? "ml-1" : "ml-2"}>Tipo de Post</span>
                          </TabsTrigger>
                          <TabsTrigger value="business-info" className="flex items-center justify-center gap-1 text-xs md:text-sm py-2 md:py-3 px-1 md:px-3 transition-all duration-300 data-[state=active]:shadow-md">
                            <Info size={isMobile ? 14 : 18} /> <span className={isMobile ? "ml-1" : "ml-2"}>Informações</span>
                          </TabsTrigger>
                          <TabsTrigger value="tone-format" className="flex items-center justify-center gap-1 text-xs md:text-sm py-2 md:py-3 px-1 md:px-3 transition-all duration-300 data-[state=active]:shadow-md">
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
                          </div>
                        </TabsContent>

                        <TabsContent value="tone-format" className="space-y-4 animate-fade-in">
                          <div className="bg-white/40 dark:bg-slate-800/40 p-4 rounded-lg">
                            <div className="space-y-2 mb-4">
                              <Label className="text-blue-700 dark:text-blue-300 font-medium flex items-center gap-1 text-sm">
                                <Sparkles size={14} className="animate-pulse" /> Tom da mensagem
                              </Label>
                              <Select 
                                value={tone} 
                                onValueChange={(value) => handleSelectChange("tone", value)}
                              >
                                <SelectTrigger className="border-blue-200 dark:border-blue-800 focus:ring-blue-500 md:h-12">
                                  <SelectValue placeholder="Selecione o tom da mensagem" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="friendly">Amigável e Conversacional</SelectItem>
                                  <SelectItem value="promotional">Promocional e Chamativo</SelectItem>
                                  <SelectItem value="professional">Profissional e Informativo</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="space-y-2">
                              <Label className="text-blue-700 dark:text-blue-300 font-medium flex items-center gap-1 text-sm">
                                <Globe size={14} className="animate-pulse" /> Idioma
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
                                  <SelectItem value="en-US">English (US)</SelectItem>
                                  <SelectItem value="es-ES">Español</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <PalavrasChaveDestaque categoria={businessInfo.category} />
                          
                          <div className="flex justify-center mt-8">
                            <Button
                              size="lg"
                              className="w-full max-w-md bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold py-6 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center gap-2 text-base"
                              onClick={handleGeneratePosts}
                              disabled={loading || cooldownTime > 0 || !businessInfo.name || !businessInfo.category || !businessInfo.address}
                            >
                              {loading ? (
                                <>
                                  <Loader2 className="h-5 w-5 animate-spin" />
                                  Gerando posts...
                                </>
                              ) : cooldownTime > 0 ? (
                                <>
                                  <Clock className="h-5 w-5" />
                                  Aguarde <CountdownTimer seconds={Math.ceil(cooldownTime / 1000)} />
                                </>
                              ) : (
                                <>
                                  <Sparkles className="h-5 w-5" />
                                  Gerar Posts GMB
                                </>
                              )}
                            </Button>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>

                  {generatedPosts.length > 0 && (
                    <div className="w-full space-y-8 mt-8 mb-16">
                      <div className="bg-gradient-to-r from-blue-200/50 via-blue-300/30 to-blue-200/50 dark:from-blue-900/30 dark:via-blue-800/20 dark:to-blue-900/30 py-2 px-4 rounded-full mx-auto max-w-fit text-blue-800 dark:text-blue-200 flex items-center justify-center gap-2 shadow-inner">
                        <MessageSquare size={16} />
                        <span className="text-sm font-medium">Posts Gerados</span>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-8">
                        {generatedPosts.map((post, index) => (
                          <div key={index} className="relative group transition-all duration-300">
                            <GMBPostPreview
                              post={post}
                              nomeEmpresa={businessInfo.name}
                              categoria={businessInfo.category}
                              visualizacao={visualizacao}
                              endereco={businessInfo.address}
                            />
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="bg-white/80 dark:bg-slate-800/80 rounded-full w-8 h-8 p-0 shadow-lg"
                                onClick={() => copyToClipboard(post)}
                              >
                                <Copy size={14} className="text-blue-700 dark:text-blue-300" />
                                <span className="sr-only">Copiar</span>
                              </Button>
                            </div>
                            <div className="flex justify-center mt-3 gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs"
                                onClick={() => setVisualizacao(visualizacao === "desktop" ? "mobile" : "desktop")}
                              >
                                Visualizar como {visualizacao === "desktop" ? "Mobile" : "Desktop"}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs"
                                onClick={() => copyToClipboard(post)}
                              >
                                <Copy size={14} className="mr-1" /> Copiar
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {!loading && generatedPosts.length === 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 max-w-4xl mx-auto">
                      {DICAS.map((dica, index) => (
                        <Dica
                          key={index}
                          icon={dica.icon}
                          title={dica.title}
                          colorClass={dica.color}
                          delay={index * 150}
                        >
                          {dica.text}
                        </Dica>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="desc">
            <GMBDescriptionGenerator businessInfo={businessInfo} language={language} />
          </TabsContent>
          
          <TabsContent value="review">
            <GMBReviewReplyGenerator businessInfo={businessInfo} language={language} />
          </TabsContent>
          
          <TabsContent value="qa">
            <GMBQAGenerator businessInfo={businessInfo} language={language} />
          </TabsContent>
        </Tabs>
      </div>
      
      <SettingsModal
        open={settingsOpen}
        setOpen={setSettingsOpen}
      />
    </div>
  );
};

export default Index;
