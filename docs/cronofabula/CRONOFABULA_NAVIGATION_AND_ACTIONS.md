# CRONOFÁBULA — NAVIGATION AND ACTIONS

## 1. Resumo Executivo

Este documento define a navegação principal, abas, botões, permissões e fluxos operacionais do **Cronofábula**.

O objetivo é garantir que o sistema tenha uma experiência clara antes do desenvolvimento do banco de dados e das telas.

A regra central de produto é:

> O jogador precisa encontrar rapidamente onde jogar, agir, rolar dados, falar com NPCs, consultar sua ficha, acessar seu diário e acompanhar a campanha.  
> O mestre precisa controlar cenas, mapa, NPCs, IA, combate, aprovações e crônicas sem se perder.

O Cronofábula será dividido em duas camadas principais:

1. **Área Global do Usuário**  
   Onde o usuário vê campanhas, personagens, convites, perfil e jornadas solo.

2. **Área Interna da Campanha**  
   Onde acontece o jogo: Mesa Viva, Mapa Vivo, NPCs, Inventário, Diário, Crônicas, IA Mestre, Aprovações e Mesa de Combate.

---

## 2. Princípios de Navegação

### 2.1 Clareza acima de ornamentação

O Cronofábula terá estética arcana, fantasia e RPG, mas a navegação deve ser objetiva.

Durante uma sessão, o jogador não pode perder tempo procurando botões básicos.

### 2.2 A interface muda aparência, não estrutura

Temas de classe e raça mudam:

- cores;
- ícones;
- bordas;
- microfrases;
- texturas;
- molduras;
- botões estilizados.

Mas não mudam:

- posição dos menus;
- estrutura das abas;
- funcionamento dos botões;
- permissões;
- regras.

### 2.3 O sistema controla estado, a IA interpreta

O código controla:

- localização;
- mapa;
- cena;
- conhecimento;
- inventário;
- diário;
- dados;
- permissões;
- combate;
- aprovações.

A IA controla:

- diálogo;
- narração;
- clima;
- resumo;
- sugestões;
- interpretação de NPCs.

### 2.4 O mestre sempre tem controle final

O mestre pode:

- assumir narração;
- corrigir IA;
- mover personagens;
- revelar/ocultar locais;
- aprovar recompensas;
- alterar NPCs;
- encerrar combate;
- aprovar crônicas.

---

## 3. Papéis do Sistema

## 3.1 Jogador

Pode:

- acessar campanhas onde participa;
- controlar seus personagens;
- jogar cenas;
- rolar dados físicos ou virtuais;
- interagir com NPCs;
- anotar no diário, se tiver diário;
- anotar no mapa, se tiver mapa;
- iniciar/continuar jornadas solo permitidas;
- compartilhar ou omitir informações conhecidas pelo personagem.

Não pode:

- ver segredos do mestre;
- acessar cenas onde seu personagem não está;
- ver locais ocultos;
- ver diários perdidos;
- aprovar recompensas;
- alterar estado oficial da campanha sem permissão.

---

## 3.2 Mestre

Pode:

- criar e editar campanha;
- criar sessões;
- controlar mapa;
- criar cenas;
- mover personagens;
- controlar NPCs;
- usar ou pausar IA;
- iniciar/encerrar combate;
- aprovar itens, XP, ouro, fatos e crônicas;
- revelar ou ocultar locais;
- ver todos os dados da campanha.

---

## 3.3 Mestre Auxiliar

Opcional.

Pode receber permissões específicas:

- controlar NPCs;
- mover personagens;
- narrar cenas;
- revisar aprovações;
- editar mapa;
- gerenciar combate.

O mestre principal define as permissões.

---

## 3.4 IA

A IA pode:

- narrar cenas;
- interpretar NPCs;
- sugerir consequências;
- gerar resumos;
- gerar NPCs;
- gerar locais;
- gerar mapas para aprovação;
- narrar combate;
- ajudar com regras.

A IA não pode:

- revelar segredos sem gatilho;
- mover personagens oficialmente;
- aprovar recompensas;
- criar fatos canônicos sem aprovação;
- ignorar localização;
- ignorar conhecimento limitado;
- matar personagem sem regra ou decisão do mestre.

---

## 4. Estrutura Global do Sistema

Menu global:

```txt
Dashboard
Campanhas
Personagens
Jornada Solo
Biblioteca
Convites
Perfil
Configurações
```

---

# 5. Dashboard

## 5.1 Função

Tela inicial do usuário.

Mostra:

- campanhas ativas;
- última campanha acessada;
- próxima sessão;
- personagens recentes;
- convites pendentes;
- jornadas solo em andamento;
- últimas crônicas;
- notificações importantes.

---

## 5.2 Botões

### Nova Campanha

