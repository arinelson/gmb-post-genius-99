
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Settings, Info, Key, ExternalLink } from "lucide-react";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SettingsModal = ({ open, onOpenChange }: SettingsModalProps) => {
  const [apiKey, setApiKey] = useState<string>("");

  useEffect(() => {
    // Load the API key from localStorage when the component mounts
    const savedApiKey = localStorage.getItem("geminiApiKey");
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
  }, []);

  const saveApiKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem("geminiApiKey", apiKey.trim());
      toast.success("API Key salva com sucesso!");
    } else {
      localStorage.removeItem("geminiApiKey");
      toast.error("API Key removida.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-white dark:bg-slate-900 border-blue-200 dark:border-blue-800">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2 text-blue-700 dark:text-blue-300">
            <Settings className="h-5 w-5" /> Configurações
          </DialogTitle>
          <DialogDescription className="text-blue-600 dark:text-blue-400">
            Configure sua API para gerar posts personalizados
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="api" className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="api" className="flex items-center gap-1">
              <Key size={14} /> API Key
            </TabsTrigger>
            <TabsTrigger value="tutorial" className="flex items-center gap-1">
              <Info size={14} /> Tutorial
            </TabsTrigger>
          </TabsList>

          <TabsContent value="api" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="api-key" className="text-blue-700 dark:text-blue-300">
                Google (Gemini) API Key
              </Label>
              <Input
                id="api-key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Insira sua API key aqui"
                className="border-blue-200 dark:border-blue-800"
              />
              <p className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 p-2 rounded">
                A API key é necessária para gerar posts personalizados com o modelo Gemini. Ela será armazenada localmente no seu navegador.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="tutorial" className="space-y-4">
            <div className="space-y-3 bg-blue-50 dark:bg-slate-800 p-4 rounded-lg">
              <h3 className="font-medium text-blue-700 dark:text-blue-300">Como obter uma API Key para o Google Gemini:</h3>
              
              <ol className="space-y-2 text-sm text-blue-600 dark:text-blue-400 list-decimal pl-5">
                <li>Acesse a <a href="https://ai.google.dev/" target="_blank" rel="noopener noreferrer" className="text-blue-700 dark:text-blue-300 underline inline-flex items-center gap-1">Google AI Studio <ExternalLink size={12} /></a></li>
                <li>Crie uma conta ou faça login na plataforma</li>
                <li>No painel principal, clique em "Get API key" ou "Obter chave de API"</li>
                <li>Siga as instruções para criar um novo projeto ou usar um existente</li>
                <li>Copie a chave API gerada</li>
                <li>Cole a chave no campo API Key nas configurações do GMB Post Generator</li>
                <li>Clique em "Salvar" para armazenar sua chave</li>
              </ol>
              
              <div className="bg-blue-100 dark:bg-slate-700 p-3 rounded-md text-xs mt-4">
                <p className="font-medium text-blue-700 dark:text-blue-300 mb-1">Observações importantes:</p>
                <ul className="list-disc pl-5 text-blue-600 dark:text-blue-400 space-y-1">
                  <li>A API key é sensível e não deve ser compartilhada</li>
                  <li>O Google oferece créditos gratuitos para uso inicial</li>
                  <li>Verifique a política de preços para uso continuado</li>
                  <li>As chaves podem expirar e precisar de renovação</li>
                </ul>
              </div>
            </div>
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={() => window.open("https://ai.google.dev/", "_blank")}
                className="border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Acessar Google AI Studio
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={() => {
            saveApiKey();
            onOpenChange(false);
          }} className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800">
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsModal;
