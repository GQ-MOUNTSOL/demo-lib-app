import { NextResponse } from "next/server"

// Mock test database API - replace with your actual test database connection
export async function GET() {
  try {
    // Replace this with your actual test database connection
    // For example, if you're using PostgreSQL:
    /*
    const { Pool } = require('pg')
    const pool = new Pool({
      user: 'your_username',
      host: 'your_host',
      database: 'your_database',
      password: 'your_password',
      port: 5432,
    })
    
    const result = await pool.query('SELECT * FROM authors')
    const authors = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      nationality: row.nationality,
      era: row.era,
      bio: row.bio,
      source: 'testdb'
    }))
    */

    // For now, returning mock data - replace with your actual database query
    const mockAuthors = [
      {
        id: 1,
        name: "Test Author 1",
        nationality: "American",
        era: "Modern",
        bio: "A test author from the PostgreSQL test database",
        source: "testdb"
      },
      {
        id: 2,
        name: "Test Author 2", 
        nationality: "British",
        era: "Contemporary",
        bio: "Another test author for demonstration purposes",
        source: "testdb"
      },
      {
        id: 3,
        name: "Test Author 3",
        nationality: "Canadian",
        era: "21st Century",
        bio: "Third test author with sample biographical information",
        source: "testdb"
      }
    ]

    return NextResponse.json({
      success: true,
      count: mockAuthors.length,
      authors: mockAuthors,
      note: "This is mock data. Replace with your actual test database connection."
    })

  } catch (error) {
    console.error("Error fetching from test database:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch authors from test database",
        details: error.message
      },
      { status: 500 }
    )
  }
}
