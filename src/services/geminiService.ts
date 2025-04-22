
interface BusinessInfo {
  name: string;
  category: string;
  website: string;
  address: string;
  phone: string;
  hours: string;
}

export const generatePostsWithGemini = async (
  postType: string,
  businessInfo: BusinessInfo,
  tone: string,
  language: string,
  customPrompt?: string
): Promise<string[] | string> => {
  const apiKey = localStorage.getItem("geminiApiKey");
  
  if (!apiKey) {
    throw new Error("API Key não encontrada. Por favor, configure nas configurações.");
  }

  // Get language label for prompt
  let languageLabel = "Portuguese (Brazil)";
  if (language === "en-US") languageLabel = "English (US)";
  if (language === "es-ES") languageLabel = "Spanish";

  // Define post type in the selected language
  let postTypeLabel = "";
  if (language === "pt-BR") {
    postTypeLabel = postType === "update" ? "atualizações" : postType === "offer" ? "ofertas" : "eventos";
  } else if (language === "en-US") {
    postTypeLabel = postType === "update" ? "updates" : postType === "offer" ? "offers" : "events";
  } else if (language === "es-ES") {
    postTypeLabel = postType === "update" ? "actualizaciones" : postType === "offer" ? "ofertas" : "eventos";
  }

  // Different prompts based on content type
  let prompt = "";
  
  if (postType === "description") {
    prompt = buildDescriptionPrompt(businessInfo, language);
  } else if (postType === "review-reply") {
    prompt = buildReviewReplyPrompt(businessInfo, customPrompt || "", language);
  } else if (postType === "qa") {
    prompt = buildQAPrompt(businessInfo, language);
  } else if (customPrompt) {
    // Use custom prompt if provided
    prompt = customPrompt;
  } else {
    // Default posts prompt
    prompt = buildPostsPrompt(businessInfo, postTypeLabel, postType, tone, language);
  }

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
    
    // Para descrição e resposta de avaliação, retornar texto direto
    if (postType === "description" || postType === "review-reply") {
      return generatedText.trim();
    }
    
    // Para Q&A, dividir por perguntas
    if (postType === "qa") {
      return parseQAContent(generatedText);
    }
    
    // Para posts regulares, dividir por separador
    const posts = generatedText
      .split("---")
      .map(post => post.trim())
      .filter(post => post.length > 0);
    
    return posts.length > 0 ? posts : ["Não foi possível gerar posts. Por favor, tente novamente."];
  } catch (error) {
    console.error("Error generating content:", error);
    throw error;
  }
};

// Construtor de prompt para descrição do GMB
function buildDescriptionPrompt(businessInfo: BusinessInfo, language: string): string {
  let audience = "";
  let seoFocus = "";
  let lengthLimit = "";
  
  // Adicionar variantes de idioma
  if (language === "pt-BR") {
    audience = "clientes locais brasileiros";
    seoFocus = "foco em SEO local brasileiro";
    lengthLimit = "limite de 750 caracteres";
  } else if (language === "en-US") {
    audience = "local US customers";
    seoFocus = "focus on US local SEO";
    lengthLimit = "limit of 750 characters";
  } else if (language === "es-ES") {
    audience = "clientes locales de habla hispana";
    seoFocus = "enfoque en SEO local español";
    lengthLimit = "límite de 750 caracteres";
  }
  
  return `Crie uma descrição otimizada para o Google Meu Negócio para a seguinte empresa:

INFORMAÇÕES DA EMPRESA:
- Nome: ${businessInfo.name}
- Categoria: ${businessInfo.category}
- Endereço: ${businessInfo.address}
- Site: ${businessInfo.website || "-"}
- Telefone: ${businessInfo.phone || "-"}
- Horário: ${businessInfo.hours || "-"}

REQUISITOS DA DESCRIÇÃO:
1. Atenda ${audience}
2. Com ${seoFocus}
3. Tenha exatamente um ${lengthLimit}
4. Seja concisa e clara, usando tom profissional e amigável
5. Inclua os diferenciais do negócio com base na categoria
6. Destaque a localização e acessibilidade
7. Tenha chamada para ação no final

FORMATO: Texto contínuo sem marcadores, quebras de linha ou títulos. Não use aspas. Não ultrapasse 750 caracteres.

IMPORTANTE: A descrição deve estar perfeitamente alinhada com as diretrizes do Google Meu Negócio, enfatizar credibilidade e qualidade, e usar palavras-chave naturalmente.`;
}

