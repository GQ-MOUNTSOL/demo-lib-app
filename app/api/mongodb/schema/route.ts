import { NextResponse } from "next/server"
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

export async function GET() {
  try {
    const client = await connectToDatabase()
    const db = client.db(DB_NAME)

    // Get all collections
    const collections = await db.listCollections().toArray()

    // Process each collection to get schema information
    const collectionsSchema = await Promise.all(
      collections.map(async (collection) => {
        const collectionName = collection.name
        const count = await db.collection(collectionName).countDocuments()

        // Get sample documents to infer schema
        const sampleSize = Math.min(100, count)
        const sampleDocs = await db.collection(collectionName).find({}).limit(sampleSize).toArray()

        // Analyze fields
        const fieldStats: Record<
          string,
          {
            type: string
            count: number
            sample?: any
          }
        > = {}

        sampleDocs.forEach((doc) => {
          Object.entries(doc).forEach(([key, value]) => {
            if (!fieldStats[key]) {
              fieldStats[key] = {
                type: getType(value),
                count: 1,
                sample: value,
              }
            } else {
              fieldStats[key].count++

              // Only update type if it's different and the current one is not mixed
              if (fieldStats[key].type !== getType(value) && fieldStats[key].type !== "Mixed") {
                fieldStats[key].type = "Mixed"
              }
            }
          })
        })

        // Format fields
        const fields = Object.entries(fieldStats).map(([name, stats]) => {
          let sample = stats.sample

          // Convert ObjectId to string for JSON serialization
          if (stats.type === "ObjectId" && sample) {
            sample = sample.toString()
          }

          // Handle Date objects
          if (stats.type === "Date" && sample) {
            sample = sample.toISOString()
          }

          return {
            name,
            type: stats.type,
            count: stats.count,
            percentage: Math.round((stats.count / sampleSize) * 100),
            sample,
          }
        })

        // Get indexes
        const indexes = await db.collection(collectionName).indexes()
        const formattedIndexes = indexes.map((index) => ({
          name: index.name,
          key: index.key,
          unique: !!index.unique,
        }))

        return {
          name: collectionName,
          count,
          fields,
          indexes: formattedIndexes,
        }
      }),
    )

    return NextResponse.json({
      success: true,
      schema: {
        name: DB_NAME,
        collections: collectionsSchema,
      },
    })
  } catch (error) {
    console.error("Error fetching MongoDB schema:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch MongoDB schema",
        details: error.message,
      },
      { status: 500 },
    )
  }
}

// Helper function to determine the type of a value
function getType(value: any): string {
  if (value === null) return "Null"
  if (value === undefined) return "Undefined"

  if (Array.isArray(value)) return "Array"

  if (value instanceof Date) return "Date"

  // Check for ObjectId (MongoDB specific)
  if (value && typeof value === "object" && value.constructor && value.constructor.name === "ObjectId") {
    return "ObjectId"
  }

  if (typeof value === "object") return "Object"

  // Capitalize first letter of primitive types
  return typeof value.charAt(0).toUpperCase() + typeof value.slice(1)
}
