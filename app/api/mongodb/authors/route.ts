import { type NextRequest, NextResponse } from "next/server"
import { MongoClient } from "mongodb"

const MONGODB_URI =
  "mongodb+srv://gqmountsol:JTcgGkZTHJb8qFLq@demo0.pmagwui.mongodb.net/?retryWrites=true&w=majority&appName=demo0"
const DB_NAME = "test" // Using the test database

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

export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "9")
    const search = searchParams.get("search") || ""
    const sortField = searchParams.get("sort") || "name"
    const sortDirection = searchParams.get("direction") || "asc"

    const skip = (page - 1) * limit

    const client = await connectToDatabase()
    const db = client.db(DB_NAME)
    const collection = db.collection("author")

    // Build query
    let query = {}
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { nationality: { $regex: search, $options: "i" } },
          { era: { $regex: search, $options: "i" } },
          { bio: { $regex: search, $options: "i" } },
        ],
      }
    }

    // Get total count for pagination
    const total = await collection.countDocuments(query)

    // Build sort object
    const sort: Record<string, 1 | -1> = {}
    sort[sortField] = sortDirection === "asc" ? 1 : -1

    // Fetch authors with pagination and sorting
    const authors = await collection.find(query).sort(sort).skip(skip).limit(limit).toArray()

    // Process authors to ensure proper JSON serialization
    const processedAuthors = authors.map((author) => {
      const processed = { ...author }

      // Convert ObjectId to string
      if (processed._id) {
        processed._id = processed._id.toString()
      }

      // Process any nested ObjectIds
      if (processed.books && Array.isArray(processed.books)) {
        processed.books = processed.books.map((book: any) => {
          if (book._id) {
            return { ...book, _id: book._id.toString() }
          }
          return book
        })
      }

      return processed
    })

    return NextResponse.json({
      success: true,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
      count: processedAuthors.length,
      authors: processedAuthors,
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
      nationality: body.nationality || "",
      era: body.era || "",
      bio: body.bio || "",
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
