const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');

// Carrega as palavras
let bancoPalavras = {};
try {
    bancoPalavras = JSON.parse(fs.readFileSync('./palavras.json'));
} catch (e) {
    console.error("Erro ao carregar palavras.json:", e.message);
    bancoPalavras = {};
}

// 1. CRIA O BOT (CLIENTE)
const client = new Client({
    authStrategy: new LocalAuth()
});

// --- VARIÁVEIS DE ESTADO (MEMÓRIA RAM) ---
let estado = 'FECHADO'; // Pode ser: 'FECHADO', 'ABERTO' (Cadastrando), 'JOGANDO' (Participantes receberam os papéis)
let participantes = [];
let idGrupoPermitido = null;

// Estado do Jogo Atual
let jogoAtual = {
    categoria: null,
    palavraSecreta: null,
    impostor: null // Objeto do participante impostor
};

// --- FUNÇÕES AUXILIARES ---

// Função de delay (espera)
const delay = ms => new Promise(res => setTimeout(res, ms));

// Helper: Identifica o ID do Chat (Funciona pra quem manda e pro Admin/Bot)
function getChatId(message) {
    // Se fui eu que mandei (fromMe), o chat é o 'to'. Se foi outro, é 'from'.
    return message.fromMe ? message.to : message.from;
}

// Helper: Identifica o ID do Autor (Funciona pra quem manda e pro Admin/Bot)
function getAuthorId(message) {
    if (message.fromMe) {
        // Se o bot/admin enviou, pega o ID do cliente logado
        return client.info.wid._serialized;
    }
    // Em grupos, 'author' é quem mandou. No privado, é 'from'.
    return message.author || message.from;
}

// --- EVENTOS DO BOT ---

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('✅ Bot Impostor Online e pronto para uso!');
});

