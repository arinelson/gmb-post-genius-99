
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

// Construtor de prompt para descrição do GMB - MELHORADO
function buildDescriptionPrompt(businessInfo: BusinessInfo, language: string): string {
  let seoGuidance = "";
  let categorySpecific = "";
  
  // Instruções específicas de SEO baseadas no idioma
  if (language === "pt-BR") {
    seoGuidance = `
1. Use palavras-chave relevantes relacionadas a "${businessInfo.category}" naturalmente
2. Destaque a localização: "${businessInfo.address}"
3. Inclua uma chamada para ação clara
4. Evite jargões e linguagem técnica excessiva
5. Destaque benefícios, não apenas características`;
    
  } else if (language === "en-US") {
    seoGuidance = `
1. Naturally incorporate keywords related to "${businessInfo.category}"
2. Highlight the location: "${businessInfo.address}"
3. Include a clear call to action
4. Avoid jargon and excessive technical language
5. Emphasize benefits, not just features`;
    
  } else if (language === "es-ES") {
    seoGuidance = `
1. Incorpore naturalmente palabras clave relacionadas con "${businessInfo.category}"
2. Destaque la ubicación: "${businessInfo.address}"
3. Incluya un llamado a la acción claro
4. Evite jerga y lenguaje técnico excesivo
5. Enfatice beneficios, no solo características`;
  }
  
  // Adicionar instruções específicas por categoria
  const lowercaseCategory = businessInfo.category.toLowerCase();
  
  if (lowercaseCategory.includes("restaurante") || lowercaseCategory.includes("restaurant") || lowercaseCategory.includes("café")) {
    categorySpecific = language === "pt-BR" 
      ? "Mencione a atmosfera, especialidades culinárias, experiência de jantar única" 
      : language === "en-US"
      ? "Mention atmosphere, culinary specialties, unique dining experience"
      : "Mencione la atmósfera, especialidades culinarias, experiencia gastronómica única";
  } 
  else if (lowercaseCategory.includes("loja") || lowercaseCategory.includes("store") || lowercaseCategory.includes("tienda") || lowercaseCategory.includes("varejo") || lowercaseCategory.includes("retail")) {
    categorySpecific = language === "pt-BR" 
      ? "Destaque produtos exclusivos, qualidade, atendimento personalizado, facilidades de compra" 
      : language === "en-US"
      ? "Highlight exclusive products, quality, personalized service, shopping amenities"
      : "Destaque productos exclusivos, calidad, servicio personalizado, facilidades de compra";
  }
  else if (lowercaseCategory.includes("hotel") || lowercaseCategory.includes("pousada") || lowercaseCategory.includes("hospedagem") || lowercaseCategory.includes("lodging")) {
    categorySpecific = language === "pt-BR" 
      ? "Enfatize conforto, localização estratégica, comodidades, proximidade a atrações" 
      : language === "en-US"
      ? "Emphasize comfort, strategic location, amenities, proximity to attractions"
      : "Enfatice comodidad, ubicación estratégica, instalaciones, proximidad a atracciones";
  }
  else if (lowercaseCategory.includes("saúde") || lowercaseCategory.includes("health") || lowercaseCategory.includes("salud") || lowercaseCategory.includes("médic") || lowercaseCategory.includes("medic") || lowercaseCategory.includes("clínic") || lowercaseCategory.includes("clinic")) {
    categorySpecific = language === "pt-BR" 
      ? "Ressalte profissionalismo, cuidado personalizado, instalações modernas, certificações" 
      : language === "en-US"
      ? "Highlight professionalism, personalized care, modern facilities, certifications"
      : "Resalte profesionalismo, atención personalizada, instalaciones modernas, certificaciones";
  }
  else if (lowercaseCategory.includes("serviço") || lowercaseCategory.includes("service") || lowercaseCategory.includes("servicio")) {
    categorySpecific = language === "pt-BR" 
      ? "Destaque expertise, soluções eficientes, atendimento rápido, garantias oferecidas" 
      : language === "en-US"
      ? "Highlight expertise, efficient solutions, prompt service, guarantees offered"
      : "Destaque experiencia, soluciones eficientes, servicio rápido, garantías ofrecidas";
  }
  
  // Formato base do prompt
  const basePrompt = language === "pt-BR" 
    ? `Crie uma descrição otimizada para SEO do Google Meu Negócio para ${businessInfo.name}, um(a) ${businessInfo.category}.

OBJETIVO: Gerar uma descrição atemporal que maximize o ranqueamento do GMB e atraia potenciais clientes.

REQUISITOS DE SEO:${seoGuidance}
${categorySpecific ? `\nESPECÍFICO PARA ESTE TIPO DE NEGÓCIO:\n${categorySpecific}` : ""}

IMPORTANTE:
- Limite exato de 750 caracteres
- Texto conciso e persuasivo
- Sem quebras de linha ou marcadores
- Ênfase no valor único do negócio
- Tom profissional e acolhedor
- Linguagem clara e objetiva
- Sem datas específicas (para ser atemporal)
- Evite afirmações exageradas ou falsas

FORMATO: Um parágrafo único, sem títulos, todo em texto corrido, limitado a 750 caracteres.`
    
    : language === "en-US" 
    ? `Create an SEO-optimized Google My Business description for ${businessInfo.name}, a ${businessInfo.category}.

OBJECTIVE: Generate a timeless description that maximizes GMB ranking and attracts potential customers.

SEO REQUIREMENTS:${seoGuidance}
${categorySpecific ? `\nSPECIFIC TO THIS TYPE OF BUSINESS:\n${categorySpecific}` : ""}

IMPORTANT:
- Exact limit of 750 characters
- Concise and persuasive text
- No line breaks or bullet points
- Emphasis on the unique value of the business
- Professional and welcoming tone
- Clear and objective language
- No specific dates (to be timeless)
- Avoid exaggerated or false claims

FORMAT: A single paragraph, without titles, all in flowing text, limited to 750 characters.`
    
    : `Cree una descripción optimizada para SEO de Google Mi Negocio para ${businessInfo.name}, un(a) ${businessInfo.category}.

OBJETIVO: Generar una descripción atemporal que maximice el ranking en GMB y atraiga a clientes potenciales.

REQUISITOS DE SEO:${seoGuidance}
${categorySpecific ? `\nESPECÍFICO PARA ESTE TIPO DE NEGOCIO:\n${categorySpecific}` : ""}

IMPORTANTE:
- Límite exacto de 750 caracteres
- Texto conciso y persuasivo
- Sin saltos de línea ni viñetas
- Énfasis en el valor único del negocio
- Tono profesional y acogedor
- Lenguaje claro y objetivo
- Sin fechas específicas (para ser atemporal)
- Evite afirmaciones exageradas o falsas

FORMATO: Un único párrafo, sin títulos, todo en texto corrido, limitado a 750 caracteres.`;

  return basePrompt;
}

