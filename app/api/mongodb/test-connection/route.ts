import { NextResponse } from "next/server"
import { MongoClient } from "mongodb"

const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://gqmountsol:JTcgGkZTHJb8qFLq@demo0.pmagwui.mongodb.net/?retryWrites=true&w=majority&appName=demo0"
const DB_NAME = "bookstore"

export async function GET() {
  let client: MongoClient | null = null

  try {
    client = new MongoClient(MONGODB_URI)
    await client.connect()

    // Test the connection by pinging the database
    await client.db("admin").command({ ping: 1 })

    const db = client.db(DB_NAME)

    // Get collection stats
    const collections = await db.listCollections().toArray()
    const authorsCollection = collections.find((col) => col.name === "authors")

    let authorCount = 0
    if (authorsCollection) {
      authorCount = await db.collection("authors").countDocuments()
    }

    return NextResponse.json({
      success: true,
      message: "MongoDB connection successful",
      database: DB_NAME,
      collections: collections.map((col) => col.name),
      authorCount: authorCount,
      connectionString: MONGODB_URI.replace(/\/\/.*:.*@/, "//***:***@"), // Hide credentials
    })
  } catch (error) {
    console.error("MongoDB connection test failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: "MongoDB connection failed",
        details: error.message,
        connectionString: MONGODB_URI.replace(/\/\/.*:.*@/, "//***:***@"),
      },
      { status: 500 },
    )
  } finally {
    if (client) {
      await client.close()
    }
  }
}
