import requests

BASE_URL = "http://localhost:3333"

# ⚠️ SUBSTITUA PELO ID REAL DA SUA PRODUCT_VARIANT (Copiado de /products)
ID_DA_VARIAÇÃO_REAL = "0dd085c8-ec84-49ab-9a93-72bba9bc107e"

# def fazer_login():
#     print("🔐 Efetuando login para obter o Token JWT...")
#     response = requests.post(f"{BASE_URL}/login", json={
#         "email": "jonathan@teste.com",
#         "password": "senha123"
#     })
#     if response.status_code == 200:
#         return response.json().get("token")
#     else:
#         print(f"❌ Falha no login: {response.text}")
#         exit()

def fazer_login():
    print("🔐 Efetuando login para obter o Token JWT...")
    response = requests.post(f"{BASE_URL}/login", json={
        "email": "jonathan@teste.com",
        "password": "senha123"
    })
    if response.status_code == 200:
        token = response.json().get("token")
        # 👇 ADICIONE ESTA LINHA ABAIXO PARA MOSTRAR O JWT NO TERMINAL:
        print(f"🎫 TOKEN GERADO: {token}\n")
        return token
    else:
        print(f"❌ Falha no login: {response.text}")
        exit()


# ==============================================================================
# TESTE 1: Tentativa como usuário comum (Deve dar erro 403)
# ==============================================================================
print("--- TESTE 1: Acessando como cliente comum ---")
token_cliente = fazer_login()

headers = {
    "Authorization": f"Bearer {token_cliente}",
    "Content-Type": "application/json"
}

# Payload para adicionar 50 novas saias ao estoque
payload_estoque = {
    "quantity": 50,
    "mode": "add"
}

print("📥 Enviando carga de fardo para a rota admin...")
response_1 = requests.patch(
    f"{BASE_URL}/admin/variants/{ID_DA_VARIAÇÃO_REAL}/stock", 
    json=payload_estoque, 
    headers=headers
)

print(f"📊 Código de Status recebido: {response_1.status_code}")
print(f"📄 Resposta do Servidor: {response_1.text}\n")

print(response_1.json())

if response_1.status_code == 403:
    print("🛡️  Boa! A trava de segurança funcionou. Usuário comum não passa por aqui.")
else:
    print("⚠️  Atenção: A rota não barrou o usuário comum!")

# ==============================================================================
# PAUSA PARA VOCÊ SE TORNAR ADMIN NO BANCO
# ==============================================================================
print("\n" + "="*50)
print("👉 AGORA É A SUA VEZ:")
print("Abra o terminal do seu MariaDB ou ferramenta de banco (DBeaver) e rode:")
print("UPDATE User SET role = 'ADMIN' WHERE email = 'jonathan@teste.com';")
print("="*50)

input("\nApós rodar o comando acima no seu banco, aperte ENTER aqui para continuar...")

# ==============================================================================
# TESTE 2: Tentativa após virar ADMIN (Deve dar sucesso 200)
# ==============================================================================
print("\n--- TESTE 2: Acessando como Administrador ---")
# Fazemos o login de novo para gerar um NOVO token que agora carrega o papel de 'ADMIN'
token_admin = fazer_login()

headers_admin = {
    "Authorization": f"Bearer {token_admin}",
    "Content-Type": "application/json"
}

print("📥 Enviando carga de fardo novamente...")
response_2 = requests.patch(
    f"{BASE_URL}/admin/variants/{ID_DA_VARIAÇÃO_REAL}/stock", 
    json=payload_estoque, 
    headers=headers_admin
)

print(f"📊 Código de Status recebido: {response_2.status_code}")
print("📄 Resposta do Servidor:")
print(response_2.json())
if response_2.status_code == 200:
    print("🎉 SUCESSO! O estoque foi atualizado com as novas peças da produção!")
    print(response_2.json())
else:
    print(f"❌ Erro: {response_2.text}")