Cria uma nova campanha.

Campos iniciais:

- nome;
- descrição;
- sistema de regras;
- tom narrativo;
- imagem de capa;
- permitir IA narradora;
- permitir jornada solo;
- visibilidade da campanha.

Permissão:

- qualquer usuário pode criar.

---

### Entrar em Campanha

Permite entrar por código ou convite.

Campos:

- código de convite;
- confirmação de personagem existente ou novo.

---

### Criar Personagem

Abre o criador de personagem.

Pode criar:

- personagem livre;
- personagem vinculado a uma campanha.

---

### Retomar Última Mesa

Leva direto para a última Mesa Viva acessada.

Condição:

- usuário deve ter campanha ativa.

---

### Continuar Jornada Solo

Leva para a última jornada solo em andamento.

Condição:

- personagem deve estar em campanha que permita jornada solo.

---

### Ver Convites

Abre aba de convites.

---

# 6. Campanhas

## 6.1 Função

Lista campanhas do usuário.

Cada card mostra:

- nome;
- imagem de capa;
- mestre;
- sistema de regras;
- status;
- última sessão;
- próximo encontro;
- personagem ativo do usuário;
- jogadores participantes.

---

## 6.2 Botões do Card

### Abrir Campanha

Entra na área interna da campanha.

---

### Mesa Viva

Vai direto para a sessão ativa ou última sessão.

---

### Ver Crônicas

Abre histórico narrativo da campanha.

---

### Configurar

Disponível para mestre.

Abre configurações da campanha.

---

### Sair da Campanha

Remove usuário da campanha.

Deve exigir confirmação.

---

# 7. Personagens

## 7.1 Função

Central de personagens do usuário.

Mostra:

- personagens ativos;
- personagens arquivados;
- personagens mortos;
- personagens sem campanha;
- classe;
- raça;
- nível;
- campanha vinculada;
- tema visual;
- status do diário;
- status do mapa.

---

## 7.2 Botões

### Novo Personagem

Cria personagem.

Fluxo:

```txt
Escolher campanha ou criar sem campanha
↓
Escolher raça
↓
Escolher classe
↓
Definir atributos
↓
Escolher aparência/tema
↓
Criar diário inicial
↓
Criar inventário inicial
↓
Enviar para aprovação, se estiver em campanha
```

---

### Abrir Ficha

Mostra ficha completa.

---

### Editar Ficha

Permite editar campos autorizados.

Algumas edições podem exigir aprovação do mestre.

---

### Vincular a Campanha

Associa personagem a uma campanha.

---

### Definir como Ativo

Define personagem ativo naquela campanha.

---

### Ver Diário

Abre diário do personagem se ele tiver acesso ao item diário.

Se o diário estiver perdido, roubado ou destruído, o botão exibe bloqueio narrativo.

---

### Ver Inventário

Abre inventário do personagem.

---

### Ver Histórico

Mostra crônicas relacionadas ao personagem.

---

### Arquivar Personagem

Remove da lista principal sem excluir.

---

# 8. Jornada Solo

## 8.1 Função

Permite aventuras individuais dentro de uma campanha existente.

A jornada solo é sempre subordinada às regras da campanha e pode exigir aprovação do mestre.

---

## 8.2 Tipos de Jornada

- exploração;
- investigação;
- treino;
- compra;
- conversa com NPC;
- missão secundária;
- descanso;
- viagem;
- estudo;
- busca por item;
- interação social.

---

## 8.3 Botões

### Iniciar Jornada Solo

Fluxo:

```txt
Escolher campanha
↓
Escolher personagem
↓
Escolher tipo de jornada
↓
Ver limites definidos pelo mestre
↓
Iniciar cena solo
```

---

### Continuar Jornada

Retoma jornada em andamento.

---

### Pausar Jornada

Salva estado e encerra temporariamente.

---

### Finalizar Jornada

Finaliza a aventura solo.

---

### Enviar para Aprovação

Envia recompensas, itens, conhecimento e consequências para o mestre.

---

### Ver Pendências

Mostra:

- itens pendentes;
- ouro pendente;
- XP pendente;
- fatos pendentes;
- consequências pendentes.

---

# 9. Biblioteca

## 9.1 Função

Área de consulta geral.

Pode conter:

- comandos de dado;
- regras base;
- tutorial;
- glossário;
- guia do jogador;
- guia do mestre;
- explicações do sistema;
- conteúdos liberados da campanha.

---

## 9.2 Botões

### Buscar Regra

Pesquisa termo de regra.

---

### Guia Rápido

Mostra comandos essenciais.

---

### Comandos de Dados

Exemplos:

```txt
/roll 1d20+3
/roll 2d6
/roll 1d20 adv
/roll 1d20 dis
```

---