// Construtor de prompt para resposta de avaliações
function buildReviewReplyPrompt(businessInfo: BusinessInfo, reviewText: string, language: string): string {
  let toneGuidance = "";
  let lengthGuidance = "";
  
  // Adicionar variantes de idioma
  if (language === "pt-BR") {
    toneGuidance = "tom profissional e cordial brasileiro";
    lengthGuidance = "máximo de 300 caracteres";
  } else if (language === "en-US") {
    toneGuidance = "professional and cordial American tone";
    lengthGuidance = "maximum of 300 characters";
  } else if (language === "es-ES") {
    toneGuidance = "tono profesional y cordial en español";
    lengthGuidance = "máximo de 300 caracteres";
  }
  
  return `Gere uma resposta otimizada para a seguinte avaliação do Google Meu Negócio:

AVALIAÇÃO DO CLIENTE:
"${reviewText}"

INFORMAÇÕES DA EMPRESA:
- Nome: ${businessInfo.name}
- Categoria: ${businessInfo.category}
- Endereço: ${businessInfo.address}

DIRETRIZES PARA RESPOSTA:
1. Use ${toneGuidance}
2. Respeite ${lengthGuidance}
3. Personalize com nome da empresa
4. Se avaliação positiva (4-5 estrelas): agradeça sinceramente, mencione algo específico do comentário, convide para retornar
5. Se avaliação negativa (1-3 estrelas): demonstre empatia, peça desculpas objetivamente sem admitir culpa, ofereça resolver offline, forneça contato direto
6. Se avaliação neutra ou ambígua: agradeça, aborde pontos específicos, convide para contato direto
7. Evite respostas genéricas, templificadas ou artificiais

FORMATO: Texto contínuo sem marcadores ou quebras excessivas. Não use aspas.`;
}

// Construtor de prompt para Q&A
function buildQAPrompt(businessInfo: BusinessInfo, language: string): string {
  let qaTopic = "";
  let qaFormat = "";
  
  // Adicionar variantes de idioma e categorias específicas
  if (language === "pt-BR") {
    qaTopic = "perguntas frequentes de clientes brasileiros";
    qaFormat = "Formato: 'Pergunta: [pergunta]\\nResposta: [resposta concisa]'";

    // Adicionar orientações específicas baseadas na categoria
    if (businessInfo.category.toLowerCase().includes("restaurante")) {
      qaTopic += " sobre reservas, horário de pico, estacionamento, menu, delivery, eventos privados";
    } else if (businessInfo.category.toLowerCase().includes("supermercado")) {
      qaTopic += " sobre horários estendidos, estacionamento, entregas, produtos orgânicos, seções especializadas";
    } else if (businessInfo.category.toLowerCase().includes("hotel")) {
      qaTopic += " sobre check-in/check-out, pets, wifi, café da manhã, estacionamento, transporte";
    }
  } else if (language === "en-US") {
    qaTopic = "frequently asked questions from US customers";
    qaFormat = "Format: 'Question: [question]\\nAnswer: [concise answer]'";
    
    if (businessInfo.category.toLowerCase().includes("restaurant")) {
      qaTopic += " about reservations, busy hours, parking, menu, delivery, private events";
    } else if (businessInfo.category.toLowerCase().includes("grocery")) {
      qaTopic += " about extended hours, parking, deliveries, organic products, specialty sections";
    } else if (businessInfo.category.toLowerCase().includes("hotel")) {
      qaTopic += " about check-in/check-out, pets, wifi, breakfast, parking, transportation";
    }
  } else if (language === "es-ES") {
    qaTopic = "preguntas frecuentes de clientes hispanos";
    qaFormat = "Formato: 'Pregunta: [pregunta]\\nRespuesta: [respuesta concisa]'";
    
    if (businessInfo.category.toLowerCase().includes("restaurante")) {
      qaTopic += " sobre reservas, horas pico, estacionamiento, menú, delivery, eventos privados";
    } else if (businessInfo.category.toLowerCase().includes("supermercado")) {
      qaTopic += " sobre horarios extendidos, estacionamiento, entregas, productos orgánicos, secciones especializadas";
    } else if (businessInfo.category.toLowerCase().includes("hotel")) {
      qaTopic += " sobre check-in/check-out, mascotas, wifi, desayuno, estacionamiento, transporte";
    }
  }
  
  return `Gere 5 perguntas e respostas otimizadas para a seção Q&A do Google Meu Negócio para:

INFORMAÇÕES DA EMPRESA:
- Nome: ${businessInfo.name}
- Categoria: ${businessInfo.category}
- Endereço: ${businessInfo.address}
- Site: ${businessInfo.website || "-"}
- Telefone: ${businessInfo.phone || "-"}
- Horário: ${businessInfo.hours || "-"}

REQUISITOS:
1. Crie 5 ${qaTopic}
2. Perguntas práticas que clientes realmente fazem sobre este tipo de negócio
3. Respostas concisas (máximo 1-2 frases) e informativas
4. Inclua informações sobre acessibilidade, horários, serviços especiais, diferencial da empresa
5. Foque no que é mais relevante para a categoria específica do negócio
6. Permita à empresa demonstrar conhecimento, confiança e transparência

${qaFormat}

IMPORTANTE: Cada par de pergunta e resposta deve ser separado por uma linha em branco. Respostas devem ter no máximo 150 caracteres.`;
}

