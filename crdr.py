from flask import Flask, render_template, request, send_file, after_this_request, jsonify
from Crypto.Cipher import AES
from Crypto.Protocol.KDF import PBKDF2
from Crypto.Random import get_random_bytes
import json, tempfile, os

app = Flask(__name__)

def encrypt_file(data, password, filename):
    salt = get_random_bytes(16)
    key = PBKDF2(password, salt, dkLen=32)

    cipher = AES.new(key, AES.MODE_GCM)
    ciphertext, tag = cipher.encrypt_and_digest(data)

    meta = json.dumps({"name": filename}).encode()
    meta_len = len(meta).to_bytes(4, 'big')

    return salt + cipher.nonce + tag + meta_len + meta + ciphertext

def decrypt_file(data, password):
    try:
        salt = data[:16]
        nonce = data[16:32]
        tag = data[32:48]

        key = PBKDF2(password, salt, dkLen=32)
        cipher = AES.new(key, AES.MODE_GCM, nonce=nonce)

        rest = data[48:]
        meta_len = int.from_bytes(rest[:4], 'big')
        meta = json.loads(rest[4:4+meta_len])

        ciphertext = rest[4+meta_len:]
        decrypted = cipher.decrypt_and_verify(ciphertext, tag)

        return meta["name"], decrypted, None
    except Exception as e:
        return None, None, str(e)

@app.route('/')
def index():
    return render_template("index.html")

@app.route('/encrypt', methods=['POST'])
def encrypt():
    file = request.files['file']
    key = request.form['key']

    data = file.read()
    encrypted = encrypt_file(data, key, file.filename)

    tmp = tempfile.NamedTemporaryFile(delete=False)
    tmp.write(encrypted)
    tmp.close()

    @after_this_request
    def cleanup(response):
        try: os.remove(tmp.name)
        except: pass
        return response

    return send_file(tmp.name, as_attachment=True, download_name="encrypted.bin")

@app.route('/decrypt', methods=['POST'])
def decrypt():
    file = request.files['file']
    key = request.form['key']

    data = file.read()
    filename, decrypted, error = decrypt_file(data, key)

    if error:
        return jsonify({"error": "Wrong key or corrupted file"}), 400

    tmp = tempfile.NamedTemporaryFile(delete=False)
    tmp.write(decrypted)
    tmp.close()

    @after_this_request
    def cleanup(response):
        try: os.remove(tmp.name)
        except: pass
        return response

    return send_file(tmp.name, as_attachment=True, download_name=filename)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port="5000", debug=True)