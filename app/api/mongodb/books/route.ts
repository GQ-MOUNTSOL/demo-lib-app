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
    const limit = Number.parseInt(searchParams.get("limit") || "12")
    const search = searchParams.get("search") || ""
    const genreId = searchParams.get("genre_id") || ""
    const authorId = searchParams.get("author_id") || ""
    const sortField = searchParams.get("sort") || "title"
    const sortDirection = searchParams.get("direction") || "asc"

    const skip = (page - 1) * limit

    const client = await connectToDatabase()
    const db = client.db(DB_NAME)
    const collection = db.collection("book")

    // Build query
    const query: any = {}

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { subtitle: { $regex: search, $options: "i" } },
        { summary: { $regex: search, $options: "i" } },
        { "author.name": { $regex: search, $options: "i" } },
        { "genre.name": { $regex: search, $options: "i" } },
      ]
    }

    if (genreId) {
      query["genre.id"] = Number.parseInt(genreId)
    }

    if (authorId) {
      query["author.id"] = Number.parseInt(authorId)
    }

    // Get total count for pagination
    const total = await collection.countDocuments(query)

    // Build sort object
    const sort: Record<string, 1 | -1> = {}
    sort[sortField] = sortDirection === "asc" ? 1 : -1

    // Fetch books with pagination and sorting
    const books = await collection.find(query).sort(sort).skip(skip).limit(limit).toArray()

    // Process books to ensure proper JSON serialization
    const processedBooks = books.map((book) => {
      const processed = { ...book }

      // Convert ObjectId to string
      if (processed._id) {
        processed._id = processed._id.toString()
      }

      return processed
    })

    return NextResponse.json({
      success: true,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
      count: processedBooks.length,
      books: processedBooks,
    })
  } catch (error) {
    console.error("Error fetching books from MongoDB:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch books from MongoDB",
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

    // Insert new book
    const result = await db.collection("book").insertOne({
      title: body.title,
      subtitle: body.subtitle || "",
      summary: body.summary || "",
      author: body.author,
      genre: body.genre,
      image_filename: body.image_filename || "",
      similar_books: body.similar_books || [],
      created_at: new Date(),
      updated_at: new Date(),
    })

    return NextResponse.json({
      success: true,
      message: "Book created successfully",
      id: result.insertedId.toString(),
    })
  } catch (error) {
    console.error("Error creating book:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create book",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