### Consultar Condição

Mostra condições comuns.

---

### Tutorial da Mesa Viva

Explica como jogar.

---

### Tutorial do Mapa Vivo

Explica deslocamento, pontos e mapas como itens.

---

# 10. Convites

## 10.1 Função

Gerenciar convites recebidos e enviados.

---

## 10.2 Botões

### Aceitar Convite

Adiciona usuário à campanha.

---

### Recusar Convite

Remove convite.

---

### Copiar Código

Disponível para mestre.

---

### Enviar Convite

Mestre envia convite por usuário, e-mail ou código.

---

### Revogar Convite

Mestre cancela convite enviado.

---

# 11. Perfil

## 11.1 Função

Identidade do jogador.

Mostra:

- avatar;
- nome;
- bio;
- classes favoritas;
- raças favoritas;
- tema preferido;
- campanhas;
- estatísticas;
- crônicas pessoais.

---

## 11.2 Botões

### Editar Perfil

Edita dados públicos.

---

### Alterar Tema Padrão

Define tema visual padrão.

---

### Ver Minhas Crônicas

Mostra histórico dos personagens.

---

### Definir Preferências de Dados

Escolhe preferência:

- sempre virtual;
- sempre físico;
- perguntar sempre.

---

# 12. Configurações Globais

## 12.1 Função

Preferências gerais do usuário.

---

## 12.2 Seções

### Aparência

- tema padrão;
- modo claro/escuro;
- reduzir animações;
- tamanho de fonte;
- densidade da interface.

### Dados

- dado virtual;
- dado físico;
- perguntar sempre;
- mostrar histórico público.

### Notificações

- convite recebido;
- sessão marcada;
- aprovação pendente;
- turno chamado;
- resumo gerado;
- diário indisponível;
- mapa perdido.

### Privacidade

- exibir perfil;
- ocultar personagens arquivados;
- mostrar estatísticas;
- permitir convites.

---

# 13. Estrutura Interna da Campanha

Menu interno:

```txt
Visão Geral
Mesa Viva
Mapa Vivo
Mesa de Combate
Personagens
NPCs
Locais
Missões
Inventário
Diário
Mídias
Crônicas
Dados
IA Mestre
Aprovações
Configurações
```

A **Mesa de Combate** não precisa aparecer como aba fixa para jogador fora de combate. Pode surgir como modo ativo quando houver luta.

---

# 14. Visão Geral da Campanha

## 14.1 Função

Resumo da campanha.

Mostra:

- nome;
- capa;
- descrição;
- tom;
- sistema;
- mestre;
- jogadores;
- status;
- local atual do grupo;
- próxima sessão;
- última crônica;
- missões abertas;
- personagens ativos;
- alertas.

---

## 14.2 Botões

### Abrir Mesa Viva

Vai para a sessão.

---

### Criar Sessão

Disponível para mestre.

Cria nova sessão.

---

### Agendar Sessão

Define data e horário.

---

### Convidar Jogador

Gera código ou link.

---

### Editar Campanha

Disponível para mestre.

---

### Gerar Introdução com IA

Gera abertura narrativa com base no estado da campanha.

---

### Ver Última Recapitulação

Mostra resumo da última sessão.

---

# 15. Mesa Viva

## 15.1 Função

Principal área de jogo narrativo.

A Mesa Viva reúne:

- chat da cena;
- ações dos jogadores;
- narração;
- NPCs presentes;
- mapa resumido;
- dados;
- diário;
- inventário rápido;
- controle do mestre;
- IA narradora.

---

## 15.2 Estrutura Recomendada

```txt
Topo:
Sessão, cena atual, narrador ativo, local, status

Esquerda:
Personagens presentes

Centro:
Chat/Narração da cena

Direita superior:
Mapa Vivo mini

Direita inferior:
NPCs, objetos e ações rápidas

Rodapé:
Campo de fala/ação e botões principais
```

---

## 15.3 Tipos de Chat

### Chat da Cena

Visível apenas para personagens presentes na cena.

### Chat Off

Fora do personagem. Não vira conhecimento do personagem.

### Chat Privado

Entre personagem e NPC, personagem e mestre, ou personagens específicos.

### Sussurro ao Mestre

Mensagem secreta para mestre.

### Narração Global

Mensagem do mestre para todos.

---

## 15.4 Botões do Jogador na Mesa Viva

### Falar

Envia fala do personagem para a cena atual.

---

### Falar em Voz Baixa

Fala para personagem/NPC próximo.

Pode exigir teste se alguém tentar ouvir.

---

### Gritar

Fala para locais próximos.

A visibilidade depende da cena e do mapa.

---

### Agir

Envia ação narrativa.

---

### Ação Secreta

Envia ação apenas para mestre/IA autorizada.

---

