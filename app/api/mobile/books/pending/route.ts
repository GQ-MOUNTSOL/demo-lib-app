import { type NextRequest, NextResponse } from "next/server"

// In-memory storage for demo purposes
// In production, you'd use a real database
const pendingBooks: any[] = [
  {
    id: "1",
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    requestedBy: "user1@example.com",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    status: "pending",
    deviceInfo: {
      platform: "iOS",
      version: "1.2.0",
    },
  },
  {
    id: "2",
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    requestedBy: "user2@example.com",
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
    status: "pending",
    deviceInfo: {
      platform: "Android",
      version: "1.1.5",
    },
  },
  {
    id: "3",
    title: "1984",
    author: "George Orwell",
    requestedBy: "user3@example.com",
    timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 minutes ago
    status: "pending",
    deviceInfo: {
      platform: "iOS",
      version: "1.2.0",
    },
  },
]

export async function GET() {
  try {
    // Filter only pending books
    const pending = pendingBooks.filter((book) => book.status === "pending")

    return NextResponse.json({
      success: true,
      books: pending,
      count: pending.length,
    })
  } catch (error) {
    console.error("Error fetching pending books:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch pending books" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, author, requestedBy, deviceInfo } = body

    if (!title || !requestedBy) {
      return NextResponse.json({ success: false, error: "Title and requestedBy are required" }, { status: 400 })
    }

    const newBook = {
      id: Date.now().toString(),
      title,
      author: author || null,
      requestedBy,
      timestamp: new Date().toISOString(),
      status: "pending",
      deviceInfo: deviceInfo || null,
    }

    pendingBooks.push(newBook)

    return NextResponse.json({
      success: true,
      book: newBook,
      message: "Book request submitted successfully",
    })
  } catch (error) {
    console.error("Error creating book request:", error)
    return NextResponse.json({ success: false, error: "Failed to create book request" }, { status: 500 })
  }
}
