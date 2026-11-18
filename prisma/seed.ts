// ═══════════════════════════════════════════════════════════
// Seed do Banco de Dados - Dados realistas brasileiros
// Execute: npm run db:seed
// ═══════════════════════════════════════════════════════════

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Limpar dados existentes (ordem respeita chaves estrangeiras)
  await prisma.transacaoPagamento.deleteMany();
  await prisma.agendamentoServico.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.servico.deleteMany();
  await prisma.veiculo.deleteMany();
  await prisma.loja.deleteMany();
  await prisma.user.deleteMany();

  // ─── Criar Usuários ──────────────────────────────────────
  const senhaHash = await bcrypt.hash('123456', 12);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@automarket.com.br',
      senha: senhaHash,
      nome: 'Administrador',
      telefone: '27999990000',
      role: 'ADMIN',
    },
  });

  const lojista1 = await prisma.user.create({
    data: {
      email: 'contato@premiumcarros.com.br',
      senha: senhaHash,
      nome: 'Ricardo Silva',
      telefone: '11999881234',
      role: 'LOJISTA',
    },
  });

  const lojista2 = await prisma.user.create({
    data: {
      email: 'vendas@autotop.com.br',
      senha: senhaHash,
      nome: 'Fernanda Costa',
      telefone: '21988776655',
      role: 'LOJISTA',
    },
  });

  const lojista3 = await prisma.user.create({
    data: {
      email: 'contato@luxmotors.com.br',
      senha: senhaHash,
      nome: 'Carlos Mendes',
      telefone: '31977665544',
      role: 'LOJISTA',
    },
  });

  const usuario1 = await prisma.user.create({
    data: {
      email: 'joao@email.com',
      senha: senhaHash,
      nome: 'João Oliveira',
      telefone: '27998887766',
      role: 'USUARIO',
    },
  });

  console.log('✅ Usuários criados');

  // ─── Criar Lojas ─────────────────────────────────────────
  const loja1 = await prisma.loja.create({
    data: {
      nome: 'Premium Carros SP',
      cnpj: '12345678000190',
      descricao: 'A maior loja de seminovos premium de São Paulo. Mais de 15 anos no mercado oferecendo os melhores veículos com procedência garantida.',
      endereco: 'Av. dos Autonomistas, 1500',
      cidade: 'São Paulo',
      estado: 'SP',
      cep: '06020010',
      telefone: '27998345027',
      whatsapp: '5527998345027',
      email: 'contato@premiumcarros.com.br',
      website: 'https://premiumcarros.com.br',
      horarioFuncionamento: 'Seg-Sex: 8h às 18h | Sáb: 8h às 14h',
      plano: 'PREMIUM',
      assinaturaAtiva: true,
      userId: lojista1.id,
    },
  });

  const loja2 = await prisma.loja.create({
    data: {
      nome: 'AutoTop Rio',
      cnpj: '98765432000199',
      descricao: 'Especialistas em veículos 0km e seminovos das melhores marcas. Financiamento facilitado em até 60x.',
      endereco: 'Rua Conde de Bonfim, 800',
      cidade: 'Rio de Janeiro',
      estado: 'RJ',
      cep: '20530001',
      telefone: '27998345027',
      whatsapp: '5527998345027',
      email: 'vendas@autotop.com.br',
      horarioFuncionamento: 'Seg-Sex: 9h às 19h | Sáb: 9h às 15h',
      plano: 'ENTERPRISE',
      assinaturaAtiva: true,
      userId: lojista2.id,
    },
  });

  const loja3 = await prisma.loja.create({
    data: {
      nome: 'Lux Motors BH',
      cnpj: '11223344000155',
      descricao: 'Concessionária de veículos de luxo em Belo Horizonte. BMW, Mercedes, Audi e mais com as melhores condições.',
      endereco: 'Av. Raja Gabáglia, 2000',
      cidade: 'Belo Horizonte',
      estado: 'MG',
      cep: '30494000',
      telefone: '27998345027',
      whatsapp: '5527998345027',
      email: 'contato@luxmotors.com.br',
      horarioFuncionamento: 'Seg-Sex: 8h30 às 18h30 | Sáb: 9h às 13h',
      plano: 'BASICO',
      assinaturaAtiva: true,
      userId: lojista3.id,
    },
  });

  console.log('✅ Lojas criadas');

  // ─── Criar Veículos ──────────────────────────────────────
  const veiculosData = [
    // Loja 1 - Premium Carros SP
    {
      marca: 'Toyota', modelo: 'Corolla', versao: '2.0 XEi Dynamic Force Flex CVT',
      ano: 2024, anoModelo: 2025, km: 8500, cambio: 'CVT', combustivel: 'FLEX',
      categoria: 'SEDAN', cor: 'Branco Pérola', portas: 4, motor: '2.0', potencia: '177cv',
      preco: 149900, descricao: 'Toyota Corolla XEi 2024/2025 com apenas 8.500km rodados. Único dono, revisões na concessionária. Completo com central multimídia, câmera de ré, sensor de estacionamento, ar digital dual zone, bancos em couro sintético.',
      opcionais: JSON.stringify(['Central Multimídia', 'Câmera de Ré', 'Sensor de Estacionamento', 'Ar Digital', 'Bancos em Couro', 'Piloto Automático', 'Faróis LED', 'Rodas de Liga 17"']),
      imagemPrincipal: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800',
      destaque: true, lojaId: loja1.id,
    },
    {
      marca: 'Honda', modelo: 'Civic', versao: '2.0 e:HEV Touring Hybrid',
      ano: 2024, anoModelo: 2024, km: 12000, cambio: 'CVT', combustivel: 'HIBRIDO',
      categoria: 'SEDAN', cor: 'Cinza Metálico', portas: 4, motor: '2.0 Hybrid', potencia: '184cv',
      preco: 189900, descricao: 'Honda Civic Touring Hybrid 2024, top de linha. Motor híbrido com consumo excepcional. Teto solar, interior em couro, Honda Sensing completo.',
      opcionais: JSON.stringify(['Teto Solar', 'Honda Sensing', 'Couro Legítimo', 'Carregador Wireless', 'Head-up Display', 'JBL Premium', 'ACC']),
      imagemPrincipal: 'https://images.unsplash.com/photo-1606611013004-1a65a358e498?w=800',
      destaque: true, lojaId: loja1.id,
    },
    {
      marca: 'Volkswagen', modelo: 'T-Cross', versao: '1.0 TSI Highline Flex AT',
      ano: 2023, anoModelo: 2024, km: 22000, cambio: 'AUTOMATICO', combustivel: 'FLEX',
      categoria: 'SUV', cor: 'Azul Biscay', portas: 4, motor: '1.0 TSI', potencia: '128cv',
      preco: 119900, descricao: 'VW T-Cross Highline 2023/2024, impecável. Completa com teto solar panorâmico, multimídia VW Play 10", couro, etc.',
      opcionais: JSON.stringify(['Teto Solar Panorâmico', 'VW Play 10"', 'Couro', 'Ar Digital', 'Keyless', 'Start/Stop', 'Rodas 17"']),
      imagemPrincipal: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800',
      destaque: false, lojaId: loja1.id,
    },
    {
      marca: 'Chevrolet', modelo: 'Onix', versao: '1.0 Turbo Premier AT',
      ano: 2023, anoModelo: 2023, km: 35000, cambio: 'AUTOMATICO', combustivel: 'FLEX',
      categoria: 'HATCH', cor: 'Vermelho Carmim', portas: 4, motor: '1.0 Turbo', potencia: '116cv',
      preco: 79900, descricao: 'Chevrolet Onix Premier Turbo Automático. Carro muito econômico e completo. Wi-Fi nativo, OnStar, MyLink 8".',
      opcionais: JSON.stringify(['Wi-Fi', 'OnStar', 'MyLink 8"', 'Câmera de Ré', 'Sensor de Estacionamento', 'Alerta de Colisão']),
      imagemPrincipal: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800',
      destaque: false, lojaId: loja1.id,
    },
    {
      marca: 'Hyundai', modelo: 'HB20', versao: '1.0 TGDI Platinum Plus AT',
      ano: 2024, anoModelo: 2024, km: 5000, cambio: 'AUTOMATICO', combustivel: 'FLEX',
      categoria: 'HATCH', cor: 'Prata Metal', portas: 4, motor: '1.0 TGDI', potencia: '120cv',
      preco: 95900, precoPromocional: 89900, descricao: 'HB20 Platinum Plus, o mais completo da linha. Apenas 5.000km, praticamente zero! Carplay/Android Auto sem fio.',
      opcionais: JSON.stringify(['Carplay Wireless', 'Android Auto Wireless', 'Couro', 'Câmera 360°', 'Sensor Dianteiro', 'Faróis Full LED', 'DRL']),
      imagemPrincipal: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0afa?w=800',
      destaque: true, lojaId: loja1.id,
    },
    // Loja 2 - AutoTop Rio
    {
      marca: 'Jeep', modelo: 'Compass', versao: '1.3 T270 Turbo Flex Limited AT',
      ano: 2024, anoModelo: 2024, km: 15000, cambio: 'AUTOMATICO', combustivel: 'FLEX',
      categoria: 'SUV', cor: 'Preto Vulcano', portas: 4, motor: '1.3 Turbo', potencia: '185cv',
      preco: 169900, descricao: 'Jeep Compass Limited 2024 com pacote Tech. SUV mais vendido do Brasil. Teto solar, couro, multimídia 10.1".',
      opcionais: JSON.stringify(['Teto Solar', 'Couro Marrom', 'Multimídia 10.1"', 'Pacote Tech', 'Piloto Automático Adaptativo', 'Faróis Full LED', 'Detector de Fadiga']),
      imagemPrincipal: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800',
      destaque: true, lojaId: loja2.id,
    },
    {
      marca: 'Fiat', modelo: 'Pulse', versao: '1.0 Turbo Flex Impetus CVT',
      ano: 2023, anoModelo: 2024, km: 28000, cambio: 'CVT', combustivel: 'FLEX',
      categoria: 'SUV', cor: 'Laranja Daytona', portas: 4, motor: '1.0 Turbo', potencia: '130cv',
      preco: 99900, descricao: 'Fiat Pulse Impetus Turbo CVT. SUV compacto completo com excelente custo-benefício. Multimídia 10.1" com Alexa integrada.',
      opcionais: JSON.stringify(['Alexa Integrada', 'Multimídia 10.1"', 'Wireless Charger', 'Keyless', 'Ar Digital', 'Rodas 17" Diamantadas']),
      imagemPrincipal: 'https://images.unsplash.com/photo-1619682817481-e994891cd1f5?w=800',
      destaque: false, lojaId: loja2.id,
    },
    {
      marca: 'Toyota', modelo: 'Hilux', versao: '2.8 D-4D SRX 4x4 AT',
      ano: 2023, anoModelo: 2023, km: 45000, cambio: 'AUTOMATICO', combustivel: 'DIESEL',
      categoria: 'PICKUP', cor: 'Branco Polar', portas: 4, motor: '2.8 Diesel', potencia: '204cv',
      preco: 279900, descricao: 'Toyota Hilux SRX 2023, a picape mais desejada do Brasil. Motor diesel com torque brutal. Perfeita para trabalho e lazer.',
      opcionais: JSON.stringify(['Tração 4x4', 'Controle de Tração', 'Descida Assistida', 'Couro', 'Toyota Safety Sense', 'Câmera de Ré', 'Capota Marítima']),
      imagemPrincipal: 'https://images.unsplash.com/photo-1559416523-140ddc3d238c?w=800',
      destaque: true, lojaId: loja2.id,
    },
    {
      marca: 'Nissan', modelo: 'Kicks', versao: '1.6 Exclusive e-Power',
      ano: 2024, anoModelo: 2025, km: 3000, cambio: 'CVT', combustivel: 'HIBRIDO',
      categoria: 'SUV', cor: 'Cinza Gun Metallic', portas: 4, motor: '1.6 e-Power', potencia: '129cv',
      preco: 142900, descricao: 'Nissan Kicks Exclusive com tecnologia e-Power (híbrido). Praticamente novo com 3.000km. Nível de conforto e tecnologia impressionante.',
      opcionais: JSON.stringify(['e-Power', 'ProPILOT', 'Around View Monitor', 'Couro', 'Bose Premium', 'Faróis LED', 'Carregador Wireless']),
      imagemPrincipal: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800',
      destaque: false, lojaId: loja2.id,
    },
    {
      marca: 'Renault', modelo: 'Duster', versao: '1.3 TCe Iconic CVT',
      ano: 2023, anoModelo: 2024, km: 32000, cambio: 'CVT', combustivel: 'FLEX',
      categoria: 'SUV', cor: 'Verde Floresta', portas: 4, motor: '1.3 Turbo', potencia: '170cv',
      preco: 109900, descricao: 'Novo Renault Duster Iconic 2023/2024. Design completamente renovado, motor turbo potente e muito espaço interno.',
      opcionais: JSON.stringify(['Multimídia 8"', 'Câmera 360°', 'Alerta de Ponto Cego', 'Frenagem de Emergência', 'Easy Link', 'Ar Digital', 'Rodas 17"']),
      imagemPrincipal: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800',
      destaque: false, lojaId: loja2.id,
    },
    {
      marca: 'Fiat', modelo: 'Strada', versao: '1.3 Flex Volcano CD',
      ano: 2024, anoModelo: 2024, km: 18000, cambio: 'MANUAL', combustivel: 'FLEX',
      categoria: 'PICKUP', cor: 'Branco Banchisa', portas: 4, motor: '1.3 Firefly', potencia: '107cv',
      preco: 89900, descricao: 'Fiat Strada Volcano Cabine Dupla 2024. A picape mais vendida do Brasil! Excelente para trabalho com conforto de passeio.',
      opcionais: JSON.stringify(['Cabine Dupla', 'Multimídia 7"', 'Ar Condicionado', 'Direção Elétrica', 'Airbags', 'Controle de Estabilidade']),
      imagemPrincipal: 'https://images.unsplash.com/photo-1612825173281-9a193378527e?w=800',
      destaque: false, lojaId: loja2.id,
    },
    // Loja 3 - Lux Motors BH
    {
      marca: 'BMW', modelo: '320i', versao: '2.0 M Sport GP Turbo AT',
      ano: 2024, anoModelo: 2024, km: 10000, cambio: 'AUTOMATICO', combustivel: 'GASOLINA',
      categoria: 'SEDAN', cor: 'Preto Sapphire', portas: 4, motor: '2.0 Turbo', potencia: '184cv',
      preco: 289900, descricao: 'BMW 320i M Sport Grand Prix Edition 2024. Sedan esportivo de luxo com pacote M. Interior em couro Vernasca, teto solar, Driving Assistant.',
      opcionais: JSON.stringify(['Pacote M Sport', 'Couro Vernasca', 'Teto Solar', 'Driving Assistant', 'BMW Live Cockpit', 'Harman Kardon', 'Head-up Display', 'Rodas 19" M']),
      imagemPrincipal: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800',
      destaque: true, lojaId: loja3.id,
    },
    {
      marca: 'Mercedes-Benz', modelo: 'GLA 200', versao: '1.3 CGI Turbo Advance AT',
      ano: 2023, anoModelo: 2024, km: 20000, cambio: 'AUTOMATICO', combustivel: 'GASOLINA',
      categoria: 'SUV', cor: 'Branco Polar', portas: 4, motor: '1.3 Turbo', potencia: '163cv',
      preco: 249900, descricao: 'Mercedes GLA 200 Advance 2023/2024. SUV premium compacto com todo luxo e sofisticação Mercedes-Benz. MBUX com tela dupla de 10.25".',
      opcionais: JSON.stringify(['MBUX Dual Screen', 'Couro ARTICO', 'Teto Panorâmico', 'Burmester 3D', 'Pacote Premium', 'Faróis Multibeam LED', 'AMG Line Exterior']),
      imagemPrincipal: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800',
      destaque: true, lojaId: loja3.id,
    },
    {
      marca: 'Audi', modelo: 'A3 Sedan', versao: '1.4 TFSI Prestige Plus S-Tronic',
      ano: 2023, anoModelo: 2023, km: 25000, cambio: 'AUTOMATIZADO', combustivel: 'GASOLINA',
      categoria: 'SEDAN', cor: 'Cinza Nano', portas: 4, motor: '1.4 TFSI', potencia: '150cv',
      preco: 219900, descricao: 'Audi A3 Sedan Prestige Plus 2023. Design elegante e esportivo, tecnologia de cockpit virtual Audi, câmbio S-Tronic de 7 velocidades.',
      opcionais: JSON.stringify(['Virtual Cockpit', 'MMI Navigation', 'Bang & Olufsen', 'Couro', 'Faróis Matrix LED', 'Paddle Shift', 'Drive Select']),
      imagemPrincipal: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800',
      destaque: false, lojaId: loja3.id,
    },
    {
      marca: 'Volvo', modelo: 'XC40', versao: 'T5 R-Design Recharge Plug-in Hybrid',
      ano: 2024, anoModelo: 2024, km: 7000, cambio: 'AUTOMATICO', combustivel: 'HIBRIDO',
      categoria: 'SUV', cor: 'Azul Denim', portas: 4, motor: '1.5 Turbo Hybrid', potencia: '262cv',
      preco: 329900, precoPromocional: 309900, descricao: 'Volvo XC40 Recharge R-Design Plug-in Hybrid. SUV premium escandinavo com motor híbrido plug-in. Segurança 5 estrelas Euro NCAP.',
      opcionais: JSON.stringify(['Plug-in Hybrid', 'Pilot Assist', 'Harman Kardon', 'Teto Panorâmico', 'Google Built-in', 'Wireless Charger', '360° Camera', 'Air Purifier']),
      imagemPrincipal: 'https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=800',
      destaque: true, lojaId: loja3.id,
    },
    // Mais veículos populares
    {
      marca: 'Chevrolet', modelo: 'Tracker', versao: '1.0 Turbo Premier AT',
      ano: 2024, anoModelo: 2024, km: 11000, cambio: 'AUTOMATICO', combustivel: 'FLEX',
      categoria: 'SUV', cor: 'Azul Seeker', portas: 4, motor: '1.0 Turbo', potencia: '116cv',
      preco: 129900, descricao: 'Chevrolet Tracker Premier 2024, SUV compacto top de linha. Conectividade Wi-Fi, OnStar, MyLink 8" com wireless projection.',
      opcionais: JSON.stringify(['Wi-Fi', 'OnStar', 'Teto Solar', 'Couro', 'Câmera de Ré HD', 'Sensor Dianteiro', 'Alerta de Ponto Cego']),
      imagemPrincipal: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800',
      destaque: false, lojaId: loja1.id,
    },
    {
      marca: 'Honda', modelo: 'HR-V', versao: '1.5 Turbo Advance CVT',
      ano: 2023, anoModelo: 2024, km: 30000, cambio: 'CVT', combustivel: 'FLEX',
      categoria: 'SUV', cor: 'Cinza Lunar', portas: 4, motor: '1.5 Turbo', potencia: '177cv',
      preco: 159900, descricao: 'Honda HR-V Advance Turbo 2023/2024. Nova geração completamente redesenhada. Motor turbo potente e interior premium.',
      opcionais: JSON.stringify(['Honda Sensing', 'Multimídia 9"', 'Carplay Wireless', 'Ar Digital', 'Couro', 'Câmera Multi-Angle', 'LED Faróis/Lanternas']),
      imagemPrincipal: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800',
      destaque: false, lojaId: loja2.id,
    },
    {
      marca: 'Hyundai', modelo: 'Creta', versao: '1.0 TGDI Platinum AT',
      ano: 2024, anoModelo: 2025, km: 2000, cambio: 'AUTOMATICO', combustivel: 'FLEX',
      categoria: 'SUV', cor: 'Branco Atlas', portas: 4, motor: '1.0 TGDI', potencia: '120cv',
      preco: 139900, descricao: 'Hyundai Creta Platinum 2024/2025. Praticamente zero! Top de linha com visual renovado, interior premium e tecnologia de ponta.',
      opcionais: JSON.stringify(['Teto Solar Panorâmico', 'Couro', 'Bluelink', 'Câmera 360°', 'Cluster Digital', 'Carregador Wireless', 'Ar Digital Dual Zone']),
      imagemPrincipal: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=800',
      destaque: true, lojaId: loja1.id,
    },
    {
      marca: 'Volkswagen', modelo: 'Polo', versao: '1.0 TSI Highline AT',
      ano: 2023, anoModelo: 2023, km: 40000, cambio: 'AUTOMATICO', combustivel: 'FLEX',
      categoria: 'HATCH', cor: 'Vermelho Sunset', portas: 4, motor: '1.0 TSI', potencia: '128cv',
      preco: 82900, descricao: 'VW Polo Highline TSI Automático 2023. Hatch premium compacto. Excelente custo-benefício com motor turbo e boa lista de equipamentos.',
      opcionais: JSON.stringify(['VW Play', 'App Connect Wireless', 'Sensor de Chuva', 'Sensor de Estacionamento', 'Ar Digital', 'Rodas 16"', 'Faróis LED']),
      imagemPrincipal: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800',
      destaque: false, lojaId: loja2.id,
    },
    {
      marca: 'Chevrolet', modelo: 'S10', versao: '2.8 Turbo Diesel High Country 4x4 AT',
      ano: 2023, anoModelo: 2024, km: 55000, cambio: 'AUTOMATICO', combustivel: 'DIESEL',
      categoria: 'PICKUP', cor: 'Cinza Graphite',  portas: 4, motor: '2.8 Diesel', potencia: '200cv',
      preco: 249900, descricao: 'S10 High Country 2023/2024, a picape mais completa da Chevrolet. Motor diesel 2.8 Duramax, tração 4x4, interior todo em couro premium.',
      opcionais: JSON.stringify(['4x4', 'Couro Premium', 'MyLink 8"', 'OnStar', 'Capota Rígida', 'Estribos Laterais', 'Câmera de Ré', 'Controle de Descida']),
      imagemPrincipal: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800',
      destaque: false, lojaId: loja1.id,
    },
  ];

  const galeriaExtra = [
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800',
    'https://images.unsplash.com/photo-1542362567-b07e54358753?w=800',
  ];

  for (let i = 0; i < veiculosData.length; i++) {
    const v = veiculosData[i];
    const vendedor =
      v.lojaId === loja1.id
        ? lojista1
        : v.lojaId === loja2.id
        ? lojista2
        : lojista3;
    const dataCadastro = new Date(
      Date.UTC(2026, 9, 14 + (i % 28), 10 + (i % 8), 15, 0)
    );
    await prisma.veiculo.create({
      data: {
        ...v,
        precoCusto: Math.round(v.preco * 0.81),
        cadastradoPorId: vendedor.id,
        cadastradoPorNome: vendedor.nome,
        imagens: JSON.stringify([v.imagemPrincipal, ...galeriaExtra]),
        createdAt: dataCadastro,
      },
    });
  }

  // ─── Veículos Vendidos no Período (14/10/2026 a 17/11/2026) ─
  const veiculosVendidosData = [
    {
      marca: 'Toyota',
      modelo: 'Corolla Cross',
      versao: '2.0 XRE Direct Shift CVT',
      ano: 2024,
      anoModelo: 2024,
      km: 14200,
      cambio: 'CVT',
      combustivel: 'FLEX',
      categoria: 'SUV',
      cor: 'Prata Supernova',
      portas: 4,
      motor: '2.0',
      potencia: '177cv',
      preco: 162900,
      precoCusto: 128000,
      valorVenda: 158900,
      vendido: true,
      dataVenda: new Date('2026-10-16T14:20:00-03:00'),
      createdAt: new Date('2026-10-14T09:30:00-03:00'),
      cadastradoPorId: lojista1.id,
      cadastradoPorNome: lojista1.nome,
      vendidoPorId: lojista1.id,
      vendidoPorNome: lojista1.nome,
      imagemPrincipal: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800',
      imagens: JSON.stringify([
        'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800',
        ...galeriaExtra,
      ]),
      descricao: 'Corolla Cross XRE único dono, revisado e vendido com garantia.',
      opcionais: JSON.stringify(['Toyota Safety Sense', 'Couro', 'Multimídia 9"', 'Câmera de Ré']),
      destaque: false,
      lojaId: loja1.id,
    },
    {
      marca: 'Jeep',
      modelo: 'Renegade',
      versao: '1.3 T270 Turbo Longitude AT',
      ano: 2024,
      anoModelo: 2024,
      km: 9800,
      cambio: 'AUTOMATICO',
      combustivel: 'FLEX',
      categoria: 'SUV',
      cor: 'Cinza Sting',
      portas: 4,
      motor: '1.3 Turbo',
      potencia: '185cv',
      preco: 132900,
      precoCusto: 104000,
      valorVenda: 129900,
      vendido: true,
      dataVenda: new Date('2026-10-22T11:15:00-03:00'),
      createdAt: new Date('2026-10-15T11:00:00-03:00'),
      cadastradoPorId: lojista2.id,
      cadastradoPorNome: lojista2.nome,
      vendidoPorId: lojista2.id,
      vendidoPorNome: lojista2.nome,
      imagemPrincipal: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800',
      imagens: JSON.stringify([
        'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800',
        ...galeriaExtra,
      ]),
      descricao: 'Jeep Renegade Longitude T270 impecável.',
      opcionais: JSON.stringify(['Painel Digital 7"', 'Carplay Sem Fio', 'Faróis Full LED', 'Couro']),
      destaque: false,
      lojaId: loja2.id,
    },
    {
      marca: 'BMW',
      modelo: 'X1',
      versao: 'sDrive20i M Sport 2.0 TwinPower Turbo',
      ano: 2024,
      anoModelo: 2024,
      km: 6400,
      cambio: 'AUTOMATICO',
      combustivel: 'GASOLINA',
      categoria: 'SUV',
      cor: 'Branco Alpino',
      portas: 4,
      motor: '2.0 Turbo',
      potencia: '204cv',
      preco: 314900,
      precoCusto: 252000,
      valorVenda: 309900,
      vendido: true,
      dataVenda: new Date('2026-10-29T16:40:00-03:00'),
      createdAt: new Date('2026-10-18T10:00:00-03:00'),
      cadastradoPorId: lojista3.id,
      cadastradoPorNome: lojista3.nome,
      vendidoPorId: lojista3.id,
      vendidoPorNome: lojista3.nome,
      imagemPrincipal: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800',
      imagens: JSON.stringify([
        'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800',
        ...galeriaExtra,
      ]),
      descricao: 'Nova geração BMW X1 M Sport com Curved Display e teto solar panorâmico.',
      opcionais: JSON.stringify(['Curved Display', 'Teto Panorâmico', 'Harman Kardon', 'Pacote M Sport']),
      destaque: true,
      lojaId: loja3.id,
    },
    {
      marca: 'Volkswagen',
      modelo: 'Nivus',
      versao: '1.0 200 TSI Highline AT',
      ano: 2024,
      anoModelo: 2024,
      km: 11500,
      cambio: 'AUTOMATICO',
      combustivel: 'FLEX',
      categoria: 'SUV',
      cor: 'Cinza Moonstone',
      portas: 4,
      motor: '1.0 TSI',
      potencia: '128cv',
      preco: 124900,
      precoCusto: 98500,
      valorVenda: 122900,
      vendido: true,
      dataVenda: new Date('2026-11-04T10:30:00-03:00'),
      createdAt: new Date('2026-10-25T14:00:00-03:00'),
      cadastradoPorId: lojista1.id,
      cadastradoPorNome: lojista1.nome,
      vendidoPorId: lojista1.id,
      vendidoPorNome: lojista1.nome,
      imagemPrincipal: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800',
      imagens: JSON.stringify([
        'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800',
        ...galeriaExtra,
      ]),
      descricao: 'VW Nivus Highline com ACC, frenagem autônoma e VW Play.',
      opcionais: JSON.stringify(['ACC', 'VW Play 10"', 'Painel Active Info Display', 'Couro']),
      destaque: false,
      lojaId: loja1.id,
    },
    {
      marca: 'Hyundai',
      modelo: 'Tucson',
      versao: '1.6 Turbo GDI Limited',
      ano: 2023,
      anoModelo: 2024,
      km: 19000,
      cambio: 'AUTOMATIZADO',
      combustivel: 'GASOLINA',
      categoria: 'SUV',
      cor: 'Preto Onix',
      portas: 4,
      motor: '1.6 Turbo',
      potencia: '177cv',
      preco: 179900,
      precoCusto: 142000,
      valorVenda: 174900,
      vendido: true,
      dataVenda: new Date('2026-11-11T15:50:00-03:00'),
      createdAt: new Date('2026-11-01T09:15:00-03:00'),
      cadastradoPorId: lojista2.id,
      cadastradoPorNome: lojista2.nome,
      vendidoPorId: lojista2.id,
      vendidoPorNome: lojista2.nome,
      imagemPrincipal: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=800',
      imagens: JSON.stringify([
        'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=800',
        ...galeriaExtra,
      ]),
      descricao: 'Hyundai Tucson Limited com teto solar panorâmico e bancos elétricos.',
      opcionais: JSON.stringify(['Teto Panorâmico', 'Bancos Elétricos', 'Chave Presencial', 'LED']),
      destaque: false,
      lojaId: loja2.id,
    },
    {
      marca: 'Audi',
      modelo: 'Q3',
      versao: '2.0 TFSI Performance Black Quattro',
      ano: 2024,
      anoModelo: 2024,
      km: 5200,
      cambio: 'AUTOMATICO',
      combustivel: 'GASOLINA',
      categoria: 'SUV',
      cor: 'Azul Navarra',
      portas: 4,
      motor: '2.0 TFSI',
      potencia: '231cv',
      preco: 319900,
      precoCusto: 258000,
      valorVenda: 312900,
      vendido: true,
      dataVenda: new Date('2026-11-16T17:10:00-03:00'),
      createdAt: new Date('2026-11-05T13:00:00-03:00'),
      cadastradoPorId: lojista3.id,
      cadastradoPorNome: lojista3.nome,
      vendidoPorId: lojista3.id,
      vendidoPorNome: lojista3.nome,
      imagemPrincipal: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800',
      imagens: JSON.stringify([
        'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800',
        ...galeriaExtra,
      ]),
      descricao: 'Audi Q3 Performance Black Quattro S-Line com som Sonos 3D.',
      opcionais: JSON.stringify(['Tração Quattro', 'Kit S-Line', 'Sonos 3D', 'Teto Panorâmico']),
      destaque: true,
      lojaId: loja3.id,
    },
  ];

  for (const vv of veiculosVendidosData) {
    await prisma.veiculo.create({ data: vv });
  }

  console.log(
    `✅ ${veiculosData.length} veículos em estoque + ${veiculosVendidosData.length} veículos vendidos criados`
  );

  // ─── Criar Serviços ──────────────────────────────────────
  const servicosData = [
    {
      nome: 'Revisão Programada', descricao: 'Revisão completa seguindo o plano de manutenção do fabricante. Inclui troca de óleo, filtros e inspeção de 50 pontos.',
      categoria: 'REVISAO', preco: 599, duracao: '3h', icone: 'wrench', destaque: true, lojaId: loja1.id,
    },
    {
      nome: 'Troca de Óleo e Filtro', descricao: 'Troca de óleo sintético de alta performance e filtro de óleo. Óleo conforme especificação do fabricante.',
      categoria: 'MANUTENCAO', preco: 299, duracao: '1h', icone: 'droplets', lojaId: loja1.id,
    },
    {
      nome: 'Alinhamento e Balanceamento', descricao: 'Alinhamento computadorizado 3D e balanceamento das 4 rodas. Inclui check-up de pneus.',
      categoria: 'MANUTENCAO', preco: 189, duracao: '1h30', icone: 'circle-dot', lojaId: loja1.id,
    },
    {
      nome: 'Higienização do Ar', descricao: 'Limpeza completa do sistema de ar condicionado com aplicação de bactericida. Troca do filtro de cabine.',
      categoria: 'MANUTENCAO', preco: 149, duracao: '45min', icone: 'wind', lojaId: loja2.id,
    },
    {
      nome: 'Funilaria e Pintura', descricao: 'Reparos de funilaria e pintura com tinta original do fabricante. Orçamento sem compromisso.',
      categoria: 'FUNILARIA', preco: null, duracao: null, icone: 'paintbrush', lojaId: loja2.id,
    },
    {
      nome: 'Instalação de Acessórios', descricao: 'Instalação profissional de acessórios: películas, som, rastreadores, câmeras e mais.',
      categoria: 'ACESSORIOS', preco: null, duracao: null, icone: 'settings', lojaId: loja2.id,
    },
    {
      nome: 'Inspeção Pré-Compra', descricao: 'Avaliação completa de 150 pontos do veículo antes da compra. Laudo técnico detalhado com fotos.',
      categoria: 'REVISAO', preco: 399, duracao: '2h', icone: 'search', destaque: true, lojaId: loja1.id,
    },
    {
      nome: 'Seguro Automotivo', descricao: 'Cotação das melhores seguradoras do mercado. Cobertura completa com preço justo.',
      categoria: 'SEGURO', preco: null, duracao: null, icone: 'shield-check', destaque: true, lojaId: loja1.id,
    },
  ];

  for (const s of servicosData) {
    await prisma.servico.create({ data: s });
  }

  console.log(`✅ ${servicosData.length} serviços criados`);

  // ─── Criar Leads de exemplo ──────────────────────────────
  const veiculos = await prisma.veiculo.findMany({ take: 3 });
  
  if (veiculos.length >= 3) {
    await prisma.lead.createMany({
      data: [
        {
          nome: 'Maria Santos', email: 'maria@email.com', telefone: '11988887777',
          mensagem: 'Gostaria de agendar um test drive com esse veículo.',
          veiculoId: veiculos[0].id, lojaId: veiculos[0].lojaId, userId: usuario1.id,
          status: 'NOVO', origem: 'SITE',
        },
        {
          nome: 'Pedro Lima', email: 'pedro@email.com', telefone: '21977776666',
          mensagem: 'Aceita financiamento? Qual o valor de entrada?',
          veiculoId: veiculos[1].id, lojaId: veiculos[1].lojaId,
          status: 'CONTATADO', origem: 'WHATSAPP',
        },
        {
          nome: 'Ana Souza', email: 'ana@email.com', telefone: '31966665555',
          mensagem: 'Aceita meu carro como parte do pagamento?',
          veiculoId: veiculos[2].id, lojaId: veiculos[2].lojaId,
          status: 'NEGOCIANDO', origem: 'FORMULARIO',
        },
      ],
    });
  }

  console.log('✅ Leads de exemplo criados');

  // ─── Criar Agendamentos de Exemplo ───────────────────────
  const servicosCriados = await prisma.servico.findMany({ take: 2 });

  await prisma.agendamentoServico.createMany({
    data: [
      {
        nome: 'Lucas Ferreira',
        email: 'lucas.ferreira@email.com',
        telefone: '11987654321',
        dataPreferida: '2026-11-25',
        horarioPreferido: '10:00',
        veiculoInfo: 'Toyota Corolla 2022',
        observacoes: 'Revisão dos 30.000 km',
        status: 'PENDENTE',
        tipo: 'REVISAO',
        servicoId: servicosCriados[0]?.id || null,
        lojaId: loja1.id,
        createdAt: new Date('2026-11-12T10:00:00-03:00'),
      },
      {
        nome: 'Juliana Almeida',
        email: 'juliana@email.com',
        telefone: '11991234567',
        dataPreferida: '2026-11-26',
        horarioPreferido: '14:30',
        veiculoInfo: 'Honda Civic Touring 2024',
        observacoes: 'Gostaria de realizar test drive no período da tarde.',
        status: 'CONFIRMADO',
        tipo: 'TEST_DRIVE',
        lojaId: loja1.id,
        createdAt: new Date('2026-11-14T15:20:00-03:00'),
      },
      {
        nome: 'Rafael Martins',
        email: 'rafael.martins@email.com',
        telefone: '21988112233',
        dataPreferida: '2026-11-27',
        horarioPreferido: '09:00',
        veiculoInfo: 'Jeep Compass 2023',
        observacoes: 'Higienização completa do ar condicionado.',
        status: 'PENDENTE',
        tipo: 'SERVICO',
        servicoId: servicosCriados[1]?.id || null,
        lojaId: loja2.id,
        createdAt: new Date('2026-11-15T11:30:00-03:00'),
      },
      {
        nome: 'Camila Vasconcelos',
        email: 'camila.v@email.com',
        telefone: '31997766554',
        dataPreferida: '2026-11-10',
        horarioPreferido: '11:00',
        veiculoInfo: 'BMW 320i M Sport 2024',
        observacoes: 'Test drive executivo concluído com aprovação de crédito.',
        status: 'CONCLUIDO',
        tipo: 'TEST_DRIVE',
        lojaId: loja3.id,
        createdAt: new Date('2026-11-08T16:10:00-03:00'),
      },
      {
        nome: 'Eduardo Nogueira',
        email: 'eduardo.nogueira@email.com',
        telefone: '11994433221',
        dataPreferida: '2026-10-28',
        horarioPreferido: '08:30',
        veiculoInfo: 'Toyota Hilux SRX 2023',
        observacoes: 'Revisão programada completa concluída.',
        status: 'CONCLUIDO',
        tipo: 'REVISAO',
        servicoId: servicosCriados[0]?.id || null,
        lojaId: loja1.id,
        createdAt: new Date('2026-10-26T09:00:00-03:00'),
      },
    ],
  });

  console.log('✅ Agendamentos de exemplo criados');

  // ─── Criar Transações de Pagamento de Exemplo ────────────
  await prisma.transacaoPagamento.createMany({
    data: [
      {
        tipo: 'ASSINATURA',
        valor: 249.9,
        status: 'PAGO',
        stripePaymentIntentId: 'pi_seed_premium_loja1',
        plano: 'PREMIUM',
        lojaId: loja1.id,
        webhookConfirmado: true,
        createdAt: new Date('2026-10-15T10:00:00-03:00'),
      },
      {
        tipo: 'ASSINATURA',
        valor: 499.9,
        status: 'PAGO',
        stripePaymentIntentId: 'pi_seed_enterprise_loja2',
        plano: 'ENTERPRISE',
        lojaId: loja2.id,
        webhookConfirmado: true,
        createdAt: new Date('2026-10-20T11:30:00-03:00'),
      },
      {
        tipo: 'ASSINATURA',
        valor: 99.9,
        status: 'PAGO',
        stripePaymentIntentId: 'pi_seed_basico_loja3',
        plano: 'BASICO',
        lojaId: loja3.id,
        webhookConfirmado: true,
        createdAt: new Date('2026-11-02T14:15:00-03:00'),
      },
    ],
  });

  console.log('✅ Transações de exemplo criados');
  console.log('\n🎉 Seed concluído com sucesso!');
  console.log('────────────────────────────────────');
  console.log('Usuários de teste (senha: 123456):');
  console.log('  Admin:   admin@automarket.com.br');
  console.log('  Lojista: contato@premiumcarros.com.br');
  console.log('  Lojista: vendas@autotop.com.br');
  console.log('  Lojista: contato@luxmotors.com.br');
  console.log('  Usuário: joao@email.com');
  console.log('────────────────────────────────────');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
