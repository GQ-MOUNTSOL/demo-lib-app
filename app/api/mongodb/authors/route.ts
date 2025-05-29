import { type NextRequest, NextResponse } from "next/server"
import { MongoClient } from "mongodb"

const MONGODB_URI =
  "mongodb+srv://gqmountsol:JTcgGkZTHJb8qFLq@demo0.pmagwui.mongodb.net/?retryWrites=true&w=majority&appName=demo0"
const DB_NAME = "test" // Changed from "test" to "bookstore" to match your Flask app

let cachedClient: MongoClient | null = null

async function connectToDatabase() {
  if (cachedClient) {
    return cachedClient
  }

  try {
    const client = new MongoClient(MONGODB_URI)
    await client.connect()
    cachedClient = client
    return client
  } catch (error) {
    console.error("MongoDB connection error:", error)
    throw error
  }
}

export async function GET() {
  try {
    const client = await connectToDatabase()
    const db = client.db(DB_NAME)

    // Fetch authors from the authors collection
    const authors = await db.collection("author").find({}).toArray()

    // Convert MongoDB _id to string and format the response
    const formattedAuthors = authors.map((author) => ({
      id: author._id.toString(),
      _id: author._id.toString(),
      name: author.name,
      nationality: author.nationality,
      era: author.era,
      bio: author.bio,
      created_at: author.created_at,
      updated_at: author.updated_at,

      
    }))

    return NextResponse.json({
      success: true,
      count: formattedAuthors.length,
      authors: formattedAuthors,
    })
  } catch (error) {
    console.error("Error fetching authors from MongoDB:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch authors from MongoDB",
        details: error.message,
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const client = await connectToDatabase()
    const db = client.db(DB_NAME)

    // Insert new author
    const result = await db.collection("author").insertOne({
      name: body.name,
      nationality: body.nationality,
      era: body.era,
      bio: body.bio,
      created_at: new Date(),
      updated_at: new Date(),
    })

    return NextResponse.json({
      success: true,
      message: "Author created successfully",
      id: result.insertedId.toString(),
    })
  } catch (error) {
    console.error("Error creating author:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create author",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