// OUVINTE DE MENSAGENS (CÉREBRO DO BOT)
client.on('message_create', async (message) => {

    // Ignora mensagens vazias ou de sistema
    if (!message.body) return;

    // ======================================================
    // COMANDO 1: INICIAR (O "Admin" manda no grupo)
    // ======================================================
    if (message.body === '!iniciar') {
        if (estado !== 'FECHADO') {
            message.reply('❌ Já existe um jogo rolando! Digite !revelar (se estiver jogando) ou reinicie o bot.');
            return;
        }

        estado = 'ABERTO';
        participantes = []; // Zera a lista
        idGrupoPermitido = getChatId(message); // Trava o bot neste chat
        jogoAtual = { categoria: null, palavraSecreta: null, impostor: null }; // Zera jogo

        console.log(`Jogo INICIADO no chat: ${idGrupoPermitido}`);

        // Lista categorias disponíveis para mostrar na mensagem
        const categoriasDisplay = Object.keys(bancoPalavras).map(c => `• ${c}`).join('\n');

        await client.sendMessage(idGrupoPermitido, `🕵️ *JOGO DO IMPOSTOR* 🕵️
        
Para participar, responda aqui com:
*!participar*

(Não precisa de número nem dica, eu pego seu contato automaticamente se der, ou você me avisa se falhar)

*Quando todos entrarem, o Admin deve digitar:*
!jogar [categoria]

*Categorias Disponíveis:*
${categoriasDisplay}

(bot feito pelo André)`);
    }

    // ======================================================
    // COMANDO 2: PARTICIPAR
    // ======================================================
    if (message.body.toLowerCase().startsWith('!participar') && estado === 'ABERTO') {

        // Valida se é o grupo certo
        if (getChatId(message) !== idGrupoPermitido) return;

        // --- 1. Identificação ---
        let idAutor = getAuthorId(message);
        let nome = "Participante";
        let numeroPuro = idAutor.replace(/\D/g, '');

        if (message.fromMe) {
            nome = client.info.pushname || "Admin";
        } else if (message._data && message._data.notifyName) {
            nome = message._data.notifyName;
        }

        // --- 2. Cadastro ---
        const jaParticipando = participantes.some(p => p.idSeguro === idAutor);

        if (jaParticipando) {
            message.reply(`Ei ${nome}, você já está na lista!`);
        } else {
            participantes.push({
                nome: nome,
                numero: numeroPuro,
                idSeguro: idAutor
            });

            console.log(`➕ Novo participante: ${nome} (ID: ${idAutor})`);
            message.react('✅');
        }
    }

    // ======================================================
    // COMANDO 3: JOGAR (Substitui !finalizar)
    // ======================================================
    if (message.body.toLowerCase().startsWith('!jogar') && estado === 'ABERTO') {
        if (getChatId(message) !== idGrupoPermitido) return;

        // Validação Mínima
        if (participantes.length < 3) {
            // Impostor precisa de pelo menos 3 (1 impostor, 2 inocentes) pra ter graça, mas código aceita 2 tecnicamente.
            // Vou deixar 3 pra garantir logica de votação fazer sentido (2 vs 1).
            message.reply("❌ Precisa de pelo menos 3 pessoas para jogar!");
            return;
        }

        // Ler categoria
        // Ex: "!jogar comida" -> ["!jogar", "comida"]
        const args = message.body.trim().split(/\s+/);
        if (args.length < 2) {
            message.reply("❌ Por favor especifique a categoria! Exemplo: `!jogar comida`");
            return;
        }

        const categoriaEscolhida = args[1].toLowerCase();

        if (!bancoPalavras[categoriaEscolhida]) {
            message.reply(`❌ Categoria '${categoriaEscolhida}' não encontrada! Use uma das listadas no !iniciar.`);
            return;
        }

        // --- LÓGICA DO SORTEIO ---

        // 1. Escolher Palavra
        const listaPalavras = bancoPalavras[categoriaEscolhida];
        const palavraSorteada = listaPalavras[Math.floor(Math.random() * listaPalavras.length)];

        // 2. Escolher Impostor
        const indiceImpostor = Math.floor(Math.random() * participantes.length);
        const impostor = participantes[indiceImpostor];

        // 3. Salvar Estado
        estado = 'JOGANDO';
        jogoAtual = {
            categoria: categoriaEscolhida,
            palavraSecreta: palavraSorteada,
            impostor: impostor
        };

        message.reply(`🎲 *Sorteio Realizado!* Enviando papéis no privado... 🤫
        
(Aguardem todos receberem antes de começar a discutir)`);

        console.log(`\n--- JOGO INICIADO ---`);
        console.log(`Categoria: ${categoriaEscolhida}`);
        console.log(`Palavra: ${palavraSorteada}`);
        console.log(`Impostor: ${impostor.nome} (${impostor.numero})`);

        // --- ENVIO DAS MENSAGENS ---
        const errosEnvio = [];

        for (let p of participantes) {
            const ehImpostor = (p.idSeguro === impostor.idSeguro);
            let texto = "";

            if (ehImpostor) {
                texto = `🤫 *TU ÉS O IMPOSTOR!* 🤫
                
O tema é: *${categoriaEscolhida.toUpperCase()}*
Seu objetivo é descobrir a palavra secreta e enganar todos para que não descubram você.

Boa sorte!`;
            } else {
                texto = `😇 *VOCÊ É INOCENTE!*
                
O tema é: *${categoriaEscolhida.toUpperCase()}*
A palavra secreta é: *${palavraSorteada}*

Descubra quem é o impostor (ele não sabe a palavra)!`;
            }

            // Envio com lógica de apagar admin (cópia do antigo)
            try {
                // Tenta usar o ID
                // Fallbacks básicos caso ID esteja estranho (mas o idSeguro vem do evento message)
                let idParaEnvio = p.idSeguro;

                // Se por acaso for um numero legado sem @ (improvável aqui, mas mantendo robustez)
                if (!idParaEnvio.includes('@')) {
                    idParaEnvio = await client.getNumberId(p.numero);
                    if (idParaEnvio) idParaEnvio = idParaEnvio._serialized;
                    else idParaEnvio = p.numero + "@c.us";
                }

                const msgEnviada = await client.sendMessage(idParaEnvio, texto);
                console.log(`✅ Enviado para ${p.nome} (${ehImpostor ? 'IMPOSTOR' : 'Inocente'})`);

                await delay(1500); // Anti-flood suave

                // Apagar mensagem do Admin (pra ele não ver no chat dele o que enviou se for pra si ou outros)
                // Se mandou pra si mesmo, NÃO apaga imediatamente pra dar tempo de ler? 
                // No original: "Se o destinatário for o próprio bot... NÃO apaga" -> mas se ele for o Imposotr ele precisa ler.
                // A logica antiga do amigo secreto era: Admin recebe o proprio segredo -> nao apaga. Admin manda pros outros -> apaga pra nao ver.
                if (idParaEnvio !== client.info.wid._serialized) {
                    try {
                        await msgEnviada.delete(false); // Apaga só pra mim
                    } catch (e) { /* ignore */ }
                }

            } catch (err) {
                console.error(`❌ Erro ao enviar para ${p.nome}:`, err.message);
                errosEnvio.push(p.nome);
            }
        }

        if (errosEnvio.length > 0) {
            await client.sendMessage(idGrupoPermitido, `⚠️ Não consegui enviar para: ${errosEnvio.join(', ')}. Verifiquem se o número está correto ou me chamem no privado.`);
        } else {
            await client.sendMessage(idGrupoPermitido, `✅ *Todos receberam suas funções!* Podem começar a discutir!
            
Use *!revelar* quando acabarem a votação.`);
        }
    }

    // ======================================================
    // COMANDO 4: REVELAR (Fim de Jogo)
    // ======================================================
    if (message.body === '!revelar') {
        if (stateCheck = (estado !== 'JOGANDO' && estado !== 'FECHADO')) {
            // Se estiver ABERTO, não faz sentido revelar.
            // Se estiver FECHADO (mas tem jogo salvo na memoria antes de reiniciar bot?), vamos confiar na memoria RAM.
            // Se acabou de reiniciar o bot, memoria ta vazia.
        }

        // Permite revelar mesmo se ja tiver sido 'fechado' logico, desde que tenha dados.
        // Mas o ideal é só permitir se estado == 'JOGANDO' para evitar spam, ou permitir sempre que tiver dados.

        if (!jogoAtual.palavraSecreta) {
            message.reply("❌ Nenhum jogo ativo para revelar.");
            return;
        }

        if (getChatId(message) !== idGrupoPermitido && idGrupoPermitido !== null) return;

        await client.sendMessage(getChatId(message), `🤡 *FIM DE JOGO!* 🤡
        
A palavra secreta era: *${jogoAtual.palavraSecreta}*
O Impostor era: *${jogoAtual.impostor ? jogoAtual.impostor.nome : '???'}*!

Quem acertou?`);

        // Reset Total
        estado = 'FECHADO';
        idGrupoPermitido = null;
        jogoAtual = { categoria: null, palavraSecreta: null, impostor: null };
        participantes = [];
    }

});

// LIGA O BOT
client.initialize();