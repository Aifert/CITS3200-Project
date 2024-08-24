from flask import Flask, request, jsonify
from flask_cors import CORS
import datetime

app = Flask(__name__)
CORS(app)


@app.route('/sdr', methods=['POST'])
def sdr_endpoint():
    print(request)
    data = request.json
    if not data:
        return jsonify({"error": "No data provided"}), 400

    timestamp = datetime.datetime.now().isoformat()
    print(f"Received SDR data at {timestamp}: {data}")

    return jsonify({"status": "success", "received_at": timestamp}), 200


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)
