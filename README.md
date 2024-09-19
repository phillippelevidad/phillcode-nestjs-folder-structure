Este projeto é uma aplicação modular construída com NestJS, seguindo princípios de design limpo e alguns conceitos de Domain-Driven Design (DDD). A lógica de negócio principal está na pasta `domain`, enquanto as integrações com serviços externos, como notificações por e-mail e SMS, ficam na pasta `integrations`. A camada `application` coordena fluxos entre domínios diferentes ou domínios e integrações. Funções utilitárias reaproveitáveis estão na pasta `utils`. A ideia geral é manter a separação clara entre regras de negócio e serviços de suporte, garantindo flexibilidade e fácil manutenção no futuro.

## Pasta `domain`

Aqui está toda a lógica central da aplicação, incluindo entidades, serviços e repositórios que gerenciam as regras de negócio. O objetivo é encapsular as **decisões** que são essenciais pro funcionamento do sistema, sem se preocupar com detalhes de implementação ou entrega de dados, que ficam nos módulos da pasta `integrations`.

Essa separação faz com que os módulos do domínio sejam coesos e independentes de infraestrutura, o que facilita a manutenção. Por exemplo, o módulo `domain/notifications` decide quando e por que uma notificação deve ser enviada, mas a responsabilidade de realmente enviar a notificação é do módulo `integrations/notifier`. Assim, o sistema fica flexível e desacoplado de tecnologias externas.

### 5 módulos que poderiam ser adicionados em `domain`

1. **Orders**: Para gerenciar pedidos, com regras de criação, atualização e cancelamento.
2. **Payments**: Para processar e gerenciar transações financeiras.
3. **Products**: Para gerenciar produtos ou serviços oferecidos.
4. **Customer management**: Para lidar com informações e interações dos clientes.
5. **Inventory**: Para controlar estoque e operações de movimentação de inventário.

## Pasta `integrations`

Esta pasta contém módulos que fazem integrações com serviços externos (como e-mails, SMS, gateways de pagamento) ou internos (como importação/exportação de CSV). A ideia é que esses módulos cuidem de funções de suporte, deixando a lógica de negócio desacoplada.

Cada módulo dentro de `integrations` é pensado para funcionar de forma independente. Por exemplo, o `integrations/notifier` é responsável por enviar as notificações, mas as regras de quando isso deve acontecer estão no módulo de domínio correspondente. Isso facilita substituir ou adicionar novas integrações sem impactar o núcleo do sistema.

### 5 módulos de suporte que poderiam ser adicionados em `integrations`

1. **Payment gateway**: Integração com provedores de pagamento (ex: Stripe, PayPal).
2. **File storage**: Integração com serviços de armazenamento de arquivos (ex: AWS S3).
3. **Email provider**: Integração com provedores de e-mail (ex: SendGrid).
4. **SMS provider**: Integração com provedores de SMS (ex: Twilio).
5. **OAuth**: Integração com serviços de autenticação (ex: Google, Facebook).

## Pasta `application`

A pasta `application` é onde ficam os módulos que orquestram e coordenam fluxos de trabalho, conectando módulos de domínio quanto e de integração. É uma camada que funciona como uma ponte entre diferentes partes do sistema, sem conter a lógica de negócio, mas garantindo que as ações certas sejam tomadas em resposta aos eventos que acontecem no domínio.

A camada `application` cuida da execução dos casos de uso do sistema, coordenando a comunicação entre os módulos. Por exemplo, o módulo de domínio `users` pode emitir um evento como `EmployeeAdded`, e a camada `application` garante que esse evento gere uma notificação para o gerente, usando o módulo de integração `notifications`. Dessa forma, o fluxo de trabalho roda de forma organizada, mantendo bem separadas as responsabilidades de cada parte.

### 5 responsabilidades que a camada `application` poderia ter

1. **Processamento de eventos**: Gerenciar os eventos do domínio, coordenando como o sistema reage a esses eventos (ex: mandar notificações ou iniciar fluxos).
2. **Casos de Uso**: Implementar os casos de uso, juntando módulos de domínio e de integração para realizar uma função específica (ex: cadastrar um novo usuário e enviar um e-mail de boas-vindas).
3. **Coordenação de transações**: Orquestrar transações entre diferentes módulos do sistema (ex: processo de pagamento e atualização do status do pedido).
4. **Agendamento de tarefas**: Gerenciar tarefas assíncronas ou agendadas que envolvem ações entre os módulos (ex: disparar cobranças recorrentes para usuários via um gateway de pagamento).
5. **Serviços de aplicação**: Controlar serviços de alto nível que integram vários componentes do sistema, sem implementar a lógica de negócio (ex: um serviço que coordena a importação e exportação de dados entre arquivos CSV e o banco de dados).

## Pasta `utils`

Aqui ficam funções utilitárias que podem ser usadas em diferentes partes da aplicação. Esses helpers não estão diretamente ligados à lógica de negócio ou a integrações específicas, mas ajudam a simplificar operações comuns, promovendo reutilização de código.

Um exemplo seria a função `hashPassword`, que usa o pacote `bcrypt` para gerar hashes de senhas de forma segura. Ela pode ser usada em vários módulos que lidam com senhas, mantendo a consistência.

### 5 funções utilitárias que poderiam ser adicionadas em `utils`

1. **formatDate**: Para padronizar a formatação de datas.
2. **generateId**: Função para gerar IDs únicos.
3. **validateEmail**: Para validar e-mails.
4. **randomString**: Para gerar strings aleatórias, útil para senhas temporárias.
5. **capitalize**: Para capitalizar a primeira letra de uma string.

## Installation

```bash
$ npm install
```

## Running the app

```bash
# create the containers
$ docker-compose up -d

# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod

# cleanup containers and associated volumes
$ docker-compose down -v
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```
