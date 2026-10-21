import { jsPDF } from 'jspdf';

interface EbookStep {
  number: string;
  title: string;
  summary: string;
  actionTip: string;
}

const EBOOK_STEPS_PAGE_1: EbookStep[] = [
  {
    number: '01',
    title: 'Alinhamento em Família: Fim do Tabu Financeiro',
    summary:
      'O maior erro dos casais e famílias é tratar o dinheiro de forma isolada ou só conversar quando a conta estoura. Defina um ambiente único onde todos enxerguem a mesma realidade sem julgamentos.',
    actionTip: 'Ação prática: Agende 15 minutos no início do mês com seu cônjuge para revisar o saldo e os objetivos da casa.',
  },
  {
    number: '02',
    title: 'Raio-X de Receitas, Despesas Fixas e Variáveis',
    summary:
      'Separe o que é custo estrutural da casa (moradia, escola, energia, internet) do que é estilo de vida (delivery, lazer, compras por impulso). Você só controla aquilo que classifica com clareza.',
    actionTip: 'Ação prática: Mantenha o comprometimento da renda abaixo de 70% para preservar margem de segurança e investimento.',
  },
  {
    number: '03',
    title: 'Elimine o "Dinheiro Queimado" (Juros e Multas)',
    summary:
      'Pagar boletos com 2 ou 5 dias de atraso por esquecimento corrói o patrimônio da família silenciosamente ao longo do ano. Multas de 2% + juros mensais são dinheiro jogado fora.',
    actionTip: 'Ação prática: Centralize os vencimentos em um quadro visual (Kanban: Atrasado, A Pagar e Pago) e meça cada centavo pago em juros.',
  },
  {
    number: '04',
    title: 'Domine o Ciclo de Fechamento dos Cartões de Crédito',
    summary:
      'O cartão de crédito não é vilão quando você respeita o dia de fechamento e o limite disponível. Compras parceladas acumulam rápido e comprometem meses futuros sem você perceber.',
    actionTip: 'Ação prática: Cadastre o dia exato de fechamento e vencimento de cada cartão para saber em qual fatura cada compra cairá.',
  },
  {
    number: '05',
    title: 'Defina Tetos Mensais por Categoria (Com Alerta em 80%)',
    summary:
      'Olhar a fatura apenas no fim do mês é olhar pelo retrovisor. Estabeleça limites claros para categorias críticas como Supermercado, Restaurantes e Lazer.',
    actionTip: 'Ação prática: Ao atingir 80% do limite mensal de uma categoria, freie os gastos variáveis naquela semana.',
  },
];

const EBOOK_STEPS_PAGE_2: EbookStep[] = [
  {
    number: '06',
    title: 'Crie Provisões Anuais (IPVA, IPTU, Matrícula e Seguros)',
    summary:
      'Janeiro e fevereiro não precisam ser meses de sufoco. Despesas anuais são 100% previsíveis: se o IPVA + IPTU somam R$ 4.800 no ano, eles custam R$ 400 por mês no seu orçamento.',
    actionTip: 'Ação prática: Dilua todas as despesas anuais em reservas mensais automáticas antes que o boleto chegue.',
  },
  {
    number: '07',
    title: 'Projete seu Saldo para os Próximos 12 Meses',
    summary:
      'Ter dinheiro na conta hoje não significa que você terá saldo livre daqui a 4 meses quando as parcelas se somarem. A visão de longo prazo evita que a família entre no cheque especial.',
    actionTip: 'Ação prática: Antes de assumir um novo parcelamento, consulte o menor saldo projetado dos próximos 12 meses.',
  },
  {
    number: '08',
    title: 'Transforme Sonhos em Metas com Prazo e Valor Mensal',
    summary:
      'Quem guarda "o que sobra" no fim do mês quase nunca guarda nada. Pague os objetivos da família primeiro, tratando cada meta como um compromisso mensal sagrado.',
    actionTip: 'Ação prática: Crie metas claras (Reserva de Paz, Viagem em Família, Troca de Carro) divididas em parcelas mensais.',
  },
  {
    number: '09',
    title: 'Adote o Ritual Semanal de Baixa em Lote',
    summary:
      'Não deixe para lançar ou dar baixa em 40 comprovantes de uma vez no último domingo do mês. Com um processo ágil, você seleciona as contas pagas da semana e dá baixa em segundos.',
    actionTip: 'Ação prática: Dedique 5 minutos toda sexta-feira para dar baixa nas contas da semana e conferir o saldo bancário.',
  },
  {
    number: '10',
    title: 'Aposente as Planilhas Soltas e Automatize em Família',
    summary:
      'Planilhas quebram fórmulas, são ruins de usar no celular e ninguém da família atualiza junto. Use uma plataforma multi-membro que calcule faturas, projeções e provisões sozinha.',
    actionTip: 'Ação prática: Ative seus 10 dias grátis no FinanFamily e convide seu parceiro(a) para gerenciar tudo em tempo real.',
  },
];

