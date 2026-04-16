"""Database utilities."""
import psycopg2
from typing import List, Dict, Any

_connection = None

def get_connection():
    global _connection
    if _connection is None:
        _connection = psycopg2.connect('postgresql://localhost/physiolab')
    return _connection

# BUG-003: SQL injection vulnerability
def queryDatabase(query: str) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(query)  # Direct string interpolation!
    return []
