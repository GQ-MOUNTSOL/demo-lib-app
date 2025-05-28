# Add these endpoints to your existing Flask app

@app.route('/api/webhook/processed-book', methods=['POST'])
def receive_processed_book():
    try:
        data = request.get_json()
        
        # Log the received data
        print("Received processed book data:", data)
        
        # Here you can save to database or process as needed
        # For now, we'll store in a simple way
        
        # You could create a new table for processed books
        # or update existing book records
        
        return jsonify({
            'status': 'success', 
            'message': 'Book data received successfully',
            'received_at': datetime.now().isoformat()
        })
        
    except Exception as e:
        print(f"Error receiving processed book: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 400

@app.route('/api/processed-books', methods=['GET'])
def get_processed_books():
    try:
        # For demo purposes, return mock data
        # Replace this with actual database query
        processed_books = [
            {
                "id": "1",
                "bookTitle": "The Alchemist",
                "author": "Paulo Coelho",
                "timestamp": "2024-01-15T10:30:00Z",
                "status": "completed",
                "data": {
                    "summary": "A young shepherd named Santiago travels from Spain to Egypt...",
                    "metadata": {
                        "title": "The Alchemist",
                        "genre": "Fiction",
                        "author": {
                            "name": "Paulo Coelho",
                            "nationality": "Brazilian"
                        }
                    }
                }
            }
        ]
        
        return jsonify(processed_books)
        
    except Exception as e:
        print(f"Error fetching processed books: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

# Add CORS headers if needed
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response
