import requests

BASE_URL = "http://localhost:3333"

# Cadastro
usuario = {
    "name": "Jonathan Teste",
    "email": "jonathan@teste.com",
    "password": "senha123",
    "phone": "11988887777"
}

r = requests.post(f"{BASE_URL}/register", json=usuario)

print("Cadastro:")
print(r.status_code)
print(r.json())

# Login
credenciais = {
    "email": usuario["email"],
    "password": usuario["password"]
}

r = requests.post(f"{BASE_URL}/login", json=credenciais)

print("\nLogin:")
print(r.status_code)

print("Status:", r.status_code)
print("Headers:", r.headers.get("Content-Type"))
print("Resposta:")
print(repr(r.text))


dados = r.json()

print(dados)

if r.status_code == 200:
    token = dados["token"]
    print("\nJWT:")
    print(token)