### Observar

Pede descrição do que o personagem vê.

---

### Escutar

Tenta ouvir algo específico.

Pode exigir teste.

---

### Interagir com NPC

Seleciona NPC presente e inicia diálogo.

Abordagens:

- conversar;
- negociar;
- persuadir;
- intimidar;
- enganar;
- provocar;
- questionar;
- subornar;
- atacar;
- seguir.

---

### Mover-se

Solicita deslocamento pelo Mapa Vivo.

---

### Chamar Personagem

Chama outro personagem para a cena.

---

### Compartilhar Informação

Registra que o personagem contou algo a outros personagens.

---

### Relatar ao Grupo

Permite contar:

- verdade;
- meia verdade;
- mentira;
- omissão.

O sistema registra o que foi dito, não apenas o que era verdade.

---

### Anotar no Diário

Cria anotação se o personagem tiver acesso ao diário.

---

### Anotar Fala

Registra fala importante no diário.

---

### Anotar Pista

Registra pista no diário.

---

### Mostrar Diário/Documento

Compartilha item ou anotação com personagens presentes.

---

### Rolar Dado

Abre dado virtual.

---

### Informar Dado Físico

Registra rolagem feita na vida real.

---

### Abrir Ficha

Abre ficha em painel lateral.

---

### Abrir Inventário

Abre inventário rápido.

---

### Finalizar Ação

Marca que o jogador terminou a ação/turno narrativo.

---

## 15.5 Botões do Mestre na Mesa Viva

### Criar Cena

Cria nova cena com local, participantes e visibilidade.

---

### Separar Grupo

Divide personagens em cenas diferentes.

---

### Unir Cenas

Une cenas quando personagens se encontram.

---

### Mover Personagem

Move personagem entre cenas ou pontos do mapa.

---

### Adicionar NPC à Cena

Insere NPC presente.

---

### Remover NPC da Cena

Remove NPC por saída, fuga, morte ou desaparecimento.

---

### Definir Quem Vê

Controle manual de visão.

---

### Definir Quem Ouve

Controle manual de audição.

---

### Narrar para Todos

Mensagem global.

---

### Narrar para Cena

Mensagem para cena específica.

---

### Narrar em Segredo

Mensagem para jogador/personagem específico.

---

### Assumir Narração

Mestre passa a narrar manualmente.

---

### Devolver Narração para IA

IA volta a narrar.

---

### Pausar IA

Impede resposta automática da IA.

---

### Corrigir IA

Registra correção oficial.

Exemplo:

```txt
Correção: O NPC Tharion não morreu. Ele fugiu para o norte.
```

---

### Mostrar NPC

Exibe NPC aos jogadores da cena.

---

### Mostrar Cenário

Exibe imagem/local.

---

### Mostrar Mapa

Exibe Mapa Vivo.

---

### Criar Evento Canônico

Registra fato importante.

---

### Pedir Cena à IA

Solicita cena narrativa.

---

### Pedir Consequência à IA

Solicita consequência possível.

---

### Iniciar Combate

Abre Mesa de Combate.

---

### Encerrar Sessão

Finaliza sessão e inicia fluxo de resumo.

---

# 16. Mapa Vivo

## 16.1 Função

Controlar localização, presença, visibilidade, mapas e pontos conectados.

Ver documento específico:

```txt
CRONOFABULA_LIVE_MAP_SYSTEM.md
```

---

## 16.2 Botões do Jogador

- Ver Minha Localização;
- Ver Cena Atual;
- Mover-se;
- Entrar;
- Sair;
- Observar Local;
- Investigar Área;
- Procurar Saídas;
- Chamar Aliado;
- Marcar no Mapa;
- Anotar no Mapa;
- Compartilhar Mapa;
- Mostrar ao Grupo;
- Guardar Mapa.

Condição importante:

> Jogador só pode anotar no mapa se o personagem possuir mapa, pergaminho, diário ou documento equivalente.

---

## 16.3 Botões do Mestre

- Criar Mapa;
- Enviar Imagem Base;
- Adicionar Ponto;
- Editar Ponto;
- Conectar Pontos;
- Criar Mapa Interno;
- Definir Entrada/Saída;
- Marcar como Visível;
- Marcar como Oculto;
- Definir Condição de Descoberta;
- Adicionar NPC ao Ponto;
- Adicionar Perigo;
- Mover Personagem;
- Mover Grupo;
- Mostrar Mapa aos Jogadores;
- Gerar com IA;
- Aprovar Sugestão da IA.

---

# 17. Mesa de Combate

## 17.1 Função

Sistema de combate separado da exploração.

Ver documento específico:

```txt
CRONOFABULA_COMBAT_SYSTEM.md
```

---

## 17.2 Botões do Jogador

