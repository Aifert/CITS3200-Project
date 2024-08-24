from flask import Flask, request, jsonify
import datetime

app = Flask(__name__)

@app.route('/sdr', methods=['POST'])
def sdr_endpoint():
    print(request)
    data = request.json
    if not data:
        return jsonify({"error": "No data provided"}), 400

    # Simulate processing of the SDR data
    timestamp = datetime.datetime.now().isoformat()
    print(f"Received SDR data at {timestamp}: {data}")

    # Return a response indicating success
    return jsonify({"status": "success", "received_at": timestamp}), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)
