#!/usr/bin/env python3
from flask import Flask, jsonify

app = Flask(__name__)

@app.route('/test')
def test():
    return jsonify({"message": "Hello World"})

if __name__ == '__main__':
    app.run(host='localhost', port=8003, debug=False)