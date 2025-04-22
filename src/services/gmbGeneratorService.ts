
import { toast } from "@/hooks/use-toast";

interface BusinessInfo {
  name: string;
  category: string;
  website: string;
  address: string;
  phone: string;
  hours: string;
}

interface ReviewResponseParams {
  businessInfo: BusinessInfo;
  reviewType: "positive" | "negative" | "question" | "general";
  reviewText: string;
  tone: string;
  language: string;
}

interface DescriptionParams {
  businessInfo: BusinessInfo;
  featureHighlights: string[];
  tone: string;
  language: string;
}

interface QAParams {
  businessInfo: BusinessInfo;
  topics: string[];
  tone: string;
  language: string;
}

// Generate responses to reviews on Google My Business
export const generateReviewResponses = async (params: ReviewResponseParams): Promise<string[]> => {
  const apiKey = localStorage.getItem("geminiApiKey");
  
  if (!apiKey) {
    throw new Error("API Key não encontrada. Por favor, configure nas configurações.");
  }

  // Get language label for prompt
  let languageLabel = "Portuguese (Brazil)";
  if (params.language === "en-US") languageLabel = "English (US)";
  if (params.language === "es-ES") languageLabel = "Spanish";

  // Define review type label based on language
  let reviewTypeLabel = "";
  if (params.language === "pt-BR") {
    reviewTypeLabel = params.reviewType === "positive" ? "positiva" : 
                       params.reviewType === "negative" ? "negativa" : 
                       params.reviewType === "question" ? "pergunta" : "geral";
  } else if (params.language === "en-US") {
    reviewTypeLabel = params.reviewType === "positive" ? "positive" : 
                       params.reviewType === "negative" ? "negative" : 
                       params.reviewType === "question" ? "question" : "general";
  } else if (params.language === "es-ES") {
    reviewTypeLabel = params.reviewType === "positive" ? "positiva" : 
                       params.reviewType === "negative" ? "negativa" : 
                       params.reviewType === "question" ? "pregunta" : "general";
  }

  // Improved prompt for review responses
  const prompt = `
    You are a professional Google My Business customer service specialist.
    Generate 3 appropriate responses to the following ${reviewTypeLabel} customer review for a business with these details:
    
    - Business Name: ${params.businessInfo.name}
    - Category: ${params.businessInfo.category}
    - Website: ${params.businessInfo.website || "N/A"}
    - Address: ${params.businessInfo.address}
    - Phone: ${params.businessInfo.phone || "N/A"}
    - Hours: ${params.businessInfo.hours || "N/A"}
    
    Review: "${params.reviewText}"
    
    Review Type: ${reviewTypeLabel}
    Tone: ${params.tone}
    Language: ${languageLabel}
    
    Guidelines for responses:
    - Start with a personalized greeting
    - For positive reviews: Express gratitude, highlight what the customer liked, invite them back
    - For negative reviews: Apologize sincerely, address their concerns, offer a solution, invite to discuss privately
    - For questions: Provide clear information if it's general business info, or suggest contacting the business directly for specific questions
    - Keep responses between 50-150 words
    - Always use a professional and caring tone
    - Never be defensive
    - Avoid generic templates - personalize based on the review content
    - End with a friendly sign-off including the business name
    
    Instructions:
    - Format: plain text with appropriate line breaks.
    - No titles, explanations, or numbering.
    - Separate each response with three dashes (---).
    - Do NOT include explanatory text or any output besides the responses themselves.
  `;

  try {
    return await fetchGeminiResponse(apiKey, prompt);
  } catch (error) {
    console.error("Error generating review responses:", error);
    throw error;
  }
};

// Generate business descriptions for Google My Business
export const generateBusinessDescriptions = async (params: DescriptionParams): Promise<string[]> => {
  const apiKey = localStorage.getItem("geminiApiKey");
  
  if (!apiKey) {
    throw new Error("API Key não encontrada. Por favor, configure nas configurações.");
  }

  // Get language label for prompt
  let languageLabel = "Portuguese (Brazil)";
  if (params.language === "en-US") languageLabel = "English (US)";
  if (params.language === "es-ES") languageLabel = "Spanish";

  // Improved prompt for business descriptions
  const prompt = `
    You are a professional Google My Business SEO and content specialist.
    Create 3 optimized business descriptions for Google My Business with these details:
    
    - Business Name: ${params.businessInfo.name}
    - Category: ${params.businessInfo.category}
    - Website: ${params.businessInfo.website || "N/A"}
    - Address: ${params.businessInfo.address}
    - Phone: ${params.businessInfo.phone || "N/A"}
    - Hours: ${params.businessInfo.hours || "N/A"}
    - Key Features/Highlights: ${params.featureHighlights.join(", ")}
    
    Tone: ${params.tone}
    Language: ${languageLabel}
    
    Guidelines for descriptions:
    - Keep each description between 150-450 characters (Google's limit is 750)
    - Start with the most important information about the business
    - Include natural keywords related to the business category
    - Highlight unique selling propositions and featured services
    - Include a call-to-action
    - Avoid excessive use of capital letters, special characters, or emojis
    - Focus on local SEO optimization for the specific location
    - Be authentic and avoid marketing clichés
    
    Instructions:
    - Format: plain text with appropriate line breaks.
    - No titles, explanations, or numbering.
    - Separate each description with three dashes (---).
    - Do NOT include explanatory text or any output besides the descriptions themselves.
    - Include character count at the end of each description in parentheses.
  `;

  try {
    return await fetchGeminiResponse(apiKey, prompt);
  } catch (error) {
    console.error("Error generating business descriptions:", error);
    throw error;
  }
};

