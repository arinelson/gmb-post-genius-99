
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";

function getMockFaqs({ category }: { category?: string }) {
  if (!category) category = "seu nicho";
  return [
    {
      question: `Como funciona o atendimento no ${category}?`,
      answer: `Nosso atendimento é rápido e focado na melhor experiência para você! Venha conhecer.`
    },
    {
      question: `Quais são as formas de pagamento aceitas no ${category}?`,
      answer: `Aceitamos diversas formas de pagamento, incluindo cartões, Pix e dinheiro.`
    },
    {
      question: `O ${category} oferece promoções semanais?`,
      answer: `Sim! Fique atento às nossas redes sociais e aproveite nossas ofertas.`
    }
  ];
}

export default function FaqGenerator({ businessInfo }: { businessInfo: any }) {
  const [faqs, setFaqs] = useState<{question: string, answer: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const [customQuestion, setCustomQuestion] = useState("");
  const { toast } = useToast();

  async function handleGenerate() {
    setFaqs([]);
    setLoading(true);
    try {
      const apiKey = localStorage.getItem("geminiApiKey");
      if (!apiKey) {
        setTimeout(() => {
          setFaqs(getMockFaqs(businessInfo));
          setLoading(false);
          toast({ title: "Perguntas de exemplo geradas", description: "Configure sua API para perguntas/respostas otimizadas e customizadas." });
        }, 900);
        return;
      }
      // Chame sua API real aqui.
      setTimeout(() => {
        setFaqs(getMockFaqs(businessInfo));
        setLoading(false);
      }, 1300);
    } catch (e) {
      setLoading(false);
      toast({ title: "Erro ao gerar perguntas", variant: "destructive" });
    }
  }

  function handleAddCustomQuestion() {
    if (customQuestion.trim().length > 0) {
      setFaqs(faqs => [{ question: customQuestion.trim(), answer: "Sua resposta aqui." }, ...faqs]);
      setCustomQuestion("");
    }
  }

  return (
    <div className="space-y-4">
      <Button onClick={handleGenerate} disabled={loading} className="w-full">
        {loading ? "Gerando perguntas..." : "Gerar perguntas frequentes"}
      </Button>
      <div className="flex gap-2 mt-3">
        <Input
          value={customQuestion}
          onChange={e => setCustomQuestion(e.target.value)}
          placeholder="Adicione uma pergunta personalizada..."
        />
        <Button onClick={handleAddCustomQuestion} variant="outline" type="button">
          Adicionar
        </Button>
      </div>
      {faqs.length > 0 && (
        <div className="mt-3 space-y-3">
          {faqs.map((faq, idx) => (
            <div key={idx} className="bg-blue-50 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-700 p-2 rounded-lg shadow text-blue-900 dark:text-blue-100 animate-fade-in">
              <div className="font-medium text-sm">
                <span className="text-blue-700 dark:text-blue-300">Q{idx + 1}:</span> {faq.question}
              </div>
              <div className="text-xs mt-1 text-blue-800 dark:text-blue-200">
                <span className="font-medium">A:</span> {faq.answer}
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="text-xs text-blue-600 dark:text-blue-300 mt-2 opacity-80">
        Você pode adicionar perguntas frequentes personalizadas.<br />
        As perguntas geradas respeitam as recomendações do Google Meu Negócio.
      </div>
    </div>
  );
}