function drawPageHeader(doc: jsPDF, pageTitle: string) {
  doc.setFillColor(2, 6, 23); // slate-950
  doc.rect(0, 0, 210, 22, 'F');

  doc.setFillColor(16, 185, 129); // emerald-500
  doc.rect(0, 21, 210, 1.2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(16, 185, 129);
  doc.text('FinanFamily', 14, 13.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(203, 213, 225);
  doc.text(pageTitle, 196, 13.5, { align: 'right' });
}

function drawStepsList(doc: jsPDF, steps: EbookStep[], startY: number): number {
  let cursorY = startY;

  steps.forEach(step => {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, cursorY, 182, 41, 3, 3, 'FD');

    // Badge do número
    doc.setFillColor(16, 185, 129);
    doc.roundedRect(19, cursorY + 6, 12, 12, 2.5, 2.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(2, 6, 23);
    doc.text(step.number, 25, cursorY + 13.5, { align: 'center' });

    // Título do passo
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11.5);
    doc.setTextColor(15, 23, 42);
    doc.text(step.title, 35, cursorY + 11);

    // Resumo
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.2);
    doc.setTextColor(71, 85, 105);
    const summaryLines = doc.splitTextToSize(step.summary, 155);
    doc.text(summaryLines, 35, cursorY + 17.5);

    // Dica prática
    doc.setFillColor(236, 253, 245);
    doc.roundedRect(19, cursorY + 29.5, 172, 8.5, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.3);
    doc.setTextColor(5, 150, 105);
    doc.text(step.actionTip, 23, cursorY + 35);

    cursorY += 46;
  });

  return cursorY;
}