// Construtor de prompt para resposta de avaliações - MELHORADO
function buildReviewReplyPrompt(businessInfo: BusinessInfo, reviewText: string, language: string): string {
  // Primeiro passo: análise de sentimento da avaliação
  const sentimentAnalysisPrompt = language === "pt-BR" 
    ? `ETAPA 1: ANÁLISE DE SENTIMENTO
Analise a seguinte avaliação de cliente e classifique como:
- POSITIVA (elogio, satisfação)
- NEGATIVA (reclamação, insatisfação)
- NEUTRA (comentário sem opinião clara)
- PERGUNTA (dúvida, solicitação de informação)

Avaliação do cliente: "${reviewText}"
`
    : language === "en-US"
    ? `STEP 1: SENTIMENT ANALYSIS
Analyze the following customer review and classify it as:
- POSITIVE (praise, satisfaction)
- NEGATIVE (complaint, dissatisfaction)
- NEUTRAL (comment without clear opinion)
- QUESTION (doubt, request for information)

Customer review: "${reviewText}"
`
    : `PASO 1: ANÁLISIS DE SENTIMIENTO
Analice la siguiente reseña del cliente y clasifíquela como:
- POSITIVA (elogio, satisfacción)
- NEGATIVA (queja, insatisfacción)
- NEUTRA (comentario sin opinión clara)
- PREGUNTA (duda, solicitud de información)

Reseña del cliente: "${reviewText}"
`;

  // Segundo passo: criar resposta personalizada baseada no sentimento
  const responseGenerationPrompt = language === "pt-BR"
    ? `ETAPA 2: GERAÇÃO DE RESPOSTA
Agora, crie uma resposta profissional e personalizada para a avaliação com base na sua classificação:

Se POSITIVA:
- Agradeça sinceramente pelo feedback positivo
- Mencione algo específico do comentário
- Convide o cliente a retornar
- Assinatura com nome da empresa

Se NEGATIVA:
- Demonstre empatia e compreensão (sem pedir desculpas excessivamente)
- Não admita culpa diretamente, mas mostre preocupação
- Ofereça contato direto (sem expor informações privadas)
- Convide para resolver a situação offline
- Termine com tom positivo
- Assinatura profissional

Se NEUTRA:
- Agradeça pelo feedback
- Destaque pontos positivos do seu negócio
- Convide para uma nova visita
- Assinatura cordial

Se PERGUNTA:
- Responda diretamente à dúvida de forma informativa
- Ofereça informações adicionais relevantes
- Convide para contato para mais detalhes
- Assinatura prestativa

REQUISITOS GERAIS:
- Tom profissional e cordial
- Máximo de 240 caracteres
- Sem incluir datas específicas
- Sem jargões ou linguagem técnica
- Evitar fórmulas genéricas
- Personalizar com nome do cliente (se apresentado na avaliação)
- Incluir nome da empresa (${businessInfo.name})

FORMATO: Texto corrido, sem marcadores ou títulos.`

    : language === "en-US"
    ? `STEP 2: RESPONSE GENERATION
Now, create a professional and personalized response to the review based on your classification:

If POSITIVE:
- Sincerely thank for the positive feedback
- Mention something specific from the comment
- Invite the customer to return
- Signature with company name

If NEGATIVE:
- Show empathy and understanding (without apologizing excessively)
- Don't directly admit fault, but show concern
- Offer direct contact (without exposing private information)
- Invite to resolve the situation offline
- End with a positive tone
- Professional signature

If NEUTRAL:
- Thank for the feedback
- Highlight positive points of your business
- Invite for a new visit
- Cordial signature

If QUESTION:
- Answer the doubt directly in an informative way
- Offer relevant additional information
- Invite for contact for more details
- Helpful signature

GENERAL REQUIREMENTS:
- Professional and cordial tone
- Maximum of 240 characters
- Without including specific dates
- Without jargon or technical language
- Avoid generic formulas
- Personalize with customer name (if presented in the review)
- Include company name (${businessInfo.name})

FORMAT: Flowing text, without bullets or titles.`

    : `PASO 2: GENERACIÓN DE RESPUESTA
Ahora, cree una respuesta profesional y personalizada para la reseña según su clasificación:

Si es POSITIVA:
- Agradezca sinceramente por los comentarios positivos
- Mencione algo específico del comentario
- Invite al cliente a regresar
- Firma con nombre de la empresa

Si es NEGATIVA:
- Muestre empatía y comprensión (sin disculparse excesivamente)
- No admita directamente la culpa, pero muestre preocupación
- Ofrezca contacto directo (sin exponer información privada)
- Invite a resolver la situación offline
- Termine con un tono positivo
- Firma profesional

Si es NEUTRA:
- Agradezca por los comentarios
- Destaque puntos positivos de su negocio
- Invite a una nueva visita
- Firma cordial

Si es PREGUNTA:
- Responda directamente a la duda de forma informativa
- Ofrezca información adicional relevante
- Invite a contactar para más detalles
- Firma servicial

REQUISITOS GENERALES:
- Tono profesional y cordial
- Máximo de 240 caracteres
- Sin incluir fechas específicas
- Sin jerga o lenguaje técnico
- Evitar fórmulas genéricas
- Personalizar con nombre del cliente (si se presenta en la reseña)
- Incluir nombre de la empresa (${businessInfo.name})

FORMATO: Texto corrido, sin viñetas ni títulos.`;

  // Combinar os dois prompts para criar uma análise completa
  return `${sentimentAnalysisPrompt}

${responseGenerationPrompt}

IMPORTANTE: SUA RESPOSTA FINAL DEVE CONTER APENAS O TEXTO DA RESPOSTA, SEM MARCAÇÕES DE ETAPAS, ANÁLISES OU QUALQUER OUTRO ELEMENTO AUXILIAR.`;
}