- Atacar;
- Magia;
- Habilidade;
- Item;
- Mover-se;
- Defender;
- Ajudar;
- Preparar Ação;
- Interagir com Cenário;
- Falar;
- Rolar Dado;
- Informar Dado Físico;
- Encerrar Turno.

---

## 17.3 Botões do Mestre

- Adicionar Inimigo;
- Remover Inimigo;
- Editar PV;
- Editar CA;
- Aplicar Condição;
- Remover Condição;
- Pedir Rolagem;
- Forçar Evento;
- Assumir Inimigo;
- Devolver Inimigo para IA;
- Pausar Combate;
- Reordenar Iniciativa;
- Encerrar Combate.

---

# 18. Personagens da Campanha

## 18.1 Função

Lista e gerencia personagens vinculados à campanha.

Mostra:

- personagem;
- jogador;
- classe;
- raça;
- nível;
- PV;
- CA;
- status;
- localização atual;
- tema ativo;
- diário;
- mapa;
- inventário.

---

## 18.2 Botões

### Adicionar Personagem

Adiciona personagem à campanha.

---

### Aprovar Personagem

Mestre aprova personagem enviado.

---

### Abrir Ficha

Visualiza ficha.

---

### Editar Ficha

Edita ficha conforme permissão.

---

### Subir de Nível

Mestre libera evolução.

---

### Aplicar Condição

Aplica condição narrativa ou mecânica.

---

### Remover Condição

Remove condição.

---

### Mover para Local

Move personagem no Mapa Vivo.

---

### Marcar como Morto/Inativo

Altera status.

---

### Remover da Campanha

Remove personagem da campanha.

---

# 19. NPCs

## 19.1 Função

Central de personagens não-jogadores.

Cada NPC deve ter:

- nome;
- imagem;
- localização atual;
- personalidade;
- voz/jeito de falar;
- objetivos;
- medos;
- segredos;
- conhecimento;
- relação com cada personagem;
- memória de interações;
- status.

---

## 19.2 Botões

### Novo NPC

Cria NPC manualmente.

---

### Gerar NPC com IA

Gera NPC baseado em contexto.

---

### Mostrar na Mesa

Exibe NPC na cena atual.

---

### Editar NPC

Atualiza dados.

---

### Mover NPC

Move NPC para outro ponto do Mapa Vivo.

---

### Assumir NPC

Mestre controla diálogo.

---

### Devolver NPC para IA

IA interpreta NPC.

---

### Marcar Relação

Define relação:

- aliado;
- neutro;
- inimigo;
- desconfiado;
- dívida;
- rival.

---

### Registrar Segredo

Campo visível ao mestre.

---

### Marcar Status

- vivo;
- morto;
- desaparecido;
- preso;
- ferido;
- transformado.

---

# 20. Locais

## 20.1 Função

Gerenciar locais da campanha.

Cada local pode estar ligado ao Mapa Vivo.

Campos:

- nome;
- tipo;
- descrição;
- imagem;
- região;
- mapa interno;
- clima;
- perigos;
- NPCs presentes;
- eventos associados;
- status;
- visibilidade.

---

## 20.2 Botões

### Novo Local

Cria local manualmente.

---

### Gerar Local com IA

IA sugere local.

---

### Mostrar Cenário

Exibe local na Mesa Viva.

---

### Adicionar NPC ao Local

Associa NPC.

---

### Adicionar Perigo

Registra armadilha, monstro ou obstáculo.

---

### Marcar como Visitado

Atualiza estado.

---

### Adicionar ao Mapa

Cria ponto no Mapa Vivo.

---

### Criar Mapa Interno

Cria estrutura interna do local.

---

# 21. Missões

## 21.1 Função

Controlar quests principais e secundárias.

Status possíveis:

- rumor;
- disponível;
- aceita;
- em andamento;
- concluída;
- falhou;
- abandonada;
- secreta.

---

## 21.2 Botões

### Nova Missão

Cria missão manualmente.

---

### Gerar Missão com IA

IA sugere missão.

---

### Atualizar Status

Muda fase da missão.

---

### Adicionar Objetivo

Cria objetivo.

---

### Adicionar Recompensa

Define recompensa.

---

### Vincular NPC

Liga missão a NPC.

---

### Vincular Local

Liga missão a local.

---

### Marcar como Canônica

Confirma importância narrativa.

---

# 22. Inventário

## 22.1 Função

Controlar itens da campanha e dos personagens.

Os itens devem ter descrição baseada em como foram obtidos e respeitar o conhecimento do personagem.

---

## 22.2 Tipos de Item

- arma;
- armadura;
- consumível;
- item mágico;
- documento;
- chave;
- tesouro;
- recurso;
- item narrativo;
- diário;
- mapa.

---