export function createFinanFamilyEbookDoc(readerName?: string): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const cleanName = readerName?.trim() || 'Sua Família';

  // ================= PÁGINA 1: CAPA + INTRODUÇÃO =================
  doc.setFillColor(2, 6, 23); // Fundo escuro elegante na metade superior
  doc.rect(0, 0, 210, 135, 'F');

  // Faixa esmeralda decorativa
  doc.setFillColor(16, 185, 129);
  doc.rect(0, 133, 210, 3, 'F');

  // Selo superior
  doc.setFillColor(15, 23, 42);
  doc.setDrawColor(16, 185, 129);
  doc.roundedRect(16, 20, 74, 9, 4, 4, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(52, 211, 153);
  doc.text('GUIA PRÁTICO OFICIAL • FINANFAMILY', 53, 25.8, { align: 'center' });

  // Título Principal
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.setTextColor(255, 255, 255);
  doc.text('10 Passos para Organizar', 16, 48);
  doc.text('a Vida Financeira', 16, 60);

  doc.setTextColor(52, 211, 153);
  doc.text('da Sua Família', 16, 72);

  // Subtítulo
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11.5);
  doc.setTextColor(203, 213, 225);
  const subLines = doc.splitTextToSize(
    'O método prático e sem planilhas complicadas para eliminar juros, domar faturas de cartão, planejar despesas anuais e projetar os próximos 12 meses com clareza.',
    175
  );
  doc.text(subLines, 16, 86);

  // Box de personalização
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(16, 108, 178, 16, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(255, 255, 255);
  doc.text(`Material preparado para: ${cleanName}`, 22, 118);

  // Conteúdo da Página 1 (Introdução + Regra de Ouro)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(15, 23, 42);
  doc.text('Por que 8 em cada 10 famílias perdem o controle do orçamento?', 16, 152);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  doc.setTextColor(51, 65, 85);
  const introText = doc.splitTextToSize(
    'O problema quase nunca é falta de esforço: é falta de visibilidade conjunta. Quando um membro da família faz compras no cartão, outro paga boletos da casa e as despesas anuais (IPVA, IPTU, matrícula escolar) chegam de surpresa, qualquer planilha isolada fica desatualizada em poucos dias.\n\nEste guia reúne os 10 passos essenciais que aplicamos dentro da plataforma FinanFamily para transformar ansiedade financeira em previsibilidade de 12 meses.',
    178
  );
  doc.text(introText, 16, 161);

  // Pilares de Ouro
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(16, 196, 178, 52, 4, 4, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('Os 3 Pilares da Paz Financeira Familiar:', 22, 207);

  const pillars = [
    '1. Visão Unificada: Todos os bancos, cartões e membros sincronizados no mesmo lugar.',
    '2. Antecipação: Saber hoje qual será o saldo da família daqui a 6 ou 12 meses.',
    '3. Proteção contra Desperdícios: Zero reais queimados com juros e multas por esquecimento.',
  ];
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(51, 65, 85);
  pillars.forEach((p, idx) => {
    doc.text(p, 22, 218 + idx * 9);
  });

  // Rodapé Página 1
  doc.setFillColor(236, 253, 245);
  doc.roundedRect(16, 258, 178, 22, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(5, 150, 105);
  doc.text('Dica: Você tem 10 dias de teste grátis no FinanFamily para aplicar este guia na prática!', 22, 268);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Continue na próxima página para conferir os Passos 01 a 10 ->', 22, 275);

  // ================= PÁGINA 2: PASSOS 01 A 05 =================
  doc.addPage();
  drawPageHeader(doc, 'Parte 1: Diagnóstico, Cartões e Controle de Caixa (Passos 01 a 05)');
  drawStepsList(doc, EBOOK_STEPS_PAGE_1, 30);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(148, 163, 184);
  doc.text('FinanFamily • A Inteligência Financeira da Sua Família — Página 2 de 3', 105, 288, { align: 'center' });

  // ================= PÁGINA 3: PASSOS 06 A 10 + CONVITE =================
  doc.addPage();
  drawPageHeader(doc, 'Parte 2: Provisões Anuais, Projeção 12m e Automação (Passos 06 a 10)');
  const endY = drawStepsList(doc, EBOOK_STEPS_PAGE_2, 28);

  // Box Final de Convite (CTA)
  doc.setFillColor(2, 6, 23);
  doc.roundedRect(14, endY + 1, 182, 24, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(52, 211, 153);
  doc.text('Pronto para colocar os 10 passos em prática hoje mesmo?', 20, endY + 9);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(226, 232, 240);
  doc.text(
    'Acesse o FinanFamily, ative seus 10 dias grátis e organize toda a vida financeira da família em 1 minuto.',
    20,
    endY + 16
  );
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('Planos após o período de teste: Mensal R$ 29,90/mês ou Anual R$ 298,80 (12x de R$ 24,90).', 20, endY + 21.5);

  return doc;
}

export function generateFinanFamilyEbookPdf(readerName?: string): void {
  const doc = createFinanFamilyEbookDoc(readerName);
  doc.save('Ebook-10-Passos-FinanFamily.pdf');
}
