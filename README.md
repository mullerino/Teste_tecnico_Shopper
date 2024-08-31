# Teste Técnico Shopper

Este projeto é uma aplicação Node.js construída como parte de um teste técnico para a empresa Shopper. A aplicação está completamente dockerizada e realiza o upload de medições (como leitura de água ou gás) para uma base de dados MySQL, além de permitir consultas e confirmações dessas medições. Além disso, o projeto conta com um sistema de logging centralizado usando o Bunyan.

## Funcionalidades

- **Upload de Medições:** Envio de medições de água ou gás, com suporte para upload de imagens associadas.
- **Confirmação de Medições:** Confirmação das medições registradas.
- **Consulta de Medições:** Listagem de medições por cliente, com suporte a filtros.
- **Sistema de Logging:** Log centralizado com rotacionamento de logs utilizando Bunyan.

## Tecnologias Utilizadas

- **Node.js** com **Express** para o backend.
- **TypeScript** para tipagem estática.
- **MySQL** para armazenamento de dados.
- **AWS S3** para armazenamento de imagens.
- **Bunyan** para logging.
- **Docker** e **Docker Compose** para containerização.
- **Jest** para testes unitários.

## Estrutura do Projeto

- **`src/config`**: Configurações do projeto (banco de dados, logger, etc).
- **`src/controllers`**: Controladores das rotas.
- **`src/routes`**: Definição das rotas da API.
- **`src/services`**: Lógica de negócios e integração com serviços externos.
- **`log`**: Logs gerados pelo Bunyan.
- **`Dockerfile`**: Configuração do Docker para a aplicação.
- **`docker-compose.yml`**: Arquivo Docker Compose para orquestração de contêineres.
- **`tests`**: Testes unitários usando Jest.

## Como Rodar o Projeto

### Pré-requisitos

- Docker
- Docker Compose

### Passos

1. **Clone o repositório:**

   ```bash
   git clone https://github.com/seu-usuario/Teste_tecnico_Shopper.git
   cd Teste_tecnico_Shopper

2. **Configurando Variáveis de Ambiente**
   Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

   ```bash
    GEMINI_API_KEY=<sua-chave-gemini>
    AWS_REGION=us-east-1
    AWS_ACCESS_KEY_ID=<sua-access-key>
    AWS_SECRET_ACCESS_KEY=<sua-secret-key>
    BUCKET_NAME=<seu-bucket-name>
   ```

3. **Subindo a Aplicação com Docker**
   
   A aplicação é totalmente dockerizada. Para rodá-la, basta executar os comandos:

   ```bash
    docker-compose build
    docker-compose up
   ```
  Esses comandos irão baixar as imagens necessárias, construir a imagem da aplicação, iniciar os containers e rodar a aplicação.

## Uso da Aplicação

Após iniciar a aplicação, ela estará disponível na porta 3000. Você pode acessar as rotas disponíveis via uma ferramenta como o Postman ou cURL.

### Endpoints Disponíveis

- **POST /upload**: Endpoint para realizar o upload de uma medição.
- **PATCH /confirm**: Endpoint para confirmar uma medição.
- **GET /:customer_code/list**: Endpoint para listar medições de um cliente específico.

## Testes
A aplicação utiliza o Jest para testes unitários. Para rodar os testes, utilize o comando:

 ```bash
  npm run test
 ```

Os testes estão localizados no diretório src/tests e cobrem as principais funcionalidades das rotas implementadas.

## 8. Credenciais AWS

Há um arquivo zipado no repositório contendo as credenciais de um IAM na AWS, configurado especificamente para fazer o upload das imagens que são processadas pelo Gemini. Essas credenciais devem ser inseridas no arquivo `.env` conforme indicado acima.

> **Nota Importante**: Estou ciente dos riscos envolvidos em armazenar credenciais dessa forma, no entanto, esta foi uma exceção feita para garantir que minha solução pudesse ser executada sem prejuízos ao seu desempenho. As credenciais são limitadas estritamente ao uso necessário para esta aplicação e foram configuradas com as devidas permissões para minimizar riscos.