## 22.3 Camadas de Informação do Item

### Aparência

O que qualquer um vê.

### História conhecida

Como o personagem obteve o item.

### Propriedades conhecidas

O que o personagem sabe que o item faz.

### Segredo do mestre

Informação oculta.

---

## 22.4 Botões

### Adicionar Item

Cria item.

---

### Gerar Item com IA

Gera item com aprovação do mestre.

---

### Ver História do Item

Mostra como foi obtido.

---

### Identificar Item

Executa ação de identificação.

---

### Editar Descrição Conhecida

Mestre ajusta o que personagem sabe.

---

### Dar Item a Personagem

Transfere item.

---

### Transferir Item

Move entre personagens.

---

### Usar Item

Registra uso.

---

### Remover Item

Remove ou marca consumido.

---

### Marcar como Pendente

Usado para itens de jornada solo.

---

### Aprovar Item

Mestre aprova.

---

# 23. Diário

## 23.1 Função

Diário é item físico/narrativo do personagem.

O jogador só acessa o diário se o personagem estiver com ele ou tiver acesso narrativo ao item.

Se perder, for roubado ou destruído, o acesso é bloqueado.

---

## 23.2 Estados do Diário

- com o personagem;
- guardado em local conhecido;
- perdido;
- roubado;
- destruído;
- com outro personagem;
- com NPC;
- oculto.

---

## 23.3 Botões

### Abrir Diário

Disponível se personagem tiver acesso.

---

### Nova Anotação

Cria anotação.

---

### Anotar Fala

Registra fala importante.

---

### Anotar Pista

Registra pista.

---

### Mostrar Diário ao Grupo

Compartilha anotações.

---

### Entregar Diário

Transfere diário.

---

### Esconder Diário

Define local onde foi escondido.

---

### Rasgar Página

Remove/separa anotação.

---

### Fazer Cópia

Cria cópia parcial se houver material e permissão.

---

# 24. Mídias

## 24.1 Função

Biblioteca visual e sonora da campanha.

Mídias devem ficar no Cloudflare R2.  
Metadados devem ficar no Supabase.

---

## 24.2 Tipos

- cenários;
- retratos de NPC;
- mapas;
- itens;
- símbolos;
- documentos;
- áudios;
- vídeos.

---

## 24.3 Botões

### Enviar Mídia

Upload de arquivo.

---

### Criar Pasta

Organiza arquivos.

---

### Vincular a NPC

Associa mídia a NPC.

---

### Vincular a Local

Associa mídia a local.

---

### Vincular a Item

Associa mídia a item.

---

### Mostrar na Mesa

Exibe para jogadores autorizados.

---

### Definir como Capa

Define como capa.

---

### Excluir/Arquivar Mídia

Remove ou arquiva.

---

# 25. Crônicas

## 25.1 Função

Histórico oficial da campanha.

Contém:

- resumos de sessão;
- eventos canônicos;
- decisões importantes;
- mortes;
- descobertas;
- linha do tempo;
- diário do grupo;
- batalhas;
- mudanças no mundo.

---

## 25.2 Botões

### Gerar Resumo com IA

Cria resumo da sessão.

---

### Editar Resumo

Mestre ajusta.

---

### Aprovar como Canônico

Transforma resumo em história oficial.

---

### Criar Entrada Manual

Mestre adiciona fato.

---

### Ver Linha do Tempo

Mostra eventos cronológicos.

---

### Exportar Crônica

Fase futura.

---

# 26. Dados

## 26.1 Função

Central de rolagens.

Mostra:

- rolagens por jogador;
- rolagens físicas;
- rolagens virtuais;
- críticos;
- falhas críticas;
- motivo;
- data;
- sessão;
- combate.

---

## 26.2 Botões

### Rolar Dado

Abre rolagem virtual.

---

### Registrar Dado Físico

Salva resultado manual.

---

### Repetir Rolagem

Repete fórmula.

---

### Filtrar por Jogador

Filtra histórico.

---

### Filtrar por Sessão

Filtra por sessão.

---

### Filtrar por Combate

Filtra por combate.

---

### Marcar Rolagem Contestada

Mestre marca como inválida/discutida.

---

# 27. IA Mestre

## 27.1 Função

Painel de controle da IA da campanha.

Modos:

- Narradora;
- Assistente do Mestre;
- Regras;
- Memória;
- Geradora de Sessão;
- Solo;
- Combate.

---

## 27.2 Botões

### Gerar Próxima Sessão

Cria proposta de sessão.

---

### Gerar Cena

Cria cena específica.

---

### Gerar NPC

Cria NPC.

---

### Gerar Local

Cria local.

---

### Gerar Mapa

Sugere pontos, conexões e locais secretos.

---

### Gerar Consequência

Sugere consequência.

