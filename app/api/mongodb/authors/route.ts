import { type NextRequest, NextResponse } from "next/server"
import { MongoClient } from "mongodb"

const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://gqmountsol:JTcgGkZTHJb8qFLq@demo0.pmagwui.mongodb.net/?retryWrites=true&w=majority&appName=demo0"
const DB_NAME = "test" // Replace with your actual database name

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
    const authors = await db.collection("authors").find({}).toArray()

    // Convert MongoDB _id to string and format the response
    const formattedAuthors = authors.map((author) => ({
      id: author._id.toString(),
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
    const result = await db.collection("authors").insertOne({
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