// Generate Q&A content for Google My Business
export const generateQAContent = async (params: QAParams): Promise<string[]> => {
  const apiKey = localStorage.getItem("geminiApiKey");
  
  if (!apiKey) {
    throw new Error("API Key não encontrada. Por favor, configure nas configurações.");
  }

  // Get language label for prompt
  let languageLabel = "Portuguese (Brazil)";
  if (params.language === "en-US") languageLabel = "English (US)";
  if (params.language === "es-ES") languageLabel = "Spanish";

  // Create topic string from array
  const topicsString = params.topics.length > 0 
    ? params.topics.join(", ") 
    : "business hours, services offered, pricing, location, parking, accessibility";

  // Improved prompt for Q&A content
  const prompt = `
    You are a professional Google My Business SEO and content specialist.
    Create 5 frequently asked questions with answers for a Google My Business profile with these details:
    
    - Business Name: ${params.businessInfo.name}
    - Category: ${params.businessInfo.category}
    - Website: ${params.businessInfo.website || "N/A"}
    - Address: ${params.businessInfo.address}
    - Phone: ${params.businessInfo.phone || "N/A"}
    - Hours: ${params.businessInfo.hours || "N/A"}
    - Topics to cover: ${topicsString}
    
    Tone: ${params.tone}
    Language: ${languageLabel}
    
    Guidelines for Q&A content:
    - Questions should be ones potential customers would actually ask
    - Questions should cover common concerns related to the business type
    - Answers should be comprehensive but concise (50-100 words each)
    - Include factual information from the business details provided
    - Where specific information is not provided, use general answers appropriate for the business type
    - Include keywords naturally related to the business category
    - Address practical information like parking, accessibility, price ranges, etc.
    
    Instructions:
    - Format each Q&A as "Q: [Question]\nA: [Answer]"
    - Separate each Q&A pair with three dashes (---).
    - Do NOT include explanatory text or any output besides the Q&A content itself.
  `;

  try {
    return await fetchGeminiResponse(apiKey, prompt);
  } catch (error) {
    console.error("Error generating Q&A content:", error);
    throw error;
  }
};

// Helper function to fetch responses from the Gemini API
const fetchGeminiResponse = async (apiKey: string, prompt: string): Promise<string[]> => {
  try {
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("API Error:", errorData);
      throw new Error(`Erro na API: ${errorData.error?.message || "Falha ao gerar conteúdo"}`);
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0].content || !data.candidates[0].content.parts) {
      throw new Error("Resposta da API inválida");
    }

    const generatedText = data.candidates[0].content.parts[0].text;
    
    // Split the response by the separator and clean up each item
    const contentItems = generatedText
      .split("---")
      .map(item => item.trim())
      .filter(item => item.length > 0);
    
    return contentItems.length > 0 ? contentItems : ["Não foi possível gerar conteúdo. Por favor, tente novamente."];
  } catch (error) {
    console.error("Error fetching from Gemini API:", error);
    throw error;
  }
};