---

### Consultar Regra

Ajuda com regra.

---

### Resumir Sessão

Resume acontecimentos.

---

### Atualizar Memória

Transforma fatos aprovados em memória.

---

### Ver Contexto da IA

Mostra o que será enviado para a IA.

Importante para transparência.

---

### Corrigir Memória da IA

Permite ajustar contexto incorreto.

---

# 28. Aprovações

## 28.1 Função

Central do mestre para validar pendências.

Tipos:

- personagem novo;
- alteração de ficha;
- item obtido;
- XP;
- ouro;
- evento solo;
- consequência narrativa;
- resumo de sessão;
- novo NPC criado por IA;
- mudança em local;
- magia/item especial;
- descoberta de local secreto;
- anotação compartilhada;
- recompensa de combate.

---

## 28.2 Botões

### Aprovar

Aceita.

---

### Rejeitar

Recusa.

---

### Ajustar

Mestre edita antes de aprovar.

---

### Marcar como Parcial

Aceita parte.

---

### Ver Origem

Mostra de onde veio.

---

### Enviar Comentário

Mestre explica decisão.

---

# 29. Configurações da Campanha

## 29.1 Função

Controlar regras, permissões e comportamento da IA.

---

## 29.2 Seções

### Geral

- nome;
- descrição;
- capa;
- tom;
- status.

### Sistema

- D&D/SRD;
- regras caseiras;
- nível inicial;
- progressão por XP ou marco.

### IA

- narrador padrão;
- tom da IA;
- liberdade da IA;
- pode criar NPC?
- pode dar item?
- pode matar NPC?
- pode iniciar combate?
- pode sugerir mapa?
- pode revelar segredo?

### Jornada Solo

- permitir solo;
- tipos permitidos;
- recompensas máximas;
- aprovação obrigatória;
- limite por semana.

### Dados

- permitir dado físico;
- permitir dado virtual;
- exigir motivo;
- rolagem pública ou privada.

### Mapa

- jogadores podem anotar?
- exige item mapa?
- locais secretos invisíveis?
- IA pode sugerir locais ocultos?
- mestre aprova novos pontos?

### Diário

- diário inicial obrigatório?
- diário pode ser perdido?
- jogador perde acesso se perder?
- cópias permitidas?

### Jogadores

- convidar;
- remover;
- permissões;
- mestre auxiliar.

---

## 29.3 Botões

### Salvar Configurações

Salva alterações.

---

### Restaurar Padrão

Volta ao padrão seguro.

---

### Arquivar Campanha

Remove de ativas.

---

### Encerrar Campanha

Finaliza campanha.

---

### Excluir Campanha

Ação destrutiva com confirmação forte.

---

# 30. Botões Globais Fixos

Alguns botões podem aparecer em quase todas as telas.

## Oráculo

Abre IA contextual.

Exemplos:

- na ficha: explicar regra;
- no NPC: gerar fala;
- no mapa: sugerir local;
- na crônica: resumir evento.

---

## Dado

Abre rolagem rápida.

---

## Diário

Abre diário do personagem ativo, se acessível.

---

## Mapa

Abre Mapa Vivo.

---

## Notificações

Mostra:

- convites;
- aprovações;
- turno chamado;
- mensagens privadas;
- diário perdido;
- mapa perdido;
- resumos pendentes.

---

## Tema

Permite trocar tema visual permitido.

---

# 31. Fluxos Principais

## 31.1 Criar Campanha

```txt
Dashboard
→ Nova Campanha
→ Preencher dados
→ Escolher sistema
→ Definir IA
→ Definir jornada solo
→ Definir regras de diário/mapa
→ Criar campanha
→ Convidar jogadores
```

Botões:

- Próximo;
- Voltar;
- Salvar rascunho;
- Gerar descrição com IA;
- Criar campanha.

---

## 31.2 Criar Personagem

```txt
Personagens
→ Novo Personagem
→ Escolher campanha
→ Escolher raça
→ Escolher classe
→ Definir atributos
→ Escolher tema
→ Criar diário inicial
→ Criar inventário inicial
→ Enviar ao mestre
```

Botões:

- Gerar conceito com IA;
- Rolar atributos;
- Usar distribuição padrão;
- Salvar rascunho;
- Enviar para aprovação.

---

## 31.3 Iniciar Sessão

```txt
Campanha
→ Criar Sessão
→ Carregar estado do mapa
→ Gerar recapitulação
→ Mestre edita/avalia
→ Iniciar Mesa Viva
```

A recapitulação mostra:

- onde estão;
- estado físico do grupo;
- situação atual;
- NPCs visíveis;
- objetivo conhecido.

Não mostra automaticamente diálogos esquecidos ou não anotados.

---

## 31.4 Jogar Cena

