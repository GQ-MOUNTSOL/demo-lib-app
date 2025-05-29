from flask import Flask, request, jsonify
from pymongo import MongoClient
from bson import ObjectId
import os
from datetime import datetime

# Add these to your existing Flask app

# MongoDB connection
MONGODB_URI = "mongodb+srv://gqmountsol:JTcgGkZTHJb8qFLq@demo0.pmagwui.mongodb.net/?retryWrites=true&w=majority&appName=demo0"
client = MongoClient(MONGODB_URI)
db = client.get_database("bookstore")  # Replace with your database name
processed_books_collection = db.processed_books

@app.route('/api/mongodb/processed-books', methods=['GET'])
def get_mongodb_processed_books():
    try:
        # Fetch all processed books from MongoDB
        books = list(processed_books_collection.find().sort("processed_at", -1))
        
        # Convert ObjectId to string for JSON serialization
        for book in books:
            if '_id' in book:
                book['_id'] = str(book['_id'])
        
        print(f"Found {len(books)} books in MongoDB")
        return jsonify(books)
        
    except Exception as e:
        print(f"Error fetching from MongoDB: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/mongodb/processed-books/<book_title>', methods=['GET'])
def get_specific_mongodb_book(book_title):
    try:
        # Find specific book by title
        book = processed_books_collection.find_one({"book_title": book_title})
        
        if book:
            # Convert ObjectId to string
            if '_id' in book:
                book['_id'] = str(book['_id'])
            return jsonify(book)
        else:
            return jsonify({'status': 'not_found', 'message': 'Book not found'}), 404
            
    except Exception as e:
        print(f"Error fetching specific book from MongoDB: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/mongodb/test-connection', methods=['GET'])
def test_mongodb_connection():
    try:
        # Test MongoDB connection
        client.admin.command('ping')
        
        # Get collection stats
        stats = db.command("collStats", "processed_books")
        
        return jsonify({
            'status': 'connected',
            'database': db.name,
            'collection': 'processed_books',
            'document_count': stats.get('count', 0),
            'message': 'MongoDB connection successful'
        })
        
    except Exception as e:
        print(f"MongoDB connection error: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/mongodb/recent-books', methods=['GET'])
def get_recent_mongodb_books():
    try:
        # Get the 10 most recent books
        limit = int(request.args.get('limit', 10))
        
        books = list(processed_books_collection.find()
                    .sort("processed_at", -1)
                    .limit(limit))
        
        # Convert ObjectId to string
        for book in books:
            if '_id' in book:
                book['_id'] = str(book['_id'])
        
        return jsonify({
            'status': 'success',
            'count': len(books),
            'books': books
        })
        
    except Exception as e:
        print(f"Error fetching recent books: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

# Add this to your existing CORS setup
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response