// Mock data functions for when API is not available
export const getMockReviewResponses = (reviewType: string, reviewText: string): string[] => {
  if (reviewType === "positive") {
    return [
      "Olá! Muito obrigado pelo seu feedback positivo. Ficamos muito felizes em saber que você teve uma experiência tão boa conosco. É gratificante saber que nosso trabalho está sendo reconhecido. Esperamos vê-lo novamente em breve!\n\nEquipe do Mercadinho Bela Vista",
      
      "Oi! Uau, que comentário maravilhoso! Valorizamos muito sua opinião e estamos extremamente felizes que você tenha gostado. Nosso objetivo é sempre proporcionar a melhor experiência possível. Volte sempre, será um prazer atendê-lo novamente!\n\nAtenciosamente, Mercadinho Bela Vista"
    ];
  } else if (reviewType === "negative") {
    return [
      "Olá! Lamentamos muito pela experiência que você teve. Pedimos sinceras desculpas pelos inconvenientes e gostaríamos muito de ter a oportunidade de corrigir essa situação. Poderia, por favor, entrar em contato conosco diretamente pelo telefone para conversarmos melhor? Valorizamos seu feedback e estamos comprometidos em melhorar.\n\nEquipe do Mercadinho Bela Vista",
      
      "Prezado cliente, agradecemos seu feedback. Pedimos desculpas pela experiência negativa e gostaríamos de resolver essa situação da melhor forma possível. Se puder nos fornecer mais detalhes pelo telefone ou e-mail, ficaremos gratos. Seu feedback é fundamental para nosso aprimoramento contínuo.\n\nAtenciosamente, Gerência do Mercadinho Bela Vista"
    ];
  } else if (reviewType === "question") {
    return [
      "Olá! Agradecemos seu contato e interesse. Para responder sua pergunta específica sobre nossos horários especiais de funcionamento, por favor entre em contato conosco diretamente pelo telefone (XX) XXXX-XXXX ou visite nossa loja. Teremos o maior prazer em fornecer todas as informações que você precisa.\n\nEquipe do Mercadinho Bela Vista",
      
      "Oi! Obrigado pela sua pergunta. Para informações específicas sobre produtos especiais, recomendamos que entre em contato conosco diretamente ou visite nossa loja. Assim poderemos fornecer detalhes precisos e atualizados sobre disponibilidade e preços. Estamos à disposição para ajudar!\n\nAtenciosamente, Mercadinho Bela Vista"
    ];
  } else {
    return [
      "Olá! Agradecemos seu contato. Sua opinião é muito importante para nós e nos ajuda a melhorar continuamente nossos serviços. Se precisar de mais alguma informação ou tiver outras dúvidas, não hesite em nos contatar. Estamos sempre à disposição para atendê-lo da melhor forma possível.\n\nEquipe do Mercadinho Bela Vista",
      
      "Prezado cliente, muito obrigado pelo seu feedback. Valorizamos muito sua opinião e estamos sempre buscando aprimorar nossos serviços. Esperamos vê-lo novamente em breve em nossa loja. Qualquer dúvida ou sugestão adicional, estamos à disposição.\n\nAtenciosamente, Mercadinho Bela Vista"
    ];
  }
};

export const getMockBusinessDescriptions = (): string[] => {
  return [
    "Somos o Mercadinho Bela Vista, seu mercado de bairro com atendimento personalizado e produtos frescos todos os dias. Oferecemos uma seleção cuidadosa de itens essenciais, produtos locais e importados. Venha conhecer nossas ofertas semanais e desfrute de uma experiência de compra agradável em um ambiente familiar. Entrega em domicílio disponível! (245 caracteres)",
    
    "Bem-vindo ao Mercadinho Bela Vista, onde qualidade e preço justo se encontram. Desde 2010 atendendo o bairro com os melhores produtos. Hortifruti fresco diariamente, padaria artesanal, açougue premium e uma ampla variedade de produtos nacionais e importados. Cadastre-se em nosso programa de fidelidade e ganhe descontos exclusivos! (280 caracteres)",
    
    "O Mercadinho Bela Vista oferece uma experiência de compra única com foco em produtos de qualidade e atendimento personalizado. Estamos localizados estrategicamente para sua conveniência, oferecendo estacionamento gratuito e amplo horário de funcionamento. Nossas seções de orgânicos e produtos sem glúten são as mais completas da região. Visite-nos hoje mesmo! (310 caracteres)"
  ];
};

export const getMockQAContent = (): string[] => {
  return [
    "Q: Qual o horário de funcionamento do Mercadinho Bela Vista?\nA: O Mercadinho Bela Vista funciona de segunda a sábado, das 7h às 21h, e aos domingos e feriados das 8h às 18h. Na véspera de feriados importantes, podemos estender nosso horário até as 22h para melhor atender nossos clientes.",
    
    "Q: O Mercadinho Bela Vista oferece serviço de entrega?\nA: Sim, oferecemos serviço de entrega em domicílio para compras acima de R$50,00, com taxa de entrega que varia conforme a distância. Para solicitar uma entrega, você pode fazer suas compras diretamente na loja ou pelo nosso WhatsApp. Entregas são realizadas em até 2 horas após a finalização da compra, dependendo da demanda.",
    
    "Q: Quais formas de pagamento são aceitas?\nA: Aceitamos diversas formas de pagamento para sua conveniência: dinheiro, cartões de crédito e débito de todas as bandeiras, PIX, vale-alimentação (Alelo, Sodexo, VR, Ticket) e também oferecemos a opção de fiado para clientes cadastrados. Não trabalhamos com cheques.",
    
    "Q: O estacionamento é gratuito?\nA: Sim, dispomos de estacionamento próprio gratuito para clientes, com capacidade para 15 veículos. O limite de tempo é de 1 hora para compras. Também contamos com bicicletário seguro e vagas exclusivas para idosos e pessoas com deficiência, conforme a legislação.",
    
    "Q: Vocês vendem produtos orgânicos e sem glúten?\nA: Sim! Temos uma seção dedicada a produtos orgânicos, com frutas, verduras e legumes certificados. Também contamos com uma variedade crescente de produtos sem glúten, sem lactose e veganos. Estamos sempre ampliando nosso catálogo de produtos especiais para atender às necessidades dietéticas específicas de nossos clientes."
  ];
};