```txt
Mesa Viva
→ Personagem fala/age
→ Sistema verifica cena/local/conhecimento
→ IA ou mestre responde
→ Sistema registra evento
→ Jogador pode anotar, rolar, mover ou interagir
```

---

## 31.5 Conversar com NPC

```txt
Mesa Viva
→ Interagir com NPC
→ Selecionar NPC presente
→ Escolher abordagem
→ Enviar fala/ação
→ Sistema verifica presença e visibilidade
→ IA ou mestre responde como NPC
→ Informação pode ser anotada ou compartilhada
```

---

## 31.6 Compartilhar Informação

```txt
Jogador recebeu informação privada
→ Relatar ao Grupo
→ Escolher verdade/meia verdade/mentira/omissão
→ Sistema registra o que foi dito
→ Outros personagens passam a saber apenas o que foi relatado
```

---

## 31.7 Mover pelo Mapa

```txt
Mapa Vivo
→ Mover-se
→ Escolher ponto conectado
→ Sistema verifica conexão/bloqueio/chave/teste
→ Move personagem ou solicita aprovação
→ Atualiza cena
```

---

## 31.8 Descobrir Local Secreto

```txt
Jogador investiga
→ Sistema verifica condição
→ Mestre/IA pede teste
→ Resultado aprovado
→ Local secreto vira visível para quem descobriu
→ Jogador pode compartilhar ou anotar
```

---

## 31.9 Iniciar Combate

```txt
Mesa Viva
→ Ação hostil ou mestre inicia
→ Iniciar Combate
→ Selecionar participantes
→ Rolar iniciativa
→ Entrar na Mesa de Combate
```

---

## 31.10 Encerrar Combate

```txt
Mesa de Combate
→ Encerrar Combate
→ Gerar resultado
→ Definir recompensas
→ Mestre aprova
→ Atualizar crônica/mapa/inventário
→ Voltar à Mesa Viva
```

---

## 31.11 Encerrar Sessão

```txt
Mesa Viva
→ Encerrar Sessão
→ IA gera resumo
→ Mestre edita
→ Aprovar como Crônica
→ Atualizar memória
→ Salvar estado final
```

---

# 32. MVP Recomendado

## Global

- Dashboard;
- Campanhas;
- Personagens;
- Configurações.

## Campanha

- Visão Geral;
- Mesa Viva;
- Mapa Vivo;
- Personagens;
- NPCs;
- Locais;
- Inventário;
- Diário;
- Mídias;
- Crônicas;
- Dados;
- IA Mestre;
- Aprovações;
- Configurações.

## Combate

- Mesa de Combate como modo ativado, não necessariamente aba fixa.

---

# 33. Fase 2

- Jornada Solo completa;
- Biblioteca avançada;
- Missões avançadas;
- mapa tático/grid;
- magias avançadas;
- exportar crônicas;
- desenho livre no mapa;
- automação de linha de visão;
- app mobile;
- integração com Discord/WhatsApp.

---

# 34. Riscos e Limitações

## Riscos

- Abas demais confundirem o usuário.
- Mestre ter trabalho demais se tudo for manual.
- IA revelar informações indevidas.
- Jogadores abusarem de cenas privadas.
- Diário/mapa como item parecer punitivo se mal aplicado.
- Combate ficar lento se tentar automatizar tudo cedo.

## Mitigações

- MVP com navegação reduzida.
- Botões contextuais em vez de todos visíveis sempre.
- Mestre vê tudo e aprova mudanças importantes.
- IA recebe contexto filtrado.
- Diário e mapa perdidos devem ser consequência narrativa justa.
- Combate começa por zonas táticas simples.

---

# 35. Decisão Oficial

```txt
Cronofábula terá navegação em duas camadas:
Área Global do Usuário e Área Interna da Campanha.

A Mesa Viva será o centro da sessão narrativa.
O Mapa Vivo controlará localização, presença e visibilidade.
A Mesa de Combate será ativada quando houver luta.
Itens, diários e mapas terão existência narrativa no inventário.
A IA será contextual, controlada e subordinada ao estado do sistema.
O mestre terá controle final sobre fatos canônicos, recompensas, mapa, NPCs e consequências.
```

---

## 36. Próximos Passos

Após este documento, os próximos arquivos recomendados são:

```txt
CRONOFABULA_DATABASE_SCHEMA.md
CRONOFABULA_AI_CONTEXT_AND_PROMPTS.md
CRONOFABULA_MVP_ROADMAP.md
CRONOFABULA_PERMISSION_SYSTEM.md
```

A sequência recomendada:

1. Fechar schema do banco.
2. Definir permissões/RLS.
3. Definir prompts internos da IA.
4. Montar roadmap do MVP.
5. Criar protótipo visual.
