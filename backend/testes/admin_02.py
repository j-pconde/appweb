import requests

BASE_URL = "http://localhost:3333"
EMAIL_TESTE = "jonathan@teste.com"

# Criamos uma sessão do requests para que ele gerencie e armazene os Cookies automaticamente
session = requests.Session()

def separar_secao(titulo):
    print("\n" + "="*60)
    print(f"👉 {titulo}")
    print("="*60)

# --- TESTE 1: TENTAR ENTRAR NO PAINEL ADMIN COMO CUSTOMER ---
separar_secao("TESTE 1: Login Administrativo com nível 'CUSTOMER'")

# 1. Garanta que o usuário é CUSTOMER no banco antes de rodar
print(f"Tentando logar em /admin/login com {EMAIL_TESTE}...")
payload = {"email": EMAIL_TESTE, "password": "123"} # senha fictícia de teste

response = session.post(f"{BASE_URL}/admin/login", json=payload)
print(f"📊 Status recebido: {response.status_code}")
print(f"📄 Resposta: {response.json()}")

if response.status_code == 403:
    print("🛡️ SUCESSO: A rota bloqueou o login administrativo porque o usuário é CUSTOMER!")
else:
    print("🚨 FALHA: O login deveria ter sido rejeitado com status 403!")


# --- INTERAÇÃO COM O USUÁRIO ---
print("\n" + "-"*50)
print("👉 AGORA É A SUA VEZ:")
print("Abra o DBeaver e mude a role do seu usuário para 'ADMIN':")
print(f"UPDATE User SET role = 'ADMIN' WHERE email = '{EMAIL_TESTE}';")
print("Não se esqueça de dar o COMMIT se necessário!")
print("-"*50)
input("\nApós rodar o comando acima no banco, aperte ENTER aqui para continuar...")


# --- TESTE 2: LOGIN DO ADMIN E VALIDAÇÃO DO COOKIE HTTPONLY ---
separar_secao("TESTE 2: Login Administrativo com nível 'ADMIN'")

# Limpa cookies anteriores para garantir um teste limpo
session.cookies.clear()

response = session.post(f"{BASE_URL}/admin/login", json=payload)
print(f"📊 Status recebido: {response.status_code}")
print(f"📄 Resposta: {response.json()}")

# Verifica se o cookie de sessão 'token' foi recebido do backend
cookies_recebidos = session.cookies.get_dict()
print(f"🍪 Cookies salvos na sessão: {cookies_recebidos}")

if "token" in cookies_recebidos and response.status_code == 200:
    print("🎉 SUCESSO: O login foi efetuado e o Cookie HttpOnly 'token' foi gravado!")
else:
    print("🚨 FALHA: O Cookie 'token' não foi retornado ou o login falhou!")
    exit()


# --- TESTE 3: ENVIANDO CARGA COM COOKIE PARA ROTA DE ESTOQUE ---
# --- TESTE 3: ENVIANDO CARGA COM COOKIE PARA ROTA DE ESTOQUE ---
separar_secao("TESTE 3: Atualizando Estoque usando o Cookie gravado")

# Um UUID de exemplo para passar na validação de formato do Zod
ID_VARIAÇÃO_TESTE = "5eb25853-63bf-4b1d-8e6b-3d5f4678fc94"

# A sua rota aceita 'quantity' e opcionalmente 'mode' (que por padrão é 'add')
carga_estoque = {
    "quantity": 50,
    "mode": "add"
}

# Fazemos uma chamada PATCH (conforme definido no seu backend)
# O objeto 'session' anexa o Cookie 'token' de forma 100% silenciosa
response_estoque = session.patch(
    f"{BASE_URL}/admin/variants/{ID_VARIAÇÃO_TESTE}/stock", 
    json=carga_estoque
)

print(f"📊 Status recebido da Rota Admin: {response_estoque.status_code}")
print(f"📄 Resposta: {response_estoque.json()}")

# Se o ID não existir no seu MariaDB local, o backend retornará 404,
# mas com a mensagem "Variação de produto não encontrada" (vindo do try/catch),
# o que prova que a barreira de autenticação PASSOU com sucesso absoluto!
if response_estoque.status_code in [200, 404] and "Route" not in response_estoque.text:
    if response_estoque.status_code == 404:
        print("\n🏆 SUCESSO TOTAL!")
        print("O hook de autenticação validou seu Cookie perfeitamente e a rota foi encontrada.")
        print("Nota: O retorno foi 404 apenas porque o UUID simulado não está cadastrado no seu banco.")
    else:
        print("\n🚀 VITÓRIA! Estoque real atualizado com sucesso via Cookie seguro!")
else:
    print("\n🚨 FALHA: A rota retornou erro de roteamento ou de autenticação.")