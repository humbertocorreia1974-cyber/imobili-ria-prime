const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

const senha = bcrypt.hashSync('Demo@1234', 10);

async function main() {
  const imob = await prisma.imobiliaria.upsert({
    where: { cnpj: '12.345.678/0001-90' },
    update: {},
    create: { nome: 'Imobiliária Prime', cnpj: '12.345.678/0001-90', email: 'contato@prime.com.br', telefone: '(11) 3456-7890', endereco: 'Av. Paulista, 1000 - São Paulo/SP', taxaAdministracaoPct: 8.0, diaRepasse: 10, indiceReajustePadrao: 'IGP-M', gatewayProvider: 'asaas', whatsappEnabled: true, whatsappPhoneId: '5511999999999' },
  });

  const users = [
    { email: 'admin@demo.app', name: 'Admin Prime', role: 'admin' },
    { email: 'corretor@demo.app', name: 'Carlos Corretor', role: 'corretor' },
    { email: 'proprietario@demo.app', name: 'Paulo Proprietário', role: 'proprietario' },
    { email: 'inquilino@demo.app', name: 'Inês Inquilina', role: 'inquilino' },
    { email: 'jogador@demo.app', name: 'João Usuário', role: 'user' },
  ];
  const u = {};
  for (const x of users) u[x.role] = await prisma.user.upsert({ where: { email: x.email }, update: {}, create: { email: x.email, name: x.name, passwordHash: senha, role: x.role, plan: 'pro', termsAcceptedAt: new Date() } });

  const prop = await prisma.proprietario.upsert({ where: { cpfCnpj: '123.456.789-00' }, update: {}, create: { userId: u.proprietario.id, imobiliariaId: imob.id, nome: 'Paulo Proprietário', cpfCnpj: '123.456.789-00', email: 'proprietario@demo.app', telefone: '(11) 98888-1111', endereco: 'Rua das Flores, 100 - São Paulo/SP', banco: 'Itaú', agencia: '1234', conta: '56789-0', pixChave: 'proprietario@demo.app' } });
  const corr = await prisma.corretor.upsert({ where: { creci: 'SP-123456' }, update: {}, create: { userId: u.corretor.id, imobiliariaId: imob.id, nome: 'Carlos Corretor', creci: 'SP-123456', email: 'corretor@demo.app', telefone: '(11) 97777-2222', comissaoPadraoPct: 6.0, metaMensal: 50000 } });
  const cli = await prisma.cliente.upsert({ where: { id: 'cli-demo-1' }, update: {}, create: { id: 'cli-demo-1', userId: u.inquilino.id, imobiliariaId: imob.id, nome: 'Inês Inquilina', email: 'inquilino@demo.app', telefone: '(11) 96666-3333', cpf: '987.654.321-00', origem: 'site', scoreLead: 75, interesseTipo: 'apartamento', faixaPrecoMin: 2000, faixaPrecoMax: 4000, bairrosInteresse: ['Pinheiros', 'Vila Madalena'] } });

  const feats = ['Piscina', 'Academia', 'Churrasqueira', 'Portaria 24h', 'Elevador', 'Varanda Gourmet', 'Playground', 'Salão de Festas'];
  for (const nome of feats) await prisma.feature.upsert({ where: { nome }, update: {}, create: { nome, categoria: 'lazer' } });

  const imoveisData = [
    { codigo: 'PR-001', titulo: 'Apartamento 2 quartos em Pinheiros', tipo: 'apartamento', finalidade: 'locacao', bairro: 'Pinheiros', cidade: 'São Paulo', estado: 'SP', valorAluguel: 3200, quartos: 2, banheiros: 1, vagas: 1, areaConstruida: 65, latitude: -23.5645, longitude: -46.6925 },
    { codigo: 'PR-002', titulo: 'Casa 3 quartos na Vila Mariana', tipo: 'casa', finalidade: 'venda', bairro: 'Vila Mariana', cidade: 'São Paulo', estado: 'SP', valorVenda: 850000, quartos: 3, banheiros: 2, vagas: 2, areaConstruida: 150, latitude: -23.5893, longitude: -46.6345 },
    { codigo: 'PR-003', titulo: 'Studio mobiliado na Vila Madalena', tipo: 'apartamento', finalidade: 'locacao', bairro: 'Vila Madalena', cidade: 'São Paulo', estado: 'SP', valorAluguel: 2500, quartos: 1, banheiros: 1, vagas: 0, areaConstruida: 35, mobiliado: true, latitude: -23.5520, longitude: -46.6900 },
    { codigo: 'PR-004', titulo: 'Sala comercial na Av. Faria Lima', tipo: 'comercial', finalidade: 'locacao', bairro: 'Itaim Bibi', cidade: 'São Paulo', estado: 'SP', valorAluguel: 8500, banheiros: 2, vagas: 3, areaConstruida: 120, latitude: -23.5859, longitude: -46.6820 },
    { codigo: 'PR-005', titulo: 'Apartamento 3 quartos no Morumbi', tipo: 'apartamento', finalidade: 'venda', bairro: 'Morumbi', cidade: 'São Paulo', estado: 'SP', valorVenda: 1200000, quartos: 3, suites: 1, banheiros: 3, vagas: 2, areaConstruida: 130, latitude: -23.6220, longitude: -46.6990 },
  ];
  const imoveis = [];
  for (const d of imoveisData) {
    const im = await prisma.imovel.upsert({ where: { codigo: d.codigo }, update: {}, create: { ...d, imobiliariaId: imob.id, proprietarioId: prop.id, corretorId: corr.id, situacao: 'disponivel', aceitaPets: true, validado: true, validadoEm: new Date(), publicado: true } });
    imoveis.push(im);
  }

  if (await prisma.propertyMedia.count() === 0) {
    const midias = [];
    for (const im of imoveis) for (let i = 1; i <= 3; i++) midias.push({ imovelId: im.id, url: `https://picsum.photos/seed/${im.codigo}-${i}/800/600`, tipo: 'foto', ordem: i, principal: i === 1 });
    await prisma.propertyMedia.createMany({ data: midias });
  }

  if (await prisma.imovelFeature.count() === 0) {
    const allFeats = await prisma.feature.findMany();
    const ifs = [];
    for (const im of imoveis) for (const f of allFeats.slice(0, 4)) ifs.push({ imovelId: im.id, featureId: f.id });
    await prisma.imovelFeature.createMany({ data: ifs });
  }

  if (await prisma.visita.count() === 0) {
    const visitas = [];
    for (let i = 0; i < 5; i++) visitas.push({ imovelId: imoveis[i % imoveis.length].id, corretorId: corr.id, clienteId: cli.id, userIdCorretor: u.corretor.id, userIdCliente: u.inquilino.id, dataHora: new Date(Date.now() + (i + 1) * 86400000), duracaoMin: 30, status: i < 2 ? 'realizada' : 'agendada', observacoes: 'Visita de demonstração' });
    await prisma.visita.createMany({ data: visitas });
  }

  if (await prisma.interacaoLead.count() === 0) {
    await prisma.interacaoLead.createMany({ data: [
      { clienteId: cli.id, tipo: 'ligacao', descricao: 'Primeiro contato', pontosScore: 10 },
      { clienteId: cli.id, tipo: 'visita', descricao: 'Visitou imóvel PR-001', pontosScore: 25 },
      { clienteId: cli.id, tipo: 'email', descricao: 'Enviou proposta', pontosScore: 40 },
    ] });
  }

  const prop1 = await prisma.proposta.upsert({ where: { id: 'prop-demo-1' }, update: {}, create: { id: 'prop-demo-1', imovelId: imoveis[0].id, clienteId: cli.id, corretorId: corr.id, proprietarioId: prop.id, criadoPorId: u.corretor.id, tipo: 'locacao', valor: 3000, valorCondominio: 500, valorIptu: 100, garantiaTipo: 'seguro_fianca', prazoMeses: 12, dataInicio: new Date(), status: 'aprovada', aprovadaEm: new Date() } });

  const contrato = await prisma.contrato.upsert({ where: { numero: 'CT-2025-001' }, update: {}, create: { imobiliariaId: imob.id, imovelId: imoveis[0].id, propostaId: prop1.id, corretorId: corr.id, inquilinoId: cli.id, userIdInquilino: u.inquilino.id, numero: 'CT-2025-001', tipo: 'locacao', status: 'ativo', valorMensal: 3000, valorCaucao: 9000, garantiaTipo: 'seguro_fianca', indiceReajuste: 'IGP-M', dataInicio: new Date(), dataFim: new Date(Date.now() + 365 * 86400000), diaVencimento: 10, proximoReajusteEm: new Date(Date.now() + 365 * 86400000), assinaturaProvider: 'clicksign', assinadoEm: new Date() } });

  if (await prisma.parcela.count() === 0) {
    const parcelas = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date(); d.setMonth(d.getMonth() + i);
      parcelas.push({ contratoId: contrato.id, competencia: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, numero: i + 1, valorBruto: 3000, valorTotal: 3000, dataVencimento: new Date(d.getFullYear(), d.getMonth(), 10), status: i === 0 ? 'pago' : 'pendente', dataPagamento: i === 0 ? new Date() : null });
    }
    await prisma.parcela.createMany({ data: parcelas });
  }

  if (await prisma.repasse.count() === 0) {
    const p = await prisma.parcela.findFirst({ where: { contratoId: contrato.id } });
    await prisma.repasse.create({ data: { imobiliariaId: imob.id, proprietarioId: prop.id, contratoId: contrato.id, parcelaId: p.id, valorBruto: 3000, valorTaxa: 240, valorLiquido: 2760, competencia: p.competencia, status: 'pago', dataRepasse: new Date() } });
  }

  if (await prisma.comissao.count() === 0) {
    await prisma.comissao.create({ data: { imobiliariaId: imob.id, corretorId: corr.id, contratoId: contrato.id, valorBase: 3000, percentual: 6.0, valor: 180, status: 'pendente', competencia: new Date().toISOString().slice(0, 7) } });
  }

  if (await prisma.manutencao.count() === 0) {
    await prisma.manutencao.create({ data: { imobiliariaId: imob.id, imovelId: imoveis[0].id, proprietarioId: prop.id, solicitanteId: u.inquilino.id, aprovadorId: u.admin.id, titulo: 'Reparo no chuveiro', descricao: 'Chuveiro com vazamento', categoria: 'hidraulica', prioridade: 'media', status: 'aprovada', valorEstimado: 350, valorAprovado: 350, aprovadoEm: new Date() } });
  }

  if (await prisma.vistoria.count() === 0) {
    await prisma.vistoria.create({ data: { imovelId: imoveis[0].id, contratoId: contrato.id, responsavelId: u.corretor.id, tipo: 'entrada', status: 'concluida', dataAgendada: new Date(), dataRealizada: new Date(), observacoes: 'Imóvel em bom estado' } });
  }

  if (await prisma.notificacao.count() === 0) {
    await prisma.notificacao.createMany({ data: [
      { imobiliariaId: imob.id, userId: u.inquilino.id, titulo: 'Contrato ativo', mensagem: 'Seu contrato foi assinado com sucesso', tipo: 'contrato', lida: false },
      { imobiliariaId: imob.id, userId: u.proprietario.id, titulo: 'Repasse realizado', mensagem: 'Repasse do mês efetuado', tipo: 'repasse', lida: true },
    ] });
  }

  if (await prisma.logAuditoria.count() === 0) {
    await prisma.logAuditoria.create({ data: { userId: u.admin.id, acao: 'criar', entidade: 'Imovel', entidadeId: imoveis[0].id, detalhes: { codigo: 'PR-001' } } });
  }
}

main().then(() => prisma.$disconnect()).catch(async (e) => { console.error('[seed] ERRO:', e.message); await prisma.$disconnect(); process.exit(1); });