// Construtor de prompt para posts padrão
function buildPostsPrompt(businessInfo: BusinessInfo, postTypeLabel: string, postType: string, tone: string, language: string): string {
  let toneDescription = "";
  
  if (tone === "friendly") {
    toneDescription = language === "pt-BR" ? "amigável e próximo" : 
                     language === "en-US" ? "friendly and approachable" : 
                     "amigable y cercano";
  } else if (tone === "promotional") {
    toneDescription = language === "pt-BR" ? "promocional e urgente" : 
                     language === "en-US" ? "promotional and urgent" : 
                     "promocional y urgente";
  } else {
    toneDescription = language === "pt-BR" ? "profissional e informativo" : 
                     language === "en-US" ? "professional and informative" : 
                     "profesional e informativo";
  }
  
  // Adicionar instruções baseadas no tipo de post
  let postTypeInstructions = "";
  if (postType === "update") {
    postTypeInstructions = language === "pt-BR" ? 
      "Foque em novidades do negócio, aperfeiçoamentos, ou lembretes sobre produtos/serviços populares." : 
      language === "en-US" ? 
      "Focus on business updates, improvements, or reminders about popular products/services." : 
      "Concéntrese en actualizaciones del negocio, mejoras o recordatorios sobre productos/servicios populares.";
  } else if (postType === "offer") {
    postTypeInstructions = language === "pt-BR" ? 
      "Destaque ofertas específicas com prazo, valor, condições, e forte chamada para ação." : 
      language === "en-US" ? 
      "Highlight specific offers with deadline, value, conditions, and strong call to action." : 
      "Destaque ofertas específicas con plazo, valor, condiciones y una fuerte llamada a la acción.";
  } else if (postType === "event") {
    postTypeInstructions = language === "pt-BR" ? 
      "Detalhe data, hora, local, benefícios de participar, e como confirmar presença." : 
      language === "en-US" ? 
      "Detail date, time, location, benefits of attending, and how to confirm attendance." : 
      "Detalle fecha, hora, lugar, beneficios de participar y cómo confirmar asistencia.";
  }
  
  let languageLabel = language === "pt-BR" ? "Português (Brasil)" : 
                      language === "en-US" ? "English (US)" : 
                      "Español";
  
  return `
    You are a professional Google My Business content creator. 
    Create 3 unique Google My Business posts for a business with these details:
    - Business Name: ${businessInfo.name}
    - Category: ${businessInfo.category}
    - Website: ${businessInfo.website || "N/A"}
    - Address: ${businessInfo.address}
    - Phone: ${businessInfo.phone || "N/A"}
    - Hours: ${businessInfo.hours || "N/A"}
    
    Post Type: ${postTypeLabel} (${postType})
    Tone: ${toneDescription}
    Language: ${languageLabel} (${language})
    
    ${postTypeInstructions}

    Each post must:
    - Be concise (preferably under 1500 characters)
    - Use a ${toneDescription} tone (avoid childish style)
    - Include NO MORE THAN TWO hashtags (and only if they are relevant, not obligatory)
    - LIMIT the use of emojis (max one per post, only if it adds value)
    - Avoid repeating the same template or structure in every post
    - Be suitable for local search optimization

    Instructions:
    - Format: plain text with appropriate line breaks.
    - No titles, explanations, or numbering.
    - Separate each post with three dashes (---).
    - Do NOT include explanatory text or any output besides the posts themselves.
  `;
}

