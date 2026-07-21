import requests

# Configuração da URL base do seu servidor Fastify local
BASE_URL = "http://localhost:3333"

# ==========================================
# PASSO 1: Fazer o Login e capturar o Token
# ==========================================
print("🔐 Tentando realizar o login...")

login_url = f"{BASE_URL}/login"
login_payload = {
    "email": "jonathan@teste.com",  # O e-mail que você cadastrou no curl
    "password": "senha123"
}

response_login = requests.post(login_url, json=login_payload)

if response_login.status_code == 200:
    login_data = response_login.json()
    token = login_data.get("token")
    print("✅ Login efetuado com sucesso!")
    print(f"🎫 Token JWT Capturado: {token[:30]}...") # Mostra só o começo do token
else:
    print(f"❌ Erro no login ({response_login.status_code}): {response_login.text}")
    exit()

# ==========================================
# PASSO 2: Fazer o Pedido usando o Token
# ==========================================
print("\n🛒 Preparando a requisição do pedido...")

# ATENÇÃO: Substitua pelo ID real de uma ProductVariant que está no seu banco!
# Dica: Você descobre esse ID acessando http://localhost:3333/products no navegador
ID_DA_VARIAÇÃO_REAL = "37506fa4-8b8e-4964-ba02-9fe9bda4f170" 

order_url = f"{BASE_URL}/orders"

# Configuração do cabeçalho contendo o portador do Token (Bearer)
headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

# Dados do pedido (repare que o userId NÃO vai aqui, o Fastify vai extrair do token!)
order_payload = {
    "customerName": "Jonathan Teste",
    "customerEmail": "jonathan@teste.com",
    "items": [
        {
            "productVariantId": ID_DA_VARIAÇÃO_REAL,
            "quantity": 2  # Comprando 2 unidades para testar a baixa do estoque
        }
    ]
}

response_order = requests.post(order_url, json=order_payload, headers=headers)

if response_order.status_code == 201:
    print("🎉 Sucesso! Pedido processado pela API e transação concluída.")
    print(response_order.json())
else:
    print(f"⚠️ Falha ao criar pedido ({response_order.status_code}):")
    print(response_order.json())