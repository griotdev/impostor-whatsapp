# 🕵️ Bot do Jogo do Impostor para WhatsApp

Um bot simples e divertido para jogar "Impostor" (também conhecido como Spyfall) diretamente no WhatsApp. O bot gerencia o sorteio, distribui as palavras secretas no privado e revela o impostor ao final.

> **Baseado na biblioteca [whatsapp-web.js](https://wwebjs.dev/).**

## 🎮 Como Funciona o Jogo

1.  **O Grupo**: Todos se juntam no grupo do WhatsApp.
2.  **O Sorteio**: O bot escolhe uma categoria (ex: Comida) e uma palavra secreta (ex: Pizza).
3.  **A Distribuição**:
    *   **Inocentes**: Recebem a palavra secreta ("Pizza").
    *   **Impostor**: Recebe apenas o tema ("Comida"), mas **não sabe a palavra**.
4.  **A Discussão**: Os jogadores fazem perguntas entre si para tentar descobrir quem não sabe a palavra, sem revelar a própria palavra explicitamente.
5.  **O Voto**: O grupo vota em quem acham que é o impostor.

## 🚀 Como Rodar

### Pré-requisitos
*   [Node.js](https://nodejs.org/) instalado no computador.
*   Uma conta de WhatsApp (pode ser o seu próprio número ou um chip dedicado).

### Instalação

1.  Clone ou baixe este projeto.
2.  Abra o terminal na pasta do projeto.
3.  Instale as dependências:
    ```bash
    npm install
    ```

### Executando

1.  Inicie o bot:
    ```bash
    node index.js
    ```
2.  Um **QR Code** aparecerá no terminal. Escaneie-o com o WhatsApp (Dispositivos Conectados > Conectar um aparelho) da conta que será o "Bot/Admin".
    *   *Dica: Você pode ser o Admin e jogar ao mesmo tempo. O bot avisa no seu privado qual é o seu papel.*

## 🤖 Comandos

| Comando | Quem usa? | Descrição |
| :--- | :--- | :--- |
| `!iniciar` | Admin | Inicia uma nova sessão de jogo no grupo. Mostra as categorias. |
| `!participar`| Jogadores | Registra o jogador na partida atual. |
| `!jogar [categoria]` | Admin | Encerra as inscrições e distribui os papéis no privado. Ex: `!jogar comida`. |
| `!revelar` | Admin | Encerra a rodada e revela quem era o Impostor e qual era a Palavra. |

## ⚙️ Personalização (Categorias)

Você pode adicionar suas próprias categorias e palavras editando o arquivo `palavras.json`.
Basta seguir o formato:

```json
{
  "minha_categoria": [
    "Palavra1",
    "Palavra2",
    "Palavra3"
  ]
}
```
**Nota:** O bot carrega as palavras ao iniciar. Se editar o arquivo, reinicie o bot (`Ctrl+C` e `node index.js`).

## ⚠️ Avisos

*   **Identificação**: O bot tenta identificar os participantes automaticamente. Se falhar, verifique as configurações de privacidade do WhatsApp ou peça para mandarem mensagem no privado do bot.
*   **Riscos**: O uso de bots automatizados pode ir contra os termos de serviço do WhatsApp. Use com moderação e responsabilidade (evite spam).
*   **Mensagens Apagadas**: Para manter o segredo, o bot tenta apagar a mensagem enviada do chat do Admin/Bot. Se a internet estiver lenta, pode falhar, então não olhe o chat se você for o Admin jogando!

---
*Divirta-se enganando seus amigos!* 🤫
