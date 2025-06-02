import { type NextRequest, NextResponse } from "next/server"
import { MongoClient } from "mongodb"

const MONGODB_URI =
  "mongodb+srv://gqmountsol:JTcgGkZTHJb8qFLq@demo0.pmagwui.mongodb.net/?retryWrites=true&w=majority&appName=demo0"
const DB_NAME = "test"

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
    const searchParams = request.nextUrl.searchParams
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const search = searchParams.get("search") || ""
    const sortField = searchParams.get("sort") || "name"
    const sortDirection = searchParams.get("direction") || "asc"

    const skip = (page - 1) * limit

    const client = await connectToDatabase()
    const db = client.db(DB_NAME)
    const collection = db.collection("genre")

    // Build query
    let query = {}
    if (search) {
      query = {
        $or: [{ name: { $regex: search, $options: "i" } }, { description: { $regex: search, $options: "i" } }],
      }
    }

    // Get total count for pagination
    const total = await collection.countDocuments(query)

    // Build sort object
    const sort: Record<string, 1 | -1> = {}
    sort[sortField] = sortDirection === "asc" ? 1 : -1

    // Fetch genres with pagination and sorting
    const genres = await collection.find(query).sort(sort).skip(skip).limit(limit).toArray()

    // Get book counts for each genre
    const booksCollection = db.collection("book")
    const genresWithCounts = await Promise.all(
      genres.map(async (genre) => {
        const bookCount = await booksCollection.countDocuments({ "genre.name": genre.name })
        return {
          ...genre,
          _id: genre._id.toString(),
          bookCount,
        }
      }),
    )

    return NextResponse.json({
      success: true,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
      count: genresWithCounts.length,
      genres: genresWithCounts,
    })
  } catch (error) {
    console.error("Error fetching genres from MongoDB:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch genres from MongoDB",
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

    // Insert new genre
    const result = await db.collection("genre").insertOne({
      name: body.name,
      description: body.description || "",
      url: body.url || "",
      created_at: new Date(),
      updated_at: new Date(),
    })

    return NextResponse.json({
      success: true,
      message: "Genre created successfully",
      id: result.insertedId.toString(),
    })
  } catch (error) {
    console.error("Error creating genre:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create genre",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