// Construtor de prompt para Q&A - MELHORADO
function buildQAPrompt(businessInfo: BusinessInfo, language: string): string {
  // Categorias específicas e perguntas comuns por segmento
  let categorySpecificQuestions = "";
  const lowercaseCategory = businessInfo.category.toLowerCase();
  
  // Definir perguntas específicas baseadas na categoria do negócio
  if (language === "pt-BR") {
    if (lowercaseCategory.includes("restaurante") || lowercaseCategory.includes("lanchonete") || lowercaseCategory.includes("café")) {
      categorySpecificQuestions = `
- Vocês aceitam reservas? Como faço para reservar?
- Vocês têm opções vegetarianas/veganas/sem glúten?
- Qual o horário de funcionamento nos fins de semana e feriados?
- Vocês têm estacionamento próprio?
- É permitido levar crianças? Têm cadeirinhas ou menu infantil?
- Aceitam animais de estimação?
- Posso fazer pedidos para viagem/delivery?
- Vocês aceitam cartões de crédito/débito? Quais?
- Cobram taxa de serviço/couvert?
- O local é acessível para cadeirantes?`;
    } 
    else if (lowercaseCategory.includes("loja") || lowercaseCategory.includes("varejo") || lowercaseCategory.includes("mercado")) {
      categorySpecificQuestions = `
- Qual o horário de funcionamento?
- Vocês têm estacionamento para clientes?
- Aceitam cartões de crédito/débito? Parcelam compras?
- Vocês têm serviço de entrega? Qual o custo?
- Fazem trocas ou devoluções? Qual a política?
- O local é acessível para cadeirantes?
- Posso comprar pelo WhatsApp ou redes sociais?
- Vocês têm programa de fidelidade?
- Quais são os produtos/marcas mais populares que vocês vendem?
- Trabalham com encomendas especiais?`;
    }
    else if (lowercaseCategory.includes("hotel") || lowercaseCategory.includes("pousada") || lowercaseCategory.includes("hospedagem")) {
      categorySpecificQuestions = `
- Qual o horário de check-in e check-out?
- Vocês aceitam animais de estimação?
- O café da manhã está incluso na diária?
- Vocês oferecem transfer do aeroporto/rodoviária?
- Tem Wi-Fi gratuito nos quartos?
- Qual a política de cancelamento?
- Há estacionamento disponível? É gratuito?
- Os quartos têm ar-condicionado?
- Qual a distância até os principais pontos turísticos?
- Vocês aceitam crianças? Há berços disponíveis?`;
    }
    else if (lowercaseCategory.includes("saúde") || lowercaseCategory.includes("médic") || lowercaseCategory.includes("clínic")) {
      categorySpecificQuestions = `
- Vocês atendem planos de saúde? Quais?
- Preciso marcar consulta com antecedência?
- Como faço para agendar uma consulta?
- Qual o tempo médio de espera para atendimento?
- Vocês atendem urgências/emergências?
- Quais especialidades médicas vocês oferecem?
- Vocês realizam exames no local?
- Qual o horário de funcionamento?
- O local é acessível para cadeirantes?
- Como posso obter resultados de exames online?`;
    }
    else if (lowercaseCategory.includes("beleza") || lowercaseCategory.includes("salão") || lowercaseCategory.includes("barbearia")) {
      categorySpecificQuestions = `
- Preciso agendar horário? Como faço?
- Quais serviços vocês oferecem?
- Qual o preço médio dos serviços?
- Vocês trabalham com quais métodos de pagamento?
- Posso parcelar o pagamento?
- Vocês atendem aos domingos/feriados?
- Quanto tempo dura cada procedimento em média?
- Vocês aceitam cartões de crédito/débito?
- Tem estacionamento próximo?
- Fazem atendimento a domicílio?`;
    }
    else if (lowercaseCategory.includes("serviço") || lowercaseCategory.includes("consultor") || lowercaseCategory.includes("profissional")) {
      categorySpecificQuestions = `
- Como posso solicitar um orçamento?
- Quais os prazos médios para entrega dos serviços?
- Vocês atendem em domicílio/empresa?
- Quais formas de pagamento aceitam?
- Vocês emitem nota fiscal?
- É necessário agendar horário para atendimento?
- Vocês têm garantia para os serviços prestados?
- Qual a área de atendimento?
- Vocês trabalham aos fins de semana?
- Qual a experiência/qualificação dos profissionais?`;
    }
  }
  else if (language === "en-US") {
    if (lowercaseCategory.includes("restaurant") || lowercaseCategory.includes("cafe")) {
      categorySpecificQuestions = `
- Do you accept reservations? How can I make one?
- Do you have vegetarian/vegan/gluten-free options?
- What are your opening hours on weekends and holidays?
- Do you have your own parking?
- Are children allowed? Do you have high chairs or kids' menu?
- Are pets allowed?
- Can I place orders for takeout/delivery?
- Do you accept credit/debit cards? Which ones?
- Is there a service charge/cover fee?
- Is the location wheelchair accessible?`;
    } 
    else if (lowercaseCategory.includes("store") || lowercaseCategory.includes("retail") || lowercaseCategory.includes("market")) {
      categorySpecificQuestions = `
- What are your operating hours?
- Do you have customer parking?
- Do you accept credit/debit cards? Can purchases be paid in installments?
- Do you have a delivery service? What's the cost?
- Do you do exchanges or returns? What's the policy?
- Is the location wheelchair accessible?
- Can I buy through WhatsApp or social media?
- Do you have a loyalty program?
- What are the most popular products/brands you sell?
- Do you work with special orders?`;
    }
    // Continuar com outras categorias em inglês...
  }
  else if (language === "es-ES") {
    if (lowercaseCategory.includes("restaurante") || lowercaseCategory.includes("cafetería")) {
      categorySpecificQuestions = `
- ¿Aceptan reservas? ¿Cómo puedo hacer una?
- ¿Tienen opciones vegetarianas/veganas/sin gluten?
- ¿Cuál es el horario de atención los fines de semana y festivos?
- ¿Tienen estacionamiento propio?
- ¿Se permiten niños? ¿Tienen sillas altas o menú infantil?
- ¿Se permiten mascotas?
- ¿Puedo hacer pedidos para llevar/delivery?
- ¿Aceptan tarjetas de crédito/débito? ¿Cuáles?
- ¿Cobran cargo por servicio/cubierto?
- ¿El local es accesible para sillas de ruedas?`;
    } 
    else if (lowercaseCategory.includes("tienda") || lowercaseCategory.includes("comercio") || lowercaseCategory.includes("mercado")) {
      categorySpecificQuestions = `
- ¿Cuál es el horario de atención?
- ¿Tienen estacionamiento para clientes?
- ¿Aceptan tarjetas de crédito/débito? ¿Permiten pagar en cuotas?
- ¿Tienen servicio de entrega? ¿Cuál es el costo?
- ¿Hacen cambios o devoluciones? ¿Cuál es la política?
- ¿El local es accesible para sillas de ruedas?
- ¿Puedo comprar por WhatsApp o redes sociales?
- ¿Tienen programa de fidelidad?
- ¿Cuáles son los productos/marcas más populares que venden?
- ¿Trabajan con pedidos especiales?`;
    }
    // Continuar com outras categorias em espanhol...
  }
  
  // Prompt base para geração de Q&A
  const basePrompt = language === "pt-BR" 
    ? `Crie 5 pares de perguntas e respostas otimizadas para a seção Q&A do Google Meu Negócio para:

INFORMAÇÕES DA EMPRESA:
- Nome: ${businessInfo.name}
- Categoria: ${businessInfo.category}
- Endereço: ${businessInfo.address}
- Site: ${businessInfo.website || "-"}
- Telefone: ${businessInfo.phone || "-"}
- Horário: ${businessInfo.hours || "-"}

INSTRUÇÕES:
1. Crie 5 perguntas frequentes que potenciais clientes realmente fariam sobre este tipo de negócio
2. Foque no que é mais relevante para a categoria "${businessInfo.category}"
3. As perguntas devem ser diretas e simples, como os clientes realmente perguntariam
4. As respostas devem ser informativas, concisas (máximo 2 frases) e específicas
5. Evite respostas genéricas ou evasivas
6. Use linguagem natural e conversacional
7. Inclua informações práticas e úteis para o cliente
8. A Q&A deve ajudar a converter pesquisas em visitas ao estabelecimento

FORMATO:
Pergunta: [pergunta clara e direta]
Resposta: [resposta concisa e específica]

PERGUNTAS COMUNS PARA ESTE SEGMENTO:${categorySpecificQuestions || "\n(Crie perguntas específicas para este segmento)"}

IMPORTANTE: As perguntas devem soar naturais, como realmente feitas por clientes. As respostas devem ser precisas e úteis, limitadas a 150 caracteres. Separe cada par de pergunta e resposta com uma linha em branco.`
    
    : language === "en-US"
    ? `Create 5 pairs of optimized questions and answers for the Q&A section of Google My Business for:

BUSINESS INFORMATION:
- Name: ${businessInfo.name}
- Category: ${businessInfo.category}
- Address: ${businessInfo.address}
- Website: ${businessInfo.website || "-"}
- Phone: ${businessInfo.phone || "-"}
- Hours: ${businessInfo.hours || "-"}

INSTRUCTIONS:
1. Create 5 frequently asked questions that potential customers would actually ask about this type of business
2. Focus on what is most relevant to the "${businessInfo.category}" category
3. Questions should be direct and simple, as customers would actually ask
4. Answers should be informative, concise (maximum 2 sentences) and specific
5. Avoid generic or evasive answers
6. Use natural and conversational language
7. Include practical and useful information for the customer
8. The Q&A should help convert searches into visits to the establishment

FORMAT:
Question: [clear and direct question]
Answer: [concise and specific answer]

COMMON QUESTIONS FOR THIS SEGMENT:${categorySpecificQuestions || "\n(Create specific questions for this segment)"}

IMPORTANT: Questions should sound natural, as actually asked by customers. Answers should be accurate and helpful, limited to 150 characters. Separate each question and answer pair with a blank line.`
    
    : `Crea 5 pares de preguntas y respuestas optimizadas para la sección de Preguntas y Respuestas de Google Mi Negocio para:

INFORMACIÓN DE LA EMPRESA:
- Nombre: ${businessInfo.name}
- Categoría: ${businessInfo.category}
- Dirección: ${businessInfo.address}
- Sitio web: ${businessInfo.website || "-"}
- Teléfono: ${businessInfo.phone || "-"}
- Horario: ${businessInfo.hours || "-"}

INSTRUCCIONES:
1. Crea 5 preguntas frecuentes que los clientes potenciales realmente harían sobre este tipo de negocio
2. Concéntrate en lo más relevante para la categoría "${businessInfo.category}"
3. Las preguntas deben ser directas y simples, como los clientes realmente preguntarían
4. Las respuestas deben ser informativas, concisas (máximo 2 frases) y específicas
5. Evita respuestas genéricas o evasivas
6. Utiliza un lenguaje natural y conversacional
7. Incluye información práctica y útil para el cliente
8. Las preguntas y respuestas deben ayudar a convertir búsquedas en visitas al establecimiento

FORMATO:
Pregunta: [pregunta clara y directa]
Respuesta: [respuesta concisa y específica]

PREGUNTAS COMUNES PARA ESTE SEGMENTO:${categorySpecificQuestions || "\n(Crea preguntas específicas para este segmento)"}

IMPORTANTE: Las preguntas deben sonar naturales, como realmente hechas por clientes. Las respuestas deben ser precisas y útiles, limitadas a 150 caracteres. Separa cada par de pregunta y respuesta con una línea en blanco.`;

  return basePrompt;
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