// Função para analisar o conteúdo de Q&A
function parseQAContent(text: string): string[] {
  // Tenta dividir em pares de pergunta/resposta (formato esperado: "Pergunta: X\nResposta: Y")
  const qaRegex = /Pergunta:|Question:|Pregunta:/gi;
  
  if (qaRegex.test(text)) {
    return text
      .split(/\n\s*\n/)
      .filter(pair => pair.trim().length > 0 && 
        (/Pergunta:|Question:|Pregunta:/i.test(pair)));
  }
  
  // Fallback: dividir por linhas em branco
  return text
    .split(/\n\s*\n/)
    .filter(item => item.trim().length > 0)
    .slice(0, 5); // Limitar a 5 itens
}

// Fallback function for when API is not available
export const getMockPosts = (
  postType: string, 
  businessInfo: BusinessInfo, 
  tone: string,
  language: string
): string[] => {
  const { name, category, address } = businessInfo;
  
  if (language === "en-US") {
    // English posts
    if (postType === "update") {
      return [
        `✨ Hello wonderful community!\n\nAt ${name}, we're more than just your daily ${category} — we're your local meeting point where everyone knows your name! From fresh products to your favorites, our aisles are full of quality products at prices that'll make you smile. Come take a look at the delicious surprises we have for you today!\n\n📍 Located at ${address}. We can't wait to welcome you! 😊 #ShopLocal`,
        
        `👋 Hello, dear neighbors!\n\nAt ${name}, it's all about bringing our community together through fantastic products and a warm shopping experience. We have everything you need under one roof and a friendly team ready to help you with a smile. Whether to shop or just stop by for a chat, our doors are always open for you.\n\n📍 Visit us at ${address}. We look forward to seeing you soon! 😊 #CommunityLove`
      ];
    } else if (postType === "offer") {
      return [
        `🔥 UNMISSABLE PROMOTION AT ${name.toUpperCase()} 🔥\n\n30% OFF on selected products! It's your chance to save while enjoying the best that our ${category} has to offer. Promotion valid only this week, don't waste time!\n\n📍 ${address} | ⏰ Hurry, it's for a limited time!`,
        
        `💰 GUARANTEED SAVINGS AT ${name.toUpperCase()} 💰\n\nBUY 1 GET 2 on selected items! That's right, you read it correctly. It's the perfect chance to visit our ${category} and leave with more products paying less. Promotion valid while supplies last.\n\n📍 ${address} | ⚡ Don't leave it for later!`
      ];
    } else if (postType === "event") {
      return [
        `🎉 SPECIAL EVENT AT ${name.toUpperCase()} 🎉\n\nWe're pleased to invite you to our free workshop on "${category}" this Saturday at 3pm! Come learn from experts and participate in the raffle for exclusive gifts.\n\n📍 ${address} | 📝 Limited spots! Confirm your attendance by phone.`,
        
        `✨ SAVE THE DATE ✨\n\n${name} presents: ${category} Fair - An unmissable event for the whole family! We'll have demonstrations, tastings, and activities for children. Free entry!\n\nWhen: Next Sunday, from 10am to 6pm\nWhere: ${address}\n\nBring your friends and family! 🌟`
      ];
    }
  } else if (language === "es-ES") {
    // Spanish posts
    if (postType === "update") {
      return [
        `✨ ¡Hola maravillosa comunidad!\n\nEn ${name}, somos más que su ${category} diario — ¡somos su punto de encuentro local donde todos conocen su nombre! Desde productos frescos hasta sus favoritos, nuestros pasillos están llenos de productos de calidad a precios que te harán sonreír. ¡Ven a ver las deliciosas sorpresas que tenemos para ti hoy!\n\n📍 Ubicado en ${address}. ¡No podemos esperar para recibirte! 😊 #ComercioLocal`,
        
        `👋 ¡Hola, queridos vecinos!\n\nEn ${name}, todo se trata de unir a nuestra comunidad a través de productos fantásticos y una cálida experiencia de compra. Tenemos todo lo que necesitas bajo un mismo techo y un equipo amigable listo para ayudarte con una sonrisa. Ya sea para comprar o simplemente pasar para charlar, nuestras puertas siempre están abiertas para ti.\n\n📍 Visítanos en ${address}. ¡Esperamos verte pronto! 😊 #AmorComunitario`
      ];
    } else if (postType === "offer") {
      return [
        `🔥 ¡PROMOCIÓN IMPERDIBLE EN ${name.toUpperCase()} 🔥\n\n¡30% DE DESCUENTO en productos seleccionados! Es tu oportunidad de ahorrar mientras disfrutas de lo mejor que nuestro ${category} tiene para ofrecer. ¡Promoción válida solo esta semana, no pierdas tiempo!\n\n📍 ${address} | ⏰ ¡Apúrate, es por tiempo limitado!`,
        
        `💰 AHORRO GARANTIZADO EN ${name.toUpperCase()} 💰\n\n¡COMPRA 1 LLEVA 2 en artículos seleccionados! Así es, leíste bien. Es la oportunidad perfecta para conocer nuestro ${category} y salir con más productos pagando menos. Promoción válida hasta agotar existencias.\n\n📍 ${address} | ⚡ ¡No lo dejes para después!`
      ];
    } else if (postType === "event") {
      return [
        `🎉 EVENTO ESPECIAL EN ${name.toUpperCase()} 🎉\n\n¡Tenemos el placer de invitarte a nuestro taller gratuito sobre "${category}" este sábado a las 15h! Ven a aprender con expertos y participa en el sorteo de regalos exclusivos.\n\n📍 ${address} | 📝 ¡Plazas limitadas! Confirma tu asistencia por teléfono.`,
        
        `✨ ¡RESERVA LA FECHA! ✨\n\n${name} presenta: Feria de ${category} - ¡Un evento imperdible para toda la familia! Tendremos demostraciones, degustaciones y actividades para niños. ¡Entrada gratuita!\n\nCuándo: Próximo domingo, de 10h a 18h\nDónde: ${address}\n\n¡Trae a tus amigos y familiares! 🌟`
      ];
    }
  } else {
    // Default Portuguese (Brazil) posts
    if (postType === "update") {
      if (tone === "friendly") {
        return [
          `🌟 Olá, comunidade incrível!\n\nNo ${name}, somos muito mais do que seu ${category} diário — somos seu ponto de encontro local onde todo mundo sabe o seu nome! De produtos frescos aos seus favoritos, nossos corredores estão cheios de produtos de qualidade a preços que farão você sorrir. Venha dar uma olhada nas surpresas deliciosas que temos para você hoje!\n\n📍 Localizado em ${address}. Não podemos esperar para recebê-lo(a)! 😊 #ShopLocal`,
          
          `👋 Olá, queridos vizinhos!\n\nNo ${name}, tudo é sobre unir nossa comunidade através de produtos fantásticos e uma experiência de compra calorosa. Temos tudo o que você precisa sob um mesmo teto e uma equipe amigável pronta para ajudá-lo(a) com um sorriso. Seja para comprar ou apenas passar por aqui para conversar, nossas portas sempre estarão abertas para você.\n\n📍 Visite-nos em ${address}. Estamos ansiosos para te ver em breve! 😊 #CommunityLove`
        ];
      } else if (tone === "promotional") {
        return [
          `✨ NOVIDADES NO ${name.toUpperCase()} ✨\n\nAcabamos de renovar nossa loja para oferecer a melhor experiência em ${category}! Novos produtos, ambiente renovado e o mesmo atendimento de qualidade que você já conhece. Venha conferir todas as mudanças que fizemos pensando em você!\n\n📍 ${address} | Esperamos sua visita! 🛍️`,
          
          `🚨 ATENÇÃO CLIENTES DO ${name.toUpperCase()} 🚨\n\nTemos muitas novidades para compartilhar! Nosso ${category} está com produtos novos em todas as seções, e nossos colaboradores estão prontos para te ajudar a encontrar tudo o que você precisa. Não perca tempo e venha conferir!\n\n📍 Estamos localizados em ${address}. Te esperamos! 💯`
        ];
      } else {
        return [
          `🌟 Olá a todos!\n\nNo ${name}, estamos sempre buscando trazer o melhor para nossos clientes. Como seu ${category} de confiança, temos orgulho de oferecer produtos e serviços de qualidade. Venha nos visitar e descubra por que somos referência na região!\n\n📍 ${address} | Aguardamos sua visita! 😊`,
          
          `👋 Olá comunidade!\n\nO ${name} está sempre se renovando para melhor atender você. Temos novidades chegando toda semana para garantir que nosso ${category} sempre ofereça a melhor experiência. Fique de olho em nossas redes sociais para saber mais!\n\n📍 Venha nos visitar em ${address}. Será um prazer recebê-lo! 🌻`
        ];
      }
    } else if (postType === "offer") {
      if (tone === "promotional") {
        return [
          `🔥 PROMOÇÃO IMPERDÍVEL NO ${name.toUpperCase()} 🔥\n\n30% DE DESCONTO em produtos selecionados! É a sua chance de economizar enquanto aproveita o melhor que nosso ${category} tem a oferecer. Promoção válida somente esta semana, não perca tempo!\n\n📍 ${address} | ⏰ Corra, é por tempo limitado!`,
          
          `💰 ECONOMIA GARANTIDA NO ${name.toUpperCase()} 💰\n\nCOMPRE 1 LEVE 2 em itens selecionados! Isso mesmo, você leu certo. É a chance perfeita para conhecer nosso ${category} e sair com mais produtos pagando menos. Promoção válida enquanto durarem os estoques.\n\n📍 ${address} | ⚡ Não deixe para depois!`
        ];
      } else {
        return [
          `🎁 Oferta especial para nossos clientes!\n\nO ${name} está com uma promoção exclusiva esta semana! Venha conferir descontos de até 20% em produtos selecionados do nosso ${category}. É nossa forma de agradecer pela sua preferência.\n\n📍 ${address} | Oferta válida enquanto durarem os estoques.`,
          
          `💫 Descontos especiais no ${name}!\n\nPrepare-se para economizar! Estamos com ofertas em diversos produtos do nosso ${category}. Não perca esta oportunidade de adquirir o que você precisa com preços imbatíveis.\n\n📍 Visite-nos em ${address} e aproveite!`
        ];
      }
    } else if (postType === "event") {
      return [
        `🎉 EVENTO ESPECIAL NO ${name.toUpperCase()} 🎉\n\nTemos o prazer de convidar você para nosso workshop gratuito sobre "${category}" neste sábado às 15h! Venha aprender com especialistas e ainda participe do sorteio de brindes exclusivos.\n\n📍 ${address} | 📝 Vagas limitadas! Confirme sua presença pelo telefone.`,
        
        `✨ SAVE THE DATE ✨\n\nO ${name} apresenta: Feira de ${category} - Um evento imperdível para toda a família! Teremos demonstrações, degustações e atividades para crianças. Entrada gratuita!\n\nQuando: Próximo domingo, das 10h às 18h\nOnde: ${address}\n\nTraga seus amigos e familiares! 🌟`
      ];
    }
  }
  
  return [
    `Nosso ${category} ${name} está sempre à disposição para atender você com qualidade e excelência. Visite-nos em ${address} e descubra por que somos a escolha preferida de tantos clientes!\n\n#${category} #Qualidade #Atendimento`,
    
    `${name}: seu ${category} de confiança!\n\nEstamos localizados em ${address}, prontos para oferecer a melhor experiência em produtos e serviços. Venha nos conhecer e faça parte da nossa família de clientes satisfeitos!`
  ];
};
