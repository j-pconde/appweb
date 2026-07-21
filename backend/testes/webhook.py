import requests

BASE_URL = "http://localhost:3333"

# ==============================================================================
# PASSO 1: Login e captura do Token JWT
# ==============================================================================
print("🔐 Efetuando login...")
response_login = requests.post(f"{BASE_URL}/login", json={
    "email": "jonathan@teste.com",
    "password": "senha123"
})
token = response_login.json().get("token")

# ==============================================================================
# PASSO 2: Criar um pedido contendo um 'paymentId' de teste
# ==============================================================================
print("\n🛒 Criando um novo pedido com ID de pagamento temporário...")

# IMPORTANTE: Coloque aqui o mesmo ID da variação de produto que você usou no outro script
ID_DA_VARIAÇÃO_REAL = "37506fa4-8b8e-4964-ba02-9fe9bda4f170" 

# Um ID fictício para simular o código gerado pelo Mercado Pago/Stripe
PAYMENT_ID_SIMULADO = "pay_987654321_isiwa"

headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

# Payload ajustado enviando o campo de rastreamento do gateway
order_payload = {
    "customerName": "Jonathan Teste",
    "customerEmail": "jonathan@teste.com",
    "items": [
        {
            "productVariantId": ID_DA_VARIAÇÃO_REAL,
            "quantity": 1
        }
    ]
}

# Como sua rota de orders no Fastify cria o pedido com valores estáticos,
# vamos garantir que o banco saiba qual é o paymentId associado a ele.
# NOTA: Caso sua rota do Fastify ainda não salve o 'paymentId' enviado pelo body, 
# certifique-se de que no `tx.order.create` do seu arquivo `src/routes/orders.ts`
# o campo `paymentId` esteja mapeado (ex: `paymentId: "pay_987654321_isiwa"` ou recebido no body).
# Para este teste funcionar, o Prisma precisa registrar essa string na coluna `paymentId`.

response_order = requests.post(f"{BASE_URL}/orders", json=order_payload, headers=headers)
order_data = response_order.json()

if response_order.status_code == 201:
    print(f"✅ Pedido criado! ID do Pedido: {order_data['order']['id']}")
    print(f"📊 Status atual do pedido no banco: {order_data['order']['status']}")
else:
    print(f"❌ Erro ao criar pedido: {response_order.text}")
    exit()

# ==============================================================================
# PASSO 3: Disparar o Webhook simulando a aprovação do Gateway
# ==============================================================================
print("\n📡 Simulando o envio de Webhook vindo do servidor de pagamento...")

webhook_url = f"{BASE_URL}/webhooks/payment"

# Payload exatamente no formato que o Zod espera na rota de Webhooks
webhook_payload = {
    "action": "payment.updated",
    "data": {
        "id": PAYMENT_ID_SIMULADO
    }
}

response_webhook = requests.post(webhook_url, json=webhook_payload)

if response_webhook.status_code == 200:
    print("🎉 Webhook processado pela API com sucesso!")
    print("Preste atenção nos logs do terminal do seu Fastify!")
    print("Você verá a mensagem: '💰 Pedido atualizado para PAGO via Webhook.'")
else:
    print(f"⚠️ Falha no Webhook ({response_webhook.status_code}): {response_webhook.text}")